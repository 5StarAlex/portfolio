const navTabs = document.querySelectorAll('.nav-tabs a');
const parallaxLayers = document.querySelectorAll('.parallax-layer');
const cursorHalo = document.querySelector('.cursor-halo');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    if (cursorHalo) {
      cursorHalo.style.setProperty('--cursor-x', `${pointer.x.toFixed(2)}px`);
      cursorHalo.style.setProperty('--cursor-y', `${pointer.y.toFixed(2)}px`);
    }

    requestAnimationFrame(animateBackground);
  }

  animateBackground();
}
