import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(projectRoot, 'content');
const blogDir = path.join(projectRoot, 'docs', 'blog');
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: true });
const contactUrl = 'https://wa.me/5512991404535?text=Ol%C3%A1%21%20Conheci%20a%20MCA%20pelo%20site%20e%20gostaria%20de%20conversar%20sobre%20os%20servi%C3%A7os%20de%20contabilidade.';
const preferredOrder = [
  'fluxo-de-caixa-pequeno-negocio',
  'receita-despesas-lucro',
  'nota-fiscal-mei',
  'antes-de-abrir-empresa',
  'rotina-mensal-mei',
  'das-e-dasn-simei',
  'primeira-conversa-contabilidade'
];

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
    posts.push({ slug, title, description, category, updated, readingTime, sources, ...rendered });
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
          <p>Rua Narizinho Arrebitado, 540<br />Gurilândia, Taubaté - SP</p>
        </div>
      </div>
    </footer>`;
}

function renderDocument({ title, description, root, main }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#4D4946" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} | Blog MCA Contabilidade</title>
    <link rel="icon" type="image/png" href="${root}assets/favicon.png" />
    <link rel="stylesheet" href="${root}styles.css?v=motion-2" />
    <link rel="stylesheet" href="${root}blog.css?v=motion-2" />
    <script src="${root}script.js?v=motion-2" defer></script>
  </head>
  <body class="blog-page">
    ${renderHeader(root)}
    <main id="conteudo">${main}</main>
    ${renderFooter(root)}
  </body>
</html>
`.replace(/^[ \t]+$/gm, '');
}

function renderCard(post, href, headingLevel = 2, featured = false) {
  return `<article class="blog-card${featured ? ' blog-card--featured' : ''}">
    <a class="blog-card__link" href="${href}">
      <span class="blog-card__top"><span class="blog-card__category">${escapeHtml(post.category)}</span><span class="blog-card__arrow" aria-hidden="true">↗</span></span>
      <h${headingLevel}>${escapeHtml(post.title)}</h${headingLevel}>
      <p>${escapeHtml(post.description)}</p>
      <span class="blog-card__meta">${escapeHtml(post.readingTime)} de leitura <span aria-hidden="true">·</span> ${escapeHtml(displayDate(post.updated))}</span>
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
  const cards = posts.slice(0, 3)
    .map((post, index) => renderCard(post, `blog/${post.slug}/`, 3, index === 0))
    .join('\n')
    .split('\n').map((line) => `            ${line}`).join(eol);
  return home.replace(/<!-- BLOG_CARDS_START -->[\s\S]*?<!-- BLOG_CARDS_END -->/,
    `${start}${eol}${cards}${eol}            ${end}`);
}

function renderBlogIndex(posts) {
  const cards = posts.map((post, index) => renderCard(post, `${post.slug}/`, 2, index === 0)).join('\n');
  const main = `
    <section class="blog-hero" aria-labelledby="blog-title">
      <div class="container blog-hero__inner">
        <div>
          <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>Blog MCA</p>
          <h1 id="blog-title">Informação para cuidar do seu negócio com mais clareza<span>.</span></h1>
          <p>Leituras práticas para quem empreende. Comece por uma dúvida do seu dia a dia e encontre caminhos para se organizar melhor.</p>
        </div>
        <div class="blog-hero__mark" aria-hidden="true"><span>M</span><span>C</span><span>A</span></div>
      </div>
    </section>
    <section class="blog-listing section" aria-labelledby="articles-title">
      <div class="container">
        <div class="blog-listing__heading">
          <div><p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Leituras</p><h2 id="articles-title">Comece por aqui.</h2></div>
          <p>Artigos de demonstração preparados com fontes oficiais. O conteúdo ainda passará por revisão técnica da MCA.</p>
        </div>
        <div class="blog-grid">${cards}</div>
      </div>
    </section>
    <section class="blog-invite" aria-labelledby="blog-invite-title">
      <div class="container blog-invite__inner">
        <div><p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Uma dúvida de cada vez</p><h2 id="blog-invite-title">Entender é o primeiro passo para decidir melhor.</h2></div>
        <a class="button button--primary" href="../#contato">Converse com a MCA <span aria-hidden="true">↗</span></a>
      </div>
    </section>`;
  return renderDocument({ title: 'Conteúdos para MEIs e pequenos negócios', description: 'Artigos práticos da prévia do blog MCA para MEIs e pequenos negócios.', root: '../', main });
}

function renderPost(post, posts) {
  const root = '../../';
  const toc = post.headings.length ? `<nav class="article-toc" aria-label="Nesta página">
    <strong>Neste artigo</strong><ol>${post.headings.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.label)}</a></li>`).join('')}</ol>
  </nav>` : '';
  const sources = post.sources.map((source, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a></li>`).join('');
  const related = posts.filter((candidate) => candidate.slug !== post.slug).slice(0, 2)
    .map((candidate) => renderCard(candidate, `../${candidate.slug}/`, 3)).join('\n');
  const main = `
    <nav class="article-breadcrumb container" aria-label="Caminho de navegação">
      <a href="../../">Início</a><span aria-hidden="true">/</span><a href="../">Blog</a><span aria-hidden="true">/</span><span>${escapeHtml(post.category)}</span>
    </nav>
    <article>
      <header class="article-header">
        <div class="article-container">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${escapeHtml(post.category)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="article-header__description">${escapeHtml(post.description)}</p>
          <div class="article-header__meta"><time datetime="${post.updated}">Atualizado em ${escapeHtml(displayDate(post.updated))}</time><span aria-hidden="true">·</span><span>${escapeHtml(post.readingTime)} de leitura</span></div>
        </div>
      </header>
      <div class="article-container article-main">
        <div class="article-review"><span aria-hidden="true">●</span><p><strong>Conteúdo de demonstração.</strong> Este texto está em avaliação e será revisado tecnicamente pela MCA antes da versão definitiva.</p></div>
        ${toc}
        <div class="article-prose">${post.body}</div>
        <section class="article-sources" aria-labelledby="sources-title">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Apuração</p>
          <h2 id="sources-title">Fontes consultadas</h2>
          <ol>${sources}</ol>
          <p>Confira a situação e a data de vigência das orientações oficiais antes de aplicá-las ao seu caso.</p>
        </section>
      </div>
    </article>
    <section class="article-related section" aria-labelledby="related-title">
      <div class="container">
        <div class="article-related__heading"><div><p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Continue lendo</p><h2 id="related-title">Outras dúvidas, novas respostas.</h2></div><a href="../">Ver todos os artigos <span aria-hidden="true">↗</span></a></div>
        <div class="blog-grid">${related}</div>
      </div>
    </section>`;
  return renderDocument({ title: post.title, description: post.description, root, main });
}

const posts = await loadPosts();
const homePath = path.join(projectRoot, 'docs', 'index.html');
const home = await fs.readFile(homePath, 'utf8');
const updatedHome = renderHomeHighlights(home, posts);
await fs.mkdir(blogDir, { recursive: true });
await fs.writeFile(path.join(blogDir, 'index.html'), renderBlogIndex(posts), 'utf8');
for (const post of posts) {
  const postDir = path.join(blogDir, post.slug);
  await fs.mkdir(postDir, { recursive: true });
  await fs.writeFile(path.join(postDir, 'index.html'), renderPost(post, posts), 'utf8');
}
if (updatedHome !== home) await fs.writeFile(homePath, updatedHome, 'utf8');
console.log(`Blog gerado: ${posts.length} artigos em docs/blog/`);
