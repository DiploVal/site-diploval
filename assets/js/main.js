// =========================================================
// main.js — Version optimisée + Markdown complet (marked.js)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initNav();
  initReveal();
  initCharte();
  initOverlay();
  initFilters();
  initCookies();

  initDiplomagStandalone(); // Overlay page Diplomag (une)

  loadDiplomag();
  loadMemorandums();
  loadAgenda();
  loadDossiers();
});


/* =========================================================
   LOADER
   ========================================================= */
function initLoader() {
  window.addEventListener("load", () => {
    const loader = document.querySelector(".page-loader");
    if (loader) loader.classList.add("hidden");
  });
}


/* =========================================================
   NAVIGATION MOBILE
   ========================================================= */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav-list");

  if (!toggle || !navList) return;

  toggle.addEventListener("click", () => {
    navList.classList.toggle("open");
  });

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navList.classList.remove("open"));
  });
}


/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */
let revealObserver = null;

function initReveal() {
  const elems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elems.forEach(el => revealObserver.observe(el));
  } else {
    elems.forEach(el => el.classList.add("visible"));
  }
}

function observeReveal(el) {
  if (revealObserver && el) revealObserver.observe(el);
}


/* =========================================================
   CHARTE (ACCORDÉON)
   ========================================================= */
function initCharte() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".charte-toggle");
    if (!btn) return;
    const block = btn.closest(".charte-block");
    if (block) block.classList.toggle("open");
  });
}


/* =========================================================
   OVERLAYS GÉNÉRAUX (Consulter +)
   ========================================================= */
function initOverlay() {
  document.addEventListener("click", e => {
    const moreBtn = e.target.closest(".link-more");
    const closeBtn = e.target.closest(".overlay-close");

    if (moreBtn && moreBtn.dataset.panel) {
      openOverlay(moreBtn.dataset.panel);
      return;
    }

    if (closeBtn) {
      closeOverlay();
      return;
    }

    if (e.target.matches("[data-overlay]")) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeOverlay();
  });
}

function openOverlay(panelId) {
  const overlay = document.querySelector("[data-overlay]");
  if (!overlay) return;

  overlay.classList.add("open");

  overlay.querySelectorAll(".overlay-panel")
    .forEach(p => p.classList.remove("active"));

  const panel = overlay.querySelector("#" + panelId);
  if (panel) panel.classList.add("active");
}

function closeOverlay() {
  const overlay = document.querySelector("[data-overlay]");
  if (!overlay) return;

  overlay.classList.remove("open");
  overlay.querySelectorAll(".overlay-panel")
    .forEach(p => p.classList.remove("active"));
}


/* =========================================================
   FILTRES DIPLOMAG
   ========================================================= */
function initFilters() {
  document.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip || !chip.dataset.filterValue) return;

    const group = chip.closest("[data-filter-group]");
    if (!group) return;

    group.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");

    applyDiplomagFilters();
  });
}

function applyDiplomagFilters() {
  const list = document.querySelector("[data-diplomag-list]");
  if (!list) return;

  const cards = list.querySelectorAll(".diplomag-card");

  const activeRegion =
    document.querySelector('[data-filter-group="region"] .chip.active')
      ?.dataset.filterValue || "all";

  const activeTheme =
    document.querySelector('[data-filter-group="theme"] .chip.active')
      ?.dataset.filterValue || "all";

  cards.forEach(card => {
    const regionMatch =
      activeRegion === "all" || (card.dataset.region || "") === activeRegion;

    const themeMatch =
      activeTheme === "all" || (card.dataset.theme || "") === activeTheme;

    card.style.display = regionMatch && themeMatch ? "" : "none";
  });
}


/* =========================================================
   COOKIES
   ========================================================= */
function initCookies() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  if (localStorage.getItem("diploval_cookies_ok") === "1") {
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
   CHARGER — DIPLOMAG / MEMOS / AGENDA / DOSSIERS
   ========================================================= */
/* Même logique : générer cartes + overlay */

async function loadDiplomag() {
  const list = document.querySelector("[data-diplomag-list]");
  if (!list) return;

  try {
    const res = await fetch("content/diplomag.json");
    if (!res.ok) return;

    const { items = [] } = await res.json();
    const root = document.querySelector("[data-dynamic-overlays]");

    list.innerHTML = "";

    items.forEach(item => {
      const slug = (item.slug || "").trim();
      if (!slug) return;

      const themeKey = normalizeKey(item.theme || "autre");

      // — Carte —
      const card = document.createElement("article");
      card.className = "card diplomag-card reveal";
      card.dataset.region = normalizeRegion(item.pays || "");
      card.dataset.theme = themeKey;

      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(item.pays || "")} · ${escapeHtml(themeLabel(themeKey))}</span>
          <h3>${escapeHtml(item.titre || "")}</h3>
        </div>
        <p class="card-excerpt">${escapeHtml(item.extrait || "")}</p>
        <button class="link-more" data-panel="panel-article-${slug}">Lire l'article</button>
      `;
      list.appendChild(card);
      observeReveal(card);

      // — Overlay —
      if (!root) return;

      const metaParts = [];
      if (item.pays) metaParts.push(item.pays);
      if (item.date) metaParts.push(item.date);
      if (themeKey) metaParts.push(themeLabel(themeKey));

      const metaLine = metaParts.map(escapeHtml).join(" · ");

      const panel = document.createElement("div");
      panel.id = `panel-article-${slug}`;
      panel.className = "overlay-panel";

      panel.innerHTML = `
        <button class="overlay-close" aria-label="Fermer">×</button>
        <div class="article-header">
          ${item.image
            ? `<figure class="article-cover"><img src="${escapeAttr(item.image)}" alt=""></figure>`
            : ""}
          <div class="article-meta">
            ${metaLine ? `<div class="article-tagline">${metaLine}</div>` : ""}
            <h2>${escapeHtml(item.titre || "")}</h2>
            ${item.extrait ? `<p class="article-chapeau">${escapeHtml(item.extrait)}</p>` : ""}
          </div>
        </div>

        ${buildPdfBannerHtml(item.pdf_url, "article")}

        <div class="article-body">
          ${markdownToHtml(item.body || "")}
          ${item.signature ? `<p class="article-signature">${escapeHtml(item.signature)}</p>` : ""}
          ${buildShareBlockHtml(slug, item.titre || "")}
        </div>

        <div class="overlay-footer">
          <button class="overlay-close">Fermer</button>
        </div>
      `;
      root.appendChild(panel);
    });

    applyDiplomagFilters();
  } catch (err) {
    console.error("Erreur chargement Diplomag :", err);
  }
}


async function loadMemorandums() {
  const list = document.querySelector("[data-memo-list]");
  if (!list) return;

  try {
    const res = await fetch("content/memorandums.json");
    if (!res.ok) return;

    const { items = [] } = await res.json();
    const root = document.querySelector("[data-dynamic-overlays]");

    list.innerHTML = "";

    items.forEach((item, index) => {
      const slug = (item.slug || `memo-${index}`).trim();

      const title = item.title || item.titre || "Mémorandum";
      const excerpt = item.excerpt || item.extrait || "";

      // Carte
      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(item.type || "Mémorandum")}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        ${excerpt ? `<p class="card-excerpt">${escapeHtml(excerpt)}</p>` : ""}
        <button class="link-more" data-panel="panel-${slug}">Consulter +</button>
      `;
      list.appendChild(card);
      observeReveal(card);

      // Overlay
      if (!root) return;

      const metaParts = [];
      if (item.type) metaParts.push(item.type);
      if (item.date) metaParts.push(item.date);
      if (item.zone) metaParts.push(item.zone);

      const metaLine = metaParts.map(escapeHtml).join(" · ");

      const panel = document.createElement("div");
      panel.id = `panel-${slug}`;
      panel.className = "overlay-panel";

      panel.innerHTML = `
        <button class="overlay-close">×</button>

        <div class="article-header">
          ${item.image
            ? `<figure class="article-cover"><img src="${escapeAttr(item.image)}" alt=""></figure>`
            : ""}
          <div class="article-meta">
            ${metaLine ? `<div class="article-tagline">${metaLine}</div>` : ""}
            <h2>${escapeHtml(title)}</h2>
            ${excerpt ? `<p class="article-chapeau">${escapeHtml(excerpt)}</p>` : ""}
          </div>
        </div>

        ${buildPdfBannerHtml(item.pdf_url, "memo")}

        <div class="article-body">
          ${markdownToHtml(item.body || item.texte || "")}
          ${item.signature ? `<p class="article-signature">${escapeHtml(item.signature)}</p>` : ""}
          ${buildShareBlockHtml(slug, title)}
        </div>

        <div class="overlay-footer">
          <button class="overlay-close">Fermer</button>
        </div>
      `;
      root.appendChild(panel);
    });

  } catch (err) {
    console.error("Erreur chargement Mémorandums :", err);
  }
}


async function loadAgenda() {
  const list = document.querySelector("[data-agenda-list]");
  if (!list) return;

  try {
    const res = await fetch("content/agenda.json");
    if (!res.ok) return;

    const { items = [] } = await res.json();

    list.innerHTML = "";

    items.forEach(item => {
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


async function loadDossiers() {
  const list = document.querySelector("[data-dossiers-list]");
  if (!list) return;

  try {
    const res = await fetch("content/dossiers.json");
    if (!res.ok) return;

    const { items = [] } = await res.json();
    const root = document.querySelector("[data-dynamic-overlays]");

    list.innerHTML = "";

    items.forEach((item, index) => {
      const slug = "dossier-" + index;

      // Carte
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

      // Overlay
      if (!root) return;

      const metaParts = [];
      if (item.zone) metaParts.push(item.zone);
      if (item.date) metaParts.push(item.date);
      if (item.type) metaParts.push(item.type);

      const metaLine = metaParts.map(escapeHtml).join(" · ");

      const panel = document.createElement("div");
      panel.id = `panel-${slug}`;
      panel.className = "overlay-panel";

      panel.innerHTML = `
        <button class="overlay-close">×</button>

        <div class="article-header">
          ${item.image
            ? `<figure class="article-cover"><img src="${escapeAttr(item.image)}" alt=""></figure>`
            : ""}
          <div class="article-meta">
            ${metaLine ? `<div class="article-tagline">${metaLine}</div>` : ""}
            <h2>${escapeHtml(item.title || "")}</h2>
          </div>
        </div>

        <div class="article-body">
          ${markdownToHtml(item.body || "")}
          ${item.signature ? `<p class="article-signature">${escapeHtml(item.signature)}</p>` : ""}
          ${buildShareBlockHtml(slug, item.title || "")}
        </div>

        <div class="overlay-footer">
          <button class="overlay-close">Fermer</button>
        </div>
      `;
      root.appendChild(panel);
    });

  } catch (err) {
    console.error("Erreur chargement Dossiers :", err);
  }
}


/* =========================================================
   PARTAGE
   ========================================================= */
document.addEventListener("click", e => {
  const btn = e.target.closest(".share-btn");
  if (!btn) return;

  const container = btn.closest(".article-share");
  if (!container) return;

  const slug = container.dataset.shareSlug || "";
  const panel = btn.closest(".overlay-panel");
  let title = document.title;

  if (panel) {
    const h2 = panel.querySelector("h2");
    if (h2?.textContent) title = h2.textContent.trim();
  }

  const pageUrl = window.location.origin + window.location.pathname;
  const url = pageUrl + (slug ? "#" + slug : "");

  const shareUrl = buildShareUrl(btn.dataset.share, url, title);
  if (shareUrl) window.open(shareUrl, "_blank", "noopener");
});


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeRegion(region) {
  const r = (region || "").toLowerCase().trim();
  if (r.includes("france")) return "france";
  if (r.includes("europ")) return "europe";
  if (r.includes("monde") || r.includes("global")) return "monde";
  return "monde";
}

function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function themeLabel(key) {
  const k = normalizeKey(key);
  switch (k) {
    case "geopolitique": return "Géopolitique";
    case "politique": return "Politique";
    case "ecologie": return "Écologie / climat";
    case "finances": return "Économie / finances";
    case "sante": return "Santé / société";
    default: return "Autre";
  }
}

/* ⭐ Nouveau : Markdown complet grâce à marked.js */
function markdownToHtml(md) {
  if (!md) return "";
  return marked.parse(md);
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


function buildShareBlockHtml(slug) {
  if (!slug) return "";
  return `
    <div class="article-share" data-share-slug="${escapeAttr(slug)}">
      <span class="article-share-label">Partager :</span>
      <button class="share-btn" data-share="x">X</button>
      <button class="share-btn" data-share="facebook">Facebook</button>
      <button class="share-btn" data-share="linkedin">LinkedIn</button>
      <button class="share-btn" data-share="mail">E-mail</button>
    </div>
  `;
}

function buildShareUrl(type, url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title || "");
  switch (type) {
    case "x": return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "mail": return `mailto:?subject=${t}&body=${u}`;
    default: return "";
  }
}


/* =========================================================
   BANNIÈRE PDF
   ========================================================= */
function buildPdfBannerHtml(url, kind) {
  if (!url) return "";

  const href = escapeAttr(url);

  let title = "Version PDF disponible";
  let sub = "Vous pouvez télécharger la version complète en PDF.";
  let btn = "Télécharger (PDF)";

  if (kind === "memo") {
    title = "Mémorandum – version PDF";
    sub = "Version complète du mémorandum en PDF.";
    btn = "Télécharger le mémorandum";
  }

  return `
    <div class="download-banner">
      <div class="download-banner-inner">
        <div class="download-banner-text">
          <span class="download-banner-title">${title}</span>
          <span class="download-banner-sub">${sub}</span>
        </div>
        <a class="download-banner-btn" href="${href}" target="_blank" rel="noopener">
          ${btn}
        </a>
      </div>
    </div>
  `;
}


/* =========================================================
   OVERLAY PLEIN ÉCRAN — DIPLOMAG UNE
   ========================================================= */
function initDiplomagStandalone() {
  const overlay = document.getElementById("diplomagOverlay");
  if (!overlay) return;

  const openBtn = document.getElementById("openDiplomag");
  const closeTop = document.getElementById("diplomagCloseTop");
  const closeBottom = document.getElementById("diplomagCloseBottom");

  function open() {
    overlay.classList.remove("hidden");
  }

  function close() {
    overlay.classList.add("hidden");
  }

  if (openBtn) openBtn.addEventListener("click", e => {
    e.preventDefault();
    open();
  });

  if (closeTop) closeTop.addEventListener("click", close);
  if (closeBottom) closeBottom.addEventListener("click", close);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") close();
  });
}
