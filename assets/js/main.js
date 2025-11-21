// assets/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initNav();
  initReveal();
  initCharte();
  initOverlay();
  initFilters();
  initCookies();

  loadDiplomag();
  loadMemorandums();
  loadAgenda();
  loadDossiers();
});

/* ========== Loader ========== */

function initLoader() {
  window.addEventListener("load", () => {
    const loader = document.querySelector(".page-loader");
    if (loader) loader.classList.add("hidden");
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

let revealObserver = null;

function initReveal() {
  const elems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elems.forEach((el) => revealObserver.observe(el));
  } else {
    elems.forEach((el) => el.classList.add("visible"));
  }
}

function observeReveal(el) {
  if (revealObserver && el) revealObserver.observe(el);
}

/* ========== Charte (accordéon) ========== */

function initCharte() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".charte-toggle");
    if (!btn) return;
    const block = btn.closest(".charte-block");
    if (!block) return;
    block.classList.toggle("open");
  });
}

/* ========== Overlays "Consulter +" ========== */

function initOverlay() {
  document.addEventListener("click", (e) => {
    const moreBtn = e.target.closest(".link-more");
    if (moreBtn && moreBtn.dataset.panel) {
      openOverlay(moreBtn.dataset.panel);
      return;
    }

    const closeBtn = e.target.closest(".overlay-close");
    if (closeBtn) {
      closeOverlay();
      return;
    }

    if (e.target.matches("[data-overlay]")) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
  });
}

function openOverlay(panelId) {
  const overlay = document.querySelector("[data-overlay]");
  if (!overlay) return;

  overlay.classList.add("open");

  overlay
    .querySelectorAll(".overlay-panel")
    .forEach((p) => p.classList.remove("active"));

  const panel = overlay.querySelector("#" + panelId);
  if (panel) panel.classList.add("active");
}

function closeOverlay() {
  const overlay = document.querySelector("[data-overlay]");
  if (!overlay) return;

  overlay.classList.remove("open");
  overlay
    .querySelectorAll(".overlay-panel")
    .forEach((p) => p.classList.remove("active"));
}

/* ========== Filtres Diplomag ========== */

function initFilters() {
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip || !chip.dataset.filterValue) return;

    const group = chip.closest("[data-filter-group]");
    if (!group) return;

    group.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");

    applyDiplomagFilters();
  });
}

function applyDiplomagFilters() {
  const list = document.querySelector("[data-diplomag-list]");
  if (!list) return;

  const cards = list.querySelectorAll(".diplomag-card");

  const activeRegion =
    document.querySelector(
      '[data-filter-group="region"] .chip.active'
    )?.dataset.filterValue || "all";
  const activeTheme =
    document.querySelector(
      '[data-filter-group="theme"] .chip.active'
    )?.dataset.filterValue || "all";

  cards.forEach((card) => {
    const cardRegion = card.dataset.region || "all";
    const cardTheme = card.dataset.theme || "all";

    const regionMatch =
      activeRegion === "all" || cardRegion === activeRegion;
    const themeMatch = activeTheme === "all" || cardTheme === activeTheme;

    card.style.display = regionMatch && themeMatch ? "" : "none";
  });
}

/* ========== Cookies ========== */

function initCookies() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  const accepted = localStorage.getItem("diploval_cookies_ok") === "1";
  if (accepted) {
    banner.style.display = "none";
    return;
  }

  const btn = banner.querySelector("[data-cookie-accept]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.setItem("diploval_cookies_ok", "1");
    banner.style.display = "none";
  });
}

/* =========================================================
   1) Diplomag → content/diplomag.json
   ========================================================= */

async function loadDiplomag() {
  const list = document.querySelector("[data-diplomag-list]");
  if (!list) return;

  try {
    const res = await fetch("content/diplomag.json");
    if (!res.ok) return;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // On vide les cartes de démo
    list.innerHTML = "";

    const overlaysRoot = document.querySelector("[data-dynamic-overlays]");

    items.forEach((item) => {
      const slug = (item.slug || "").trim();
      if (!slug) return;

      const themeKey = (item.theme || "autre").toLowerCase().trim();
      const regionKey = (item.pays || "").toLowerCase().trim();

      const card = document.createElement("article");
      card.className = "card diplomag-card reveal";
      card.dataset.region = normalizeRegion(regionKey);
      card.dataset.theme = themeKey;

      // Contenu de la carte
      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(item.pays || "")} · ${escapeHtml(themeLabel(themeKey))}</span>
          <h3>${escapeHtml(item.titre || "")}</h3>
        </div>
        <p class="card-excerpt">${escapeHtml(item.extrait || "")}</p>
        <button class="link-more">Lire l'article</button>
      `;

      // On ajoute le clic direct sur le bouton
      const btn = card.querySelector(".link-more");
      if (btn) {
        btn.addEventListener("click", () => {
          openOverlay(`panel-article-${slug}`);
        });
      }

      list.appendChild(card);
      observeReveal(card);

      // Création du panneau d'article
      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-article-${slug}`;
        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>
          <h2>${escapeHtml(item.titre || "")}</h2>
          <p class="article-chapeau">${escapeHtml(item.extrait || "")}</p>
          <div class="article-body">
            ${markdownToHtml(item.body || "")}
            ${
              item.pdf_url
                ? `<p><a href="${escapeAttr(
                    item.pdf_url
                  )}" target="_blank" rel="noopener">Télécharger l'article en PDF</a></p>`
                : ""
            }
          </div>
        `;
        overlaysRoot.appendChild(panel);
      }
    });

    applyDiplomagFilters();
  } catch (err) {
    console.error("Erreur chargement Diplomag :", err);
  }
}


/* =========================================================
   2) Mémorandums → content/memorandums.json
   ========================================================= */

async function loadMemorandums() {
  const list = document.querySelector("[data-memo-list]");
  if (!list) return;

  try {
    const res = await fetch("content/memorandums.json");
    if (!res.ok) return;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    list.innerHTML = "";

    const overlaysRoot = document.querySelector("[data-dynamic-overlays]");

    items.forEach((item, index) => {
      const slug = "memo-" + index;

      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(item.type || "Mémorandum")}</span>
          <h3>${escapeHtml(item.title || "")}</h3>
        </div>
        <p class="card-excerpt">${escapeHtml(item.excerpt || "")}</p>
        <button class="link-more" data-panel="panel-${slug}">Consulter +</button>
      `;
      list.appendChild(card);
      observeReveal(card);

      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-${slug}`;
        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>
          <h2>${escapeHtml(item.title || "")}</h2>
          <p class="article-chapeau">${escapeHtml(item.excerpt || "")}</p>
          <div class="article-body">
            ${markdownToHtml(item.body || "")}
            ${
              item.pdf_url
                ? `<p><a href="${escapeAttr(
                    item.pdf_url
                  )}" target="_blank" rel="noopener">Télécharger le mémorandum (PDF)</a></p>`
                : ""
            }
          </div>
        `;
        overlaysRoot.appendChild(panel);
      }
    });
  } catch (err) {
    console.error("Erreur chargement Mémorandums :", err);
  }
}

/* =========================================================
   3) Agenda → content/agenda.json
   ========================================================= */

async function loadAgenda() {
  const list = document.querySelector("[data-agenda-list]");
  if (!list) return;

  try {
    const res = await fetch("content/agenda.json");
    if (!res.ok) return;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    list.innerHTML = "";

    items.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "agenda-item reveal";
      wrap.innerHTML = `
        <div class="agenda-date">${escapeHtml(item.date || "")}</div>
        <div class="agenda-content">
          <h3>${escapeHtml(item.title || "")}</h3>
          <p>${escapeHtml(item.description || "")}</p>
        </div>
      `;
      list.appendChild(wrap);
      observeReveal(wrap);
    });
  } catch (err) {
    console.error("Erreur chargement Agenda :", err);
  }
}

/* =========================================================
   4) Dossiers → content/dossiers.json
   ========================================================= */

async function loadDossiers() {
  const list = document.querySelector("[data-dossiers-list]");
  if (!list) return;

  try {
    const res = await fetch("content/dossiers.json");
    if (!res.ok) return;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    list.innerHTML = "";

    const overlaysRoot = document.querySelector("[data-dynamic-overlays]");

    items.forEach((item, index) => {
      const slug = "dossier-" + index;

      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(item.zone || "")}</span>
          <h3>${escapeHtml(item.title || "")}</h3>
        </div>
        <p class="card-excerpt">${escapeHtml(item.excerpt || "")}</p>
        <button class="link-more" data-panel="panel-${slug}">Consulter +</button>
      `;
      list.appendChild(card);
      observeReveal(card);

      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-${slug}`;
        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>
          <h2>${escapeHtml(item.title || "")}</h2>
          <div class="article-body">
            ${markdownToHtml(item.body || "")}
          </div>
        `;
        overlaysRoot.appendChild(panel);
      }
    });
  } catch (err) {
    console.error("Erreur chargement Dossiers :", err);
  }
}

/* ========== Helpers ========== */

function normalizeRegion(region) {
  const r = (region || "").toLowerCase().trim();
  if (r.includes("france")) return "france";
  if (r.includes("europ")) return "europe";
  if (r.includes("monde") || r.includes("global")) return "monde";
  return "monde";
}

function themeLabel(key) {
  switch (key) {
    case "geopolitique":
      return "Géopolitique";
    case "politique":
      return "Politique";
    case "ecologie":
      return "Écologie / climat";
    case "finances":
      return "Économie / finances";
    case "sante":
      return "Santé / société";
    case "autre":
    default:
      return "Autre";
  }
}

// Conversion ultra simple Markdown → HTML
function markdownToHtml(md) {
  if (!md) return "";
  const escaped = escapeHtml(md);
  const blocks = escaped.split(/\n{2,}/);
  return blocks
    .map((b) => `<p>${b.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
