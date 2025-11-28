
document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initNav();
  initReveal();
  initCharte();
  initOverlay();
  initCookies();
  initDiplomagFilters();
});

/* ========== Loader ========== */

function initLoader() {
  const loader = document.querySelector(".page-loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    loader.classList.add("hidden");
  });
}

/* ========== Navigation mobile ========== */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav-list");

  if (!toggle || !navList) return;

  toggle.addEventListener("click", () => {
    navList.classList.toggle("open");
  });

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("open");
    });
  });
}

/* ========== Apparition des blocs (reveal) ========== */

function initReveal() {
  const reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !reveals.length) {
    reveals.forEach((el) => el.classList.add("visible"));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((el) => obs.observe(el));
}

/* ========== Charte toggle ========== */

function initCharte() {
  const blocks = document.querySelectorAll(".charte-block");
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const toggle = block.querySelector(".charte-toggle");
    const body = block.querySelector(".charte-body");
    if (!toggle || !body) return;

    toggle.addEventListener("click", () => {
      const isOpen = block.classList.contains("open");
      if (isOpen) {
        block.classList.remove("open");
        body.style.maxHeight = "0";
      } else {
        block.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
}

/* ========== Overlay générique (mémos, dossiers, etc.) ========== */

function initOverlay() {
  const overlay = document.querySelector(".overlay");
  if (!overlay) return;

  const panels = overlay.querySelectorAll(".overlay-panel");
  const triggers = document.querySelectorAll("[data-overlay-target]");
  const closeButtons = overlay.querySelectorAll(".overlay-close, [data-overlay-close]");

  function openPanel(id) {
    panels.forEach((p) => p.classList.remove("active"));
    const panel = overlay.querySelector("#" + id);
    if (!panel) return;
    panel.classList.add("active");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    panels.forEach((p) => p.classList.remove("active"));
  }

  triggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-overlay-target");
      if (!id) return;
      openPanel(id);
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeOverlay();
    });
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });
}

/* ========== Cookies ========== */

function initCookies() {
  const banner = document.querySelector("[data-cookie-banner]");
  const btn = document.querySelector("[data-cookie-accept]");
  if (!banner || !btn) return;

  const KEY = "diplovalCookiesAccepted";

  try {
    if (localStorage.getItem(KEY) === "1") {
      banner.style.display = "none";
      return;
    }
  } catch (e) {}

  btn.addEventListener("click", () => {
    banner.style.display = "none";
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {}
  });
}

/* ========== Diplomag – filtres simples sur les cartes ========== */

function initDiplomagFilters() {
  const grid = document.querySelector(".diplomag-grid");
  if (!grid) return;

  const chips = document.querySelectorAll(".chip[data-filter-type]");
  const cards = grid.querySelectorAll(".diplomag-card");

  const state = {
    theme: "all",
    zone: "all",
  };

  function applyFilters() {
    cards.forEach((card) => {
      const theme = card.getAttribute("data-theme") || "all";
      const zone = card.getAttribute("data-zone") || "all";

      const okTheme = state.theme === "all" || state.theme === theme;
      const okZone = state.zone === "all" || state.zone === zone;

      card.style.display = okTheme && okZone ? "" : "none";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-filter-type");
      const value = chip.getAttribute("data-filter-value");

      chips.forEach((c) => {
        if (c.getAttribute("data-filter-type") === type) {
          c.classList.remove("active");
        }
      });

      chip.classList.add("active");
      state[type] = value;
      applyFilters();
    });
  });
}
