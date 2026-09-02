import type { ConsoleEvent, NetworkEvent } from "@bugger/shared";

type HeaderEntry = { name: string; value?: string };

function normalizeHeaders(headers: HeaderEntry[] | Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (Array.isArray(headers)) {
    if (!headers.length) return undefined;
    return Object.fromEntries(headers.map((h) => [h.name, h.value ?? ""]));
  }
  return headers;
}

function serializeRemoteObject(obj: Runtime.RemoteObject | undefined): string {
  if (!obj) return "undefined";
  if (obj.unserializableValue !== undefined) return String(obj.unserializableValue);
  if (obj.value !== undefined) {
    if (typeof obj.value === "object") {
      try {
        return JSON.stringify(obj.value);
      } catch {
        return String(obj.value);
      }
    }
    return String(obj.value);
  }
  if (obj.description) return obj.description;
  return obj.type ?? "unknown";
}

export class CdpRecorder {
  private tabId: number;
  private sessionStartMs: number;
  private onNetwork: (event: NetworkEvent) => void;
  private onConsole: (event: ConsoleEvent) => void;
  private attached = false;

  constructor(
    tabId: number,
    sessionStartMs: number,
    onNetwork: (event: NetworkEvent) => void,
    onConsole: (event: ConsoleEvent) => void,
  ) {
    this.tabId = tabId;
    this.sessionStartMs = sessionStartMs;
    this.onNetwork = onNetwork;
    this.onConsole = onConsole;
  }

  private timestamp(): number {
    return Date.now() - this.sessionStartMs;
  }

  async attach(): Promise<void> {
    const debuggee = { tabId: this.tabId };
    await chrome.debugger.attach(debuggee, "1.3");
    this.attached = true;
    await chrome.debugger.sendCommand(debuggee, "Network.enable");
    await chrome.debugger.sendCommand(debuggee, "Runtime.enable");
    chrome.debugger.onEvent.addListener(this.handleEvent);
  }

  async detach(): Promise<void> {
    if (!this.attached) return;
    chrome.debugger.onEvent.removeListener(this.handleEvent);
    try {
      await chrome.debugger.detach({ tabId: this.tabId });
    } catch {
      // Tab may already be closed.
    }
    this.attached = false;
  }

  private handleEvent = (
    source: chrome.debugger.Debuggee,
    method: string,
    params?: object,
  ): void => {
    if (source.tabId !== this.tabId || !params) return;

    switch (method) {
      case "Network.requestWillBeSent":
        this.handleRequestWillBeSent(params as Network.RequestWillBeSentEvent);
        break;
      case "Network.responseReceived":
        this.handleResponseReceived(params as Network.ResponseReceivedEvent);
        break;
      case "Network.loadingFailed":
        this.handleLoadingFailed(params as Network.LoadingFailedEvent);
        break;
      case "Runtime.consoleAPICalled":
        this.handleConsoleCalled(params as Runtime.ConsoleAPICalledEvent);
        break;
      case "Runtime.exceptionThrown":
        this.handleExceptionThrown(params as Runtime.ExceptionThrownEvent);
        break;
    }
  };

  private handleRequestWillBeSent(params: Network.RequestWillBeSentEvent): void {
    const { requestId, request } = params;
    this.onNetwork({
      t: this.timestamp(),
      phase: "request",
      requestId,
      method: request.method,
      url: request.url,
      requestHeaders: normalizeHeaders(request.headers),
    });
  }

  private handleResponseReceived(params: Network.ResponseReceivedEvent): void {
    const { requestId, response } = params;
    this.onNetwork({
      t: this.timestamp(),
      phase: "response",
      requestId,
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      responseHeaders: normalizeHeaders(response.headers),
      mimeType: response.mimeType,
    });
  }

  private handleLoadingFailed(params: Network.LoadingFailedEvent): void {
    this.onNetwork({
      t: this.timestamp(),
      phase: "failed",
      requestId: params.requestId,
      url: params.documentURL ?? "unknown",
      statusText: params.errorText,
    });
  }

  private handleConsoleCalled(params: Runtime.ConsoleAPICalledEvent): void {
    const levelMap: Record<string, ConsoleEvent["level"]> = {
      log: "log",
      warning: "warn",
      error: "error",
      info: "info",
      debug: "debug",
    };

    const args = params.args?.map(serializeRemoteObject) ?? [];
    const stack = params.stackTrace?.callFrames
      ?.map((frame) => `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`)
      .join("\n");

    this.onConsole({
      t: this.timestamp(),
      level: levelMap[params.type] ?? "log",
      args,
      stack,
      source: params.stackTrace?.callFrames?.[0]?.url,
    });
  }

  private handleExceptionThrown(params: Runtime.ExceptionThrownEvent): void {
    const details = params.exceptionDetails;
    const description =
      details.exception?.description ??
      details.text ??
      "Uncaught exception";

    this.onConsole({
      t: this.timestamp(),
      level: "error",
      args: [description],
      stack: details.stackTrace?.callFrames
        ?.map((frame) => `${frame.functionName} @ ${frame.url}:${frame.lineNumber}`)
        .join("\n"),
      source: details.url,
    });
  }
}

// Minimal CDP type namespaces for Chrome extension APIs.
namespace Network {
  export interface Request {
    method: string;
    url: string;
    headers?: Record<string, string>;
  }

  export interface Response {
    url: string;
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    mimeType?: string;
  }

  export interface RequestWillBeSentEvent {
    requestId: string;
    request: Request;
  }

  export interface ResponseReceivedEvent {
    requestId: string;
    response: Response;
  }

  export interface LoadingFailedEvent {
    requestId: string;
    errorText: string;
    documentURL?: string;
  }
}

namespace Runtime {
  export interface RemoteObject {
    type?: string;
    value?: unknown;
    unserializableValue?: string;
    description?: string;
  }

  export interface StackTrace {
    callFrames?: Array<{
      functionName: string;
      url: string;
      lineNumber: number;
      columnNumber: number;
    }>;
  }

  export interface ConsoleAPICalledEvent {
    type: string;
    args?: RemoteObject[];
    stackTrace?: StackTrace;
  }

  export interface ExceptionThrownEvent {
    exceptionDetails: {
      text?: string;
      url?: string;
      exception?: { description?: string };
      stackTrace?: StackTrace;
    };
  }
}
