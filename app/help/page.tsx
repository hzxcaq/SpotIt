"use client";

import Link from "next/link";
import { ChevronLeft, Smartphone, Download, Share2, Home, Camera, Search, Settings, FolderOpen, Package, Box, AlertCircle, CheckCircle2, Shield, Cloud } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-5" />
            返回设置
          </Link>
          <h1 className="flex-1 text-center font-semibold">使用指南</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        {/* 移动端使用 - 最重要的部分 */}
        <section className="rounded-lg border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="size-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">📱 移动端使用（推荐）</h2>
          </div>

          <div className="space-y-6">
            {/* 安装为应用 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Download className="size-5" />
                安装为应用
              </h3>
              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-background p-4">
                  <p className="font-medium mb-2">📱 Android（Chrome）</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>打开 SpotIt 网站</li>
                    <li>点击浏览器菜单（三个点）</li>
                    <li>选择"添加到主屏幕"</li>
                    <li>点击"添加"</li>
                    <li>桌面会出现 SpotIt 图标</li>
                  </ol>
                </div>

                <div className="rounded-lg bg-background p-4">
                  <p className="font-medium mb-2">🍎 iOS（Safari）</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>打开 SpotIt 网站</li>
                    <li>点击底部分享按钮 <Share2 className="inline size-4" /></li>
                    <li>选择"添加到主屏幕"</li>
                    <li>点击"添加"</li>
                    <li>桌面会出现 SpotIt 图标</li>
                  </ol>
                </div>

                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ 安装后的优势</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 像原生应用一样使用</li>
                    <li>• 全屏显示，无浏览器地址栏</li>
                    <li>• 可以离线使用</li>
                    <li>• 启动速度快</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 移动端备份 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Cloud className="size-5" />
                移动端备份
              </h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-background p-4">
                  <p className="font-medium mb-2">建议方式</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>开启自动备份（提示下载模式）</li>
                    <li>每周下载一次备份</li>
                    <li>上传到云盘（Google Drive、iCloud、OneDrive）</li>
                    <li>或通过 AirDrop/蓝牙传输到电脑</li>
                  </ol>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>提示</strong>：移动端浏览器不支持自动保存到文件夹，建议定期手动下载备份
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 快速开始 */}
        <section>
          <h2 className="text-lg font-bold mb-4">🚀 快速开始</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">创建地点</h3>
                  <p className="text-sm text-muted-foreground">首页点击"选择地点" → "管理" → "添加新地点"（如"我的家"、"办公室"）</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <Camera className="size-4" />
                    拍照添加物品
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">首页点击"拍照添加" → 对准物品拍照 → 选择房间和容器 → 填写信息</p>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>提示</strong>：系统会自动创建 5 个默认房间（客厅、厨房、主卧、次卧、卫生间）
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <Search className="size-4" />
                    搜索物品
                  </h3>
                  <p className="text-sm text-muted-foreground">首页搜索框输入物品名称 → 查看搜索结果 → 点击物品查看详细位置</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 数据隐私 */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="size-5" />
            🔒 您的数据，您做主
          </h2>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">隐私安全</p>
                <p className="text-sm text-muted-foreground">您的物品清单、照片、备注等信息完全私密，没有任何人（包括我们）能看到您的数据</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">完全控制</p>
                <p className="text-sm text-muted-foreground">您可以随时导出、删除数据，备份到任何地方（电脑、U盘、云盘）</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">离线可用</p>
                <p className="text-sm text-muted-foreground">断网也能正常使用，数据读写速度快，不消耗流量</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">需要注意</p>
                <p className="text-sm text-muted-foreground">清除浏览器数据会删除所有信息，建议定期备份数据到安全位置</p>
              </div>
            </div>
          </div>
        </section>

        {/* 功能详解 */}
        <section>
          <h2 className="text-lg font-bold mb-4">📚 功能详解</h2>
          <div className="space-y-3">
            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/50 flex items-center gap-2">
                <Home className="size-5" />
                地点管理
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                <p><strong>什么是地点？</strong> 地点是最高层级的分类，用于区分不同的房产或场所。</p>
                <p><strong>使用场景</strong>：家里、办公室、老家、度假屋</p>
                <p><strong>如何管理</strong>：首页顶部点击地点名称可快速切换，点击"管理"进入地点管理页面</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/50 flex items-center gap-2">
                <FolderOpen className="size-5" />
                房间管理
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                <p><strong>什么是房间？</strong> 房间是地点下的第二层级，代表实际的房间。</p>
                <p><strong>如何管理</strong>：首页点击"按房间浏览" → 查看所有房间 → 点击"+"添加新房间</p>
                <p className="text-yellow-600 dark:text-yellow-500">⚠️ <strong>注意</strong>：删除房间会同时删除该房间下的所有容器和物品，请谨慎操作！</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/50 flex items-center gap-2">
                <Package className="size-5" />
                容器管理
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                <p><strong>什么是容器？</strong> 容器是房间内的具体存储位置，如柜子、抽屉、收纳箱等。</p>
                <p><strong>命名建议</strong>：上柜-左格、抽屉1、红色收纳箱等清晰易懂的名称</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/50 flex items-center gap-2">
                <Box className="size-5" />
                物品管理
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                <p><strong>物品信息</strong>：名称（必填）、数量和单位、照片、标签、备注</p>
                <p><strong>物品状态</strong>：在库、已借出、已归还、已消耗、已处置</p>
                <p><strong>如何移动</strong>：进入物品详情页 → 点击"移动"按钮 → 选择新的房间和容器</p>
              </div>
            </details>
          </div>
        </section>

        {/* 数据备份 */}
        <section>
          <h2 className="text-lg font-bold mb-4">💾 数据备份与恢复</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">自动备份（推荐）</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>进入"设置"页面</li>
                <li>找到"自动备份"区域，点击"开启"</li>
                <li>选择备份方式：
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>提示下载</strong>：每天首次访问时提示下载（兼容所有浏览器）</li>
                    <li><strong>自动保存到文件夹</strong>：完全自动化（仅 Chrome/Edge 86+）</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">手动备份</h3>
              <p className="text-sm text-muted-foreground mb-2">设置页面 → "手动备份与恢复" → "导出到文件"</p>
              <p className="text-xs text-muted-foreground">备份文件为 JSON 格式，建议保存到云盘或电脑安全位置</p>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">💡 备份建议</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 开启自动备份，避免数据丢失</li>
                <li>• 定期下载备份到云盘（OneDrive、Dropbox、Google Drive）</li>
                <li>• 更换设备前记得导出备份</li>
                <li>• 浏览器备份保留最近 7 天</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 常见问题 */}
        <section>
          <h2 className="text-lg font-bold mb-4">❓ 常见问题</h2>
          <div className="space-y-3">
            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50">
                我的数据会被上传到服务器吗？
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                <p><strong>不会。</strong> 所有数据都保存在您的设备上（浏览器 IndexedDB），不会上传到任何服务器。我们无法访问您的任何数据。</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50">
                清除浏览器数据会删除我的物品记录吗？
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                <p><strong>是的。</strong> 清除浏览器数据会删除所有信息，请务必先备份。建议开启自动备份功能。</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50">
                可以在多个设备上同时使用吗？
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                <p><strong>可以</strong>，但数据不会自动同步。需要手动导出导入数据，或使用云盘同步备份文件。</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50">
                离线可以使用吗？
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                <p><strong>可以。</strong> 首次访问后，应用会缓存到本地，断网也能正常使用。</p>
              </div>
            </details>

            <details className="rounded-lg border">
              <summary className="cursor-pointer p-4 font-medium hover:bg-muted/50">
                照片会被压缩吗？
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                <p><strong>会。</strong> 为了节省空间，照片会自动压缩到 800x800 像素，质量为 80%。</p>
              </div>
            </details>
          </div>
        </section>

        {/* 获取帮助 */}
        <section className="rounded-lg border p-6 text-center">
          <h2 className="text-lg font-bold mb-2">🆘 需要更多帮助？</h2>
          <p className="text-sm text-muted-foreground mb-4">
            如果您遇到问题或有功能建议，欢迎访问我们的 GitHub 仓库
          </p>
          <a
            href="https://github.com/hzxcaq/SpotIt/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            访问 GitHub
          </a>
        </section>

        {/* 关于 */}
        <section className="text-center text-sm text-muted-foreground">
          <p>SpotIt v0.2.0</p>
          <p className="mt-1">物品定位助手 · MIT License</p>
        </section>
      </main>
    </div>
  );
}
