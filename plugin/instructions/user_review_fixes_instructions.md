> **This is the supervised, one-item-per-session user-review fix flow — NOT the shared core.** The mode-free core for this family is `user_review_fixes_instructions_core.md`; its forks are `…_semi_autonomous.md` and `…_autonomous.md`. This file delegates its orchestration to `plan_orchestration_instructions.md` (the supervised item loop), not to the core.

---

## Resolved values

The two tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<K>`, which this file's own text resolves): one is derived at runtime and one resolves from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Phase 1 — Get fix-plan context

1. **Read the active user-review fix-plan index** at the path the calling command passed in (substituted for `<branch>_fix_plan*.md` references throughout this file). The index carries the Context paragraph + the `## Phase 2 Readiness — Ordered Fix List` (the iteration source of truth) + a `### K. Title` pointer per finding + the `## Source observations` section. The body of each finding lives in a self-contained per-finding file at `<repo_root>/<state_dir>/user_reviews/<branch>_fix_plan/finding_<K>.md` (folder name mirrors any round suffix: `<branch>_fix_plan_2/` for round 2). Read only the per-finding file for the item you are about to fix — the orchestration loop in Phase 2 resolves which one. Do **not** read all per-finding files upfront.
2. **Do not read** the task prompt, the story plan, or any code-review file. The fix plan is self-contained — every per-finding file already cites file:line and carries its own fix, and the `user-review-fix-plan-writer` agent copied the source observations verbatim into the index's `## Source observations` section. Re-reading the upstream artifacts only invites drift between what the user asked for and what gets shipped.

## Phase 2 — Fix orchestration

**Read `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions.md`** and follow it. That file is the canonical loop (steps, sub-agent prompt rules, commit conventions, notes) — do not duplicate or reinterpret it here. The "index file" referenced in that loop is, in this flow, the active fix-plan index from Phase 1 (its `## Phase 2 Readiness — Ordered Fix List` is the iteration source; this flow dispatches no committer, so the orchestrator itself flips each entry to `[x]` as it ships (that loop's step 6), same mechanism as the code-review fixes flow — the `[ ]` → `[x]` transition always belongs to the committing role, which is the `committer` agent only in the flows that dispatch one); the per-item detail file is the matching `finding_<K>.md`.

## Phase 3 — Update branch statistics once all user-review fixes have landed

Run this **once**, only when the **last** fix-plan item has been fixed — i.e. **every** `[ ]` entry in the active fix-plan index's `## Phase 2 Readiness — Ordered Fix List` (the index resolved in Phase 1, at `<repo_root>/<state_dir>/user_reviews/<branch>_fix_plan*.md`) is now `[x]`. Guard it on the full list being `[x]`; do **not** run it after each item — running per-item would re-write the file on every commit. (The `statistics-plan-writer` overwrites its single `statistics.md`, but only the final all-`[x]` write reflects the complete fixed scope, so fire it exactly once at the end.)

Dispatch the `statistics-plan-writer` agent with the **update (post-user-review)** prompt so the statistics get refreshed now that all user-review fixes have landed:

```
Update branch statistics. Branch: <branch>. Story index: <state_dir>/story_plans/<branch>_story_plan.md. User reviews: all <state_dir>/user_reviews/<branch>_review*.md. Output: <state_dir>/branch_statistics/<branch>/statistics.md.
```

This is an update/overwrite of the single `<state_dir>/branch_statistics/<branch>/statistics.md` (post-user-review status) — not a round-suffixed file; it re-runs after each user-review round. The `statistics-plan-writer` agent owns the counting, the cumulative glob, and the output format. Relay the returned `success_rate` / `statistics_file` to the user.
