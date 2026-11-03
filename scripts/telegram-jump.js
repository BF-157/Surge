// Telegram 链接跳转：把 t.me / telegram.me 链接按所选客户端改写为对应 scheme 的深链，并 302 过去。
// 客户端代号（$argument，来自模块参数 client）：
//   TG=Telegram  NA=Nagram  SG=Swiftgram  TU=Turrit  IM=iMe  NG=Nicegram  LI=Lingogram  RE=Regram
// 传其它值时，直接把该值当作 scheme 前缀使用（例如 client=swiftgram）。
const SCHEMES = {
  TG: 'tg',
  NA: 'nagram',
  SG: 'swiftgram',
  TU: 'turrit',
  IM: 'ime',
  NG: 'nicegram',
  LI: 'lingogram',
  RE: 'regram'
};

function resolveScheme(arg) {
  let raw = String(arg == null ? '' : arg).trim();
  // 模块参数没被替换（例如 iOS 不支持参数表，拿到的是 {{client}}）时回退到官方 TG
  if (!raw || raw.indexOf('{{') >= 0) raw = 'TG';
  const key = raw.toUpperCase();
  if (SCHEMES[key]) return SCHEMES[key];
  // 允许直接传 scheme，兼容 "tg://" / "tg" 两种写法
  const cleaned = raw.toLowerCase().replace(/^([a-z0-9+.-]+):\/\/$/, '$1').replace(/[:\/]+$/, '');
  return /^[a-z][a-z0-9+.-]*$/.test(cleaned) ? cleaned : 'tg';
}

function buildTarget(scheme, rest, query, hash) {
  let target = '';
  if (/^\+/.test(rest)) {
    // 邀请链接 t.me/+hash
    target = `${scheme}://join?invite=${rest.slice(1)}`;
  } else if (/^joinchat\//i.test(rest)) {
    target = `${scheme}://join?invite=${rest.slice('joinchat/'.length)}`;
  } else if (/^s\//i.test(rest)) {
    // 网页预览链接 t.me/s/channel
    target = `${scheme}://resolve?domain=${rest.slice(2)}`;
  } else if (/^share\/url/i.test(rest)) {
    target = `${scheme}://msg_url${query ? '?' + query : ''}`;
    query = '';
  } else if (/^addstickers\//i.test(rest)) {
    target = `${scheme}://addstickers?set=${rest.slice('addstickers/'.length)}`;
  } else if (/^proxy/i.test(rest)) {
    target = `${scheme}://proxy${query ? '?' + query : ''}`;
    query = '';
  } else if (/^c\//i.test(rest)) {
    // 私有群/频道的历史消息：t.me/c/<channel>/<post>
    const p = rest.slice(2).split('/');
    target = `${scheme}://privatepost?channel=${p[0]}`;
    if (p[1]) target += `&post=${p[1]}`;
  } else if (rest) {
    const parts = rest.split('/');
    target = `${scheme}://resolve?domain=${parts[0]}`;
    if (parts[1]) target += `&post=${parts[1]}`;
  } else {
    // t.me 根路径：没有可跳转的目标
    return null;
  }
  if (query) target += (target.indexOf('?') >= 0 ? '&' : '?') + query;
  if (hash) target += hash;
  return target;
}

const url = $request.url || '';
const m = url.match(/^https?:\/\/(?:t|telegram)\.me(?:\/|$)(.*)$/i);

if (!m) {
  $done({});
} else {
  let rest = m[1] || '';

  // 拆出 fragment 和 query，最后再拼回去
  let hash = '';
  const hi = rest.indexOf('#');
  if (hi >= 0) { hash = rest.slice(hi); rest = rest.slice(0, hi); }
  let query = '';
  const qi = rest.indexOf('?');
  if (qi >= 0) { query = rest.slice(qi + 1); rest = rest.slice(0, qi); }
  rest = rest.replace(/^\/+/, '');

  const target = buildTarget(resolveScheme($argument), rest, query, hash);
  if (target) {
    $done({ response: { status: 302, headers: { Location: target } } });
  } else {
    $done({});
  }
}
