# PersonaPulse Elite

A Next.js application for exploring landing-page copy with 50 fictional personas, a force-directed network, a four-stage funnel, editorial rewrites, and cohort questions.

## Run

Use Node.js 22.18 or later (Node.js 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For production, run `npm run build` followed by `npm start`.

## What works

- Analyze a public website, paste a manuscript, or choose a clearly labeled fictional sample.
- Inspect the extracted headline, value statement, pricing, and call to action.
- View deterministic persona outcomes and a monotonic funnel derived from those outcomes.
- Filter the network, pause it, drag nodes, or inspect personas using an accessible selector.
- Compare a plain-language rewrite against the baseline using the same personas. Pricing is preserved; suggestions introduce no fabricated commercial promises.
- Ask questions of all personas, advocates, or skeptics. Dialogue is template-based and grounded in each persona's current assessment.
- Export a JSON report, including outcomes and conversation. The last baseline analysis is stored on the current browser/device.

## Method and limits

This is an independent heuristic research sandbox. It is not connected to the MiroFish/OASIS backend or an AI provider. Persona scores, exchanges, and conversion intent are synthetic hypotheses, not actual customer observations or validated forecasts. The four stages evaluate headline complexity, presence of a value statement, price/commitment risk, and action friction using fixed persona traits. This model does not assess whether the product is factually useful for a persona's industry.

Website extraction reads server-rendered HTML without executing page scripts. Authenticated pages, bot-protected sites, and JavaScript-only pages may require pasting copy. The first detected price/action may be incomplete; always review the source preview. URL retrieval checks every redirect, blocks private/reserved addresses, pins DNS results, and limits time, redirects, and response size. Before exposing a public deployment, configure deployment-level request limits for your traffic requirements.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Core tests cover content-dependent results, repeatability, funnel invariants, archetype coverage, commercial-term preservation, extraction, and private-address rejection. Browser tests cover manuscript analysis, rewrites, chat, persona inspection, export, persistence, error recovery, and viewport widths of 375, 768, and 1440 pixels.

## APIs

`POST /api/scrape` accepts `{ "url": "https://example.com" }` and returns source copy or an explicit extraction error. `POST /api/simulate` accepts `{ "headline": "...", "subhead": "...", "pricing": "...", "cta": "..." }` and returns synthetic metrics, nodes, edges, and exchanges.

The `app/`, `components/`, and TypeScript files under `lib/` are the maintained application. Root-level HTML and JavaScript files are legacy prototypes and are not used by Next.js.


## Interrupted dependency installs on Windows

`next is not recognized` means the local Next.js command has not been installed successfully. `ENOTEMPTY` during installation can occur when an interrupted or competing install leaves a partial dependency tree.

Stop this project's installer/dev-server commands first. Preserve the incomplete tree, then perform one clean install:

```powershell
$backupPath = Join-Path (Split-Path -Parent (Get-Location).Path) ("Akthar-dependencies-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
Move-Item -LiteralPath node_modules -Destination $backupPath
npm ci
npm run dev
```

Wait for the dependency install to finish successfully before starting another npm command. Do not install Next.js globally to resolve this issue. Incomplete dependency backups are excluded from source control and TypeScript checks.


