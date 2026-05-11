## Context

当前 Tabr 使用 Vite + 手动脚本构建 Chrome Extension MV3：
- `vite.config.ts` 配置 Rollup 入口为 `src/newtab.html`
- `scripts/fix-paths.js` 将构建产物中的 `/assets/` 替换为 `../assets/`（因为扩展环境中 HTML 在 `dist/src/` 子目录）
- `manifest.json` 手动维护，路径硬编码为 `dist/src/newtab.html`
- 开发模式 (`npm run dev`) 只能在浏览器中预览组件，无法测试扩展 API（chrome.storage 等）

WXT 是浏览器扩展专用构建框架，基于 Vite，原生支持 MV3、HMR、manifest 自动生成。

## Goals / Non-Goals

**Goals:**
- 用 WXT 替换 Vite + 手动脚本，简化构建流程
- 获得真正的扩展 HMR 开发体验（修改代码后自动重载扩展）
- manifest.json 由框架自动生成，减少手动维护
- 保留 React + Tailwind CSS + TypeScript 技术栈
- 业务逻辑层（providers/、services/、hooks/、components/）零改动

**Non-Goals:**
- 不做多浏览器适配（当前只支持 Chrome）
- 不引入 WXT 的自动导入功能（保持显式 import）
- 不改变功能行为或 UI

## Decisions

### 1. 项目结构迁移方案

**选择：** 按 WXT 约定将入口文件移至 `src/entrypoints/`

```
src/
  entrypoints/
    newtab/
      index.html    ← WXT 约定的入口 HTML
      main.tsx      ← 入口脚本（原 newtab.tsx）
  components/       ← 不变
  providers/        ← 不变
  services/         ← 不变
  hooks/            ← 不变
  styles.css        ← 不变
```

**理由：** WXT 使用 `src/entrypoints/` 目录自动发现扩展页面。`newtab/` 子目录名对应 manifest 中的 `chrome_url_overrides.newtab`。

**替代方案：** 平铺入口（`src/newtab.tsx` 不移动，通过 WXT 配置指定路径）—— 但违背 WXT 约定，失去框架带来的便利。

### 2. manifest 配置方式

**选择：** 使用 `wxt.config.ts` 的 manifest 配置，不再维护独立 `manifest.json`

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: {
    name: 'Tabr - Beautiful New Tab',
    version: '1.0.3',
    description: '...',
    permissions: ['storage'],
    host_permissions: ['https://api.unsplash.com/*'],
    icons: { 16: 'icon-16.png', 48: 'icon-48.png', 128: 'icon-128.png' },
  },
});
```

**理由：** WXT 自动生成 manifest，开发者只需声明差异部分。`chrome_url_overrides` 由框架根据 entrypoints 自动填充。

### 3. 公共资源（icons）处理

**选择：** 将 icons 移至 `public/` 目录，WXT 会自动复制到构建产物根目录。

当前 `public/` 已有 icons，路径无需变动。

### 4. 开发和构建命令

**选择：**
- `npm run dev` → `wxt` （HMR 模式，加载到 Chrome 后自动重载）
- `npm run build` → `wxt build` （生产构建到 `.output/` 目录）
- `npm run zip` → `wxt zip` （打包为可发布的 zip）

**理由：** WXT 的 `wxt` 命令启动开发服务器并生成可加载的扩展目录，支持 HMR。

## Risks / Trade-offs

**[构建产物目录变更]** → `.output/chrome-mv3/` 替代 `dist/`，需更新 `.gitignore` 和任何引用 `dist/` 的文档。影响较小。

**[WXT 版本锁定]** → 新增 `wxt` 依赖，需关注其维护状态。WXT 目前活跃维护（GitHub 8k+ stars），风险可控。

**[chrome.storage 在 HMR 中的行为]** → HMR 重载时 storage 数据保留，但组件状态重置。这是预期行为，与手动重载扩展一致。
