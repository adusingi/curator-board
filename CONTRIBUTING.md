# Contributing to Curator Board

## Development workflow

1. Start from the `development` branch.
2. Make the smallest coherent change that solves the problem.
3. Run the narrowest useful verification first.
4. Update nearby docs when behavior or setup changes.

## Local setup

Follow [README.md](./README.md) for day-to-day development or [docs/RUNBOOK.md](./docs/RUNBOOK.md) for more operational detail.

## Verification

Use the smallest relevant checks for your change. Common commands:

```bash
pnpm lint
pnpm build
pnpm exec tsc --noEmit
```

If your change affects ingestion or deployment, include the relevant manual verification notes in your pull request.

## Pull requests

- Keep PRs focused.
- Describe what changed and how you verified it.
- Call out anything still unverified or any follow-up work.
