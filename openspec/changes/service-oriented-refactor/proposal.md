# Service-Oriented Refactor

## Summary

将 Tabr 从「上帝组件 + 扁平工具函数」架构重构为「Service 主导 + 轻量 React 桥接」架构，实现 UI、缓存、核心业务逻辑的完全解耦，并为多图源扩展建立接口基础。

## Motivation

当前 `newtab.tsx`（441行）同时承担了 8 个 useState、5 个 useEffect、两种模式的加载/缓存/队列管理、以及 160 行 JSX 渲染。这导致：

- 业务逻辑修改必须同时理解 UI 生命周期
- 缓存策略存在历史重复（`fetchUnsplashPhoto` 和 `newtab.tsx` 各自维护 2 分钟缓存）
- 新增图源需要修改核心组件，无法通过实现接口扩展
- 预加载队列补充无失败重试、图片无 TTL、刷新行为有 bug（缓存未清导致刷新无效）

## Non-goals

- 不改变视觉设计或功能行为（除以下明确修复）
- 不引入新的外部依赖
- 不改变 Chrome Extension Manifest 配置
- 不重构 SettingsMenu 和 Clock 组件（它们已经是独立组件）

## Architecture Direction

```
newtab.tsx (~80行)                 usePhotoService() (~30行)
    │  纯渲染 + 事件转发                │  状态订阅桥接
    │                                  │
    └──────────────────────────────────┘
                    │
                    ▼
            PhotoService (单例)
            管理: 模式、队列、收藏、缓存策略
            推送: subscribe/notify 状态变化
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    PhotoSource   CacheLayer  PreloadQueue
    Registry      chrome.     容量=2
    接口抽象      storage     TTL=10min
    (Unsplash,    统一读写     重试3次
     Pexels*,     带时间戳
     Local*)
```

**核心原则：React 不驱动业务逻辑，只订阅并渲染。**

## Key Decisions

| 决策 | 结论 |
|---|---|
| 架构风格 | Service 主导，React 订阅渲染 |
| 状态桥接 | `useSyncExternalStore`（React 18 原生，无依赖） |
| 图源抽象 | `PhotoSource` 接口 + 注册表 |
| 初始化 | 延迟单例 `getPhotoService()`，避免 Chrome API 时序问题 |
| useEffect | 消灭全部，用 service 订阅 + 内部定时器替代 |
| API 缓存 | 删除 `fetchUnsplashPhoto` 内部缓存，由 `CacheLayer` 统一管理 |

## Caching Strategy (Post-Refactor)

### Normal Mode

```
Display Cache: TTL = 2min
  → expiry: auto-consume first queue item, show immediately
  → manual refresh: consume queue first item immediately (skip TTL)

Preload Queue: capacity = 2
  → image TTL: 10min (stale images discarded and refetched)
  → refill retry: max 3 attempts per slot, skip on full failure
  → dedup: no overlap with current display or other queue items

Manual Refresh:
  → consume queue first item as current display
  → background refill queue
  → fallback: direct API fetch if queue empty
```

### Carousel Mode

```
Carousel Cache: TTL = 2min
  → expiry: random pick from favorites (exclude last shown)
  → single favorite: show that one (no exclusion)
```

## File Structure (Target)

```
src/
├── providers/
│   ├── types.ts                 # Photo, PhotoSource, FavoritePhoto interfaces
│   ├── unsplash.ts             # implements PhotoSource
│   └── registry.ts             # source registration + management
│
├── services/
│   ├── cache.ts                # ChromeStorageCache (read/write with TTL)
│   ├── favorites.ts            # FavoritesService (CRUD + random pick)
│   ├── preload-queue.ts        # PreloadQueue (capacity, TTL, retry, dedup)
│   └── photo-service.ts        # Core orchestrator, composes all above
│
├── hooks/
│   └── usePhotoService.ts      # React bridge (useSyncExternalStore)
│
├── components/
│   ├── Clock.tsx               # unchanged
│   ├── SettingsMenu.tsx        # unchanged
│   ├── Background.tsx          # extracted from newtab.tsx
│   ├── BottomBar.tsx           # extracted (refresh, favorite, carousel, debug buttons)
│   └── DebugPanel.tsx          # extracted, shows queue state
│
├── api/                        # DELETE (replaced by providers/)
│   ├── fetchUnsplashPhoto.ts
│   └── photoCache.ts
│
├── newtab.tsx                  # thin shell (~80 lines)
├── styles.css
└── newtab.html
```

## Impact

**代码量变化（预估）：**
- `newtab.tsx`: 441 → ~80 行
- 新增文件: 7 个（providers × 3, services × 4, hooks × 1, components × 3 增量）
- 删除文件: 2 个（`api/fetchUnsplashPhoto.ts`, `api/photoCache.ts`）

**行为变化：**
- 修复：手动刷新现在真正切换到新图（当前有缓存命中 bug）
- 修复：预加载队列补充有失败重试上限（当前无上限，可能卡死）
- 新增：预加载图片 10 分钟 TTL
- 新增：心动模式避免连续重复显示同一张图

**未来扩展能力：**
- 新增图源：实现 `PhotoSource` 接口 + 注册，零修改 service 层
- 调整缓存策略：只改 `services/cache.ts` 和 `photo-service.ts`，UI 无感
