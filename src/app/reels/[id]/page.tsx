import { getReelById, getReels } from "@/actions/reel.action";
import { getDbUserId } from "@/actions/user.action";
import ReelsFeed from "@/components/ReelsFeed";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

async function ReelPage({ params }: Props) {
  const { id } = await params;

  let reel;

  try {
    reel = await getReelById(id);
  } catch (error) {
    console.error("Error fetching reel in ReelPage:", error);
    return notFound();
  }

  if (!reel) {
    return notFound();
  }

  const allReels = await getReels();
  const currentDbUserId = await getDbUserId();

  return (
    <div className="w-full bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] h-screen bg-black overflow-hidden">
        <ReelsFeed
          initialReels={allReels}
          initialReelId={id}
          currentDbUserId={currentDbUserId}
        />
      </div>
    </div>
  );
}

export default ReelPage;