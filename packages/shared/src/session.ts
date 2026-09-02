export const SESSION_VERSION = 1 as const;
export const MANIFEST_FILENAME = "manifest.json";
export const VIDEO_FILENAME = "video.webm";
export const BUGGER_EXTENSION = ".bugger";

export interface BuggerSessionMeta {
  url: string;
  title: string;
  startedAt: string;
  durationMs: number;
  userAgent: string;
  /** Milliseconds between session start and first video frame. */
  videoStartOffsetMs?: number;
  /** Actual encoded video length in milliseconds. */
  videoDurationMs?: number;
  /** Tab viewport at recording start (CSS pixels). */
  captureViewportWidth?: number;
  captureViewportHeight?: number;
  captureDevicePixelRatio?: number;
  /** Encoded tab-capture frame size in device pixels. */
  captureVideoWidth?: number;
  captureVideoHeight?: number;
}

export interface NetworkEvent {
  t: number;
  phase: "request" | "response" | "failed";
  requestId: string;
  method?: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  mimeType?: string;
  size?: number;
  requestBody?: string;
  responseBody?: string;
}

export interface ConsoleEvent {
  t: number;
  level: "log" | "warn" | "error" | "info" | "debug";
  args: string[];
  stack?: string;
  source?: string;
}

export interface ClickEvent {
  t: number;
  x: number;
  y: number;
  tag: string;
  selector?: string;
  url: string;
  /** Viewport width in CSS pixels when the click occurred. */
  viewportWidth?: number;
  /** Viewport height in CSS pixels when the click occurred. */
  viewportHeight?: number;
}

export interface BuggerSession {
  version: typeof SESSION_VERSION;
  meta: BuggerSessionMeta;
  network: NetworkEvent[];
  console: ConsoleEvent[];
  clicks: ClickEvent[];
}

export interface LoadedSession {
  session: BuggerSession;
  videoUrl: string;
}

export function createEmptySession(meta: Omit<BuggerSessionMeta, "durationMs">): BuggerSession {
  return {
    version: SESSION_VERSION,
    meta: { ...meta, durationMs: 0 },
    network: [],
    console: [],
    clicks: [],
  };
}

export function getVideoStartOffsetMs(meta: BuggerSessionMeta): number {
  return meta.videoStartOffsetMs ?? 0;
}

export function getVideoDurationMs(meta: BuggerSessionMeta, videoSeconds?: number): number {
  if (meta.videoDurationMs != null && meta.videoDurationMs > 0) {
    return meta.videoDurationMs;
  }
  if (videoSeconds != null && videoSeconds > 0) {
    return videoSeconds * 1000;
  }
  return 0;
}

/** Session timestamp when the last video frame occurs. */
export function getVideoEndSessionTime(meta: BuggerSessionMeta, videoSeconds?: number): number {
  return getVideoStartOffsetMs(meta) + getVideoDurationMs(meta, videoSeconds);
}

/**
 * Infer pre-video offset for older sessions missing `videoStartOffsetMs`.
 * When the first events appear only after a leading gap, that gap matches startup delay.
 */
export function resolveVideoStartOffsetMs(
  meta: BuggerSessionMeta,
  eventTimesMs: number[] = [],
): number {
  const stored = getVideoStartOffsetMs(meta);
  if (stored > 0) return stored;

  const videoDurationMs = getVideoDurationMs(meta);
  if (videoDurationMs <= 0) return 0;

  const gap = meta.durationMs - videoDurationMs;
  if (gap <= 0) return 0;

  const hasEarlyEvents = eventTimesMs.some((t) => t < gap);
  if (hasEarlyEvents) return 0;

  return gap;
}

export function sessionTimeToVideoSeconds(sessionT: number, meta: BuggerSessionMeta): number {
  return Math.max(0, (sessionT - getVideoStartOffsetMs(meta)) / 1000);
}

export function videoSecondsToSessionTime(videoSeconds: number, meta: BuggerSessionMeta): number {
  return videoSeconds * 1000 + getVideoStartOffsetMs(meta);
}

/** Map session time ↔ video using resolved offset (handles legacy sessions). */
export function sessionTimeToVideoSecondsResolved(
  sessionT: number,
  meta: BuggerSessionMeta,
  eventTimesMs: number[] = [],
): number {
  return Math.max(0, (sessionT - resolveVideoStartOffsetMs(meta, eventTimesMs)) / 1000);
}

export function videoSecondsToSessionTimeResolved(
  videoSeconds: number,
  meta: BuggerSessionMeta,
  eventTimesMs: number[] = [],
): number {
  return videoSeconds * 1000 + resolveVideoStartOffsetMs(meta, eventTimesMs);
}

export function getVideoEndSessionTimeResolved(
  meta: BuggerSessionMeta,
  videoSeconds?: number,
  eventTimesMs: number[] = [],
): number {
  return resolveVideoStartOffsetMs(meta, eventTimesMs) + getVideoDurationMs(meta, videoSeconds);
}

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export interface NetworkRequestBundle {
  requestId: string;
  request?: NetworkEvent;
  response?: NetworkEvent;
  failed?: NetworkEvent;
  requestBody?: string;
  responseBody?: string;
}

export function bundleNetworkEvent(event: NetworkEvent, allEvents: NetworkEvent[]): NetworkRequestBundle {
  const related = allEvents.filter((item) => item.requestId === event.requestId);
  const request = related.find((item) => item.phase === "request");
  const response = related.find((item) => item.phase === "response");
  const failed = related.find((item) => item.phase === "failed");

  return {
    requestId: event.requestId,
    request,
    response,
    failed,
    requestBody: request?.requestBody,
    responseBody: response?.responseBody,
  };
}

export function formatBodyForDisplay(body: string | undefined, mimeType?: string): string | null {
  if (!body) return null;

  const looksJson =
    mimeType?.includes("json") ||
    body.trimStart().startsWith("{") ||
    body.trimStart().startsWith("[");

  if (!looksJson) return body;

  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
