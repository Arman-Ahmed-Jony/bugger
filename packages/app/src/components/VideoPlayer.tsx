interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function VideoPlayer({ videoUrl, videoRef }: VideoPlayerProps) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="max-h-full max-w-full"
        controls={false}
        playsInline
      />
    </div>
  );
}
