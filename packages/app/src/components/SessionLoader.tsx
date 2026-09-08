import { useCallback, useRef, useState } from "react";
import type { LoadedSession } from "@bugger/shared";
import { unpackSession } from "@bugger/shared";

interface SessionLoaderProps {
  onLoad: (loaded: LoadedSession) => void;
}

export function SessionLoader({ onLoad }: SessionLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await unpackSession(file);
        onLoad(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    },
    [onLoad],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div
        className={`w-full max-w-xl rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging ? "border-red-400 bg-red-950/20" : "border-slate-700 bg-slate-900/50"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <h1 className="text-3xl font-bold text-white">Bugger Replay</h1>
        <p className="mt-2 text-slate-400">
          Load a <code className="text-red-300">.bugger</code> session to replay synchronized video,
          network, and console events.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".bugger,application/x-bugger,application/zip"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <button
          type="button"
          className="mt-8 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Loading..." : "Choose Session File"}
        </button>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
