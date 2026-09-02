import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuggerSessionMeta, ClickEvent, ConsoleEvent, NetworkEvent } from "@bugger/shared";
import {
  getVideoDurationMs,
  getVideoEndSessionTimeResolved,
  resolveVideoStartOffsetMs,
  sessionTimeToVideoSecondsResolved,
  videoSecondsToSessionTimeResolved,
} from "@bugger/shared";
import type { ActiveRipple } from "../components/ClickRippleOverlay";
import { clickToRippleInput, clicksNearTime } from "../utils/clickRipple";

interface UseSyncedPlaybackOptions {
  network: NetworkEvent[];
  console: ConsoleEvent[];
  clicks: ClickEvent[];
  meta: BuggerSessionMeta;
}

function collectEventTimes(
  network: NetworkEvent[],
  console: ConsoleEvent[],
  clicks: ClickEvent[],
): number[] {
  return [
    ...network.map((event) => event.t),
    ...console.map((event) => event.t),
    ...clicks.map((event) => event.t),
  ];
}

export function useSyncedPlayback({ network, console, clicks, meta }: UseSyncedPlaybackOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentT, setCurrentT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightNetworkIds, setHighlightNetworkIds] = useState<Set<string>>(new Set());
  const [highlightConsoleKeys, setHighlightConsoleKeys] = useState<Set<string>>(new Set());
  const [activeRipples, setActiveRipples] = useState<ActiveRipple[]>([]);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const lastTRef = useRef(0);
  const tailFrameRef = useRef<number | null>(null);
  const tailFromRef = useRef(0);
  const playingRef = useRef(false);

  const eventTimesMs = useMemo(
    () => collectEventTimes(network, console, clicks),
    [network, console, clicks],
  );

  const videoStartOffsetMs = useMemo(
    () => resolveVideoStartOffsetMs(meta, eventTimesMs),
    [meta, eventTimesMs],
  );

  const durationMs = meta.durationMs;

  const videoEndSessionTime = useMemo(
    () => getVideoEndSessionTimeResolved(meta, videoSeconds, eventTimesMs),
    [meta, videoSeconds, eventTimesMs],
  );

  const sessionTimeToVideoSeconds = useCallback(
    (sessionT: number) => sessionTimeToVideoSecondsResolved(sessionT, meta, eventTimesMs),
    [meta, eventTimesMs],
  );

  const videoSecondsToSessionTime = useCallback(
    (seconds: number) => videoSecondsToSessionTimeResolved(seconds, meta, eventTimesMs),
    [meta, eventTimesMs],
  );

  const visibleNetwork = useMemo(
    () => network.filter((event) => event.t <= currentT),
    [network, currentT],
  );

  const visibleConsole = useMemo(
    () => console.filter((event) => event.t <= currentT),
    [console, currentT],
  );

  const emitEventsBetween = useCallback(
    (fromT: number, toT: number) => {
      const newNetworkIds = network
        .filter((event) => event.t > fromT && event.t <= toT)
        .map((event) => `${event.requestId}-${event.phase}-${event.t}`);
      const newConsoleKeys = console
        .filter((event) => event.t > fromT && event.t <= toT)
        .map((event) => `${event.t}-${event.level}-${event.args.join("|")}`);
      const newClicks = clicks.filter((click) => click.t > fromT && click.t <= toT);

      if (newNetworkIds.length > 0) {
        setHighlightNetworkIds(new Set(newNetworkIds));
        window.setTimeout(() => setHighlightNetworkIds(new Set()), 900);
      }
      if (newConsoleKeys.length > 0) {
        setHighlightConsoleKeys(new Set(newConsoleKeys));
        window.setTimeout(() => setHighlightConsoleKeys(new Set()), 900);
      }
      if (newClicks.length > 0) {
        const video = videoRef.current;
        if (video) {
          const newRipples = newClicks.map((click) => clickToRippleInput(click, meta, video));
          setActiveRipples((previous) => [...previous, ...newRipples]);
          const ids = new Set(newRipples.map((ripple) => ripple.id));
          window.setTimeout(() => {
            setActiveRipples((previous) => previous.filter((ripple) => !ids.has(ripple.id)));
          }, 700);
        }
      }
    },
    [clicks, console, meta, network],
  );

  const stopTailPlayback = useCallback(() => {
    if (tailFrameRef.current != null) {
      cancelAnimationFrame(tailFrameRef.current);
      tailFrameRef.current = null;
    }
  }, []);

  const startTailPlayback = useCallback(
    (fromT: number) => {
      stopTailPlayback();
      tailFromRef.current = fromT;
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (!playingRef.current) return;

        const elapsed = now - startedAt;
        const nextT = Math.min(durationMs, tailFromRef.current + elapsed);
        const previousT = lastTRef.current;

        setCurrentT(nextT);
        emitEventsBetween(previousT, nextT);
        lastTRef.current = nextT;

        if (nextT < durationMs) {
          tailFrameRef.current = requestAnimationFrame(tick);
        } else {
          tailFrameRef.current = null;
          playingRef.current = false;
          setIsPlaying(false);
        }
      };

      tailFrameRef.current = requestAnimationFrame(tick);
    },
    [durationMs, emitEventsBetween, stopTailPlayback],
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
      stopTailPlayback();
      playingRef.current = false;

      const clamped = Math.max(0, Math.min(sessionT, durationMs));
      const video = videoRef.current;
      if (video) {
        const videoDurationMs = getVideoDurationMs(meta, videoSeconds);
        const maxVideoSeconds = videoDurationMs / 1000;
        video.currentTime = Math.min(sessionTimeToVideoSeconds(clamped), maxVideoSeconds);
      }
      setCurrentT(clamped);
      lastTRef.current = clamped;
      triggerRipples(clicksNearTime(clicks, clamped));
    },
    [
      clicks,
      durationMs,
      meta,
      sessionTimeToVideoSeconds,
      stopTailPlayback,
      triggerRipples,
      videoSeconds,
    ],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    stopTailPlayback();

    if (playingRef.current) {
      playingRef.current = false;
      video.pause();
      setIsPlaying(false);
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);

    const atVideoEnd = lastTRef.current >= videoEndSessionTime - 50;
    const atSessionEnd = lastTRef.current >= durationMs - 50;

    if (atSessionEnd) {
      seek(0);
    }

    if (atVideoEnd && !atSessionEnd) {
      startTailPlayback(lastTRef.current);
      return;
    }

    if (atVideoEnd) {
      void video.play().catch(() => {
        playingRef.current = false;
        setIsPlaying(false);
      });
      return;
    }

    void video.play().catch(() => {
      playingRef.current = false;
      setIsPlaying(false);
    });
  }, [durationMs, seek, startTailPlayback, stopTailPlayback, videoEndSessionTime]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setVideoSeconds(video.duration);
    };

    const onTimeUpdate = () => {
      const t = Math.min(videoSecondsToSessionTime(video.currentTime), durationMs);
      const lastT = lastTRef.current;
      setCurrentT(t);
      emitEventsBetween(lastT, t);
      lastTRef.current = t;
    };

    const onPlay = () => {
      playingRef.current = true;
      setIsPlaying(true);
      stopTailPlayback();
    };

    const onPause = () => {
      if (tailFrameRef.current == null) {
        playingRef.current = false;
        setIsPlaying(false);
      }
    };

    const onSeeked = () => {
      const t = Math.min(videoSecondsToSessionTime(video.currentTime), durationMs);
      setCurrentT(t);
      lastTRef.current = t;
    };

    const onEnded = () => {
      const endT = Math.min(videoEndSessionTime, durationMs);
      setCurrentT(endT);
      lastTRef.current = endT;

      if (endT < durationMs && playingRef.current) {
        video.pause();
        startTailPlayback(endT);
        return;
      }

      playingRef.current = false;
      setIsPlaying(false);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 1) {
      setVideoSeconds(video.duration);
    }

    return () => {
      stopTailPlayback();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
    };
  }, [
    durationMs,
    emitEventsBetween,
    startTailPlayback,
    stopTailPlayback,
    videoEndSessionTime,
    videoSecondsToSessionTime,
  ]);

  useEffect(() => {
    return () => stopTailPlayback();
  }, [stopTailPlayback]);

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
    videoStartOffsetMs,
  };
}
