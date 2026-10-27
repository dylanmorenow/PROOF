# Customizing PROOF Room

| To change | Edit | Notes |
|---|---|---|
| Colours, fonts, radii, shadows | `src/styles/globals.css` → `@theme` | Light theme. Tailwind v4 tokens: `--color-cyan` (accent text/focus) becomes `text-cyan`, … `sky` is the bright brand cyan for fills only. Font: Apple system font (SF) with Inter as the fallback on Windows/Android. |
| Motion feel | `src/motion/tokens.ts` | Critically damped springs (`bounce: 0`), easing, entrance stagger. Reduced motion is respected globally via `MotionConfig`. |
| Navigation | `src/app/nav.ts` and `src/app/router.tsx` | Each nav item has a `tour` id so tours can point at it. |
| Customers, regions, sites, vendors, crews, services | `src/data/reference.ts` | All fictional. Region coordinates for the map live in `scripts/build-map.ts`. |
| Work orders, exceptions, contracts | `src/data/build.ts` | The 24 active orders, 7 open exceptions, hero order `WO-26-0417` and the three outcome contracts are authored here; history is generated from a fixed seed. Run `npm test` after any change — the invariants will tell you if pages stop reconciling. |
| KPI definitions | `src/data/selectors.ts` | Every number in the UI is computed here. |
| Ledger maths | `src/data/ledger.ts` | Rounds verified availability to 0.1 pp, caps eligible points, adds adjustments. |
| Map geography | `scripts/build-map.ts` then `npm run map` | Regenerates `src/features/network-map/geo.generated.ts` from Natural Earth (via `world-atlas`). |
| Guided-tour steps | `src/tour/tours.ts` | Each step: `target` (a `data-tour` attribute), optional `route`, `placement`, `prepare`/`cleanup`, and the What / Why / Try copy. Add `data-tour="…"` to any element to make it a target. |
| PIP appearance | `src/pip/PipCanvas.tsx` (3D) and `src/pip/PipFallback.tsx` (SVG) | Crystal profile in `crystalGeometry()`, material in `<meshPhysicalMaterial>`, halo segments in `Halo`. Moods and reactions live in `src/pip/pipStore.ts`. Force a renderer with `?pip=svg` or `?pip=3d`. |
| Deployment base path | `.github/workflows/deploy.yml` (`PAGES_BASE`) and `vite.config.ts` | Defaults to `/<repository name>/` on Pages and `/` locally. |

## QA scripts

```bash
node scripts/shoot.mjs http://localhost:5173/ out.png 1440 900 --full     # full-resolution screenshot
node scripts/tour-check.mjs http://localhost:5173/ out-dir A 1440 900      # runs a tour, checks spotlight accuracy per step
node scripts/perf-check.mjs gpu http://localhost:5173/                     # frame rates idle / during tour transitions
```

On Windows Git Bash, set `MSYS_NO_PATHCONV=1` before passing `/PROOF/`-style paths, or the shell rewrites them.
