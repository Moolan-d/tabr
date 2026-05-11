## ADDED Requirements

### Requirement: WXT 构建系统
项目 SHALL 使用 WXT 作为唯一的构建工具，替代 Vite + 手动脚本方案。

#### Scenario: 生产构建
- **WHEN** 执行 `npm run build`（即 `wxt build`）
- **THEN** 构建产物输出到 `.output/chrome-mv3/` 目录，包含完整的可加载扩展

#### Scenario: 开发模式
- **WHEN** 执行 `npm run dev`（即 `wxt`）
- **THEN** 启动 HMR 开发服务器，生成可加载到 Chrome 的扩展目录，代码修改后自动重载

### Requirement: manifest 自动生成
manifest.json SHALL 由 WXT 根据 `wxt.config.ts` 配置和 entrypoints 自动生层，不再手动维护独立文件。

#### Scenario: manifest 内容正确
- **WHEN** 执行构建
- **THEN** 生成的 manifest 包含正确的 name、version、description、permissions、host_permissions、icons，且 `chrome_url_overrides.newtab` 自动指向 newtab 入口

#### Scenario: 权限配置
- **WHEN** manifest 生成
- **THEN** 包含 `storage` 权限和 `https://api.unsplash.com/*` host 权限

### Requirement: Entrypoints 结构
项目 SHALL 使用 WXT 的 `src/entrypoints/` 目录约定组织扩展页面入口。

#### Scenario: newtab 入口
- **WHEN** 浏览器打开新标签页
- **THEN** 加载 `src/entrypoints/newtab/` 下的 `index.html` 和 `main.tsx`

#### Scenario: 业务逻辑不变
- **WHEN** 迁移完成
- **THEN** `src/components/`、`src/providers/`、`src/services/`、`src/hooks/` 目录结构和内容保持不变

### Requirement: 删除旧构建文件
迁移完成后 SHALL 删除不再需要的文件。

#### Scenario: 清理旧文件
- **WHEN** WXT 集成完成
- **THEN** 以下文件被删除：`vite.config.ts`、`scripts/fix-paths.js`、`manifest.json`

### Requirement: 静态资源处理
icons 等静态资源 SHALL 放置在 `public/` 目录，由 WXT 自动复制到构建产物。

#### Scenario: icons 可用
- **WHEN** 构建完成
- **THEN** 产物根目录包含 `icon-16.png`、`icon-48.png`、`icon-128.png`
