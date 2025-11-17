document.addEventListener("DOMContentLoaded", () => {
    // Loader initial
    const loader = document.querySelector(".page-loader");
    setTimeout(() => {
        loader.classList.add("hidden");
    }, 1200);

    // Menu mobile
    const navToggle = document.querySelector(".nav-toggle");
    const navList = document.querySelector(".nav-list");
    if (navToggle && navList) {
        navToggle.addEventListener("click", () => {
            navList.classList.toggle("open");
        });

        navList.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navList.classList.remove("open");
            });
        });
    }

    // Apparition des blocs au scroll
    const revealEls = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    revealEls.forEach(el => observer.observe(el));

    // Charte accordeon
    document.querySelectorAll(".charte-block").forEach(block => {
        const toggle = block.querySelector(".charte-toggle");
        toggle.addEventListener("click", () => {
            const isOpen = block.classList.contains("open");
            document.querySelectorAll(".charte-block").forEach(b => b.classList.remove("open"));
            if (!isOpen) {
                block.classList.add("open");
            }
        });
    });

    // Overlay "Consulter +"
    const overlay = document.querySelector("[data-overlay]");
    const panels = overlay ? overlay.querySelectorAll(".overlay-panel") : [];
    function openPanel(id) {
        if (!overlay) return;
        overlay.classList.add("open");
        panels.forEach(p => p.classList.remove("active"));
        const target = document.getElementById(id);
        if (target) {
            target.classList.add("active");
        }
    }
    function closeOverlay() {
        if (!overlay) return;
        overlay.classList.remove("open");
        panels.forEach(p => p.classList.remove("active"));
    }

    document.querySelectorAll("[data-panel]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-panel");
            openPanel(id);
        });
    });

    if (overlay) {
        overlay.addEventListener("click", e => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });
        overlay.querySelectorAll(".overlay-close").forEach(btn => {
            btn.addEventListener("click", closeOverlay);
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                closeOverlay();
            }
        });
    }

    // Filtres Diplomag
    const filterGroups = document.querySelectorAll(".filter-chips");
    const cards = document.querySelectorAll(".diplomag-card");

    function applyFilters() {
        const activeRegion = document
            .querySelector('[data-filter-group="region"] .chip.active')
            ?.getAttribute("data-filter-value") || "all";
        const activeTheme = document
            .querySelector('[data-filter-group="theme"] .chip.active')
            ?.getAttribute("data-filter-value") || "all";

        cards.forEach(card => {
            const region = card.getAttribute("data-region");
            const theme = card.getAttribute("data-theme");
            const matchRegion = activeRegion === "all" || region === activeRegion;
            const matchTheme = activeTheme === "all" || theme === activeTheme;
            card.style.display = matchRegion && matchTheme ? "" : "none";
        });
    }

    filterGroups.forEach(group => {
        group.querySelectorAll(".chip").forEach(chip => {
            chip.addEventListener("click", () => {
                group.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                applyFilters();
            });
        });
    });

    applyFilters();


    async function loadJSON(path) {
        try {
            const response = await fetch(path, { cache: "no-store" });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            return null;
        }
    }

    function nl2br(str) {
        return (str || "").replace(/\n/g, "<br>");
    }

    async function loadDynamicContent() {
        const overlayDynamic = document.querySelector("[data-dynamic-overlays]");

        // Diplomag
        const diplomagList = document.querySelector("[data-diplomag-list]");
        if (diplomagList && overlayDynamic) {
            const data = await loadJSON("content/diplomag.json");
            if (data && Array.isArray(data.articles) && data.articles.length) {
                diplomagList.innerHTML = "";
                data.articles.forEach((article, index) => {
                    const slug = article.slug || `article-${index + 1}`;
                    const panelId = `panel-article-${slug}`;
                    const card = document.createElement("article");
                    card.className = "card diplomag-card reveal";
                    card.setAttribute("data-region", article.region || "all");
                    card.setAttribute("data-theme", article.theme || "all");
                    card.innerHTML = `
                        <div class="card-heading">
                            <span class="card-tag">${article.tag || ""}</span>
                            <h3>${article.title || ""}</h3>
                        </div>
                        <p class="card-excerpt">
                            ${article.excerpt || ""}
                        </p>
                        <button class="link-more" data-panel="${panelId}">Lire l'article</button>
                    `;
                    diplomagList.appendChild(card);

                    const panel = document.createElement("div");
                    panel.className = "overlay-panel";
                    panel.id = panelId;
                    panel.innerHTML = `
                        <button class="overlay-close" aria-label="Fermer">×</button>
                        <h2>${article.title || ""}</h2>
                        <p>${nl2br(article.body || "")}</p>
                    `;
                    overlayDynamic.appendChild(panel);
                });
            }
        }

        // Memorandums
        const memoList = document.querySelector("[data-memo-list]");
        if (memoList && overlayDynamic) {
            const data = await loadJSON("content/memorandums.json");
            if (data && Array.isArray(data.items) && data.items.length) {
                memoList.innerHTML = "";
                data.items.forEach((item, index) => {
                    const slug = item.slug || `memo-${index + 1}`;
                    const panelId = `panel-memo-${index + 1}`;
                    const card = document.createElement("article");
                    card.className = "card reveal";
                    card.innerHTML = `
                        <div class="card-heading">
                            <span class="card-tag">${item.tag || ""}</span>
                            <h3>${item.title || ""}</h3>
                        </div>
                        <p class="card-excerpt">
                            ${item.excerpt || ""}
                        </p>
                        <button class="link-more" data-panel="${panelId}">Consulter +</button>
                    `;
                    memoList.appendChild(card);

                    const panel = document.createElement("div");
                    panel.className = "overlay-panel";
                    panel.id = panelId;
                    panel.innerHTML = `
                        <button class="overlay-close" aria-label="Fermer">×</button>
                        <h2>${item.title || ""}</h2>
                        <p>${nl2br(item.body || "")}</p>
                        ${item.link ? `<p><a href="${item.link}" target="_blank" rel="noopener">Télécharger le mémorandum (PDF)</a></p>` : ""}
                    `;
                    overlayDynamic.appendChild(panel);
                });
            }
        }

        // Agenda
        const agendaList = document.querySelector("[data-agenda-list]");
        if (agendaList) {
            const data = await loadJSON("content/agenda.json");
            if (data && Array.isArray(data.events) && data.events.length) {
                agendaList.innerHTML = "";
                data.events.forEach(event => {
                    const block = document.createElement("div");
                    block.className = "agenda-item reveal";
                    block.innerHTML = `
                        <div class="agenda-date">${event.dateLabel || ""}</div>
                        <div class="agenda-content">
                            <h3>${event.title || ""}</h3>
                            <p>${event.description || ""}</p>
                        </div>
                    `;
                    agendaList.appendChild(block);
                });
            }
        }

        // Dossiers
        const dossierList = document.querySelector("[data-dossier-list]");
        if (dossierList && overlayDynamic) {
            const data = await loadJSON("content/dossiers.json");
            if (data && Array.isArray(data.dossiers) && data.dossiers.length) {
                dossierList.innerHTML = "";
                data.dossiers.forEach((dossier, index) => {
                    const panelId = `panel-dossier-${index + 1}`;
                    const card = document.createElement("article");
                    card.className = "card reveal";
                    card.innerHTML = `
                        <div class="card-heading">
                            <span class="card-tag">${dossier.tag || ""}</span>
                            <h3>${dossier.title || ""}</h3>
                        </div>
                        <p class="card-excerpt">
                            ${dossier.excerpt || ""}
                        </p>
                        <button class="link-more" data-panel="${panelId}">Consulter +</button>
                    `;
                    dossierList.appendChild(card);

                    const panel = document.createElement("div");
                    panel.className = "overlay-panel";
                    panel.id = panelId;
                    panel.innerHTML = `
                        <button class="overlay-close" aria-label="Fermer">×</button>
                        <h2>${dossier.title || ""}</h2>
                        <p>${nl2br(dossier.body || "")}</p>
                    `;
                    overlayDynamic.appendChild(panel);
                });
            }
        }
    }

    loadDynamicContent();

    // Bandeau cookies (uniquement cookies essentiels)
    const cookieBanner = document.querySelector("[data-cookie-banner]");
    const cookieAcceptBtn = document.querySelector("[data-cookie-accept]");
    try {
        const consentGiven = window.localStorage.getItem("diploval_cookie_consent");
        if (cookieBanner && consentGiven === "1") {
            cookieBanner.style.display = "none";
        }
        if (cookieBanner && cookieAcceptBtn) {
            cookieAcceptBtn.addEventListener("click", () => {
                cookieBanner.style.display = "none";
                try {
                    window.localStorage.setItem("diploval_cookie_consent", "1");
                } catch (e) {
                    // Si le stockage est désactivé, on ne fait rien de plus
                }
            });
        }
    } catch (e) {
        // Pas de localStorage disponible : le bandeau restera visible
    }

});
