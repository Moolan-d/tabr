# Tasks: Service-Oriented Refactor

## Phase 1: Foundation (纯类型 + 底层封装)

- [ ] **1.1 创建 `providers/types.ts`**
  - 定义 `Photo`（含 `source: string` 字段）
  - 定义 `FavoritePhoto extends Photo`
  - 定义 `PhotoSource` 接口

- [ ] **1.2 创建 `services/cache.ts`**
  - 封装 `chrome.storage.local` 带时间戳读写
  - `get<T>(key, maxAgeMs)` / `set<T>(key, data)` / `remove(key)`

## Phase 2: Providers（API 层，无缓存）

- [ ] **2.1 创建 `providers/unsplash.ts`**
  - 从 `api/fetchUnsplashPhoto.ts` 迁移 API 调用逻辑
  - 实现 `PhotoSource` 接口
  - 删除内部缓存逻辑（由上层统一管理）
  - 保留 fallback 图片和错误处理

- [ ] **2.2 创建 `providers/registry.ts`**
  - `SourceRegistry` 实现：register / getCurrent / setCurrent / list
  - 初始化时注册 UnsplashSource

## Phase 3: Services（业务逻辑层）

- [ ] **3.1 创建 `services/favorites.ts`**
  - 从 `api/photoCache.ts` 迁移收藏相关逻辑
  - 新增 `getRandom(excludeUrl?)` 支持心动模式排除上一张
  - 收藏数为 1 时忽略排除条件

- [ ] **3.2 创建 `services/preload-queue.ts`**
  - 从 `newtab.tsx` 提取 `initializePreloadQueue` / `refillPreloadQueue` 逻辑
  - 加入 10 分钟图片 TTL 检查
  - 加入单槽最多 3 次重试，失败则跳过该槽
  - 去重：排除当前显示图片和队列内已有图片

- [ ] **3.3 创建 `services/photo-service.ts`**
  - 组合 CacheLayer + FavoritesService + PreloadQueue + SourceRegistry
  - 实现 `PhotoServiceState` 和 `subscribe/notify` 模式
  - 实现 `initialize()`：读取 carouselMode → 按模式加载
  - 实现 `loadNormalMode()`：displayCache → queue.consume → initializeQueue
  - 实现 `loadCarouselMode()`：carouselCache → favorites.getRandom(exclude)
  - 实现 `refresh()`：消费队列首张 + 后台补充（队列为空时直接 fetch）
  - 实现 `toggleFavorite()` / `toggleCarousel()`
  - 内部管理 carouselTimer（setInterval，不依赖 React）

## Phase 4: React Bridge

- [ ] **4.1 创建 `hooks/usePhotoService.ts`**
  - 使用 `useSyncExternalStore` 桥接 PhotoService 状态
  - 暴露 `refresh` / `toggleFavorite` / `toggleCarousel`
  - 零 useEffect

## Phase 5: Component Extraction

- [ ] **5.1 创建 `components/Background.tsx`**
  - props: `{ url?: string; loading: boolean }`
  - 从 newtab.tsx 提取背景图 div 和 loading 遮罩

- [ ] **5.2 创建 `components/BottomBar.tsx`**
  - props: 事件回调 + 状态（isFavorite, carouselMode, debugMode, loading）
  - 从 newtab.tsx 提取左下刷新按钮和右下信息栏全部内容

- [ ] **5.3 创建 `components/DebugPanel.tsx`**
  - props: `{ queue: Photo[] }`
  - 从 newtab.tsx 提取预加载队列调试界面

## Phase 6: Integration

- [ ] **6.1 改写 `newtab.tsx`**
  - 使用 `usePhotoService()` 获取状态
  - 组合 Background + Clock + BottomBar + DebugPanel + SettingsMenu
  - 目标 ~80 行，无 useEffect

- [ ] **6.2 删除 `api/` 目录**
  - 删除 `api/fetchUnsplashPhoto.ts`
  - 删除 `api/photoCache.ts`
  - 确认无其他文件引用

## Phase 7: Verification

- [ ] **7.1 TypeScript 编译检查**
  - `npm run build` 通过，无类型错误

- [ ] **7.2 Chrome Extension 手动测试**
  - 加载 unpacked extension，打开新标签页
  - 验证：首次加载显示图片，缓存 2 分钟内不重复请求
  - 验证：2 分钟后自动切换下一张
  - 验证：手动刷新立即切换到队列下一张
  - 验证：收藏/取消收藏
  - 验证：心动模式开启/关闭/轮播
  - 验证：DebugPanel 正确显示队列状态
