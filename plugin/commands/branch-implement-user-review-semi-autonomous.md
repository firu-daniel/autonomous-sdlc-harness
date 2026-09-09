---
description: Implement every item of the current branch's user-review fix plan end-to-end without per-item pauses, then run the QA phase (semi-autonomous variant).
---

# Scope: Implement the current branch's user-review fix plan end-to-end (semi-autonomous variant)

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, `<K>`, and the `<fix_plan_path>` / `<fix_finding_dir>` this file's own step 3 computes and hands off): one is derived at runtime and two resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Context

This is the **semi-autonomous** variant of `/branch-implement-user-review`. The supervised flow fixes one fix-plan item per session and pauses for user review between items; this variant runs the entire fix plan end-to-end without supervision.

**Phase A (fixes) followed by a QA phase.** First, implement every item in the fix plan: for each item, dispatch the `layer-implementer` agent once per layer the item touches, bottom-up by layer, passing that layer as its dispatch argument (which layer that is comes from the routing table in `unit_loop_core.md`, not restated here); after each implementer, dispatch `layer-reviewer` for that same layer; loop up to 5 times until the reviewer returns `PASS`; then dispatch the `committer` agent to commit. One commit per item. Then run **Phase QA**: augment the UI-test plan via `ui-tests-plan-writer` (the user review may have asked for behaviour the original UI-test plan never described), then drive the running app through the UI-test plan via `qa-tester` and loop any QA findings back through the normal implementer / reviewer / committer agents until QA passes (reusing the task-plan flow's Phase E machinery, with a non-colliding QA-review round suffix). **Skip this phase unless `phases.qa` is `true` in `harness.config.json`.** There is still **no Phase B (end-of-branch diff review) and no Phase C (review-plan implementation)** in this flow — the user-review file the fix plan was derived from already IS the hands-on review, so another end-of-branch diff review here would re-find the same items the user chose to skip. (Phase QA verifies the app's behaviour in a browser; it is not a diff review, so that rationale still holds.)

You are the **orchestrator** for this entire session. You do not edit code, you do not commit, and you do not review specialist output beyond reading the 1-3 line contract each agent returns. The whole flow is built on context discipline — never read findings files, never re-verify implementer output, never bundle commits. (The one process you run directly is the background dev server in Phase QA — you own its lifecycle: start it, poll it, tear it down on pass or any halt.)

## Steps

1. **Working directory.** This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.

2. **Determine branch** with `git branch --show-current`.

3. **Resolve the active fix plan and confirm prerequisites:**
   - List the user-review fix plans for the branch and pick the latest:

     ```zsh
     ls <repo_root>/<state_dir>/user_reviews/ | grep -E '<branch>_fix_plan(_[0-9]+)?\.md$'
     ```

     Multiple rounds may exist as `<branch>_fix_plan.md`, `<branch>_fix_plan_2.md`, `<branch>_fix_plan_3.md`, … — pick the **latest** (highest numeric suffix; the unsuffixed file is round 1). That file is the fix-plan **index** (Context + `## Phase 2 Readiness — Ordered Fix List` + per-finding pointers + `## Source observations`) and is the **active fix plan** for the rest of this flow — pass its full absolute path as `<fix_plan_path>` to the orchestrator instructions. This command is the only place that value is computed: the receiving core takes it as **passed in by the calling command — use that path verbatim** and does not re-resolve the round.
   - **Resolve the per-finding folder.** The per-finding detail files live in a folder whose name mirrors the index's round suffix: `<branch>_fix_plan/` for round 1, `<branch>_fix_plan_2/` for round 2, etc. (i.e., the resolved index filename with the trailing `.md` dropped). Pass its full absolute path (`<repo_root>/<state_dir>/user_reviews/<branch>_fix_plan[_<N>]/`) as `<fix_finding_dir>` to the orchestrator instructions — likewise **passed in by the calling command — use that path verbatim** on the receiving side. Each item resolves to `<fix_finding_dir>/finding_<K>.md`.
   - **Halt if missing.** If `grep` returns no match, halt immediately with this exact user-facing message:

     ```
     No user-review fix plan found at <state_dir>/user_reviews/<branch>_fix_plan*.md. Run /branch-start-user-review-fix-plan first.
     ```

     Do NOT auto-dispatch the fix-plan-writer. The supervised `/branch-start-user-review-fix-plan` command exists for that and the user invokes it out-of-band.
   - **No task-prompt check.** The fix plan is self-contained (see `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions.md`); no task prompt is required.
   - **Working tree must be clean** (`git status --short` empty). If dirty, stop and tell the user — uncommitted changes would get caught in the first item's commit.

4. **Read `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_semi_autonomous.md`** and follow it. That file is this flow's **fork**: it carries the mode-specific binding values and runs the shared core by reference. **The canonical loop for Phase A and the subsequent Phase QA (UI-test augment + QA loop) — and for Phase D — is `user_review_fixes_instructions_core.md`**, whose implement → [review] → commit unit loop is in turn canonical in `unit_loop_core.md` (substitution row `UR-A`) and whose QA loop is canonical in `plan_orchestration_instructions_core.md` → `## Phase E — QA testing`. Enter through the fork; do not duplicate or reinterpret any of them here.
