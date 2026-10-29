import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { renderStructuredData, siteUrl } from './structured-data.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(projectRoot, 'content');
const blogDir = path.join(projectRoot, 'docs', 'blog');
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: true });
const contactUrl = 'https://wa.me/5512991404535?text=Ol%C3%A1%21%20Conheci%20a%20MCA%20pelo%20site%20e%20gostaria%20de%20conversar%20sobre%20os%20servi%C3%A7os%20de%20contabilidade.';
const blogTopics = [
  { id: 'mei', label: 'MEI' },
  { id: 'gestao-financeira', label: 'Gestão financeira' },
  { id: 'comecar-negocio', label: 'Começar um negócio' }
];
const preferredOrder = [
  'fluxo-de-caixa-pequeno-negocio',
  'receita-despesas-lucro',
  'nota-fiscal-mei',
  'antes-de-abrir-empresa',
  'rotina-mensal-mei',
  'das-e-dasn-simei',
  'primeira-conversa-contabilidade'
];
const relatedOrder = {
  'fluxo-de-caixa-pequeno-negocio': ['receita-despesas-lucro', 'primeira-conversa-contabilidade'],
  'receita-despesas-lucro': ['fluxo-de-caixa-pequeno-negocio', 'primeira-conversa-contabilidade'],
  'nota-fiscal-mei': ['rotina-mensal-mei', 'das-e-dasn-simei'],
  'rotina-mensal-mei': ['nota-fiscal-mei', 'das-e-dasn-simei'],
  'das-e-dasn-simei': ['rotina-mensal-mei', 'nota-fiscal-mei'],
  'antes-de-abrir-empresa': ['primeira-conversa-contabilidade', 'fluxo-de-caixa-pequeno-negocio'],
  'primeira-conversa-contabilidade': ['antes-de-abrir-empresa', 'rotina-mensal-mei']
};
const topicInvites = {
  mei: {
    subject: 'MEI',
    title: 'Organize as dúvidas sobre a sua rotina como MEI.',
    description: 'Notas fiscais, registros de receitas e documentos do mês ajudam a preparar uma conversa com a MCA.',
    action: 'Conversar sobre meu MEI'
  },
  'gestao-financeira': {
    subject: 'organização financeira',
    title: 'Leve os números do seu negócio para a conversa.',
    description: 'Reúna seus registros de entradas, saídas e as dúvidas que surgiram durante a leitura.',
    action: 'Conversar com a MCA'
  },
  'comecar-negocio': {
    subject: 'abertura de empresa',
    title: 'Antes de abrir, organize as perguntas.',
    description: 'Atividade, endereço e documentos são um ponto de partida para conversar sobre o seu negócio com a MCA.',
    action: 'Conversar sobre meu negócio'
  }
};

const arrow = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function displayDate(isoDate) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function assertText(value, field, filename) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${filename}: campo ${field} ausente ou inválido`);
  }
  return value.trim();
}

function renderMarkdown(content, filename) {
  const tokens = markdown.parse(content, {});
  const headings = [];
  const usedIds = new Set();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'heading_open') continue;
    if (token.tag === 'h1') {
      throw new Error(`${filename}: use ## no corpo; o título do artigo já é o H1`);
    }
    const inline = tokens[index + 1];
    const label = inline.children
      ?.filter((child) => child.type === 'text' || child.type === 'code_inline')
      .map((child) => child.content).join('') || inline.content;
    const baseId = slugify(label) || 'secao';
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
    usedIds.add(id);
    token.attrSet('id', id);
    if (token.tag === 'h2') headings.push({ id, label });
  }

  return { body: markdown.renderer.render(tokens, markdown.options, {}), headings };
}

async function loadPosts() {
  const files = (await fs.readdir(contentDir)).filter((name) => name.endsWith('.md'));
  if (!files.length) throw new Error('Nenhum artigo encontrado em content/');

  const posts = [];
  for (const filename of files) {
    const slug = filename.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${filename}: nome inválido para URL`);
    }
    const source = await fs.readFile(path.join(contentDir, filename), 'utf8');
    const parsed = matter(source);
    const data = parsed.data;
    const title = assertText(data.title, 'title', filename);
    const description = assertText(data.description, 'description', filename);
    const category = assertText(data.category, 'category', filename);
    const topic = blogTopics.find((item) => item.label === category);
    if (!topic) {
      throw new Error(`${filename}: category deve ser ${blogTopics.map((item) => item.label).join(', ')}`);
    }
    const updated = assertText(data.updated, 'updated', filename);
    const readingTime = assertText(data.readingTime, 'readingTime', filename);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
      throw new Error(`${filename}: updated deve ser AAAA-MM-DD`);
    }
    if (!Array.isArray(data.sources) || !data.sources.length) {
      throw new Error(`${filename}: inclua ao menos uma fonte oficial`);
    }
    const sources = data.sources.map((sourceItem) => {
      const sourceTitle = assertText(sourceItem.title, 'sources.title', filename);
      const url = assertText(sourceItem.url, 'sources.url', filename);
      if (!url.startsWith('https://')) throw new Error(`${filename}: fontes devem usar HTTPS`);
      return { title: sourceTitle, url };
    });
    const rendered = renderMarkdown(parsed.content, filename);
    posts.push({ slug, title, description, category, topic: topic.id, updated, readingTime, sources, ...rendered });
  }

  posts.sort((first, second) => {
    const firstRank = preferredOrder.indexOf(first.slug);
    const secondRank = preferredOrder.indexOf(second.slug);
    if (firstRank >= 0 && secondRank >= 0) return firstRank - secondRank;
    if (firstRank >= 0) return -1;
    if (secondRank >= 0) return 1;
    return second.updated.localeCompare(first.updated) || first.title.localeCompare(second.title, 'pt-BR');
  });
  return posts;
}

function renderHeader(root) {
  return `
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <div class="preview-note" role="note"><span class="preview-note__dot" aria-hidden="true"></span><span>Prévia para avaliação</span></div>
    <div class="opening">
      <header class="site-header">
        <div class="container site-header__inner">
          <a class="brand" href="${root}" aria-label="MCA Contabilidade, voltar ao início">
            <img src="${root}assets/mca-logo.png" alt="MCA Contabilidade" width="240" height="116" />
          </a>
          <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-controls="primary-navigation" aria-expanded="false">
            <span class="menu-toggle__bar" aria-hidden="true"></span><span class="menu-toggle__bar" aria-hidden="true"></span><span class="menu-toggle__bar" aria-hidden="true"></span>
          </button>
          <nav class="site-nav" id="primary-navigation" aria-label="Navegação principal">
            <ul class="site-nav__links">
              <li><a href="${root}#servicos">Serviços</a></li>
              <li><a href="${root}#como-funciona">Como funciona</a></li>
              <li><a href="${root}blog/" aria-current="page">Blog</a></li>
              <li><a href="${root}#contato">Contato</a></li>
            </ul>
            <a class="button button--small button--nav" href="${contactUrl}">Fale com a MCA <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>
    </div>`;
}

function renderFooter(root) {
  return `
    <footer class="blog-site-footer">
      <div class="container blog-site-footer__inner">
        <div>
          <a class="brand" href="${root}" aria-label="MCA Contabilidade, voltar ao início">
            <img src="${root}assets/mca-logo.png" alt="MCA Contabilidade" width="240" height="116" loading="lazy" />
          </a>
          <p>Informação clara para o dia a dia do seu negócio.</p>
          <span class="blog-site-footer__preview">Prévia para avaliação</span>
        </div>
        <nav aria-label="Navegação do rodapé">
          <a href="${root}">Início</a>
          <a href="${root}blog/">Blog</a>
          <a href="${root}#servicos">Serviços</a>
          <a href="${root}#contato">Contato</a>
        </nav>
        <div class="blog-site-footer__contact">
          <span>Contato</span>
          <a href="tel:+5512991404535">(12) 99140-4535</a>
          <p>Rua Narizinho Arrebitado, 480<br />Gurilândia, Taubaté - SP</p>
        </div>
      </div>
    </footer>`;
}

function renderDocument({ title, description, root, main, filters = false, pagePath = 'blog/', article = false, structuredData }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#4D4946" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} | Blog MCA Contabilidade</title>
    <link rel="canonical" href="${siteUrl}${pagePath}" />
    <meta property="og:type" content="${article ? 'article' : 'website'}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="MCA Contabilidade &amp; Assessoria" />
    <meta property="og:title" content="${escapeHtml(title)} | Blog MCA — Prévia" />
    <meta property="og:description" content="${escapeHtml(description)} Conteúdo de demonstração para avaliação." />
    <meta property="og:url" content="${siteUrl}${pagePath}" />
    <meta property="og:image" content="${siteUrl}assets/mca-share-v1.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="MCA Contabilidade &amp; Assessoria. Contabilidade clara. Seu negócio em movimento. Proposta de site." />
    <link rel="icon" type="image/png" href="${root}assets/favicon.png" />
    ${renderStructuredData(structuredData)}
    <link rel="stylesheet" href="${root}styles.css?v=schema-1" />
    <link rel="stylesheet" href="${root}blog.css?v=schema-1" />
    <script src="${root}script.js?v=schema-1" defer></script>
    ${filters ? `<script src="${root}blog-filters.js?v=schema-1" defer></script>` : ''}
  </head>
  <body class="blog-page">
    ${renderHeader(root)}
    <main id="conteudo">${main}</main>
    ${renderFooter(root)}
  </body>
</html>
`.replace(/^[ \t]+$/gm, '');
}

function renderCard(post, href, { headingLevel = 2, featured = false, root = '../' } = {}) {
  return `<article class="blog-card${featured ? ' blog-card--featured' : ''}" data-topic="${post.topic}">
    <a class="blog-card__link" href="${href}">
      <span class="blog-card__cover"><img src="${root}assets/blog-${post.topic}.svg" width="720" height="480" alt="" loading="lazy" decoding="async" /></span>
      <div class="blog-card__body">
        <h${headingLevel}>${escapeHtml(post.title)}</h${headingLevel}>
        <p>${escapeHtml(post.description)}</p>
        <span class="blog-card__meta"><span class="blog-card__category">${escapeHtml(post.category)}</span><span>${escapeHtml(post.readingTime)} de leitura</span><time datetime="${post.updated}">${escapeHtml(displayDate(post.updated))}</time></span>
      </div>
      <span class="blog-card__arrow">${arrow}</span>
    </a>
  </article>`;
}

function renderHomeHighlights(home, posts) {
  const start = '<!-- BLOG_CARDS_START -->';
  const end = '<!-- BLOG_CARDS_END -->';
  if (home.split(start).length !== 2 || home.split(end).length !== 2 || home.indexOf(start) > home.indexOf(end)) {
    throw new Error('Marcadores dos destaques do blog ausentes ou duplicados em docs/index.html');
  }
  const eol = home.includes('\r\n') ? '\r\n' : '\n';
  const highlightTopics = new Set();
  const highlights = posts.filter((post) => {
    if (highlightTopics.has(post.topic)) return false;
    highlightTopics.add(post.topic);
    return true;
  }).slice(0, 3);
  const cards = highlights
    .map((post, index) => renderCard(post, `blog/${post.slug}/`, { headingLevel: 3, featured: index === 0, root: '' }))
    .join('\n')
    .split('\n').map((line) => `            ${line}`).join(eol);
  return home.replace(/<!-- BLOG_CARDS_START -->[\s\S]*?<!-- BLOG_CARDS_END -->/,
    `${start}${eol}${cards}${eol}            ${end}`);
}

function renderBlogIndex(posts) {
  const cards = posts.map((post, index) => renderCard(post, `${post.slug}/`, { featured: index === 0 })).join('\n');
  const filters = [{ id: 'todos', label: 'Todos' }, ...blogTopics].map((topic) => {
    const count = topic.id === 'todos' ? posts.length : posts.filter((post) => post.topic === topic.id).length;
    return `<button class="blog-filters__button" type="button" data-topic-filter="${topic.id}" aria-pressed="${topic.id === 'todos'}" aria-controls="blog-articles"><span>${escapeHtml(topic.label)}</span><span class="blog-filters__count" aria-hidden="true">${count}</span></button>`;
  }).join('\n');
  const main = `
    <section class="blog-hero" aria-labelledby="blog-title">
      <div class="container blog-hero__inner">
        <h1 id="blog-title">Blog MCA<span>.</span></h1>
        <p>Informação prática para MEIs e pequenos negócios.</p>
      </div>
    </section>
    <section class="blog-listing section" aria-labelledby="articles-title" data-blog-filtering>
      <div class="container">
        <div class="blog-listing__heading">
          <h2 id="articles-title">Explore por tema</h2>
          <p>Escolha uma dúvida do seu dia a dia.</p>
        </div>
        <div class="blog-filters" data-blog-filters hidden>
          <div class="blog-filters__options" role="group" aria-labelledby="articles-title">${filters}</div>
          <p class="blog-filters__status" data-filter-status role="status" aria-live="polite" aria-atomic="true">${posts.length} artigos para explorar.</p>
        </div>
        <p class="blog-listing__review">Artigos de demonstração preparados com fontes oficiais. O conteúdo ainda passará por revisão técnica da MCA.</p>
        <div class="blog-grid" id="blog-articles" data-blog-articles>${cards}</div>
      </div>
    </section>
    <section class="blog-invite" aria-labelledby="blog-invite-title">
      <div class="container blog-invite__inner">
        <div><h2 id="blog-invite-title">Uma dúvida sobre o seu negócio?</h2><p>Reúna suas informações e converse com a MCA.</p></div>
        <a class="button button--primary" href="../#contato">Converse com a MCA ${arrow}</a>
      </div>
    </section>`;
  return renderDocument({ title: 'Conteúdos para MEIs e pequenos negócios', description: 'Artigos práticos da prévia do blog MCA para MEIs e pequenos negócios.', root: '../', main, filters: true, structuredData: { type: 'blog', posts } });
}

function renderPost(post, posts) {
  const root = '../../';
  const toc = post.headings.length ? `<nav class="article-toc" aria-label="Nesta página">
    <strong>Neste artigo</strong><ol>${post.headings.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.label)}</a></li>`).join('')}</ol>
  </nav>` : '';
  const sources = post.sources.map((source, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a></li>`).join('');
  const priority = relatedOrder[post.slug] || [];
  const relatedPosts = priority.map((slug) => posts.find((candidate) => candidate.slug === slug)).filter(Boolean);
  for (const candidate of posts.filter((item) => item.topic === post.topic)) {
    if (candidate.slug !== post.slug && !relatedPosts.includes(candidate)) relatedPosts.push(candidate);
  }
  const related = relatedPosts.slice(0, 2)
    .map((candidate) => renderCard(candidate, `../${candidate.slug}/`, { headingLevel: 3, root })).join('\n');
  const invite = topicInvites[post.topic];
  const articleContactUrl = `https://wa.me/5512991404535?text=${encodeURIComponent(`Olá! Li um artigo do Blog MCA sobre ${invite.subject} e gostaria de conhecer o apoio para meu negócio.`)}`;
  const main = `
    <nav class="article-breadcrumb container" aria-label="Caminho de navegação">
      <a href="../../">Início</a><span aria-hidden="true">/</span><a href="../">Blog</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(post.title)}</span>
    </nav>
    <article>
      <header class="article-header">
        <div class="article-container">
          <h1>${escapeHtml(post.title)}</h1>
          <p class="article-header__description">${escapeHtml(post.description)}</p>
          <div class="article-header__meta"><span class="blog-card__category">${escapeHtml(post.category)}</span><time datetime="${post.updated}">Atualizado em ${escapeHtml(displayDate(post.updated))}</time><span aria-hidden="true">·</span><span>${escapeHtml(post.readingTime)} de leitura</span></div>
        </div>
      </header>
      <div class="article-container article-main">
        <div class="article-review"><p><strong>Conteúdo de demonstração.</strong> Este texto está em avaliação e será revisado tecnicamente pela MCA antes da versão definitiva.</p></div>
        ${toc}
        <div class="article-prose">${post.body}</div>
        <section class="article-sources" aria-labelledby="sources-title">
          <h2 id="sources-title">Fontes consultadas</h2>
          <ol>${sources}</ol>
          <p>Confira a situação e a data de vigência das orientações oficiais antes de aplicá-las ao seu caso.</p>
        </section>
        <section class="article-invite" aria-labelledby="article-invite-title">
          <h2 id="article-invite-title">${escapeHtml(invite.title)}</h2>
          <p>${escapeHtml(invite.description)}</p>
          <a class="button button--primary" href="${escapeHtml(articleContactUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(invite.action)} (abre o WhatsApp em nova aba)">${escapeHtml(invite.action)} ${arrow}</a>
        </section>
      </div>
    </article>
    <section class="article-related section" aria-labelledby="related-title">
      <div class="container">
        <div class="article-related__heading"><h2 id="related-title">Continue a leitura</h2><a href="../">Ver todos os artigos <span aria-hidden="true">↗</span></a></div>
        <div class="blog-grid">${related}</div>
      </div>
    </section>`;
  return renderDocument({ title: post.title, description: post.description, root, main, pagePath: `blog/${post.slug}/`, article: true, structuredData: { type: 'post', post } });
}

const posts = await loadPosts();
const homePath = path.join(projectRoot, 'docs', 'index.html');
const home = await fs.readFile(homePath, 'utf8');
const schemaStart = '<!-- STRUCTURED_DATA_START -->';
const schemaEnd = '<!-- STRUCTURED_DATA_END -->';
if (home.split(schemaStart).length !== 2 || home.split(schemaEnd).length !== 2) {
  throw new Error('Marcadores de dados estruturados ausentes ou duplicados em docs/index.html');
}
const updatedHome = renderHomeHighlights(home, posts).replace(
  /<!-- STRUCTURED_DATA_START -->[\s\S]*?<!-- STRUCTURED_DATA_END -->/,
  `${schemaStart}\n    ${renderStructuredData({ type: 'home' })}\n    ${schemaEnd}`
);
await fs.mkdir(blogDir, { recursive: true });
await fs.writeFile(path.join(blogDir, 'index.html'), renderBlogIndex(posts), 'utf8');
for (const post of posts) {
  const postDir = path.join(blogDir, post.slug);
  await fs.mkdir(postDir, { recursive: true });
  await fs.writeFile(path.join(postDir, 'index.html'), renderPost(post, posts), 'utf8');
}
if (updatedHome !== home) await fs.writeFile(homePath, updatedHome, 'utf8');
console.log(`Blog gerado: ${posts.length} artigos em docs/blog/`);
