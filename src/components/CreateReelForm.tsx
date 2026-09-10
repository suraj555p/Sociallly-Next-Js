// src/components/CreateReelForm.tsx
"use client";

import { useState } from "react";
import { createReel } from "@/actions/reel.action";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CreateReelForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createReel(caption, videoUrl);

    if (result.success) {
      toast.success("Reel created successfully");
      setCaption("");
      setVideoUrl("");
      router.push("/reels");
    } else {
      toast.error(result.error ?? "Failed to create reel");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Caption</label>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={4}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Reel Video</label>
        <ImageUpload
          endpoint="reelVideo"
          value={videoUrl}
          onChange={setVideoUrl}
        />
      </div>

      <Button type="submit" disabled={loading || !videoUrl.trim()}>
        {loading ? "Creating..." : "Create Reel"}
      </Button>
    </form>
  );
}