import type { NetworkEvent } from "@bugger/shared";

export type NetworkResourceType =
  | "all"
  | "fetch"
  | "document"
  | "css"
  | "js"
  | "font"
  | "image"
  | "media"
  | "websocket"
  | "wasm"
  | "other";

export type NetworkSortField = "time" | "method" | "status" | "type" | "url" | "size";
export type SortDirection = "asc" | "desc";

export interface NetworkRow {
  requestId: string;
  t: number;
  method?: string;
  url: string;
  status?: number;
  statusText?: string;
  mimeType?: string;
  size?: number;
  type: NetworkResourceType;
  phase: NetworkEvent["phase"];
  primaryEvent: NetworkEvent;
  hasError: boolean;
}

const TYPE_LABELS: Record<NetworkResourceType, string> = {
  all: "All",
  fetch: "Fetch/XHR",
  document: "Doc",
  css: "CSS",
  js: "JS",
  font: "Font",
  image: "Img",
  media: "Media",
  websocket: "WS",
  wasm: "Wasm",
  other: "Other",
};

export const NETWORK_TYPE_FILTERS: NetworkResourceType[] = [
  "all",
  "fetch",
  "document",
  "css",
  "js",
  "font",
  "image",
  "media",
  "websocket",
  "wasm",
  "other",
];

export function getNetworkTypeLabel(type: NetworkResourceType): string {
  return TYPE_LABELS[type];
}

export function inferNetworkType(event: NetworkEvent, method?: string): Exclude<NetworkResourceType, "all"> {
  const url = event.url.toLowerCase();
  const mime = (event.mimeType ?? "").toLowerCase();

  if (url.startsWith("ws://") || url.startsWith("wss://")) return "websocket";
  if (mime.includes("text/html")) return "document";
  if (mime.includes("text/css") || url.endsWith(".css")) return "css";
  if (
    mime.includes("javascript") ||
    mime.includes("ecmascript") ||
    url.endsWith(".js") ||
    url.endsWith(".mjs")
  ) {
    return "js";
  }
  if (mime.includes("font") || url.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) return "font";
  if (mime.includes("image/") || url.match(/\.(png|jpe?g|gif|webp|svg|ico|avif)(\?|$)/)) return "image";
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return "media";
  if (mime.includes("wasm") || url.endsWith(".wasm")) return "wasm";

  const httpMethod = (method ?? event.method ?? "GET").toUpperCase();
  if (
    mime.includes("json") ||
    mime.includes("xml") ||
    httpMethod !== "GET" ||
    url.includes("/api/") ||
    url.includes("/graphql")
  ) {
    return "fetch";
  }

  return "other";
}

export function consolidateNetworkEvents(events: NetworkEvent[]): NetworkRow[] {
  const grouped = new Map<string, NetworkEvent[]>();

  for (const event of events) {
    const list = grouped.get(event.requestId) ?? [];
    list.push(event);
    grouped.set(event.requestId, list);
  }

  return Array.from(grouped.entries()).map(([requestId, related]) => {
    const request = related.find((event) => event.phase === "request");
    const response = related.find((event) => event.phase === "response");
    const failed = related.find((event) => event.phase === "failed");
    const primaryEvent = response ?? failed ?? request ?? related[0]!;
    const method = request?.method ?? primaryEvent.method;
    const url = request?.url ?? primaryEvent.url;
    const status = response?.status;
    const hasError = failed !== undefined || (status !== undefined && status >= 400);

    return {
      requestId,
      t: request?.t ?? primaryEvent.t,
      method,
      url,
      status,
      statusText: response?.statusText ?? failed?.statusText,
      mimeType: response?.mimeType,
      size: response?.size,
      type: inferNetworkType(primaryEvent, method),
      phase: primaryEvent.phase,
      primaryEvent,
      hasError,
    };
  });
}

export function filterNetworkRows(
  rows: NetworkRow[],
  options: {
    query: string;
    type: NetworkResourceType;
    errorsOnly: boolean;
  },
): NetworkRow[] {
  const query = options.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (options.type !== "all" && row.type !== options.type) return false;
    if (options.errorsOnly && !row.hasError) return false;

    if (!query) return true;

    const haystack = [
      row.url,
      row.method,
      row.status?.toString(),
      row.statusText,
      row.mimeType,
      row.requestId,
      getNetworkTypeLabel(row.type),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortNetworkRows(
  rows: NetworkRow[],
  field: NetworkSortField,
  direction: SortDirection,
): NetworkRow[] {
  const sorted = [...rows].sort((a, b) => {
    switch (field) {
      case "time":
        return a.t - b.t;
      case "method":
        return (a.method ?? "").localeCompare(b.method ?? "");
      case "status":
        return (a.status ?? -1) - (b.status ?? -1);
      case "type":
        return getNetworkTypeLabel(a.type).localeCompare(getNetworkTypeLabel(b.type));
      case "url":
        return a.url.localeCompare(b.url);
      case "size":
        return (a.size ?? -1) - (b.size ?? -1);
      default:
        return 0;
    }
  });

  return direction === "asc" ? sorted : sorted.reverse();
}

export function formatSize(size?: number): string {
  if (size === undefined || size < 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export interface NetworkErrorMarker {
  t: number;
  requestId: string;
  url: string;
  method?: string;
  status?: number;
  statusText?: string;
}

export function getNetworkErrorMarkers(events: NetworkEvent[]): NetworkErrorMarker[] {
  const grouped = new Map<string, NetworkEvent[]>();

  for (const event of events) {
    const list = grouped.get(event.requestId) ?? [];
    list.push(event);
    grouped.set(event.requestId, list);
  }

  const markers: NetworkErrorMarker[] = [];

  for (const [requestId, related] of grouped.entries()) {
    const request = related.find((event) => event.phase === "request");
    const response = related.find((event) => event.phase === "response");
    const failed = related.find((event) => event.phase === "failed");
    const url = request?.url ?? response?.url ?? failed?.url ?? "unknown";
    const method = request?.method;

    if (failed) {
      markers.push({
        t: failed.t,
        requestId,
        url,
        method,
        statusText: failed.statusText,
      });
      continue;
    }

    if (response?.status !== undefined && response.status >= 400) {
      markers.push({
        t: response.t,
        requestId,
        url,
        method,
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  return markers.sort((a, b) => a.t - b.t);
}
