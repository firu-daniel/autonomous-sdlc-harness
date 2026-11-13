### Task 14 — Make `user-review-fix-plan-writer`'s revision work by target file and leave a revision note

**Goal:** Replace `plugin/agents/user-review-fix-plan-writer.md`'s two gate-specific revision prompts with the round's single findings-revision prompt, add the revision note line to the user-feedback prompt, and point `## Revision mode` at the shared writer's procedure.

**Depends on:** Task 12, whose fix-plan core sends, after a review round that failed, `Revise the fix plan at <fix_plan_path> per review findings: <findings_files>.` then `Revision note: <state_dir>/plan_revisions/<branch>/fix_plan_<N>_revision_<fix_round>.md` (`<findings_files>` every findings file of the round, parity gate first, joined by `, `), and at step 11 `Revise the fix plan at <fix_plan_path> per user feedback: <feedback>.` followed by the same `Revision note:` line before the feedback blocks. Task 10 (`plugin/instructions/plan_review_rounds.md` → `## The writer's revision`, `## A rejection recorded under precedence`, whose fix-plan precedence is business parity, then architecture).

**Where this task stops.** The initial-write prompt, the lessons-ledger step (`## Process` step 6, initial-write mode only) and the `## Output contract` are unchanged.

### Targets

- `plugin/agents/user-review-fix-plan-writer.md`

**Work:**

- [ ] `## Invocation contract`: *"one of **four** prompts: one initial write and three revisions"* becomes **three**: one initial write and two revisions; replace the **Revision — business-parity findings** and **Revision — architecture findings** blocks with one **Revision — review findings** block (`## Flow` step 8's round close), and add the `Revision note:` line to the **Revision — user feedback** block (`## Flow` step 11).
- [ ] `## Revision mode`: *"under all three revision prompts"* → both revision prompts; cite `${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The writer's revision` for grouping by target file across every findings file, reading each finding against the unchanged text first, and the revision note (written last; a user-feedback revision writes one note line per feedback item); cite → `## A rejection recorded under precedence` beside the existing `## Rejected findings` paragraph, which keeps *"A user's own observation is authoritative: never record it here."*
- [ ] State that an `## Incidental findings (not gating)` entry is never acted on in a revision.

**Verification:**

- `grep -n "per business-parity findings\|per architecture findings\|four\*\* prompts\|all three revision prompts" plugin/agents/user-review-fix-plan-writer.md` finds nothing.
- `grep -c "Revision note:" plugin/agents/user-review-fix-plan-writer.md` is `2` — one per revision prompt block.
