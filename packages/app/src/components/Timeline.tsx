import { formatTimestamp } from "@bugger/shared";
import type { NetworkErrorMarker } from "../utils/networkTable";

interface TimelineProps {
  currentT: number;
  durationMs: number;
  isPlaying: boolean;
  errorMarkers: NetworkErrorMarker[];
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}

export function Timeline({
  currentT,
  durationMs,
  isPlaying,
  errorMarkers,
  onSeek,
  onTogglePlay,
}: TimelineProps) {
  const max = Math.max(durationMs, 1);
  const progressPercent = Math.min(100, (currentT / max) * 100);

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-slate-800 bg-slate-950 px-4 py-3">
      <button
        type="button"
        className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
        onClick={onTogglePlay}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <div className="relative flex-1 py-2">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-red-600/80"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {errorMarkers.map((marker) => {
          const left = Math.min(100, Math.max(0, (marker.t / max) * 100));
          const title = marker.status
            ? `${marker.status} ${marker.method ?? "GET"} ${marker.url}`
            : `${marker.statusText ?? "Failed"} ${marker.method ?? "GET"} ${marker.url}`;

          return (
            <button
              key={`${marker.requestId}-${marker.t}`}
              type="button"
              title={title}
              aria-label={`Network error at ${formatTimestamp(marker.t)}: ${title}`}
              className="absolute top-1/2 z-10 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)] hover:h-4 hover:w-1.5 hover:bg-red-300"
              style={{ left: `${left}%` }}
              onClick={() => onSeek(marker.t)}
            />
          );
        })}

        <input
          type="range"
          min={0}
          max={max}
          step={10}
          value={currentT}
          className="relative z-20 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>

      <span className="min-w-[120px] text-right font-mono text-sm text-slate-300">
        {formatTimestamp(currentT)} / {formatTimestamp(durationMs)}
      </span>
    </div>
  );
}
