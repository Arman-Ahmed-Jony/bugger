import { useMemo, useState } from "react";
import { formatTimestamp, type NetworkEvent } from "@bugger/shared";
import { RequestDetailDrawer } from "./RequestDetailDrawer";
import {
  consolidateNetworkEvents,
  filterNetworkRows,
  formatSize,
  getNetworkTypeLabel,
  NETWORK_TYPE_FILTERS,
  sortNetworkRows,
  type NetworkResourceType,
  type NetworkSortField,
  type SortDirection,
} from "../utils/networkTable";

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

function nextSortDirection(currentField: NetworkSortField, field: NetworkSortField, currentDir: SortDirection): SortDirection {
  if (currentField !== field) return field === "time" ? "desc" : "asc";
  return currentDir === "asc" ? "desc" : "asc";
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) return <span className="ml-1 text-slate-600">↕</span>;
  return <span className="ml-1 text-red-400">{direction === "asc" ? "↑" : "↓"}</span>;
}

export function NetworkPanel({ events, allEvents, highlightIds, networkKey, onSeek }: NetworkPanelProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NetworkResourceType>("all");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [sortField, setSortField] = useState<NetworkSortField>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const consolidated = useMemo(() => consolidateNetworkEvents(events), [events]);

  const rows = useMemo(() => {
    const filtered = filterNetworkRows(consolidated, {
      query,
      type: typeFilter,
      errorsOnly,
    });
    return sortNetworkRows(filtered, sortField, sortDirection);
  }, [consolidated, query, typeFilter, errorsOnly, sortField, sortDirection]);

  const handleSort = (field: NetworkSortField) => {
    setSortDirection((current) => nextSortDirection(sortField, field, current));
    setSortField(field);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-800 p-3">
        <input
          type="search"
          value={query}
          placeholder="Filter (URL, method, status, type...)"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="mt-2 flex flex-wrap gap-1">
          {NETWORK_TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                typeFilter === type
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
              onClick={() => setTypeFilter(type)}
            >
              {getNetworkTypeLabel(type)}
            </button>
          ))}
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={errorsOnly}
            onChange={(event) => setErrorsOnly(event.target.checked)}
            className="accent-red-500"
          />
          Errors only
        </label>
      </div>

      <div className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
        Showing {rows.length} of {consolidated.length} requests
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {events.length === 0
              ? "No network events yet at this timestamp."
              : "No requests match the current filters."}
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400">
              <tr>
                <SortableHeader label="Time" field="time" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Type" field="type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Method" field="method" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Size" field="size" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="URL" field="url" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = networkKey(row.primaryEvent);
                const highlighted = highlightIds.has(key);
                return (
                  <tr
                    key={row.requestId}
                    className={`cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/50 ${
                      highlighted ? "bg-red-950/40" : row.hasError ? "bg-red-950/10" : ""
                    }`}
                    onClick={() => onSeek(row.t)}
                  >
                    <td className="px-3 py-2 font-mono text-slate-400">{formatTimestamp(row.t)}</td>
                    <td className="px-3 py-2 uppercase text-slate-500">{getNetworkTypeLabel(row.type)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-200">{row.method ?? "—"}</td>
                    <td className={`px-3 py-2 font-semibold ${statusColor(row.status)}`}>
                      {row.status ?? row.statusText ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">{formatSize(row.size)}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-slate-300" title={row.url}>
                      {row.url}
                    </td>
                    <td className="px-3 py-2">
                      <RequestDetailDrawer event={row.primaryEvent} allEvents={allEvents} />
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

function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: NetworkSortField;
  sortField: NetworkSortField;
  sortDirection: SortDirection;
  onSort: (field: NetworkSortField) => void;
}) {
  return (
    <th className="px-3 py-2">
      <button
        type="button"
        className="inline-flex items-center font-semibold uppercase tracking-wide hover:text-slate-200"
        onClick={() => onSort(field)}
      >
        {label}
        <SortIndicator active={sortField === field} direction={sortDirection} />
      </button>
    </th>
  );
}
