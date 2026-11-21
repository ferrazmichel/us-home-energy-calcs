# Arquitetura de SEO Programático e Fontes de Dados Oficiais

> Blueprint técnico para ranquear centenas de buscas locais de cauda longa nos Estados Unidos sem cair em punições de *thin content*.

---

## 1. Estratégia de Palavras-Chave e Mapa de URLs

Consultas nacionais amplas (*"EV charging calculator"*, *"solar calculator"*) são dominadas por gigantes. A entrada estratégica acontece nas **consultas estaduais e comparativas**:

| Fase | Padrão de URL | Exemplos de Buscas Alvo nos EUA | Quantidade de Páginas |
| :--- | :--- | :--- | :--- |
| **Fase 1 (Pronta no Scaffold)** | `/ev-charging-cost/[state]` | `cost to charge an EV at home in California`, `Texas EV home charging vs gas calculator` | **51** (50 estados + DC) |
| **Fase 2** | `/heat-pump-vs-gas/[state]` | `heat pump vs gas furnace operating cost in Ohio`, `heat pump savings Michigan` | **51** |
| **Fase 3** | `/solar-payback/[state]` | `solar panel payback period in Arizona`, `is solar worth it in North Carolina 2026` | **51** |
| **Guias de Apoio** | `/guides/[slug]` | *"Level 1 vs Level 2 EV Charger Home Cost"*, *"Should You Get Solar Before a Heat Pump?"* | 10–15 guias evergreen |
| **Institucionais** | `/methodology`, `/privacy-policy`, `/disclaimer` | E-E-A-T, transparência de fórmulas e requisitos AdSense/Mediavine | **3** |

---

## 2. Como Evitar *Thin Content* nas Páginas Programáticas

Toda página `/ev-charging-cost/[state]` já é gerada com elementos únicos e úteis baseados nos dados do estado:
1. **Tarifas pré-carregadas reais daquele estado** (tarifa elétrica residencial `¢/kWh`, preço médio da gasolina `$/gal`, tarifa pública DC fast charge e zona climática).
2. **Comparativo automático com a média nacional dos EUA** (mostrando em % se carregar um EV em casa naquele estado é mais barato ou mais caro que a média americana — ex.: Washington/Idaho muito mais baratos por hidreletricidade vs. Califórnia/Havaí onde a gasolina alta ainda garante economia apesar da energia cara).
3. **Tabela estática de cenários** (10.000 / 15.000 / 20.000 milhas/ano) — importante porque robôs de busca leem facilmente tabelas HTML mesmo sem interagir com JavaScript.
4. **FAQs específicas do estado + Schema JSON-LD `FAQPage`**.
5. **Linkagem interna cruzada** com outros estados da mesma região/perfil e para `/methodology`.

---

## 3. Fontes Oficiais de Dados e Rotina de Atualização

| Dado | Fonte Oficial EUA | Automação |
| :--- | :--- | :--- |
| Tarifas residenciais de eletricidade (`¢/kWh`) por estado | **U.S. EIA API v2** (`electricity/retail-sales`) | Script [`scripts/fetch_eia_rates.py`](../scripts/fetch_eia_rates.py) (requer `EIA_API_KEY` gratuita) |
| Preços de gás natural residencial (`$/therm` / `$/MCF`) | **U.S. EIA API v2** (`natural-gas/pri/sum`) | Expansão do script na Fase 2 |
| Preço médio estadual da gasolina (`$/gal`) | EIA Weekly Retail Gasoline / AAA | Atualização trimestral junto com o script EIA |
| Irradiação solar e produção kWh estimada | **NREL PVWatts API** (Fase 3) | Integração build-time na Fase 3 |

> **Importante:** O dataset inicial em `src/data/usStatesEnergy.ts` contém valores de referência realistas por estado para estruturar o MVP. Antes ou logo após o lançamento, executar `scripts/fetch_eia_rates.py` com sua `EIA_API_KEY` gratuita para sincronizar os números oficiais mais recentes da EIA.

---

## Tabela de Atividades

| Atividade | Responsável | Status |
| :--- | :--- | :--- |
| Criar dataset base dos 50 estados + DC e comparativos automáticos | IA | ✅ |
| Implementar `sitemap.ts`, `robots.ts` e schema JSON-LD `FAQPage` | IA | ✅ |
| Criar script `scripts/fetch_eia_rates.py` para sincronização com EIA API v2 | IA | ✅ |
| Rodar `fetch_eia_rates.py` com `EIA_API_KEY` real e atualizar `usStatesEnergy.ts` | Usuário + IA | ⬜ |
| Implementar rotas `/heat-pump-vs-gas/[state]` (Fase 2) | IA | ✅ |
| Implementar rotas `/solar-payback/[state]` com dados NREL PVWatts (Fase 3) | IA | ⬜ |
