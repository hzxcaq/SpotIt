/**
 * Image processing utilities for SpotIt
 * Handles image compression, validation, and conversion
 */

export interface ImageProcessResult {
  dataUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageProcessOptions {
  maxSizeKB?: number;
  maxDimension?: number;
  outputFormat?: "image/jpeg" | "image/png" | "image/webp";
  initialQuality?: number;
}

const DEFAULT_OPTIONS: Required<ImageProcessOptions> = {
  maxSizeKB: 500,
  maxDimension: 1280,
  outputFormat: "image/jpeg",
  initialQuality: 0.9,
};

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "仅支持图片格式" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "文件不能超过 10MB" };
  }

  return { valid: true };
}

/**
 * Read file as data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * Load image from data URL with timeout and cleanup
 */
export function loadImage(dataUrl: string, timeout = 30000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("图片加载失败"));
    };

    // 设置超时
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("图片加载超时"));
    }, timeout);

    img.src = dataUrl;
  });
}

/**
 * Calculate target dimensions while maintaining aspect ratio
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

/**
 * Compress image to canvas with specified quality
 */
function compressToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number,
  format: string
): { dataUrl: string; size: number } {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建 Canvas 上下文");
  }

  try {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const dataUrl = canvas.toDataURL(format, quality);
    const size = Math.round((dataUrl.length * 3) / 4);

    return { dataUrl, size };
  } finally {
    // 清理 Canvas 资源，防止内存泄漏
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    canvas.width = 0;
    canvas.height = 0;
    // 从 DOM 中移除（如果已添加）
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

/**
 * Compress image with adaptive quality adjustment
 */
async function compressWithAdaptiveQuality(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  maxSizeBytes: number,
  format: string,
  initialQuality: number
): Promise<{ dataUrl: string; size: number }> {
  let quality = initialQuality;
  let result = compressToCanvas(img, targetWidth, targetHeight, quality, format);

  const qualitySteps = [0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

  for (const step of qualitySteps) {
    if (result.size <= maxSizeBytes) {
      break;
    }
    quality = step;
    result = compressToCanvas(img, targetWidth, targetHeight, quality, format);
  }

  if (result.size > maxSizeBytes) {
    const reductionFactor = Math.sqrt(maxSizeBytes / result.size);
    const newWidth = Math.round(targetWidth * reductionFactor);
    const newHeight = Math.round(targetHeight * reductionFactor);
    result = compressToCanvas(img, newWidth, newHeight, 0.8, format);
  }

  return result;
}

/**
 * Process and compress image file
 */
export async function processImage(
  file: File,
  options: ImageProcessOptions = {}
): Promise<ImageProcessResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeKB * 1024;

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);

    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
      img.width,
      img.height,
      opts.maxDimension
    );

    const { dataUrl: compressedDataUrl, size } = await compressWithAdaptiveQuality(
      img,
      targetWidth,
      targetHeight,
      maxSizeBytes,
      opts.outputFormat,
      opts.initialQuality
    );

    return {
      dataUrl: compressedDataUrl,
      mimeType: opts.outputFormat,
      size,
      width: targetWidth,
      height: targetHeight,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("图片处理失败，请重试");
  }
}

/**
 * Get image dimensions from data URL
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(dataUrl);
  return { width: img.width, height: img.height };
}
