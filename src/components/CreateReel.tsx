"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Loader2Icon, SendIcon, VideoIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createReel } from "../actions/reel.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";

interface CreateReelProps {
  onSuccess?: () => void;
}

function CreateReel({ onSuccess }: CreateReelProps) {
  const { user } = useUser();
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  const handleSubmit = async () => {
    if (!videoUrl) return;

    setIsUploading(true);
    try {
      const result = await createReel(caption, videoUrl);
      if (result?.success) {
        setCaption("");
        setVideoUrl("");
        setShowVideoUpload(false);
        toast.success("Reel created successfully");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to create reel:", error);
      toast.error("Failed to create reel");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="Add a caption..."
                className="min-h-[60px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isUploading}
              />
              
              {(showVideoUpload || videoUrl) && (
                <div className="border rounded-lg p-4">
                  <ImageUpload
                    endpoint="postVideo"
                    value={videoUrl}
                    onChange={(url) => {
                      setVideoUrl(url);
                      if (!url) setShowVideoUpload(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowVideoUpload(!showVideoUpload)}
                disabled={isUploading}
              >
                <VideoIcon className="size-4 mr-2" />
                Video
              </Button>
            </div>
            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={!videoUrl || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Create Reel
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreateReel;