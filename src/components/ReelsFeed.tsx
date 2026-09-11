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
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
      }}
    >
      {/* Hide scrollbar for Chrome/Safari */}
      <style jsx global>{`
        .snap-y::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {reels.length === 0 ? (
        <div className="h-screen w-full flex items-center justify-center text-white">
          <p className="text-lg font-medium">No reels available</p>
        </div>
      ) : (
        reels.map((reel) => <ReelItem key={reel.id} reel={reel} />)
      )}
    </div>
  );
}