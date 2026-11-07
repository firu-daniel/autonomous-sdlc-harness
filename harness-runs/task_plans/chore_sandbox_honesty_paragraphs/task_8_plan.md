### Task 8 — Bring `docs/remote-execution.md`'s sandbox-series statuses and post-session containment bullets in line with the record

**Goal:** `docs/remote-execution.md`'s sentences on what contains a remote job's session, and on what stands for the steps that run unsandboxed after it, carry the verdicts Gate 12's sandbox series rounds recorded, rather than *not yet measured*, and point at `docs/sandbox-record.md` and `docs/sandbox-verification.md` §10 for them.

**This is a catch-all task** (`path` `"."`): its implementer reads every configured layer's conventions document.

**Where this task stops.** `docs/remote-execution.md` only. The two sandbox3c pointers in it stay as they are: the `[`sandbox-record.md`](sandbox-record.md) → `## 6. The residuals`, residual 12 and residual 1, item 5 citations in **The post-session steps on a job that passed.**, and the whole bullet **Residual: `Bootstrap the checkout`'s configured commands …**. `docs/sandbox-verification.md` is not edited.

**The verdicts, as `docs/sandbox-verification.md` §10 and §9 record them** — read each row's verdict cell before writing; state none more strongly, and keep each row's own round and date:

- FR1 **pass** (round 15, 2026-11-05) — the job's copy, its profile and the launch check; record §4's full-run leg (FR1–FR7 **pass**, round 15).
- RJ2 **pass** (round 16, 2026-11-06), the launch-check clause read from the source.
- RJ3 **pass** (`start`: round 14; `review`: round 15).
- FR3 **fail** in round 13, **pass** in round 15; CS6 (runner) **pass** (rounds 14 and 15).
- FR5 and FR6 **pass** (round 15); SB2 per its cell (`clarifications` **pass**, the other variants as the cell gives them); SB3 *read from the source*; SB4 **pass** for the bundle half, and its optional half measured in round 17 (2026-11-07): the pinned `upload-artifact` follows a link and publishes the target's bytes (record residual 1, item 5, which owns it).
- JS1 **pass** (round 14); JS4 **pass** with the documented residual (round 14); JS3 **not run** (rounds 14 and 15: F16, #273); JS3N *read from the source*.
- The run-copy glob treatment the bullet calls *unverified* is measured: AP2 and GW1 (record residual 2).

### Targets

- `docs/remote-execution.md` → `## 6. What is not verified here`: its opening paragraph, and the four rows its sentence *"the last four rows are taken by Gate 12's sandbox series round"* names.
- `docs/remote-execution.md` → the bullets **The post-session steps on a job that passed.** and **The check on a real GitHub job is a post-release follow-up, not yet run.**

**Work:**

- [ ] **§6's opening paragraph.** Replace *"the last four rows are taken by Gate 12's sandbox series round: the first three of them not yet measured, and the fourth measured in round 13 (2026-11-05), with its fix's effect owed to the next round"* with one sentence giving each of the four its recorded state from the list above, citing `docs/sandbox-verification.md` §10 and §9. Keep the rest of the paragraph.
- [ ] **§6's four rows.** In each row's *Source* cell replace the *not yet measured* / *not observed* text with the row's verdict, round and date, keeping the step and section citations that say where it is taken: the FR1 row (*A real `run` job, under the base profile passed unchanged …*), adding [`sandbox-record.md`](sandbox-record.md) §4; the RJ2 row (*A branch whose profile fails `run_profile_check` …*); the RJ3 row (*A local `remote-run.sh start <branch>`, then `review` …*); and the `actions/checkout` v7.0.1 row, whose *"The fix's effect is not yet measured: the next Gate 12 round's FR3 and CS6 (runner) … take it"* becomes their verdicts. Leave every *What rests on it* and *If it is wrong* cell as it is.
- [ ] **The post-session steps on a job that passed.** Replace *"with its rows in [`sandbox-verification.md`](sandbox-verification.md) §10, all *not yet measured*"* and the clauses naming FR6, SB2, SB4 and SB3 with their recorded states. Replace *"rather than the unverified run-copy globs"* with words that state the glob treatment as measured, citing [`sandbox-record.md`](sandbox-record.md) residual 2. Keep every sandbox3c pointer in the bullet.
- [ ] **The check on a real GitHub job …** Keep the bullet's lead and its four numbered steps with their fenced commands exactly as they are. Replace *"It is taken, still not yet run, in Gate 12's …"* with the recorded states of FR5, JS1, JS4, JS3 and JS3N, keeping where each is taken.

**Verification:**

- `git grep -n -E "not yet measured|not yet run|unverified run-copy" -- docs/remote-execution.md`: read each remaining hit; none states a row this task's list gives a verdict for.
- `git grep -c -F "sandbox-record.md" -- docs/remote-execution.md` is not lower than before the edit.
- `git diff -- docs/remote-execution.md` leaves every fenced block byte-identical.
- Re-read each verdict written against its row's verdict cell in `docs/sandbox-verification.md`; none is stronger and none drops its round.
- Re-run the story index's derivation entry C over `docs/remote-execution.md` and confirm every reached hit is a register row.
