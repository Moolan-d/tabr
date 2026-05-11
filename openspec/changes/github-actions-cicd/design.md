## Context

Tabr 已迁移到 WXT 构建，现在需要 CI/CD 自动化。参考项目 xb 使用 bun + semantic-release + wxt submit 的方案，Tabr 用 npm 替代 bun，其余架构保持一致。

GitHub 仓库：`Moolan-d/tabr`，Chrome Web Store 凭证已准备好。

## Goals / Non-Goals

**Goals:**
- PR 合并前自动运行 typecheck 和 build 验证
- Push main 自动推导版本号、打 tag、创建 GitHub Release
- 自动上传 zip 到 Chrome Web Store
- 支持手动触发重新发布指定版本

**Non-Goals:**
- 不加 ESLint（后续可选补充）
- 不加自动化测试（项目目前无测试）
- 不支持 Firefox 发布

## Decisions

### 1. 包管理器：npm

xb 用 bun，但 Tabr 现有 lockfile 是 npm。保持 npm，用 `npm ci --frozen-lockfile` 保证 CI 一致性。

### 2. 版本管理：semantic-release

参考 xb 的配置，使用：
- `@semantic-release/commit-analyzer`：从 commit messages 推导版本
- `@semantic-release/release-notes-generator`：自动生成 changelog
- `@semantic-release/github`：创建 GitHub Release
- `@semantic-release/git`：自动 commit 版本号变更到 main
- `conventional-changelog-conventionalcommits`：conventional commits 规范

semantic-release 发版时会 push `chore(release): X.Y.Z [skip ci]` commit 到 main，不会触发新一轮 release workflow。

### 3. 版本号统一

`package.json` version 作为 source of truth（初始设为 1.2.0）。
`wxt.config.ts` 动态读取，优先使用 `EXTENSION_VERSION` 环境变量。

### 4. Chrome Web Store 发布

使用 `wxt submit` 命令，需要 4 个 secret：
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

### 5. 并发策略

- CI：同 branch 新 push 取消旧 run（`cancel-in-progress: true`）
- Release：不取消，保证发版完整性（`cancel-in-progress: false`）

## Risks / Trade-offs

**[Chrome Web Store 凭证过期]** → refresh_token 可能失效。失效后需在 Google Cloud Console 重新授权。监控 workflow 日志即可发现。

**[semantic-release 误判版本]** → 如果 commit message 不规范，可能导致不该 bump 的版本被 bump。通过团队规范 + PR review 控制。

**[npm ci 速度]** → 比 bun 慢。Tabr 依赖不多（~500 packages），影响可忽略。
