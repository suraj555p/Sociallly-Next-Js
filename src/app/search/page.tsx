import { getReels } from "@/actions/reel.action";
import ReelsGrid from "@/components/ReelsGrid"

export default async function SearchPage() {
  const reels = await getReels();
  console.log("wolverine")
  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Explore Reels</h1>
      <ReelsGrid reels={reels} />
    </div>
  );
}