import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserLikedReels,
  getUserPosts,
  getUserReels,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const user = await getProfileByUsername(username);
  if (!user) return;

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}

async function ProfilePageServer({ params }: Props) {
  const { username } = await params;
  const user = await getProfileByUsername(username);

  if (!user) notFound();

  const [posts, likedPosts, reels, likedReels, isCurrentUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    getUserReels(user.id),
    getUserLikedReels(user.id),
    isFollowing(user.id),
  ]);

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      reels={reels}
      likedReels={likedReels}
      isFollowing={isCurrentUserFollowing}
    />
  );
}
export default ProfilePageServer;