const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");
const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector(".form-note");
const copyLinkButton = document.querySelector(".copy-link-button");
const copyStatus = document.querySelector(".copy-status");
const newsSearch = document.querySelector("#newsSearch");
const newsFilters = document.querySelectorAll(".news-filter");
const newsResultCount = document.querySelector("#newsResultCount");
const newsEmptyState = document.querySelector("#newsEmptyState");
const newsData = Array.isArray(window.SSD4_NEWS) ? window.SSD4_NEWS : [];

function makeAbsolutePath(path) {
  if (!path) {
    return "";
  }

  const isNestedPage = window.location.pathname.includes("/news/");
  if (path.startsWith("http") || path.startsWith("/") || !isNestedPage) {
    return path;
  }

  return `../${path}`;
}

function formatTitle(news) {
  return Array.isArray(news.titleLines) && news.titleLines.length
    ? news.titleLines.join("<br>")
    : news.title;
}

function setTitleWithBreaks(element, news) {
  if (!element) {
    return;
  }

  const lines = Array.isArray(news.titleLines) && news.titleLines.length ? news.titleLines : [news.title];
  element.replaceChildren();
  lines.forEach((line, index) => {
    if (index > 0) {
      element.append(document.createElement("br"));
    }
    element.append(document.createTextNode(line));
  });
}

function renderHomeFeaturedNews() {
  const featured = document.querySelector(".featured-news");
  if (!featured || !newsData.length) {
    return;
  }

  const news = newsData[0];
  const image = featured.querySelector(".news-visual img");
  const tag = featured.querySelector(".news-tag");
  const time = featured.querySelector("time");
  const title = featured.querySelector("h3");
  const excerpt = featured.querySelector("p:not(.editor-note)");
  const note = featured.querySelector(".editor-note");
  const metaItems = featured.querySelectorAll(".case-meta dd");
  const readMore = featured.querySelector(".read-more-button");
  const videoLink = featured.querySelector(".outline-button");

  if (image) {
    image.src = makeAbsolutePath(news.image);
    image.alt = news.title;
  }
  if (tag) {
    tag.textContent = news.category;
  }
  if (time) {
    time.dateTime = news.date;
    time.textContent = news.displayDate;
  }
  if (title) {
    setTitleWithBreaks(title, news);
  }
  if (excerpt) {
    excerpt.textContent = news.excerpt;
  }
  if (note) {
    note.textContent = `หมายเหตุ: ${news.warning}`;
  }
  if (metaItems[0]) {
    metaItems[0].textContent = news.area;
  }
  if (metaItems[1]) {
    metaItems[1].textContent = news.result;
  }
  if (metaItems[2]) {
    metaItems[2].textContent = news.caseStatus;
  }
  if (readMore) {
    readMore.href = makeAbsolutePath(news.href);
  }
  if (videoLink) {
    videoLink.href = makeAbsolutePath(news.videoHref || news.href);
  }
}

function createNewsCard(news, index) {
  const article = document.createElement("article");
  article.className = "news-list-card";
  article.dataset.newsCard = "";
  article.dataset.category = [news.category, ...(news.tags || [])].join(" ");
  article.dataset.keywords = news.keywords || "";

  const imageLink = document.createElement("a");
  imageLink.className = "news-list-image";
  imageLink.href = makeAbsolutePath(news.href);

  const image = document.createElement("img");
  image.src = makeAbsolutePath((news.thumbnails && news.thumbnails[index % news.thumbnails.length]) || news.image);
  image.alt = news.title;
  image.loading = "lazy";
  imageLink.append(image);

  const body = document.createElement("div");
  body.className = "news-list-body";

  const meta = document.createElement("div");
  meta.className = "news-card-meta";
  const tag = document.createElement("span");
  tag.className = "news-tag";
  tag.textContent = news.category;
  const time = document.createElement("time");
  time.dateTime = news.date;
  time.textContent = news.displayDate;
  meta.append(tag, time);

  const heading = document.createElement("h3");
  const headingLink = document.createElement("a");
  headingLink.href = makeAbsolutePath(news.href);
  headingLink.textContent = news.titleLines?.[1] || news.title;
  heading.append(headingLink);

  const excerpt = document.createElement("p");
  excerpt.textContent = news.excerpt;

  const readLink = document.createElement("a");
  readLink.className = "card-read-link";
  readLink.href = makeAbsolutePath(news.href);
  readLink.textContent = "อ่านต่อ";

  body.append(meta, heading, excerpt, readLink);
  article.append(imageLink, body);
  return article;
}

function renderNewsIndex() {
  const grid = document.querySelector("#newsCardGrid");
  const lead = document.querySelector(".news-lead-card");
  if (!grid || !newsData.length) {
    return;
  }

  const news = newsData[0];
  if (lead) {
    lead.dataset.category = [news.category, ...(news.tags || [])].join(" ");
    lead.dataset.keywords = news.keywords || "";
    const image = lead.querySelector(".news-lead-image img");
    const tag = lead.querySelector(".news-tag");
    const time = lead.querySelector("time");
    const title = lead.querySelector("h2 a");
    const excerpt = lead.querySelector(".news-lead-body p:not(.editor-note)");
    const note = lead.querySelector(".editor-note");
    const readMore = lead.querySelector(".read-more-button");
    const videoLink = lead.querySelector(".outline-button");

    if (image) {
      image.src = makeAbsolutePath(news.image);
      image.alt = news.title;
    }
    if (tag) {
      tag.textContent = "ข่าวเด่น";
    }
    if (time) {
      time.dateTime = news.date;
      time.textContent = news.displayDate;
    }
    if (title) {
      title.href = makeAbsolutePath(news.href);
      setTitleWithBreaks(title, news);
    }
    if (excerpt) {
      excerpt.textContent = news.excerpt;
    }
    if (note) {
      note.textContent = `หมายเหตุ: ${news.warning}`;
    }
    if (readMore) {
      readMore.href = makeAbsolutePath(news.href);
    }
    if (videoLink) {
      videoLink.href = makeAbsolutePath(news.videoHref || news.href);
    }
  }

  grid.replaceChildren(...newsData.flatMap((item, index) => {
    const cards = [createNewsCard(item, index)];
    if (index === 0 && item.videoHref) {
      cards.push(createNewsCard({
        ...item,
        category: "วิดีโอข่าว",
        tags: ["วิดีโอ", "จับกุม"],
        title: "คลิปประกอบการปฏิบัติหน้าที่",
        titleLines: ["คลิปประกอบการปฏิบัติหน้าที่"],
        excerpt: "รับชมวิดีโอประกอบข่าวและภาพภารกิจ เพื่อให้ประชาชนติดตามผลการปฏิบัติได้ชัดเจนยิ่งขึ้น",
        href: item.videoHref,
        keywords: `${item.keywords} คลิป วิดีโอ`
      }, index + 1));
      cards.push(createNewsCard({
        ...item,
        category: "เตือนภัยประชาชน",
        tags: ["เตือนภัย"],
        title: "เตือนภัยการนัดพบในสถานที่ลับตา",
        titleLines: ["เตือนภัยการนัดพบในสถานที่ลับตา"],
        excerpt: "คำแนะนำสำหรับผู้ปกครองและเยาวชนในการหลีกเลี่ยงความเสี่ยงจากการนัดพบกับบุคคลที่ไม่น่าไว้วางใจ",
        href: `${item.href}#public-warning`,
        keywords: `${item.keywords} เตือนภัย เยาวชน ออนไลน์ ผู้ปกครอง`
      }, index + 2));
    }
    return cards;
  }));
}

if (menuButton && mainNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (mainNav && menuButton) {
      mainNav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactForm.reset();
    if (formNote) {
      formNote.textContent = "ปิดการส่งข้อมูลบนหน้าเว็บตัวอย่างแล้ว กรุณาติดต่อผ่านโทรศัพท์หรืออีเมลของหน่วย";
    }
  });
}

if (copyLinkButton) {
  copyLinkButton.addEventListener("click", async () => {
    const link = copyLinkButton.dataset.copyLink || window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      if (copyStatus) {
        copyStatus.textContent = "คัดลอกลิงก์แล้ว";
      }
    } catch {
      if (copyStatus) {
        copyStatus.textContent = link;
      }
    }
  });
}

renderHomeFeaturedNews();
renderNewsIndex();

if (document.querySelectorAll("[data-news-card]").length && newsFilters.length) {
  let activeFilter = "all";

  const updateNewsList = () => {
    const query = (newsSearch?.value || "").trim().toLowerCase();
    const newsCards = document.querySelectorAll("[data-news-card]");
    let visibleCount = 0;

    newsCards.forEach((card) => {
      const category = (card.dataset.category || "").toLowerCase();
      const keywords = (card.dataset.keywords || "").toLowerCase();
      const text = card.textContent.toLowerCase();
      const matchesFilter = activeFilter === "all" || category.includes(activeFilter.toLowerCase());
      const matchesQuery = !query || text.includes(query) || keywords.includes(query);
      const isVisible = matchesFilter && matchesQuery;

      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (newsResultCount) {
      newsResultCount.textContent = visibleCount === newsCards.length
        ? "แสดงข่าวทั้งหมด"
        : `พบข่าว ${visibleCount} รายการ`;
    }

    if (newsEmptyState) {
      newsEmptyState.hidden = visibleCount > 0;
    }
  };

  newsFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      newsFilters.forEach((filterButton) => filterButton.classList.remove("active"));
      button.classList.add("active");
      updateNewsList();
    });
  });

  newsSearch?.addEventListener("input", updateNewsList);
  updateNewsList();
}
