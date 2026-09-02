import { formatTimestamp, type ConsoleEvent } from "@bugger/shared";

interface ConsolePanelProps {
  events: ConsoleEvent[];
  highlightKeys: Set<string>;
  consoleKey: (event: ConsoleEvent) => string;
  onSeek: (t: number) => void;
}

const levelColors: Record<ConsoleEvent["level"], string> = {
  log: "text-slate-200",
  info: "text-blue-300",
  warn: "text-yellow-300",
  error: "text-red-300",
  debug: "text-purple-300",
};

export function ConsolePanel({ events, highlightKeys, consoleKey, onSeek }: ConsolePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Console ({events.length})
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {events.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">No console events yet at this timestamp.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const key = consoleKey(event);
              const highlighted = highlightKeys.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-left hover:bg-slate-800/60 ${
                    highlighted ? "ring-1 ring-red-500/60" : ""
                  }`}
                  onClick={() => onSeek(event.t)}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500">{formatTimestamp(event.t)}</span>
                    <span className={`font-semibold uppercase ${levelColors[event.level]}`}>
                      {event.level}
                    </span>
                    {event.source && (
                      <span className="truncate text-slate-500" title={event.source}>
                        {event.source}
                      </span>
                    )}
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-slate-200">
                    {event.args.join(" ")}
                  </pre>
                  {event.stack && (
                    <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[10px] text-slate-500">
                      {event.stack}
                    </pre>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
