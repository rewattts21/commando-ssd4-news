const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");
const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector(".form-note");

menuButton.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
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
