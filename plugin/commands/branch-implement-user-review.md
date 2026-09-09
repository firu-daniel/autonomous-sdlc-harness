---
description: Fix the next unresolved finding of the current branch's latest user-review fix plan, following the fix-orchestration loop.
---

# Scope: Continue work on the current branch's user-review fix plan

## Context: A user-review fix plan has been drafted on the current branch (via `/branch-start-user-review-fix-plan`). The next finding not marked as done needs to be fixed. For an unsupervised end-to-end variant that loops every fix-plan item without per-item pauses, see `/branch-implement-user-review-semi-autonomous`.

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, `<K>`, which this file's own text resolves): one is derived at runtime and two resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Steps
1. This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.
2. Determine the current git branch with `git branch --show-current`.
3. List the user-review fix plans for the branch:

   ```zsh
   ls <repo_root>/<state_dir>/user_reviews/ | grep -E '<branch>_fix_plan(_[0-9]+)?\.md$'
   ```

   Multiple rounds may exist as `<branch>_fix_plan.md`, `<branch>_fix_plan_2.md`, `<branch>_fix_plan_3.md`, … — pick the **latest** (highest numeric suffix; the unsuffixed file is round 1). That index file is the **active fix plan** for the rest of this flow. The fix plan is **split**: this index carries the `## Phase 2 Readiness — Ordered Fix List` + a `### K. Title` pointer per finding + the `## Source observations` section, and the per-finding detail files live in the mirrored folder `<branch>_fix_plan/` (round 1) or `<branch>_fix_plan_<N>/` (round N) as `finding_<K>.md` — one self-contained file per `**Finding K**` readiness entry.
4. Read `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions.md` for the fixes implementation workflow rules. Where it references `<branch>_fix_plan*.md`, substitute the active fix-plan index from step 3; the per-item finding body lives in the mirrored `finding_<K>.md` detail file.
