## 1. 安装和配置 WXT

- [x] 1.1 安装 WXT 依赖：`npm install -D wxt`
- [x] 1.2 创建 `wxt.config.ts`，配置 manifest 信息（name、version、permissions、host_permissions、icons）
- [x] 1.3 更新 `package.json` 的 scripts：`dev` → `wxt`，`build` → `wxt build`，新增 `zip` → `wxt zip`

## 2. 迁移入口文件

- [x] 2.1 创建 `src/entrypoints/newtab/` 目录
- [x] 2.2 将 `src/newtab.html` 移动到 `src/entrypoints/newtab/index.html`，调整 script/css 引用路径
- [x] 2.3 将 `src/newtab.tsx` 移动到 `src/entrypoints/newtab/main.tsx`，更新内部 import 路径
- [x] 2.4 更新 `src/components/`、`src/hooks/` 中的相对 import 路径（如有变动）

## 3. 清理旧构建文件

- [x] 3.1 删除 `vite.config.ts`
- [x] 3.2 删除 `scripts/fix-paths.js`，清理 `scripts/` 目录（如为空）
- [x] 3.3 删除 `manifest.json`
- [x] 3.4 从 `package.json` 移除不再需要的依赖（`vite`、`@vitejs/plugin-react` 等 WXT 已内置的）

## 4. 构建验证

- [x] 4.1 执行 `npm run build` 确认构建成功，检查 `.output/chrome-mv3/` 产物完整性
- [x] 4.2 检查生成的 manifest.json 包含正确的 permissions、host_permissions、chrome_url_overrides
- [x] 4.3 确认 icons 正确复制到产物根目录
- [ ] 4.4 在 Chrome 中加载 `.output/chrome-mv3/` 目录，验证新标签页正常显示
