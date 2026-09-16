// SIAN アクセスログWorker
// /b    : sian.bz からのビーコンを受けて 時刻・IP・ページ・参照元・UA・国 をD1に記録
// /logs : ?key=VIEW_KEY 付きでアクセスすると直近ログと集計を表示（非公開URL）

const CORS = {
  'Access-Control-Allow-Origin': 'https://sian.bz',
  'Cache-Control': 'no-store',
};

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|headless|monitor|fetch|curl|python|scrapy/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/b') {
      const ts = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const ua = (request.headers.get('User-Agent') || '').slice(0, 300);
      const country = (request.cf && request.cf.country) || '';
      const path = (url.searchParams.get('p') || '').slice(0, 200);
      const ref = (url.searchParams.get('r') || '').slice(0, 300);
      await env.DB.prepare(
        'INSERT INTO hits (ts, ip, path, ref, ua, country) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
      ).bind(ts, ip, path, ref, ua, country).run();
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/logs') {
      if (!env.VIEW_KEY || url.searchParams.get('key') !== env.VIEW_KEY) {
        return new Response('Not found', { status: 404 });
      }
      const { results } = await env.DB.prepare(
        'SELECT ts, ip, path, ref, ua, country FROM hits ORDER BY id DESC LIMIT 300'
      ).all();
      const total = (await env.DB.prepare('SELECT COUNT(*) AS c FROM hits').first()).c;
      const daily = (await env.DB.prepare(
        "SELECT substr(ts, 1, 10) AS d, COUNT(*) AS c FROM hits GROUP BY d ORDER BY d DESC LIMIT 14"
      ).all()).results;
      return new Response(renderLogs(results, total, daily), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response('sian-log', { status: 200 });
  },
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function jst(iso) {
  try {
    return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });
  } catch { return iso; }
}

function renderLogs(rows, total, daily) {
  const dailyHtml = daily.map((d) => `<span class="day">${esc(d.d)}<b>${d.c}</b></span>`).join('');
  const trs = rows.map((r) => {
    const bot = BOT_RE.test(r.ua) ? ' class="bot"' : '';
    return `<tr${bot}><td>${jst(r.ts)}</td><td>${esc(r.ip)}</td><td>${esc(r.country)}</td>` +
      `<td>${esc(r.path)}</td><td>${esc(r.ref)}</td><td title="${esc(r.ua)}">${esc(r.ua.slice(0, 60))}</td></tr>`;
  }).join('\n');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>SIAN アクセスログ</title><style>
body{font-family:"Yu Gothic",sans-serif;background:#050a24;color:#eaf2ff;margin:24px;font-size:13px}
h1{font-size:18px;letter-spacing:.1em} .sum{color:#7fd8e8;margin:12px 0}
.day{display:inline-block;margin:0 10px 6px 0;color:#8fa3c8}.day b{color:#eaf2ff;margin-left:4px}
table{border-collapse:collapse;width:100%;margin-top:12px}
th,td{border-bottom:1px solid rgba(234,242,255,.12);padding:6px 10px;text-align:left;white-space:nowrap}
th{color:#7fd8e8;font-weight:normal} tr.bot{opacity:.35}
</style></head><body>
<h1>SIAN アクセスログ（直近300件・時刻はJST）</h1>
<p class="sum">累計 ${total} 件 ／ 薄い行はbot判定</p>
<div>${dailyHtml}</div>
<table><tr><th>日時</th><th>IP</th><th>国</th><th>ページ</th><th>参照元</th><th>UA</th></tr>
${trs}</table></body></html>`;
}
