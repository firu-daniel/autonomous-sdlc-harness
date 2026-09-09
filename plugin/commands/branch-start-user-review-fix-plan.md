---
description: Draft the current branch's user-review fix plan — a thin index plus one per-finding file — run both plan-review gates over it, and present it for approval.
---

# Scope: Start the user-review fix plan for the current branch

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, `<K>`, which this file's own text resolves): one is derived at runtime and three resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` | config value | `parity.referenceName` — the name of the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`. |

---

## Context

This is a **separate supervised flow** the user triggers after the semi-autonomous flow's Phase D (the hands-on review step). It reads a hand-written user-review file at `<repo_root>/<state_dir>/user_reviews/<branch>_review.md` and drafts a **split** fix plan: a thin index at `<repo_root>/<state_dir>/user_reviews/<branch>_fix_plan.md` plus per-finding detail files in the mirrored folder `<repo_root>/<state_dir>/user_reviews/<branch>_fix_plan/` (matching `_<N>` suffix on index and folder for later rounds). Before the drafted fix plan is presented for approval, the flow runs a `business-parity-reviewer` gate (plan-review mode) over the drafted fixes — catching `<parity_vocabulary>` business-logic deviations in the *planned* fixes before the user approves — then an `architecture-reviewer` gate (plan-review mode) over it — catching layer-placement / dependency-direction issues in the *planned* fixes before the user approves and before any code is written — looping back to the `user-review-fix-plan-writer` on FAIL until both gates PASS. The semi-autonomous orchestrator does NOT auto-trigger this command — it only points users here at the end of Phase D.

The parity gate is phase-gated: **Skip this phase unless `phases.parity` is `true` in `harness.config.json`.** With it off, the `architecture-reviewer` gate — which is ungated and always runs — is the only gate the drafted plan must pass, and "until both gates PASS" reads against that one.

## Steps

1. This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.

2. Determine the current git branch with `git branch --show-current`.

3. Confirm at least one user-review file exists for the branch:

   ```zsh
   ls <repo_root>/<state_dir>/user_reviews/ | grep -E '<branch>_review(_[0-9]+)?\.md$'
   ```

   If no match, stop and tell the user to write the review file first at `<repo_root>/<state_dir>/user_reviews/<branch>_review.md` — point them at `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md` for the format.

4. Read `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions.md` and follow it. That file is this flow's **supervised fork** and its entry point: it carries the binding values this mode supplies — the interactive extend / rewrite / stop question, the live `## Questions` surface, the escalation path, and the present-and-approve hand-off (steps 9–10). The **canonical loop** it runs is the mode-free core `user_review_fix_plan_writing_instructions_core.md` — `## Flow` steps 1–8 and step 11 (review-file discovery, round-suffix resolution, the writer prompts, both plan-review gates and their 5-iteration caps), `## Convergence`, and `## Context discipline`. Do not duplicate or reinterpret either file here.
