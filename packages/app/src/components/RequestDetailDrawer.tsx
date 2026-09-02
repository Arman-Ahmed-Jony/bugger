import { useState } from "react";
import type { NetworkEvent } from "@bugger/shared";

interface RequestDetailDrawerProps {
  event: NetworkEvent;
}

export function RequestDetailDrawer({ event }: RequestDetailDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Details
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Network Event</h3>
                <p className="mt-1 break-all text-sm text-slate-400">{event.url}</p>
              </div>
              <button
                type="button"
                className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Phase" value={event.phase} />
              <Detail label="Method" value={event.method ?? "—"} />
              <Detail label="Status" value={event.status ? String(event.status) : event.statusText ?? "—"} />
              <Detail label="MIME" value={event.mimeType ?? "—"} />
              <Detail label="Size" value={event.size ? String(event.size) : "—"} />
              <Detail label="Request ID" value={event.requestId} />
            </dl>

            <HeaderBlock title="Request Headers" headers={event.requestHeaders} />
            <HeaderBlock title="Response Headers" headers={event.responseHeaders} />
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-slate-200">{value}</dd>
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
  if (!headers || Object.keys(headers).length === 0) return null;

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
