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

      // ---- CARTE LISTE ----
      const card = document.createElement("article");
      card.className = "card diplomag-card reveal";
      card.dataset.region = normalizeRegion(regionKey);
      card.dataset.theme = themeKey;

      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(
            item.pays || ""
          )} · ${escapeHtml(themeLabel(themeKey))}</span>
          <h3>${escapeHtml(item.titre || "")}</h3>
        </div>
        <p class="card-excerpt">${escapeHtml(item.extrait || "")}</p>
        <button class="link-more" data-panel="panel-article-${slug}">Lire l'article</button>
      `;

      list.appendChild(card);
      observeReveal(card);

      // ---- OVERLAY ARTICLE ----
      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-article-${slug}`;

        const metaParts = [];
        if (item.pays) metaParts.push(item.pays);
        if (item.date) metaParts.push(item.date);
        if (themeKey) metaParts.push(themeLabel(themeKey));

        const metaLine = metaParts
          .map((p) => escapeHtml(p))
          .join(" · ");

        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>

          <div class="article-header">
            ${
              item.image
                ? `<figure class="article-cover">
                     <img src="${escapeAttr(
                       item.image
                     )}" alt="${escapeAttr(item.titre || "")}">
                   </figure>`
                : ""
            }
            <div class="article-meta">
              ${
                metaLine
                  ? `<div class="article-tagline">${metaLine}</div>`
                  : ""
              }
              <h2>${escapeHtml(item.titre || "")}</h2>
              ${
                item.extrait
                  ? `<p class="article-chapeau">${escapeHtml(
                      item.extrait
                    )}</p>`
                  : ""
              }
            </div>
          </div>

          ${buildPdfBannerHtml(item.pdf_url, "article")}

          <div class="article-body">
            ${markdownToHtml(item.body || "")}
            ${
              item.signature
                ? `<p class="article-signature">${escapeHtml(
                    item.signature
                  )}</p>`
                : ""
            }
            ${buildShareBlockHtml(slug, item.titre || "")}
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

    // On vide les cartes de démo
    list.innerHTML = "";

    const overlaysRoot = document.querySelector("[data-dynamic-overlays]");

    items.forEach((item, index) => {
      const slugRaw = item.slug || `memo-${index}`;
      const slug    = String(slugRaw).trim();

      const title   = item.title   || item.titre   || "Mémorandum";
      const excerpt = item.excerpt || item.extrait || "";
      const type    = item.type    || "Mémorandum";
      const zone    = item.zone    || "";
      const date    = item.date    || "";
      const image   = item.image   || "";
      const pdfUrl  = item.pdf_url || item.pdf || item.lien_pdf || "";
      const bodyMd  = item.body    || item.texte || "";
      const signature = item.signature || "";

      // ---------- CARTE DANS LA SECTION "MÉMORANDUMS" ----------
      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="card-heading">
          <span class="card-tag">${escapeHtml(type)}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        ${excerpt ? `<p class="card-excerpt">${escapeHtml(excerpt)}</p>` : ""}
        <button class="link-more" data-panel="panel-${slug}">Consulter +</button>
      `;
      list.appendChild(card);
      observeReveal(card);

      // ---------- OVERLAY COMPLET DU MÉMORANDUM ----------
      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-${slug}`;

        const metaParts = [];
        if (type) metaParts.push(type);
        if (date) metaParts.push(date);
        if (zone) metaParts.push(zone);
        const metaLine = metaParts.map((p) => escapeHtml(p)).join(" · ");

        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>

          <div class="article-header">
            ${
              image
                ? `<figure class="article-cover">
                     <img src="${escapeAttr(image)}" alt="${escapeAttr(title)}">
                   </figure>`
                : ""
            }
            <div class="article-meta">
              ${
                metaLine
                  ? `<div class="article-tagline">${metaLine}</div>`
                  : ""
              }
              <h2>${escapeHtml(title)}</h2>
              ${
                excerpt
                  ? `<p class="article-chapeau">${escapeHtml(excerpt)}</p>`
                  : ""
              }
            </div>
          </div>

          ${buildPdfBannerHtml(pdfUrl, "memo")}

          <div class="article-body">
            ${markdownToHtml(bodyMd)}
            ${
              signature
                ? `<p class="article-signature">${escapeHtml(signature)}</p>`
                : ""
            }
            ${buildShareBlockHtml(slug, title)}
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

      // ---- CARTE LISTE ----
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

      // ---- OVERLAY DOSSIER ----
      if (overlaysRoot) {
        const panel = document.createElement("div");
        panel.className = "overlay-panel";
        panel.id = `panel-${slug}`;

        const metaParts = [];
        if (item.zone) metaParts.push(item.zone);
        if (item.date) metaParts.push(item.date);
        if (item.type) metaParts.push(item.type);
        const metaLine = metaParts
          .map((p) => escapeHtml(p))
          .join(" · ");

        panel.innerHTML = `
          <button class="overlay-close" aria-label="Fermer">×</button>

          <div class="article-header">
            ${
              item.image
                ? `<figure class="article-cover">
                     <img src="${escapeAttr(
                       item.image
                     )}" alt="${escapeAttr(item.title || "")}">
                   </figure>`
                : ""
            }
            <div class="article-meta">
              ${
                metaLine
                  ? `<div class="article-tagline">${metaLine}</div>`
                  : ""
              }
              <h2>${escapeHtml(item.title || "")}</h2>
            </div>
          </div>

          <div class="article-body">
            ${markdownToHtml(item.body || "")}
            ${
              item.signature
                ? `<p class="article-signature">${escapeHtml(
                    item.signature
                  )}</p>`
                : ""
            }
            ${buildShareBlockHtml(slug, item.title || "")}
          </div>
        `;
        overlaysRoot.appendChild(panel);
      }
    });
  } catch (err) {
    console.error("Erreur chargement Dossiers :", err);
  }
}

/* ========== Partage des articles ========== */

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".share-btn");
  if (!btn) return;

  const container = btn.closest(".article-share");
  if (!container) return;

  const slug = container.dataset.shareSlug || "";
  const panel = btn.closest(".overlay-panel");
  let title = document.title;

  if (panel) {
    const h2 = panel.querySelector("h2");
    if (h2 && h2.textContent) {
      title = h2.textContent.trim();
    }
  }

  const pageUrl = window.location.origin + window.location.pathname;
  const url = pageUrl + (slug ? "#" + slug : "");

  const shareUrl = buildShareUrl(btn.dataset.share, url, title);
  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener");
  }
});

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

function buildShareBlockHtml(slug, title) {
  if (!slug) return "";
  return `
    <div class="article-share" data-share-slug="${escapeAttr(slug)}">
      <span class="article-share-label">Partager :</span>
      <button type="button" class="share-btn" data-share="x">X</button>
      <button type="button" class="share-btn" data-share="facebook">Facebook</button>
      <button type="button" class="share-btn" data-share="linkedin">LinkedIn</button>
      <button type="button" class="share-btn" data-share="mail">E-mail</button>
    </div>
  `;
}

function buildShareUrl(type, url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title || "");
  switch (type) {
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "mail":
      return `mailto:?subject=${t}&body=${u}`;
    default:
      return "";
  }
}

/* ========== Bannière PDF commune (articles & mémos) ========== */

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
          <span class="download-banner-title">${escapeHtml(title)}</span>
          <span class="download-banner-sub">${escapeHtml(sub)}</span>
        </div>
        <a class="download-banner-btn" href="${href}" target="_blank" rel="noopener">
          ${escapeHtml(btn)}
        </a>
      </div>
    </div>
  `;
}
