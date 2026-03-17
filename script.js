// ════════════════════════════════════════
// 图片资源 — 修改路径即可换图
// ════════════════════════════════════════
const PLAYER_IMG = new Image();
PLAYER_IMG.src = 'images/人物.png';

const COIN_IMG = new Image();
COIN_IMG.src = 'images/coin_gif.gif';

const FLY_IMG = [new Image(), new Image()];
FLY_IMG[0].src = 'images/fly-1.png';
FLY_IMG[1].src = 'images/fly-2.png';

const DRAG_IMG = new Image();
DRAG_IMG.src = 'images/drag-1.png';

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
  feetY:         0.75,  // 脚部在精灵图中的位置比例（0=顶部, 1=底部）
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
  const w = window.innerWidth;
  const h = window.innerHeight;
  // 缓冲区与 CSS 显示尺寸同时设置，保证 1:1，不产生拉伸
  canvas.width        = w;
  canvas.height       = h;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
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
    const pad = type === 'toggle' ? 8 : type === 'shop-platform' ? 0 : CONFIG.platformPad;
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
  document.querySelectorAll('.side-nav a').forEach(el => {
  pushEl(el, 'nav-link');
});
pushEl(document.getElementById('game-toggle'), 'toggle');

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

  // 商店页面自定义平台
  document.querySelectorAll('.shop-platform').forEach(el => {
    pushEl(el, 'shop-platform');
  });

  // 兜底地板
    platforms.push({
    el: null, type: 'floor',
    docX: -500,
    docY: window.scrollY + window.innerHeight - 40, /* ← 视口底部往上40px */
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

// 每帧同步所有平台的文档坐标（支持窗口缩放 / 滚动实时更新）
function refreshFixedPlatforms() {
  platforms.forEach(p => {
    if (!p.el) {
      // 兜底地板跟随视口底部和宽度
      if (p.type === 'floor') {
        p.docX = -500;
        p.docY = window.scrollY + window.innerHeight - 40;
        p.w    = window.innerWidth + 1000;
      }
      return;
    }
    const r   = p.el.getBoundingClientRect();
    const pad = p.type === 'toggle' ? 8 : p.type === 'shop-platform' ? 0 : CONFIG.platformPad;
    p.docX = r.left + pad;
    p.w    = r.width - pad * 2;
    // card-bottom 取元素底边，其余取顶边
    p.docY = p.type === 'card-bottom'
      ? r.bottom + window.scrollY
      : r.top    + window.scrollY;
  });

  // 花朵跟随平台实时移动
  coins.forEach(c => {
    if (c.collected) return;
    const p = platforms[c.platIdx];
    if (!p) return;
    c.docX = p.docX + c.relX;
    c.docY = p.docY + c.relY;
  });
}


function placePlayer() {
  const ul = platforms.find(p => p.type === 'underline');
  const sp = platforms.find(p => p.type === 'shop-platform');
  if (ul) {
    player.docX = ul.docX + ul.w / 2 - player.w / 2;
    player.docY = ul.docY - player.h;
  } else if (sp) {
    player.docX = sp.docX + 20;   // left end of the road
    player.docY = sp.docY - player.h;
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

  // 视口四周边界约束（窗口缩小时也会把玩家推回可见区域）
  const boundLeft   = window.scrollX;
  const boundRight  = window.scrollX + window.innerWidth  - player.w;
  const boundTop    = window.scrollY;
  const boundBottom = window.scrollY + window.innerHeight - player.h;
  if (player.docX < boundLeft)   { player.docX = boundLeft;   if (player.vx < 0) player.vx = 0; }
  if (player.docX > boundRight)  { player.docX = boundRight;  if (player.vx > 0) player.vx = 0; }
  if (player.docY < boundTop)    { player.docY = boundTop;    if (player.vy < 0) player.vy = 0; }
  if (player.docY > boundBottom) { player.docY = boundBottom; if (player.vy > 0) player.vy = 0; player.onGround = true; }

  // 走路动画
  if (player.onGround && Math.abs(player.vx) > 0.5) {
    player.walkTimer++;
    if (player.walkTimer > 8) player.walkTimer = 0;
  } else {
    player.walkTimer = 0;
  }

  // 彩虹尾巴 (shop item)
  if (window._shopRainbow) {
    rainbowTrail.push({ x: player.docX + player.w / 2, y: player.docY + player.h / 2, life: 1 });
    if (rainbowTrail.length > 40) rainbowTrail.shift();
  }

  // 收集花朵
  for (const c of coins) {
    if (c.collected) continue;
    if (Math.abs(player.docX + player.w / 2 - c.docX) < c.r + 14 &&
        Math.abs(player.docY + player.h / 2 - c.docY) < c.r + 16) {
      c.collected = true;
      collectedCount++;        // ← 新增
      updateCoinHUD();         // ← 新增
      spawnParticles(c.docX - window.scrollX, c.docY - window.scrollY, 10, '#ff4444');
    }
  }

  // 下落花朵物理 + 收集
  for (const c of fallingCoins) {
    if (c.collected) continue;
    // 落地后不再受重力，锁定位置
    if (c.landed) {
      c.vy = 0;
      c.vx = 0;
    } else {
      // 重力加速
      c.vy = Math.min(c.vy + 0.12, 6);
      c.docX += c.vx;
      c.docY += c.vy;
      // 平台碰撞检测
      for (const p of platforms) {
        if (p.type === 'card-bottom') continue;
        const surf        = p.docY;
        const cBottom     = c.docY + c.r;
        const cBottomPrev = cBottom - c.vy;
        const horizOverlap = c.docX > p.docX && c.docX < p.docX + p.w;
        if (horizOverlap && cBottom >= surf && cBottomPrev <= surf + 10 && c.vy >= 0) {
          c.docY   = surf - c.r;
          c.vy     = 0;
          c.vx     = 0;
          c.landed = true;
          break;
        }
      }
    }
    // 收集检测
    if (Math.abs(player.docX + player.w / 2 - c.docX) < c.r + 14 &&
        Math.abs(player.docY + player.h / 2 - c.docY) < c.r + 16) {
      c.collected = true;
      collectedCount++;
      updateCoinHUD();
      spawnParticles(c.docX - window.scrollX, c.docY - window.scrollY, 10, '#ff4444');
    }
    // 落出页面底部自动移除
    if (c.docY > window.scrollY + window.innerHeight + 100) c.collected = true;
  }
  fallingCoins = fallingCoins.filter(c => !c.collected);

  // 底部 reset
  if (player.docY > window.scrollY + window.innerHeight + 200) {
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
// 下落花朵
// ════════════════════════════════════════
let fallingCoins = [];
let collectedCount = parseInt(localStorage.getItem('coinCount') || '0', 10);
let rainbowTrail = [];

function updateCoinHUD() {
  localStorage.setItem('coinCount', collectedCount);
  const hud = document.getElementById('coin-hud');
  if (!hud) return;
  hud.innerHTML = `
    <img src="images/coin_gif.gif"
         style="width:28px;height:28px;image-rendering:pixelated;flex-shrink:0;" />
    <span id="coin-count">×${collectedCount}</span>
  `;
}

function spawnFallingCoin() {
  if (!gameActive) return;
  // 随机 X 在页面宽度内，Y 从视口上方开始（文档坐标）
  const docX = window.scrollX + Math.random() * window.innerWidth;
  const docY = window.scrollY - 60; // 从视口上方飞入
  fallingCoins.push({
    docX, docY,
    vy:  1 + Math.random() * 2,     // 下落速度
    vx: (Math.random() - 0.5) * 1.5, // 轻微左右漂移
    r:   11,
    bob: Math.random() * Math.PI * 2,
    collected: false,
  });
}

// ════════════════════════════════════════
// DRAW
// ════════════════════════════════════════
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameActive) return;
  const sy = window.scrollY, sx = window.scrollX;
  drawRainbowTrail(sy, sx);
  drawCoins(sy, sx);
  drawFallingCoins(sy, sx);
  drawPlayer(sy, sx);
  drawParticles();
}

function drawRainbowTrail(sy, sx) {
  if (!window._shopRainbow || rainbowTrail.length === 0) return;
  const hueStep = 360 / rainbowTrail.length;
  rainbowTrail.forEach((pt, i) => {
    pt.life -= 0.03;
    if (pt.life <= 0) return;
    const radius = 6 * pt.life;
    ctx.save();
    ctx.globalAlpha = pt.life * 0.7;
    ctx.beginPath();
    ctx.arc(pt.x - sx, pt.y - sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(hueStep * i + frameCount * 3) % 360}, 100%, 60%)`;
    ctx.fill();
    ctx.restore();
  });
  // remove dead particles
  for (let i = rainbowTrail.length - 1; i >= 0; i--) {
    if (rainbowTrail[i].life <= 0) rainbowTrail.splice(i, 1);
  }
}

function drawCoins(sy, sx) {
  coins.forEach(c => {
    if (c.collected) return;
    const vx = c.docX - sx;
    const vy = c.docY - sy;
    if (vy < -40 || vy > canvas.height + 40) return;
    const bob   = Math.sin(frameCount * 0.06 + c.bob) * 4;
    const size  = c.r * CONFIG.coinSize;
    const spinX = Math.cos(frameCount * 0.08 + c.bob); // X轴缩放模拟硬币自旋
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(vx, vy + bob);
    ctx.scale(spinX, 1);
    ctx.drawImage(COIN_IMG, -size / 2, -size / 2, size, size);
    ctx.restore();
  });
}

function drawFallingCoins(sy, sx) {
  fallingCoins.forEach(c => {
    if (c.collected) return;
    const vx = c.docX - sx;
    const vy = c.docY - sy;
    if (vy < -60 || vy > canvas.height + 60) return;
    const size = c.r * CONFIG.coinSize;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // 轻微旋转让下落更生动
    ctx.translate(vx, vy);
    ctx.rotate(Math.sin(frameCount * 0.05 + c.bob) * 0.3);
    ctx.drawImage(COIN_IMG, -size / 2, -size / 2, size, size);
    ctx.restore();
  });
}

function drawPlayer(sy, sx) {
  const blink = player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0;
  if (blink) return;
  const vx = player.docX - sx;
  const vy = player.docY - sy;
  const cx = vx + player.w / 2;
  const cy = vy + player.h;       // anchor at hitbox bottom (feet)
  const rw = player.w * CONFIG.playerScale;
  const rh = player.h * CONFIG.playerScale;
  const flyFrame = Math.floor(frameCount / 8) % 2;
  const img = dragging ? DRAG_IMG : (player.flying ? FLY_IMG[flyFrame] : PLAYER_IMG);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, cy);
  if (player.facing === -1) ctx.scale(-1, 1);
  if (Math.abs(player.vx) > 1 && player.onGround) ctx.rotate(player.vx * 0.008);
  ctx.drawImage(img, -rw / 2, -CONFIG.feetY * rh, rw, rh); // anchor visual feet to ground
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
document.getElementById('spawn-coin').addEventListener('click', spawnFallingCoin);
document.getElementById('myButton').addEventListener('click', () => {
  if (!gameActive) alert('Button clicked');
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
    // collectPlatforms 重新计算花朵在新卡片宽度下的 relX，不重置玩家位置
    if (gameActive) collectPlatforms();
  }, 150);
});

resizeCanvas();