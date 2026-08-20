# Contributing to App Map

Thanks for your interest in improving App Map! Issues and pull requests are welcome.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/lolimmlost/app-map-appahouse/issues/new/choose) —
they prompt for the details that make an issue actionable. For **security
vulnerabilities**, do not open a public issue; follow [`SECURITY.md`](./SECURITY.md).

## Development setup

You need **Node 22** (see [`.nvmrc`](./.nvmrc)) and a **PostgreSQL** database.

```bash
npm ci
cp .env.example .env      # set DATABASE_URL and BETTER_AUTH_SECRET
npm run db:push
npm run dev               # http://localhost:4175
```

Full walkthrough: [docs/quick-start.md](./docs/quick-start.md).

## Making changes

1. **Branch** off `main` — `main` is protected and takes changes only via PR.
2. **Keep it focused** — one logical change per PR is easier to review.
3. **Match the surrounding code** — the project uses [Biome](https://biomejs.dev)
   for lint + format.

## Before you open a PR

Run the checks locally — CI and reviewers expect them green:

```bash
npm run check      # Biome lint + format
npm test           # unit + integration (Vitest)
npm run test:e2e   # end-to-end (Playwright) — when your change affects flows
```

## Opening the PR

- Fill out the [pull request template](./.github/PULL_REQUEST_TEMPLATE.md).
- Describe **what** changed and **why**, and link any related issue.
- If your change is user-facing, add a line to [`CHANGELOG.md`](./CHANGELOG.md)
  under an *Unreleased* heading, and — if it's worth surfacing in-app — to the
  "What's new" list in `src/lib/whatsnew.ts`.
- Resolve review conversations before merging (the repo requires it).

## Project layout

| Path | What's there |
|---|---|
| `src/routes` | File-based TanStack Router routes. |
| `src/components` | React components (UI in `src/components/ui`). |
| `src/lib` | Client/server helpers, auth, `whatsnew.ts`. |
| `src/database/schema` | Drizzle schema. |
| `drizzle/` | Generated migrations. |
| `docs/` | User-facing guides. |
| `tests/` | Unit, integration, and e2e tests. |

Questions? Open a [discussion or issue](https://github.com/lolimmlost/app-map-appahouse/issues).
