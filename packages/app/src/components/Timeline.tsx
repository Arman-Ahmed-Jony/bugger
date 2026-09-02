import { formatTimestamp } from "@bugger/shared";

interface TimelineProps {
  currentT: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}

export function Timeline({
  currentT,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
}: TimelineProps) {
  const max = Math.max(durationMs, 1);

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-slate-800 bg-slate-950 px-4 py-3">
      <button
        type="button"
        className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
        onClick={onTogglePlay}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <input
        type="range"
        min={0}
        max={max}
        step={10}
        value={currentT}
        className="flex-1 accent-red-500"
        onChange={(event) => onSeek(Number(event.target.value))}
      />

      <span className="min-w-[120px] text-right font-mono text-sm text-slate-300">
        {formatTimestamp(currentT)} / {formatTimestamp(durationMs)}
      </span>
    </div>
  );
}
