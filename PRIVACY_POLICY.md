# Tabr 隐私政策

*最后更新：2026 年 10 月 15 日*

Tabr 是一个 Chrome 扩展，用 Unsplash 的照片替换新标签页。本政策说明 Tabr 会保存哪些数据、会访问哪些网络服务，以及你可以如何管理这些数据。

## 简要说明

- Tabr 没有自己的服务器，不会把任何数据发送给开发者。
- Tabr 不收集个人身份信息、浏览记录或位置信息。
- Tabr 不使用统计分析、广告追踪或 Cookie。
- 照片由 Unsplash 提供，Tabr 只在获取和显示照片时访问 Unsplash。

## Tabr 保存的数据

### 保存在当前设备（`chrome.storage.local`）

| 数据 | 用途 |
|---|---|
| 收藏的照片：图片地址、摄影师姓名、摄影师主页和原图页面链接 | 在收藏画廊中显示，并用于轮播 |
| 设置：纯净模式、轮播模式开关 | 记住你的选择 |
| 轮播进度：上次显示的收藏和时间 | 在新标签页中依次显示收藏 |
| 照片缓存：当前照片和预加载的下一张照片的信息 | 快速打开新标签页 |
| 内置试用 Key 的使用次数 | 限制试用请求次数 |

### 通过 Chrome 同步保存（`chrome.storage.sync`）

| 数据 | 用途 |
|---|---|
| 你填写的 Unsplash API Key | 请求 Unsplash 照片 |

如果你在 Chrome 中开启了同步，Chrome 会把这个 Key 同步到登录同一 Chrome 账户的其他设备。同步由 Google 处理，适用 [Google 隐私权政策](https://policies.google.com/privacy)。

## 访问的网络服务

Tabr 只会访问 Unsplash：

- **api.unsplash.com**：获取随机照片。请求中包含 API Key（你的 Key 或内置试用 Key），不包含你的收藏、设置或个人信息。
- **images.unsplash.com**：加载照片本身。

和访问任何网站一样，Unsplash 会收到 IP 地址、浏览器类型等常规请求信息。你点击摄影师姓名或“查看原图”时，会在新标签页打开 unsplash.com。Unsplash 如何处理这些信息，请参阅 [Unsplash 隐私政策](https://unsplash.com/privacy)。

## 权限说明

| 权限 | 用途 |
|---|---|
| `storage` | 保存上文列出的收藏、设置、缓存和 API Key |
| `https://api.unsplash.com/*` | 请求 Unsplash 照片 |

Tabr 还会替换 Chrome 的新标签页，这是扩展的核心功能。

## 数据共享

Tabr 不会出售、出租或分享你的数据。除上文所述的 Unsplash 请求和 Chrome 同步外，数据不会离开你的浏览器。

## 管理和删除数据

- **导出收藏**：在设置中点击“导出”，收藏会保存为你电脑上的 JSON 文件。这个文件由你自行保管。
- **删除单张收藏**：在收藏画廊中删除。
- **删除 API Key**：在设置中清空并保存。
- **删除全部数据**：卸载 Tabr。卸载后，Chrome 会删除 Tabr 在本设备保存的数据。

## 儿童隐私

Tabr 不会收集任何人的个人信息，包括 13 岁以下的儿童。

## 政策更新

如果 Tabr 保存或访问的数据发生变化，我们会更新本政策，并修改顶部的更新日期。

## 联系我们

如有问题，请在 GitHub 提交 Issue：https://github.com/Moolan-d/tabr/issues
