// 懂球帝广告位接口 mock：直接返回「没有广告」的 200 响应，不产生任何网络请求。
// 用于替代 REJECT —— REJECT 会让 App 等满广告 SDK 的超时（5 秒左右），表现为开屏白屏。
const url = $request.url || '';
let body = '[]';
if (/\/plat\/v4(\?|$)/.test(url)) {
  // v4 返回广告位配置，sdk 为空即代表没有可拉取的广告
  body = '{"sdk":[],"addata":[]}';
}
$done({
  response: {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: body
  }
});
