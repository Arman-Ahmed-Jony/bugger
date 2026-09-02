import { formatTimestamp, type NetworkEvent } from "@bugger/shared";
import { RequestDetailDrawer } from "./RequestDetailDrawer";

interface NetworkPanelProps {
  events: NetworkEvent[];
  allEvents: NetworkEvent[];
  highlightIds: Set<string>;
  networkKey: (event: NetworkEvent) => string;
  onSeek: (t: number) => void;
}

function statusColor(status?: number): string {
  if (!status) return "text-slate-400";
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 400) return "text-red-400";
  return "text-yellow-400";
}

export function NetworkPanel({ events, allEvents, highlightIds, networkKey, onSeek }: NetworkPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Network ({events.length})
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No network events yet at this timestamp.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 text-slate-400">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const key = networkKey(event);
                const highlighted = highlightIds.has(key);
                return (
                  <tr
                    key={key}
                    className={`cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/50 ${
                      highlighted ? "bg-red-950/40" : ""
                    }`}
                    onClick={() => onSeek(event.t)}
                  >
                    <td className="px-3 py-2 font-mono text-slate-400">{formatTimestamp(event.t)}</td>
                    <td className="px-3 py-2 capitalize text-slate-300">{event.phase}</td>
                    <td className="px-3 py-2 font-semibold text-slate-200">{event.method ?? "—"}</td>
                    <td className={`px-3 py-2 font-semibold ${statusColor(event.status)}`}>
                      {event.status ?? event.statusText ?? "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2 text-slate-300" title={event.url}>
                      {event.url}
                    </td>
                    <td className="px-3 py-2">
                      <RequestDetailDrawer event={event} allEvents={allEvents} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
