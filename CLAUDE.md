# Unicorn Quiz Game

React + Vite front-end game. A unicorn walks around, talks to other unicorns, answers questions, and advances through stages to the ending.

## Rules
- Never change gameplay behavior during refactors. Mechanics stay identical unless explicitly told otherwise.
- Game logic (stages, questions, progress, answer checking) lives in a pure, typed state layer with no React or rendering imports. Views only read state and dispatch actions.
- Questions, dialogue and stage config live in data files, not JSX.
- `npm run build`, `npm run lint` and `npm test` must pass before every commit.
- Small commits with clear messages. Before starting new work, run `git checkout main && git pull`, then create a feature branch from it. Never commit to main.
- Before adding a dependency, state what it does and why in the commit message.
- Verify every visual change by running the dev server and taking screenshots (Playwright or Chrome tools). Check desktop and mobile widths.
- Respect `prefers-reduced-motion`; keep keyboard navigation working.
- If something in the existing code looks wrong or risky, note it in NOTES.md instead of silently changing behavior.