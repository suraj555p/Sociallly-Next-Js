
"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createReel(caption: string, videoUrl: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!videoUrl?.trim()) {
      return { success: false, error: "Video is required" };
    }

    const reel = await prisma.reel.create({
      data: {
        caption: caption?.trim() || null,
        videoUrl: videoUrl.trim(),
        authorId: userId,
      },
    });

    revalidatePath("/reels");

    return {
      success: true,
      reel,
    };
  } catch (error) {
    console.error("Failed to create reel:", error);

    return {
      success: false,
      error: "Failed to create reel",
    };
  }
}

export async function getReels() {
  try {
    const reels = await prisma.reel.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return reels;
  } catch (error) {
    console.error("Error in getReels:", error);
    throw new Error("Failed to fetch reels");
  }
}

export async function getReelById(reelId : string) {
  try {
    const reel = await prisma.reel.findUnique({
      where: {
        id: reelId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!reel) {
      throw new Error("Reel not found");
    }

    return reel;
  } catch (error) {
    console.error("Error in getReelById:", error);
    throw new Error("Failed to fetch reel");
  }
}

export async function toggleReelLike(reelId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existingLike = await prisma.reelLike.findUnique({
      where: {
        userId_reelId: {
          userId,
          reelId,
        },
      },
    });

    const reel = await prisma.reel.findUnique({
      where: {
        id: reelId,
      },
      select: {
        authorId: true,
      },
    });

    if (!reel) {
      throw new Error("Reel not found");
    }

    if (existingLike) {
      await prisma.reelLike.delete({
        where: {
          userId_reelId: {
            userId,
            reelId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.reelLike.create({
          data: {
            userId,
            reelId,
          },
        }),
        ...(reel.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "REEL_LIKE",
                  userId: reel.authorId,
                  creatorId: userId,
                  reelId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/reels");

    return { success: true };
  } catch (error) {
    console.error("Failed to toggle reel like:", error);

    return {
      success: false,
      error: "Failed to toggle reel like",
    };
  }
}

export async function createReelComment(
  reelId: string,
  content: string
) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!content?.trim()) {
      return {
        success: false,
        error: "Content is required",
      };
    }

    const reel = await prisma.reel.findUnique({
      where: {
        id: reelId,
      },
      select: {
        authorId: true,
      },
    });

    if (!reel) {
      throw new Error("Reel not found");
    }

    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.reelComment.create({
        data: {
          content: content.trim(),
          authorId: userId,
          reelId,
        },
      });

      if (reel.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "REEL_COMMENT",
            userId: reel.authorId,
            creatorId: userId,
            reelId,
            reelCommentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    // Author ke saath comment fetch karo
    const commentWithAuthor = await prisma.reelComment.findUnique({
      where: { id: comment.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/reels");

    return {
      success: true,
      comment: commentWithAuthor,
    };
  } catch (error) {
    console.error("Failed to create reel comment:", error);

    return {
      success: false,
      error: "Failed to create reel comment",
    };
  }
}

export async function deleteReel(reelId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const reel = await prisma.reel.findUnique({
      where: {
        id: reelId,
      },
      select: {
        authorId: true,
      },
    });

    if (!reel) {
      throw new Error("Reel not found");
    }

    if (reel.authorId !== userId) {
      throw new Error("Unauthorized - no delete permission");
    }

    await prisma.reel.delete({
      where: {
        id: reelId,
      },
    });

    revalidatePath("/reels");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete reel:", error);

    return {
      success: false,
      error: "Failed to delete reel",
    };
  }
}

export async function deleteReelComment(commentId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const comment = await prisma.reelComment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    // Sirf jis user ne comment kiya hai wahi delete kar sakta hai
    if (comment.authorId !== userId) {
      return {
        success: false,
        error: "You can only delete your own comment",
      };
    }

    await prisma.reelComment.delete({
      where: {
        id: commentId,
      },
    });

    revalidatePath("/reels");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete reel comment:", error);

    return {
      success: false,
      error: "Failed to delete reel comment",
    };
  }
}


