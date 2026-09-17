### Task 4 — Qualify the analyze command in `doctor`'s checks and update `doctor.test.mjs`

**Goal:** Every remedy `doctor` prints that names the analyze command spells it `/autonomous-sdlc-harness:harness-analyze`. That covers the `setup-analysis` warnings, the `task-offer-rules` note, the `layer-profile` remedies, and the layer-gap remedy it passes to `layerGapRemedy`. The suite that pins those lines moves with them.

**Where this task stops.** `cli/src/core/layerGapRemedy.ts` takes the command as its `analyzeCommand` parameter and names none itself. Its header says `init` and `doctor` each keep their own constant. So this task changes the value `doctor` passes and does not touch that module. `init`'s constant is Task 2's. No check's grading (`pass` / `warn` / `fail`) changes.

### Targets

- `cli/src/doctor/checks.ts`
- `cli/test/doctor.test.mjs`

**Work:**

- [ ] `checks.ts`: define `ANALYZE_COMMAND` as `` `/${PLUGIN_NAME}:harness-analyze` ``, importing `PLUGIN_NAME` from `../generators/projectSettings.js`. The module already imports from `../generators/`. Update its doc comment, *"spelled as `init` and every stub footer spell it"*, so that it stays true: both of those now spell it qualified.
- [ ] `checks.ts`: qualify the doc comment near the `setup-analysis` trace, *"a trace `/harness-analyze conventions` clears"*.
- [ ] `doctor.test.mjs`: set `ANALYZE_COMMAND` to `'/autonomous-sdlc-harness:harness-analyze'`. Respell the literal layer-gap remedy (*"If any of them is a real layer, run `/harness-analyze` in a session here …"*) and the comments that name the command. The `${ANALYZE_COMMAND} --yes` negative assertion stays as it is, now on the qualified constant.

**Verification:**

- `bash scripts/test.sh` exits 0, including the `setup-analysis`, `layer-profile`, `layer-drift` and `task-offer-rules` cases.
- `grep -n '/harness-analyze' cli/src/doctor/checks.ts cli/test/doctor.test.mjs` prints nothing. Any line it prints is a site this task missed.
- **Deviations from plan:** `bash scripts/test.sh` exited 1, not 0: its gate 4 (`npm test`) passed, and the sole failure was gate 6a `no machine paths`, whose hits are the worktree's `.git` pointer file, `harness-runs/scratch/t3npm.log` and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` — none of them this task's targets. The `grep -n '/harness-analyze'` verification printed nothing.
