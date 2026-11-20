import { z } from "zod";

export const whatsAppInboundMessageSchema = z.object({
    id: z.string().min(1), from: z.string().min(1), type: z.string(),
    context: z.object({ id: z.string() }).optional(),
    text: z.object({ body: z.string() }).optional(),
    button: z.object({ text: z.string().optional(), payload: z.string().optional() }).optional(),
    interactive: z.object({
        type: z.string().optional(),
        button_reply: z.object({ title: z.string().optional(), id: z.string().optional() }).optional(),
        nfm_reply: z.object({ response_json: z.union([z.string(), z.record(z.string(), z.unknown())]),
            flow_token: z.string().nullable().optional() }).optional(),
    }).optional(),
});
export type WhatsAppInboundMessage = z.infer<typeof whatsAppInboundMessageSchema>;

export const whatsAppWebhookSchema = z.object({
    object: z.literal("whatsapp_business_account").optional(),
    entry: z.array(z.object({
        id: z.string().optional(),
        changes: z.array(z.object({
            field: z.string().optional(),
            value: z.object({
                messaging_product: z.literal("whatsapp").optional(),
                metadata: z.object({ phone_number_id: z.string().optional(),
                    display_phone_number: z.string().optional() }).optional(),
                messages: z.array(whatsAppInboundMessageSchema).optional(),
                statuses: z.array(z.object({
                    id: z.string().min(1), status: z.string(), timestamp: z.string().regex(/^\d+$/),
                    recipient_id: z.string().optional(),
                    errors: z.array(z.object({ code: z.number().optional(), title: z.string().optional(),
                        message: z.string().optional(),
                        error_data: z.object({ details: z.string().optional() }).optional(),
                    })).optional(),
                })).optional(),
            }).optional(),
        })).optional(),
    })).optional(),
});
