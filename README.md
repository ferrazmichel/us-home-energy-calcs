# US Home Energy Calculators — HomeEnergyCalcs

> Hub de calculadoras interativas de energia residencial para os **50 estados dos EUA + Washington, D.C.**, projetado para tráfego orgânico americano (SEO programático) e monetização via AdSense → Journey by Mediavine + afiliados.

---

## Estrutura do Projeto

```text
us-home-energy-calcs/
├── AGENTS.md
├── docs/
│   ├── PLANO_DE_NEGOCIOS.md       # Tese, RPM EUA, escada AdSense -> Mediavine Journey
│   ├── ARQUITETURA_SEO_E_DADOS.md # Rotas programáticas e fontes oficiais EIA / NREL
│   └── GUIA_INICIO_FERIADO.md     # Passo a passo para rodar, comprar domínio e publicar
├── scripts/
│   └── fetch_eia_rates.py         # Atualização das tarifas estaduais via EIA API v2
├── tests/
│   └── calculators.test.ts        # Testes unitários do motor e integridade dos 51 estados
└── src/
    ├── data/usStatesEnergy.ts     # Dataset dos 50 estados + DC + média nacional dos EUA
    ├── lib/calculators.ts         # Motor de cálculo puro, presets e sessões L1/L2
    ├── lib/stateRankings.ts       # Rankings estaduais pré-calculados (¢/kWh e economia)
    ├── components/                # Calculadora, explorador com filtros e quick-switcher
    └── app/                       # Home, /ev-charging-cost, /ev-charging-cost/[state], /about, /methodology, /privacy-policy, /disclaimer
```

---

## Verticais Planejadas

| Fase | Vertical | URL Programática | Status |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Custo de Recarga de Carro Elétrico em Casa vs. Gasolina (51 páginas + comparativo nacional) | `/ev-charging-cost` e `/ev-charging-cost/[state]` | Pronto e validado (`npm run build` -> `out/` com 57 URLs no `sitemap.xml`) |
| **Fase 2** | Bomba de Calor vs. Aquecedor a Gás (51 páginas + comparativo nacional) | `/heat-pump-vs-gas` e `/heat-pump-vs-gas/[state]` | Pronto e validado (`npm run build` -> `out/` com 109 URLs no `sitemap.xml`) ✅ |
| **Fase 3** | Payback de Energia Solar Residencial (51 páginas + NREL PVWatts) | `/solar-payback/[state]` | Planejado |

---

## Comandos Locais (Node.js 20+)

```bash
npm install
npm run dev       # Visualização local em http://localhost:3000
npm test          # Executa testes unitários e validação dos 51 estados
npm run typecheck # Valida tipos TypeScript
npm run lint      # Executa ESLint
npm run build     # Gera exportação estática na pasta out/
```

---

## Documentação

- [`docs/PLANO_DE_NEGOCIOS.md`](docs/PLANO_DE_NEGOCIOS.md)
- [`docs/ARQUITETURA_SEO_E_DADOS.md`](docs/ARQUITETURA_SEO_E_DADOS.md)
- [`docs/GUIA_INICIO_FERIADO.md`](docs/GUIA_INICIO_FERIADO.md)

---

## Tabela de Atividades

| Atividade | Responsável | Status |
| :--- | :--- | :--- |
| Estruturar plano de negócios, arquitetura SEO e dataset dos 50 estados + DC | IA | ✅ |
| Implementar hub Next.js (Static Export) com 51 páginas `/ev-charging-cost/[state]`, comparativo nacional e legais | IA | ✅ |
| Subir repositório para o GitHub pessoal (`ferrazmichel/us-home-energy-calcs`) | Usuário | ✅ |
| Rodar `npm install`, testes, lint, typecheck e `npm run build` (`out/`) | IA | ✅ |
| Revisar páginas no navegador local (`npm run dev`) e dar `git push` das melhorias da Fase 1 | Usuário | ⬜ |
| Registrar domínio `.com` e publicar na Cloudflare Pages / Vercel + GA4 + Search Console | Usuário | ⬜ |
| Obter `EIA_API_KEY` gratuita e rodar `scripts/fetch_eia_rates.py` para atualizar dados de 2026 | Usuário + IA | ⬜ |
| Construir Fase 2 (`heat-pump-vs-gas/[state]`) e aplicar ao AdSense / Journey by Mediavine | IA + Usuário | ⬜ |
