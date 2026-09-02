import type { BuggerSession, ClickEvent, ConsoleEvent, NetworkEvent } from "@bugger/shared";
import { createEmptySession } from "@bugger/shared";
import { CdpRecorder } from "../recorder/cdp.js";
import {
  DEFAULT_STATE,
  OFFSCREEN_DOCUMENT_PATH,
  type BackgroundMessage,
  type BackgroundResponse,
  type OffscreenResponse,
  type RecordingState,
  type StoredSession,
} from "../types.js";

let state: RecordingState = { ...DEFAULT_STATE };
let cdpRecorder: CdpRecorder | null = null;
let networkEvents: NetworkEvent[] = [];
let consoleEvents: ConsoleEvent[] = [];
let clickEvents: ClickEvent[] = [];
let durationTimer: ReturnType<typeof setInterval> | null = null;
let storedSession: StoredSession | null = null;
let videoStartOffsetMs = 0;
let captureViewport = { width: 0, height: 0, devicePixelRatio: 1 };
let captureVideoSize = { width: 0, height: 0 };

async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Record tab video for bug reproduction sessions.",
  });
}

async function closeOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

function updateBadge(): void {
  if (state.status === "recording") {
    void chrome.action.setBadgeText({ text: "REC" });
    void chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  } else {
    void chrome.action.setBadgeText({ text: "" });
  }
}

function startDurationTimer(): void {
  stopDurationTimer();
  durationTimer = setInterval(() => {
    if (state.sessionStartMs) {
      state = {
        ...state,
        durationMs: Date.now() - state.sessionStartMs,
      };
    }
  }, 250);
}

function stopDurationTimer(): void {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
}

function patchNetworkEvent(
  requestId: string,
  phase: NetworkEvent["phase"],
  patch: Partial<NetworkEvent>,
): void {
  for (let i = networkEvents.length - 1; i >= 0; i -= 1) {
    const event = networkEvents[i];
    if (event?.requestId === requestId && event.phase === phase) {
      networkEvents[i] = { ...event, ...patch };
      return;
    }
  }
}

async function startRecording(tabId: number): Promise<void> {
  if (state.status === "recording") {
    throw new Error("Already recording");
  }

  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
    throw new Error("Cannot record Chrome internal pages");
  }

  const sessionStartMs = Date.now();
  const startedAt = new Date(sessionStartMs).toISOString();

  networkEvents = [];
  consoleEvents = [];
  clickEvents = [];
  storedSession = null;
  videoStartOffsetMs = 0;
  captureViewport = { width: 0, height: 0, devicePixelRatio: 1 };
  captureVideoSize = { width: 0, height: 0 };

  state = {
    status: "recording",
    tabId,
    sessionStartMs,
    startedAt,
    url: tab.url,
    title: tab.title ?? tab.url,
    networkCount: 0,
    consoleCount: 0,
    clickCount: 0,
    durationMs: 0,
  };

  cdpRecorder = new CdpRecorder(
    tabId,
    sessionStartMs,
    (event) => {
      networkEvents.push(event);
      state = { ...state, networkCount: networkEvents.length };
    },
    (requestId, phase, patch) => {
      patchNetworkEvent(requestId, phase, patch);
    },
    (event) => {
      consoleEvents.push(event);
      state = { ...state, consoleCount: consoleEvents.length };
    },
    (event) => {
      clickEvents.push(event);
      state = { ...state, clickCount: clickEvents.length };
    },
  );

  await cdpRecorder.attach();
  captureViewport = await cdpRecorder.captureViewport();
  await ensureOffscreenDocument();

  const streamId = await getMediaStreamId({ targetTabId: tabId });
  const offscreenStart = await sendToOffscreen({
    type: "START_CAPTURE",
    streamId,
    sessionStartMs,
  });
  if (!offscreenStart.ok) {
    throw new Error(offscreenStart.error ?? "Failed to start video capture");
  }
  videoStartOffsetMs = offscreenStart.videoStartOffsetMs ?? 0;
  captureVideoSize = {
    width: offscreenStart.captureVideoWidth ?? 0,
    height: offscreenStart.captureVideoHeight ?? 0,
  };

  startDurationTimer();
  updateBadge();
}

function getMediaStreamId(options: chrome.tabCapture.GetMediaStreamOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId(options, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(streamId);
    });
  });
}

async function sendToOffscreen(message: import("../types.js").OffscreenMessage): Promise<OffscreenResponse> {
  return chrome.runtime.sendMessage(message) as Promise<OffscreenResponse>;
}

async function stopRecording(): Promise<void> {
  if (state.status !== "recording" || !state.sessionStartMs) {
    throw new Error("No active recording");
  }

  stopDurationTimer();

  const durationMs = Date.now() - state.sessionStartMs;
  state = { ...state, status: "stopped", durationMs };

  if (cdpRecorder) {
    await cdpRecorder.detach();
    cdpRecorder = null;
  }

  const offscreenStop = await sendToOffscreen({ type: "STOP_CAPTURE" });
  if (!offscreenStop.ok) {
    throw new Error(offscreenStop.error ?? "Failed to stop video capture");
  }
  if (!offscreenStop.videoBase64) {
    throw new Error("Failed to stop video capture");
  }

  await closeOffscreenDocument();

  const session: BuggerSession = {
    ...createEmptySession({
      url: state.url ?? "",
      title: state.title ?? "",
      startedAt: state.startedAt ?? new Date().toISOString(),
      userAgent: navigator.userAgent,
    }),
    meta: {
      url: state.url ?? "",
      title: state.title ?? "",
      startedAt: state.startedAt ?? new Date().toISOString(),
      durationMs,
      userAgent: navigator.userAgent,
      videoStartOffsetMs,
      videoDurationMs: offscreenStop.videoDurationMs,
      captureViewportWidth: captureViewport.width || undefined,
      captureViewportHeight: captureViewport.height || undefined,
      captureDevicePixelRatio: captureViewport.devicePixelRatio || undefined,
      captureVideoWidth: captureVideoSize.width || undefined,
      captureVideoHeight: captureVideoSize.height || undefined,
    },
    network: networkEvents,
    console: consoleEvents,
    clicks: clickEvents,
  };

  storedSession = {
    session,
    videoBase64: offscreenStop.videoBase64,
  };

  updateBadge();
}

function getExportData(): StoredSession {
  if (!storedSession) {
    throw new Error("No session to export. Record and stop first.");
  }
  return storedSession;
}

function clearSession(): void {
  networkEvents = [];
  consoleEvents = [];
  clickEvents = [];
  storedSession = null;
  videoStartOffsetMs = 0;
  captureViewport = { width: 0, height: 0, devicePixelRatio: 1 };
  captureVideoSize = { width: 0, height: 0 };
  state = { ...DEFAULT_STATE };
  updateBadge();
}

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage | import("../types.js").OffscreenMessage, _sender, sendResponse) => {
    if (message.type === "START_CAPTURE" || message.type === "STOP_CAPTURE") {
      return false;
    }

    (async () => {
      try {
        switch (message.type) {
          case "GET_STATE":
            sendResponse({ ok: true, state });
            return;
          case "START_RECORDING":
            await startRecording(message.tabId);
            sendResponse({ ok: true, state });
            return;
          case "STOP_RECORDING":
            await stopRecording();
            sendResponse({ ok: true, state });
            return;
          case "GET_EXPORT_DATA": {
            const exportData = getExportData();
            sendResponse({ ok: true, state, exportData });
            return;
          }
          case "CLEAR_SESSION":
            clearSession();
            sendResponse({ ok: true, state });
            return;
          default:
            sendResponse({ ok: false, error: "Unknown message type" });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unexpected error";
        state = { ...state, error: errorMessage, status: state.status === "recording" ? "idle" : state.status };
        if (cdpRecorder) {
          await cdpRecorder.detach().catch(() => undefined);
          cdpRecorder = null;
        }
        stopDurationTimer();
        updateBadge();
        sendResponse({ ok: false, error: errorMessage });
      }
    })();

    return true;
  },
);

updateBadge();
