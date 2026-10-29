export const siteUrl = 'https://marcosmieli9658-cell.github.io/mca-contabilidade-demo/';

const businessName = 'MCA Contabilidade & Assessoria';
const businessId = `${siteUrl}#business`;
const websiteId = `${siteUrl}#website`;
const blogUrl = `${siteUrl}blog/`;
const blogId = `${blogUrl}#blog`;
const previewStatus = 'Conteúdo de demonstração em avaliação; revisão técnica da MCA pendente.';
const ref = (id) => ({ '@id': id });

function business() {
  return {
    '@type': 'AccountingService', '@id': businessId,
    name: businessName, url: siteUrl,
    logo: `${siteUrl}assets/mca-logo.png`, telephone: '+5512991404535',
    hasMap: 'https://www.google.com/maps/search/?api=1&query=R.%20Narizinho%2C%20480%20-%20Jardim%20Guril%C3%A2ndia%2C%20Taubat%C3%A9%20-%20SP%2C%2012071-400',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua Narizinho Arrebitado, 480, Gurilândia',
      addressLocality: 'Taubaté', addressRegion: 'SP',
      postalCode: '12071-400', addressCountry: 'BR'
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        .map((day) => `https://schema.org/${day}`),
      opens: '08:30', closes: '17:30'
    }
  };
}

function website() {
  return {
    '@type': 'WebSite', '@id': websiteId, url: siteUrl,
    name: businessName, inLanguage: 'pt-BR', about: ref(businessId),
    creativeWorkStatus: 'Prévia para avaliação'
  };
}

function blog() {
  return {
    '@type': 'Blog', '@id': blogId, url: blogUrl, name: 'Blog MCA',
    description: 'Informação prática para MEIs e pequenos negócios. Artigos de demonstração que ainda passarão por revisão técnica da MCA.',
    inLanguage: 'pt-BR', isPartOf: ref(websiteId),
    creativeWorkStatus: previewStatus
  };
}

function postUrl(post) {
  if (!post || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
    throw new Error('Dados estruturados: artigo sem slug válido');
  }
  return `${blogUrl}${post.slug}/`;
}

function posting(post, full = false) {
  const url = postUrl(post);
  const article = {
    '@type': 'BlogPosting', '@id': `${url}#article`, url,
    headline: post.title, description: post.description,
    articleSection: post.category, inLanguage: 'pt-BR',
    isPartOf: ref(blogId),
    creativeWorkStatus: previewStatus
  };
  if (full) {
    article.mainEntityOfPage = ref(`${url}#webpage`);
    article.citation = post.sources.map((source) => ({
      '@type': 'CreativeWork', name: source.title, url: source.url
    }));
  }
  // The visible calendar date is retained in HTML. Google expects a full DateTime
  // here; omit dateModified rather than invent an editorial time or timezone.
  // No author, publication date, review or article image is asserted without evidence.
  return article;
}

function page({ url, name, description, type = 'WebPage', mainEntity }) {
  return {
    '@type': type, '@id': `${url}#webpage`, url, name, description,
    inLanguage: 'pt-BR', isPartOf: ref(websiteId), mainEntity,
    creativeWorkStatus: 'Prévia para avaliação'
  };
}

function breadcrumbs(post) {
  const url = postUrl(post);
  return {
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: blogUrl },
      { '@type': 'ListItem', position: 3, name: post.title, item: url }
    ]
  };
}

/** Render one JSON-LD graph from the same metadata used for the visible page. */
export function renderStructuredData({ type, post, posts = [] }) {
  const graph = [business(), website()];
  if (type === 'home') {
    graph.push(page({
      url: siteUrl, name: `Contabilidade em Taubaté | ${businessName}`,
      description: 'Contabilidade em Taubaté para cada etapa da sua empresa. Apoio para abrir sua empresa, organizar a rotina contábil e entender como tratar pendências.',
      mainEntity: ref(businessId)
    }));
  } else if (type === 'blog') {
    const collection = blog();
    collection.mainEntityOfPage = ref(`${blogUrl}#webpage`);
    collection.hasPart = posts.map((item) => ref(`${postUrl(item)}#article`));
    graph.push(page({
      url: blogUrl, name: 'Blog MCA', type: 'CollectionPage',
      description: 'Artigos práticos da prévia do blog MCA para MEIs e pequenos negócios.',
      mainEntity: ref(blogId)
    }), collection, ...posts.map((item) => posting(item)));
  } else if (type === 'post') {
    const url = postUrl(post);
    const articlePage = page({
      url, name: post.title, description: post.description,
      mainEntity: ref(`${url}#article`)
    });
    articlePage.breadcrumb = ref(`${url}#breadcrumb`);
    graph.push(blog(), articlePage, posting(post, true), breadcrumbs(post));
  } else {
    throw new Error(`Dados estruturados: tipo de página inválido: ${type}`);
  }

  // Escape HTML-sensitive characters so metadata can never close the script element.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/[<>&\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
