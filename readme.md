# Tabr - 美丽的新标签页 Chrome 扩展

一个使用 React + TypeScript + Tailwind CSS 构建的 Chrome 扩展，用精美的高清照片替换您的新标签页。

## ✨ 功能特点

- 🖼️ **精美背景**: 从 Unsplash 和 500px 获取高质量照片
- 🕒 **智能时钟**: 显示当前时间和智能中文问候语
- ⚙️ **可配置**: 在 Unsplash 和 500px 之间切换照片来源
- 🔄 **一键刷新**: 随时更换背景图片
- 💾 **记住偏好**: 自动保存用户设置
- 🎨 **现代设计**: 使用 Tailwind CSS 的简洁美观界面

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
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目文件夹

### 4. 开始开发
- 修改代码后运行 `npm run build`
- 在 Chrome 扩展页面点击"重新加载"
- 详细开发指南请查看 [DEVELOPMENT.md](./DEVELOPMENT.md)

## 🔧 开发命令

```bash
# 构建项目（必需）
npm run build

# 监视模式 - 自动重新构建
npm run build:watch

# 组件预览模式
npm run dev
```

## 📁 项目结构

```
tabr/
├── manifest.json              # Chrome 扩展配置
├── dist/                      # 构建输出（自动生成）
├── src/
│   ├── newtab.html           # 新标签页入口
│   ├── newtab.tsx            # 主 React 组件
│   ├── components/           # React 组件
│   └── api/                  # API 接口
├── scripts/                   # 构建脚本
├── public/                   # 静态资源
└── DEVELOPMENT.md            # 详细开发指南
```

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **构建工具**: Vite
- **扩展**: Chrome Extension Manifest V3

## 💡 开发提示

- **必须构建**: Chrome 扩展无法直接运行 TypeScript，需要先构建
- **监视模式**: 使用 `npm run build:watch` 实现自动重新构建
- **组件调试**: 使用 `npm run dev` 在浏览器中快速预览组件

## 📖 更多信息

- [开发指南](./DEVELOPMENT.md) - 详细的开发流程和技巧
- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [Unsplash API](https://unsplash.com/documentation)

## 📄 许可证

MIT License# tabr
