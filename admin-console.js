const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const logoutButton = document.getElementById("logoutButton");
const newsForm = document.getElementById("newsForm");
const previewButton = document.getElementById("previewButton");
const saveStatus = document.getElementById("saveStatus");
const publishButton = document.getElementById("publishButton");
const publishStatus = document.getElementById("publishStatus");
const newsList = document.getElementById("newsList");

function setText(node, text) {
  node.textContent = text;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}

function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showDashboard(isLoggedIn) {
  loginCard.classList.toggle("hidden", isLoggedIn);
  dashboard.classList.toggle("hidden", !isLoggedIn);
}

function renderNewsList(news) {
  newsList.replaceChildren();
  if (!news.length) {
    const empty = document.createElement("p");
    empty.textContent = "ยังไม่มีข่าวในระบบ";
    newsList.append(empty);
    return;
  }
  news.slice(0, 8).forEach((item) => {
    const card = document.createElement("article");
    card.className = "news-item";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const meta = document.createElement("small");
    meta.textContent = `${item.category || "ข่าว"} • ${item.displayDate || item.date || ""}`;
    card.append(title, meta);
    newsList.append(card);
  });
}

async function loadNewsList() {
  const data = await api("/api/news");
  renderNewsList(data.news || []);
}

async function boot() {
  try {
    const data = await api("/api/admin/me");
    showDashboard(Boolean(data.authenticated));
    if (data.authenticated) await loadNewsList();
  } catch {
    showDashboard(false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setText(loginStatus, "กำลังเข้าสู่ระบบ...");
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(formDataToObject(loginForm))
    });
    loginForm.reset();
    showDashboard(true);
    setText(loginStatus, "");
    await loadNewsList();
  } catch (error) {
    setText(loginStatus, error.message);
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" });
  showDashboard(false);
});

previewButton.addEventListener("click", async () => {
  setText(saveStatus, "กำลังตรวจแบบร่าง...");
  try {
    const data = await api("/api/news", {
      method: "POST",
      body: JSON.stringify({ ...formDataToObject(newsForm), dryRun: true })
    });
    setText(saveStatus, `แบบร่างพร้อมใช้งาน\nรหัสข่าว: ${data.record.id}\nไฟล์ที่จะสร้าง: ${data.articlePath}`);
  } catch (error) {
    setText(saveStatus, error.message);
  }
});

newsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setText(saveStatus, "กำลังบันทึกข่าวจริง...");
  try {
    const data = await api("/api/news", {
      method: "POST",
      body: JSON.stringify(formDataToObject(newsForm))
    });
    setText(saveStatus, `บันทึกสำเร็จ\nสร้างไฟล์: ${data.articlePath}\nลิงก์ข่าว: ${data.record.href}`);
    newsForm.reset();
    await loadNewsList();
  } catch (error) {
    setText(saveStatus, error.message);
  }
});

publishButton.addEventListener("click", async () => {
  setText(publishStatus, "กำลัง commit และ push...");
  try {
    const data = await api("/api/publish", {
      method: "POST",
      body: JSON.stringify({ message: "Add news article from admin console" })
    });
    setText(publishStatus, data.message || "เผยแพร่สำเร็จ");
  } catch (error) {
    setText(publishStatus, error.message);
  }
});

boot();
