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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  for (const trigger of serviceTriggers) {
    const dialog = document.getElementById(trigger.getAttribute('aria-controls'));
    const closeButton = dialog?.querySelector('.service-dialog__close');
    if (!dialog || !closeButton) continue;

    let closing = false;
    let closeTimeout;

    function clearClosingState() {
      window.clearTimeout(closeTimeout);
      closeTimeout = undefined;
      dialog.removeEventListener('animationend', handleExitAnimation);
      reducedMotion.removeEventListener('change', handleMotionChange);
      dialog.classList.remove('is-closing');
      closing = false;
    }

    function finishClose() {
      clearClosingState();
      if (dialog.open) dialog.close();
    }

    function handleExitAnimation(event) {
      if (event.target === dialog && event.animationName === 'service-dialog-out') {
        finishClose();
      }
    }

    function handleMotionChange() {
      if (reducedMotion.matches) finishClose();
    }

    function requestClose() {
      if (!dialog.open || closing) return;
      if (reducedMotion.matches) {
        finishClose();
        return;
      }

      closing = true;
      dialog.addEventListener('animationend', handleExitAnimation);
      reducedMotion.addEventListener('change', handleMotionChange);
      dialog.classList.add('is-closing');
      // Complete the 180 ms exit even if CSS is unavailable or its event is interrupted.
      closeTimeout = window.setTimeout(finishClose, 280);
    }

    trigger.addEventListener('click', () => {
      if (dialog.open) return;
      clearClosingState();
      if (isMenuOpen()) setMenuOpen(false);
      dialog.showModal();
      document.documentElement.classList.add('service-dialog-open');
      closeButton.focus();
    });

    closeButton.addEventListener('click', requestClose);

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) requestClose();
    });

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      requestClose();
    });

    dialog.addEventListener('close', () => {
      clearClosingState();
      if (!document.querySelector('.service-dialog[open]')) {
        document.documentElement.classList.remove('service-dialog-open');
      }
      trigger.focus();
    });
  }
}

const sweepCards = document.querySelectorAll('.service-card, .blog-card');
if (sweepCards.length) {
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cardMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let sweepEnabled = false;

  function setSweepOrigin(card, clientX) {
    const bounds = card.getBoundingClientRect();
    const side = clientX < bounds.left + bounds.width / 2 ? 'left' : 'right';
    card.style.setProperty('--card-sweep-origin', `${side} center`);
  }

  function enterCard(event) {
    if (event.pointerType !== 'mouse') return;
    const card = event.currentTarget;
    setSweepOrigin(card, event.clientX);
    card.classList.add('is-pointer-over');
  }

  function leaveCard(event) {
    if (event.pointerType !== 'mouse') return;
    const card = event.currentTarget;
    setSweepOrigin(card, event.clientX);
    card.classList.remove('is-pointer-over');
  }

  function resetCardSweeps() {
    for (const card of sweepCards) {
      card.classList.remove('is-pointer-over');
      card.style.removeProperty('--card-sweep-origin');
    }
  }

  function syncCardSweeps() {
    const enabled = fineHover.matches && !cardMotionPreference.matches;
    if (enabled === sweepEnabled) return;
    sweepEnabled = enabled;
    const action = enabled ? 'addEventListener' : 'removeEventListener';
    for (const card of sweepCards) {
      card[action]('pointerenter', enterCard);
      card[action]('pointerleave', leaveCard);
      card[action]('pointercancel', resetCardSweeps);
    }
    if (!enabled) resetCardSweeps();
  }

  fineHover.addEventListener('change', syncCardSweeps);
  cardMotionPreference.addEventListener('change', syncCardSweeps);
  window.addEventListener('blur', resetCardSweeps);
  syncCardSweeps();
}
