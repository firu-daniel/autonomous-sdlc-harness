### Task 8 — `docs/development.md`: the Gate 12 round 9 record, copied as written

**Goal:** `docs/development.md` → `## 5. Verifying a change` → Gate 12 carries round 9's record, in the same form as rounds 1 to 8. The record is evidence of what was observed against CLI 0.6.3, not a finding to fix. The task prompt says: *"copy it in as written. Its findings list points back at the numbered issues 1–4 above, which are the work."*

**Depends on:** Task 7, the last task before this one, which edits the same file below **Setup.** The record's findings list names findings 1 to 4, which Tasks 1 to 7 address. Its sentence *"All four are carried to `fix_forge_run_control_gate12_round9_findings`."* names this branch, so every sentence stays true once the earlier tasks land.

**Where this task stops.** This task inserts the paragraphs and edits nothing else in the file. Round 8's teardown paragraph and its "What still owes a first recording" list are a dated record of what round 8 left open, and they stay. The procedure changes that round 9 calls for are **Task 7's**.

**Source:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round9_findings_task_prompt.md` → `## 5. Dated paragraph for `docs/development.md` (evidence, not an issue)`.

### Targets

- `docs/development.md`: Gate 12, after round 8's closing list (its last item is `- The rest of `docs/github-run-control.md` → `## 8.`.`, directly above `**Setup.**`) and before `**Setup.**`.

**Work:**

- [ ] **Copy.** Take the section's text from its first line, `**Round 9 — 2026-10-06, CLI 0.6.3.** Scoped to observations (xiv), …`, through its last line, the closing `- The rest of `docs/github-run-control.md` → `## 8.`.` of its "What still owes a first recording:" list. Copy it byte for byte: every paragraph, bullet list, numbered findings list and backtick. Leave out the `> The text below is round 9's record …` blockquote, which is an instruction to this branch, not part of the record.
- [ ] **Place.** Insert it after round 8's closing list and before `**Setup.**`. Put one blank line before the inserted text and one after it, as between rounds 7 and 8. Change no other line.

**Verification:**

- Compare the inserted block with the task prompt's section, with the blockquote left out, using a mechanical comparison. One way is `diff` over the two line ranges, each taken with `sed -n '<first>,<last>p'` from its own file. They are byte-identical. A by-eye check does not count.
- `git diff --stat docs/development.md`, read against Task 7's commit, shows insertions only for this task.
- `**Round 8 — 2026-10-05 to 2026-10-06, CLI 0.6.2.**` still comes before `**Round 9 — …**`, and `**Setup.**` follows the inserted block.
