# Design: Service-Oriented Refactor

## Core Type Definitions

```typescript
// providers/types.ts

interface Photo {
  url: string;
  photographerName: string;
  photographerLink: string;
  originalLink: string;
  source: string;  // 'unsplash' | 'pexels' | 'local' | ...
}

interface FavoritePhoto extends Photo {
  savedAt: number;
}

interface PhotoSource {
  id: string;
  fetchRandom(): Promise<Photo>;
}
```

## Service Layer Design

### CacheLayer (`services/cache.ts`)

封装 `chrome.storage.local`，所有带时间戳的读写经过此处。

```typescript
interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

class CacheLayer {
  async get<T>(key: string, maxAgeMs: number): Promise<T | null>
  async set<T>(key: string, data: T): Promise<void>
  async remove(key: string): Promise<void>
}
```

### FavoritesService (`services/favorites.ts`)

```typescript
class FavoritesService {
  async getAll(): Promise<FavoritePhoto[]>
  async add(photo: FavoritePhoto): Promise<void>
  async remove(url: string): Promise<void>
  async isFavorite(url: string): Promise<boolean>
  async getRandom(excludeUrl?: string): Promise<FavoritePhoto | null>
}
```

`getRandom` 接受 `excludeUrl`，用于心动模式避免连续重复。收藏数为 1 时忽略排除条件。

### PreloadQueue (`services/preload-queue.ts`)

```typescript
class PreloadQueue {
  static readonly CAPACITY = 2;
  static readonly IMAGE_TTL_MS = 10 * 60 * 1000;  // 10分钟
  static readonly MAX_RETRY = 3;

  async peek(): Promise<Photo | null>         // 查看队首，不消费
  async consume(): Promise<Photo | null>       // 取出队首，触发后台补充
  async refill(currentPhotoUrl: string): Promise<void>  // 补充至满
  async clear(): Promise<void>
  async getAll(): Promise<Photo[]>             // 调试用
}
```

消费时检查 TTL：若图片超过 10 分钟，丢弃并跳过，尝试下一张。

补充策略：
```
for each empty slot (up to CAPACITY):
  retry up to MAX_RETRY times:
    photo = source.fetchRandom()
    if photo.url not in {currentDisplay, existingQueueItems}:
      preloadImage(photo.url)
      add to slot
      break
  if all retries failed:
    skip this slot (next refill trigger will retry)
```

### PhotoService (`services/photo-service.ts`)

核心协调器。管理所有状态，通过订阅模式向 UI 推送变化。

```typescript
interface PhotoServiceState {
  photo: Photo | null;
  loading: boolean;
  errorType?: 'no-key' | 'api-error';
  isFavorite: boolean;
  carouselMode: boolean;
  preloadQueue: Photo[];  // 仅供 DebugPanel 显示
}

class PhotoService {
  private state: PhotoServiceState;
  private listeners: Set<() => void>;
  private carouselTimer: ReturnType<typeof setInterval> | null;

  // 初始化（延迟单例首次访问时触发）
  private async initialize(): Promise<void>
    // 1. 读取 carouselMode 状态
    // 2. 读取 displayCache 是否有效
    // 3. 有效 → 直接显示
    //    无效 → 按模式加载

  // 状态订阅
  subscribe(listener: () => void): () => void
  getState(): PhotoServiceState

  // 公开操作
  async refresh(): Promise<void>           // 手动刷新
  async toggleFavorite(): Promise<void>
  async toggleCarousel(): Promise<void>

  // 内部
  private notify(): void                   // 触发所有 listener
  private setState(partial: Partial<PhotoServiceState>): void
  private async loadNormalMode(): Promise<void>
  private async loadCarouselMode(): Promise<void>
  private startCarouselTimer(): void
  private stopCarouselTimer(): void
}
```

### PhotoSource Registry (`providers/registry.ts`)

```typescript
class SourceRegistry {
  private sources: Map<string, PhotoSource>;
  private currentId: string;

  register(source: PhotoSource): void
  getCurrent(): PhotoSource
  setCurrent(id: string): void
  list(): PhotoSource[]
}
```

当前只注册 Unsplash。未来添加 Pexels 时：
1. 新建 `providers/pexels.ts` 实现 `PhotoSource`
2. 在初始化处 `registry.register(new PexelsSource())`
3. 在 SettingsMenu 加一个源选择器调用 `registry.setCurrent('pexels')`

## React Bridge (`hooks/usePhotoService.ts`)

```typescript
function usePhotoService(): PhotoServiceState & {
  refresh: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  toggleCarousel: () => Promise<void>;
}

// 内部实现：
const service = getPhotoService();
const state = useSyncExternalStore(
  (cb) => service.subscribe(cb),
  () => service.getState()
);
return { ...state, refresh: ..., toggleFavorite: ..., toggleCarousel: ... };
```

零 useEffect。服务在首次调用 `getPhotoService()` 时初始化，`subscribe` 在组件挂载时注册，卸载时自动清理。

## Component Extraction

### Background.tsx
```
props: { url?: string; loading: boolean }
渲染: 背景图 div + loading 遮罩
```

### BottomBar.tsx
```
props: { loading; isFavorite; carouselMode; debugMode;
         onRefresh; onToggleFavorite; onToggleCarousel; onToggleDebug }
渲染: 左下刷新按钮 + 右下信息栏（摄影师链接、收藏、心动开关、调试开关）
```

### DebugPanel.tsx
```
props: { queue: Photo[] }
渲染: 预加载队列缩略图列表（当前行为）
```

## Migration Order

实施顺序遵循「由底向上」原则，每步都可独立验证：

1. **types.ts** — 纯类型，无运行时影响
2. **cache.ts** — 替代 photoCache.ts 的读写逻辑
3. **providers/unsplash.ts** — 纯 API 调用，无缓存
4. **providers/registry.ts** — 源注册表
5. **favorites.ts** — 从 photoCache.ts 提取收藏逻辑
6. **preload-queue.ts** — 从 newtab.tsx 提取队列逻辑，加入 TTL 和重试
7. **photo-service.ts** — 组合以上，实现订阅模式
8. **hooks/usePhotoService.ts** — React 桥接
9. **components/** — Background / BottomBar / DebugPanel 提取
10. **newtab.tsx** — 最后改写为薄壳
11. **删除 api/** — 清理旧文件

每完成一步后运行 `npm run build` 确保类型正确，最终在 Chrome 中手动测试完整流程。
