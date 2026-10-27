# PROOF Room

**The Command Center for Verifiable Energy Operations.**
*Every operation. Every milestone. Every proof.*

PROOF Room is an interactive, frontend-only product prototype for the **P.R.O.O.F. Strategy — From Price-Led Bidding to Proof-Led Growth**, prepared for a business case competition. It shows the customer workspace implied by the strategy for PT Energy, a fictional Indonesian energy-services company:

- **Option B — Archipelago Delivery Resilience**: regional network view, candidate coordination nodes, supplier qualification, milestone-level delivery tracking.
- **Option C — Digital-First Customer Experience**: live service tracking, KPI reporting, the Evidence Center and structured customer acknowledgments.
- **Paid-on-Proof Contracts** (independent innovation concept): the Outcome Ledger. Clearly labelled as separate — not deployed, not funded, not part of the Option C investment.

> **Prototype notice.** PT Energy, its customers, sites, vendors, people and every figure are fictional demonstration data. Batam, Surabaya, Balikpapan and Sorong are proposed candidate coordination nodes, not existing facilities. No industrial system, customer data or payment infrastructure is connected.

**Live demo:** https://dylanmorenow.github.io/PROOF/

## Highlights

- **Overview command center** — narrative headline, five KPIs with sparklines and period deltas, an accurate Indonesia network map (Natural Earth), performance trend, decisions queue, Proof Chain funnel and activity feed.
- **PIP, the PROOF Intelligence Partner** — a 3D crystalline companion (React Three Fiber) with an SVG fallback for low-power devices, no WebGL and reduced motion.
- **Guided tours** — a custom spotlight engine: dimmed and blurred backdrop, a pixel-accurate animated cut-out around the real DOM element, Floating UI card placement, route-aware target resolution, keyboard control and a phone bottom-sheet mode.
- **The Proof Chain** — Captured → Submitted → Verified → Acknowledged. Uploaded evidence is visibly different from verified evidence.
- **Strategy lens** — press `L` to tag each module with the strategic option it delivers.
- **One deterministic dataset** — every KPI is computed from the same records, and Vitest invariants keep pages reconciled (24 active orders, 7 open exceptions, 90% → 96% → US$26,000 ledger example).

## Run locally

Requires Node 22+ (developed on Node 25).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # data invariants and ledger maths
npm run typecheck
npm run build      # static output in dist/
```

## Build status

| Milestone | Scope | Status |
|---|---|---|
| 1 | Foundation, Overview, PIP, Tour A (Welcome) | Done |
| 2 | Operations, Service Detail, Evidence Center, Performance, Tour B | Done |
| 3 | Outcome Ledger, Tour C | Next |
| 4 | Motion polish, QA, slide screenshots, judge demo script | Planned |

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`: install → typecheck → tests → build with `PAGES_BASE=/<repo>/` → publish `dist/` to GitHub Pages. A post-build step copies `index.html` to `404.html` so deep links survive a refresh. In the repository settings, Pages must use **GitHub Actions** as its source.

## Project structure

```
src/
  app/          shell, router, navigation, store
  data/         types, reference data, deterministic builder, selectors, ledger maths
  features/     overview, network-map (generated geography)
  charts/       custom SVG charts (d3-scale / d3-shape)
  pip/          PIP mascot: 3D canvas, SVG fallback, state
  tour/         guided-tour engine, step scripts
  ui/           design-system components
  motion/       motion tokens and helpers
  styles/       design tokens and global styles
scripts/        map generation, screenshots, tour and performance checks
tests/          data contract tests
```

See [docs/CUSTOMIZING.md](docs/CUSTOMIZING.md) to change colours, navigation, data, tour steps, PIP and motion.

## Licence

All rights reserved — competition work. Third-party components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
