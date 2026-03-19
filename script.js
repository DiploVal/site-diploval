const intro = document.getElementById('intro');
const enterButton = document.getElementById('enterSite');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primaryNav');

function hideIntro() {
  if (!intro) return;
  intro.classList.add('hidden');
  intro.setAttribute('aria-hidden', 'true');
  sessionStorage.setItem('diploval_intro_seen', '1');
}

if (enterButton && intro) {
  enterButton.addEventListener('click', hideIntro);
  document.querySelectorAll('#intro a[href^="#"]').forEach((link) => {
    link.addEventListener('click', hideIntro);
  });
  if (sessionStorage.getItem('diploval_intro_seen') === '1') {
    hideIntro();
  }
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });
}

function absoluteUrl(relativeUrl) {
  return new URL(relativeUrl, window.location.href).toString();
}

function bindShareRows() {
  const rows = document.querySelectorAll('.share-row');
  rows.forEach((row) => {
    const title = row.dataset.title || document.title;
    const rawUrl = row.dataset.url || window.location.href;
    const finalUrl = absoluteUrl(rawUrl);

    const mail = row.querySelector('.share-mail');
    const linkedin = row.querySelector('.share-linkedin');
    const facebook = row.querySelector('.share-facebook');
    const x = row.querySelector('.share-x');
    const copy = row.querySelector('.share-copy');

    if (mail) {
      mail.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(finalUrl)}`;
    }
    if (linkedin) {
      linkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalUrl)}`;
      linkedin.target = '_blank';
      linkedin.rel = 'noopener';
    }
    if (facebook) {
      facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`;
      facebook.target = '_blank';
      facebook.rel = 'noopener';
    }
    if (x) {
      x.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent(title)}`;
      x.target = '_blank';
      x.rel = 'noopener';
    }
    if (copy) {
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(finalUrl);
          const oldText = copy.textContent;
          copy.textContent = 'Lien copié';
          setTimeout(() => { copy.textContent = oldText; }, 1600);
        } catch (error) {
          window.prompt('Copiez ce lien :', finalUrl);
        }
      });
    }
  });
}

bindShareRows();
