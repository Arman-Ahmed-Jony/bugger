import type { OffscreenMessage, OffscreenResponse } from "../types.js";

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
}

async function getVideoDurationMs(blob: Blob): Promise<number> {
  const url = URL.createObjectURL(blob);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to read video duration"));
    });
    return video.duration * 1000;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function startCapture(streamId: string, sessionStartMs: number): Promise<number> {
  recordedChunks = [];

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  } as MediaStreamConstraints);

  const mimeType = pickMimeType();
  mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.start(250);
  return Date.now() - sessionStartMs;
}

async function stopCapture(): Promise<{ videoBase64: string; videoDurationMs: number }> {
  if (!mediaRecorder) {
    throw new Error("No active recording");
  }

  const recorder = mediaRecorder;
  mediaRecorder = null;

  await new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error("MediaRecorder failed"));
    recorder.stop();
  });

  recorder.stream.getTracks().forEach((track) => track.stop());

  const blob = new Blob(recordedChunks, { type: recorder.mimeType });
  recordedChunks = [];

  const [videoDurationMs, buffer] = await Promise.all([
    getVideoDurationMs(blob),
    blob.arrayBuffer(),
  ]);

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return { videoBase64: btoa(binary), videoDurationMs };
}

chrome.runtime.onMessage.addListener(
  (message: OffscreenMessage, _sender, sendResponse: (response: OffscreenResponse) => void) => {
    (async () => {
      try {
        if (message.type === "START_CAPTURE") {
          const videoStartOffsetMs = await startCapture(message.streamId, message.sessionStartMs);
          sendResponse({ ok: true, videoStartOffsetMs });
          return;
        }

        if (message.type === "STOP_CAPTURE") {
          const { videoBase64, videoDurationMs } = await stopCapture();
          sendResponse({ ok: true, videoBase64, videoDurationMs });
          return;
        }

        sendResponse({ ok: false, error: "Unknown message type" });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Capture failed",
        });
      }
    })();

    return true;
  },
);
