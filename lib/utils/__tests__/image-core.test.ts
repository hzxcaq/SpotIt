import { describe, it, expect } from 'vitest';
import { validateImageFile, calculateTargetDimensions } from '../image';

describe('Image Utils - Core Functions', () => {
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

      // 函数不会放大小于最大尺寸的图片
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });
});