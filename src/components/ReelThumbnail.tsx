"use client";

import { useRef, useState } from "react";
import { HeartIcon, PlayIcon } from "lucide-react";

interface ReelThumbnailProps {
  reel: {
    id: string;
    videoUrl: string | null;
    _count: {
      likes: number;
    };
  };
}

function ReelThumbnail({ reel }: ReelThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Video play failed:", error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative aspect-[9/16] overflow-hidden rounded-sm bg-muted cursor-pointer"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl ?? undefined}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/50 p-3">
            <PlayIcon className="size-7 fill-white text-white" />
          </div>
        </div>
      )}

      <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs text-white">
        <HeartIcon className="size-3 fill-white" />
        {reel._count.likes}
      </div>
    </div>
  );
}

export default ReelThumbnail;
