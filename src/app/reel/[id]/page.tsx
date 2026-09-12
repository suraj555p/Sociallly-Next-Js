// app/reel/[id]/page.tsx
import { getReelById } from "@/actions/reel.action";
import { getDbUserId } from "@/actions/user.action"; // yeh already tumhare paas hai (deleteReel mein use ho raha tha)
import SingleReelView from "@/components/SingleReelView";
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

  const currentDbUserId = await getDbUserId();

  return <SingleReelView reel={reel} currentDbUserId={currentDbUserId} />;
}

export default ReelPage;