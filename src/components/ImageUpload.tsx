"use client";

import { UploadDropzone } from "@/utils/uploadthing";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage" | "postVideo" | "reelVideo"; 
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  console.log(endpoint);
  console.log(value);

  if (value) {
    const isVideo = endpoint === "postVideo" || endpoint === "reelVideo";

    return (
      <div className="relative size-40">
        {isVideo ? (
          <video
            src={value}
            controls
            className="size-40 rounded-md object-cover"
          />
        ) : (
          <img
            src={value}
            alt="Upload"
            className="size-40 rounded-md object-cover"
          />
        )}

        <button
          onClick={() => onChange("")}
          className="absolute right-0 top-0 rounded-full bg-red-500 p-1 shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        console.log("Upload response:", res);

        const url = res[0]?.ufsUrl;

        if (url) {
          onChange(url);
        }
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
      }}
    />
  );
}

export default ImageUpload;