"use client";

import {
  getProfileByUsername,
  getUserPosts,
  getUserReels,
  updateProfile,
} from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  PlayIcon,
  VideoIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;
type Reels = Awaited<ReturnType<typeof getUserReels>>;

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  likedPosts: Posts;
  reels: Reels;
  likedReels: Reels;
  isFollowing: boolean;
}

/* =========================================================
   REEL THUMBNAIL
========================================================= */

function ReelThumbnail({
  reel,
}: {
  reel: Reels[number];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    router.push(`/reel/${reel.id}`);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);

    const video = videoRef.current;

    if (!video) return;

    video.currentTime = 0;

    video.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovering(false);

    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[9/16] bg-muted rounded-sm overflow-hidden group cursor-pointer"
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={reel.videoUrl ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
      />

      {/* DARK OVERLAY */}
      <div
        className={`absolute inset-0 transition-colors ${
          isHovering ? "bg-black/20" : "bg-black/10"
        }`}
      />

      {/* PLAY ICON */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isHovering ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="bg-black/50 rounded-full p-3">
          <PlayIcon className="size-7 text-white fill-white" />
        </div>
      </div>

      {/* LIKES */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium drop-shadow">
        <HeartIcon className="size-3 fill-white" />
        {reel._count.likes}
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE PAGE
========================================================= */

function ProfilePageClient({
  isFollowing: initialIsFollowing,
  likedPosts,
  posts,
  reels,
  likedReels,
  user,
}: ProfilePageClientProps) {
  const { user: currentUser } = useUser();

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [isFollowing, setIsFollowing] =
    useState(initialIsFollowing);

  const [isUpdatingFollow, setIsUpdatingFollow] =
    useState(false);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  const handleEditSubmit = async () => {
    try {
      const formData = new FormData();

      Object.entries(editForm).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await updateProfile(formData);

      if (result.success) {
        setShowEditDialog(false);

        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    }
  };

  /* =========================================================
     FOLLOW
  ========================================================= */

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      setIsUpdatingFollow(true);

      await toggleFollow(user.id);

      setIsFollowing((prev) => !prev);
    } catch (error) {
      console.error(error);

      toast.error("Failed to update follow status");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  /* =========================================================
     OWN PROFILE
  ========================================================= */

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0]?.emailAddress.split("@")[0] ===
      user.username;

  /* =========================================================
     DATE
  ========================================================= */

  const formattedDate = format(
    new Date(user.createdAt),
    "MMMM yyyy"
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">

        {/* =====================================================
            PROFILE CARD
        ===================================================== */}

        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">

                {/* AVATAR */}
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={user.image ?? "/avatar.png"}
                  />
                </Avatar>

                {/* NAME */}
                <h1 className="mt-4 text-2xl font-bold">
                  {user.name ?? user.username}
                </h1>

                {/* USERNAME */}
                <p className="text-muted-foreground">
                  @{user.username}
                </p>

                {/* BIO */}
                {user.bio && (
                  <p className="mt-2 text-sm">
                    {user.bio}
                  </p>
                )}

                {/* =================================================
                    PROFILE STATS
                ================================================= */}

                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">

                    {/* FOLLOWING */}
                    <div>
                      <div className="font-semibold">
                        {user._count.following.toLocaleString()}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Following
                      </div>
                    </div>

                    <Separator orientation="vertical" />

                    {/* FOLLOWERS */}
                    <div>
                      <div className="font-semibold">
                        {user._count.followers.toLocaleString()}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Followers
                      </div>
                    </div>

                    <Separator orientation="vertical" />

                    {/* POSTS */}
                    <div>
                      <div className="font-semibold">
                        {user._count.posts.toLocaleString()}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Posts
                      </div>
                    </div>

                    <Separator orientation="vertical" />

                    {/* REELS */}
                    <div>
                      <div className="font-semibold">
                        {user._count.reels.toLocaleString()}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Reels
                      </div>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    FOLLOW / EDIT BUTTON
                ================================================= */}

                {!currentUser ? (
                  <SignInButton mode="modal">
                    <Button className="w-full mt-4">
                      Follow
                    </Button>
                  </SignInButton>
                ) : isOwnProfile ? (
                  <Button
                    className="w-full mt-4"
                    onClick={() =>
                      setShowEditDialog(true)
                    }
                  >
                    <EditIcon className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    className="w-full mt-4"
                    onClick={handleFollow}
                    disabled={isUpdatingFollow}
                    variant={
                      isFollowing
                        ? "outline"
                        : "default"
                    }
                  >
                    {isFollowing
                      ? "Unfollow"
                      : "Follow"}
                  </Button>
                )}

                {/* =================================================
                    LOCATION / WEBSITE / JOINED
                ================================================= */}

                <div className="w-full mt-6 space-y-2 text-sm">

                  {/* LOCATION */}
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-4 mr-2" />
                      {user.location}
                    </div>
                  )}

                  {/* WEBSITE */}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-4 mr-2" />

                      
                        <a href={
                          user.website.startsWith("http")
                            ? user.website
                            : `https://${user.website}`
                        }
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}

                  {/* JOINED */}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {formattedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}

        <Tabs
          defaultValue="posts"
          className="w-full"
        >

          {/* TAB LIST */}

          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">

            {/* POSTS TAB */}
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <FileTextIcon className="size-4" />
              Posts
            </TabsTrigger>

            {/* REELS TAB */}
            <TabsTrigger
              value="reels"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <VideoIcon className="size-4" />
              Reels
            </TabsTrigger>

            {/* LIKES TAB */}
            <TabsTrigger
              value="likes"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <HeartIcon className="size-4" />
              Likes
            </TabsTrigger>
          </TabsList>

          {/* ===================================================
              POSTS
          =================================================== */}

          <TabsContent
            value="posts"
            className="mt-6"
          >
            <div className="space-y-6">

              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    dbUserId={user.id}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No posts yet
                </div>
              )}

            </div>
          </TabsContent>

          {/* ===================================================
              REELS
          =================================================== */}

          <TabsContent
            value="reels"
            className="mt-6"
          >
            {reels.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">

                {reels.map((reel) => (
                  <ReelThumbnail
                    key={reel.id}
                    reel={reel}
                  />
                ))}

              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reels yet
              </div>
            )}
          </TabsContent>

          {/* ===================================================
              LIKES
          =================================================== */}

          <TabsContent
            value="likes"
            className="mt-6"
          >
            <div className="space-y-6">

              {/* LIKED POSTS */}

              {likedPosts.length > 0 ? (
                likedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    dbUserId={user.id}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No liked posts to show
                </div>
              )}

              {/* LIKED REELS */}

              {likedReels.length > 0 && (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">

                  {likedReels.map((reel) => (
                    <ReelThumbnail
                      key={reel.id}
                      reel={reel}
                    />
                  ))}

                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>

        {/* =====================================================
            EDIT PROFILE DIALOG
        ===================================================== */}

        <Dialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <DialogContent className="sm:max-w-[500px]">

            <DialogHeader>
              <DialogTitle>
                Edit Profile
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* NAME */}

              <div className="space-y-2">
                <Label>Name</Label>

                <Input
                  name="name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your name"
                />
              </div>

              {/* BIO */}

              <div className="space-y-2">
                <Label>Bio</Label>

                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      bio: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                  placeholder="Tell us about yourself"
                />
              </div>

              {/* LOCATION */}

              <div className="space-y-2">
                <Label>Location</Label>

                <Input
                  name="location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      location: e.target.value,
                    })
                  }
                  placeholder="Where are you based?"
                />
              </div>

              {/* WEBSITE */}

              <div className="space-y-2">
                <Label>Website</Label>

                <Input
                  name="website"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      website: e.target.value,
                    })
                  }
                  placeholder="Your personal website"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3">

              <DialogClose asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button onClick={handleEditSubmit}>
                Save Changes
              </Button>

            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default ProfilePageClient;