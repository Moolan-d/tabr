## ADDED Requirements

### Requirement: 自动版本推导
Release workflow SHALL 使用 semantic-release 从 commit messages 自动推导版本号。

#### Scenario: fix commit 触发 patch 版本
- **WHEN** main 分支收到 `fix:` 前缀的 commit
- **THEN** semantic-release 自动 bump patch 版本（如 1.2.0 → 1.2.1）

#### Scenario: feat commit 触发 minor 版本
- **WHEN** main 分支收到 `feat:` 前缀的 commit
- **THEN** semantic-release 自动 bump minor 版本（如 1.2.0 → 1.3.0）

#### Scenario: BREAKING CHANGE 触发 major 版本
- **WHEN** main 分支收到 `BREAKING CHANGE` 或 `feat!:` 的 commit
- **THEN** semantic-release 自动 bump major 版本（如 1.2.0 → 2.0.0）

#### Scenario: 非变更 commit 不触发版本
- **WHEN** main 分支收到 `chore:`、`refactor:`、`docs:` 等前缀的 commit
- **THEN** 不创建新版本，workflow 正常结束

### Requirement: GitHub Release 自动创建
semantic-release SHALL 在新版本推导后自动创建 GitHub Release。

#### Scenario: Release 创建
- **WHEN** semantic-release 推导出新版本号
- **THEN** 自动创建对应 tag（如 v1.2.1），创建 GitHub Release 并附带 release notes

#### Scenario: Release 附带构建产物
- **WHEN** GitHub Release 创建
- **THEN** 将 `.output/*.zip` 作为 asset 上传到 Release

### Requirement: Chrome Web Store 自动发布
Release workflow SHALL 在新版本创建后自动上传 zip 到 Chrome Web Store。

#### Scenario: 自动发布
- **WHEN** semantic-release 创建新版本，且 wxt zip 成功
- **THEN** 使用 `wxt submit` 将 zip 上传到 Chrome Web Store

#### Scenario: 发布凭证缺失
- **WHEN** GitHub Secrets 未配置 Chrome Web Store 凭证
- **THEN** workflow 在 submit 步骤失败，Release 本身已创建（zip 可手动下载）

### Requirement: 手动触发发布
Release workflow SHALL 支持通过 workflow_dispatch 手动触发，可指定已有的 tag 重新发布。

#### Scenario: 手动发布指定版本
- **WHEN** 通过 workflow_dispatch 输入 `release_tag`（如 v1.2.0）
- **THEN** checkout 该 tag，执行 zip + submit，重新发布到 Chrome Web Store

#### Scenario: 手动发布无 tag
- **WHEN** 通过 workflow_dispatch 触发但未输入 tag
- **THEN** 跳过发布步骤（should_publish = false）

### Requirement: 版本号统一
package.json version SHALL 作为版本号唯一 source of truth，wxt.config.ts 动态读取。

#### Scenario: 环境变量覆盖
- **WHEN** 设置 `EXTENSION_VERSION` 环境变量
- **THEN** wxt build 使用该环境变量作为版本号（不读 package.json）

#### Scenario: 无环境变量
- **WHEN** 未设置 `EXTENSION_VERSION`
- **THEN** wxt build 读取 package.json version 字段

### Requirement: Release 并发保护
Release workflow SHALL 不取消进行中的 run，保证发版完整性。

#### Scenario: 快速连续推送
- **WHEN** main 分支快速连续推送多个 commit
- **THEN** 每次 release run 独立运行，不相互取消
