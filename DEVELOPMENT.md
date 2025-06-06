# Chrome 扩展开发指南

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 在 Chrome 中加载扩展
- 打开 Chrome 浏览器
- 访问 `chrome://extensions/`
- 开启右上角"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择项目根目录：`/Users/ryan/demo2/AI/Extentions/tabr`

### 4. 测试扩展
- 打开新标签页查看效果
- 应该看到精美的背景图片和时钟

## 🔧 开发工作流

### 标准开发流程：
1. **修改代码**（React 组件、样式等）
2. **构建项目**：`npm run build`
3. **重新加载扩展**：在 Chrome 扩展页面找到 "Tabr - Beautiful New Tab (Dev)"，点击"重新加载"按钮 🔄
4. **查看效果**：打开新标签页测试修改

### 监视模式（推荐）：
```bash
npm run build:watch
```
- 文件修改后自动重新构建
- 仍需手动在 Chrome 中重新加载扩展

### 组件预览模式：
```bash
npm run dev
```
- 在浏览器中预览 React 组件：`http://localhost:5173`
- 用于快速调试组件样式和逻辑

## 📁 项目结构

```
tabr/
├── manifest.json              # Chrome 扩展配置
├── dist/                      # 构建输出目录（自动生成）
│   ├── src/newtab.html       # 编译后的 HTML
│   └── assets/               # 编译后的 JS/CSS
├── src/                       # 源代码目录
│   ├── newtab.html           # HTML 模板
│   ├── newtab.tsx            # 主 React 组件
│   ├── styles.css            # 全局样式
│   ├── components/           # React 组件
│   └── api/                  # API 接口
│       ├── fetchUnsplashPhoto.ts  # Unsplash API
│       └── fetchPixabayPhoto.ts   # Pixabay API
├── scripts/                   # 构建脚本
│   └── fix-paths.js          # 路径修复脚本
└── public/                   # 静态资源
```

## 🔑 API 配置

### Unsplash API
1. 访问 [Unsplash Developers](https://unsplash.com/developers)
2. 创建新应用并获取 Access Key
3. 在 `src/api/fetchUnsplashPhoto.ts` 中替换 `YOUR_UNSPLASH_ACCESS_KEY`

### Pixabay API
1. 访问 [Pixabay API 文档](https://pixabay.com/api/docs/)
2. 注册账户并获取 API Key
3. 在 `src/api/fetchPixabayPhoto.ts` 中替换 `YOUR_PIXABAY_API_KEY`

**注意**: 如果不配置 API Key，扩展将使用预设的备用图片。

## ⚡ 开发技巧

### 快速重新加载
- 使用快捷键：在 Chrome 扩展页面按 `Cmd+R`（Mac）或 `Ctrl+R`（Windows）
- 或点击扩展卡片上的刷新图标

### 调试技巧
1. **查看控制台**: 新标签页按 F12 打开开发者工具
2. **检查元素**: 右键点击页面元素选择"检查"
3. **网络请求**: 在 Network 标签查看 API 请求
4. **扩展错误**: 在 `chrome://extensions/` 页面查看错误信息

### 代码热更新工作流
```bash
# 终端 1：监视构建
npm run build:watch

# 终端 2：可选的组件预览
npm run dev
```

## 🐛 常见问题

### 问题：MIME 类型错误
**解决方案**: 
- ✅ 确保运行了 `npm run build`
- ✅ 检查 `dist` 目录是否存在
- ✅ 验证 manifest.json 指向 `dist/src/newtab.html`

### 问题：扩展无法加载
**检查清单**:
- ✅ 确保选择了正确的项目根目录
- ✅ 确保运行了构建命令
- ✅ 检查 Chrome 控制台是否有错误信息

### 问题：修改代码后没有效果
**解决步骤**: 
1. 保存代码文件
2. 运行 `npm run build`（或确保 watch 模式在运行）
3. 在 Chrome 扩展页面点击"重新加载"
4. 关闭并重新打开新标签页

### 问题：API 调用失败
**解决方案**: 
- **Unsplash**: 检查 Access Key 是否正确配置
- **Pixabay**: 检查 API Key 是否正确配置
- **网络**: 确保网络连接正常
- **权限**: 检查 manifest.json 中的 host_permissions

### 问题：样式不生效
**检查**: 
- 确保 Tailwind CSS 类名正确
- 运行构建命令重新编译样式
- 检查浏览器开发者工具中的样式

## 🎯 开发建议

### 高效开发流程
1. **使用监视模式**：`npm run build:watch` 减少手动构建
2. **组件先开发**：在 `npm run dev` 模式下快速调试
3. **最后集成测试**：在实际扩展环境中验证

### 代码组织
- 新功能添加在 `src/components/` 中
- API 相关代码放在 `src/api/` 中  
- 样式修改使用 Tailwind CSS 类名
- 复杂逻辑提取为自定义 Hook

### 性能优化
- 使用 React.memo 包装纯组件
- 合理使用 useCallback 和 useMemo
- 避免不必要的重新渲染
- 图片懒加载和缓存策略

## 📦 准备发布

1. **完善功能测试**
2. **配置 API Keys**: 确保 Unsplash 和 Pixabay API 正常工作
3. **添加图标**: 在 `public/` 目录添加 `icon.png`
4. **更新 manifest**: 添加 icons 配置
5. **最终构建**: `npm run build`
6. **打包**: 将整个项目文件夹压缩为 zip

## 🔗 有用链接

- [Chrome Extension 开发文档](https://developer.chrome.com/docs/extensions/)
- [Unsplash API 文档](https://unsplash.com/documentation)
- [Pixabay API 文档](https://pixabay.com/api/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/) 