// DarkRP Reborn website: small progressive enhancements, no framework.
(function () {
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Tabs (docs Tabs / CodeGroup).
  $$('.tabs').forEach((tabs) => {
    const btns = $$(':scope > .tabs__bar > .tabs__btn', tabs);
    const panels = $$(':scope > .tabs__panel', tabs);
    btns.forEach((btn, i) => btn.addEventListener('click', () => {
      btns.forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
      panels.forEach((p, j) => { p.hidden = i !== j; });
    }));
  });

  // Copy buttons on code blocks.
  $$('.code__copy').forEach((btn) => btn.addEventListener('click', async () => {
    const code = btn.closest('.code').querySelector('pre');
    try {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = 'Copié';
    } catch (e) {
      btn.textContent = 'Sélectionnez le texte';
    }
    setTimeout(() => { btn.textContent = 'Copier'; }, 1600);
  }));

  // Lightbox for zoomable images.
  const lb = document.getElementById('lightbox');
  if (lb) {
    const img = lb.querySelector('img');
    const cap = lb.querySelector('p');
    document.addEventListener('click', (e) => {
      const z = e.target.closest('[data-zoom]');
      if (z) {
        e.preventDefault();
        img.src = z.dataset.zoom;
        img.alt = z.dataset.cap || '';
        cap.textContent = z.dataset.cap || '';
        lb.showModal();
        return;
      }
      if (e.target === lb || e.target.closest('.close')) lb.close();
    });
  }

  // Video page: cards swap the main player.
  const player = document.getElementById('player');
  if (player) {
    const video = player.querySelector('video');
    const title = player.querySelector('[data-title]');
    const meta = player.querySelector('[data-meta]');
    $$('.vcard').forEach((card) => card.addEventListener('click', () => {
      $$('.vcard').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      card.setAttribute('aria-pressed', 'true');
      video.poster = card.dataset.poster;
      video.src = card.dataset.src;
      title.textContent = card.dataset.title;
      meta.innerHTML = card.dataset.meta;
      video.play().catch(() => {});
      player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  // Keep decorative loops still for people who asked for less motion.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('video[data-ambient]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }

  // Docs: table of contents follows the reading position.
  const toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const byId = new Map(toc.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          toc.forEach((a) => a.classList.remove('is-active'));
          const a = byId.get(en.target.id);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // Docs: instant search over titles and headings.
  const input = document.getElementById('docs-search');
  if (input) {
    const box = document.getElementById('docs-results');
    let index = null;
    const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const load = async () => {
      if (!index) index = await (await fetch('/docs/search.json')).json();
      return index;
    };
    const render = async () => {
      const q = norm(input.value.trim());
      if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
      const items = await load();
      const words = q.split(/\s+/);
      const hits = items.filter((it) => words.every((w) => it.k.includes(w))).slice(0, 12);
      box.innerHTML = hits.length
        ? hits.map((h, i) => `<a href="${h.u}"${i === 0 ? ' class="is-active"' : ''}>${h.t}<small>${h.p}</small></a>`).join('')
        : '<a>Aucun résultat<small>Essayez un autre mot</small></a>';
      box.hidden = false;
    };
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const a = box.querySelector('a[href]'); if (a) location.href = a.href; }
      if (e.key === 'Escape') { input.value = ''; render(); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
  }
})();
