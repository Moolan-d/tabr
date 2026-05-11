## Why

当前构建流程依赖 Vite + 手动 `fix-paths.js` 脚本来修正扩展环境的资源路径，manifest.json 需手动维护，开发时没有真正的 HMR（只能用 `npm run dev` 预览组件，无法在扩展上下文中热更新）。WXT 是专为浏览器扩展设计的构建框架，原生解决这些问题。

## What Changes

- **BREAKING** 替换 Vite 构建为 WXT，删除 `vite.config.ts` 和 `scripts/fix-paths.js`
- **BREAKING** 项目结构调整为 WXT 的 `entrypoints/` 目录约定
- `manifest.json` 改由 WXT 自动生成（通过 `wxt.config.ts` 配置）
- 开发命令从 `npm run dev` / `npm run build` 改为 `wxt` / `wxt build`
- 新增真正的扩展 HMR 开发模式（`wxt` 命令）
- 保留 React + Tailwind CSS + TypeScript 技术栈

## Capabilities

### New Capabilities
- `wxt-build`: WXT 构建系统集成，包括 entrypoints 结构、manifest 自动生成、HMR 开发模式

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

**删除的文件：**
- `vite.config.ts`
- `scripts/fix-paths.js`
- `manifest.json`（改由 WXT 生成）

**修改的文件：**
- `package.json`（依赖和脚本）
- `src/newtab.tsx` → 移动到 `src/entrypoints/newtab/main.tsx`
- `src/newtab.html` → 移动到 `src/entrypoints/newtab/index.html`

**新增的文件：**
- `wxt.config.ts`

**不影响的文件：**
- `src/components/`、`src/providers/`、`src/services/`、`src/hooks/` — 业务逻辑层无需变动
- `src/styles.css` — 保留
