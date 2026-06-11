const draftForm = document.querySelector("#draftForm");
const draftList = document.querySelector("#draftList");
const draftCount = document.querySelector("#draftCount");
const formStatus = document.querySelector(".form-status");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const previewCategory = document.querySelector("#previewCategory");
const previewDate = document.querySelector("#previewDate");
const previewTitle = document.querySelector("#previewTitle");
const previewSummary = document.querySelector("#previewSummary");
const previewArea = document.querySelector("#previewArea");
const storageKey = "commando-ssd4-admin-drafts";

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

function renderDrafts() {
  const drafts = getDrafts();
  draftCount.textContent = String(drafts.length);
  draftList.replaceChildren();

  if (drafts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "ยังไม่มีร่างข่าว";
    draftList.append(empty);
    return;
  }

  drafts.forEach((draft) => {
    const item = document.createElement("article");
    item.className = "draft-item";

    const title = document.createElement("strong");
    title.textContent = draft.title || "ยังไม่ระบุหัวข้อ";

    const meta = document.createElement("span");
    meta.textContent = `${draft.category} · ${draft.date || "ไม่ระบุวันที่"} · ${draft.area || "ไม่ระบุพื้นที่"}`;

    item.append(title, meta);
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

draftForm.addEventListener("input", updatePreview);

draftForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(draftForm);
  const draft = {
    category: String(data.get("category") || "ข่าวจับกุม"),
    title: String(data.get("title") || "").trim(),
    date: String(data.get("date") || ""),
    area: String(data.get("area") || "").trim(),
    summary: String(data.get("summary") || "").trim(),
    rightsChecked: data.get("rights") === "on",
    savedAt: new Date().toISOString()
  };

  if (!draft.title || !draft.summary || !draft.rightsChecked) {
    formStatus.textContent = "กรุณากรอกหัวข้อ รายละเอียด และยืนยันการตรวจข้อมูลก่อนบันทึก";
    return;
  }

  const drafts = getDrafts();
  drafts.unshift(draft);
  setDrafts(drafts.slice(0, 20));
  formStatus.textContent = "บันทึกร่างในเครื่องนี้แล้ว";
  draftForm.reset();
  updatePreview();
  renderDrafts();
});

exportButton.addEventListener("click", () => {
  const drafts = getDrafts();
  const payload = JSON.stringify(drafts, null, 2);
  navigator.clipboard.writeText(payload).then(() => {
    formStatus.textContent = "คัดลอก JSON ของร่างข่าวแล้ว";
  }).catch(() => {
    formStatus.textContent = "ไม่สามารถคัดลอกได้ กรุณาใช้เบราว์เซอร์ที่รองรับ clipboard";
  });
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderDrafts();
  formStatus.textContent = "ล้างร่างข่าวในเครื่องนี้แล้ว";
});

updatePreview();
renderDrafts();
