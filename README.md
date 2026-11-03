# Surge Modules

<p align="left">
  <img alt="Surge" src="https://img.shields.io/badge/Surge-iOS%20%7C%20macOS-ff6b35?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
  <img alt="Modules" src="https://img.shields.io/badge/modules-1-brightgreen?style=flat-square">
</p>

个人自用的 Surge 模块合集。所有模块都可以直接通过 raw 链接导入，脚本同样托管在本仓库，**不需要在本地放任何文件**。

## 模块一览

| 模块 | 作用 | 导入 |
| --- | --- | --- |
| [懂球帝 · 去开屏广告](dongqiudi.sgmodule) | 脚本即时返回空广告数据，消除开屏广告与白屏等待 | [一键安装][dqd-raw] |

[dqd-raw]: https://raw.githubusercontent.com/BF-157/Surge/main/dongqiudi.sgmodule

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

## 仓库结构

```
.
├── dongqiudi.sgmodule    # 懂球帝去开屏广告模块
├── scripts/
│   └── dqd-plat.js       # 广告位接口 mock 脚本
├── LICENSE
└── README.md
```

## 说明

- 模块按需导入，互不影响；每个模块的依赖都写在对应小节里
- 仓库内容仅用于个人去广告，请自行评估使用场景
- 有新模块会直接追加到上表

## License

[MIT](LICENSE)
