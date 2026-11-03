# Surge Modules

<p align="left">
  <img alt="Surge" src="https://img.shields.io/badge/Surge-iOS%20%7C%20macOS-ff6b35?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
  <img alt="Modules" src="https://img.shields.io/badge/modules-2-brightgreen?style=flat-square">
</p>

个人自用的 Surge 模块合集。所有模块都可以直接通过 raw 链接导入，脚本同样托管在本仓库，**不需要在本地放任何文件**。

## 模块一览

| 模块 | 作用 | 导入 |
| --- | --- | --- |
| [懂球帝 · 去开屏广告](dongqiudi.sgmodule) | 脚本即时返回空广告数据，消除开屏广告与白屏等待 | [一键安装][dqd-raw] |
| [Telegram 跳转](telegram-jump.sgmodule) | 点 `t.me` 链接跳到所选的 Telegram 客户端（一个模块，链接里切换） | [一键安装][tg-raw] |

[dqd-raw]: https://raw.githubusercontent.com/BF-157/Surge/main/dongqiudi.sgmodule
[tg-raw]: https://raw.githubusercontent.com/BF-157/Surge/main/telegram-jump.sgmodule

## 安装

**方式一：URL 导入（推荐）**

1. 打开 Surge → 「模块」→ 「安装新模块」
2. 粘贴上表中的 raw 链接
3. 确认模块已启用，并按提示安装/信任 MITM 证书

**方式二：本地安装**

把 `.sgmodule` 文件放到 iCloud Drive 或「文件」App 中，用 Surge 打开即可安装。

> 模块更新后会随 Surge 自动刷新；卸载在「模块」页面左滑即可。

## 懂球帝 · 去开屏广告

**接口**：广告位走 `ap.dongdianqiu.com/plat/v3`（拉广告）和 `/plat/v4`（取配置，`timeout` 为 5000ms）。

**为什么不用 REJECT**：直接 `REJECT` 请求不会返回响应，App 会等满 5 秒超时才继续，表现为开屏白屏。所以这里改用 http-request 脚本**立即返回 200 空数据**，App 判定无广告后直接跳过开屏。

| 请求 | 返回 |
| --- | --- |
| `GET /plat/v3/...` | `[]` |
| `GET /plat/v4/...` | `{"sdk":[],"addata":[]}` |

模块内还保留了一条 `DOMAIN-SUFFIX,ap.dongdianqiu.com,REJECT-TINYGIF` 兜底规则：当 MITM 失效或脚本拉取失败时，仍能拦住广告请求。

**依赖**

- `scripts/dqd-plat.js`：广告位接口 mock 脚本，模块通过 raw URL 引用
- MITM 已开启，且 `ap.dongdianqiu.com` 的证书已信任

## Telegram 跳转

**作用**：点开 `t.me` / `telegram.me` 链接时，跳到你所选的客户端，而不是官方 App 或网页。

**选客户端（推荐）**：导入后到 模块 → 该模块 →「参数」里改 `client`，可选 `TG`/`NA`/`SG`/`TU`/`IM`/`NG`/`LI`/`RE`，也可以直接填真实 scheme（如 `swiftgram`），改完立即生效。

> 注意占位符是**三花括号** `{{{client}}}`，写成两花括号 `{{client}}` 不会被替换（会原样拼进跳转地址，浏览器当相对路径拼回 t.me，形成死循环）。

**备用切换方式**：参数留空时，打开 **`https://t.me/__tgclient__`** 会出现选择页，点哪个客户端就切到哪个（偏好存在 Surge 本地）。也可以直接访问下面的链接切。

| 打开这个链接 | 之后 t.me 跳到 |
| --- | --- |
| `https://t.me/__tgclient__/tg` | Telegram |
| `https://t.me/__tgclient__/na` | Nagram |
| `https://t.me/__tgclient__/sg` | Swiftgram |
| `https://t.me/__tgclient__/tu` | Turrit |
| `https://t.me/__tgclient__/im` | iMe |
| `https://t.me/__tgclient__/ng` | Nicegram |
| `https://t.me/__tgclient__/li` | Lingogram |
| `https://t.me/__tgclient__/re` | Regram |
| `https://t.me/__tgclient__` | 查看当前客户端 |

偏好写在 `$persistentStore` 的 `tg_jump_client` 键里。

> **为什么不走模块参数**：`#!arguments` 参数表只有 Mac 支持，iOS 上 `{{client}}` 不会被替换，原样拼进跳转地址就是非法 scheme；浏览器又会把它当相对路径拼回 `t.me`，于是无限递归（这次踩的就是这个坑）。所以改成脚本读本地偏好，一个模块搞定。

**为什么需要脚本**：纯 `[URL Rewrite]` 只能把参数原样拼进目标地址，`SG://...` 并不是有效 scheme；而且 t.me 的链接形态不止一种。脚本把代号映射成真实 scheme，并分别处理：

| 链接 | 跳转结果（以 TG 为例） |
| --- | --- |
| `t.me/durov` | `tg://resolve?domain=durov` |
| `t.me/durov/123` | `tg://resolve?domain=durov&post=123` |
| `t.me/+hash`、`t.me/joinchat/hash` | `tg://join?invite=hash` |
| `t.me/s/durov`（网页预览） | `tg://resolve?domain=durov` |
| `t.me/c/<channel>/<post>`（私有群消息） | `tg://privatepost?channel=...&post=...` |
| `t.me/share/url?...` | `tg://msg_url?...` |
| `t.me/proxy?...`、`t.me/addstickers/...` | `tg://proxy?...`、`tg://addstickers?set=...` |

脚本直接以 `302 + Location: <深链>` 返回，Safari 收到后唤起 App。

**依赖**

- `scripts/telegram-jump.js`：跳转脚本，模块通过 raw URL 引用
- MITM 已开启（模块会 `%APPEND%` `t.me, telegram.me`）

## 仓库结构

```
.
├── dongqiudi.sgmodule    # 懂球帝去开屏广告模块
├── telegram-jump.sgmodule    # Telegram 跳转（单模块，可切换客户端）
├── scripts/
│   ├── dqd-plat.js       # 广告位接口 mock 脚本
│   └── telegram-jump.js  # t.me 深链跳转脚本
├── LICENSE
└── README.md
```

## 说明

- 模块按需导入，互不影响；每个模块的依赖都写在对应小节里
- 仓库内容仅用于个人去广告，请自行评估使用场景
- 有新模块会直接追加到上表

## License

[MIT](LICENSE)
