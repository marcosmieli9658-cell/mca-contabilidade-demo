(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const targets = [...document.querySelectorAll(
    '[data-scroll-reveal], [data-scroll-group] > *, [data-process-sequence] > li'
  )];
  if (!targets.length) return;

  function reveal(target, delay = 0, instantly = false) {
    if (instantly) target.classList.add('reveal-instant');
    target.style.setProperty('--reveal-delay', `${delay}ms`);
    target.classList.add('is-revealed');
    observer.unobserve(target);
  }

  const observer = new IntersectionObserver((entries) => {
    const groupPositions = new Map();
    entries.sort((first, second) => targets.indexOf(first.target) - targets.indexOf(second.target));

    for (const entry of entries) {
      const target = entry.target;
      if (target.classList.contains('is-revealed')) continue;
      if (!entry.isIntersecting) {
        if (entry.boundingClientRect.bottom <= 0) reveal(target, 0, true);
        continue;
      }

      const group = target.closest('[data-scroll-group], [data-process-sequence]');
      const position = groupPositions.get(group) || 0;
      const interval = group?.hasAttribute('data-process-sequence') ? 160 : 85;
      reveal(target, group ? Math.min(position, 2) * interval : 0);
      if (group) groupPositions.set(group, position + 1);
    }
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  for (const target of targets) {
    target.classList.add('scroll-reveal');
    observer.observe(target);
    if (target.contains(document.activeElement)) reveal(target, 0, true);
  }

  // Keyboard navigation must never land on content waiting for an entrance effect.
  document.addEventListener('focusin', (event) => {
    const target = event.target.closest('.scroll-reveal');
    if (target) reveal(target, 0, true);
  });

  motionPreference.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const target of targets) reveal(target, 0, true);
  });
})();
