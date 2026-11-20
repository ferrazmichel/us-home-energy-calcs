# AGENTS.md — `us-home-energy-calcs` (HomeEnergyCalcs)

> Diretrizes técnicas, editoriais e de SEO para desenvolvimento do hub de calculadoras interativas de energia residencial nos EUA.

---

## 1. Propósito e Modelo de Negócio

- Construir um site estático de alta velocidade em inglês americano (**marca provisória: HomeEnergyCalcs**) focado em **ferramentas interativas de economia energética residencial nos EUA** (EV Home Charging, Heat Pump vs. Gas Furnace e Solar Payback).
- Monetização passiva e escalável sem vender software/assinatura:
  1. **Google AdSense** após indexação inicial.
  2. **Journey by Mediavine** ao atingir **5.000 sessões/mês de países Tier-1** e **4 meses de idade do domínio** (repasse 70%).
  3. **Afiliados relevantes e éticos** (Amazon Associates EUA para carregadores Level 2/monitores de energia; programas de energia residencial quando houver tráfego).

---

## 2. Regras Editoriais e de SEO Programático

1. **Inglês americano nativo e unidades imperiais:**
   - Sempre usar milhas (`miles`), galões (`gallons`), `kWh`, `therms`, `BTU`, `USD ($)` e ortografia americana (`kilowatt`, `center`, `program`).
2. **Proibido *Thin Content* em páginas por estado:**
   - Nunca gerar 51 páginas idênticas trocando apenas o nome do estado.
   - Cada página (`/ev-charging-cost/[state]`) deve conter valores específicos do estado (tarifa elétrica residencial, gasolina, gás natural, carregamento público, horas de sol), comparação explícita com a média nacional dos EUA, tabela de cenários de uso, FAQs contextualizadas ao estado e markup estruturado JSON-LD (`FAQPage`).
3. **Sem *Email Gate*:**
   - Nunca bloquear o resultado da calculadora atrás de cadastro ou e-mail. A transparência e velocidade são o principal diferencial competitivo frente a sites geradores de lead.
4. **Conformidade com Legislação Atual dos EUA (2026):**
   - **Não** prometer créditos fiscais federais residenciais expirados em 2025/2026 (como seções 25C, 25D e 30C) como se estivessem vigentes sem verificação oficial atualizada. Focar na **economia operacional anual real** e orientar o usuário a consultar programas locais da concessionária/estado.
5. **Páginas institucionais obrigatórias:**
   - Manter `/methodology`, `/privacy-policy` e `/disclaimer` sempre atualizadas e visíveis no rodapé (requisito crítico para aprovação no AdSense, Journey by Mediavine e Amazon Associates).

---

## 3. Regras Técnicas (Next.js App Router + Static Export)

- O projeto usa **Next.js 15 com `output: "export"`** para hospedagem 100% gratuita e escalável na Cloudflare Pages ou Vercel sem custos de servidor.
- **Atenção obrigatória no Next.js 15:**
  - `params` em rotas dinâmicas e `generateMetadata` são `Promise<...>` (`await params`).
  - `sitemap.ts` e `robots.ts` devem declarar `export const dynamic = "force-static";`.
- Evitar bibliotecas pesadas de gráficos no bundle client-side; usar componentes SVG/CSS leves para manter Core Web Vitals excelentes no mobile.
- Atualizar `src/data/usStatesEnergy.ts` periodicamente usando `scripts/fetch_eia_rates.py` (com `EIA_API_KEY` gratuita).
