## ADDED Requirements

### Requirement: PR 门禁自动验证
CI workflow SHALL 在 PR 提交到 main 或 dev 时自动运行，验证 typecheck 和 build。

#### Scenario: PR 通过验证
- **WHEN** 开发者提交 PR 到 main 或 dev 分支
- **THEN** 自动运行 `tsc --noEmit` 和 `wxt build`，两步均通过后显示绿色状态

#### Scenario: typecheck 失败
- **WHEN** PR 包含类型错误
- **THEN** workflow 失败，PR 显示红色状态，阻止合并

#### Scenario: build 失败
- **WHEN** typecheck 通过但构建失败
- **THEN** workflow 失败，PR 显示红色状态

#### Scenario: 并发取消
- **WHEN** 同一 PR 快速连续推送多次
- **THEN** 只保留最新一次 run，旧的自动取消

### Requirement: CI 使用 npm ci
CI workflow SHALL 使用 `npm ci --frozen-lockfile` 安装依赖，保证可重现构建。

#### Scenario: lockfile 不一致
- **WHEN** package.json 和 package-lock.json 不一致
- **THEN** npm ci 失败，workflow 失败

### Requirement: Node 版本固定
CI workflow SHALL 使用 Node.js 20 LTS。

#### Scenario: Node 版本一致性
- **WHEN** workflow 运行
- **THEN** 使用 Node 20.x 版本
