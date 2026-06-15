const draftForm = document.querySelector("#draftForm");
const draftList = document.querySelector("#draftList");
const draftCount = document.querySelector("#draftCount");
const publishedCount = document.querySelector("#publishedCount");
const formStatus = document.querySelector(".form-status");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const previewCategory = document.querySelector("#previewCategory");
const previewDate = document.querySelector("#previewDate");
const previewTitle = document.querySelector("#previewTitle");
const previewSummary = document.querySelector("#previewSummary");
const previewArea = document.querySelector("#previewArea");
const storageKey = "commando-ssd4-admin-drafts";
const publishedNews = Array.isArray(window.SSD4_NEWS) ? window.SSD4_NEWS : [];

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function setDrafts(drafts) {
  localStorage.setItem(storageKey, JSON.stringify(drafts));
}

function makeSlug(title, date) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `${date || new Date().toISOString().slice(0, 10)}-${normalized || "news"}`;
}

function toNewsRecord(draft) {
  const titleLines = draft.title
    .split(/\n|\/|—/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    id: draft.id || makeSlug(draft.title, draft.date),
    status: "published",
    category: draft.category || "ข่าวจับกุม",
    tags: draft.keywords ? draft.keywords.split(/[,\s]+/).filter(Boolean).slice(0, 8) : [draft.category || "ข่าวจับกุม"],
    date: draft.date || new Date().toISOString().slice(0, 10),
    displayDate: draft.displayDate || draft.date || "ไม่ระบุวันที่",
    title: draft.title,
    titleLines: titleLines.length > 1 ? titleLines : [draft.title],
    excerpt: draft.summary,
    href: draft.href || `news/${makeSlug(draft.title, draft.date)}.html`,
    videoHref: draft.videoHref || "",
    image: draft.image || "assets/cover/ssd4-cover-wide-mono.jpg",
    thumbnails: draft.image ? [draft.image] : ["assets/cover/ssd4-cover-wide-mono.jpg"],
    area: draft.area || "ไม่ระบุพื้นที่",
    result: draft.result || "รอตรวจทาน",
    caseStatus: draft.caseStatus || "รอตรวจทานก่อนเผยแพร่",
    warning: "บุคคลที่ถูกกล่าวหายังถือเป็นผู้บริสุทธิ์จนกว่าศาลจะมีคำพิพากษาถึงที่สุด",
    keywords: draft.keywords || `${draft.category || ""} ${draft.title} ${draft.area || ""}`
  };
}

function renderDrafts() {
  const drafts = getDrafts();
  draftCount.textContent = String(drafts.length);
  if (publishedCount) {
    publishedCount.textContent = String(publishedNews.length);
  }
  draftList.replaceChildren();

  if (drafts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "ยังไม่มีร่างข่าว";
    draftList.append(empty);
    return;
  }

  drafts.forEach((draft, index) => {
    const item = document.createElement("article");
    item.className = "draft-item";

    const title = document.createElement("strong");
    title.textContent = draft.title || "ยังไม่ระบุหัวข้อ";

    const meta = document.createElement("span");
    meta.textContent = `${draft.category} · ${draft.date || "ไม่ระบุวันที่"} · ${draft.area || "ไม่ระบุพื้นที่"}`;

    const actions = document.createElement("div");
    actions.className = "draft-actions";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-button";
    removeButton.textContent = "ลบ";
    removeButton.addEventListener("click", () => {
      const nextDrafts = getDrafts();
      nextDrafts.splice(index, 1);
      setDrafts(nextDrafts);
      renderDrafts();
    });

    actions.append(removeButton);
    item.append(title, meta, actions);
    draftList.append(item);
  });
}

function updatePreview() {
  const data = new FormData(draftForm);
  previewCategory.textContent = data.get("category") || "ข่าวจับกุม";
  previewDate.textContent = data.get("date") || "ยังไม่ระบุวันที่";
  previewTitle.textContent = data.get("title") || "หัวข้อข่าวจะแสดงตรงนี้";
  previewSummary.textContent = data.get("summary") || "รายละเอียดสรุปข่าวจะแสดงตรงนี้เมื่อเริ่มกรอกข้อมูล";
  previewArea.textContent = data.get("area") || "ยังไม่ระบุ";
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

draftForm.addEventListener("input", updatePreview);

draftForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(draftForm);
  const title = String(data.get("title") || "").trim();
  const summary = String(data.get("summary") || "").trim();
  const date = String(data.get("date") || "");
  const draft = {
    category: String(data.get("category") || "ข่าวจับกุม"),
    title,
    href: String(data.get("href") || "").trim(),
    date,
    displayDate: date,
    area: String(data.get("area") || "").trim(),
    summary,
    image: String(data.get("image") || "").trim(),
    videoHref: String(data.get("videoHref") || "").trim(),
    keywords: String(data.get("keywords") || "").trim(),
    rightsChecked: data.get("rights") === "on",
    savedAt: new Date().toISOString()
  };

  if (!draft.title || !draft.summary || !draft.rightsChecked) {
    formStatus.textContent = "กรุณากรอกหัวข้อ รายละเอียด และยืนยันการตรวจข้อมูลก่อนบันทึก";
    return;
  }

  const drafts = getDrafts();
  drafts.unshift(draft);
  setDrafts(drafts.slice(0, 50));
  formStatus.textContent = "บันทึกร่างในเครื่องนี้แล้ว";
  draftForm.reset();
  updatePreview();
  renderDrafts();
});

exportButton.addEventListener("click", () => {
  const drafts = getDrafts().map(toNewsRecord);
  const mergedNews = [...drafts, ...publishedNews]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
  const payload = `window.SSD4_NEWS = ${JSON.stringify(mergedNews, null, 2)};\n`;

  navigator.clipboard.writeText(payload).then(() => {
    formStatus.textContent = "คัดลอกข้อมูล news-data.js แล้ว และดาวน์โหลดไฟล์สำรองแล้ว";
  }).catch(() => {
    formStatus.textContent = "ดาวน์โหลดไฟล์ news-data.js แล้ว หากคัดลอกไม่สำเร็จให้ใช้ไฟล์ที่ดาวน์โหลด";
  });

  downloadFile("news-data.js", payload);
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderDrafts();
  formStatus.textContent = "ล้างร่างข่าวในเครื่องนี้แล้ว";
});

updatePreview();
renderDrafts();
