// Telegram 链接跳转：把 t.me / telegram.me 链接按当前选定的客户端改写为对应 scheme 的深链，并 302 过去。
//
// 一个模块搞定客户端选择（iOS 不支持 Surge 的模块参数表，所以不能用 #!arguments）：
//   - 打开 https://t.me/__tgclient__  →  返回一个选择页，点哪个客户端就切到哪个
//   - 打开 https://t.me/__tgclient__/<代号>  →  直接切换（tg/na/sg/tu/im/ng/li/re）
//   - 选择存在 Surge 的 $persistentStore（键 tg_jump_client），默认 TG
const CLIENTS = [
  { code: 'TG', name: 'Telegram',  scheme: 'tg' },
  { code: 'NA', name: 'Nagram',    scheme: 'nagram' },
  { code: 'SG', name: 'Swiftgram', scheme: 'swiftgram' },
  { code: 'TU', name: 'Turrit',    scheme: 'turrit' },
  { code: 'IM', name: 'iMe',       scheme: 'ime' },
  { code: 'NG', name: 'Nicegram',  scheme: 'nicegram' },
  { code: 'LI', name: 'Lingogram', scheme: 'lingogram' },
  { code: 'RE', name: 'Regram',    scheme: 'regram' }
];
const KEY = 'tg_jump_client';
const SET_RE = /^__tgclient__(?:\/([A-Za-z]+))?\/?$/;

function byCode(code) {
  const c = String(code || '').toUpperCase();
  return CLIENTS.filter((x) => x.code === c)[0] || null;
}

function resolveScheme(arg) {
  let raw = String(arg == null ? '' : arg).trim();
  if (!raw || raw.indexOf('{{') >= 0) raw = 'TG';
  const hit = byCode(raw);
  if (hit) return hit.scheme;
  const cleaned = raw.toLowerCase().replace(/^([a-z0-9+.-]+):\/\/$/, '$1').replace(/[:\/]+$/, '');
  return /^[a-z][a-z0-9+.-]*$/.test(cleaned) ? cleaned : 'tg';
}

function argValue() {
  const raw = String($argument == null ? '' : $argument).trim();
  // 模块参数没被替换（拿到 {{{client}}} 之类）时视为未设置
  if (!raw || raw.indexOf('{{') >= 0) return '';
  return raw;
}

function codeOfScheme(scheme) {
  const hit = CLIENTS.filter((x) => x.scheme === scheme)[0];
  return hit ? hit.code : null;
}

function currentCode() {
  const a = argValue();
  if (a) {
    const code = (byCode(a) || {}).code || codeOfScheme(resolveScheme(a));
    if (code) return code;
  }
  const stored = String($persistentStore.read(KEY) || '').trim();
  const hit = byCode(stored);
  return hit ? hit.code : 'TG';
}

function currentScheme() {
  const a = argValue();
  return resolveScheme(a || currentCode());
}

function buildTarget(scheme, rest, query, hash) {
  let target = '';
  if (/^\+/.test(rest)) {
    target = `${scheme}://join?invite=${rest.slice(1)}`;
  } else if (/^joinchat\//i.test(rest)) {
    target = `${scheme}://join?invite=${rest.slice('joinchat/'.length)}`;
  } else if (/^s\//i.test(rest)) {
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

const STYLE = `<style>
*{box-sizing:border-box}body{margin:0;padding:24px 20px 40px;font:16px/1.5 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;background:#f2f2f7;color:#111}
h1{font-size:22px;margin:0 0 6px}.sub{color:#6b6b70;font-size:14px;margin:0 0 20px}
.item{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:12px;padding:15px 16px;margin-bottom:10px;text-decoration:none;color:#111}
.item.on{outline:2px solid #0a84ff}
.item .n{font-weight:600}.item .c{color:#8e8e93;font-size:13px;margin-left:8px}
.cur{color:#0a84ff;font-size:13px}
.tip{color:#8e8e93;font-size:13px;margin-top:22px;line-height:1.6}
</style>`;

function selectPage(cur) {
  const c = byCode(cur) || CLIENTS[0];
  const items = CLIENTS.map((x) =>
    `<a class="item${x.code === c.code ? ' on' : ''}" href="/__tgclient__/${x.code.toLowerCase()}">`
    + `<span><span class="n">${x.name}</span><span class="c">${x.code}</span></span>`
    + (x.code === c.code ? '<span class="cur">当前</span>' : `<span class="c">${x.scheme}://</span>`)
    + '</a>'
  ).join('');
  const note = argValue()
    ? '当前由模块参数 client 指定；下面点选只在参数留空时生效。'
    : '点一项切换，之后 t.me 链接都按它跳。';
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>Telegram 跳转</title>${STYLE}`
    + `<h1>Telegram 跳转</h1><p class="sub">当前：${c.name}（${c.scheme}://）。${note}</p>`
    + items
    + `<p class="tip">也可以直接访问 t.me/__tgclient__/sg 这类链接切换；选择保存在 Surge 本地，重启不丢。</p>`;
}

function donePage(code) {
  const c = byCode(code) || CLIENTS[0];
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>已切换</title>${STYLE}`
    + `<h1>已切换到 ${c.name}</h1><p class="sub">之后 t.me 链接都会跳到 ${c.scheme}://。</p>`
    + `<a class="item on" href="/__tgclient__"><span class="n">返回选择页</span></a>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openPage(target, code) {
  const c = byCode(code) || CLIENTS[0];
  const safe = esc(target);
  const js = JSON.stringify(target).replace(/</g, '\\u003c');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
    + `<title>打开 ${c.name}</title>${STYLE}`
    + `<h1>打开 ${c.name}</h1>`
    + `<p class="sub">正在唤起客户端… 如果没反应，点下面的按钮。</p>`
    + `<a class="item on" href="${safe}"><span class="n">在 ${c.name} 中打开</span><span class="c">${c.scheme}://</span></a>`
    + `<p class="tip">目标地址：<code>${safe}</code></p>`
    + `<script>setTimeout(function(){ window.location.href = ${js}; }, 80);</script>`;
}

const url = $request.url || '';
const m = url.match(/^https?:\/\/(?:t|telegram)\.me(?:\/|$)(.*)$/i);

if (!m) {
  $done({});
} else {
  let rest = m[1] || '';

  let hash = '';
  const hi = rest.indexOf('#');
  if (hi >= 0) { hash = rest.slice(hi); rest = rest.slice(0, hi); }
  let query = '';
  const qi = rest.indexOf('?');
  if (qi >= 0) { query = rest.slice(qi + 1); rest = rest.slice(0, qi); }
  rest = rest.replace(/^\/+/, '');

  const setm = rest.match(SET_RE);
  if (setm) {
    const code = setm[1];
    if (!code) {
      $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: selectPage(currentCode()) } });
    } else {
      const c = byCode(code);
      if (!c) {
        $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
          body: selectPage(currentCode()) } });
      } else {
        $persistentStore.write(c.code, KEY);
        $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
          body: donePage(c.code) } });
      }
    }
  } else {
    const target = buildTarget(currentScheme(), rest, query, hash);
    if (target) {
      $done({ response: { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: openPage(target, currentCode()) } });
    } else {
      $done({});
    }
  }
}
