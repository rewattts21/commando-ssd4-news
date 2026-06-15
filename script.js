const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");
const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector(".form-note");
const copyLinkButton = document.querySelector(".copy-link-button");
const copyStatus = document.querySelector(".copy-status");
const newsSearch = document.querySelector("#newsSearch");
const newsFilters = document.querySelectorAll(".news-filter");
const newsCards = document.querySelectorAll("[data-news-card]");
const newsResultCount = document.querySelector("#newsResultCount");
const newsEmptyState = document.querySelector("#newsEmptyState");

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

if (newsCards.length && newsFilters.length) {
  let activeFilter = "all";

  const updateNewsList = () => {
    const query = (newsSearch?.value || "").trim().toLowerCase();
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
