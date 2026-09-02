/* Open Line — interaction + scroll-choreography engine.
   Ported from the Claude Design handoff bundle's DC Component
   (project/Open Line - Sadhana Durai.dc.html) into a plain, static-page
   script — same math, same triggers, no framework runtime underneath. */
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function init() {
    // ── generic hover swap (ported from the DC "style-hover" shorthand) ──
    $$('[data-hover]').forEach((el) => {
      if (el.hasAttribute('data-play')) return; // playbook cards use dedicated logic below
      const base = el.getAttribute('style') || '';
      const hover = el.getAttribute('data-hover');
      el.addEventListener('mouseenter', () => el.setAttribute('style', base + ';' + hover));
      el.addEventListener('mouseleave', () => el.setAttribute('style', base));
    });

    // ── reveals ──
    const show = (n) => { n.style.opacity = '1'; n.style.transform = 'none'; };
    const prime = (n) => {
      n.style.opacity = '0';
      n.style.transform = 'translateY(34px)';
      n.style.transition = 'opacity 0.85s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)';
    };
    const reveals = $$('[data-reveal]');
    let primed = reduce;

    // ── playbook ──
    const playCards = $$('[data-play]');
    const setPlay = (idx) => {
      playCards.forEach((p, i) => {
        const on = i === idx;
        p.style.flexGrow = on ? '4' : '1';
        p.style.background = on ? 'oklch(0.188 0.016 42)' : 'oklch(0.915 0.018 76)';
        p.style.color = on ? 'oklch(0.968 0.009 72)' : 'oklch(0.188 0.016 42)';
        const num = p.querySelector('[data-play-num]');
        if (num) num.style.color = on ? 'oklch(0.955 0.014 85 / 0.6)' : 'oklch(0.545 0.021 52)';
        const body = p.querySelector('[data-play-body]');
        if (body) body.style.opacity = on ? '1' : '0';
      });
    };
    if (playCards.length) {
      const hit = (e) => {
        const p = e.target && e.target.closest ? e.target.closest('[data-play]') : null;
        if (p) setPlay(parseInt(p.getAttribute('data-play'), 10) || 0);
      };
      document.addEventListener('click', hit);
      document.addEventListener('mouseover', hit);
    }

    // ── portrait ──
    const pf = document.querySelector('[data-portrait]');
    const pimg = document.querySelector('[data-portrait-img]');
    if (pf && pimg) {
      pf.addEventListener('mouseenter', () => { pimg.style.filter = 'grayscale(0) contrast(1.02)'; pimg.style.transform = 'scale(1.06)'; });
      pf.addEventListener('mouseleave', () => { pimg.style.filter = 'grayscale(1) contrast(1.22)'; pimg.style.transform = 'scale(1.02)'; });
    }

    // ── hero: live-call transcript typing ──
    const h1 = document.querySelector('[data-type-line]');
    let typing = false;
    let typedOnce = false;
    const startType = () => {
      if (!h1 || reduce || typedOnce) return;
      typedOnce = true;
      const caret = h1.querySelector('[data-caret]');
      const nodes = [];
      const walk = (n) => {
        Array.from(n.childNodes).forEach((c) => {
          if (c.nodeType === 3) { if (c.nodeValue.trim()) nodes.push({ n: c, t: c.nodeValue }); }
          else if (c.nodeType === 1 && c !== caret) walk(c);
        });
      };
      walk(h1);
      const total = nodes.reduce((s, o) => s + o.t.length, 0);
      if (!total) return;
      nodes.forEach((o) => { o.n.nodeValue = ''; });
      let i = 0;
      typing = true;
      const step = () => {
        i += 2;
        let left = i;
        nodes.forEach((o) => {
          const take = Math.max(0, Math.min(o.t.length, left));
          o.n.nodeValue = o.t.slice(0, take);
          left -= take;
        });
        if (i < total) setTimeout(step, 26);
        else typing = false;
      };
      step();
    };

    // ── cursor ring ──
    const ring = document.querySelector('[data-cursor-ring]');
    const mouse = { x: -100, y: -100, rx: -100, ry: -100 };
    if (ring) {
      if (fine && !reduce) {
        ring.style.display = 'block';
        window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        $$('[data-cursor]').forEach((n) => {
          n.addEventListener('mouseenter', () => { ring.style.width = '78px'; ring.style.height = '78px'; ring.style.margin = '-39px 0 0 -39px'; ring.style.background = 'oklch(0.64 0.19 42 / 0.14)'; });
          n.addEventListener('mouseleave', () => { ring.style.width = '34px'; ring.style.height = '34px'; ring.style.margin = '-17px 0 0 -17px'; ring.style.background = 'transparent'; });
        });
      } else {
        ring.style.display = 'none';
      }
    }

    // ── magnetic buttons ──
    if (fine && !reduce) {
      $$('[data-magnet]').forEach((m) => {
        m.addEventListener('mousemove', (e) => {
          const r = m.getBoundingClientRect();
          m.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
        });
        m.addEventListener('mouseleave', () => { m.style.transform = 'translate(0,0)'; });
      });
    }

    // ── scroll engine ──
    const cache = {
      numSec: document.querySelector('[data-pin="numbers"]'),
      numPanels: $$('[data-num-panel]'),
      numBar: document.querySelector('[data-num-bar-fill]'),
      numCount: document.querySelector('[data-num-counter]'),
      tlSec: document.querySelector('[data-pin="timeline"]'),
      tlTrack: document.querySelector('[data-tl-track]'),
      tlBar: document.querySelector('[data-tl-bar]'),
      legA: document.querySelector('[data-leg-a]'),
      legB: document.querySelector('[data-leg-b]'),
      label: document.querySelector('[data-spine-label]'),
      wave: document.querySelector('[data-wave]'),
      timer: document.querySelector('[data-call-timer]'),
      sections: $$('section[data-screen-label]')
    };
    let lastCount = '';
    let lastLabel = '';
    let lastT = '';
    const t0 = Date.now();

    const tick = (loop) => {
      const c = cache;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - vh;
      const p = docH > 0 ? clamp(y / docH, 0, 1) : 0;
      root.style.setProperty('--om-p-pct', (p * 100).toFixed(2) + '%');
      root.style.setProperty('--om-rider-rot', (Math.sin(y / 90) * 7).toFixed(2) + 'deg');

      if (c.numSec) {
        const r = c.numSec.getBoundingClientRect();
        const span = Math.max(1, r.height - vh);
        const local = clamp(-r.top / span, 0, 1);
        const n = c.numPanels.length || 1;
        c.numPanels.forEach((panel, i) => {
          let d = local * n - (i + 0.5);
          if (i === 0 && d < 0) d = 0;
          if (i === n - 1 && d > 0) d = 0;
          const o = clamp((0.62 - Math.abs(d)) / 0.24, 0, 1);
          panel.style.opacity = o.toFixed(3);
          panel.style.transform = 'translate3d(0,' + (d * -70).toFixed(1) + 'px,0) scale(' + (0.94 + o * 0.06).toFixed(3) + ')';
        });
        if (c.numBar) c.numBar.style.width = (local * 100).toFixed(1) + '%';
        if (c.numCount) {
          const t = '0' + Math.min(n, Math.floor(local * n) + 1) + ' / 0' + n;
          if (t !== lastCount) { c.numCount.textContent = t; lastCount = t; }
        }
      }

      if (c.tlSec && c.tlTrack) {
        const r = c.tlSec.getBoundingClientRect();
        const span = Math.max(1, r.height - vh);
        const local = clamp(-r.top / span, 0, 1);
        const dist = Math.max(0, c.tlTrack.scrollWidth - window.innerWidth);
        root.style.setProperty('--om-tlx', (-local * dist).toFixed(1) + 'px');
        root.style.setProperty('--om-riderx', (local * dist + window.innerWidth * 0.3).toFixed(1) + 'px');
        if (c.tlBar) c.tlBar.style.width = (local * 100).toFixed(1) + '%';
        const swing = Math.sin(local * dist / 26);
        if (c.legA && c.legB) {
          c.legA.setAttribute('d', 'M30 64 L' + (30 - 18 * swing).toFixed(1) + ' 98');
          c.legB.setAttribute('d', 'M30 64 L' + (30 + 18 * swing).toFixed(1) + ' 98');
        }
      }

      let cur = '';
      c.sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) cur = s.getAttribute('data-screen-label') || '';
      });
      if (cur && cur !== lastLabel && c.label) { c.label.textContent = cur; lastLabel = cur; }

      if (c.timer) {
        const s = Math.floor((Date.now() - t0) / 1000);
        const t = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
        if (t !== lastT) { c.timer.textContent = t; lastT = t; }
      }
      if (c.wave) {
        const now = Date.now() / 1000;
        const amp = typing ? 34 : 5;
        let d = 'M0 60';
        for (let i = 1; i <= 120; i++) {
          const x = i * 10;
          const env = typing ? (0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + now * 9))) : 1;
          const yv = 60 + Math.sin(i * 0.55 + now * 4.2) * amp * env * (0.4 + 0.6 * Math.sin(i * 0.13 + now));
          d += ' L' + x + ' ' + yv.toFixed(1);
        }
        c.wave.setAttribute('d', d);
      }

      if (!primed) {
        primed = true;
        startType();
        reveals.forEach((n) => {
          if (n.getBoundingClientRect().top > vh * 0.9) prime(n);
          else { n.setAttribute('data-revealed', '1'); show(n); }
        });
      }
      reveals.forEach((n) => {
        if (n.getAttribute('data-revealed') === '1') return;
        const r = n.getBoundingClientRect();
        if (r.top < vh * 0.88) {
          n.setAttribute('data-revealed', '1');
          const delay = parseInt(n.getAttribute('data-delay') || '0', 10);
          setTimeout(() => show(n), delay);
        }
      });

      if (ring && fine && !reduce) {
        mouse.rx += (mouse.x - mouse.rx) * 0.18;
        mouse.ry += (mouse.y - mouse.ry) * 0.18;
        ring.style.transform = 'translate3d(' + mouse.rx.toFixed(1) + 'px,' + mouse.ry.toFixed(1) + 'px,0)';
      }
      if (loop) requestAnimationFrame(() => tick(true));
    };

    if (reduce) {
      reveals.forEach(show);
      tick(false);
      return;
    }

    const nudge = () => tick(false);
    window.addEventListener('scroll', nudge, { passive: true });
    window.addEventListener('resize', nudge, { passive: true });
    setInterval(nudge, 250);
    tick(false);
    requestAnimationFrame(() => tick(true));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
