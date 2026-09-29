---
name: commit
description: Run checks, agent code review, commit with AI message, and push
---

1. Run `npm run build`, `git diff --check`, and `git diff --cached --check`. This Nuxt project has no lint, typecheck, or test script; do not call the build a typecheck. Fix all errors before continuing; use an existing auto-fix command if one becomes available.
2. Run `git status --short`, `git diff --staged`, and `git diff`. Read intended untracked files too; exclude secrets and generated artifacts. Include all intended changes in the review input.
3. Fast review gate: spawn ONE subagent with the full diff and intended untracked contents. Review ONLY real bugs, regressions, leftover debug code, and unintended changes. Score each issue 0–100 confidence; pre-existing issues and stylistic nitpicks are false positives. Report ONLY issues scoring at least 80, with file:line and a one-line fix. If none, reply `CLEAR`. Keep this a fast last check, not a deep audit.
4. If `CLEAR`, proceed directly to step 5 and push without asking. If any issue scores at least 80, STOP, show the issues, then call `ask_user` with ONE `choice` question (`id: "land"`, question: "Want me to fix this first, or commit and push anyway?") and these options: "Fix it first, then commit & push" (recommended; hint: keeps the branch green), and "Commit & push anyway" (hint: issue stays open in the log). The card is the only ask; do not repeat options in prose. Only if `ask_user` is unavailable, ask the same two options in prose. On fix-first, fix, re-run step 1, then continue without another review; otherwise continue as-is.
5. Stage relevant files with `git add` and explicit paths, never `git add -A`. This repo excludes `.gg/` locally; if this command file is intended, review it and stage only it with `git add -f -- .gg/commands/commit.md`. Inspect `git diff --cached --stat` and `git diff --cached --check`; stop if anything unintended or sensitive was staged.
6. Generate a specific, concise commit message beginning with Add, Update, Fix, Remove, or Refactor; prefer one line.
7. Commit and push without another confirmation: `git commit -m "your generated message"` then `git push`. If either fails, report the failure; do not force-push or change Git configuration.
