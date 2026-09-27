### Task 10 — Add the Phase G commit and fix-loop callers to `committer.md`'s caller table

**Goal:** Keep the committer's restated caller table in agreement with the flows that dispatch it. Phase G adds one `review_plan_file` caller (G.3) and one `review_item` caller (unit-loop row `G.4`).

**Depends on:** Task 5 and Task 9. The callers, restated:
- **Task 5's row `G.4`:** mode `review_item`, `plan_path` = `<test_fix_plan_path>`, and `task_heading: <finding_heading>`, the matching `### K. <title>` heading in the test fix plan index. Task 5 also renamed that file's `#### The five fix rows` heading to `#### The fix rows`.
- **Task 9's `### G.3 Commit the test fix plan`:** mode `review_plan_file`, `plan_path: <test_fix_plan_path>`, `commit_prefix: chore`, and `meta_findings_folder: <test_fix_review_folder>` only when that folder exists and is non-empty. The subject is the existing fixed `chore: add code review for <branch>`.

### Targets

- `plugin/agents/committer.md` → `### Which caller sends which mode`.

**Work:**

- [ ] Row 2, *"The same loop's five fix rows — `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3`"*: becomes the loop's fix rows, adding `G.4`, and its `plan_path` cell adds `<test_fix_plan_path>`.
- [ ] Row 4, *"`…/plan_orchestration_instructions_core.md` → A1.5.2, A2.2, B.3, C2.3, and E.2's round-FAIL step 3"*: add G.3. Rewrite its note that B.3 and C2.3 are *"the only two of these phases whose index is meta-reviewed … A1.5.2 / A2.2 / E.2 run no meta-review and pass none"*. It becomes: B.3, C2.3 and G.3 pass `meta_findings_folder`, G.3's being the architecture gate's plan-review folder, under the same caller-side existence guard.

**Verification:**

- `grep -n "five fix rows\|only two of these phases" plugin/agents/committer.md` prints nothing.
- `grep -n "G.3\|G.4" plugin/agents/committer.md` shows both new callers. Each cited section resolves: `### G.3 Commit the test fix plan` in `plugin/instructions/plan_orchestration_instructions_core.md`, and the `G.4` row in `plugin/instructions/unit_loop_core.md`.
- No mode, argument name or fixed subject changes. Check with `grep -n "chore: add code review for" plugin/agents/committer.md`, whose hits are unchanged.

**Deviations from plan:** Also added `<test_fix_plan_path>` and `<test_fix_review_folder>` to `committer.md` → `## Resolved values`' list of caller-side placeholders "reproduced here but resolved **there**", since the two rows now quote them. The file's other targets were left untouched.
