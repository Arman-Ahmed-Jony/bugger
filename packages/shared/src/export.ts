import { strToU8, zipSync, unzipSync } from "fflate";
import {
  BUGGER_EXTENSION,
  MANIFEST_FILENAME,
  type BuggerSession,
  VIDEO_FILENAME,
  type LoadedSession,
} from "./session.js";

function u8ToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function u8ToBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([u8ToArrayBuffer(bytes)], { type });
}

export async function packSession(session: BuggerSession, videoBlob: Blob): Promise<Blob> {
  const manifestJson = JSON.stringify(session, null, 2);
  const videoData = new Uint8Array(await videoBlob.arrayBuffer());
  const zipped = zipSync({
    [MANIFEST_FILENAME]: strToU8(manifestJson),
    [VIDEO_FILENAME]: videoData,
  });
  return new Blob([u8ToArrayBuffer(zipped)], { type: "application/zip" });
}

export async function unpackSession(file: Blob | ArrayBuffer): Promise<LoadedSession> {
  const buffer = file instanceof Blob ? await file.arrayBuffer() : file;
  const unzipped = unzipSync(new Uint8Array(buffer));

  const manifestBytes = unzipped[MANIFEST_FILENAME];
  const videoBytes = unzipped[VIDEO_FILENAME];

  if (!manifestBytes) {
    throw new Error(`Missing ${MANIFEST_FILENAME} in session file`);
  }
  if (!videoBytes) {
    throw new Error(`Missing ${VIDEO_FILENAME} in session file`);
  }

  const session = JSON.parse(new TextDecoder().decode(manifestBytes)) as BuggerSession;
  if (!session.clicks) {
    session.clicks = [];
  }
  const videoUrl = URL.createObjectURL(u8ToBlob(videoBytes, "video/webm"));

  return { session, videoUrl };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function defaultSessionFilename(startedAt: string): string {
  const safe = startedAt.replace(/[:.]/g, "-");
  return `session-${safe}${BUGGER_EXTENSION}`;
}
