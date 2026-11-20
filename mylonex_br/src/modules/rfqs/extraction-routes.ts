import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { BuyerAccessError } from '../auth/access-error.js';
import { textInputSchema } from './legacy/src/domains/rfq/text/grouping.js';
import { extractBuyerRequirements } from './legacy/src/domains/rfq/text/service.js';
import { extractInquiryImage } from './legacy/src/domains/rfq/image/service.js';
import { ImageImportError } from './legacy/src/domains/rfq/image/errors.js';
import { imageUploadSchema, validateImage } from './legacy/src/domains/rfq/image/validate-image.js';
import { MAX_IMAGE_BYTES } from './legacy/src/domains/rfq/image/limits.js';
import { MAX_AUDIO_BYTES, VoiceError, voiceTextSchema, voiceUploadSchema } from './legacy/src/domains/rfq/voice/schema.js';
import { extractVoiceTranscript, transcribeAudio } from './legacy/src/domains/rfq/voice/service.js';

const imageForm = z.object({ image: z.instanceof(File), consent: z.literal('openai-image-extraction'), mode: z.literal('transcribe').optional() }).strict();
type SessionVerifier = ReturnType<typeof createSessionVerifier>;

export function registerExtractionRoutes(api: FastifyInstance, session: SessionVerifier, origin: string) {
  const requests = new Map<string, { count: number; expires: number }>();
  api.addContentTypeParser('multipart/form-data', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));
  function guard(req: FastifyRequest, key: string, limit: number) {
    return async () => {
      if (req.headers.origin && req.headers.origin !== origin) throw new BuyerAccessError(403, 'Cross-origin processing is not allowed.');
      const result = await session.applicationUser(req.headers.authorization);
      const user = result.account;
      if (user?.role !== 'BUYER') throw new BuyerAccessError(403, 'Buyer access is required.');
      const now = Date.now();
      for (const [id, record] of requests) if (record.expires <= now) requests.delete(id);
      const recordKey = key + ':' + user.id;
      const record = requests.get(recordKey) ?? { count: 0, expires: now + 900000 };
      if (record.count >= limit) throw new BuyerAccessError(429, 'Too many requests. Wait 15 minutes or fill the form manually.');
      record.count++;
      requests.set(recordKey, record);
      return result;
    };
  }
  async function multipart(req: FastifyRequest) {
    if (!Buffer.isBuffer(req.body)) throw new BuyerAccessError(400, 'Send a multipart upload.');
    try {
      return await new Response(new Uint8Array(req.body), { headers: { 'content-type': req.headers['content-type']! } }).formData();
    } catch {
      throw new BuyerAccessError(400, 'The upload could not be read.');
    }
  }
  function parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) throw new BuyerAccessError(400, result.error.issues.map(issue => issue.message).join('; '));
    return result.data;
  }
  api.post('/buyer/inquiries/extract-text', { bodyLimit: 150000 }, async req => {
    await guard(req, 'text', 10)();
    const { text, useAI } = parse(textInputSchema, req.body);
    return { ok: true, data: await extractBuyerRequirements(text, useAI, AbortSignal.timeout(40000)) };
  });
  api.get('/locations', async req => {
    const { db } = await guard(req, 'locations', 200)();
    const query = parse(z.object({
      kind: z.enum(['states', 'cities']), country: z.literal('India'), state: z.string().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(2000).default(1000),
    }), req.query);
    const items = query.kind === 'states' ? (await db.indiaCityState.findMany({
      where: { country: query.country }, distinct: ['state'], select: { state: true },
      orderBy: { state: 'asc' }, take: query.limit,
    })).map(row => row.state) : (await db.indiaCityState.findMany({
      where: { country: query.country, state: { equals: query.state ?? '', mode: 'insensitive' } },
      distinct: ['city'], select: { city: true }, orderBy: { city: 'asc' }, take: query.limit,
    })).map(row => row.city);
    return { ok: true, data: { items } };
  });
  api.post('/buyer/inquiries/extract-image', { bodyLimit: MAX_IMAGE_BYTES + 65536 }, async req => {
    await guard(req, 'image', 5)();
    try {
      const form = await multipart(req);
      if ([...form.keys()].length !== new Set(form.keys()).size) throw new BuyerAccessError(400, 'Provide one image.');
      const { image, mode } = parse(imageForm, Object.fromEntries(form));
      const upload = parse(imageUploadSchema, { type: image.type, bytes: new Uint8Array(await image.arrayBuffer()) });
      return { ok: true, data: await extractInquiryImage(upload, AbortSignal.timeout(60000), mode) };
    } catch (error) {
      if (error instanceof ImageImportError) throw new BuyerAccessError(error.status, error.message);
      throw error;
    }
  });
  api.post('/buyer/inquiries/voice', { bodyLimit: MAX_AUDIO_BYTES + 65536 }, async req => {
    await guard(req, 'voice', 10)();
    try {
      const signal = AbortSignal.timeout(60000);
      if (!Buffer.isBuffer(req.body)) {
        if (Number(req.headers['content-length']) > 100000) throw new BuyerAccessError(413, 'Transcript is too large.');
        const { transcript } = parse(voiceTextSchema, req.body);
        return { ok: true, data: await extractVoiceTranscript(transcript, signal) };
      }
      const form = await multipart(req);
      if ([...form.keys()].length !== new Set(form.keys()).size) throw new BuyerAccessError(400, 'Provide one recording.');
      const { audio } = parse(voiceUploadSchema, Object.fromEntries(form));
      return { ok: true, data: await transcribeAudio(audio, signal) };
    } catch (error) {
      if (error instanceof VoiceError) throw new BuyerAccessError(error.status, error.message);
      throw error;
    }
  });
  api.post('/buyer/inquiries/upload', { bodyLimit: 5 * MAX_IMAGE_BYTES + 65536 }, async req => {
    const { user } = await guard(req, 'upload', 10)();
    const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET;
    if (!bucket) throw new BuyerAccessError(503, 'Reference photo storage is not configured.');
    const files = (await multipart(req)).getAll('files');
    if (!files.length || files.length > 5 || files.some(file => !(file instanceof File))) {
      throw new BuyerAccessError(400, 'Choose up to five reference photos.');
    }
    const prepared = [];
    for (const file of files as File[]) {
      const upload = parse(imageUploadSchema, { type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
      try { await validateImage(upload); }
      catch (error) {
        if (error instanceof ImageImportError) throw new BuyerAccessError(error.status, error.message);
        throw error;
      }
      prepared.push(upload);
    }
    const storage = session.configured().admin.storage.from(bucket);
    const paths: string[] = [];
    try {
      for (const upload of prepared) {
        const path = `rfq/${user.id}/${crypto.randomUUID()}.${upload.type.split('/')[1]}`;
        const result = await storage.upload(path, upload.bytes, { contentType: upload.type, upsert: false });
        if (result.error) throw new BuyerAccessError(503, 'The photo upload could not be completed.');
        paths.push(path);
      }
    } catch (error) {
      if (paths.length) await storage.remove(paths);
      throw error;
    }
    return { ok: true, data: { urls: paths.map(path => storage.getPublicUrl(path).data.publicUrl) } };
  });
}
