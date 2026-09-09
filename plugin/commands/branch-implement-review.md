---
description: Fix the next unresolved finding of the current branch's latest code review, following the fix-orchestration loop.
---

# Scope: Continue work on the current branch's review plan

## Context: A review plan has been created on the current branch. The next plan item not marked as done needs to be fixed

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
3. List the code review files for the branch: `ls <repo_root>/<state_dir>/code_reviews/ | grep <branch>`. The code review is **split** into a thin **index** file plus a per-finding detail folder. Multiple review rounds may exist as index files `<branch>_code_review.md`, `<branch>_code_review_2.md`, `<branch>_code_review_3.md`, … — pick the **latest** (highest numeric suffix; the unsuffixed file is round 1). That index file is the **active review file** for the rest of this flow. Its per-finding detail files live in the mirrored folder `<branch>_code_review/` (round 1) or `<branch>_code_review_<N>/` (round N), as `finding_<K>.md` — one self-contained file per `**Finding K**` readiness entry in the index.
4. Read `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_fixes_instructions.md` for the fixes implementation workflow rules (Fix Orchestration / sub-agent guidance / commit conventions). Where it references `<branch>_code_review.md`, substitute the active review index file from step 3; the per-item finding body lives in the mirrored `finding_<K>.md` detail file.
