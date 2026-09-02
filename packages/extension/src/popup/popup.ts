import { defaultSessionFilename, formatTimestamp, packSession } from "@bugger/shared";
import type { BackgroundMessage, BackgroundResponse, RecordingState } from "../types.js";

const statusEl = document.getElementById("status")!;
const metaEl = document.getElementById("meta")!;
const durationEl = document.getElementById("duration")!;
const networkCountEl = document.getElementById("network-count")!;
const consoleCountEl = document.getElementById("console-count")!;
const errorEl = document.getElementById("error")!;
const recordBtn = document.getElementById("record-btn") as HTMLButtonElement;
const stopBtn = document.getElementById("stop-btn") as HTMLButtonElement;
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;

async function sendMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(message);
}

async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({
      url,
      filename,
      saveAs: true,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function exportSessionFile(): Promise<void> {
  const response = await sendMessage({ type: "GET_EXPORT_DATA" });
  if (!response.ok) {
    throw new Error(response.error);
  }
  if (!response.exportData) {
    throw new Error("No session data returned");
  }

  const { session, videoBase64 } = response.exportData;
  const binary = atob(videoBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const videoBlob = new Blob([bytes], { type: "video/webm" });
  const blob = await packSession(session, videoBlob);
  const filename = defaultSessionFilename(session.meta.startedAt);
  await downloadBlob(blob, filename);
}

function render(state: RecordingState, error?: string): void {
  statusEl.textContent =
    state.status === "recording"
      ? "Recording..."
      : state.status === "stopped"
        ? "Stopped"
        : "Idle";
  statusEl.className = `status ${state.status}`;

  if (state.url) {
    metaEl.textContent = state.title ? `${state.title} — ${state.url}` : state.url;
    metaEl.classList.remove("hidden");
  } else {
    metaEl.classList.add("hidden");
  }

  durationEl.textContent = formatTimestamp(state.durationMs);
  networkCountEl.textContent = String(state.networkCount);
  consoleCountEl.textContent = String(state.consoleCount);

  recordBtn.classList.toggle("hidden", state.status === "recording");
  stopBtn.classList.toggle("hidden", state.status !== "recording");
  exportBtn.classList.toggle("hidden", state.status !== "stopped");
  clearBtn.classList.toggle("hidden", state.status === "recording");

  const displayError = error ?? state.error;
  if (displayError) {
    errorEl.textContent = displayError;
    errorEl.classList.remove("hidden");
  } else {
    errorEl.classList.add("hidden");
  }
}

async function refreshState(): Promise<void> {
  const response = await sendMessage({ type: "GET_STATE" });
  if (response.ok) {
    render(response.state);
  }
}

recordBtn.addEventListener("click", async () => {
  recordBtn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      render(
        { status: "idle", networkCount: 0, consoleCount: 0, durationMs: 0 },
        "No active tab found",
      );
      return;
    }

    const response = await sendMessage({ type: "START_RECORDING", tabId: tab.id });
    if (!response.ok) {
      render(
        { status: "idle", networkCount: 0, consoleCount: 0, durationMs: 0 },
        response.error,
      );
      return;
    }
    render(response.state);
  } finally {
    recordBtn.disabled = false;
  }
});

stopBtn.addEventListener("click", async () => {
  stopBtn.disabled = true;
  try {
    const response = await sendMessage({ type: "STOP_RECORDING" });
    if (!response.ok) {
      render(
        { status: "idle", networkCount: 0, consoleCount: 0, durationMs: 0 },
        response.error,
      );
      return;
    }
    render(response.state);
  } finally {
    stopBtn.disabled = false;
  }
});

exportBtn.addEventListener("click", async () => {
  exportBtn.disabled = true;
  try {
    await exportSessionFile();
    const response = await sendMessage({ type: "GET_STATE" });
    if (response.ok) {
      render(response.state);
    }
  } catch (error) {
    const stateResponse = await sendMessage({ type: "GET_STATE" });
    if (stateResponse.ok) {
      render(
        stateResponse.state,
        error instanceof Error ? error.message : "Export failed",
      );
    }
  } finally {
    exportBtn.disabled = false;
  }
});

clearBtn.addEventListener("click", async () => {
  const response = await sendMessage({ type: "CLEAR_SESSION" });
  if (response.ok) {
    render(response.state);
  }
});

void refreshState();
setInterval(() => {
  void refreshState();
}, 500);
