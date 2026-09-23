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

// 상세 이력 — About 면의 버튼으로 열고 닫는다.
// 화면을 채우는 목록은 여기에 두고, 면에는 먼저 읽혀야 할 것만 남긴다.
const detail = document.getElementById("detail");

if (detail) {
  const openBtns = document.querySelectorAll(".detail-open");
  const closeBtn = detail.querySelector(".detail-close");

  function setDetail(open) {
    detail.hidden = !open;
    openBtns.forEach((b) => b.setAttribute("aria-expanded", open ? "true" : "false"));
    if (open) {
      detail.querySelector(".detail-sheet").scrollTop = 0;
      if (closeBtn) closeBtn.focus();
    }
  }

  openBtns.forEach((b) => b.addEventListener("click", () => setDetail(true)));
  if (closeBtn) closeBtn.addEventListener("click", () => setDetail(false));

  // 바깥(어두운 바탕)을 누르면 닫는다. 안쪽을 눌렀을 때는 그대로 둔다.
  detail.addEventListener("click", (e) => {
    if (e.target === detail) setDetail(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !detail.hidden) setDetail(false);
  });
}

// ?print 로 열면 넘김 없이 모든 면이 이어진 인쇄용 문서가 된다.
const printMode = new URLSearchParams(window.location.search).has("print");


// 넘겨 볼 면들. 등장 효과를 적용할지 정하는 데도 쓰이므로 여기서 미리 구한다.
// .slide-group 은 여러 섹션을 한 면에 묶어 두기 위한 것이다.
const slides = printMode
  ? []
  : Array.from(document.querySelectorAll("main > section, main > .slide-group"));
const slideMode = slides.length > 1;

// 면이 묶음이면 그 안의 섹션 id 로도 찾을 수 있어야 한다.
function slideHasId(el, id) {
  return el.id === id || !!el.querySelector('[id="' + id + '"]');
}

function slideId(el) {
  if (el.id) return el.id;
  const first = el.querySelector("section[id]");
  return first ? first.id : "";
}

// 네비 한 항목이 여러 면을 덮을 수 있다. data-nav 가 같으면 같은 항목으로 본다.
function navMatches(slide, link) {
  const group = link.dataset.nav;
  if (group) return slide.dataset.nav === group;
  return slideHasId(slide, link.getAttribute("href").slice(1));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 인쇄 시에는 화면에 들어오지 않은 요소가 숨은 채로 출력되므로 등장 효과를 적용하지 않는다.
// 슬라이드 모드에서도 쓰지 않는다. 면 안에서 스크롤되는 구조라 아래쪽 항목은 화면에 들어온
// 적이 없어 opacity:0 인 채로 자리만 차지하고, 그 자리가 빈 공간처럼 보이기 때문이다.
if (!prefersReducedMotion && !printMode && !slideMode && "IntersectionObserver" in window) {
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


// 슬라이드 모드 — 섹션을 한 면씩 넘겨 본다.
// 인쇄·PDF 경로는 전체 문서가 이어져야 하므로 제외한다.
// 화살표와 점 표시는 여기서 만들어 붙인다. 마크업에 두면 스크립트가 없을 때
// 아무 동작도 하지 않는 버튼만 남기 때문이다.
if (slideMode) {
  const slideMain = document.querySelector("main");
  const footerInner = document.querySelector(".footer-inner");

  document.body.classList.add("slide-mode");
  // rem 기준은 html 이 잡으므로 기준 글자 확대는 루트에 따로 표시한다.
  document.documentElement.classList.add("slide-root");
  // 섹션이든 묶음이든 같은 규칙으로 배치되도록 공통 표시를 붙인다.
  slides.forEach((el) => el.classList.add("slide"));

  function makeArrow(cls, label, glyph) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `slide-arrow ${cls}`;
    btn.setAttribute("aria-label", label);
    btn.textContent = glyph;
    return btn;
  }

  const prevBtn = makeArrow("slide-prev", "이전 면", "‹");
  const nextBtn = makeArrow("slide-next", "다음 면", "›");

  slideMain.append(prevBtn, nextBtn);

  const dots = document.createElement("div");
  dots.className = "slide-dots";

  const dotButtons = slides.map((el, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slide-dot";
    dot.setAttribute("aria-label", el.dataset.slideTitle || `${i + 1}번째 면`);
    dot.addEventListener("click", () => goToSlide(i));
    dots.appendChild(dot);
    return dot;
  });

  // 저작권 문구와 맨 위로 링크 사이에 넣어 푸터 가운데에 오게 한다.
  if (footerInner) footerInner.insertBefore(dots, footerInner.lastElementChild);

  let slideIndex = 0;

  function goToSlide(target) {
    const i = Math.max(0, Math.min(slides.length - 1, target));
    // 옆에서 밀려 들어오는 거리. 눈에 띄게 움직이도록 넉넉히 준다.
    const from = i > slideIndex ? 104 : -104;
    slideIndex = i;

    slides.forEach((section, n) => {
      const active = n === i;
      section.classList.toggle("is-active", active);
      if (!active) return;
      section.style.setProperty("--slide-from", `${from}px`);
      section.scrollTop = 0; // 이전에 내려 둔 위치가 남지 않도록 맨 위에서 시작한다.
    });

    dotButtons.forEach((dot, n) => {
      dot.classList.toggle("is-active", n === i);
      dot.setAttribute("aria-current", n === i ? "true" : "false");
    });

    document.querySelectorAll(".nav a[href^='#']").forEach((link) => {
      link.classList.toggle("is-current", navMatches(slides[i], link));
    });

    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;



    // 주소를 맞춰 두면 새로 고침이나 링크 공유에서 같은 면으로 돌아온다.
    // file:// 로 열면 브라우저가 막는 경우가 있어 실패해도 넘어간다.
    const id = slideId(slides[i]);
    if (id) {
      try {
        history.replaceState(null, "", `#${id}`);
      } catch (err) {
        /* 주소만 못 맞출 뿐 넘김은 정상 동작한다. */
      }
    }
  }

  function slideIndexFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const found = slides.findIndex((el) => slideHasId(el, id));
    return found === -1 ? 0 : found;
  }

  prevBtn.addEventListener("click", () => goToSlide(slideIndex - 1));
  nextBtn.addEventListener("click", () => goToSlide(slideIndex + 1));

  // 네비와 본문의 면 링크는 앵커 이동 대신 해당 면으로 넘긴다.
  document.querySelectorAll(".nav a[href^='#'], main a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      const found = slides.findIndex((el) => slideHasId(el, link.getAttribute("href").slice(1)));
      if (found === -1) return;
      e.preventDefault();
      goToSlide(found);
    });
  });

  // 위아래 화살표는 면 안을 스크롤해야 하므로 좌우만 넘김에 쓴다.
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToSlide(slideIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToSlide(slideIndex - 1);
    }
  });

  let touchStart = null;

  slideMain.addEventListener(
    "touchstart",
    (e) => {
      touchStart = e.touches.length === 1 ? e.touches[0] : null;
    },
    { passive: true }
  );

  slideMain.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.clientX;
      const dy = e.changedTouches[0].clientY - touchStart.clientY;
      touchStart = null;
      // 세로로 더 많이 움직였다면 면 안을 스크롤한 것이므로 넘기지 않는다.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      goToSlide(slideIndex + (dx < 0 ? 1 : -1));
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => goToSlide(slideIndexFromHash()));

  goToSlide(slideIndexFromHash());

}
