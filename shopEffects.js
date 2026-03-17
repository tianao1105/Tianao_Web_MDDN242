// ════════════════════════════════════════
// SHOP EFFECTS  — runs on every page
// Reads localStorage and applies purchased item effects globally.
// ════════════════════════════════════════
(function () {

  // ── Resolve base URL so image paths work from any sub-directory ──────
  const _scripts = document.getElementsByTagName('script');
  let _base = '';
  for (let i = _scripts.length - 1; i >= 0; i--) {
    if (_scripts[i].src && _scripts[i].src.includes('shopEffects.js')) {
      _base = _scripts[i].src.replace('shopEffects.js', '');
      break;
    }
  }

  // ── Inject shared CSS ─────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* ── Shared effect overlay layer ── */
    .shop-effect {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 500;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.6s;
    }
    .shop-effect.active { opacity: 1; }

    /* Rain */
    .rain-drop {
      position: absolute;
      width: 2px;
      background: linear-gradient(to bottom, transparent, rgba(110, 160, 255, 0.85));
      border-radius: 0 0 3px 3px;
      animation: rainFall linear infinite;
      top: -40px;
    }
    @keyframes rainFall {
      to { transform: translateY(110vh); }
    }

    /* Grass */
    .grass-tuft {
      position: absolute;
      font-size: 18px;
      transform-origin: bottom center;
      animation: grassSway 1.6s ease-in-out infinite alternate;
    }
    @keyframes grassSway {
      from { transform: rotate(-12deg); }
      to   { transform: rotate(12deg); }
    }

    /* Coffee diagonal grid — sits just above page bg, below all content */
    #effect-coffee { z-index: 1; }

    /* Lift only the normal-flow content containers above the coffee layer.
       Everything else (footer, nav, canvas) already has position+z-index. */
    header, #main-content {
      position: relative;
      z-index: 2;
    }
    #coffee-grid {
      position: absolute;
      top: -120px; left: -120px;
      display: flex;
      flex-wrap: wrap;
      animation: coffeeDiag 5s linear infinite;
    }
    @keyframes coffeeDiag {
      from { transform: translate(0, 0); }
      to   { transform: translate(120px, 120px); }
    }
    .coffee-cup {
      opacity: 0.18;
      width: 120px; height: 120px;
      display: flex; align-items: center; justify-content: center;
      transform: rotate(-30deg);
      flex-shrink: 0;
    }
    .coffee-cup img {
      width: 80px; height: 80px;
      image-rendering: pixelated;
      display: block;
    }
  `;
  document.head.appendChild(style);

  // ── Ensure effect DOM elements exist (create if absent) ───────────────
  function ensureEffectDivs() {
    if (!document.getElementById('effect-rain')) {
      const el = document.createElement('div');
      el.id = 'effect-rain';
      el.className = 'shop-effect';
      document.body.appendChild(el);
    }
    if (!document.getElementById('effect-grass')) {
      const el = document.createElement('div');
      el.id = 'effect-grass';
      el.className = 'shop-effect';
      document.body.appendChild(el);
    }
    if (!document.getElementById('effect-coffee')) {
      const outer = document.createElement('div');
      outer.id = 'effect-coffee';
      outer.className = 'shop-effect';
      const grid = document.createElement('div');
      grid.id = 'coffee-grid';
      outer.appendChild(grid);
      document.body.appendChild(outer);
    }
  }

  // ── Build effect contents (lazy, only once) ───────────────────────────
  let effectsBuilt = false;
  function buildEffects() {
    if (effectsBuilt) return;
    effectsBuilt = true;
    ensureEffectDivs();

    // Rain drops
    const rainEl = document.getElementById('effect-rain');
    for (let i = 0; i < 70; i++) {
      const d = document.createElement('div');
      d.className = 'rain-drop';
      d.style.left              = (Math.random() * 110) + 'vw';
      d.style.height            = (14 + Math.random() * 18) + 'px';
      d.style.animationDuration = (0.5 + Math.random() * 0.7) + 's';
      d.style.animationDelay    = (-Math.random() * 2) + 's';
      d.style.opacity           = String(0.4 + Math.random() * 0.5);
      rainEl.appendChild(d);
    }

    // Grass tufts — scattered across the side-nav links (using item_2.png)
    const grassEl  = document.getElementById('effect-grass');
    const navLinks = document.querySelectorAll('.side-nav a, .side-nav-logo, .side-nav button');

    function makeGrassImg(size) {
      const img = document.createElement('img');
      img.src = _base + 'images/item_2.png';
      img.alt = '';
      img.style.cssText = `width:${size}px;height:${size}px;image-rendering:pixelated;display:block;`;
      return img;
    }

    // random size: small 8px up to large 48px, weighted towards mid-range
    function randSize() {
      const v = Math.random();
      return Math.round(8 + v * v * 40); // skewed: more small, occasional large
    }

    function spawnNavGrass(rect) {
      const count = 2 + Math.floor(Math.random() * 4); // 2–5 per element
      for (let i = 0; i < count; i++) {
        const g = document.createElement('div');
        g.className = 'grass-tuft';
        const size = randSize();
        g.appendChild(makeGrassImg(size));
        g.style.left  = (rect.left + Math.random() * rect.width)  + 'px';
        g.style.top   = (rect.bottom - size + Math.random() * 12) + 'px';
        g.style.animationDelay    = (-Math.random() * 2) + 's';
        g.style.animationDuration = (0.8 + Math.random() * 1.8)   + 's';
        grassEl.appendChild(g);
      }
    }

    navLinks.forEach(el => spawnNavGrass(el.getBoundingClientRect()));

    // Fill remaining nav background strip
    const navEl = document.querySelector('.side-nav');
    if (navEl) {
      const nr = navEl.getBoundingClientRect();
      for (let y = nr.top + 20; y < nr.bottom; y += 30 + Math.random() * 40) {
        const g = document.createElement('div');
        g.className = 'grass-tuft';
        const size = randSize();
        g.appendChild(makeGrassImg(size));
        g.style.left  = (nr.left + Math.random() * nr.width) + 'px';
        g.style.top   = y + 'px';
        g.style.opacity = String(0.4 + Math.random() * 0.5);
        g.style.animationDelay    = (-Math.random() * 2) + 's';
        g.style.animationDuration = (0.8 + Math.random() * 1.8) + 's';
        grassEl.appendChild(g);
      }
    }

    // Coffee grid (item_3.png tiles)
    const grid = document.getElementById('coffee-grid');
    const cols = Math.ceil(window.innerWidth  / 120) + 3;
    const rows = Math.ceil(window.innerHeight / 120) + 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cup = document.createElement('div');
        cup.className = 'coffee-cup';
        const img = document.createElement('img');
        img.src = _base + 'images/item_3.png';
        img.alt = '';
        cup.appendChild(img);
        grid.appendChild(cup);
      }
      const br = document.createElement('div');
      br.style.cssText = 'flex-basis:100%;height:0';
      grid.appendChild(br);
    }
    grid.style.width = (cols * 120) + 'px';
  }

  const EFFECT_IDS = ['effect-rain', 'effect-grass', 'effect-coffee'];

  function activateEffect(idx) {
    buildEffects();
    const el = document.getElementById(EFFECT_IDS[idx]);
    if (el) el.classList.add('active');
  }

  // ── Read localStorage and apply all purchased effects ─────────────────
  function applyPurchased() {
    const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
    Object.keys(purchases).forEach(idx => {
      if (purchases[idx]) activateEffect(parseInt(idx, 10));
    });
  }

  // ── Public API (used by shop.html purchase logic) ─────────────────────
  window.SHOP_EFFECTS = {
    buildEffects,
    activateEffect,
    applyPurchased,
    /** Mark item as purchased, save to localStorage, activate effect. */
    buy(idx) {
      const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
      purchases[idx] = true;
      localStorage.setItem('shopPurchases', JSON.stringify(purchases));
      activateEffect(idx);
    },
    /** Returns true if item idx has already been purchased. */
    has(idx) {
      const purchases = JSON.parse(localStorage.getItem('shopPurchases') || '{}');
      return !!purchases[idx];
    },
  };

  // Apply on page load (after DOM is ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPurchased);
  } else {
    applyPurchased();
  }

})();
