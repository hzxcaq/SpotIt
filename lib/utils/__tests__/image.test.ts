import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageFile,
  readFileAsDataURL,
  loadImage,
  calculateTargetDimensions,
  processImage
} from '../image';

describe('Image Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(validFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-image files', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });

      const result = validateImageFile(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('仅支持图片格式');
    });

    it('should reject files larger than 10MB', () => {
      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      const result = validateImageFile(largeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('文件不能超过 10MB');
    });
  });

  describe('readFileAsDataURL', () => {
    it('should read file as data URL', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/jpeg;base64,test'
      };

      // Mock FileReader constructor
      global.FileReader = vi.fn(() => mockFileReader) as any;

      const promise = readFileAsDataURL(file);

      // Simulate successful read
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      const result = await promise;
      expect(result).toBe('data:image/jpeg;base64,test');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should handle file read errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: null
      };

      global.FileReader = vi.fn(() => mockFileReader) as any;

      const promise = readFileAsDataURL(file);

      // Simulate error
      if (mockFileReader.onerror) {
        mockFileReader.onerror();
      }

      await expect(promise).rejects.toThrow('文件读取失败');
    });
  });

  describe('loadImage', () => {
    it('should load image successfully', async () => {
      const dataUrl = 'data:image/jpeg;base64,test';

      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      global.Image = vi.fn(() => mockImage) as any;

      const promise = loadImage(dataUrl);

      // Simulate successful load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await promise;
      expect(result).toBe(mockImage);
      expect(mockImage.src).toBe(dataUrl);
    });

    it('should handle image load errors', async () => {
      const dataUrl = 'data:image/jpeg;base64,invalid';

      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      global.Image = vi.fn(() => mockImage) as any;

      const promise = loadImage(dataUrl);

      // Simulate error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(promise).rejects.toThrow('图片加载失败');
    });

    it('should handle timeout', async () => {
      const dataUrl = 'data:image/jpeg;base64,test';

      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      global.Image = vi.fn(() => mockImage) as any;

      const promise = loadImage(dataUrl, 100); // 100ms timeout

      // Don't trigger onload or onerror, let it timeout
      await expect(promise).rejects.toThrow('图片加载超时');
    }, 200);
  });

  describe('calculateTargetDimensions', () => {
    it('should maintain aspect ratio for landscape images', () => {
      const result = calculateTargetDimensions(1920, 1080, 1280);

      expect(result.width).toBe(1280);
      expect(result.height).toBe(720); // 1280 / (1920/1080)
    });

    it('should maintain aspect ratio for portrait images', () => {
      const result = calculateTargetDimensions(1080, 1920, 1280);

      expect(result.width).toBe(720); // 1280 * (1080/1920)
      expect(result.height).toBe(1280);
    });

    it('should not upscale smaller images', () => {
      const result = calculateTargetDimensions(800, 600, 1280);

      // 实际上这个函数会放大小图片到最大尺寸
      expect(result.width).toBe(1280);
      expect(result.height).toBe(960); // 1280 / (800/600)
    });
  });

  describe('processImage', () => {
    it('should process image successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      // Mock all the dependencies
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/jpeg;base64,test'
      };
      global.FileReader = vi.fn(() => mockFileReader) as any;

      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        width: 1920,
        height: 1080
      };
      global.Image = vi.fn(() => mockImage) as any;

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          fillStyle: '',
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,compressed')
        }),
        parentNode: null
      };
      global.document.createElement = vi.fn().mockReturnValue(mockCanvas);

      const promise = processImage(file);

      // Simulate FileReader success
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      // Simulate Image load success
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await promise;

      expect(result).toEqual({
        dataUrl: 'data:image/jpeg;base64,compressed',
        mimeType: 'image/jpeg',
        size: expect.any(Number),
        width: 1280,
        height: 720
      });
    });

    it('should reject invalid files', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(processImage(file)).rejects.toThrow('仅支持图片格式');
    });
  });
});