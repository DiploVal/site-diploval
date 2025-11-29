// assets/js/main.js

document.addEventListener("DOMContentLoaded", function () {
  initLoader();
  initNav();
  initReveal();
  initCookies();
  initOverlaySystem(); // <- gestion des overlays

  // Page d'accueil
  if (document.body.classList.contains("page-home")) {
    loadHomeMemorandums();
    loadHomeDossiers();
    loadHomeAgenda();
  }

  // Page Diplomag
  if (document.body.classList.contains("page-diplomag")) {
    initDiplomag();
  }
});

/* =========================
   Loader
   ========================= */

function initLoader() {
  window.addEventListener("load", function () {
    var loader = document.querySelector(".page-loader");
    if (loader) {
      loader.classList.add("hidden");
    }
  });
}

/* =========================
   Navigation mobile
   ========================= */

function initNav() {
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.querySelector(".nav-list");
  if (!toggle || !navList) return;

  toggle.addEventListener("click", function () {
    navList.classList.toggle("open");
  });

  navList.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navList.classList.remove("open");
    });
  });
}

/* =========================
   Apparition progressive
   ========================= */

function initReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach(function (el) {
    observer.observe(el);
  });
}

/* =========================
   Système d’overlays (simplifié)
   ========================= */

function initOverlaySystem() {
  var overlays = document.querySelectorAll(".overlay");

  if (!overlays.length) {
    return;
  }

  function openOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // CLICS (ouverture / fermeture) – délégués sur tout le document
  document.addEventListener("click", function (e) {
    // Ouverture : bouton avec data-overlay-target
    var trigger = e.target.closest("[data-overlay-target]");
    if (trigger) {
      var selector = trigger.getAttribute("data-overlay-target");
      if (!selector) return;
      var overlay = document.querySelector(selector);
      if (!overlay) return;
      e.preventDefault();
      openOverlay(overlay);
      return;
    }

    // Fermeture : bouton avec data-overlay-close ou .overlay-close
    var closeBtn = e.target.closest("[data-overlay-close], .overlay-close");
    if (closeBtn) {
      var overlayToClose = closeBtn.closest(".overlay");
      if (overlayToClose) {
        e.preventDefault();
        closeOverlay(overlayToClose);
      }
      return;
    }

    // Clic sur le fond sombre de l’overlay
    if (e.target.classList.contains("overlay")) {
      closeOverlay(e.target);
    }
  });

  // Échap pour fermer l’overlay ouvert
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Esc") {
      overlays.forEach(function (overlay) {
        if (overlay.classList.contains("open")) {
          closeOverlay(overlay);
        }
      });
    }
  });
}

/* =========================
   Cookies
   ========================= */

function initCookies() {
  var banner = document.querySelector(".cookie-banner");
  if (!banner) return;
  var btn = banner.querySelector("[data-cookie-accept]");
  if (!btn) return;

  var KEY = "diplovalCookiesOk";
  try {
    if (localStorage.getItem(KEY) === "1") {
      banner.style.display = "none";
      return;
    }
  } catch (e) {}

  btn.addEventListener("click", function () {
    banner.style.display = "none";
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {}
  });
}

/* =========================
   Utilitaire JSON
   ========================= */

function fetchJson(path) {
  return fetch(path).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  });
}

/* =========================
   Mémorandums
   ========================= */

function loadHomeMemorandums() {
  var container = document.querySelector("[data-memos]");
  if (!container) return;

  fetchJson("content/memorandums.json")
    .then(function (data) {
      var items = (data && data.items) || [];
      if (!items.length) {
        container.innerHTML = "<p class='muted'>Aucun mémorandum public pour le moment.</p>";
        return;
      }
      container.innerHTML = "";
      items.slice(0, 3).forEach(function (item) {
        var div = document.createElement("article");
        div.className = "card reveal";
        div.innerHTML = [
          "<div class='card-heading'>",
          "<span class='card-tag'>" + (item.tag || "Mémorandum") + "</span>",
          "<h3>" + (item.title || "") + "</h3>",
          "</div>",
          "<p class='card-excerpt'>" + (item.excerpt || "") + "</p>",
          (item.pdf ? "<a class='btn-ghost' href='" + item.pdf + "' target='_blank' rel='noopener'>Télécharger le PDF</a>" : "")
        ].join("");
        container.appendChild(div);
      });
      initReveal();
    })
    .catch(function () {
      container.innerHTML = "<p class='muted'>Les mémorandums seront bientôt en ligne.</p>";
    });
}

/* =========================
   Dossiers
   ========================= */

function loadHomeDossiers() {
  var container = document.querySelector("[data-dossiers]");
  if (!container) return;

  fetchJson("content/dossiers.json")
    .then(function (data) {
      var items = (data && data.items) || [];
      if (!items.length) {
        container.innerHTML = "<p class='muted'>Aucun dossier public pour le moment.</p>";
        return;
      }
      container.innerHTML = "";
      items.slice(0, 3).forEach(function (item) {
        var div = document.createElement("article");
        div.className = "card reveal";
        div.innerHTML = [
          "<div class='card-heading'>",
          "<span class='card-tag'>" + (item.tag || "Dossier") + "</span>",
          "<h3>" + (item.title || "") + "</h3>",
          "</div>",
          "<p class='card-excerpt'>" + (item.excerpt || "") + "</p>",
          (item.pdf ? "<a class='btn-ghost' href='" + item.pdf + "' target='_blank' rel='noopener'>Télécharger le PDF</a>" : "")
        ].join("");
        container.appendChild(div);
      });
      initReveal();
    })
    .catch(function () {
      container.innerHTML = "<p class='muted'>Les dossiers seront bientôt en ligne.</p>";
    });
}

/* =========================
   Agenda
   ========================= */

function loadHomeAgenda() {
  var container = document.querySelector("[data-agenda]");
  if (!container) return;

  fetchJson("content/agenda.json")
    .then(function (data) {
      var items = (data && data.items) || [];
      if (!items.length) {
        container.innerHTML = "<p class='muted'>Aucun événement à afficher pour le moment.</p>";
        return;
      }
      container.innerHTML = "";
      items.slice(0, 4).forEach(function (item) {
        var block = document.createElement("div");
        block.className = "agenda-item reveal";
        block.innerHTML =
          "<div class='agenda-date'>" + (item.date || "") + "</div>" +
          "<div class='agenda-content'>" +
          "<h3>" + (item.title || "") + "</h3>" +
          "<p>" + (item.description || "") + "</p>" +
          "</div>";
        container.appendChild(block);
      });
      initReveal();
    })
    .catch(function () {
      container.innerHTML = "<p class='muted'>L'agenda sera bientôt disponible.</p>";
    });
}

/* =========================
   Diplomag
   ========================= */

function initDiplomag() {
  var grid = document.querySelector("[data-diplomag-articles]");
  var selectTheme = document.querySelector("[data-filter-theme]");
  var selectPays = document.querySelector("[data-filter-pays]");
  var searchInput = document.getElementById("diplomag-search");
  var allArticles = [];

  if (!grid) return;

  function normalize(str) {
    return (str || "").toString().toLowerCase();
  }

  function render() {
    grid.innerHTML = "";
    var theme = selectTheme ? selectTheme.value : "";
    var pays = selectPays ? selectPays.value : "";
    var search = normalize(searchInput ? searchInput.value : "");

    var filtered = allArticles.filter(function (a) {
      var okTheme = !theme || (a.theme && a.theme === theme);
      var okPays = !pays || (a.pays && a.pays === pays);

      var text = normalize(
        (a.titre || "") + " " +
        (a.extrait || "") + " " +
        (a.theme || "") + " " +
        (a.pays || "")
      );

      var okSearch = !search || text.indexOf(search) !== -1;

      return okTheme && okPays && okSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = "<p class='muted'>Aucun article ne correspond à ces critères pour le moment.</p>";
      return;
    }

    filtered.forEach(function (a) {
      var card = document.createElement("article");
      card.className = "article-card";
      card.innerHTML =
        "<div class='article-meta'>" + (a.date || "") +
        (a.pays ? " — " + a.pays : "") +
        (a.theme ? " · " + a.theme : "") +
        "</div>" +
        "<h3>" + (a.titre || "") + "</h3>" +
        "<p>" + (a.extrait || "") + "</p>";

      if (a.url) {
        card.addEventListener("click", function () {
          window.open(a.url, "_blank");
        });
      }

      grid.appendChild(card);
    });
  }

  fetchJson("content/diplomag.json")
    .then(function (data) {
      allArticles = (data && data.items) || [];
      render();
    })
    .catch(function () {
      grid.innerHTML = "<p class='muted'>Les articles Diplomag seront bientôt disponibles.</p>";
    });

  if (selectTheme) {
    selectTheme.addEventListener("change", render);
  }
  if (selectPays) {
    selectPays.addEventListener("change", render);
  }
  if (searchInput) {
    searchInput.addEventListener("input", render);
  }
}
