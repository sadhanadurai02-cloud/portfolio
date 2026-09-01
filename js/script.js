(() => {
  const root = document.documentElement;
  const THEME_KEY = 'sd-portfolio-theme';

  // — theme toggle —
  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    const glyph = document.querySelector('[data-theme-glyph]');
    if (glyph) glyph.textContent = dark ? '☾' : '☀';
  }

  function initTheme() {
    let dark = false;
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark') dark = true;
      else if (saved === 'light') dark = false;
    } catch (e) {}
    applyTheme(dark);

    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = !root.hasAttribute('data-theme');
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch (e) {}
      });
    }
  }

  // — timeline accordion —
  function initTimeline() {
    document.querySelectorAll('[data-role-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        const details = document.getElementById(targetId);
        if (!details) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        details.hidden = expanded;
      });
    });
  }

  // — sales process cycle —
  const STAGES = [
    ['Research', 'Why this account, why now'],
    ['Prospect', 'Find the right person, not any person'],
    ['Personalize', 'One relevant line beats ten generic ones'],
    ['Engage', 'Call, email, LinkedIn — in sequence'],
    ['Discover', 'Questions before pitches'],
    ['Qualify', 'Need, pain, timeline, decision path'],
    ['Book meeting', 'A calendar hold with a stated agenda'],
    ['Create opportunity', 'Clean handoff, clean CRM record']
  ];

  function initProcessCycle() {
    const nameEl = document.querySelector('[data-stage-name]');
    const noteEl = document.querySelector('[data-stage-note]');
    const nodes = Array.from(document.querySelectorAll('[data-process-node]'));
    if (!nameEl || !noteEl || !nodes.length) return;

    function setStage(i) {
      const stage = STAGES[i] || STAGES[0];
      nameEl.textContent = stage[0];
      noteEl.textContent = stage[1];
      nodes.forEach(n => n.classList.toggle('is-active', n === nodes[i]));
    }

    nodes.forEach((node, i) => {
      node.addEventListener('mouseenter', () => setStage(i));
      node.addEventListener('focus', () => setStage(i));
      node.addEventListener('click', () => setStage(i));
    });

    setStage(0);
  }

  // — scroll reveal, animated counters, animated bars —
  function initReveal() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(document.querySelectorAll('[data-reveal]'));

    function runCounters(scope) {
      scope.querySelectorAll('[data-count]').forEach(n => {
        if (n.dataset.done) return;
        n.dataset.done = '1';
        const to = parseFloat(n.getAttribute('data-count'));
        const suffix = n.getAttribute('data-suffix') || '';
        if (reduce) { n.textContent = to + suffix; return; }
        const dur = 1100;
        const t0 = performance.now();
        const tick = now => {
          const p = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          n.textContent = Math.round(to * e) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      scope.querySelectorAll('[data-bar]').forEach(b => {
        if (b.dataset.done) return;
        b.dataset.done = '1';
        b.style.setProperty('--bar-target', b.getAttribute('data-bar') + '%');
        requestAnimationFrame(() => b.classList.add('is-visible'));
      });
    }

    if (reduce) {
      items.forEach(el => el.classList.add('is-visible'));
      runCounters(document);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        runCounters(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(el => io.observe(el));

    // The hero stat counters sit outside any [data-reveal] block, so they
    // run on load rather than waiting for a scroll-into-view.
    runCounters(document.querySelector('#top') || document);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTimeline();
    initProcessCycle();
    initReveal();
  });
})();
