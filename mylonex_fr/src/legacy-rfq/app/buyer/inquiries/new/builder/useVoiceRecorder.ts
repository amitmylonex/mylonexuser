"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_BYTES, MAX_RECORDING_MS } from "../../../../../src/domains/rfq/voice/schema";

export function useVoiceRecorder(onNew: () => void) {
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startingRef = useRef(false);
  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    clearTimeout(timer.current);
  }
  function cancel() {
    generation.current++;
    stop();
    startingRef.current = false;
    setStarting(false);
    setRecording(false);
  }
  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined" &&
      ["audio/webm", "audio/mp4"].some(type => MediaRecorder.isTypeSupported(type)));
    const lifecycle = generation;
    return () => { lifecycle.current++; stop(); };
  }, []);
  async function start() {
    if (startingRef.current || recorder.current?.state === "recording") return;
    startingRef.current = true;
    setStarting(true);
    setError("");
    const current = ++generation.current;
    try {
      const mimeType = ["audio/webm", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType || !navigator.mediaDevices?.getUserMedia) throw new Error("Recording is unavailable. Type your requirement below.");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation.current !== current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const next = new MediaRecorder(media, { mimeType });
      recorder.current = next;
      const chunks: Blob[] = [];
      let size = 0;
      let failed = false;
      const began = Date.now();
      next.ondataavailable = event => {
        if (generation.current !== current || failed) return;
        size += event.data.size;
        if (size > MAX_AUDIO_BYTES) { failed = true; setError("Recording exceeds 10 MB. Record a shorter requirement or type it below."); stop(); return; }
        if (event.data.size) chunks.push(event.data);
      };
      next.onerror = () => { failed = true; setError("Recording failed. Retry or type your requirement below."); stop(); };
      next.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        clearTimeout(timer.current);
        if (generation.current !== current) return;
        setRecording(false);
        if (failed) return;
        if (size <= 100 || Date.now() - began < 1000) { setError("No usable recording. Speak for at least one second, or type below."); return; }
        setAudio(new Blob(chunks, { type: mimeType }));
      };
      next.start(1000);
      setAudio(null);
      onNew();
      setRecording(true);
      timer.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch (caught) {
      stream.current?.getTracks().forEach(track => track.stop());
      if (generation.current === current) setError(caught instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(caught.name)
        ? "Microphone permission was denied. Allow microphone access in your browser or type your requirement below."
        : "Could not start the microphone. Check your device, use HTTPS/localhost, or type your requirement below.");
    } finally {
      if (generation.current === current) { startingRef.current = false; setStarting(false); }
    }
  }
  return { recording, starting, audio, error, supported, start, stop, cancel,
    clear: () => { cancel(); setAudio(null); setError(""); }, clearError: () => setError("") };
}
