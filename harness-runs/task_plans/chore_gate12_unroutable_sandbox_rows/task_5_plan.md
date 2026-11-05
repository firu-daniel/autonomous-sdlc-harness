### Task 5 — Grade SB2's two arms and its `remote_status.json` variant's `source` line, and print a `source` line for every `source`-route row

**Goal:** Make SB2 a row that can `pass`. Its `clarifications` arm is graded as today. Its new `pause-note` arm is graded on the `Save the state bundle` skip line for `<stateDir>/PAUSE_PROGRESS.md` and on that job's artifact. A `source` line covers the `remote_status.json` variant. `grade` also prints SB3 and JS3N on their new route.

**Depends on:**

- **Task 3**, which declares SB2's arms as `clarifications,pause-note`. Its `pause-note` arm's branch is recorded in `runs[]` with `row: "SB2"` and `arm: "pause-note"`, and its token at `.tokens.SB2_PAUSE_NOTE`. That job's session links `<stateDir>/PAUSE_PROGRESS.md` to the root file `gate12-sb2-pause-token.txt`. Task 3 also puts SB3 and JS3N on route `source`, whose `grade` output is *one `source` line whose evidence is the row's note*.
- **Task 1**, whose `hr_remote_status_write` removes a link at `<out_json>` before each rename. The variant's `source` line names it.

RJ2 is **Task 4's**, in `grade-plant.sh`. The tests are **Task 7's**.

### Targets

- `scripts/lib/gate12-sandbox-round/grade-state.sh`: its header, `g12_sb2_save_clause`, `g12_grade_sb2`, a new `pause-note` reader, and `g12_grade_state`'s row loop.

**Work:**

- [ ] Make the save clause take its leaf as a parameter: `g12_sb2_save_clause <run id> <leaf> <arm label>`. The `clarifications` arm passes `/clarifications/<branch>/gate12-link.md`, exactly as today. The `pause-note` arm passes `/$G12_STATE_DIR/PAUSE_PROGRESS.md`. The skip-line parse is unchanged: `G12_SB2_SKIP_PREFIX`, `G12_SB2_SKIP_SUFFIX`, both fields equal and ending in the leaf. A missing line stays a `fail` for `clarifications`, whose link is committed. For `pause-note`, a missing line is decided together with the artifact, in the next bullet.
- [ ] Add `g12_sb2pn_read` / `g12_sb2pn_arm`, beside `g12_sb2_read`, which stays the `clarifications` reader that SB4 uses unchanged. It reads `g12_arm_run SB2 pause-note`, the token at `.tokens.SB2_PAUSE_NOTE`, and the run's artifact (`none` / `expired` / `error` / a directory). It then decides the arm in this order:
  1. a link anywhere in the artifact (`find -type l`), or the token in any artifact file (`grep -r -l -F`), is `fail`, naming the first path;
  2. an `expired` artifact or log is `expired`, and a failed `gh` call is `not run` and raises 3;
  3. the skip line for the `PAUSE_PROGRESS.md` leaf, with `Save the state bundle` concluding `success`, is `pass`;
  4. no skip line, no link and no token is `not run`, with evidence saying that the link the planted task asks the session to make was not seen at `Save the state bundle`. The record keeps the full `Save the state bundle` log and every line of the artifact's `run.log` that carries `gate12_sb2_pause_link.mjs`, in full and never truncated.
- [ ] `g12_grade_sb2`: fold both arms in the existing fold.
  - **`clarifications`:** its save clause, `g12_sb2_bundle`, and the next-job clause, where a next job that never ran is still recorded `not run` and leaves the planted arm's verdict standing, as now.
  - **`pause-note`:** its one verdict from the reader above.
  - Print the fold's own result. `pass` is now possible, and the old *"never `pass`"* rewrite to `not run` goes. Evidence names each arm's run. The record goes through `g12_evidence SB2` whenever the row does not pass, as today. Drop the *"are hand steps"* suffix.
  - Then always print `g12_result_line SB2 source "cli/templates/scripts/lib/harness-run-lib.sh hr_remote_status_write: a link at autonomous_logs/remote_status.json is removed before each of the watcher's renames, so the remote_status.json variant is unreachable by construction"`.
- [ ] `g12_grade_state`'s last loop: keep printing `not run` with `hand step: <note>` for each selected `hand` row (RJ3 now). Add a loop that prints `g12_result_line <row> source "<note>"` for each selected `source` row (SB3, JS3N), reading the route from `g12_row_field <row> 3` and never from a row list typed here.
- [ ] Header: the SB2 line says *two arms folded; `pass` when both pass; then one `source` line for the `remote_status.json` variant*. The opening paragraph names the `source` rows beside the `hand` rows.

**Verification:**

- `bash -n scripts/lib/gate12-sandbox-round/grade-state.sh` exits 0.
- Grep `grade-state.sh` for the literal row IDs `SB3` and `JS3N` outside comments: there are none, because they are reached through their route.
- Read `g12_grade_sb4` and `g12_sb2_read`: both are unchanged, so SB4 still reads the `clarifications` arm's artifact only. The story index's Context states this.

**Deviations from plan:**

- The plan's ordered decision for the `pause-note` arm names no verdict for two states it reads. Implemented: an artifact of `none` is `not run` ("run <id> has no harness-state artifact"), taken with step 2; a state file with no `tokens.SB2_PAUSE_NOTE` is `not run` ("… was not searched for it"), after step 2 and before the skip-line check, so `pass` never rests on an unsearched artifact. Both mirror `g12_sb2_bundle`'s wording for the `clarifications` arm.
- `g12_sb2pn_read` / `g12_sb2pn_arm` sit at the head of the SB2 section, after `g12_sb2_bundle`, not directly beside `g12_sb2_read`: the arm calls `g12_sb2_save_clause`, and placing it there keeps the SB2 reader block (`g12_sb2_read`, `g12_sb2_bundle`) untouched. `g12_sb2_save_clause` signals a missing skip line through a new global, `G12_SB2_SAVE_NOLINE`, which the `pause-note` arm reads to turn the clause's `fail` into its own `not run` decision.
- The fold labels each `clarifications` clause `clarifications <clause>` (e.g. `clarifications Save the state bundle`), so the two arms are distinguishable in the evidence and the record.
- **Evidence downgrade — `bash -n scripts/lib/gate12-sandbox-round/grade-state.sh`:** the bare command was refused by the session's permission layer (don't-ask mode). The claim rests instead on `bash scripts/typecheck.sh` (the configured `commands.typecheck`), whose `check-shell-parse` leg reported `122 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` over every `git ls-files` shell file, this one included, followed by `PASS: typecheck`. Behaviour was additionally exercised by a scratch probe (`harness-runs/scratch/task5_sb2_probe.mjs`, run through `bash scripts/scratch-run.sh`) that stubs the run readers and drives `g12_grade_state` over three `pause-note` scenarios: skip line present → SB2 `pass`; no skip line, no link, no token → `not run` with the full `Save the state bundle` log and the `run.log` line carrying `gate12_sb2_pause_link.mjs` in the record; token in the artifact → `fail` naming the file. Each scenario printed the SB2 `source` line, and one `source` line each for JS3N and SB3.
- Verification bullet 2 (no literal `SB3` / `JS3N` outside comments): `grep -n -w -E 'SB3|JS3N'` over the file matches only the header comment line naming the `source` rows.
