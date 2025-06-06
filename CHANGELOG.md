# 更新日志

## [1.1.0] - 2024-12-03

### 🆕 新增功能
- **Pixabay API 集成**: 替换原有的 500px 模拟方案，使用真实的 Pixabay API
- **智能搜索**: Pixabay API 支持多种搜索关键词，自动获取不同类型的风景照片
- **备用图片**: 当 API 不可用时，提供高质量的备用图片

### 🔄 变更
- **图片来源**: 从 "500px" 改为 "Pixabay"
- **API 接口**: `fetch500pxPhoto.ts` → `fetchPixabayPhoto.ts`
- **设置菜单**: 更新选项名称和描述
- **权限配置**: 添加 Pixabay API 访问权限

### 📋 技术细节

#### API 参数优化
- 图片类型: 仅照片 (photo)
- 方向: 横向 (horizontal) 
- 分类: 自然、地点、背景 (nature, places, backgrounds)
- 最小尺寸: 1920x1080 (适合新标签页)
- 安全搜索: 开启 (safesearch: true)

#### 搜索关键词
- nature landscape
- mountain sunset  
- ocean beach
- forest trees
- sky clouds
- flowers garden
- city skyline
- winter snow
- autumn colors
- spring blossom

### 🔧 配置说明

#### Pixabay API Key 获取
1. 访问 [pixabay.com/api/docs/](https://pixabay.com/api/docs/)
2. 注册账户
3. 获取免费 API Key
4. 在 `src/api/fetchPixabayPhoto.ts` 中替换 `YOUR_PIXABAY_API_KEY`

#### API 限制
- 免费用户: 100 请求/小时
- 图片缓存: 建议 24 小时 (符合 Pixabay 要求)
- 请求频率: 适中，避免过于频繁

### 🆙 升级指南

如果您之前使用了 500px 设置，需要：

1. **重新构建项目**:
   ```bash
   npm run build
   ```

2. **重新加载扩展**: 在 Chrome 扩展页面点击"重新加载"

3. **配置 API Key** (可选): 在新的 Pixabay API 文件中添加您的 API Key

4. **测试功能**: 打开新标签页，在设置中切换到 Pixabay 查看效果

### 📊 性能改进
- 更高质量的图片源
- 更稳定的 API 服务
- 更丰富的图片内容
- 更好的错误处理

### 🐛 修复
- 修复了模拟数据的局限性
- 改善了图片多样性
- 优化了加载失败时的用户体验

---

## [1.0.0] - 2024-12-03

### 🎉 初始版本
- Chrome 扩展新标签页替换
- Unsplash API 集成
- 500px 模拟数据
- React + TypeScript + Tailwind CSS
- 智能时钟和问候语
- 设置菜单和用户偏好存储 