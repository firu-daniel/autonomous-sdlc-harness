## Resolved values

The two tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<K>`, which this file's own text resolves): one is derived at runtime and one resolves from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Phase 1 — Get review context

1. **Read the code-review index** at `<repo_root>/<state_dir>/code_reviews/<branch>_code_review.md` to start implementing the review fixes. The index carries the Context paragraph + the `## Phase 2 Readiness — Ordered Fix List` (the iteration source of truth) + a `### K. Title` pointer per finding. The body of each finding lives in a self-contained per-finding file at `<repo_root>/<state_dir>/code_reviews/<branch>_code_review/finding_<K>.md` (folder name mirrors any round suffix: `<branch>_code_review_2/` for round 2). Read only the per-finding file for the item you are about to fix — the orchestration loop in Phase 2 resolves which one. Do **not** read all per-finding files upfront.
2. **Read `<repo_root>/<state_dir>/task_prompts/<branch>_task_prompt.md`** and the **story index** at **`<repo_root>/<state_dir>/story_plans/<branch>_story_plan.md`** if you need feature context to interpret a review item — both are optional reads, only when the review item references behavior you can't disambiguate from the finding file + diff alone. The story index carries no task bodies and no per-task links: tasks appear only as readiness entries `N. [ ] **Task K** — <short title>` under `## Phase 2 Readiness — Ordered Fix List` (match on `**Task K**`; the marker may already be `[x]`). Locate the entry, then — only if a finding cites a specific task — read the per-task file at `<state_dir>/task_plans/<branch>/task_<K>_plan.md`, whose own `### Task K — <title>` heading confirms the match.

## Phase 2 — Fix orchestration

**Read `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions.md`** and follow it. That file is the canonical loop (steps, sub-agent prompt rules, commit conventions, notes) — do not duplicate or reinterpret it here. The "index file" referenced in that loop is, in this flow, the code-review index (its `## Phase 2 Readiness — Ordered Fix List` is the iteration source; this flow dispatches no committer, so the orchestrator itself flips each entry to `[x]` as it ships (that loop's step 6) — the `[ ]` → `[x]` transition always belongs to the committing role, which is the `committer` agent only in the flows that dispatch one); the per-item detail file is the matching `finding_<K>.md`.

## Phase 3 — Write branch statistics once all fixes have landed

Run this **once**, only when the **last** code-review item has been fixed — i.e. **every** `[ ]` entry in the code-review index's (`<repo_root>/<state_dir>/code_reviews/<branch>_code_review.md`) `## Phase 2 Readiness — Ordered Fix List` is now `[x]`. Guard it on the full list being `[x]`; do **not** run it after each item — running per-item would write the file repeatedly. (The `statistics-plan-writer` overwrites its single `statistics.md`, but only the final all-`[x]` write is meaningful, so fire it exactly once at the end.)

Dispatch the `statistics-plan-writer` agent with the **first-write (pre-user-review)** prompt so the branch gets its `pre-user-review` statistics once all branch-review fixes have landed:

```
Write branch statistics. Branch: <branch>. Story index: <state_dir>/story_plans/<branch>_story_plan.md. Output: <state_dir>/branch_statistics/<branch>/statistics.md.
```

Dispatch with the first-write (pre-user-review) prompt above — the `statistics-plan-writer` agent owns the counting and the output format. Relay the returned `success_rate` / `statistics_file` to the user.

This is the fix-flow counterpart to the clean-pass write in `${CLAUDE_PLUGIN_ROOT}/instructions/code_review_instructions.md`: a review whose readiness list has no `[ ]` entries writes statistics there (no fix flow runs), a review with `[ ]` entries writes statistics **here**, after the fixes. The two paths are mutually exclusive — a clean pass never reaches this fix flow, so statistics are written exactly once per branch in the pre-user-review window.
