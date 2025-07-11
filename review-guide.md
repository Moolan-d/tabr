## Tabr Feature Review

所有的用到的缓存属性：

### 用户当前使用的播放模式 tabr_carousel_mode；

  - 收藏的照片 tabr_favorites；
  - 缓存时间戳 tabr_cache_unsplash；
  - 预加载播放队列 tabr_preload_cache
  - 心动模式下的缓存时间戳 tabr_carousel_cache

### 非心动模式下核心缓存逻辑：
- localStorage 维护当前展示正在展示的图片的缓存时间戳tabr_cache_unsplash，维护一个长度为2的预加载播放队列 tabr_preload_cache如 imgs=[a,b]；
- 当前正在显示的照片有2分钟缓存期，2分钟不发起请求新的照片，当前正在显示照片不更新；
- 2分钟缓存期结束，切换展示播放队列的第一张a(如shift出imgs[0]),同时重新请求新的图片地址，补充更新队列(如imgs.push(c) [b,c]
- 以此类推，下次2分钟后展示的是b…
- 首次使用时，需要请求两张图片地址到缓存队列

### 心动模式下：
- 循环展示用户已经收藏过的图片地址，每张也保持2分钟的缓存展示tabr_carousel_cache，缓存时间过了，从收藏列表tabr_favorites中随机取一张展示；

### 两个模式相互独立，所有缓存数据也独立