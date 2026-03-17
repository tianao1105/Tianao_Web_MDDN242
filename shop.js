// ════════════════════════════════════════
// SHOP SCENE
// ════════════════════════════════════════

const shopOverlay  = document.getElementById('shop-overlay');
const shopOpenBtn  = document.getElementById('shop-open');
const shopCloseBtn = document.getElementById('shop-close');

shopOpenBtn.addEventListener('click', e => {
  e.preventDefault();
  shopOverlay.classList.add('open');
});

shopCloseBtn.addEventListener('click', () => {
  shopOverlay.classList.remove('open');
});

shopOverlay.addEventListener('click', e => {
  if (e.target === shopOverlay) shopOverlay.classList.remove('open');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') shopOverlay.classList.remove('open');
});
