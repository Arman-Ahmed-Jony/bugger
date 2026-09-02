import type { ConsoleEvent, NetworkEvent } from "@bugger/shared";

export type RecordingStatus = "idle" | "recording" | "stopped";

export interface RecordingState {
  status: RecordingStatus;
  tabId?: number;
  sessionStartMs?: number;
  startedAt?: string;
  url?: string;
  title?: string;
  networkCount: number;
  consoleCount: number;
  durationMs: number;
  error?: string;
}

export interface StoredSession {
  session: import("@bugger/shared").BuggerSession;
  videoBase64: string;
}

export type BackgroundMessage =
  | { type: "GET_STATE" }
  | { type: "START_RECORDING"; tabId: number }
  | { type: "STOP_RECORDING" }
  | { type: "GET_EXPORT_DATA" }
  | { type: "CLEAR_SESSION" };

export type BackgroundResponse =
  | { ok: true; state: RecordingState; exportData?: StoredSession }
  | { ok: false; error: string };

export type OffscreenMessage =
  | { type: "START_CAPTURE"; streamId: string; sessionStartMs: number }
  | { type: "STOP_CAPTURE" };

export type OffscreenResponse =
  | { ok: true; videoBase64?: string; videoStartOffsetMs?: number; videoDurationMs?: number }
  | { ok: false; error: string };

export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen/offscreen.html";

export const DEFAULT_STATE: RecordingState = {
  status: "idle",
  networkCount: 0,
  consoleCount: 0,
  durationMs: 0,
};

export type { ConsoleEvent, NetworkEvent };
