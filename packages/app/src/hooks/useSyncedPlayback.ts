import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuggerSessionMeta, ClickEvent, ConsoleEvent, NetworkEvent } from "@bugger/shared";
import {
  sessionTimeToVideoSeconds,
  videoSecondsToSessionTime,
} from "@bugger/shared";
import type { ActiveRipple } from "../components/ClickRippleOverlay";
import { clickToRippleInput, clicksNearTime } from "../utils/clickRipple";

interface UseSyncedPlaybackOptions {
  network: NetworkEvent[];
  console: ConsoleEvent[];
  clicks: ClickEvent[];
  meta: BuggerSessionMeta;
}

export function useSyncedPlayback({ network, console, clicks, meta }: UseSyncedPlaybackOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentT, setCurrentT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightNetworkIds, setHighlightNetworkIds] = useState<Set<string>>(new Set());
  const [highlightConsoleKeys, setHighlightConsoleKeys] = useState<Set<string>>(new Set());
  const [activeRipples, setActiveRipples] = useState<ActiveRipple[]>([]);
  const lastTRef = useRef(0);

  const durationMs = meta.durationMs;

  const visibleNetwork = useMemo(
    () => network.filter((event) => event.t <= currentT),
    [network, currentT],
  );

  const visibleConsole = useMemo(
    () => console.filter((event) => event.t <= currentT),
    [console, currentT],
  );

  const triggerRipples = useCallback(
    (clickEvents: ClickEvent[]) => {
      if (clickEvents.length === 0) return;

      const video = videoRef.current;
      if (!video) return;

      const newRipples = clickEvents.map((click) => clickToRippleInput(click, meta, video));

      setActiveRipples((previous) => [...previous, ...newRipples]);

      const ids = new Set(newRipples.map((ripple) => ripple.id));
      window.setTimeout(() => {
        setActiveRipples((previous) => previous.filter((ripple) => !ids.has(ripple.id)));
      }, 700);
    },
    [meta],
  );

  const seek = useCallback(
    (sessionT: number) => {
      const clamped = Math.max(0, Math.min(sessionT, durationMs));
      const video = videoRef.current;
      if (video) {
        video.currentTime = sessionTimeToVideoSeconds(clamped, meta);
      }
      setCurrentT(clamped);
      lastTRef.current = clamped;
      triggerRipples(clicksNearTime(clicks, clamped));
    },
    [clicks, durationMs, meta, triggerRipples],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const t = videoSecondsToSessionTime(video.currentTime, meta);
      const lastT = lastTRef.current;
      setCurrentT(t);

      const newNetworkIds = network
        .filter((event) => event.t > lastT && event.t <= t)
        .map((event) => `${event.requestId}-${event.phase}-${event.t}`);
      const newConsoleKeys = console
        .filter((event) => event.t > lastT && event.t <= t)
        .map((event) => `${event.t}-${event.level}-${event.args.join("|")}`);
      const newClicks = clicks.filter((click) => click.t > lastT && click.t <= t);

      if (newNetworkIds.length > 0) {
        setHighlightNetworkIds(new Set(newNetworkIds));
        window.setTimeout(() => setHighlightNetworkIds(new Set()), 900);
      }
      if (newConsoleKeys.length > 0) {
        setHighlightConsoleKeys(new Set(newConsoleKeys));
        window.setTimeout(() => setHighlightConsoleKeys(new Set()), 900);
      }
      if (newClicks.length > 0) {
        triggerRipples(newClicks);
      }

      lastTRef.current = t;
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onSeeked = () => {
      const t = videoSecondsToSessionTime(video.currentTime, meta);
      setCurrentT(t);
      lastTRef.current = t;
    };
    const onEnded = () => {
      const t = videoSecondsToSessionTime(video.duration, meta);
      setCurrentT(Math.min(t, durationMs));
      lastTRef.current = Math.min(t, durationMs);
      setIsPlaying(false);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
    };
  }, [clicks, console, durationMs, meta, network, triggerRipples]);

  const networkKey = (event: NetworkEvent) => `${event.requestId}-${event.phase}-${event.t}`;
  const consoleKey = (event: ConsoleEvent) => `${event.t}-${event.level}-${event.args.join("|")}`;

  return {
    videoRef,
    currentT,
    isPlaying,
    visibleNetwork,
    visibleConsole,
    seek,
    togglePlay,
    highlightNetworkIds,
    highlightConsoleKeys,
    activeRipples,
    networkKey,
    consoleKey,
    durationMs,
  };
}
