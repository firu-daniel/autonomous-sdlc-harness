# Context: instructions for Claude on how to conduct a full PR review.

## Resolved values

The tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): they resolve from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<layer_path_map>` | config value | `layers[].path` together with `layers[].conventions` — the paths a scope hint narrows a re-review to, and the rules document that layer is reviewed against. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`. |

---

## Flow

1. **Determine the current git branch** with `git branch --show-current`.

2. **Spawn the `branch-reviewer` agent** to produce the review. The agent's prompt should be self-contained:
   - The current branch name.
   - The expected paths for the task prompt and **story index** files (`<state_dir>/task_prompts/<branch>_task_prompt.md` and `<state_dir>/story_plans/<branch>_story_plan.md`) so it can read them for context. The story index carries the shared `## Context` + the readiness list; per-task bodies live under `<state_dir>/task_plans/<branch>/task_<N>_plan.md` if the agent needs a task's detail.
   - Any user-supplied scope hint (e.g., "focus on one layer's `conventions` compliance" or "skip the test files"), if given.

   The `branch-reviewer` agent's system prompt already covers diff-fetching, full file reads (no further sub-agent delegation for file reads), parity checks against the reference implementation (`<parity_vocabulary>`, at `<reference_impl>`), the Must Fix / Should Fix / Nice to Have format, the high-yield checklist, and the **split output** it produces — a thin **code-review index** plus one self-contained per-finding file per finding, with the `## Phase 2 Readiness — Ordered Fix List` section placed in the index (after Context, before the finding pointers). Do not duplicate or override those instructions in your prompt to it. *The parity item in that list applies only when `phases.parity` is `true` in `harness.config.json`; when it is `false` the agent has no reference implementation to compare against and the rest of its coverage is unchanged.*

3. **Present the review findings** returned by the agent to the user.

4. **If anything is unclear or seems off** in the review, do not patch over it — ask clarification questions. If the user wants a deeper pass on a specific area, re-spawn the `branch-reviewer` agent with a focused prompt (e.g., "re-review only the files under one layer's configured `path` from `<layer_path_map>`, narrowed to a single feature subtree of it, with extra attention to the checks that layer's `layers[].conventions` document defines — for a user-facing layer that is its component-size threshold and its rules on styling tokens and the localized-copy source").

5. **After the user approves**, the review is already on disk — the `branch-reviewer` agent writes the **index** at `<state_dir>/code_reviews/<branch>_code_review.md` plus per-finding files at `<state_dir>/code_reviews/<branch>_code_review/finding_<N>.md` (folder name mirrors any round suffix: `<branch>_code_review_2/` for round 2). Do not write or duplicate the review yourself.

6. **Branch statistics on a clean pass only.** If the index's `## Phase 2 Readiness — Ordered Fix List` has **no** `[ ]` entries to fix — a clean pass; note a Nice to Have finding is a readiness entry too, so it is not a clean pass — dispatch the `statistics-plan-writer` agent now so a clean branch gets its `pre-user-review` statistics immediately, with the **first-write** prompt:

   ```
   Write branch statistics. Branch: <branch>. Story index: <state_dir>/story_plans/<branch>_story_plan.md. Output: <state_dir>/branch_statistics/<branch>/statistics.md.
   ```

   Dispatch with the first-write (pre-user-review) prompt above — the `statistics-plan-writer` agent owns the counting and the output format. Relay the returned `success_rate` / `statistics_file` to the user.

   **If there ARE findings to fix, do NOT write statistics here.** The statistics write for a non-clean review happens after the fixes land — in the `/autonomous-sdlc-harness:branch-implement-review` fix flow (`${CLAUDE_PLUGIN_ROOT}/instructions/code_review_fixes_instructions.md`), once every review item is `[x]`. Writing here as well would double-write.

   Stop after this — fix implementation (when there are findings) happens in a separate session via `/autonomous-sdlc-harness:branch-implement-review`.
