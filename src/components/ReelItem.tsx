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
} from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toggleReelLike, createReelComment } from "@/actions/reel.action";
import { toggleFollow } from "@/actions/user.action";
import { getReels } from "@/actions/reel.action";
import toast from "react-hot-toast";

type Reel = Awaited<ReturnType<typeof getReels>>[number];

interface ReelItemProps {
  reel: Reel;
}

export default function ReelItem({ reel }: ReelItemProps) {
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLiked, setIsLiked] = useState(
    reel.likes.some((like) => like.userId === user?.id)
  );
  const [likeCount, setLikeCount] = useState(reel._count.likes);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(reel.comments);
  const [isPlaying, setIsPlaying] = useState(false);
  // Browsers autoplay ONLY muted videos, isliye start muted=true
  // aur user ko ek button se unmute karne do
  const [isMuted, setIsMuted] = useState(true);

  const isOwnReel = user?.id === reel.author.id;

  // Auto-play jab reel visible ho
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

  // isMuted state ko actual <video> element ke saath sync rakho
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

    const result = await toggleReelLike(reel.id);
    if (result.success) {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    const result = await toggleFollow(reel.author.id);
    if (result.success) {
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed" : "Following");
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;

    const result = await createReelComment(reel.id, commentText);
    if (result.success && result.comment) {
      setComments([...comments, result.comment]);
      setCommentText("");
      toast.success("Comment added");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = reel.videoUrl;
    a.download = `reel-${reel.id}.mp4`;
    a.target = "_blank";
    a.click();
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
    e.stopPropagation(); // video ka click (play/pause) trigger na ho
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="relative h-screen w-full snap-start snap-always bg-black flex items-center justify-center overflow-hidden">
      {/* Video Container - mobile pe chhota fixed size, desktop pe thoda bada */}
      <div
        className="relative w-full max-w-[380px] mx-auto rounded-xl overflow-hidden
                   h-[65vh] max-h-[560px]
                   sm:h-[70vh] sm:max-h-[600px]
                   md:h-[75vh] md:max-h-[680px]"
      >
        <video
          ref={videoRef}
          src={reel.videoUrl}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlayPause}
        />

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlayPause}
          >
            <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center">
              <svg className="h-8 w-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeXIcon className="h-5 w-5 text-white" />
          ) : (
            <Volume2Icon className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Bottom Info Bar - ab video container ke andar hai, taaki bade screen pe bhi sahi position pe rahe */}
        <div className="absolute left-0 right-0 bottom-0 flex items-end gap-3 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={reel.author.image ?? "/avatar.png"} />
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">@{reel.author.username}</span>
              {!isOwnReel && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  className="h-7 text-xs"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
            {reel.caption && (
              <p className="mt-1 text-sm text-white line-clamp-2">{reel.caption}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Action Bar */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-10">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center">
          <HeartIcon
            className={`h-8 w-8 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
          />
          <span className="text-xs text-white">{likeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center"
        >
          <MessageCircleIcon className="h-8 w-8 text-white" />
          <span className="text-xs text-white">{comments.length}</span>
        </button>

        {/* Save/Bookmark */}
        <button className="flex flex-col items-center">
          <BookmarkIcon className="h-8 w-8 text-white" />
          <span className="text-xs text-white">Save</span>
        </button>

        {/* Download */}
        <button onClick={handleDownload} className="flex flex-col items-center">
          <DownloadIcon className="h-8 w-8 text-white" />
          <span className="text-xs text-white">Download</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="absolute inset-0 bg-black/50 z-50" onClick={() => setShowComments(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-white dark:bg-gray-900 rounded-t-2xl p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">@{comment.author.username}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-full border px-4 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                />
                <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
