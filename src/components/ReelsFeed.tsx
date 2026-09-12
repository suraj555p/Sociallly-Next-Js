// src/components/ReelsFeed.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import ReelItem from "./ReelItem";
import type { getReels } from "@/actions/reel.action";

type Reel = Awaited<ReturnType<typeof getReels>>[number];

interface ReelsFeedProps {
  initialReels: Reel[];
  initialReelId?: string;
  currentDbUserId: string | null;
}

export default function ReelsFeed({
  initialReels,
  initialReelId,
  currentDbUserId,
}: ReelsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [reels] = useState<Reel[]>(initialReels);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (!initialReelId) return;

    const targetNode = itemRefs.current.get(initialReelId);

    if (!targetNode) return;

    targetNode.scrollIntoView({ behavior: "auto", block: "start" });

    hasScrolledRef.current = true;
  }, [initialReelId, reels]);

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
        reels.map((reel) => (
          <div
            key={reel.id}
            ref={(node) => {
              if (node) {
                itemRefs.current.set(reel.id, node);
              } else {
                itemRefs.current.delete(reel.id);
              }
            }}
          >
            <ReelItem reel={reel} currentDbUserId={currentDbUserId} />
          </div>
        ))
      )}
    </div>
  );
}