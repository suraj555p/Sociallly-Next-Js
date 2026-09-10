// src/app/reels/page.tsx
import { getReels } from "@/actions/reel.action";
import ReelsFeed from "@/components/ReelsFeed";

export default async function ReelsPage() {
  const reels = await getReels();

  return (
    <div className="h-screen w-full bg-black">
      <ReelsFeed initialReels={reels} />
    </div>
  );
}