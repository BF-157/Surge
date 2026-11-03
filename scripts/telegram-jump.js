// Telegram 链接跳转：把 t.me / telegram.me 链接按当前选定的客户端改写为对应 scheme 的深链，并 302 过去。
//
// 为什么不用模块参数：Surge 的 #!arguments 参数表只在 Mac 上支持，iOS 上 {{client}} 不会被替换，
// 会拼出非法 scheme（浏览器再当相对路径拼回 t.me，形成死循环）。所以这里改成：
//   - 客户端偏好存在 Surge 的 $persistentStore（键 tg_jump_client），默认 TG
//   - 切换方式：访问 https://t.me/__tgclient__/<代号>（如 /sg、/ng、/tg）
//   - 查看当前：访问 https://t.me/__tgclient__
// 仍然兼容模块里写死的 argument=（per-client 模块方式）。
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
const KEY = 'tg_jump_client';
const SET_RE = /^__tgclient__(?:\/([A-Za-z]+))?\/?$/;

function resolveScheme(arg) {
  let raw = String(arg == null ? '' : arg).trim();
  // 模块参数没被替换（拿到 {{client}}）时回退
  if (!raw || raw.indexOf('{{') >= 0) raw = 'TG';
  const key = raw.toUpperCase();
  if (SCHEMES[key]) return SCHEMES[key];
  const cleaned = raw.toLowerCase().replace(/^([a-z0-9+.-]+):\/\/$/, '$1').replace(/[:\/]+$/, '');
  return /^[a-z][a-z0-9+.-]*$/.test(cleaned) ? cleaned : 'tg';
}

function codeOf(arg) {
  const raw = String(arg == null ? '' : arg).trim();
  return raw.toUpperCase().indexOf('{{') >= 0 ? 'TG' : raw.toUpperCase();
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
    return null;
  }
  if (query) target += (target.indexOf('?') >= 0 ? '&' : '?') + query;
  if (hash) target += hash;
  return target;
}

function page(title, text) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>${title}</title><body style="font:16px -apple-system;padding:32px;line-height:1.6">`
    + `<h2>${title}</h2><p>${text}</p></body>`;
}

function currentCode() {
  const stored = String(($persistentStore.read(KEY) || '')).trim();
  if (stored) return codeOf(stored);
  return codeOf($argument);
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

  // 切换/查看客户端
  const setm = rest.match(SET_RE);
  if (setm) {
    const code = setm[1];
    if (!code) {
      const cur = currentCode();
      $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: page('Telegram 跳转', `当前客户端：<b>${cur}</b>（${resolveScheme(cur)}://）<br><br>切换：访问 <code>t.me/__tgclient__/sg</code> 之类的链接。`) } });
    } else {
      const key = code.toUpperCase();
      const scheme = resolveScheme(key);
      $persistentStore.write(key, KEY);
      $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: page('已切换', `之后 t.me 链接都会跳转到 <b>${key}</b>（${scheme}://）。<br><br>可以关闭此页了。`) } });
    }
  } else {
    const target = buildTarget(resolveScheme(currentCode()), rest, query, hash);
    if (target) {
      $done({ response: { status: 302, headers: { Location: target } } });
    } else {
      $done({});
    }
  }
}
