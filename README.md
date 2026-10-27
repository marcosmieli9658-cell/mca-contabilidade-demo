# MCA Contabilidade & Assessoria — prévia do site

Esta é uma demonstração para avaliação visual e de conteúdo. O site estático publicado no GitHub Pages sai da pasta [`docs/`](docs/). Não há formulário, coleta de dados ou integração de atendimento. A seção [`docs/blog/`](docs/blog/) reúne artigos de demonstração para MEIs e pequenos negócios, ainda sujeitos à revisão técnica da MCA.

## Prévia local

Abra `docs/index.html` no navegador ou sirva a pasta `docs/` com qualquer servidor HTTP estático. Os caminhos dos arquivos são relativos para funcionar também na URL de projeto do GitHub Pages.

## Atualizar o blog

Os textos originais ficam em [`content/`](content/), um arquivo Markdown por artigo. Cada arquivo tem título, resumo, categoria, data de atualização, tempo estimado de leitura e links para fontes oficiais no bloco inicial. O nome do arquivo define a URL estável do artigo.

Depois de editar ou acrescentar um artigo:

```powershell
npm ci
npm run build:blog
```

Revise as páginas geradas em `docs/blog/` e publique os arquivos Markdown e HTML juntos. O GitHub Pages serve os HTMLs de `docs/`; ele não executa o gerador Node. A lista `preferredOrder` em `scripts/build-blog.mjs` define a ordem editorial; os três primeiros artigos aparecem também como destaque na página inicial.

Antes de transformar a prévia em site definitivo, a MCA precisa aprovar o blog, indicar quem fará a revisão técnica dos artigos e definir como será a atualização das informações contábeis. As datas e fontes estão visíveis nos textos para facilitar essa revisão.

## Antes da versão definitiva

- Aprovar identidade, textos, serviços oferecidos, abrangência e público atendido.
- Confirmar se o celular informado recebe mensagens via WhatsApp e se endereço e horário seguem atuais.
- Fornecer a logo oficial em SVG ou PNG transparente. A prévia usa um recorte fiel da reprodução no PDF, sem a faixa de contatos antigos.
- Fornecer história, dados profissionais e imagens próprias autorizadas, caso as respectivas seções sejam desejadas.
- Após a aprovação, decidir a hospedagem definitiva e apontar o domínio. Nenhum domínio personalizado está configurado nesta prévia.

Os materiais recebidos para esta etapa são `MCA_Identidade_Visual_e_Plano_do_Site.pdf` e `MCA_Prompt_Codex.txt`; eles não são publicados neste repositório.
