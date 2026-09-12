// src/app/reels/page.tsx
import { getReels } from "@/actions/reel.action";
import { getDbUserId } from "@/actions/user.action";
import ReelsFeed from "@/components/ReelsFeed";

export default async function ReelsPage() {
  const reels = await getReels();
  const currentDbUserId = await getDbUserId();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] h-screen bg-black overflow-hidden">
        <ReelsFeed initialReels={reels} currentDbUserId={currentDbUserId} />
      </div>
    </div>
  );
}