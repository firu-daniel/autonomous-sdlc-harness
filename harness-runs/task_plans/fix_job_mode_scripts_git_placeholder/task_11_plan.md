### Task 11 — Record F15 and PD31 in `docs/sandbox-verification.md`, restate the rows the fixes change, and describe the new anchoring and JS3's plant

**Goal:** Make the decision of record. F15's cause, the route taken, the two routes rejected, and what stays owed go into the record. So does PD31's cause and route. The documents that state how a wrapper anchors itself, and what JS3's plant does, then describe the code as it now behaves. **No measured result is invented.** Every runner result is owed to the story index's manual steps, and round 14's per-row results are recorded by hand afterwards (task prompt, *Afterwards*), not here.

**Depends on:** Tasks 1–10. The facts this task records:

- **F15's fix.** `hr_script_root <script_dir>` in `cli/templates/scripts/lib/harness-run-lib.sh` takes the nearest directory, `<script_dir>` included, holding a regular `harness.config.json` whose `git -C <dir> rev-parse --show-toplevel` answers itself. Otherwise it falls back to `hr_repo_root "<script_dir>"`. Eight library-sourcing scripts call it (Tasks 2 and 3). The four wrapper templates carry the same algorithm inline (Task 4). `hr_wrapper_main_of` and every `<scriptsDir>/.git` protection are unchanged. The launcher still pins `<target>/<scriptsDir>/.git` (Task 5). This repository's `scripts/` and the example's wrappers carry it too (Task 10).
- **PD31's fix (Task 6).** Each `/proc` read and its control runs as `bash <SP_CLONE>/sbx_pn_*.sh` or `sbx_nn_nnp.sh`, allowed by `Bash(bash <file>)`, with `@SP_AGENT_PID@` substituted by `sp_session --token-file`.
- **JS3's plant (Task 8).** One foreground `bash <scriptsDir>/scratch-run.sh <stateDir>/scratch/gate12_js3_stall.mjs`, silent for `STALL_KILL_SECS + 60` s once, guarded by `<stateDir>/scratch/gate12_js3_stalled`, with a Bash timeout of `(S + 60) * 1000` ms. `default-branch` refuses a `--stall-kill-secs` over 480.

This is the catch-all task, and it changes no code. Its implementer reads every configured layer's conventions document: `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`. Its site list is the story index's `## Scope register`, rows marked `change` and owned by Task 11.

### Targets

- `docs/sandbox-verification.md`: a new §5 row F15, a new §5 row PD31, and the measurement cells of PN1, PN2, PN3, NN2 and JS3.
- `docs/cli.md` §5: **Every wrapper anchors itself, then forwards its arguments.**
- `docs/development.md`: Gate 9 (ii)'s **The wrappers are observed rather than executed in place**, and Gate 12 step 8's `default-branch` paragraph.
- `examples/notes-app/README.md`: **A snapshot, not a live adoption.**

**Work:**

- [x] `docs/sandbox-verification.md` §5, new row **F15**, after F14 in the F table's shape:
  - **What was measured.** Quote verbatim from the task prompt's *What was measured* section: the runner and versions, the probe run `42030719431`'s refusal line, the full run `42032652140`'s park, and the three other parked jobs.
  - **The cause.** Steps 1–4 from the prompt's *The cause*, the character device `1, 3` reading included.
  - **The fix.** Route (a) as above. (b) is rejected because Claude Code chooses the session's placeholder and a `.git` directory on disk is `hr_wrapper_main_of`'s redirect. (c) is rejected because no equally strong route is measured.
  - **Owed.** GS1–GS4 and WF5 on a runner (manual step 1, and the scoped Gate 12 round after the release), and adopters' `init --force` for the `create-if-absent` scripts.
- [x] `docs/sandbox-verification.md` §5, new row **PD31**, after PD30. It quotes the four refused commands and the refusal *"Permission to use Bash has been denied because Claude Code is running in don't ask mode"*, notes that `dd` and `sudo -n true` ran, records the route (Task 6) and the fixtures (Task 7, `cli/test/sandbox-probe-runner-legs.test.mjs`'s `PD31:` cases), and leaves the runner confirmation owed.
- [x] `docs/sandbox-verification.md`, rows PN1, PN2, PN3 and NN2: the measurement cell says the read runs inside a probe-written script the session calls as `bash <file>` (PD31). Rows JS3: the measurement cell names the plant's `scratch-run.sh` stall past `STALL_KILL_SECS`. Leave every *Observed* and *Verdict* cell as it stands.
- [x] `docs/cli.md` §5's wrapper bullet, `docs/development.md` Gate 9 (ii)'s paragraph, and `examples/notes-app/README.md`'s snapshot paragraph:
  - **The new route.** The wrapper finds the nearest directory holding `harness.config.json` that git confirms as its own checkout's top, and falls back to asking git which checkout its own directory belongs to. This never walks through a `<scriptsDir>/.git` placeholder (F15).
  - **The example's answer is unchanged.** The example's configuration sits in a directory git does not confirm as a top, so the walk goes on to the repository that contains it, and *"resolves this repository"* stays true.
  - **The upgrade route (in `docs/cli.md` only).** An already-wired repository picks up the new wrappers only through `init --force`.
- [x] `docs/development.md` step 8, the `default-branch` paragraph: replace *"It then plants and dispatches an honest JS3 branch"* with the stalling plant: its one call, `S` and `T`, the marker, and that `--stall-kill-secs` over 480 is refused.

**Verification:**

- Re-run the story index's derivation entries 1–3. Every printed site is a register row, and each `change` row owned by Task 11 is edited.
- `grep -nE '^\| (F15|PD31) \|' docs/sandbox-verification.md` prints one line per id.
- No edited row's *Observed* or *Verdict* cell changed. Check with `git diff docs/sandbox-verification.md`.
- No edited sentence states a runner result for GS1–GS4, WF5, PN1–PN3, NN2 or JS3.

**Deviations from plan:**

- F15's quoted refusal line spells the runner's checkout as `<checkout>` instead of the literal runner path the task prompt quotes, and the cause's step 1 drops the prompt's local example path. Gate 6a (`scripts/check-machine-paths.sh`) fails on any line naming the running user's `$HOME`, so a literal runner home in this record would fail the gate on that runner; the row says `<checkout>` stands for the job's `$GITHUB_WORKSPACE`. Everything else in *What was measured* is quoted as the prompt gives it.
- JS3's set-up is stated in its *Expected* cell (*"a stalled honest job (lowered …)"*), which is where the row describes what is done; the stall is named there. Its *Check*, *Observed* and *Verdict* cells are unchanged.
- The F15 row names the five suites that cover the route, read from `git diff --name-only 9ae681cd HEAD -- cli/test`, rather than citing the tasks by number.
- Verification: derivation entries 1–3 re-run after the edits; every printed site is a register row (the new F15 and PD31 rows are rows 31 and 32; `examples/notes-app/README.md` and `docs/cli.md` §5 now also match entry 3, both rows already owned by this task). `grep -nE '^\| (F15|PD31) \|' docs/sandbox-verification.md` printed one line each. `git diff -U0 docs/sandbox-verification.md` removed only the PN1, PN2, PN3, NN2 and JS3 lines, and each replacement keeps its *Observed* and *Verdict* cells byte-identical. The selected tree guard `test/no-container-home-paths.test.mjs` passed (`# tests 1`, `# pass 1`), and `bash scripts/typecheck.sh` printed `PASS: typecheck`.
