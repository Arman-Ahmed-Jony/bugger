import { useEffect, useMemo, useState } from "react";
import type { LoadedSession } from "@bugger/shared";
import { SessionLoader } from "../components/SessionLoader";
import { VideoPlayer } from "../components/VideoPlayer";
import { Timeline } from "../components/Timeline";
import { NetworkPanel } from "../components/NetworkPanel";
import { ConsolePanel } from "../components/ConsolePanel";
import { ResizableDrawer } from "../components/ResizableDrawer";
import { useSyncedPlayback } from "../hooks/useSyncedPlayback";
import { getNetworkErrorMarkers } from "../utils/networkTable";
import { navigate, routeHref } from "../routing";

type SidePanel = "network" | "console";

export function ReplayPage() {
  const [loaded, setLoaded] = useState<LoadedSession | null>(null);
  const [panel, setPanel] = useState<SidePanel>("network");

  const playback = useSyncedPlayback({
    network: loaded?.session.network ?? [],
    console: loaded?.session.console ?? [],
    clicks: loaded?.session.clicks ?? [],
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

  const networkErrorMarkers = useMemo(
    () => getNetworkErrorMarkers(loaded?.session.network ?? []),
    [loaded?.session.network],
  );
  const clickMarkers = useMemo(() => loaded?.session.clicks ?? [], [loaded?.session.clicks]);

  if (!loaded) {
    return (
      <div className="player-shell">
        <div className="player-shell__bar">
          <a
            className="player-shell__brand"
            href={routeHref("landing")}
            onClick={(e) => {
              e.preventDefault();
              navigate("landing");
            }}
          >
            Bugger
          </a>
          <span className="player-shell__label">Replay player</span>
        </div>
        <SessionLoader onLoad={setLoaded} />
      </div>
    );
  }

  const { session } = loaded;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-200">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">{session.meta.title || "Bugger Session"}</h1>
          <p className="text-sm text-slate-400">{session.meta.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            href={routeHref("landing")}
            onClick={(e) => {
              e.preventDefault();
              navigate("landing");
            }}
          >
            Home
          </a>
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
        </div>
      </header>

      <ResizableDrawer
        main={
          <VideoPlayer
            videoUrl={loaded.videoUrl}
            videoRef={playback.videoRef}
            ripples={playback.activeRipples}
            meta={session.meta}
          />
        }
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
        playbackRate={playback.playbackRate}
        errorMarkers={networkErrorMarkers}
        clickMarkers={clickMarkers}
        onSeek={playback.seek}
        onTogglePlay={playback.togglePlay}
        onPlaybackRateChange={playback.setPlaybackRate}
        onStepPlaybackRate={playback.stepPlaybackRate}
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
