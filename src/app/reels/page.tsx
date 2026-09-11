// src/app/reels/page.tsx
import { getReels } from "@/actions/reel.action";
import ReelsFeed from "@/components/ReelsFeed";

export default async function ReelsPage() {
  const reels = await getReels();

  return (
  <div className="h-screen bg-gray-100 flex justify-center">
  <div className="h-full w-full max-w-[430px] bg-black overflow-hidden">
    <ReelsFeed initialReels={reels} />
  </div>
</div>

  );
}