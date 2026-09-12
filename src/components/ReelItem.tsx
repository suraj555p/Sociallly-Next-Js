// src/components/ReelItem.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Trash2Icon,
  XIcon,
  PlayIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {
  toggleReelLike,
  createReelComment,
  deleteReelComment,
  deleteReel,
  getReels,
} from "@/actions/reel.action";

import { toggleFollow } from "@/actions/user.action";

import toast from "react-hot-toast";

type Reel = Awaited<ReturnType<typeof getReels>>[number];

interface ReelItemProps {
  reel: Reel;
  currentDbUserId: string | null;
}

export default function ReelItem({ reel, currentDbUserId }: ReelItemProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* ----------------------------- LIKE ----------------------------- */

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    reel._count.likes
  );
  const [isLiking, setIsLiking] = useState(false);

  /* ---------------------------- FOLLOW ---------------------------- */

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] =
    useState(false);

  /* --------------------------- COMMENTS --------------------------- */

  const [showComments, setShowComments] = useState(false);

  const [commentText, setCommentText] = useState("");

  const [comments, setComments] = useState(
    reel.comments
  );

  const [isCommenting, setIsCommenting] =
    useState(false);

  const [isDeletingComment, setIsDeletingComment] =
    useState<string | null>(null);

  /* ----------------------------- DELETE REEL ----------------------------- */

  const [isDeletingReel, setIsDeletingReel] = useState(false);

  /* ----------------------------- VIDEO ---------------------------- */

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isOwnReel = Boolean(
    currentDbUserId && currentDbUserId === reel.author.id
  );

  /* ---------------------------------------------------------------- */
  /*                              LIKE                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!isLoaded) return;

    setIsLiked(
      reel.likes.some(
        (like) => like.userId === user?.id
      )
    );
  }, [isLoaded, user?.id, reel.likes]);

  /* ---------------------------------------------------------------- */
  /*                         VIDEO AUTOPLAY                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.6
          ) {
            video
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => {});
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.2, 0.6, 0.9],
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*                            MUTE                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = isMuted;
  }, [isMuted]);

  /* ---------------------------------------------------------------- */
  /*                            LIKE                                  */
  /* ---------------------------------------------------------------- */

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like reels");
      return;
    }

    if (isLiking) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;

    const nextLiked = !previousLiked;

    setIsLiking(true);

    setIsLiked(nextLiked);

    setLikeCount((count) =>
      previousLiked ? count - 1 : count + 1
    );

    try {
      const result = await toggleReelLike(
        reel.id
      );

      if (!result.success) {
        setIsLiked(previousLiked);
        setLikeCount(previousCount);

        toast.error(
          "Couldn't update like, try again"
        );
      }
    } catch {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);

      toast.error(
        "Couldn't update like, try again"
      );
    } finally {
      setIsLiking(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                           FOLLOW                                 */
  /* ---------------------------------------------------------------- */

  const handleFollow = async () => {
    if (!user) {
      toast.error(
        "Please login to follow users"
      );
      return;
    }

    if (isFollowLoading) return;

    const previousFollowing = isFollowing;

    setIsFollowLoading(true);

    setIsFollowing(!previousFollowing);

    try {
      const result = await toggleFollow(
        reel.author.id
      );

      if (result?.success) {
        toast.success(
          previousFollowing
            ? "Unfollowed"
            : "Following"
        );
      } else {
        setIsFollowing(previousFollowing);

        toast.error(
          "Couldn't update follow status"
        );
      }
    } catch {
      setIsFollowing(previousFollowing);

      toast.error(
        "Couldn't update follow status"
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                         CREATE COMMENT                            */
  /* ---------------------------------------------------------------- */

  const handleComment = async () => {
    if (
      !user ||
      !commentText.trim() ||
      isCommenting
    ) {
      return;
    }

    setIsCommenting(true);

    try {
      const result = await createReelComment(
        reel.id,
        commentText.trim()
      );

      if (
        result.success &&
        result.comment
      ) {
        setComments((previous) => [
          ...previous,
          result.comment!,
        ]);

        setCommentText("");

        toast.success("Comment added");
      } else {
        toast.error(
          "Couldn't add comment, try again"
        );
      }
    } catch {
      toast.error(
        "Couldn't add comment, try again"
      );
    } finally {
      setIsCommenting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                         DELETE COMMENT                            */
  /* ---------------------------------------------------------------- */

  const handleDeleteComment = async (
    commentId: string
  ) => {
    if (!user) {
      toast.error("Please login");
      return;
    }

    if (isDeletingComment) return;

    setIsDeletingComment(commentId);

    try {
      const result =
        await deleteReelComment(commentId);

      if (result.success) {
        setComments((previous) =>
          previous.filter(
            (comment) =>
              comment.id !== commentId
          )
        );

        toast.success("Comment deleted");
      } else {
        toast.error(
          result.error ||
            "Couldn't delete comment"
        );
      }
    } catch {
      toast.error(
        "Couldn't delete comment"
      );
    } finally {
      setIsDeletingComment(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                          DELETE REEL                              */
  /* ---------------------------------------------------------------- */

  const handleDeleteReel = async () => {
    if (!isOwnReel || isDeletingReel) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this reel? This cannot be undone."
    );

    if (!confirmed) return;

    setIsDeletingReel(true);

    try {
      const result = await deleteReel(reel.id);

      if (result.success) {
        toast.success("Reel deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Couldn't delete reel");

        setIsDeletingReel(false);
      }
    } catch {
      toast.error("Couldn't delete reel");

      setIsDeletingReel(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                           DOWNLOAD                               */
  /* ---------------------------------------------------------------- */

  const handleDownload = async () => {
    if (!reel.videoUrl) {
      toast.error(
        "Video URL not available"
      );

      return;
    }

    try {
      const response = await fetch(
        reel.videoUrl
      );

      if (!response.ok) {
        throw new Error(
          "Download failed"
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = blobUrl;

      anchor.download = `reel-${reel.id}.mp4`;

      document.body.appendChild(anchor);

      anchor.click();

      document.body.removeChild(anchor);

      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error(
        "Direct download blocked, opening video"
      );

      window.open(
        reel.videoUrl,
        "_blank"
      );
    }
  };

  /* ---------------------------------------------------------------- */
  /*                         PLAY / PAUSE                             */
  /* ---------------------------------------------------------------- */

  const togglePlayPause = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*                              MUTE                                */
  /* ---------------------------------------------------------------- */

  const toggleMute = (
    event?: React.MouseEvent
  ) => {
    event?.stopPropagation();

    setIsMuted(
      (previous) => !previous
    );
  };

  /* ---------------------------------------------------------------- */
  /*                         COMMENTS TOGGLE                          */
  /* ---------------------------------------------------------------- */

  const toggleComments = () => {
    setShowComments(
      (previous) => !previous
    );
  };

  return (
    <div className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center overflow-hidden bg-black text-white">

      {/* ============================================================ */}
      {/*                           VIDEO                              */}
      {/* ============================================================ */}

      <div className="relative h-full w-full overflow-hidden bg-black">

        <video
          ref={videoRef}
          src={reel.videoUrl ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onClick={togglePlayPause}
        />

        {/* TOP GRADIENT */}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />

        {/* BOTTOM GRADIENT */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[48%] bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        {/* ======================================================== */}
        {/*                         TOP BAR                           */}
        {/* ======================================================== */}

        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Reels
            </h1>
          </div>

          <div className="flex items-center gap-3">

            {/* DELETE - sirf apni reel par dikhega */}

            {isOwnReel && (
              <button
                onClick={handleDeleteReel}
                disabled={isDeletingReel}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-red-600/80 active:scale-90 disabled:opacity-60"
                aria-label="Delete reel"
                title="Delete reel"
              >
                {isDeletingReel ? (
                  <Loader2Icon className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2Icon className="h-5 w-5" />
                )}
              </button>
            )}

            {/* MUTE */}

            <button
              onClick={(event) =>
                toggleMute(event)
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60 active:scale-90"
              aria-label={
                isMuted
                  ? "Unmute"
                  : "Mute"
              }
            >
              {isMuted ? (
                <VolumeXIcon className="h-5 w-5" />
              ) : (
                <Volume2Icon className="h-5 w-5" />
              )}
            </button>

            {/* MORE */}

            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60 active:scale-90"
              aria-label="More options"
            >
              <MoreHorizontalIcon className="h-5 w-5" />
            </button>

          </div>
        </div>

        {/* ======================================================== */}
        {/*                    PLAY INDICATOR                         */}
        {/* ======================================================== */}

        {!isPlaying && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 z-20 flex items-center justify-center"
            aria-label="Play video"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-md shadow-xl">
              <PlayIcon className="ml-1 h-8 w-8 fill-white" />
            </span>
          </button>
        )}

        {/* ======================================================== */}
        {/*                    RIGHT ACTION BAR                       */}
        {/* ======================================================== */}

        <div className="absolute bottom-28 right-3 z-30 flex flex-col items-center gap-5">

          {/* LIKE */}

          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex flex-col items-center gap-1 transition active:scale-90 disabled:opacity-60"
            aria-label="Like reel"
          >
            <HeartIcon
              className={`h-8 w-8 drop-shadow-lg transition-all duration-200 ${
                isLiked
                  ? "scale-110 fill-red-500 text-red-500"
                  : "text-white"
              }`}
              strokeWidth={1.8}
            />

            <span className="text-xs font-semibold drop-shadow-md">
              {likeCount}
            </span>
          </button>

          {/* COMMENTS */}

          <button
            onClick={toggleComments}
            className="flex flex-col items-center gap-1 transition active:scale-90"
            aria-label="Comments"
          >
            <MessageCircleIcon
              className="h-8 w-8 drop-shadow-lg"
              strokeWidth={1.8}
            />

            <span className="text-xs font-semibold drop-shadow-md">
              {comments.length}
            </span>
          </button>

          {/* SHARE */}

          <button
            onClick={() => {
              if (
                typeof navigator !==
                  "undefined" &&
                navigator.share
              ) {
                navigator
                  .share({
                    title:
                      "Check out this reel",
                    url:
                      window.location.href,
                  })
                  .catch(() => {});
              } else {
                navigator.clipboard
                  ?.writeText(
                    window.location.href
                  );

                toast.success(
                  "Link copied"
                );
              }
            }}
            className="transition active:scale-90"
            aria-label="Share reel"
          >
            <SendIcon
              className="h-8 w-8 drop-shadow-lg"
              strokeWidth={1.8}
            />
          </button>

          {/* SAVE */}

          <button
            className="transition active:scale-90"
            aria-label="Save reel"
          >
            <BookmarkIcon
              className="h-8 w-8 drop-shadow-lg"
              strokeWidth={1.8}
            />
          </button>

          {/* DOWNLOAD */}

          <button
            onClick={handleDownload}
            className="transition active:scale-90"
            aria-label="Download reel"
          >
            <DownloadIcon
              className="h-7 w-7 drop-shadow-lg"
              strokeWidth={1.8}
            />
          </button>

          {/* AUTHOR AVATAR */}

          <Avatar className="mt-1 h-9 w-9 border border-white shadow-lg">
            <AvatarImage
              src={
                reel.author.image ??
                undefined
              }
              className="object-cover"
            />

            <AvatarFallback className="bg-gray-800 text-xs">
              {reel.author.username
                ?.charAt(0)
                .toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

        </div>

        {/* ======================================================== */}
        {/*                       BOTTOM INFO                         */}
        {/* ======================================================== */}

        <div className="absolute bottom-40 left-0 right-16 z-20 p-4 pb-[max(18px,env(safe-area-inset-bottom))]">

          {/* AUTHOR */}

          <div className="mb-3 flex items-center gap-2">

            <Avatar className="h-9 w-9 border border-white shadow-md">
              <AvatarImage
                src={
                  reel.author.image ??
                  undefined
                }
              />

              <AvatarFallback className="bg-gray-700 text-xs">
                {reel.author.username
                  ?.charAt(0)
                  .toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <span className="text-sm font-semibold drop-shadow-md">
              @{reel.author.username}
            </span>

            {!isOwnReel && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleFollow}
                disabled={
                  isFollowLoading
                }
                className="ml-1 h-7 rounded-md border-white/70 bg-transparent px-3 text-xs font-semibold text-white hover:bg-white/10 hover:text-white"
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

          {/* CAPTION */}

          {reel.caption && (
            <p className="mb-3 max-w-[90%] text-sm leading-5 text-white drop-shadow-md line-clamp-2">
              {reel.caption}
            </p>
          )}

          {/* ORIGINAL AUDIO */}

          <div className="flex max-w-[90%] items-center gap-2 text-xs text-white/90">

            <div className="flex h-3 items-end gap-[2px]">
              <span className="h-2 w-[2px] animate-pulse rounded-full bg-white" />
              <span className="h-3 w-[2px] animate-pulse rounded-full bg-white" />
              <span className="h-1.5 w-[2px] animate-pulse rounded-full bg-white" />
              <span className="h-2.5 w-[2px] animate-pulse rounded-full bg-white" />
            </div>

            <span className="truncate">
              Original audio · @
              {reel.author.username}
            </span>

          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/*                       COMMENTS OVERLAY                        */}
      {/* ============================================================ */}

      <div
        className={`fixed inset-0 z-[100] ${
          showComments
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
      >

        {/* BACKDROP */}

        <div
          onClick={() =>
            setShowComments(false)
          }
          className={`absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${
            showComments
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* ======================================================== */}
        {/*                  TOP COMMENTS SHEET                       */}
        {/* ======================================================== */}

        <div
          onClick={(event) =>
            event.stopPropagation()
          }
          className={`absolute left-0 right-0 top-0 mx-auto flex h-[82dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-b-[24px] bg-white text-black shadow-2xl transition-transform duration-300 ease-out dark:bg-[#121212] dark:text-white ${
            showComments
              ? "translate-y-0"
              : "-translate-y-full"
          }`}
        >

          {/* HEADER */}

          <div className="relative flex shrink-0 items-center justify-center border-b border-gray-200 px-4 pb-4 pt-5 dark:border-white/10">

            {/* HANDLE */}

            <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300 dark:bg-white/20" />

            <h3 className="text-sm font-semibold">
              Comments
            </h3>

            <span className="absolute left-4 text-xs text-gray-500 dark:text-gray-400">
              {comments.length}
            </span>

            {/* CLOSE */}

            <button
              onClick={() =>
                setShowComments(false)
              }
              className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
              aria-label="Close comments"
            >
              <XIcon className="h-5 w-5" />
            </button>

          </div>

          {/* ====================================================== */}
          {/*                      COMMENT LIST                       */}
          {/* ====================================================== */}

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">

            {comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-300 dark:border-white/20">
                  <MessageCircleIcon className="h-8 w-8 text-gray-400" />
                </div>

                <p className="text-base font-semibold">
                  No comments yet
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start the conversation.
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {comments.map(
                  (comment) => {
                    const isMyComment =
                      user?.id ===
                      comment.author.id;

                    const isDeleting =
                      isDeletingComment ===
                      comment.id;

                    return (
                      <div
                        key={comment.id}
                        className="flex gap-3"
                      >

                        {/* AVATAR */}

                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={
                              comment
                                .author
                                .image ??
                              undefined
                            }
                          />

                          <AvatarFallback className="bg-gray-200 text-xs font-semibold dark:bg-white/10">
                            {comment.author.username
                              ?.charAt(0)
                              .toUpperCase() ??
                              "U"}
                          </AvatarFallback>
                        </Avatar>

                        {/* COMMENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="flex items-center gap-2">

                                <span className="text-xs font-semibold">
                                  @
                                  {
                                    comment
                                      .author
                                      .username
                                  }
                                </span>

                                <span className="text-[10px] text-gray-400">
                                  {new Date(
                                    comment.createdAt
                                  ).toLocaleDateString()}
                                </span>

                              </div>

                              <p className="mt-1 break-words text-sm leading-5 text-gray-800 dark:text-gray-200">
                                {
                                  comment.content
                                }
                              </p>

                            </div>

                            {/* DELETE */}

                            {isMyComment && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.id
                                  )
                                }
                                disabled={
                                  isDeleting
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:opacity-50 dark:hover:bg-red-500/10"
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                {isDeleting ? (
                                  <Loader2Icon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2Icon className="h-4 w-4" />
                                )}
                              </button>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* ====================================================== */}
          {/*                    COMMENT INPUT                        */}
          {/* ====================================================== */}

          {user ? (
            <div className="shrink-0 border-t border-gray-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#121212]">

              <div className="flex items-center gap-2">

                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={user.imageUrl}
                  />

                  <AvatarFallback>
                    U
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 items-center rounded-full bg-gray-100 px-4 py-2.5 dark:bg-white/10">

                  <input
                    type="text"
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        handleComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    disabled={
                      isCommenting
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
                  />

                  <button
                    onClick={
                      handleComment
                    }
                    disabled={
                      !commentText.trim() ||
                      isCommenting
                    }
                    className="ml-2 text-blue-500 transition active:scale-90 disabled:opacity-30"
                    aria-label="Post comment"
                  >
                    {isCommenting ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendIcon className="h-4 w-4" />
                    )}
                  </button>

                </div>

              </div>

            </div>
          ) : (
            <div className="shrink-0 border-t border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-white/10">
              Login to comment
            </div>
          )}

        </div>
      </div>
    </div>
  );
}