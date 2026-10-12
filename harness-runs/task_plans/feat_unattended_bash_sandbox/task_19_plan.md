### Task 19 — Correct the unlisted-call statements in the shared instruction modules

**Goal:** The shared instruction modules give agents rules whose stated reason is that the forbidden form *"stalls a headless run on a permission prompt"*. Under the `dontAsk` mode the generated profile now ships, that form is **refused at once**. The rule stays exactly as it is: the form still fails, and a commit or flip built that way still does not land. Only the stated consequence changes. Rewrite each sentence minimally. These are scope register rows 110–114 and 164.

**Depends on:**

- Task 15 — the default mode and the story's canonical restatement. State the default only. The `acceptEdits` override clause belongs to `docs/cli.md` §6 and `docs/watcher.md` §4.
- Task 9 — it edits `autonomous_pause_and_ledger.md` §1.6, `dispatch_discipline_instructions.md`, `improvement_observations_instructions.md` and `clarification_digest_instructions.md` first (the push spelling, the `<MAIN_REPO>` rows). This task edits none of the lines Task 9 wrote.

**Where this task stops.** The rules themselves, their code blocks and every ⚠️ paragraph's instruction stay byte-identical except for the consequence clause. `improvement_observations_instructions.md` 16 and 136 use *stall* generically (*"the dispatch that stalled"*, *"~20 min stall"*) and stay.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md` — 296, 309, 468, 492, 498, and *"no shell-expansion stall on `${branch}`"* (row 164).
- `plugin/instructions/dispatch_discipline_instructions.md` — 125, 130.
- `plugin/instructions/improvement_observations_instructions.md` — 146, 159, 179, 189.
- `plugin/instructions/clarification_digest_instructions.md` — 77.
- `plugin/instructions/docs_phase_instructions.md` — 49.

**Work:**

- [ ] `autonomous_pause_and_ledger.md`:
  - 296 *"so the run **stalls on a permission prompt it cannot answer"*;
  - 309 *"If a flip ever does hang on an unanswerable permission prompt, treat the commit as **not** …"* → if a flip is ever refused. Keep the instruction that follows;
  - 468 *"falls through to neither `allow` nor `deny`) and stalls"*;
  - 492 *"and stalls in the headless `-p` profile"*;
  - 498 *"so a bare `rm` stalls rather than being refused"* → so a bare `rm` is refused;
  - *"safety (no shell-expansion stall on `${branch}`, explicit-path staging …"* → no shell-expansion refusal on `${branch}`. The rest of that list stays.
- [ ] `dispatch_discipline_instructions.md`: 125 *"falls through to `ask` and **stalls** a headless run"*; 130 *"sit in the headless profile's `ask` list, so either would stall the run"* → so either is refused. The *"revert with the file tool"* instruction stays.
- [ ] `improvement_observations_instructions.md`:
  - 146, the example *"a quoted wrapper path failing the allowlist guard and stalling on `ask`"* → and being refused on `ask`;
  - 159, the bold lead *"A raw `git commit` stalls a headless run."* and its sentence → is refused in a headless run;
  - 179, both *"would stall"* clauses;
  - 189 *"the run **stalls on a permission prompt it cannot answer headlessly**"*.

  Keep *"the commit is silently **NOT** made"* only if still accurate. The commit is not made; reword *silently* to say the refusal is the only sign.
- [ ] `clarification_digest_instructions.md` 77 *"Why an `if …; then … fi` wrapper is a headless stall"* → is refused headless. `docs_phase_instructions.md` 49 *"the gate stalls a headless run"* → the gate is refused in a headless run.

**Verification:**

- Re-run derivation entry G's two commands with `-n` in place of `-l` and the five targets as the pathspec. The only remaining hits may be `improvement_observations_instructions.md` 16 and 136. Re-run derivation entry H's first step and read each hit in the five targets with its whole sentence: every remaining one is a park on a question file.
- Every code block in the five files is byte-identical to its pre-task form: `git diff` shows changes only in prose lines.
- Every `${CLAUDE_PLUGIN_ROOT}`-rooted citation in a changed sentence still resolves to an existing heading (`.claude/context/plugin.md`).

**Deviations from plan:**

- `autonomous_pause_and_ledger.md` 471 and `dispatch_discipline_instructions.md` 126: the plan targeted only *"and stalls"* / *"and **stalls** a headless run"*, but the cause clauses beside them (*"falls through to neither `allow` nor `deny`"*, *"falls through to `ask`"*) are themselves hits of derivation entry G's second command, so the verification bullet (only `improvement_observations_instructions.md` 16 and 136 may remain) could not hold with them kept. Reworded to *"matches no `allow` or `deny` rule) and is refused"* and *"lands on `ask` and **is refused** in a headless run"*; the instruction in each sentence is unchanged.
- Verification as executed: entry G's two commands (second with `-n`) over the five targets return only `improvement_observations_instructions.md` 17 and 137 (the plan's 16 and 136, shifted by one line); entry H's first step returns those two plus park-on-a-question-file hits only. `git diff -U0` shows 15 changed prose lines and no changed fence line. Cited headings `## Push`, `## Commit mechanics (single source of truth)` and `### 1.6` exist. `bash scripts/typecheck.sh` printed `PASS: typecheck`.
