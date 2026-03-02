// ════════════════════════════════════════
// 图片资源 — 修改路径即可换图
// ════════════════════════════════════════
const PLAYER_IMG = new Image();
PLAYER_IMG.src = 'images/人物.png';

const COIN_IMG = new Image();
COIN_IMG.src = 'images/花.png';

const FLY_IMG = [new Image(), new Image()];
FLY_IMG[0].src = 'images/fly-1.png';
FLY_IMG[1].src = 'images/fly-2.png';

// ════════════════════════════════════════
// 游戏参数 — 在这里调数值
// ════════════════════════════════════════
const CONFIG = {
  playerSpeed:   4.2,   // 移动速度（越大越快）
  jumpForce:    -8,      // 跳跃力（越小跳越高，注意是负数）
  gravity:       0.35,  // 重力（越大下落越快）
  flyGravity:    0.08,  // 飞行时的重力
  flyMaxUp:     -4,     // 飞行上升最大速度
  playerScale:   1.8,   // 人物渲染倍数（越大人物越大）
  coinSize:      3.2,   // 花朵渲染倍数
  platformPad:   28,    // 平台两侧缩短的像素
};

// ════════════════════════════════════════
// 画布 & 状态
// ════════════════════════════════════════
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

let gameActive = false;
let keys = {};
let platforms = [], coins = [], particles = [];
let frameId = null, frameCount = 0;

const CHAR_W = 32, CHAR_H = 40;
const player = {
  docX: 0, docY: 0,
  w: CHAR_W, h: CHAR_H,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  flying: false,
  invincible: 0,
  walkTimer: 0,
};

let dragging = false;
let dragOffX = 0, dragOffY = 0;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ════════════════════════════════════════
// 平台初始化（游戏开始时调用一次）
// ════════════════════════════════════════
function collectPlatforms() {
  platforms = [];
  coins     = [];

  function pushEl(el, type) {
    if (!el) return;
    const r   = el.getBoundingClientRect();
    const cs  = getComputedStyle(el);
    const bt  = parseFloat(cs.borderTopWidth) || 2;
    const pad = type === 'toggle' ? 8 : CONFIG.platformPad;
    platforms.push({
      el, type,
      docX: r.left + pad,
      docY: r.top + window.scrollY,
      w:    r.width - pad * 2,
      h:    bt + 2,
    });
  }

  // ── 平台来源（添加新元素只需在这里 pushEl）──
  pushEl(document.getElementById('underline-el'), 'underline');

  document.querySelectorAll('.work-media').forEach(el => {
    pushEl(el, 'card');
    // 卡片底边
    const r   = el.getBoundingClientRect();
    const cs  = getComputedStyle(el);
    const bb  = parseFloat(cs.borderBottomWidth) || 1.5;
    const pad = CONFIG.platformPad;
    platforms.push({
      el, type: 'card-bottom',
      docX: r.left + pad,
      docY: r.bottom + window.scrollY,
      w:    r.width - pad * 2,
      h:    bb + 2,
    });
  });

  pushEl(document.getElementById('myButton'),    'button');
  pushEl(document.getElementById('game-toggle'), 'toggle');

  // 兜底地板
  platforms.push({
    el: null, type: 'floor',
    docX: -500,
    docY: document.body.scrollHeight + 100,
    w:    window.innerWidth + 1000,
    h:    4,
  });

  // ── 花朵（自动分布在各平台上方）──
  platforms.forEach((p, idx) => {
    if (p.type === 'floor' || p.type === 'toggle' || p.type === 'card-bottom') return;
    const count = p.type === 'card' ? 3 : (p.type === 'button' ? 2 : 1);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      coins.push({
        platIdx: idx,
        relX:    p.w * (0.15 + t * 0.7),
        relY:    -36,
        docX:    p.docX + p.w * (0.15 + t * 0.7),
        docY:    p.docY - 36,
        r: 11, collected: false,
        bob: Math.random() * Math.PI * 2,
      });
    }
  });
}

// fixed 元素每帧同步文档坐标
function refreshFixedPlatforms() {
  platforms.forEach(p => {
    if (p.type !== 'toggle' || !p.el) return;
    const r = p.el.getBoundingClientRect();
    p.docX = r.left + 8;
    p.docY = r.top + window.scrollY;
    p.w    = r.width - 16;
  });
}

function placePlayer() {
  const ul = platforms.find(p => p.type === 'underline');
  if (ul) {
    player.docX = ul.docX + ul.w / 2 - player.w / 2;
    player.docY = ul.docY - player.h;
  } else {
    player.docX = 80;
    player.docY = 200;
  }
  player.vx = 0; player.vy = 0;
  player.onGround = false;
  player.invincible = 0;
}

// ════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════
function update() {
  frameCount++;
  refreshFixedPlatforms();
  if (player.invincible > 0) player.invincible--;
  if (dragging) return;

  const { playerSpeed: spd, jumpForce: jumpV, gravity: grav,
          flyGravity, flyMaxUp } = CONFIG;

  const flying = keys[' '] && !player.onGround;
  player.flying = flying;

  // 横向移动
  if      (keys['ArrowLeft']  || keys['a']) { player.vx = -spd; player.facing = -1; }
  else if (keys['ArrowRight'] || keys['d']) { player.vx =  spd; player.facing =  1; }
  else                                       { player.vx *= 0.75; }

  // 跳跃
  if ((keys['ArrowUp'] || keys[' '] || keys['w']) && player.onGround) {
    player.vy = jumpV;
    player.onGround = false;
    spawnParticles(
      player.docX - window.scrollX + player.w / 2,
      player.docY - window.scrollY + player.h,
      5, 'rgba(179,252,245,0.9)'
    );
  }

  // 飞行
  if (flying) {
    player.vy = Math.max(player.vy - 1.2, flyMaxUp);
    if (frameCount % 3 === 0) {
      spawnParticles(
        player.docX - window.scrollX + player.w / 2,
        player.docY - window.scrollY + player.h,
        1, 'rgba(179,252,245,0.7)'
      );
    }
  }

  // 下跳
  const dropDown = (keys['ArrowDown'] || keys['s']) && player.onGround;
  if (dropDown) {
    player.docY += 8;
    player.onGround = false;
    player.vy = 2;
  }

  // 重力
  const effectiveGrav = flying ? flyGravity : grav;
  player.vy = Math.min(player.vy + effectiveGrav, 18);
  player.docX += player.vx;
  player.docY += player.vy;
  player.onGround = false;

  // 碰撞检测
  if (!dropDown) {
    for (const p of platforms) {
      const surf        = p.docY;
      const pBottom     = player.docY + player.h;
      const pBottomPrev = pBottom - player.vy;
      const horizOverlap =
        player.docX + player.w - 2 > p.docX &&
        player.docX + 2             < p.docX + p.w;
      if (horizOverlap && pBottom >= surf && pBottomPrev <= surf + 6 && player.vy >= 0) {
        player.docY     = surf - player.h;
        player.vy       = 0;
        player.onGround = true;
      }
    }
  }

  // 走路动画
  if (player.onGround && Math.abs(player.vx) > 0.5) {
    player.walkTimer++;
    if (player.walkTimer > 8) player.walkTimer = 0;
  } else {
    player.walkTimer = 0;
  }

  // 收集花朵
  for (const c of coins) {
    if (c.collected) continue;
    if (Math.abs(player.docX + player.w / 2 - c.docX) < c.r + 14 &&
        Math.abs(player.docY + player.h / 2 - c.docY) < c.r + 16) {
      c.collected = true;
      spawnParticles(c.docX - window.scrollX, c.docY - window.scrollY, 10, '#ff4444');
    }
  }

  // 底部 reset
  if (player.docY > document.body.scrollHeight + 150) {
    spawnParticles(
      player.docX - window.scrollX + player.w / 2,
      player.docY - window.scrollY,
      14, '#b3fcf5'
    );
    placePlayer();
    player.invincible = 60;
  }

  // 粒子
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; });
  particles = particles.filter(p => p.life > 0);
}

function spawnParticles(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a  = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 3.5;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 2.5,
      life: 18 + Math.random() * 14,
      color, size: 2 + Math.random() * 3,
    });
  }
}

// ════════════════════════════════════════
// DRAW
// ════════════════════════════════════════
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameActive) return;
  const sy = window.scrollY, sx = window.scrollX;
  drawCoins(sy, sx);
  drawPlayer(sy, sx);
  drawParticles();
}

function drawCoins(sy, sx) {
  coins.forEach(c => {
    if (c.collected) return;
    const vx = c.docX - sx;
    const vy = c.docY - sy;
    if (vy < -40 || vy > canvas.height + 40) return;
    const bob  = Math.sin(frameCount * 0.06 + c.bob) * 4;
    const size = c.r * CONFIG.coinSize;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(COIN_IMG, vx - size / 2, vy + bob - size / 2, size, size);
    ctx.restore();
  });
}

function drawPlayer(sy, sx) {
  const blink = player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0;
  if (blink) return;
  const vx = player.docX - sx;
  const vy = player.docY - sy;
  const cx = vx + player.w / 2;
  const cy = vy + player.h / 2;
  const rw = player.w * CONFIG.playerScale;
  const rh = player.h * CONFIG.playerScale;
  const flyFrame = Math.floor(frameCount / 8) % 2;
  const img = player.flying ? FLY_IMG[flyFrame] : PLAYER_IMG;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, cy);
  if (player.facing === -1) ctx.scale(-1, 1);
  if (Math.abs(player.vx) > 1 && player.onGround) ctx.rotate(player.vx * 0.008);
  ctx.drawImage(img, -rw / 2, -rh / 2, rw, rh);
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 32);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.restore();
  });
}

// ════════════════════════════════════════
// 游戏循环
// ════════════════════════════════════════
function gameLoop() {
  update();
  draw();
  frameId = requestAnimationFrame(gameLoop);
}

// ════════════════════════════════════════
// 开始 / 退出
// ════════════════════════════════════════
const toggleBtn = document.getElementById('game-toggle');
const hint      = document.getElementById('controls-hint');

toggleBtn.addEventListener('click', () => {
  if (!gameActive) {
    gameActive = true;
    resizeCanvas();
    collectPlatforms();
    placePlayer();
    canvas.style.pointerEvents = 'auto';
    document.body.classList.add('game-active');
    toggleBtn.textContent = '■ EXIT';
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 3500);
    gameLoop();
  } else {
    gameActive = false;
    dragging   = false;
    cancelAnimationFrame(frameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.pointerEvents = 'none';
    document.body.classList.remove('game-active', 'dragging');
    hint.classList.remove('show');
    toggleBtn.textContent = '▶ PLAY';
  }
});

// ════════════════════════════════════════
// 拖拽角色
// ════════════════════════════════════════
function isOverPlayer(clientX, clientY) {
  const px = player.docX - window.scrollX;
  const py = player.docY - window.scrollY;
  const rw = (player.w * CONFIG.playerScale) / 2;
  const rh = (player.h * CONFIG.playerScale) / 2;
  const cx = px + player.w / 2;
  const cy = py + player.h / 2;
  return clientX >= cx - rw && clientX <= cx + rw &&
         clientY >= cy - rh && clientY <= cy + rh;
}

canvas.addEventListener('mousedown', e => {
  if (!gameActive) return;
  if (isOverPlayer(e.clientX, e.clientY)) {
    dragging = true;
    dragOffX = e.clientX - (player.docX - window.scrollX);
    dragOffY = e.clientY - (player.docY - window.scrollY);
    player.vx = 0; player.vy = 0;
    document.body.classList.add('dragging');
  }
});

window.addEventListener('mousemove', e => {
  if (!gameActive || !dragging) return;
  player.docX = e.clientX - dragOffX + window.scrollX;
  player.docY = e.clientY - dragOffY + window.scrollY;
  player.vx = 0; player.vy = 0;
  player.onGround = false;
});

window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  document.body.classList.remove('dragging');
  player.vy = -2;
});

// ════════════════════════════════════════
// 键盘输入
// ════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (!gameActive) return;
  keys[e.key] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ════════════════════════════════════════
// 移动端触摸
// ════════════════════════════════════════
let touchStartX = 0;
document.addEventListener('touchstart', e => {
  if (!gameActive) return;
  touchStartX = e.touches[0].clientX;
  keys[' '] = true;
  setTimeout(() => { keys[' '] = false; }, 80);
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!gameActive) return;
  const dx = e.touches[0].clientX - touchStartX;
  keys['ArrowLeft']  = dx < -25;
  keys['ArrowRight'] = dx >  25;
}, { passive: true });
document.addEventListener('touchend', () => {
  keys['ArrowLeft'] = keys['ArrowRight'] = false;
});

// ════════════════════════════════════════
// 其他
// ════════════════════════════════════════
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('myButton').addEventListener('click', () => {
  if (!gameActive) alert('Button clicked');
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
    if (gameActive) { collectPlatforms(); placePlayer(); }
  }, 150);
});

resizeCanvas();