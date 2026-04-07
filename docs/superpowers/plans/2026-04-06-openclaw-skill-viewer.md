# OpenClaw Skill Viewer — Implementation Plan

## Goal
Build a local-only web app in this repo that closely follows the provided Stitch UI language while remaining leaner and production-appropriate. The app must let Maxim browse all discovered OpenClaw skill folders by install-location category, default the library to ready skills, open a skill detail page, show a filesystem tree with `SKILL.md` selected by default, render markdown prettily, view source for any file, search by name and optionally content, and inspect git-backed file history and diffs.

## Constraints
- Public repo: commit only app code and docs. Never commit local skill contents, tokens, machine-specific secrets, or personal data.
- Local app only: read skill data from the host filesystem at runtime.
- View-only v1: no editing, delete, auth, or write APIs.
- Push directly to `main` for this pass.
- Match Stitch visual language closely enough to feel derived from it, but remove fluff and non-goal actions.

## Proposed architecture
- Frontend: React + TypeScript + Vite.
- Backend: lightweight Node/Express API embedded in the repo for local runtime filesystem access and git history lookups.
- Dev server: Vite on a fixed local port, proxying `/api` to the Express backend.
- Runtime data model:
  - Discover skills from three roots: built-in, workspace, other.
  - Compute metadata live from filesystem.
  - Determine `ready` using a conservative local rule first (`SKILL.md` exists) and support richer status fields if OpenClaw status source is located cleanly during implementation.
  - Watch filesystem changes with `chokidar` and expose a lightweight server-sent-event refresh channel.
  - Read git history from the skill folder’s owning repo when applicable; if a skill root is not in git, show history unavailable.

## Task 1 — Bootstrap repo and dependencies
### Files
- `package.json`
- `vite.config.ts`
- `tsconfig*.json`
- `index.html`
- frontend and server source trees

### Commands
- `npm install`
- `npm install express chokidar gray-matter markdown-it highlight.js fast-glob mime-types simple-git`
- `npm install -D concurrently @types/express @types/mime-types`

### Verification
- `npm install` completes.
- `npm run build` can eventually bundle frontend and backend without missing packages.

### Done condition
Repo has a working Vite+React app plus backend dependency set for local skill browsing.

### Commit boundary
- `chore: scaffold skill viewer app`

## Task 2 — Implement runtime skill discovery and metadata service
### Files
- `server/index.ts`
- `server/skills.ts`
- `server/types.ts`
- `server/config.ts`
- `server/utils/*`

### Commands
- Run app locally and hit API endpoints with `curl` or browser.

### Behavior
- Detect skill roots:
  - built-in: `/home/mmounier/.nvm/versions/node/v24.11.1/lib/node_modules/openclaw/skills`
  - workspace: `/home/mmounier/.openclaw/workspace/skills`
  - other: `/home/mmounier/.agents/skills`
- Exclude noise directories/files such as `.git`, `node_modules`, `dist`, `.DS_Store`, binary junk, and oversized irrelevant artifacts.
- Return library data with:
  - name
  - category
  - absolute path kept server-side only
  - relative/view path token for API routing
  - ready status
  - description/frontmatter summary from `SKILL.md` when available
  - last modified time
  - file count
  - folder size
  - git availability
- Provide `showReadyOnly` default behavior in API response helpers or frontend defaults.

### Verification
- `GET /api/skills` returns categorized skills.
- Totals roughly match discovered roots.
- No absolute local paths leak into committed assets or frontend source snapshots unless intentionally displayed nowhere.

### Done condition
Frontend can fetch a live skill library from local filesystem data.

### Commit boundary
- `feat: add live skill discovery api`

## Task 3 — Implement skill detail, tree, file, markdown, and raw views
### Files
- `server/tree.ts`
- `server/files.ts`
- `src/pages/SkillLibraryPage.tsx`
- `src/pages/SkillDetailPage.tsx`
- `src/components/*`
- `src/lib/api.ts`
- `src/lib/format.ts`

### Behavior
- Library page defaults to table view with category grouping, ready-only toggle, non-ready filter, search by name, optional content search checkbox.
- Clicking a skill opens detail page.
- Detail page shows:
  - header summary cards
  - file tree with first-level subdirs visible and expandable
  - `SKILL.md` auto-selected when present; otherwise first readable file
  - rendered markdown panel by default
  - raw/source toggle
  - syntax highlighting for code/text files
- Content search should search within readable text files only and avoid huge/binary files.

### Verification
- Selecting a skill opens `SKILL.md` by default.
- Clicking other files updates viewer.
- Markdown renders cleanly.
- Search works by name and optionally content.

### Done condition
The core skill viewer flow works locally end to end.

### Commit boundary
- `feat: add skill library and detail viewer ui`

## Task 4 — Add live refresh and safe local-only behavior
### Files
- `server/watch.ts`
- `src/hooks/useLiveUpdates.ts`
- `.gitignore`
- `README.md`

### Behavior
- Watch skill roots for file changes and notify the frontend through SSE.
- Frontend refreshes current skill/file/library metadata when updates occur.
- Ensure no runtime-cached skill data or downloaded skill contents are committed.
- Document local-only behavior and safety boundaries in README.

### Verification
- Editing a local skill file updates metadata/content in the browser after refresh event.
- Git status does not show accidental checked-in runtime dumps.

### Done condition
App behaves like a live debugging viewer for changing skill files.

### Commit boundary
- `feat: add live filesystem refresh`

## Task 5 — Add git history and diff view
### Files
- `server/history.ts`
- `src/components/history/*`
- `src/lib/diff.ts`

### Behavior
- For a selected file, show commit history from the owning git repo when available.
- Let user pick a commit and compare to current or compare two commits.
- Render unified diff in a readable viewer.
- Gracefully degrade when history is unavailable.

### Verification
- At least one git-backed workspace skill file shows commits.
- Diff viewer renders meaningful changes.
- Non-git or external paths show a clean unavailable state.

### Done condition
v1 includes usable history and diff inspection for skill files.

### Commit boundary
- `feat: add history and diff viewer`

## Task 6 — Stitch alignment pass and polish
### Files
- `src/index.css`
- theme/components/layout files
- `README.md`

### Behavior
- Reconcile app visuals with the inspected Stitch exports:
  - left nav shell
  - top app bar
  - cool-toned palette
  - Manrope + Inter typography
  - cards/table styling
  - tree/file viewer aesthetics
- Remove fluff actions not needed for v1.
- Set a stable local port and document startup.

### Verification
- Local UI visually tracks the Stitch design language.
- App launches on a documented localhost port.

### Done condition
App looks deliberate, not default-Vite.

### Commit boundary
- `style: align viewer with stitch ui`

## Task 7 — Verification, commit, and push
### Commands
- `npm run build`
- `npm run lint`
- `npm run dev` smoke test
- `git status`
- `git add ...`
- `git commit ...`
- `git push origin main`

### Verification
- Build passes.
- Lint passes or only contains intentional acceptable warnings resolved before push.
- Repo contains only app code/docs.
- App is runnable locally and reachable on documented port.

### Done condition
Maxim can pull/run the app locally and test the entire viewing flow.

### Commit boundary
- multiple direct commits to `main`, one per completed task cluster

## Notes on ready-status detection
Current local scan found 97 discovered skill directories and 96 with `SKILL.md`, which does not match Maxim’s gateway view of 98 total / 61 ready. During implementation, inspect OpenClaw runtime files or code paths for the canonical status source. If that source is not safely extractable in reasonable time, ship a pragmatic v1 readiness model with explicit labeling in the UI and a follow-up hook for canonical gateway readiness.

## Immediate execution choice
Execute inline in the current session after a quick plan review, because the work is concentrated in one repo and shared UI/backend context would make heavy subagent splitting noisy.
