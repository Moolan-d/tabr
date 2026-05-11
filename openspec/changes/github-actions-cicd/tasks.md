## 1. 版本号统一

- [x] 1.1 更新 `package.json` version 为 `1.2.0`
- [x] 1.2 修改 `wxt.config.ts`：动态读取 package.json version，支持 `EXTENSION_VERSION` 环境变量覆盖

## 2. 安装 semantic-release 依赖

- [x] 2.1 安装 semantic-release 及插件：`npm install -D semantic-release @semantic-release/commit-analyzer @semantic-release/release-notes-generator @semantic-release/github @semantic-release/git conventional-changelog-conventionalcommits`
- [x] 2.2 在 `package.json` 中添加 `release` 配置（branches、plugins）

## 3. 创建 CI workflow

- [x] 3.1 创建 `.github/workflows/ci.yml`：触发条件 PR → main/dev，运行 typecheck + build，npm ci，Node 20，并发取消旧 run

## 4. 创建 Release workflow

- [x] 4.1 创建 `.github/workflows/release.yml`：push main 触发，运行 typecheck + build + semantic-release
- [x] 4.2 添加 zip 步骤：`wxt zip` 生成构建产物
- [x] 4.3 添加 GitHub Release 上传 zip 步骤
- [x] 4.4 添加 `wxt submit` 步骤发布到 Chrome Web Store（使用 GitHub Secrets）
- [x] 4.5 添加 `workflow_dispatch` 手动触发路径（支持指定 tag 重新发布）

## 5. 验证

- [x] 5.1 本地运行 `npm run build` 确认版本号正确读取（1.2.0）
- [ ] 5.2 确认 GitHub Secrets 已配置（手动步骤，需用户操作）
