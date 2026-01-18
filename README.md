# SpotIt - 物品定位助手

一款帮助你追踪和管理家中物品位置的 PWA 应用。再也不用担心找不到东西了！

## 功能特性

- **多地点管理**：支持管理多套房产，每个地点独立管理房间和物品
- **层级管理**：地点 → 房间 → 容器 → 物品，清晰的四级结构
- **拍照添加**：使用相机拍摄物品照片，快速添加物品
- **图片管理**：为物品添加照片，直观识别
- **快速搜索**：按名称搜索物品，快速定位
- **离线可用**：PWA 支持，无网络也能使用
- **本地存储**：数据存储在浏览器 IndexedDB，隐私安全
- **移动优先**：响应式设计，手机体验优秀
- **添加到主屏**：支持安装为独立应用
- **数据导入导出**：支持备份和恢复数据

## 技术栈

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Dexie (IndexedDB)
- next-pwa (Service Worker)

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 本地开发

```bash
# 克隆项目
git clone https://github.com/hzxcaq/SpotIt.git
cd SpotIt

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

## 部署方式

### 方式一：Vercel（推荐）

最简单的部署方式，自动 HTTPS，全球 CDN。

1. Fork 本项目到你的 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project" → 导入你的仓库
4. 点击 "Deploy"

或使用 Vercel CLI：

```bash
npm i -g vercel
vercel
```

### 方式二：Netlify

1. 访问 [netlify.com](https://netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 连接 GitHub 并选择仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
5. 点击 "Deploy"

### 方式三：Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

构建并运行：

```bash
docker build -t spotit .
docker run -p 3000:3000 spotit
```

### 方式四：静态导出

适用于纯静态托管（GitHub Pages、Cloudflare Pages 等）。

1. 修改 `next.config.ts`：

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  // ...
};
```

2. 构建：

```bash
npm run build
```

3. 将 `out` 目录部署到任意静态托管服务

### 方式五：自托管 (PM2)

```bash
# 安装 PM2
npm i -g pm2

# 构建项目
npm run build

# 启动服务
pm2 start npm --name "spotit" -- start

# 设置开机自启
pm2 save
pm2 startup
```

### 方式六：Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

配合 Let's Encrypt 获取免费 HTTPS：

```bash
sudo certbot --nginx -d your-domain.com
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 运行环境 | development |

## 使用指南

### 首次使用

1. **创建地点**：首页点击地点选择器 → 管理 → 添加新地点（如"家"、"办公室"）
2. **添加房间**：系统会自动创建默认房间（客厅、厨房、主卧、次卧、卫生间）
3. **添加物品**：点击"拍照添加"，拍摄物品照片后填写信息

### 多地点管理

- 首页顶部可快速切换地点
- 每个地点的房间和物品独立管理
- 适合管理多套房产或办公室

### 拍照添加物品

1. 首页点击"拍照添加"
2. 允许浏览器访问摄像头
3. 对准物品拍照
4. 自动跳转到添加页面，照片已填充
5. 选择房间、容器，填写物品信息

### 数据备份

- 设置页面 → 导出数据 → 保存 JSON 文件
- 更换设备或浏览器时，可导入数据恢复

## PWA 说明

- Service Worker 仅在生产环境启用
- 首次访问后，静态资源会被缓存
- 断网后仍可访问已缓存的页面
- 数据存储在本地 IndexedDB，不会丢失

### 安装为应用

- **Android Chrome**：菜单 → 添加到主屏幕
- **iOS Safari**：分享 → 添加到主屏幕
- **桌面 Chrome**：地址栏右侧安装图标

> 注意：PWA 安装需要 HTTPS 环境（localhost 除外）

## 开发命令

```bash
npm run dev      # 开发服务器
npm run build    # 生产构建
npm start        # 生产服务器
npm run lint     # 代码检查
npm test         # 运行测试
```

## 项目结构

```
SpotIt/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── locations/         # 地点管理页面
│   ├── rooms/             # 房间页面
│   ├── containers/        # 容器页面
│   ├── items/             # 物品页面
│   │   ├── new/          # 添加物品
│   │   └── [itemId]/     # 物品详情
│   ├── scan/              # 拍照添加
│   ├── search/            # 搜索页面
│   └── settings/          # 设置页面
├── components/            # 组件
│   ├── ui/               # UI 组件
│   └── location-provider.tsx  # 地点状态管理
├── lib/                   # 工具库
│   ├── db/               # 数据库层
│   │   ├── index.ts     # Dexie 配置
│   │   ├── hooks.ts     # React Hooks
│   │   └── types.ts     # 类型定义
│   └── utils/            # 工具函数
│       └── image.ts      # 图片处理
└── public/               # 静态资源
    ├── manifest.json     # PWA 清单
    └── icons/            # 应用图标
```

## License

MIT
