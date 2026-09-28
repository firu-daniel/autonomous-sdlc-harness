### Task 8 — Give `architecture-reviewer` insertion point 4 (the test fix plan) and the test-run check

**Goal:** Make the existing `architecture-reviewer` the approving plan reviewer of the test fix plan, as plan-review sub-case (c). Make it raise a test-run request as a **Must Fix** in every plan it reviews. As the writer of the A2 findings, make it never ask for a test run.

**Depends on:** Task 5 and Task 7.
- **From Task 5:** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point (4): no plan asks for a test run, and every reviewer raises a breach as a Must Fix.
- **From Task 7:** the `test-fix-plan-writer`, which quotes log text only with machine paths rewritten (checkout-root paths to repo-relative, other home-directory paths to `<home>/…`). Task 7 states that rule in `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process`, as the step whose bold lead reads exactly **Rewrite machine paths before quoting.** That literal is the rule source this task cites for the sub-case (c) machine-path raise. Its index has the sections `## Context`, `## Phase 2 Readiness — Ordered Fix List`, `## Must Fix`, `## Not fixable on this branch` and `## Source failures`, plus a sibling folder of `finding_<N>.md` files. A FAIL from this reviewer re-dispatches that writer with `Revise the test fix plan at <test_fix_plan_path> per architecture findings: <findings_file>.`

**The dispatch block this task defines.** Task 9's `### G.2` sends it verbatim:

```
story_path: <test_fix_plan_path>
task_files_dir: <test_fix_findings_dir>
prompt_path: <test log path>
findings_folder: <test_fix_review_folder>
iteration: <fix_plan_iteration>
```

It carries no `diff_base`, so the mode selector resolves it to plan-review mode, and the return is unchanged: `verdict: PASS`, or `verdict: FAIL` plus `findings_file:` and `must_fix_count:`, with the flat `review_{iteration}.md`.

### Targets

- `plugin/agents/architecture-reviewer.md`.

**Work:**

- [ ] **Frontmatter and `## Invocation contract`.**
  - `description:` changes from *"Runs at three insertion points across the plan-writing, branch-implementation and user-review-fix flows"* to four, adding the Run gates phase.
  - In `### Plan-review mode (insertion points 1 and 3)`, the heading becomes *insertion points 1, 3 and 4*, and the *"two sub-cases"* sentence becomes three.
  - Add a **(c) Insertion point 4 — test fix plan** bullet, modelled on (b). It names `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.2 Write and review the test fix plan` as the dispatcher and carries the block above. The test fix plan index plays the story index, and its per-finding folder plays `task_files_dir`.
  - In the key table, extend `prompt_path` for (c): it is the machine-local test log the plan was written from, read as the requirement.
  - In the *"All three callers"* sentence about `<findings_folder>`, change three to four.
- [ ] **`## Process` step 2.** Add a sub-case (c) bullet: read the test fix plan index, **every** `finding_<N>.md`, and the log at `prompt_path`. Judge the planned placement of each fix as in (b).
  - The same bullet binds the findings this reviewer writes, which are committed through `findings_folder`: any log text it quotes is quoted **with machine paths rewritten** — an absolute path under the checkout root to its repo-relative form, any other home-directory path to the placeholder `<home>/…` — because gate 6a refuses a tracked file naming the home directory. This is the rule Task 7 states for the writer, restated here in the reviewer's own words.
  - Add the matching raise: a quoted absolute checkout-root or home-directory path in the test fix plan index or any `finding_<N>.md` is a **Must Fix** in sub-case (c), because the plan would fail the next gate run on its own text. The raise cites its source: `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.** It cites neither this repository's conventions documents nor gate 6a directly, because this agent is adopter-agnostic. The `## Rejected findings` paragraph already covers "story index and fix-plan index alike"; extend it to the test fix plan index.
- [ ] **The test-run check.** Add a bullet to `## What to check (the architecture checks)`:
  - **No plan asks for a test run.** In plan-review mode, a `**Verification:**` bullet, a finding's fix or a sub-step that asks for a test run the rule forbids — the configured test command, a gate script, or a test file the unit neither creates nor edits — is a **Must Fix**. Name the test command in words, never as the `<test_cmd>` token, which this file's `## Resolved values` does not declare.
  - Its source is `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`. That file is a rule source only once the next bullet puts it on `## Read first`, because `## Process` step 1 reads the rule sources from that list. Only then does the check satisfy *"Never flag something no rule-source file says."*
  - In implemented-solution mode, the findings you write for A2 carry no such request either.
- [ ] **`## Read first`, `## Scope boundary` and the findings folder.**
  - **`## Read first`: add two rule sources**, both under the existing *"A cited path you cannot read is a finding, not a fallback"* paragraph, so an unreadable one returns `blocker:`:
    - `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, read in every mode. It is the source of the **No plan asks for a test run** check.
    - `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**, read **in sub-case (c) only**. It is the source of the sub-case (c) machine-path raise.
  - **`## Scope boundary`: amend the closing sentence** *"**Only architecture violations are Must Fix.**"* so that it names the two new checks as Must Fix beside architecture violations. Suggested wording: *"**Only architecture violations, a plan's test-run request (`## The test-run rule`) and, in sub-case (c), a quoted machine path are Must Fix.**"* The sentence before it stays as it is: parity and styling issues remain Should Fix at most.
  - **`## Findings-folder / index-path convention`.** Add the (c) folder `<test_fix_review_folder>`, which is `<state_dir>/test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`.

**Verification:**

- `grep -n "insertion point" plugin/agents/architecture-reviewer.md` shows every count-bearing sentence agreeing on four. No line still says three.
- The (c) block's five keys are byte-identical to the block above: `story_path`, `task_files_dir`, `prompt_path`, `findings_folder`, `iteration`.
- `grep -n "The test-run rule" plugin/agents/architecture-reviewer.md` prints the new check's citation, and the heading resolves in `plugin/instructions/unit_loop_core.md`.
- `grep -n "<home>" plugin/agents/architecture-reviewer.md` shows the machine-path rewrite rule inside the sub-case (c) bullet.
- `grep -n "test_cmd" plugin/agents/architecture-reviewer.md` prints nothing: the file has no `<test_cmd>` hit, so no undeclared token.
- `grep -n "unit_loop_core.md" plugin/agents/architecture-reviewer.md` shows a hit inside `## Read first`, which runs from that heading to `## Process`.
- `grep -n "Rewrite machine paths before quoting" plugin/agents/architecture-reviewer.md plugin/agents/test-fix-plan-writer.md` shows the citation inside `## Read first` and the sub-case (c) raise in this file, and shows the cited step's bold lead in the writer's `## Process`.
- `grep -n "Only architecture violations are Must Fix" plugin/agents/architecture-reviewer.md` prints nothing, or prints only the amended sentence that also names the test-run and machine-path checks.
