import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const slug = req.url.replace(/^\//, "").split("?")[0];

  if (!slug || slug === "favicon.ico") return res.status(404).end();

  const card = await kv.get(`card:${slug}`);

  if (!card) {
    return res.status(404).send(`<!DOCTYPE html><html><body><h2>カードが見つかりません</h2></body></html>`);
  }

  const { title, description, image, url, site, style = "a", color = "#0F6E56" } = card;
  const safeTitle = String(title).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeDesc  = String(description || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeSite  = String(site || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeImg   = String(image || "").replace(/"/g, "&quot;");
  const safeUrl   = String(url).replace(/"/g, "&quot;");

  const imgTag = image
    ? `<img class="card-img" src="${safeImg}" alt="" onerror="this.style.background='${color}22'" />`
    : `<div class="card-img no-img"></div>`;

  const siteHtml = site
    ? `<div class="card-site"><span class="site-dot"></span>${safeSite}</div>`
    : "";

  const styleA = `
    .card { display:flex; flex-direction:row; height:120px; }
    .card-img { width:140px; flex-shrink:0; object-fit:cover; height:100%; }
    .card-body { flex:1; display:flex; flex-direction:column; justify-content:center; gap:4px; }
  `;
  const styleB = `
    .card { display:flex; flex-direction:column; }
    .card-img { width:100%; height:200px; object-fit:cover; }
    .card-body { padding:14px 16px; }
  `;
  const styleC = `
    .card { position:relative; height:200px; }
    .card-img { width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; }
    .card-overlay { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(0,0,0,.75)); padding:32px 16px 16px; }
    .card-title { color:#fff !important; }
    .card-desc  { color:rgba(255,255,255,.82) !important; }
    .card-site  { color:rgba(255,255,255,.6) !important; }
    .site-dot   { background:rgba(255,255,255,.6) !important; }
  `;

  const cardStyleMap = { a: styleA, b: styleB, c: styleC };
  const chosenStyle = cardStyleMap[style] || styleA;

  const bodyContent = style === "c"
    ? `${imgTag}<div class="card-overlay"><div class="card-title">${safeTitle}</div><div class="card-desc">${safeDesc}</div>${siteHtml}</div>`
    : `${imgTag}<div class="card-body"><div class="card-title">${safeTitle}</div><div class="card-desc">${safeDesc}</div>${siteHtml}</div>`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta property="og:title"       content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image"       content="${safeImg}" />
  <meta property="og:url"         content="${safeUrl}" />
  <meta property="og:type"        content="website" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${safeImg}" />
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    a.card{display:block;max-width:500px;width:100%;overflow:hidden;border-radius:12px;text-decoration:none;background:#fff;border:1px solid #e5e5e5;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .card-img{background:${color}22}
    .no-img{height:140px}
    .card-body{padding:14px 16px}
    .card-title{font-size:14px;font-weight:600;line-height:1.3;color:#1a1a1a}
    .card-desc{font-size:12px;line-height:1.4;color:#666;margin-top:3px}
    .card-site{font-size:11px;margin-top:6px;display:flex;align-items:center;gap:4px;color:${color}}
    .site-dot{width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0}
    p.note{margin-top:12px;font-size:12px;color:#aaa;text-align:center}
    ${chosenStyle}
  </style>
</head>
<body>
  <div>
    <a class="card" href="${safeUrl}">${bodyContent}</a>
    <p class="note">自動でリダイレクトします… <a href="${safeUrl}" style="color:#aaa">手動で移動</a></p>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600");
  return res.status(200).send(html);
}
