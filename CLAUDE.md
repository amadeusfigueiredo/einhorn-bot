# Unicorn School

Browser game built with Vite, React 19, TypeScript and styled-components, using pnpm. Tests run with Vitest.

## Commands
- Use absolute paths and avoid chaining commands with `cd`.
- Wrap long commands in `timeout` and run typecheck, lint, test and build as separate commands (`pnpm build`, `pnpm lint`, `pnpm test`).
- Take screenshots against a production build: `pnpm build`, then `pnpm preview` as a background command. Never use `pnpm dev` or `networkidle` for screenshots.

## Git
- Never push to main. Work on feature branches with small commits.
