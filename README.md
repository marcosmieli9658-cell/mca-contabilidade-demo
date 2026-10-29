# MCA Contabilidade & Assessoria — prévia do site

Esta é uma demonstração para avaliação visual e de conteúdo. O site estático publicado no GitHub Pages sai da pasta [`docs/`](docs/). Não há formulário, analytics ou integração de atendimento. O mapa incorporado na área de contato usa Google Maps, carrega com `loading="lazy"` e permite abrir o endereço e as rotas no serviço externo. A seção [`docs/blog/`](docs/blog/) reúne artigos de demonstração para MEIs e pequenos negócios, ainda sujeitos à revisão técnica da MCA.

## Prévia local

Abra `docs/index.html` no navegador ou sirva a pasta `docs/` com qualquer servidor HTTP estático. Os caminhos dos arquivos são relativos para funcionar também na URL de projeto do GitHub Pages.

## Atualizar o blog

Os textos originais ficam em [`content/`](content/), um arquivo Markdown por artigo. Cada arquivo tem título, resumo, categoria, data de atualização, tempo estimado de leitura e links para fontes oficiais no bloco inicial. O nome do arquivo define a URL estável do artigo.

O arquivo `content/reading-guides.json` reúne os resumos de leitura e os motivos dos links relacionados. Ao atualizar um artigo, confira também esse resumo; ele deve refletir o texto e suas fontes, sem acrescentar regras ou indicar uma revisão técnica que não ocorreu.

Depois de editar ou acrescentar um artigo:

```powershell
npm ci
npm run build:blog
```

Revise as páginas geradas em `docs/blog/` e publique os arquivos Markdown e HTML juntos. O GitHub Pages serve os HTMLs de `docs/`; ele não executa o gerador Node. A lista `preferredOrder` em `scripts/build-blog.mjs` define a ordem editorial; a página inicial destaca o primeiro artigo de cada tema.

Antes de transformar a prévia em site definitivo, a MCA precisa aprovar o blog, indicar quem fará a revisão técnica dos artigos e definir como será a atualização das informações contábeis. As datas e fontes estão visíveis nos textos para facilitar essa revisão.

## Dados estruturados

O comando `npm run build:blog` também gera JSON-LD na página inicial, no índice e nos artigos. O módulo `scripts/structured-data.mjs` reúne os dados informados da empresa e usa os metadados dos artigos para produzir `AccountingService`, `WebSite`, `Blog`, `BlogPosting` e trilhas de navegação. Atualize esse módulo quando os dados empresariais mudarem e confira sua correspondência com o conteúdo visível.

Autoria, revisão técnica, data original de publicação, avaliações e identificadores profissionais não foram acrescentados sem confirmação. A prévia continua com `noindex, nofollow`; dados estruturados não liberam sua indexação nem garantem destaque no Google.

As datas de atualização continuam visíveis nos artigos. Como a fonte editorial registra somente o dia, o JSON-LD não declara `dateModified`: o Google espera data e hora nesse campo. Acrescente-o apenas quando houver um horário editorial comprovado, sem usar horários de commits ou presumir meia-noite.

O campo `hasMap` aponta para uma busca do endereço informado no Google Maps. Ele não identifica nem comprova um Perfil da Empresa verificado.

## Antes da versão definitiva

- Aprovar identidade, textos, serviços oferecidos, abrangência e público atendido.
- Confirmar se o celular informado recebe mensagens via WhatsApp e se endereço e horário seguem atuais.
- Fornecer a logo oficial em SVG ou PNG transparente. A prévia usa um recorte fiel da reprodução no PDF, sem a faixa de contatos antigos.
- Fornecer história, dados profissionais e imagens próprias autorizadas, caso as respectivas seções sejam desejadas.
- Após a aprovação, decidir a hospedagem definitiva e apontar o domínio. Nenhum domínio personalizado está configurado nesta prévia.

## Preparação para busca na versão definitiva

Estas etapas ficam para o lançamento aprovado; a demonstração permanece com `noindex, nofollow`.

1. Com o domínio e a hospedagem definidos, atualizar `siteUrl` em `scripts/structured-data.mjs`, URLs canônicas e metadados de compartilhamento, gerar um sitemap das páginas aprovadas e conferir os links. Liberar a indexação somente no site definitivo aprovado e verificar acesso público e snippets pelo Search Console.
2. Com o proprietário da MCA, conferir o Perfil da Empresa no Google: nome, endereço, telefone, horários, serviços e fotos reais. Manter esses dados consistentes com a página e o JSON-LD. Usar um link ou Place ID do perfil somente após identificar o cadastro correto; não inferir coordenadas, abrangência, avaliações ou credenciais.
3. Configurar o Search Console na Conta do Google do responsável pela empresa e acompanhar indexação, consultas e páginas. Após o lançamento, acompanhar também as impressões no [relatório de desempenho em IA generativa](https://support.google.com/webmasters/answer/16984139), quando houver volume suficiente para exibi-lo.
4. Antes de indexar os artigos, indicar a pessoa responsável pela revisão contábil, revisar regras e fontes e publicar sua identificação profissional autorizada. Acrescentar autoria, revisão e datas originais ao conteúdo e ao JSON-LD somente quando houver evidência; manter a data de atualização ligada à revisão real.

Para conceder acesso ao Search Console, o proprietário abre **Configurações > Usuários e permissões > Adicionar usuário**, informa a Conta do Google da pessoa e escolhe o nível adequado: restrito para consulta ou pleno para o trabalho técnico necessário. A pessoa entra com essa mesma conta para acessar a propriedade. [Permissões do Search Console](https://support.google.com/webmasters/answer/7687615?hl=pt-BR).

No Perfil da Empresa, o proprietário usa **Configurações do Perfil da Empresa > Pessoas e acesso > Adicionar**, convida a Conta do Google como administrador, e o convidado aceita o convite nessa conta. Cada pessoa usa sua própria conta, sem compartilhar senha. [Acesso ao Perfil da Empresa](https://support.google.com/business/answer/3403100?hl=pt-BR).

Para aparecer nas experiências de IA do Google, o foco continua em conteúdo útil, acesso aos textos, navegação e SEO. O Google não exige arquivos ou marcação especial para IA e não garante inclusão ou posição. [Orientação oficial para busca generativa](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

Os materiais recebidos para esta etapa são `MCA_Identidade_Visual_e_Plano_do_Site.pdf` e `MCA_Prompt_Codex.txt`; eles não são publicados neste repositório.
