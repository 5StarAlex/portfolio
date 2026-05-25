const navTabs = document.querySelectorAll('.nav-tabs a');
const parallaxLayers = document.querySelectorAll('.parallax-layer');
const titleName = document.querySelector('.title-name');
const heroTitle = document.querySelector('.title');
const cursorHalo = document.querySelector('.cursor-halo');
const themeToggle = document.querySelector('[data-theme-toggle]');
const heroPortrait = document.querySelector('.hero-right img');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeStates = [
  { name: 'gold', bodyClass: '', image: 'assests/character.png' },
  { name: 'blue', bodyClass: 'theme-blue', image: 'assests/character2.png' },
  { name: 'red', bodyClass: 'theme-red', image: 'assests/character3.png' },
  { name: 'green', bodyClass: 'theme-green', image: 'assests/character4.png' },
  { name: 'white', bodyClass: 'theme-white', image: 'assests/character5.png' },
];
let themeIndex = 0;
let portraitSwapTimeout = null;

themeStates.forEach((state) => {
  const image = new Image();
  image.src = state.image;
});

function setActiveTab(tab) {
  navTabs.forEach((link) => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });

  tab.classList.add('active');
  tab.setAttribute('aria-current', 'page');
}

navTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveTab(tab));
});

function animateSectionArrival(target, direction) {
  if (reduceMotion || !target?.classList.contains('section-shell')) {
    return;
  }

  target.classList.remove('section-arriving', 'from-forward', 'from-back');
  void target.offsetWidth;
  target.classList.add('section-arriving', direction > 0 ? 'from-forward' : 'from-back');

  window.setTimeout(() => {
    target.classList.remove('section-arriving', 'from-forward', 'from-back');
  }, 760);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');

    if (!hash || hash === '#') {
      return;
    }

    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    event.preventDefault();

    const direction = target.getBoundingClientRect().top >= 0 ? 1 : -1;
    const offset = document.querySelector('.topbar')?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;

    window.scrollTo({
      top,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });

    animateSectionArrival(target, direction);
    history.pushState(null, '', hash);
  });
});

function applyThemeState(state) {
  document.body.classList.remove('theme-blue', 'theme-red', 'theme-green', 'theme-white');
  if (state.bodyClass) {
    document.body.classList.add(state.bodyClass);
  }

  if (heroPortrait) {
    if (portraitSwapTimeout) {
      window.clearTimeout(portraitSwapTimeout);
    }

    heroPortrait.style.opacity = '0';
    portraitSwapTimeout = window.setTimeout(() => {
      heroPortrait.src = state.image;
      heroPortrait.style.opacity = '1';
      portraitSwapTimeout = null;
    }, 140);
  }
}

themeToggle?.addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % themeStates.length;
  themeToggle.classList.add('is-bursting');
  applyThemeState(themeStates[themeIndex]);
  themeToggle.focus({ preventScroll: true });
  window.setTimeout(() => themeToggle.classList.remove('is-bursting'), 650);
});

if (!reduceMotion) {
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  function animateBackground() {
    const centerX = pointer.x - window.innerWidth / 2;
    const centerY = pointer.y - window.innerHeight / 2;

    parallaxLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 12);
      layer.style.setProperty('--mx', `${(-centerX / depth).toFixed(2)}px`);
      layer.style.setProperty('--my', `${(-centerY / depth).toFixed(2)}px`);
    });

    if (titleName) {
      titleName.style.setProperty('--text-mx', `${(-centerX / 90).toFixed(2)}px`);
      titleName.style.setProperty('--text-my', `${(-centerY / 120).toFixed(2)}px`);
    }

    if (heroTitle) {
      heroTitle.style.setProperty('--title-mx', `${(-centerX / 120).toFixed(2)}px`);
      heroTitle.style.setProperty('--title-my', `${(-centerY / 150).toFixed(2)}px`);
    }

    if (cursorHalo) {
      cursorHalo.style.setProperty('--cursor-x', `${pointer.x.toFixed(2)}px`);
      cursorHalo.style.setProperty('--cursor-y', `${pointer.y.toFixed(2)}px`);
    }

    requestAnimationFrame(animateBackground);
  }

  animateBackground();
}

(() => {
  const PARTICLE_SPEED = 18;
  const PLAYER_SIZE = 8;
  const ABILITY_CHARGE_SECONDS = 15;
  const COIN_AWARD_SECONDS = 5;
  const ATTACK_PIXEL_COUNT = 24;
  const ATTACK_SPEED = 150;
  const ATTACK_LIFE_SECONDS = 0.4;

  const speedToPixelsPerSecond = (speed) => 6 + Math.min(Math.max(speed, 1), 100) * 3;
  const randomSpawnDelay = () => 120 + Math.random() * 280;
  const isFrozen = (phase) => phase === 'intro' || phase === 'countdown';
  const formatElapsedTime = (seconds) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  class SlopTopGame {
    constructor(root) {
      this.root = root;
      this.marquee = root.querySelector('.slop-game-marquee');
      this.track = root.querySelector('[data-track]');
      this.coinsEl = root.querySelector('[data-coins]');
      this.nextId = 0;
      this.trail = [];
      this.driftPixels = [];
      this.attackPixels = [];
      this.phase = 'idle';
      this.overlayText = null;
      this.elapsedSeconds = 0;
      this.timerFlash = false;
      this.abilityReady = false;
      this.cursor = null;
      this.spawnTimeout = null;
      this.frame = null;
      this.lastFrameTime = null;
      this.gameTimeouts = [];
      this.coinInterval = null;
      this.abilityTimeout = null;
      this.gameStartTime = null;
      this.coins = Number(root.dataset.startingCoins || 0);
      this.runner = root.querySelector('.slop-runner');
      this.playLimit = Number(this.marquee.dataset.playLimit || 1);

      this.renderCoins();
      this.bind();
      this.startLoop();
    }

    bind() {
      this.marquee.addEventListener('mouseenter', () => {
        if (this.phase === 'idle') this.startGame();
      });

      this.marquee.addEventListener('mousemove', (event) => this.handlePointerMove(event.clientX, event.clientY));
      this.marquee.addEventListener(
        'touchmove',
        (event) => {
          const touch = event.touches[0];
          if (touch) this.handlePointerMove(touch.clientX, touch.clientY);
        },
        { passive: true },
      );
      this.marquee.addEventListener('mouseleave', () => this.reset());
      this.marquee.addEventListener('click', () => this.fireAbility());
    }

    handlePointerMove(clientX, clientY) {
      const rect = this.marquee.getBoundingClientRect();
      const playableWidth = rect.width * this.playLimit;
      const x = clientX - rect.left;

      if (x > playableWidth) {
        this.cursor = null;
        this.trail = [];
        this.renderTransient();
        return;
      }

      const point = {
        id: this.nextId++,
        x,
        y: clientY - rect.top,
      };

      this.cursor = { x: point.x, y: point.y };
      this.trail = [...this.trail.slice(-8), point];
      this.renderTransient();
    }

    startGame() {
      this.clearTimers();
      this.elapsedSeconds = 0;
      this.timerFlash = false;
      this.abilityReady = false;
      this.trail = [];
      this.driftPixels = [];
      this.attackPixels = [];
      this.gameStartTime = null;
      this.marquee.classList.remove('is-playing');
      this.phase = 'intro';
      this.setOverlay('GAME START');

      this.schedule(1000, () => {
        this.phase = 'countdown';
        this.setOverlay('3');
      });
      this.schedule(1800, () => this.setOverlay('2'));
      this.schedule(2600, () => this.setOverlay('1'));
      this.schedule(3400, () => this.continueGame());
    }

    continueGame() {
      this.overlayText = null;
      this.phase = 'playing';
      this.marquee.classList.add('is-playing');
      this.gameStartTime = performance.now();
      this.abilityReady = false;
      this.startCoinAwards();
      this.armAbility();
      this.renderTransient();
    }

    reset() {
      this.clearTimers();
      this.trail = [];
      this.attackPixels = [];
      this.cursor = null;
      this.phase = 'idle';
      this.marquee.classList.remove('is-playing');
      this.overlayText = null;
      this.elapsedSeconds = 0;
      this.timerFlash = false;
      this.abilityReady = false;
      this.gameStartTime = null;
      this.renderTransient();
    }

    schedule(delay, callback) {
      const timeout = window.setTimeout(callback, delay);
      this.gameTimeouts.push(timeout);
    }

    clearTimers() {
      this.gameTimeouts.forEach((timeout) => window.clearTimeout(timeout));
      this.gameTimeouts = [];
      if (this.coinInterval) window.clearInterval(this.coinInterval);
      if (this.abilityTimeout) window.clearTimeout(this.abilityTimeout);
      this.coinInterval = null;
      this.abilityTimeout = null;
    }

    startCoinAwards() {
      if (this.coinInterval) window.clearInterval(this.coinInterval);
      this.coinInterval = window.setInterval(() => {
        this.coins += 5;
        this.renderCoins();
        this.flashTimer();
      }, COIN_AWARD_SECONDS * 1000);
    }

    armAbility() {
      if (this.abilityTimeout) window.clearTimeout(this.abilityTimeout);
      this.abilityTimeout = window.setTimeout(() => {
        this.abilityReady = true;
        this.abilityTimeout = null;
        this.renderTransient();
      }, ABILITY_CHARGE_SECONDS * 1000);
    }

    flashTimer() {
      this.timerFlash = true;
      this.renderTransient();
      this.schedule(500, () => {
        this.timerFlash = false;
        this.renderTransient();
      });
    }

    fireAbility() {
      if (this.phase !== 'playing' || !this.abilityReady || !this.cursor) return;

      this.attackPixels = Array.from({ length: ATTACK_PIXEL_COUNT }, (_, index) => {
        const angle = (Math.PI * 2 * index) / ATTACK_PIXEL_COUNT;
        return {
          id: this.nextId++,
          x: this.cursor.x,
          y: this.cursor.y,
          vx: Math.cos(angle) * ATTACK_SPEED,
          vy: Math.sin(angle) * ATTACK_SPEED,
          size: 8,
          life: ATTACK_LIFE_SECONDS,
        };
      });

      this.abilityReady = false;
      this.armAbility();
      this.renderTransient();
    }

    setOverlay(text) {
      this.overlayText = text;
      this.renderTransient();
    }

    renderCoins() {
      this.coinsEl.textContent = `Coins: ${this.coins}`;
    }

    startLoop() {
      const spawnPixel = () => {
        if (this.phase !== 'playing') {
          this.spawnTimeout = window.setTimeout(spawnPixel, randomSpawnDelay());
          return;
        }

        const bounds = this.marquee.getBoundingClientRect();
        const playableWidth = bounds.width * this.playLimit;
        const pixelSize = 5 + Math.floor(Math.random() * 4);
        const topPadding = 4;
        const maxY = Math.max(topPadding, bounds.height - pixelSize - topPadding);

        this.driftPixels.push({
          id: this.nextId++,
          x: playableWidth + pixelSize,
          y: topPadding + Math.random() * (maxY - topPadding),
          size: pixelSize,
        });

        this.spawnTimeout = window.setTimeout(spawnPixel, randomSpawnDelay());
      };

      const step = (time) => {
        if (this.lastFrameTime == null) this.lastFrameTime = time;
        const deltaSeconds = (time - this.lastFrameTime) / 1000;
        this.lastFrameTime = time;
        const frozen = isFrozen(this.phase);
        const pixelsPerSecond = speedToPixelsPerSecond(PARTICLE_SPEED);

        if (!frozen) {
          this.attackPixels = this.attackPixels
            .map((pixel) => ({
              ...pixel,
              x: pixel.x + pixel.vx * deltaSeconds,
              y: pixel.y + pixel.vy * deltaSeconds,
              life: pixel.life - deltaSeconds,
            }))
            .filter((pixel) => pixel.life > 0);

          this.driftPixels = this.driftPixels
            .map((pixel) => ({ ...pixel, x: pixel.x - pixelsPerSecond * deltaSeconds }))
            .filter((pixel) => pixel.x + pixel.size > -12);
        }

        if (this.attackPixels.length > 0) {
          this.driftPixels = this.driftPixels.filter((pixel) => {
            return !this.attackPixels.some((attack) => {
              const dx = pixel.x + pixel.size / 2 - (attack.x + attack.size / 2);
              const dy = pixel.y + pixel.size / 2 - (attack.y + attack.size / 2);
              return Math.sqrt(dx * dx + dy * dy) <= attack.size + pixel.size;
            });
          });
        }

        if (this.phase === 'playing') {
          if (this.cursor) {
            const playerLeft = this.cursor.x - PLAYER_SIZE / 2;
            const playerTop = this.cursor.y - PLAYER_SIZE / 2;
            const playerRight = playerLeft + PLAYER_SIZE;
            const playerBottom = playerTop + PLAYER_SIZE;

            const hit = this.driftPixels.some((pixel) => {
              return !(playerRight < pixel.x || playerLeft > pixel.x + pixel.size || playerBottom < pixel.y || playerTop > pixel.y + pixel.size);
            });

            const runnerHit = this.hitsRunner(playerLeft, playerTop, playerRight, playerBottom);

            if (hit || runnerHit) {
              this.phase = 'gameover';
              this.marquee.classList.remove('is-playing');
              this.setOverlay('GAME OVER');
              this.gameStartTime = null;
              this.abilityReady = false;
              if (this.coinInterval) {
                window.clearInterval(this.coinInterval);
                this.coinInterval = null;
              }
              if (this.abilityTimeout) {
                window.clearTimeout(this.abilityTimeout);
                this.abilityTimeout = null;
              }
            }
          }

          if (this.gameStartTime != null) {
            this.elapsedSeconds = (time - this.gameStartTime) / 1000;
          }
        }

        this.renderTransient();
        this.frame = window.requestAnimationFrame(step);
      };

      this.spawnTimeout = window.setTimeout(spawnPixel, randomSpawnDelay());
      this.frame = window.requestAnimationFrame(step);
    }

    renderTransient() {
      this.track.querySelectorAll('[data-generated="pixel"], [data-generated="cursor"], [data-generated="attack"]').forEach((node) => node.remove());

      this.driftPixels.forEach((pixel) => {
        const node = document.createElement('span');
        node.className = 'slop-pixel';
        node.dataset.generated = 'pixel';
        node.style.left = `${pixel.x}px`;
        node.style.top = `${pixel.y}px`;
        node.style.width = `${pixel.size}px`;
        node.style.height = `${pixel.size}px`;
        this.track.appendChild(node);
      });

      this.trail.forEach((point, index) => {
        const node = document.createElement('span');
        node.className = `slop-cursor${index === this.trail.length - 1 && this.abilityReady ? ' is-ability' : ''}`;
        node.dataset.generated = 'cursor';
        node.style.left = `${point.x}px`;
        node.style.top = `${point.y}px`;
        node.style.opacity = String((index + 1) / this.trail.length);
        this.track.appendChild(node);
      });

      this.attackPixels.forEach((pixel) => {
        const node = document.createElement('span');
        node.className = 'slop-attack';
        node.dataset.generated = 'attack';
        node.style.left = `${pixel.x}px`;
        node.style.top = `${pixel.y}px`;
        node.style.width = `${pixel.size}px`;
        node.style.height = `${pixel.size}px`;
        this.track.appendChild(node);
      });

      if (this.overlayText) {
        let overlay = this.track.querySelector('[data-stable-overlay]');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'slop-overlay';
          overlay.dataset.stableOverlay = 'true';
          overlay.innerHTML = '<span></span>';
          this.track.appendChild(overlay);
        }
        overlay.querySelector('span').textContent = this.overlayText;
      } else {
        this.track.querySelector('[data-stable-overlay]')?.remove();
      }

      if (this.phase !== 'idle') {
        let hud = this.track.querySelector('[data-stable-hud]');
        if (!hud) {
          hud = document.createElement('div');
          hud.className = 'slop-hud';
          hud.dataset.stableHud = 'true';
          hud.innerHTML = '<div class="slop-timer"></div>';
          this.track.appendChild(hud);
        }
        const timer = hud.querySelector('.slop-timer');
        timer.className = `slop-timer is-visible${this.timerFlash ? ' is-flash' : ''}`;
        timer.textContent = `Time: ${formatElapsedTime(this.phase === 'playing' ? this.elapsedSeconds : 0)}`;
      } else {
        this.track.querySelector('[data-stable-hud]')?.remove();
      }
    }

    hitsRunner(playerLeft, playerTop, playerRight, playerBottom) {
      if (!this.runner) return false;
      const runnerRect = this.runner.getBoundingClientRect();
      const trackRect = this.marquee.getBoundingClientRect();
      const playableRight = trackRect.width * this.playLimit;

      if (runnerRect.right < trackRect.left || runnerRect.left > trackRect.right) {
        return false;
      }

      const runnerLeft = runnerRect.left - trackRect.left;
      const runnerTop = runnerRect.top - trackRect.top;
      const runnerRight = runnerRect.right - trackRect.left;
      const runnerBottom = runnerRect.bottom - trackRect.top;

      if (runnerLeft > playableRight) {
        return false;
      }

      return !(playerRight < runnerLeft || playerLeft > runnerRight || playerBottom < runnerTop || playerTop > runnerBottom);
    }
  }

  document.querySelectorAll('[data-slop-game]').forEach((root) => {
    if (!root.__slopTopGame) {
      root.__slopTopGame = new SlopTopGame(root);
    }
  });
})();
