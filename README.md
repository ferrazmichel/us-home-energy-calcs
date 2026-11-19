# US Home Energy Calculators — HomeWattCalc

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
└── src/
    ├── data/usStatesEnergy.ts     # Dataset dos 50 estados + DC + média nacional dos EUA
    ├── lib/calculators.ts         # Motor de cálculo puro (EV, base para Heat Pump & Solar)
    ├── components/                # Calculadora interativa client-side sem dependências pesadas
    └── app/                       # Home, /ev-charging-cost/[state], /methodology, /privacy-policy, /disclaimer
```

---

## Verticais Planejadas

| Fase | Vertical | URL Programática | Status |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Custo de Recarga de Carro Elétrico em Casa vs. Gasolina (51 páginas) | `/ev-charging-cost/[state]` | Scaffold pronto (testar build em casa) |
| **Fase 2** | Bomba de Calor vs. Aquecedor a Gás (51 páginas) | `/heat-pump-vs-gas/[state]` | Planejado |
| **Fase 3** | Payback de Energia Solar Residencial (51 páginas + NREL PVWatts) | `/solar-payback/[state]` | Planejado |

---

## Comandos Locais (no Computador de Casa com Node.js 20+)

```bash
npm install
npm run dev      # Visualização local em http://localhost:3000
npm run build    # Gera exportação estática na pasta out/
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
| Implementar scaffold Next.js (Static Export) com 51 páginas `/ev-charging-cost/[state]` + legais | IA | ✅ |
| Subir repositório para o GitHub pessoal (`ferrazmichel/us-home-energy-calcs`) | Usuário | ⬜ |
| Rodar `npm install && npm run build` em casa e revisar todas as páginas | Usuário | ⬜ |
| Registrar domínio `.com` e publicar na Cloudflare Pages / Vercel + GA4 + Search Console | Usuário | ⬜ |
| Obter `EIA_API_KEY` gratuita e rodar `scripts/fetch_eia_rates.py` para atualizar dados de 2026 | Usuário + IA | ⬜ |
| Construir Fase 2 (`heat-pump-vs-gas/[state]`) e aplicar ao AdSense / Journey by Mediavine | IA + Usuário | ⬜ |
