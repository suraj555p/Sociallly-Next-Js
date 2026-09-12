"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { HeartIcon, PlayIcon, SearchIcon, XIcon } from "lucide-react";
import { getReels } from "@/actions/reel.action";

type Reels = Awaited<ReturnType<typeof getReels>>;

interface ReelsGridProps {
  reels: Reels;
}

export default function ReelsGrid({ reels }: ReelsGridProps) {
  const [query, setQuery] = useState("");

  const filteredReels = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) return reels;

    return reels.filter((reel) => {
      const caption = reel.caption?.toLowerCase() ?? "";
      const username = reel.author.username?.toLowerCase() ?? "";
      const name = reel.author.name?.toLowerCase() ?? "";

      return (
        caption.includes(trimmedQuery) ||
        username.includes(trimmedQuery) ||
        name.includes(trimmedQuery)
      );
    });
  }, [query, reels]);

  return (
    <div>
      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by caption or username..."
          className="w-full rounded-full border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-1 focus:ring-ring"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* RESULTS */}
      {filteredReels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {query ? `No results for "${query}"` : "No reels yet"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {filteredReels.map((reel) => (
            <GridThumbnail key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </div>
  );
}

function GridThumbnail({ reel }: { reel: Reels[number] }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    router.push(`/reel/${reel.id}`);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = 0;

    video.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovering(false);

    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[9/16] bg-muted rounded-sm overflow-hidden group cursor-pointer"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
      />

      <div
        className={`absolute inset-0 transition-colors ${
          isHovering ? "bg-black/20" : "bg-black/10"
        }`}
      />

      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isHovering ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="bg-black/50 rounded-full p-3">
          <PlayIcon className="size-7 text-white fill-white" />
        </div>
      </div>

      {/* USERNAME BADGE */}
      <div className="absolute top-2 left-2 right-2">
        <span className="text-white text-xs font-medium drop-shadow truncate block">
          @{reel.author.username}
        </span>
      </div>

      {/* LIKES */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium drop-shadow">
        <HeartIcon className="size-3 fill-white" />
        {reel._count.likes}
      </div>
    </div>
  );
}