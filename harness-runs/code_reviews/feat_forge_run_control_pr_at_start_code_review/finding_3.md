### 3. `docs/github-run-control.md` names `open` among the verbs it governs but leaves its header paragraph out of the code of record

**File:** `docs/github-run-control.md` (opening paragraphs) — "The code of record is `cli/templates/scripts/remote-run.sh` → the header's `control`, `collect`, `report` and `deliver` paragraphs"

This branch added `open` to the document's *Who reads this* line (*"anyone changing … `remote-run.sh`'s `open`, `control`, `collect`, `report` and `deliver`"*), and §4 *When it opens* now describes `remote-run.sh open`. `remote-run.sh` has a new header paragraph for that verb, opening *"`open` OPENS THE RUN'S DRAFT PULL REQUEST at the run's start"*. The next paragraph's code-of-record sentence still lists only the `control`, `collect`, `report` and `deliver` paragraphs. Someone changing `open`, who is one of the readers this document names, is sent to four paragraphs and not to the one that governs the verb they are changing. The same sentence also leaves out the run workflow's new `Open the draft pull request` step and its `WHY THE OPEN STEP RUNS ONLY WHEN chain IS 0` header paragraph in `cli/templates/github/workflows/harness-run.yml`.

**Fix:** in that sentence, replace

> the header's `control`, `collect`, `report` and `deliver` paragraphs, the header of `cli/templates/github/workflows/harness-control.yml`, and the `collect` job with its `THE COLLECT JOB` header paragraph in `cli/templates/github/workflows/harness-run.yml`.

with

> the header's `open`, `control`, `collect`, `report` and `deliver` paragraphs, the header of `cli/templates/github/workflows/harness-control.yml`, and in `cli/templates/github/workflows/harness-run.yml` the `Open the draft pull request` step with its `WHY THE OPEN STEP RUNS ONLY WHEN chain IS 0` header paragraph and the `collect` job with its `THE COLLECT JOB` header paragraph.

No test covers this file; nothing to run.
