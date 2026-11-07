### Task 7 — Repoint residual citations in `docs/development.md`, `docs/sandbox-verification.md` and the Gate 12 graders, add the roadmap rows §7 names, and record the trio guard's re-measurement

**Goal:**

- **Repoint** the remaining citations of a residual by number: in `docs/development.md`, in `docs/sandbox-verification.md` (pointer only, never inside an observed quote), and in the two Gate 12 grader scripts.
- **Add rows to the roadmap.** For every `docs/sandbox-record.md` → `## 7. Follow-ups this record names` bullet that carries the literal token `roadmap item <pending>`, add a numbered row to `docs/development.md` → `## 6. The roadmap this tree defers to`, then replace the token with that number.
- **Record the guard re-measurement Task 2 owes.** A change to any guard re-measures itself in `docs/guard-verification.md` (`.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`; `plugin/hooks/README.md`, closing paragraph). That file is in the `general` layer, so Task 2 cannot write it and this task does.

**Depends on:** Task 6, and through it Tasks 3–5. Also on **Task 2**, which changed `plugin/hooks/git-trust-file-guard.sh`'s header comment and the trailing citation of its `deny` reason, and no `case`, test or `deny`/`allow` branch. Task 2's file states that this task records its re-measurement.

- **Task 5's output.** It moved residuals 1–13 into `docs/sandbox-record.md` → `## 6. The residuals` with their numbers and residual 1's items 1–5 unchanged.
- **The `<pending>` bullets.** Tasks 3, 4 and 5 each appended them to that file's §7, in the form *`<the mismatch, stated as a proposal>` — roadmap item `<pending>`*.
- **What this task edits in `docs/sandbox-record.md`.** Only the `<pending>` tokens in §7. Bullets already citing roadmap item 21 stay as they are.

### Targets

- `docs/development.md`: scope-register rows 18–21, plus new rows in `## 6. The roadmap this tree defers to`.
- `docs/sandbox-verification.md`: scope-register rows 25, 26, 28 and 29.
- `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`G12_FR4_DEPARTURE`) and `scripts/lib/gate12-sandbox-round/grade-plant.sh` (the *"docs/cli.md §6, residual 1: Bootstrap the checkout's install and build"* comment): scope-register rows 43–44. These have no template, so they are this repository's own.
- `docs/sandbox-record.md`: the §7 `<pending>` tokens only.
- `docs/guard-verification.md` → `### 2.6 The file-tool trio guard`: one new dated re-drive line, below the existing `**2026-11-07, re-driven for `fix_sibling_glob_traversal`**` line. No row is added to the table. This file carries no residual citation (derivation entries A and B reach no site in it), so it adds no scope-register row.

**Work:**

- [ ] **`docs/development.md` citations.** Repoint each to `docs/sandbox-record.md` with the same residual number and item:
  - The **SB2's `autonomous_logs/remote_status.json` variant.** bullet's *"(`docs/cli.md` §6, residual 1, item 5)"*.
  - The `sandbox1c` §4 step 7 row JS4's *"(`docs/cli.md` §6, residual 1)"*.
  - Observation (xvi)'s **FR4** bullet's *"(`docs/cli.md` §6, residual 1, item 5)"*.
  - Gate 15's **The absent-path check, by hand.** *"`docs/cli.md` §6 residual 12 states"*.

  Leave §5's *"residual 0"* criteria (row 17) alone.
- [ ] **Roadmap rows.** For each `<pending>` bullet in `docs/sandbox-record.md` §7, in order, add one row to `## 6. The roadmap this tree defers to`'s table: the next free number after 21, then 22, 23 and on, with a *Delivers* cell stating the follow-up as the bullet does. Replace that bullet's `<pending>` with the number. No row says *shipped*.

  The section's closing rule is that every number `grep -rn -E "items? [0-9]+" . --exclude-dir=node_modules --exclude-dir=dist` reports must have a row. The record's own `residual 1, item 5` style matches that grep, and rows 3–5 already exist, so it adds no obligation.
- [ ] **`docs/sandbox-verification.md`, pointer only.** Repoint each of the following to `docs/sandbox-record.md` with the same number, changing no other word:
  - §6's **Claude Code's built-in protected paths in a run copy:** *"is `docs/cli.md` §6 residual 12"*.
  - Row FR4's **expected** cell *"(`docs/cli.md` §6, residual 1, item 5)"*.
  - Row JS4's expected cell *"(`docs/cli.md` §6, residual 1)"*.
  - Row SB2's expected cell *"(`docs/cli.md` §6, residual 1, item 5)"*.

  Leave these byte-identical, because they quote output:
  - Row AP9's quoted guard reason *"(docs/cli.md §6 residual 12)"* (row 24).
  - Row FR4's observed *"Departure: … (`docs/cli.md` §6, residual 1, item 5)"* (row 27).

  Add no row and change no verdict.
- [ ] **Gate 12 graders.** In `grade-full-run.sh`, change `G12_FR4_DEPARTURE`'s parenthesis to `(docs/sandbox-record.md residual 1, item 5)`, keeping the rest of the string. It stays inside the existing double quotes and adds no `$`, backtick or quote. In `grade-plant.sh`, change the comment to cite `docs/sandbox-record.md` residual 1.
- [ ] **Trio guard re-measurement.** Re-drive §2.6's rows T1–T17 on paired trees. Take `plugin/hooks` at this branch's merge base with `origin/dev` and at its tip, each with `git archive` into a scratch directory outside any checkout. Drive T1–T6 for each trio path and each of the three tools, T7–T13 for each tool, T14, T15's payloads, T16 and T17's, against the `git init` fixture §2.6's opening paragraph describes, using the guard's own `REPRO` block and `plugin/hooks/README.md` → `## Reproducing a decision by hand`. Compare **decisions** only. The `deny` reason's trailing citation is expected to differ between the trees, because Task 2 changed it, and that is not a moved decision.
  - Write one dated line under the existing `fix_sibling_glob_traversal` line, in its form: `**<date>, re-driven for `chore_unattended_sandbox_record`** on paired trees — `plugin/hooks` at the branch's merge base with `origin/dev` and at its tip, each taken by `git archive`: **<rows driven>** rows driven (<the row sets, as the existing line lists them>), **<hold count>** `hold`; `moved-by-branch`: none; `stale-before-branch`: <what was found, or none>.` Fill the counts from what the drive actually reports, never from the earlier line.
  - Add one sentence to that line stating that the branch's change is the header comment and the `deny` reason's citation only.
  - If any decision does move, stop and report it. Do not write `moved-by-branch: none`.
  - Add no row to the table and change no existing line.

**Verification:**

- Re-run scope-register entry A, `git grep -nIE "[Rr]esiduals? [0-9]" -- . ":(exclude)harness-runs"`. Every hit outside `docs/sandbox-record.md` either names `sandbox-record.md` on its line or is a `no-change` row of the register (rows 2, 4, 17, 24, 27). Re-run entry B. Its only hit outside `docs/sandbox-record.md` is `docs/cli.md`'s pointer line.
- `grep -n "<pending>" docs/sandbox-record.md` returns nothing, and each roadmap number §7 now cites has a row in `docs/development.md` §6.
- `git diff -- docs/sandbox-verification.md` touches only the four repointed citations: no verdict cell, no observed cell and no new row.
- `bash -n scripts/lib/gate12-sandbox-round/grade-full-run.sh` and `bash -n scripts/lib/gate12-sandbox-round/grade-plant.sh` both exit 0.
- `grep -n "chore_unattended_sandbox_record" docs/guard-verification.md` returns exactly the new line, under `### 2.6 The file-tool trio guard`. That line reports `moved-by-branch`: none, and its rows-driven count equals its `hold` count.
- `git diff -- docs/guard-verification.md` adds only that line (and its blank separator). It removes nothing and adds no table row.
