import { useEffect, useRef, useState } from "react";
import type { BuggerSessionMeta } from "@bugger/shared";
import { mapClickToVideoPosition, type ActiveRippleInput } from "../utils/clickRipple";

export type ActiveRipple = ActiveRippleInput;

interface ClickRippleOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ripples: ActiveRipple[];
  meta: BuggerSessionMeta;
}

export function ClickRippleOverlay({ videoRef, ripples, meta }: ClickRippleOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, { left: number; top: number }>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const updatePositions = () => {
      const next = new Map<string, { left: number; top: number }>();
      for (const ripple of ripples) {
        next.set(
          ripple.id,
          mapClickToVideoPosition(video, container, ripple.x, ripple.y, ripple.viewport),
        );
      }
      setPositions(next);
    };

    updatePositions();

    const observer = new ResizeObserver(updatePositions);
    observer.observe(container);
    observer.observe(video);

    window.addEventListener("resize", updatePositions);
    video.addEventListener("loadedmetadata", updatePositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePositions);
      video.removeEventListener("loadedmetadata", updatePositions);
    };
  }, [ripples, videoRef, meta]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {ripples.map((ripple) => {
        const position = positions.get(ripple.id);
        if (!position) return null;

        return (
          <span
            key={ripple.id}
            className="click-ripple absolute block"
            style={{ left: position.left, top: position.top }}
          />
        );
      })}
    </div>
  );
}
