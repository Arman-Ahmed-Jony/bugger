import { formatTimestamp } from "@bugger/shared";
import type { ClickEvent } from "@bugger/shared";
import { formatPlaybackRate, PLAYBACK_RATES } from "../utils/playback";
import type { NetworkErrorMarker } from "../utils/networkTable";

interface TimelineProps {
  currentT: number;
  durationMs: number;
  isPlaying: boolean;
  playbackRate: number;
  errorMarkers: NetworkErrorMarker[];
  clickMarkers: ClickEvent[];
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onStepPlaybackRate: (direction: -1 | 1) => void;
}

export function Timeline({
  currentT,
  durationMs,
  isPlaying,
  playbackRate,
  errorMarkers,
  clickMarkers,
  onSeek,
  onTogglePlay,
  onPlaybackRateChange,
  onStepPlaybackRate,
}: TimelineProps) {
  const max = Math.max(durationMs, 1);
  const progressPercent = Math.min(100, (currentT / max) * 100);
  const atMinRate = playbackRate <= PLAYBACK_RATES[0];
  const atMaxRate = playbackRate >= PLAYBACK_RATES[PLAYBACK_RATES.length - 1];

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-800 bg-slate-950 px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
            onClick={onTogglePlay}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div className="flex items-center rounded-md border border-slate-700 bg-slate-900">
            <button
              type="button"
              aria-label="Slower playback"
              disabled={atMinRate}
              className="px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onStepPlaybackRate(-1)}
            >
              −
            </button>
            <select
              aria-label="Playback speed"
              value={playbackRate}
              className="cursor-pointer border-x border-slate-700 bg-transparent px-2 py-2 text-sm font-medium text-slate-200 outline-none"
              onChange={(event) => onPlaybackRateChange(Number(event.target.value))}
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate} className="bg-slate-900">
                  {formatPlaybackRate(rate)}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Faster playback"
              disabled={atMaxRate}
              className="px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onStepPlaybackRate(1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="relative flex-1 py-2">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-red-600/80"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {clickMarkers.map((marker, index) => {
            const left = Math.min(100, Math.max(0, (marker.t / max) * 100));
            const title = `Click ${marker.selector ?? marker.tag} at (${marker.x}, ${marker.y})`;

            return (
              <button
                key={`click-${marker.t}-${marker.x}-${marker.y}-${index}`}
                type="button"
                title={title}
                aria-label={`Click at ${formatTimestamp(marker.t)}: ${title}`}
                className="absolute top-[30%] z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] hover:scale-125 hover:bg-sky-300"
                style={{ left: `${left}%` }}
                onClick={() => onSeek(marker.t)}
              />
            );
          })}

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
                className="absolute top-[70%] z-10 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)] hover:h-4 hover:w-1.5 hover:bg-red-300"
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

      {(clickMarkers.length > 0 || errorMarkers.length > 0) && (
        <div className="flex items-center gap-4 pl-[220px] text-[10px] text-slate-500">
          {clickMarkers.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
              Click
            </span>
          )}
          {errorMarkers.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-1 rounded-sm bg-red-400" />
              Network error
            </span>
          )}
        </div>
      )}
    </div>
  );
}
