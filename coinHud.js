(function () {
  // Create #coin-hud element if the page doesn't already have one
  function ensureHud() {
    if (!document.getElementById('coin-hud')) {
      const hud = document.createElement('div');
      hud.id = 'coin-hud';
      document.body.appendChild(hud);
    }
  }

  // Resolve image path for pages in sub-directories (e.g. about/)
  function imgBase() {
    return window.location.pathname.includes('/about/') ? '../' : '';
  }

  function render() {
    ensureHud();
    const hud   = document.getElementById('coin-hud');
    const count = parseInt(localStorage.getItem('coinCount') || '0', 10);
    hud.innerHTML =
      `<img src="${imgBase()}images/coin_gif.gif"
            style="width:28px;height:28px;image-rendering:pixelated;flex-shrink:0;" />
       <span id="coin-count">\u00d7${count}</span>`;
    if (count > 0) hud.classList.add('has-coins');
    else           hud.classList.remove('has-coins');
  }

  // Render on load, and re-render whenever another tab changes the count
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('storage', function (e) {
    if (e.key === 'coinCount') render();
  });

  // Expose so script.js / game.html can call it after updating localStorage
  window.renderCoinHud = render;
})();
