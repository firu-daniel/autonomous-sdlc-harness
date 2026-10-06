### Task 15 — `docs/development.md`: the Gate 12 round 8 record, copied as written

**Goal:** `docs/development.md` → `## 5. Verifying a change` → Gate 12 carries round 8's record, in the same form as rounds 1 to 7. The record is evidence of what was observed against CLI 0.6.2, not a finding to fix. The task prompt says: *"copy it in as written. Its findings list points back at the numbered issues above, which are the work."*

**Depends on:** Task 14, the last task before this one. The paragraphs name findings 1 to 6, which Tasks 1 to 14 and 16 fix, and say they are *"carried to `fix_forge_run_control_gate12_round8_findings`"*. That is this branch, so every sentence stays true once the earlier tasks land.

**Where this task stops.** This task inserts the paragraphs and edits nothing else in the file. In particular, round 7's "What still owes a first recording" paragraph is a dated record of what round 7 left open, and it stays. The verified rows that round 8 settled move in `docs/remote-execution.md`, which is **Task 13's** work.

**Source:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round8_findings_task_prompt.md` → `## Dated paragraph for docs/development.md`.

### Targets

- `docs/development.md`: Gate 12, after round 7's closing paragraph (the one beginning `What still owes a first recording: (v)'s enable`) and before `**Setup.**`.

**Work:**

- [ ] **Copy.** Take the section's text from its first line, `**Round 8 — 2026-10-05 to 2026-10-06, CLI 0.6.2.** Scoped to observations (xiv), …`, through its last line, `- The rest of `docs/github-run-control.md` → `## 8.`.`. Copy it byte for byte: every paragraph, bullet list, numbered findings list and backtick. Leave out the `> The text below is round 8's record …` blockquote, which is an instruction to this branch, not part of the record.
- [ ] **Place.** Insert it after round 7's closing paragraph and before `**Setup.**`. Put one blank line before the inserted text and one after it, as between rounds 6 and 7. Change no other line.

**Verification:**

- Compare the inserted block with the task prompt's section, with the blockquote left out, using a mechanical comparison. One way is `diff` over the two line ranges, each taken with `sed -n '<first>,<last>p'` from its own file. They are byte-identical. A by-eye check does not count.
- `git diff --stat docs/development.md` shows insertions only.
- `**Round 7 — 2026-10-05, CLI 0.6.1.**` still comes before `**Round 8 — …**`, and `**Setup.**` follows the inserted block.
