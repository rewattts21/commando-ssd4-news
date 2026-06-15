const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const { execFile } = require("node:child_process");

const ROOT = __dirname;
const HOST = process.env.SSD4_ADMIN_HOST || "127.0.0.1";
const PORT = Number(process.env.SSD4_ADMIN_PORT || 8787);
const PASSWORD = process.env.SSD4_ADMIN_PASSWORD || "changeme-ssd4";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const MAX_BODY_BYTES = 1024 * 1024 * 2;
const NEWS_DATA_FILE = path.join(ROOT, "assets", "data", "news-data.js");
const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");
const sessions = new Map();

if (!process.env.SSD4_ADMIN_PASSWORD) {
  console.warn("[SSD4 Admin] ใช้รหัสเริ่มต้น changeme-ssd4 กรุณาตั้ง SSD4_ADMIN_PASSWORD ก่อนใช้งานจริง");
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(response, status, data) {
  response.writeHead(status, securityHeaders({ "Content-Type": "application/json; charset=utf-8" }));
  response.end(JSON.stringify(data));
}

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    ...extra
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request-too-large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid-json"));
      }
    });
    request.on("error", reject);
  });
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
    const index = cookie.indexOf("=");
    return [cookie.slice(0, index).trim(), decodeURIComponent(cookie.slice(index + 1))];
  }));
}

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isAuthenticated(request) {
  const token = parseCookies(request).ssd4_admin;
  const expires = token && sessions.get(token);
  if (!expires || expires < Date.now()) {
    if (token) sessions.delete(token);
    return false;
  }
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return true;
}

function requireAuth(request, response) {
  if (isAuthenticated(request)) return true;
  sendJson(response, 401, { ok: false, error: "unauthorized" });
  return false;
}

function isSafePostOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  return origin === `http://${HOST}:${PORT}` || origin === `http://localhost:${PORT}`;
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function htmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function attrEscape(value = "") {
  return htmlEscape(value).replaceAll("`", "&#96;");
}

function clampText(value, maxLength) {
  return String(value || "").trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

function slugify(value) {
  const base = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ก-ฮะ-์]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || `news-${Date.now()}`;
}

function toDisplayDate(isoDate) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${day} ${months[month - 1]} ${year + 543}`;
}

function loadNews() {
  const source = fs.readFileSync(NEWS_DATA_FILE, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: NEWS_DATA_FILE, timeout: 1000 });
  if (!Array.isArray(sandbox.window.SSD4_NEWS)) return [];
  return sandbox.window.SSD4_NEWS;
}

function saveNews(newsList) {
  const output = `window.SSD4_NEWS = ${JSON.stringify(newsList, null, 2)};\n`;
  fs.writeFileSync(NEWS_DATA_FILE, output, "utf8");
}

function validateNews(input) {
  const title = clampText(input.title, 220);
  const date = clampText(input.date, 10);
  const excerpt = clampText(input.excerpt, 420);
  if (!title) throw new Error("กรุณาระบุหัวข้อข่าว");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("กรุณาระบุวันที่รูปแบบ YYYY-MM-DD");
  if (!excerpt) throw new Error("กรุณาระบุสรุปข่าว");
  return {
    title,
    titleLines: title.split("\n").map((line) => line.trim()).filter(Boolean),
    category: clampText(input.category || "ข่าวจับกุม", 60),
    date,
    displayDate: clampText(input.displayDate || toDisplayDate(date), 40),
    excerpt,
    area: clampText(input.area, 120),
    result: clampText(input.result, 120),
    caseStatus: clampText(input.caseStatus || "อยู่ระหว่างดำเนินคดี", 120),
    image: normalizeAssetPath(input.image || "assets/news/placeholder.jpg"),
    videoHref: normalizeAssetPath(input.videoHref || ""),
    keywords: clampText(input.keywords, 240),
    sourceText: clampText(input.sourceText, 120),
    sourceUrl: clampText(input.sourceUrl, 500),
    summary: clampText(input.summary, 4000),
    behavior: clampText(input.behavior, 4000),
    arrest: clampText(input.arrest, 4000),
    publicWarning: clampText(input.publicWarning, 4000),
    legalNote: clampText(input.legalNote || "หมายเหตุ: บุคคลที่ถูกกล่าวหายังถือเป็นผู้บริสุทธิ์จนกว่าศาลจะมีคำพิพากษาถึงที่สุด", 500)
  };
}

function normalizeAssetPath(value) {
  const text = clampText(value, 500).replaceAll("\\", "/");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return text.replace(/^\/+/, "").replace(/\.\./g, "");
}

function articleImagePath(news) {
  if (!news.image) return "";
  if (/^https?:\/\//i.test(news.image)) return news.image;
  return `../${news.image}`;
}

function articleVideoPath(news) {
  if (!news.videoHref) return "";
  if (/^https?:\/\//i.test(news.videoHref)) return news.videoHref;
  return `../${news.videoHref}`;
}

function buildArticleHtml(news) {
  const headline = news.titleLines.length ? news.titleLines : [news.title];
  const h1 = headline.map((line) => htmlEscape(line)).join("<br>");
  const sourceLink = news.sourceUrl
    ? `<a href="${attrEscape(news.sourceUrl)}" target="_blank" rel="noopener noreferrer">${htmlEscape(news.sourceText || "แหล่งข่าว")}</a>`
    : htmlEscape(news.sourceText || "COMMANDO SSD4 News Desk");
  const video = news.videoHref ? `
          <section id="video" class="article-section">
            <h2>คลิปวิดีโอ</h2>
            <video controls preload="metadata" poster="${attrEscape(articleImagePath(news))}">
              <source src="${attrEscape(articleVideoPath(news))}" type="video/mp4">
              เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
            </video>
          </section>` : "";
  const sections = [
    ["สรุปผลการปฏิบัติ", news.summary],
    ["พฤติการณ์คดีเตือนภัย", news.behavior],
    ["นาทีชาร์จจับกุม", news.arrest],
    ["คอมมานโดเตือนภัยประชาชน", news.publicWarning]
  ].filter(([, body]) => body).map(([heading, body]) => `
          <section class="article-section">
            <h2>${htmlEscape(heading)}</h2>
            ${body.split("\n\n").map((paragraph) => `<p>${htmlEscape(paragraph).replace(/\n/g, "<br>")}</p>`).join("\n            ")}
          </section>`).join("\n");

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(news.title)}</title>
  <meta name="description" content="${attrEscape(news.excerpt)}">
  <meta name="theme-color" content="#080d14">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${attrEscape(news.title)}">
  <meta property="og:description" content="${attrEscape(news.excerpt)}">
  <meta property="og:image" content="https://commandossd4.com/${attrEscape(news.image)}">
  <meta property="og:url" content="https://commandossd4.com/${attrEscape(news.href)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; form-action 'none'; img-src 'self' data: https:; font-src 'self'; media-src 'self'; manifest-src 'self'; style-src 'self'; style-src-elem 'self'; style-src-attr 'none'; script-src 'self'; script-src-elem 'self'; script-src-attr 'none'; connect-src 'self'; navigate-to 'self' https://www.facebook.com https://www.instagram.com https://www.youtube.com https://www.tiktok.com https://maps.app.goo.gl mailto:; trusted-types default; require-trusted-types-for 'script'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <link rel="canonical" href="https://commandossd4.com/${attrEscape(news.href)}">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="../assets/brand/commando-ssd4-header-logo-clean.png">
  <link rel="stylesheet" href="../styles.css?v=admin-news">
</head>
<body id="top">
  <header class="site-header">
    <a class="brand" href="../index.html#home" aria-label="กลับหน้าแรก">
      <img class="brand-mark" src="../assets/brand/commando-ssd4-header-logo-clean.png" alt="โลโก้ COMMANDO SSD4">
      <span>
        <strong>กองกำกับการ 4</strong>
        <small>กองบังคับการปฏิบัติการพิเศษ</small>
      </span>
    </a>
    <button class="menu-button" type="button" aria-label="เปิดเมนู" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="main-nav" aria-label="เมนูหลัก">
      <a href="../index.html#home">หน้าแรก</a>
      <a href="../news.html">รวมข่าว</a>
      <a href="../index.html#about">เกี่ยวกับ</a>
      <a href="../commanders.html">ผู้บังคับบัญชา</a>
      <a href="../index.html#contact">ติดต่อ</a>
    </nav>
  </header>
  <main class="article-main">
    <article class="article-page">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a href="../index.html">หน้าแรก</a><span>/</span><a href="../news.html">รวมข่าว</a>
      </nav>
      <header class="article-header">
        <span class="news-tag">${htmlEscape(news.category)}</span>
        <time datetime="${attrEscape(news.date)}">${htmlEscape(news.displayDate)}</time>
        <h1>${h1}</h1>
        <p>${htmlEscape(news.excerpt)}</p>
        <div class="article-meta-grid">
          <span><strong>พื้นที่:</strong> ${htmlEscape(news.area || "-")}</span>
          <span><strong>ผลปฏิบัติ:</strong> ${htmlEscape(news.result || "-")}</span>
          <span><strong>สถานะคดี:</strong> ${htmlEscape(news.caseStatus || "-")}</span>
        </div>
        <p class="legal-note">${htmlEscape(news.legalNote)}</p>
      </header>
      <figure class="article-cover">
        <img src="${attrEscape(articleImagePath(news))}" alt="${attrEscape(news.title)}">
      </figure>
      <div class="article-content">
        <div class="article-body">
${sections}
${video}
        </div>
        <aside class="article-sidebar" aria-label="ข้อมูลข่าว">
          <div class="article-card">
            <span>แหล่งข้อมูล</span>
            <strong>${sourceLink}</strong>
          </div>
          <div class="article-card">
            <span>อ่านข่าวอื่น</span>
            <a href="../news.html">ไปหน้ารวมข่าว</a>
          </div>
        </aside>
      </div>
    </article>
  </main>
  <footer class="site-footer">
    <p>© 2026 COMMANDO SSD4 • กองกำกับการ 4 กองบังคับการปฏิบัติการพิเศษ</p>
  </footer>
  <script src="../script.js?v=admin-news" defer></script>
</body>
</html>
`;
}

function createNews(input, options = {}) {
  const data = validateNews(input);
  const id = `${data.date}-${slugify(data.titleLines[0] || data.title)}`;
  const href = `news/${id}.html`;
  const existingNews = loadNews();
  if (existingNews.some((item) => item.id === id)) throw new Error("มีข่าวรหัสนี้อยู่แล้ว กรุณาปรับหัวข้อหรือวันที่");
  const record = {
    id,
    status: "published",
    category: data.category,
    tags: data.keywords ? data.keywords.split(/[,\s#]+/).filter(Boolean).slice(0, 8) : [data.category],
    date: data.date,
    displayDate: data.displayDate,
    title: data.title.replace(/\n+/g, " "),
    titleLines: data.titleLines,
    excerpt: data.excerpt,
    href,
    videoHref: data.videoHref ? href + "#video" : "",
    image: data.image,
    thumbnails: [data.image].filter(Boolean),
    area: data.area,
    result: data.result,
    caseStatus: data.caseStatus,
    warning: data.legalNote.replace(/^หมายเหตุ:\s*/, ""),
    keywords: data.keywords
  };
  if (options.dryRun) {
    return { record, articlePath: path.join(ROOT, href), dryRun: true };
  }
  const articleHtml = buildArticleHtml({ ...data, ...record, sourceText: data.sourceText, sourceUrl: data.sourceUrl, summary: data.summary, behavior: data.behavior, arrest: data.arrest, publicWarning: data.publicWarning, legalNote: data.legalNote });
  const articlePath = path.join(ROOT, href);
  fs.mkdirSync(path.dirname(articlePath), { recursive: true });
  fs.writeFileSync(articlePath, articleHtml, "utf8");
  saveNews([record, ...existingNews]);
  updateSitemap(href);
  return { record, articlePath };
}

function updateSitemap(href) {
  if (!fs.existsSync(SITEMAP_FILE)) return;
  const url = `https://commandossd4.com/${href}`;
  let sitemap = fs.readFileSync(SITEMAP_FILE, "utf8");
  if (sitemap.includes(url)) return;
  const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  fs.writeFileSync(SITEMAP_FILE, sitemap, "utf8");
}

function runGit(args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd: ROOT, windowsHide: true, timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${stderr || stdout || error.message}`.trim()));
        return;
      }
      resolve((stdout || stderr || "").trim());
    });
  });
}

async function publishChanges(message) {
  await runGit(["add", "assets/data/news-data.js", "news", "sitemap.xml"]);
  const status = await runGit(["status", "--short"]);
  if (!status) return { committed: false, pushed: false, message: "ไม่มีไฟล์เปลี่ยนแปลง" };
  await runGit(["commit", "-m", clampText(message || "Add news article from admin", 120)]);
  await runGit(["push", "origin", "main"]);
  return { committed: true, pushed: true, message: "เผยแพร่ขึ้น GitHub Pages แล้ว" };
}

function serveStatic(request, response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(ROOT, "." + safePath);
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
      response.end("Not found");
      return;
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, securityHeaders({ "Content-Type": type }));
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === "POST" && !isSafePostOrigin(request)) {
      sendJson(response, 403, { ok: false, error: "origin-not-allowed" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/admin/me") {
      sendJson(response, 200, { ok: true, authenticated: isAuthenticated(request), host: `${HOST}:${PORT}` });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      const body = await readBody(request);
      if (!safeCompare(body.password || "", PASSWORD)) {
        sendJson(response, 401, { ok: false, error: "รหัสผ่านไม่ถูกต้อง" });
        return;
      }
      const token = createSession();
      response.writeHead(200, securityHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `ssd4_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
      }));
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/admin/logout") {
      const token = parseCookies(request).ssd4_admin;
      if (token) sessions.delete(token);
      response.writeHead(200, securityHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": "ssd4_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
      }));
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/news") {
      if (!requireAuth(request, response)) return;
      sendJson(response, 200, { ok: true, news: loadNews() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/news") {
      if (!requireAuth(request, response)) return;
      const body = await readBody(request);
      const result = createNews(body, { dryRun: Boolean(body.dryRun) });
      sendJson(response, 201, { ok: true, ...result, articlePath: result.articlePath.replace(ROOT + path.sep, "") });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/publish") {
      if (!requireAuth(request, response)) return;
      const body = await readBody(request);
      const result = await publishChanges(body.message);
      sendJson(response, 200, { ok: true, ...result });
      return;
    }
    if (request.method === "GET") {
      serveStatic(request, response, url.pathname);
      return;
    }
    sendJson(response, 405, { ok: false, error: "method-not-allowed" });
  } catch (error) {
    sendJson(response, error.message === "request-too-large" ? 413 : 400, { ok: false, error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[SSD4 Admin] เปิดใช้งานที่ http://${HOST}:${PORT}/admin-console.html`);
});
