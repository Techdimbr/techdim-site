# TECHDIM Site (público)

Versão pública do site institucional da TECHDIM para **GitHub Pages** e domínio customizado **`www.techdim.com.br`**.

## Objetivo do projeto

- Manter identidade visual TECHDIM (tema escuro/cyber, acentos ciano/neon e navegação responsiva).
- Operar 100% em ambiente estático (sem backend e sem persistência de dados sensíveis).
- Disponibilizar analisador local de navegador/rede com transparência de privacidade.

## O que este site contém

- Hero institucional, seções de serviços, sobre, cases/projetos, recursos, blog/conteúdo, contato e política de privacidade.
- Análise client-side de:
  - navegador e sistema;
  - conexão e estimativa de velocidade (quando a API do navegador estiver disponível);
  - WebRTC (com degradação graciosa);
  - fingerprint local em hash;
  - contexto DNS disponível no navegador.
- Exportação local de relatório (`.txt`) e opção de geração de PDF via impressão do navegador.

## Limitações esperadas de ambiente estático

- Não há backend para armazenamento de leads, visitantes, IP, GPS ou fingerprint.
- Não há integrações privadas (Firebase de coleta, Gemini, Stripe, Banco Inter, Discord webhook, Google Chat/Tasks, GitHub PAT, Express API).
- Algumas APIs podem não existir em todos os navegadores (o app exibe fallback sem quebrar a interface).

## Desenvolvimento local

Pré-requisitos: Node.js 22+ e npm.

```bash
npm install
npm run dev
```

## Qualidade e build

```bash
npm run lint
npm run build
```

A saída estática é gerada em `dist/`.

## Publicação com GitHub Pages

O workflow já está em:

- `.github/workflows/deploy-pages.yml`

Fluxo:
1. Push em `main`.
2. GitHub Actions executa `npm ci` + `npm run build`.
3. Artefato `dist/` é publicado no Pages.

## Domínio customizado (`www.techdim.com.br`)

Arquivo necessário (já incluído):

- `public/CNAME` com valor exato `www.techdim.com.br`

### DNS recomendado

No provedor DNS do domínio `techdim.com.br`, configurar:

- `CNAME` para `www` apontando para `techdimbr.github.io`
- (Opcional para domínio raiz) registros `A`/`ALIAS` conforme documentação oficial do GitHub Pages.

Referência oficial: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site

## Acesso por domínio customizado e URL do GitHub

O projeto usa `base: './'` no Vite para manter compatibilidade com:

- `https://www.techdim.com.br`
- `https://techdimbr.github.io/techdim/`

## Roteamento no GitHub Pages

A navegação interna usa hash route para páginas internas sensíveis a recarregamento, por exemplo:

- `#/privacidade`

Isso evita quebra de rota em refresh no GitHub Pages.
