import type { BuggerSessionMeta } from "@bugger/shared";
import type { ActiveRipple } from "./ClickRippleOverlay";
import { ClickRippleOverlay } from "./ClickRippleOverlay";

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ripples: ActiveRipple[];
  meta: BuggerSessionMeta;
}

export function VideoPlayer({ videoUrl, videoRef, ripples, meta }: VideoPlayerProps) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-black">
      <div className="relative inline-flex max-h-full max-w-full">
        <video
          ref={videoRef}
          src={videoUrl}
          className="block max-h-full max-w-full object-contain"
          controls={false}
          playsInline
        />
        <ClickRippleOverlay videoRef={videoRef} ripples={ripples} meta={meta} />
      </div>
    </div>
  );
}
