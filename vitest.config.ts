import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom", // 改为 jsdom 支持 React 测试
    setupFiles: ["./lib/db/__tests__/setup.ts", "./test-setup.ts"],
    globals: true, // 启用全局测试 API
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**',
        'dist/**',
        '.next/**'
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
