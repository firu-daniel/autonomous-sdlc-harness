### Task 4 — Write §4, the measured results per leg, and §5, the Linux runner's PID namespace and no-new-privileges

**Goal:** Fill two sections of `docs/sandbox-record.md`:

- **§4:** the measured results table, one row per gate leg and platform, each carrying its date, platform, Claude Code version, evidence row ids and verdict.
- **§5:** the Linux runner's PID-namespace and no-new-privileges results, under the stable heading sandbox4 cites.

Every cell is read off `docs/sandbox-verification.md`. A leg that was not run on a platform is *not yet measured* and is never inferred from another platform.

**Depends on:** Task 3. That task creates `docs/sandbox-record.md` with the headings `## 4. The measured results, per leg` and `## 5. The Linux runner's PID namespace and no-new-privileges`, each holding one placeholder sentence that this task replaces. This task edits **only** those two sections and appends bullets to `## 7. Follow-ups this record names` in the form Task 3 set: roadmap item 21 for a measurement still owed, the literal `roadmap item <pending>` for any other mismatch. It renames no heading, and §5's heading text is a wire sandbox4 cites.

### Targets

- `docs/sandbox-record.md`: §4, §5, and appended §7 bullets.

**Work:**

- [ ] **Where the legs come from.** The leg list is `docs/development.md` → **Gate 15**'s leg table (`| Leg | Rows | Expected | Recorded in |`) and its job-mode table, plus Gate 12's full-run leg (`docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`).
- [ ] **What the platforms are:**
  - macOS, headless: the probe's runs, `docs/sandbox-verification.md` §0.
  - Linux in Gate 15's local container: §0 and §8.
  - The GitHub-hosted runner in job mode: §9.
  - The real job's full run: §10.
- [ ] **§4's table.** Columns: `Leg | Platform | Date | Claude Code | Rows | Verdict`. Emit one row for every leg × platform pair the leg tables say a leg runs on, including a pair whose rows read *not yet measured*, owed or `not run`.
  - **Verdict cell.** Copy the row's own latest verdict, and where rows of one leg differ, say so per row id. For example, `pass` (N1, N2, N3), `fail` (N4).
  - **Date and Claude Code cells.** Take them from the row's stamp or its round's stamp.
  - **No measured result:** write *not yet measured* in the verdict cell and `—` in the date and version cells.
- [ ] **§5.** This is the write-up of `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs` for the `runner-pid` and `runner-privs` legs.
  - **Per row:** PN1, PN2, PN3 (PID namespace) and NN1, NN2 (no-new-privileges), each with its verdict, round, run date, runner image (`ImageOS` / `ImageVersion` from §9's stamp), CLI release and Claude Code version.
  - **The expectation.** State the expectation the rows were graded against: the sandbox-runtime README's *"its own PID namespace and a fresh `/proc`"*, checked 2026-10-24, is the expectation, not the result. Nothing in the documentation covers no-new-privileges.
  - **Earlier rounds.** Say which round first measured them and why earlier rounds printed `not run` (§5 PD31), by row id only.
  - **What is still unmeasured.** End with one sentence on what the results do not cover: a self-hosted runner, or another image. Each such gap is a §7 bullet citing roadmap item 21.
- [ ] **§7.** Add one bullet per mismatch found while reading. Examples: a leg table naming a row the evidence record lacks; a `Recorded in` column pointing at the wrong section; a §0 stamp disagreeing with a row's date. Fix none of them.

**Verification:**

- Re-derive the leg list from `docs/development.md`'s two Gate 15 leg tables plus the full-run leg. Every leg × platform pair appears as a §4 row, with none missing and none added.
- For every §4 and §5 row, the verdict and date match the cited rows in `docs/sandbox-verification.md`. Spot-check every row whose verdict is not `pass`, and every row of §9.
- `grep -n "^## 5\. " docs/sandbox-record.md` prints `## 5. The Linux runner's PID namespace and no-new-privileges` exactly.
- No §4 or §5 cell carries an observed quote, and none fills one platform's cell from another platform's row.
