## Why

项目目前没有任何 CI/CD，每次发版需要手动 `npm run build` → 打包 → 上传 Chrome Web Store。参考 xb 项目的 workflow 设计，建立自动化的 PR 门禁 + 自动发版 + Chrome Web Store 发布流水线，实现 push-to-deploy。

## What Changes

- 新增 `.github/workflows/ci.yml`：PR 门禁（typecheck + build）
- 新增 `.github/workflows/release.yml`：自动发版（semantic-release）+ 自动发布到 Chrome Web Store（wxt submit）
- 新增 `semantic-release` 及相关插件依赖
- 修改 `wxt.config.ts`：动态读取 `package.json` version，支持 `EXTENSION_VERSION` 环境变量覆盖
- 统一版本号到 `package.json` 为 `1.2.0`
- 配置 GitHub Secrets：`CHROME_EXTENSION_ID`、`CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`、`CHROME_REFRESH_TOKEN`

## Capabilities

### New Capabilities
- `ci-workflow`: PR 门禁，typecheck + build 验证
- `release-workflow`: 自动版本推导 + GitHub Release + Chrome Web Store 发布

### Modified Capabilities
- `wxt-build`: 版本号读取策略改为动态（从 package.json / 环境变量）

## Impact

**新增文件：**
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

**修改文件：**
- `package.json`（版本号 → 1.2.0，新增 semantic-release 依赖和配置）
- `wxt.config.ts`（动态读取版本号）

**需要手动操作：**
- 在 GitHub 仓库 Settings → Secrets 中配置 4 个 Chrome Web Store 凭证
