"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { containersRepo } from "@/lib/db/hooks";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, AlertCircle, CheckCircle2 } from "lucide-react";

type ScanStatus = "idle" | "scanning" | "success" | "error";

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scannedContent, setScannedContent] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const startScanner = async () => {
    setStatus("scanning");
    setErrorMessage("");

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          setScannedContent(decodedText);
          await handleScanResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setStatus("error");
      if (err instanceof Error) {
        if (err.message.includes("Permission")) {
          setErrorMessage("请允许访问摄像头以使用扫码功能");
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("无法启动摄像头");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
  };

  const handleScanResult = async (content: string) => {
    await stopScanner();

    const containerMatch = content.match(/^spotit:\/\/container\/(.+)$/);
    if (containerMatch) {
      const code = containerMatch[1];
      const container = await containersRepo.getByCode(code);
      if (container) {
        setStatus("success");
        setTimeout(() => {
          router.push(`/containers/${container.id}`);
        }, 500);
        return;
      }
    }

    setStatus("error");
    setErrorMessage(`无法识别的二维码内容: ${content}`);
    isProcessingRef.current = false;
  };

  const handleRetry = () => {
    isProcessingRef.current = false;
    setScannedContent("");
    startScanner();
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">扫码</h1>
            <p className="text-sm text-muted-foreground">扫描容器二维码快速定位</p>
          </div>
        </header>

        <div className="space-y-4">
          <div
            id="qr-reader"
            className="mx-auto aspect-square max-w-sm overflow-hidden rounded-lg bg-muted"
          />

          {status === "idle" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Camera className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">正在初始化摄像头...</p>
            </div>
          )}

          {status === "scanning" && (
            <p className="text-center text-sm text-muted-foreground">
              将二维码对准框内进行扫描
            </p>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="size-10 text-green-500" />
              <p className="text-sm text-green-600">扫描成功，正在跳转...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="size-10 text-destructive" />
              <p className="text-center text-sm text-destructive">{errorMessage}</p>
              {scannedContent && (
                <p className="text-center text-xs text-muted-foreground break-all">
                  扫描内容: {scannedContent}
                </p>
              )}
              <Button onClick={handleRetry} variant="outline" size="sm">
                重新扫描
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
