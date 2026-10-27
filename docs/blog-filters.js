(() => {
  const listing = document.querySelector('[data-blog-filtering]');
  if (!listing) return;

  const filters = listing.querySelector('[data-blog-filters]');
  const status = listing.querySelector('[data-filter-status]');
  const buttons = [...listing.querySelectorAll('[data-topic-filter]')];
  const cards = [...listing.querySelectorAll('[data-blog-articles] > [data-topic]')];
  if (!filters || !status || !buttons.length || !cards.length) return;

  const topics = new Set(buttons.map((button) => button.dataset.topicFilter));
  const featuredCard = cards.find((card) => card.classList.contains('blog-card--featured'));
  let selectedTopic = 'todos';

  function applyFilter(topic) {
    selectedTopic = topics.has(topic) ? topic : 'todos';
    let visibleCount = 0;

    for (const card of cards) {
      const visible = selectedTopic === 'todos' || card.dataset.topic === selectedTopic;
      card.hidden = !visible;
      card.classList.toggle('blog-card--featured', selectedTopic === 'todos' && card === featuredCard);
      if (visible) visibleCount += 1;
    }

    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.topicFilter === selectedTopic));
    }

    const selectedButton = buttons.find((button) => button.dataset.topicFilter === selectedTopic);
    const label = selectedButton.querySelector('span').textContent;
    const articleLabel = visibleCount === 1 ? 'artigo' : 'artigos';
    status.textContent = selectedTopic === 'todos'
      ? `${visibleCount} ${articleLabel} para explorar.`
      : `${visibleCount} ${articleLabel} sobre ${label}.`;
  }

  function readTopicFromUrl() {
    return new URL(window.location.href).searchParams.get('tema') || 'todos';
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-topic-filter]');
    if (!button || !filters.contains(button) || button.dataset.topicFilter === selectedTopic) return;

    const topic = button.dataset.topicFilter;
    applyFilter(topic);
    const url = new URL(window.location.href);
    if (topic === 'todos') url.searchParams.delete('tema');
    else url.searchParams.set('tema', topic);
    window.history.pushState(null, '', url);
  });

  window.addEventListener('popstate', () => applyFilter(readTopicFromUrl()));
  applyFilter(readTopicFromUrl());
  filters.hidden = false;
})();
