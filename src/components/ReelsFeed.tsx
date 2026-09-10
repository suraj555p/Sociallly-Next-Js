// src/components/ReelsFeed.tsx
"use client";

import { useRef, useState } from "react";
import ReelItem from "./ReelItem";
import type { getReels } from "@/actions/reel.action";

type Reel = Awaited<ReturnType<typeof getReels>>[number];

interface ReelsFeedProps {
  initialReels: Reel[];
}

export default function ReelsFeed({ initialReels }: ReelsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reels] = useState<Reel[]>(initialReels);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
      }}
    >
      <style jsx global>{`
        /* Chrome, Safari - scrollbar hide */
        .snap-y::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {reels.map((reel) => (
        <ReelItem key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
