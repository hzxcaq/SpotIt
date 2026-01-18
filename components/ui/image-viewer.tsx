"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export function ImageViewer({ open, onOpenChange, imageUrl, alt = "图片" }: ImageViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95">
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[95vh]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            aria-label="关闭图片查看器"
          >
            <X className="size-6" />
          </Button>
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
