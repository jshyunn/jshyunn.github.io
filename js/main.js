document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("nav-toggle");
const nav = document.querySelector(".nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

// ?print 로 열면 "자세히 보기" 내용을 펼친 PDF/인쇄용 페이지가 된다.
const printMode = new URLSearchParams(window.location.search).has("print");

if (printMode) {
  document.body.classList.add("print-mode");

  // 앞쪽은 Profile·Research·Activities 목록으로 훑고, 자세히 보기 내용은 모두 뒤로 모아
  // 문서 순서(논문 → 활동)대로 한 항목당 한 페이지씩 배치한다.
  // 상세를 원래 카드 안에 두면 카드가 페이지 경계에서 쪼개지므로 밖으로 빼낸다.
  const details = document.createElement("div");
  details.className = "detail-pages";

  document.querySelectorAll("[data-modal-target]").forEach((btn) => {
    const template = document.getElementById(btn.getAttribute("data-modal-target"));
    if (!template) return;

    // 어느 항목의 상세인지 알 수 있도록 템플릿의 제목을 그대로 노출한다.
    const detail = document.createElement("div");
    detail.className = "modal-body detail-page";
    detail.appendChild(template.content.cloneNode(true));
    details.appendChild(detail);
  });

  const main = document.querySelector("main");
  if (main && details.children.length) main.appendChild(details);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 인쇄 시에는 화면에 들어오지 않은 요소가 숨은 채로 출력되므로 등장 효과를 적용하지 않는다.
if (!prefersReducedMotion && !printMode && "IntersectionObserver" in window) {
  const revealTargets = document.querySelectorAll(".cv-block, .skill-group, .project-card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

const modalOverlay = document.getElementById("modal-overlay");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

function openModal(templateId) {
  const template = document.getElementById(templateId);
  if (!template || !modalOverlay || !modalBody) return;
  modalBody.innerHTML = "";
  modalBody.appendChild(template.content.cloneNode(true));
  modalOverlay.hidden = false;
  modalBody.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-modal-target]").forEach((btn) => {
  btn.addEventListener("click", () => openModal(btn.getAttribute("data-modal-target")));
});

document.querySelectorAll(".project-card").forEach((card) => {
  const btn = card.querySelector("[data-modal-target]");
  if (!btn) return;
  card.addEventListener("click", (e) => {
    if (e.target.closest(".detail-btn")) return;
    openModal(btn.getAttribute("data-modal-target"));
  });
});

if (modalClose) modalClose.addEventListener("click", closeModal);

if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay && !modalOverlay.hidden) closeModal();
});
