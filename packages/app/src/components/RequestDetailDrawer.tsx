import { useMemo, useState } from "react";
import {
  bundleNetworkEvent,
  formatBodyForDisplay,
  formatTimestamp,
  type NetworkEvent,
} from "@bugger/shared";

interface RequestDetailDrawerProps {
  event: NetworkEvent;
  allEvents: NetworkEvent[];
}

type DetailTab = "overview" | "request" | "response";

export function RequestDetailDrawer({ event, allEvents }: RequestDetailDrawerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>("overview");

  const bundle = useMemo(() => bundleNetworkEvent(event, allEvents), [event, allEvents]);
  const requestMime = bundle.request?.requestHeaders?.["content-type"];
  const responseMime = bundle.response?.mimeType ?? bundle.response?.responseHeaders?.["content-type"];
  const requestBody = formatBodyForDisplay(bundle.requestBody, requestMime);
  const responseBody = formatBodyForDisplay(bundle.responseBody, responseMime);

  const openDrawer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTab("overview");
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
        onClick={openDrawer}
      >
        Details
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white">Network Request</h3>
                <p className="mt-1 break-all text-sm text-slate-400">
                  {bundle.request?.method ?? event.method ?? "GET"}{" "}
                  {bundle.request?.url ?? bundle.response?.url ?? event.url}
                </p>
              </div>
              <button
                type="button"
                className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex shrink-0 border-b border-slate-800 px-6">
              <TabButton active={tab === "overview"} label="Overview" onClick={() => setTab("overview")} />
              <TabButton active={tab === "request"} label="Request" onClick={() => setTab("request")} />
              <TabButton active={tab === "response"} label="Response" onClick={() => setTab("response")} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {tab === "overview" && (
                <>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Request ID" value={bundle.requestId} />
                    <Detail
                      label="Status"
                      value={
                        bundle.response?.status
                          ? String(bundle.response.status)
                          : bundle.failed?.statusText ?? "—"
                      }
                    />
                    <Detail label="Request Time" value={bundle.request ? formatTimestamp(bundle.request.t) : "—"} />
                    <Detail label="Response Time" value={bundle.response ? formatTimestamp(bundle.response.t) : "—"} />
                    <Detail label="MIME Type" value={bundle.response?.mimeType ?? "—"} />
                    <Detail label="Size" value={bundle.response?.size ? String(bundle.response.size) : "—"} />
                  </dl>
                  <HeaderBlock title="Request Headers" headers={bundle.request?.requestHeaders} />
                  <HeaderBlock title="Response Headers" headers={bundle.response?.responseHeaders} />
                </>
              )}

              {tab === "request" && (
                <>
                  <HeaderBlock title="Request Headers" headers={bundle.request?.requestHeaders} />
                  <BodyBlock title="Request Payload" body={requestBody} />
                </>
              )}

              {tab === "response" && (
                <>
                  <HeaderBlock title="Response Headers" headers={bundle.response?.responseHeaders} />
                  <BodyBlock title="Response Payload" body={responseBody} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`px-4 py-3 text-sm font-semibold ${
        active
          ? "border-b-2 border-red-500 text-white"
          : "text-slate-400 hover:text-slate-200"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-slate-200">{value}</dd>
    </div>
  );
}

function HeaderBlock({
  title,
  headers,
}: {
  title: string;
  headers?: Record<string, string>;
}) {
  if (!headers || Object.keys(headers).length === 0) {
    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
        <p className="mt-2 text-sm text-slate-500">No headers captured.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      <pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400">
        {Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
      </pre>
    </div>
  );
}

function BodyBlock({ title, body }: { title: string; body: string | null }) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      {body ? (
        <pre className="mt-2 max-h-[420px] overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
          {body}
        </pre>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No payload captured.</p>
      )}
    </div>
  );
}
