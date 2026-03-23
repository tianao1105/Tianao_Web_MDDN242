(function () {
  'use strict';

  const KEY      = 'aokey-bg';
  const DEFAULT  = { h: 134, s: 73, l: 31, a: 0.67 };
  const RESET_R  = 10;   // px radius of the reset button (on 160px canvas)
  // reset button sits in the bottom-right corner, just outside the colour circle
  const RESET_X  = 148;
  const RESET_Y  = 148;

  let state = loadState();
  applyImmediate();   // apply before DOMContentLoaded to avoid flash

  /* ── helpers ─────────────────────────── */

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s.h === 'number') return s;
    } catch (_) {}
    return Object.assign({}, DEFAULT);
  }

  function toHsla(s) {
    return 'hsla(' + Math.round(s.h) + ',' + Math.round(s.s) + '%,' +
           Math.round(s.l) + '%,' + s.a.toFixed(2) + ')';
  }

  function applyImmediate() {
    document.documentElement.style.setProperty('--bg', toHsla(state));
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [
      Math.round(f(p, q, h + 1 / 3) * 255),
      Math.round(f(p, q, h) * 255),
      Math.round(f(p, q, h - 1 / 3) * 255)
    ];
  }

  /* ── canvas rendering ────────────────── */

  function renderWheel(canvas, showDot, showReset) {
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const cx   = W / 2, cy = W / 2;
    const maxR = W / 2 - 1;
    const img  = ctx.createImageData(W, W);
    const d    = img.data;

    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR) continue;
        const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
        const sat = (dist / maxR) * 100;
        const [r, g, b] = hslToRgb(hue, sat, state.l);
        const i = (y * W + x) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // anti-aliased circular mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // selection dot
    if (showDot) {
      const angle = state.h * Math.PI / 180;
      const dist  = (state.s / 100) * maxR;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const dotR = Math.max(1.5, W / 52);

      ctx.beginPath();
      ctx.arc(px, py, dotR + 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }

    // reset button — bottom-right corner, outside the colour circle
    if (showReset) {
      const rx = RESET_X, ry = RESET_Y, r = RESET_R;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,243,255,0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(21,38,122,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold ' + Math.round(r * 1.3) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(21,38,122,0.7)';
      ctx.fillText('↺', rx, ry + 1);
    }
  }

  /* ── UI ──────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {

    /* thumbnail */
    const thumb = document.createElement('canvas');
    thumb.id     = 'cw-thumb';
    thumb.width  = 48;
    thumb.height = 48;
    thumb.setAttribute('aria-label', 'Background colour picker');
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    document.body.appendChild(thumb);

    /* popup — no separate reset button */
    const popup = document.createElement('div');
    popup.id = 'color-wheel-popup';
    popup.innerHTML =
      '<canvas id="cw-canvas" width="160" height="160"></canvas>' +
      '<div class="cw-row">' +
        '<label class="cw-label" for="cw-l">Lightness</label>' +
        '<input class="cw-range" type="range" id="cw-l" min="5" max="95" step="1">' +
      '</div>' +
      '<div class="cw-row">' +
        '<label class="cw-label" for="cw-a">Opacity</label>' +
        '<input class="cw-range" type="range" id="cw-a" min="0" max="100" step="1">' +
      '</div>';
    document.body.appendChild(popup);

    const canvas  = popup.querySelector('#cw-canvas');
    const lSlider = popup.querySelector('#cw-l');
    const aSlider = popup.querySelector('#cw-a');

    function syncSliders() {
      lSlider.value = Math.round(state.l);
      aSlider.value = Math.round(state.a * 100);
    }

    function refresh() {
      renderWheel(canvas, true, true);
      renderWheel(thumb,  true, false);
      applyImmediate();
      save();
    }

    syncSliders();
    refresh();

    /* open / close */
    function openPopup() {
      popup.classList.add('open');
      thumb.classList.add('cw-hidden');
      thumb.setAttribute('aria-expanded', 'true');
    }
    function closePopup() {
      popup.classList.remove('open');
      thumb.classList.remove('cw-hidden');
      thumb.setAttribute('aria-expanded', 'false');
    }
    function togglePopup(e) {
      e.stopPropagation();
      popup.classList.contains('open') ? closePopup() : openPopup();
    }

    thumb.addEventListener('click', togglePopup);
    thumb.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') togglePopup(e);
    });
    document.addEventListener('click', function (e) {
      if (popup.classList.contains('open') &&
          !popup.contains(e.target) && e.target !== thumb) {
        closePopup();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('open')) closePopup();
    });

    /* wheel interaction */
    function handleCanvasClick(clientX, clientY) {
      const rect  = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;   // canvas px per CSS px
      // click position in canvas coordinates
      const cx    = canvas.width  / 2;
      const cy    = canvas.height / 2;
      const maxR  = canvas.width  / 2 - 1;
      const px    = (clientX - rect.left) * scale;
      const py    = (clientY - rect.top)  * scale;

      // check reset zone (bottom-right corner button)
      if (Math.hypot(px - RESET_X, py - RESET_Y) <= RESET_R) {
        state = Object.assign({}, DEFAULT);
        syncSliders();
        refresh();
        return;
      }

      // normal colour pick
      const dx = px - cx, dy = py - cy;
      const dist = Math.min(Math.hypot(dx, dy), maxR);
      state.h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
      state.s = (dist / maxR) * 100;
      refresh();
    }

    let dragging = false;
    canvas.addEventListener('mousedown',   function (e) { dragging = true;  handleCanvasClick(e.clientX, e.clientY); });
    document.addEventListener('mousemove', function (e) { if (dragging) handleCanvasClick(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   function ()  { dragging = false; });

    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); handleCanvasClick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove',  function (e) { e.preventDefault(); handleCanvasClick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

    /* sliders */
    lSlider.addEventListener('input', function () { state.l = +this.value; refresh(); });
    aSlider.addEventListener('input', function () { state.a = this.value / 100; refresh(); });

    /* ── colour-wheel proximity hint ───────────── */
    var cwHint = document.createElement('div');
    cwHint.id = 'cw-proximity-hint';
    cwHint.style.cssText =
      'position:fixed;z-index:20000;pointer-events:none;' +
      'background:rgba(13,27,62,0.92);border:1.5px solid rgba(200,184,122,0.7);' +
      'border-radius:6px;padding:7px 14px;' +
      'font-family:\'Pixelify Sans\',sans-serif;font-size:13px;' +
      'color:#ffd966;letter-spacing:0.06em;white-space:nowrap;' +
      'transform:translateX(-50%) translateY(-100%);margin-top:-12px;' +
      'opacity:0;transition:opacity 0.15s;';
    document.body.appendChild(cwHint);
    cwHint.textContent = 'Pick your favorite color~';

    function cwHintLoop() {
      /* player / gameActive are const/let globals in script.js — not on window */
      try {
        if (typeof gameActive === 'undefined' || !gameActive) {
          cwHint.style.opacity = '0';
          requestAnimationFrame(cwHintLoop);
          return;
        }
        var r   = thumb.getBoundingClientRect();
        var rcx = r.left + r.width  / 2;
        var rcy = r.top  + r.height / 2;
        var px  = player.docX - window.scrollX + player.w / 2;
        var py  = player.docY - window.scrollY + player.h / 2;
        var dist = Math.hypot(px - rcx, py - rcy);
        if (dist < 80) {
          cwHint.style.left    = rcx + 'px';
          cwHint.style.top     = r.top + 'px';
          cwHint.style.opacity = '1';
        } else {
          cwHint.style.opacity = '0';
        }
      } catch (_) {
        cwHint.style.opacity = '0';
      }
      requestAnimationFrame(cwHintLoop);
    }
    cwHintLoop();
  });
})();
