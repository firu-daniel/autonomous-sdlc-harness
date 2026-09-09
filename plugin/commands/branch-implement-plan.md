---
description: Implement the next unfinished item of the current branch's task plan, following the per-task implementation loop.
---

# Scope: Continue work on the current branch's task plan

## Context: A task plan has been created on the current branch. The next plan item not marked as done needs to be implemented

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): one is derived at runtime and two resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Steps
1. This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.
2. Determine the current git branch with `git branch --show-current`.
3. Confirm the **story index** exists at `<repo_root>/<state_dir>/story_plans/<branch>_story_plan.md` (the thin index: `## Context` + `## Phase 2 Readiness — Ordered Fix List`; per-task detail lives in `<repo_root>/<state_dir>/task_plans/<branch>/task_<N>_plan.md`). If missing, stop and tell the user to run `/branch-start-plan` first.
4. Read `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_implementation_instructions.md` for the implementation workflow rules (Phase 1 / Phase 2 / sub-agent guidance / commit conventions).
