# Surge Modules

个人自用的 Surge 模块，按需导入。

## 懂球帝 · 去开屏广告

- 模块：`dongqiudi.sgmodule`
- 原理：懂球帝的广告位接口是 `ap.dongdianqiu.com/plat/v3`（拉广告）和 `/plat/v4`（取配置，里面的 `timeout` 是 5000ms）。直接 REJECT 会让 App 等满 5 秒超时，表现为开屏白屏；所以改用 http-request 脚本**即时返回空数据**，App 立刻判定无广告。
- 依赖：`scripts/dqd-plat.js`（模块里用 raw URL 引用，无需本地文件）
- 需要：MITM 已开启且证书已信任（模块会 `%APPEND%` 到 `ap.dongdianqiu.com`）

导入地址：

```
https://raw.githubusercontent.com/BF-157/Surge/main/dongqiudi.sgmodule
```
