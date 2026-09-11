// src/components/ReelItem.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  HeartIcon,
  MessageCircleIcon,
  BookmarkIcon,
  DownloadIcon,
  SendIcon,
  Volume2Icon,
  VolumeXIcon,
  Loader2Icon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toggleReelLike, createReelComment, getReels } from "@/actions/reel.action";
import { toggleFollow } from "@/actions/user.action";
import toast from "react-hot-toast";

type Reel = Awaited<ReturnType<typeof getReels>>[number];

interface ReelItemProps {
  reel: Reel;
}

export default function ReelItem({ reel }: ReelItemProps) {
  const { user, isLoaded } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel._count.likes);
  const [isLiking, setIsLiking] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(reel.comments);
  const [isCommenting, setIsCommenting] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isOwnReel = user?.id === reel.author.id;

  useEffect(() => {
    if (!isLoaded) return;
    setIsLiked(reel.likes.some((like) => like.userId === user?.id));
  }, [isLoaded, user?.id, reel.likes]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like reels");
      return;
    }

    if (isLiking) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;

    setIsLiking(true);
    setIsLiked(nextLiked);
    setLikeCount((c) => (prevLiked ? c - 1 : c + 1));

    try {
      const result = await toggleReelLike(reel.id);
      if (!result.success) {
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
        toast.error("Couldn't update like, try again");
      }
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Couldn't update like, try again");
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }
    if (isFollowLoading) return;

    const prevFollowing = isFollowing;
    setIsFollowLoading(true);
    setIsFollowing(!prevFollowing);

    try {
      const result = await toggleFollow(reel.author.id);
      if (result?.success) {
        toast.success(prevFollowing ? "Unfollowed" : "Following");
      } else {
        setIsFollowing(prevFollowing);
        toast.error("Couldn't update follow status");
      }
    } catch {
      setIsFollowing(prevFollowing);
      toast.error("Couldn't update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const result = await createReelComment(reel.id, commentText.trim());
      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!]);
        setCommentText("");
        toast.success("Comment added");
      } else {
        toast.error("Couldn't add comment, try again");
      }
    } catch {
      toast.error("Couldn't add comment, try again");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDownload = async () => {
    if (!reel.videoUrl) {
      toast.error("Video URL not available");
      return;
    }

    try {
      const response = await fetch(reel.videoUrl);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `reel-${reel.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Direct download blocked, opening video in a new tab");
      if (reel.videoUrl) {
        window.open(reel.videoUrl, "_blank");
      }
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  // Comment icon: reel ko shrink karo aur comment bar kholo.
  // Dubara dabane ya bahar/close pe click karne pe wapas normal size.
  const toggleComments = () => {
    setShowComments((prev) => !prev);
  };

  return (
    <div className="relative h-screen w-full snap-start snap-always bg-black flex items-center justify-center overflow-hidden">
      {/* Video Container - showComments true hote hi shrink + upar shift hota hai,
          taaki neeche comment bar ke liye jagah bane. Transform GPU-accelerated
          hai isliye smooth animate hota hai bina layout thrash ke. */}
      <div
        className={`relative w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden shadow-2xl
                   transition-transform duration-300 ease-out origin-center
                   h-[65vh] max-h-[560px]
                   sm:h-[70vh] sm:max-h-[600px]
                   md:h-[75vh] md:max-h-[680px]
                   ${showComments ? "scale-[0.72] -translate-y-[14%]" : "scale-100 translate-y-0"}`}
      >
        <video
          ref={videoRef}
          src={reel.videoUrl ?? undefined}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlayPause}
        />

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer
                       transition-all duration-300"
            onClick={togglePlayPause}
          >
            <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg
                           hover:scale-110 transition-transform">
              <svg className="h-10 w-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md
                     flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          {isMuted ? (
            <VolumeXIcon className="h-5 w-5 text-white" />
          ) : (
            <Volume2Icon className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Right Side Action Bar - Upper Center, Rightmost */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-20">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="group flex flex-col items-center gap-1 disabled:opacity-60 transition-opacity"
          >
            <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center
                           group-hover:bg-black/70 transition-colors">
              <HeartIcon
                className={`h-7 w-7 transition-colors ${
                  isLiked ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">{likeCount}</span>
          </button>

          {/* Comment - shrink toggle */}
          <button
            onClick={toggleComments}
            className="group flex flex-col items-center gap-1"
          >
            <div
              className={`h-12 w-12 rounded-full backdrop-blur-md flex items-center justify-center
                         transition-colors ${
                           showComments ? "bg-white/90" : "bg-black/50 group-hover:bg-black/70"
                         }`}
            >
              <MessageCircleIcon
                className={`h-7 w-7 ${showComments ? "text-black" : "text-white"}`}
              />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">{comments.length}</span>
          </button>

          {/* Save/Bookmark */}
          <button className="group flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center
                           group-hover:bg-black/70 transition-colors">
              <BookmarkIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">Save</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="group flex flex-col items-center gap-1"
          >
            <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center
                           group-hover:bg-black/70 transition-colors">
              <DownloadIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">Download</span>
          </button>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
          <div className="flex items-end gap-3">
            <Avatar className="h-11 w-11 border-2 border-white/90 shadow-md">
              <AvatarImage src={reel.author.image ?? undefined} />
              <AvatarFallback className="text-sm font-semibold">
                {reel.author.username?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-sm drop-shadow-md">
                  @{reel.author.username}
                </span>
                {!isOwnReel && (
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className="h-7 text-xs rounded-full px-3 bg-white/20 hover:bg-white/30 border-0"
                  >
                    {isFollowLoading ? (
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </div>
              {reel.caption && (
                <p className="mt-1 text-sm text-white/90 line-clamp-2 drop-shadow-md">{reel.caption}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section - reel ke shrink hone ke saath saath neeche se slide-up hota hai */}
      <div
        className={`absolute inset-0 z-50 flex items-end transition-colors duration-300
                   ${showComments ? "bg-black/60 backdrop-blur-sm pointer-events-auto" : "bg-transparent pointer-events-none"}`}
        onClick={() => setShowComments(false)}
      >
        <div
          className={`w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950
                     rounded-t-3xl p-5 overflow-y-auto shadow-2xl
                     transition-transform duration-300 ease-out
                     ${showComments ? "translate-y-0 max-h-[55%]" : "translate-y-full max-h-[55%]"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Comments ({comments.length})
            </h3>
            {/* Close button bhi wapas normal size karta hai */}
            <button
              onClick={() => setShowComments(false)}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={comment.author.image ?? undefined} />
                  <AvatarFallback className="text-xs font-semibold">
                    {comment.author.username?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      @{comment.author.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border border-gray-300 dark:border-gray-700
                           px-4 py-2.5 text-sm bg-white dark:bg-gray-800
                           text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                disabled={isCommenting}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isCommenting}
                className="h-10 w-10 rounded-full p-0 flex items-center justify-center
                           bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                           transition-all shadow-md"
              >
                {isCommenting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <SendIcon className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
