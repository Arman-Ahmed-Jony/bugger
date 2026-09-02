import { useEffect, useState } from "react";
import type { LoadedSession } from "@bugger/shared";
import { SessionLoader } from "./components/SessionLoader";
import { VideoPlayer } from "./components/VideoPlayer";
import { Timeline } from "./components/Timeline";
import { NetworkPanel } from "./components/NetworkPanel";
import { ConsolePanel } from "./components/ConsolePanel";
import { ResizableDrawer } from "./components/ResizableDrawer";
import { useSyncedPlayback } from "./hooks/useSyncedPlayback";

type SidePanel = "network" | "console";

export default function App() {
  const [loaded, setLoaded] = useState<LoadedSession | null>(null);
  const [panel, setPanel] = useState<SidePanel>("network");

  const playback = useSyncedPlayback({
    network: loaded?.session.network ?? [],
    console: loaded?.session.console ?? [],
    meta: loaded?.session.meta ?? {
      url: "",
      title: "",
      startedAt: "",
      durationMs: 0,
      userAgent: "",
    },
  });

  useEffect(() => {
    return () => {
      if (loaded?.videoUrl) {
        URL.revokeObjectURL(loaded.videoUrl);
      }
    };
  }, [loaded?.videoUrl]);

  if (!loaded) {
    return <SessionLoader onLoad={setLoaded} />;
  }

  const { session } = loaded;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">{session.meta.title || "Bugger Session"}</h1>
          <p className="text-sm text-slate-400">{session.meta.url}</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          onClick={() => {
            URL.revokeObjectURL(loaded.videoUrl);
            setLoaded(null);
          }}
        >
          Load Another
        </button>
      </header>

      <ResizableDrawer
        main={<VideoPlayer videoUrl={loaded.videoUrl} videoRef={playback.videoRef} />}
        drawer={
          <>
            <div className="flex shrink-0 border-b border-slate-800">
              <TabButton
                active={panel === "network"}
                label={`Network (${playback.visibleNetwork.length})`}
                onClick={() => setPanel("network")}
              />
              <TabButton
                active={panel === "console"}
                label={`Console (${playback.visibleConsole.length})`}
                onClick={() => setPanel("console")}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {panel === "network" ? (
                <NetworkPanel
                  events={playback.visibleNetwork}
                  allEvents={session.network}
                  highlightIds={playback.highlightNetworkIds}
                  networkKey={playback.networkKey}
                  onSeek={playback.seek}
                />
              ) : (
                <ConsolePanel
                  events={playback.visibleConsole}
                  highlightKeys={playback.highlightConsoleKeys}
                  consoleKey={playback.consoleKey}
                  onSeek={playback.seek}
                />
              )}
            </div>
          </>
        }
      />

      <Timeline
        currentT={playback.currentT}
        durationMs={playback.durationMs}
        isPlaying={playback.isPlaying}
        onSeek={playback.seek}
        onTogglePlay={playback.togglePlay}
      />
    </div>
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
      className={`flex-1 px-4 py-3 text-sm font-semibold ${
        active
          ? "border-b-2 border-red-500 text-white"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
