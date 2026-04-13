# OpenClaw Skill Viewer

Local-only web UI for browsing OpenClaw skills from the filesystem.

## What it does

- discovers skills from multiple local roots
- groups skills by install location
- filters the library by ready / not-ready setup state
- opens a skill detail page with file tree + default `SKILL.md` view
- renders markdown nicely and supports raw source view
- watches for local changes and refreshes via live updates

This repo is intentionally **view-only**. It reads skill data from the local machine at runtime and does not edit skill files.

## Local skill roots

The app currently reads from these locations:

- built-in: `~/.nvm/versions/node/v24.11.1/lib/node_modules/openclaw/skills`
- workspace: `~/.openclaw/workspace/skills`
- other: `~/.agents/skills`

## Stack

- frontend: React + TypeScript + Vite
- backend: Express + TypeScript

## Scripts

```bash
npm run dev     # Vite client + API server
npm run build   # typecheck + production build
npm run lint    # eslint
npm run start   # serve the built app on http://127.0.0.1:4174
```

## API

Runtime API endpoints are served from the same origin:

- `GET /api/health`
- `GET /api/skills`
- `GET /api/skills/:skillId`
- `GET /api/skills/:skillId/file`
- `GET /api/events`

## Notes

- local paths stay server-side; the UI uses route-safe skill ids / path tokens
- readiness comes from the local OpenClaw gateway skill status output
- this is a local tool, not a hosted multi-user service
