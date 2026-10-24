document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
const header = document.querySelector('.site-header');
const mobileViewport = window.matchMedia('(max-width: 52rem)');

function isMenuOpen() {
  return navigation.dataset.open === 'true';
}

function setMenuOpen(open, returnFocus = false) {
  navigation.dataset.open = String(open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');

  if (open) {
    navigation.querySelector('a')?.focus();
  } else if (returnFocus) {
    menuButton.focus();
  }
}

menuButton.addEventListener('click', () => {
  setMenuOpen(!isMenuOpen());
});

navigation.addEventListener('click', (event) => {
  if (mobileViewport.matches && event.target.closest('a')) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isMenuOpen()) {
    setMenuOpen(false, true);
  }
});

document.addEventListener('click', (event) => {
  if (mobileViewport.matches && isMenuOpen() && !header.contains(event.target)) {
    setMenuOpen(false);
  }
});

mobileViewport.addEventListener('change', () => {
  if (!mobileViewport.matches && isMenuOpen()) {
    setMenuOpen(false);
  }
});
