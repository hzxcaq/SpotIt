"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CameraPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "capturing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setStatus("capturing");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setStatus("error");
      if (err instanceof Error) {
        if (err.message.includes("Permission")) {
          setErrorMessage("请允许访问摄像头以使用拍照功能");
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("无法启动摄像头");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          stopCamera();
          setStatus("success");

          // 将照片存储到 sessionStorage
          const reader = new FileReader();
          reader.onloadend = () => {
            sessionStorage.setItem("capturedPhoto", reader.result as string);
            setTimeout(() => {
              router.push("/items/new");
            }, 500);
          };
          reader.readAsDataURL(blob);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setErrorMessage("");
    startCamera();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/" onClick={stopCamera}>
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">拍照添加物品</h1>
            <p className="text-sm text-muted-foreground">拍摄物品照片快速添加</p>
          </div>
        </header>

        <div className="space-y-4">
          <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-lg bg-muted">
            {status === "capturing" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {status === "idle" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Camera className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">准备拍照</p>
              <Button onClick={startCamera}>
                <Camera className="size-4" />
                启动摄像头
              </Button>
            </div>
          )}

          {status === "capturing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-center text-sm text-muted-foreground">
                将物品对准画面中央
              </p>
              <Button onClick={capturePhoto} size="lg">
                <Camera className="size-5" />
                拍照
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="size-10 text-green-500" />
              <p className="text-sm text-green-600">拍照成功，正在跳转...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="size-10 text-destructive" />
              <p className="text-center text-sm text-destructive">{errorMessage}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                重试
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
