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

const serviceTriggers = document.querySelectorAll('.service-card__trigger');
if (serviceTriggers.length && typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function') {
  document.documentElement.classList.add('dialog-ready');

  for (const trigger of serviceTriggers) {
    const dialog = document.getElementById(trigger.getAttribute('aria-controls'));
    const closeButton = dialog?.querySelector('.service-dialog__close');
    if (!dialog || !closeButton) continue;

    trigger.addEventListener('click', () => {
      if (isMenuOpen()) setMenuOpen(false);
      dialog.showModal();
      document.documentElement.classList.add('service-dialog-open');
      closeButton.focus();
    });

    closeButton.addEventListener('click', () => dialog.close());

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('service-dialog-open');
      trigger.focus();
    });
  }
}
