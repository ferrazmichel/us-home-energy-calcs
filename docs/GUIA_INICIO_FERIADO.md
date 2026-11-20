# Guia Prático de Início em Casa (Feriado / Fim de Semana)

> Siga este checklist no seu computador pessoal para testar o site, escolher o domínio `.com` e publicar gratuitamente na nuvem.

---

## Passo 1 — Revisar o Projeto Rodando Localmente *(Dependências e Build já Validados)*

> **Status atual:** `npm install`, `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` já foram executados com sucesso neste Mac, gerando a pasta estática `out/` com **57 URLs** no `sitemap.xml` (home, tabela nacional dos 51 estados/DC, 51 páginas estaduais e páginas institucionais).

1. No terminal, entre na pasta do repositório e inicie o servidor local de revisão:
   ```bash
   cd us-home-energy-calcs
   npm run dev
   ```
2. Abra `http://localhost:3000` no navegador e teste:
   - **Página inicial (`/`)** — teste os presets de veículos EV/gasolina, o botão de tarifa Off-Peak TOU, a busca/filtro por região no grid e o strip de destaques nacionais.
   - **Comparativo nacional (`/ev-charging-cost`)** — confira os rankings Top 5 e a tabela completa com todos os 50 estados + D.C.
   - **Páginas de estado caro vs. barato** — `/ev-charging-cost/california` vs. `/ev-charging-cost/washington` vs. `/ev-charging-cost/texas`, além do seletor rápido *Jump to state* e da tabela *Level 1 vs. Level 2*.
   - **Páginas institucionais** — `/about`, `/methodology`, `/privacy-policy`, `/disclaimer`.
3. Se fizer novos ajustes antes do deploy, valide novamente o pacote estático completo:
   ```bash
   npm test && npm run typecheck && npm run lint && npm run build
   ```
   Se tudo passar, a pasta estática `out/` estará pronta para deploy gratuito em CDN.

---

## Passo 2 — Escolher e Registrar um Domínio `.com`

Prefira um domínio curto, fácil de digitar e com cara de ferramenta confiável nos EUA (evite hífens e números). Sugestões para checar disponibilidade (preço de custo ~US\$ 10,44/ano no **Cloudflare Registrar** ou Porkbun):

- `homeenergycalcs.com`
- `wattwiseus.com`
- `kilowattroi.com`
- `electrifycost.com`
- `homepowercalc.com`

*(Se escolher outro nome, basta ajustar `SITE_NAME` e `SITE_URL` em `src/lib/siteConfig.ts` ou via variável `NEXT_PUBLIC_SITE_URL`.)*

---

## Passo 3 — Deploy Gratuito na Cloudflare Pages (Recomendado) ou Vercel

### Opção Cloudflare Pages (banda ilimitada no plano grátis + integração nativa com Cloudflare Registrar)
1. Crie uma conta gratuita em [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Vá em **Workers & Pages → Create → Pages → Connect to Git**.
3. Conecte seu repositório privado `ferrazmichel/us-home-energy-calcs`.
4. Configure o build:
   - **Framework preset:** `Next.js (Static HTML Export)`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Variável de ambiente:** `NEXT_PUBLIC_SITE_URL = https://seudominio.com`
5. Vincule seu domínio `.com` em **Custom domains**.

---

## Passo 4 — Indexação e Preparação para Monetização (Dia 1)

1. **Google Search Console:** adicione a propriedade do seu domínio e envie `https://seudominio.com/sitemap.xml`.
2. **Google Analytics 4 (GA4):** crie a propriedade GA4 e cole o `Measurement ID` (`G-XXXXXXXXXX`) na variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` (o layout já vem preparado para injetar o script automaticamente apenas quando essa variável existir!). *Importante: o Journey by Mediavine exige histórico no GA4.*
3. **Atualizar dados reais da EIA (opcional no dia 1, recomendado na 1ª semana):**
   - Solicite uma chave gratuita em [https://www.eia.gov/opendata/register.php](https://www.eia.gov/opendata/register.php).
   - Rode `python scripts/fetch_eia_rates.py` (com `EIA_API_KEY` no `.env`) para conferir e atualizar os valores mais recentes da EIA.
