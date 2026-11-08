# Architecture review — iteration 3

The iteration-2 Should Fix is applied. `task_1_plan.md` → **The header** now says the template header states every accepted record shape itself. It cites the shipped `run-test-suite.sh` → `WHAT A GATE IS TOLD` as the allowance for `<label>.<suffix>` records, and names `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs` only as current writers *"in the harness's own repository"*. A matching **Format-ownership text check** is under **Verification:**. I re-read Tasks 1–7 against `.claude/context/cli.md`, `.claude/context/plugin.md`, `.claude/context/conventions.md` and the lessons ledger and found no layer-placement, dependency-direction or test-run-rule violation:
- Each target sits in the layer its tag names.
- The lane path still has one owner, `hr_test_run_lane_dir`.
- `harness-run-lib.sh` takes comment edits only.
- Each task's verification runs only its own new suite.

## Must Fix

None.

## Should Fix

1. **The same audience defect, at a second site in the same template header** — `task_1_plan.md` → **The header**, the bullet beginning *"**`$known` reaches this mode through a file, never through argv.**"*. It tells the writer to state Linux's `MAX_ARG_STRLEN` limit in the shipped header with the parenthetical *"this repository records it as `cli/test/helpers/fixture.mjs` → `MAX_ARG_STRING_BYTES`"*.
   Rule source: `.claude/context/cli.md` → `## What this layer owns, and what it is not` → *"Settle which audience a file serves before editing it. … `cli/templates` and `cli/scripts` change what a future adopter receives"*.
   `cli/templates/scripts/lib/run-analytics.jq` is written into every adopting repository. In an adopter's checkout, "this repository" means the adopter's own repository, which has no `cli/test/helpers/fixture.mjs`. So the header would point the reader at a file that does not exist. This is the class the iteration-2 finding closed for the record producers, and the fix uses the same wording.
   **Fix:** In `task_1_plan.md` → **The header**, in that bullet, either drop the parenthetical (the limit is already stated: *"131072 bytes on 4 KiB pages"*), or reword it to *"in the harness's own repository, `cli/test/helpers/fixture.mjs` → `MAX_ARG_STRING_BYTES` records it"*. Then extend the **Format-ownership text check** under **Verification:** so it also confirms that the template header never says "this repository" about a file that exists only in the harness's own tree. If you reject this finding, record it under `## Rejected findings` in the story index with the reason.

## Nice to Have

None.
