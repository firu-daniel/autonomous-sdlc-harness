## File-manipulation and probe commands refused to layer-implementers in the unattended profile
- **category:** tooling-gap
- **evidence:** layer-implementer returns, this run: Task 1 — a bare `jq` call for the plan's `transcripts` check refused three times (rerouted through `bash scripts/scratch-run.sh`), and `rm` of `harness-runs/scratch/t1_probe.py`, `t1_transcripts.jsonl`, `t1_link.jsonl` refused; Task 2 — a second scratch render refused, and `rm` of `harness-runs/scratch/t2_doc.json`, `t2_doc2.json` refused; Task 3 — the plan's `bash -n` check refused; Task 4 — `git restore --source=HEAD -- <file>` refused; Task 5 and code-review Findings 1 and 2 — `cp <template> <mirror>` refused (both absolute and repo-relative spellings, per Task 5's return); skeptic Finding 1 — a backup copy to `$TMPDIR` refused.
- **cost this run:** Task 2's remaining branches verified only by reading the code; Task 3's parse claim rests on the typecheck's parse step; mirror copies hand-applied with the edit tool and checked by `cmp`; Task 4's mutations reverted by hand, with one mutation briefly overlapping the next (per its return); five scratch files left untracked under `harness-runs/scratch/`.
- **hypothesis:** guess — the profile's allow list has no entry for these command prefixes.

## A unit that edited a `cli/src` file reported no tree guard selected
- **category:** agent-contract
- **evidence:** code-review Finding 3's layer-implementer edited `cli/src/machine/paths.ts` (commit cb7c51d8) and returned "no tree guard was selected"; `harness.config.json` `treeGuards` carries `test/retrieval-loading.test.mjs` covering `cli/src/**/*.ts`. Task 3's implementer, editing the same file (commit 4331f30d), did select and run that guard.
- **cost this run:** the guard did not run for that unit; Phase G round 1 passed, so no defect resulted.

## Configured `defaultBranch` has no local ref in the run checkout
- **category:** tooling-gap
- **evidence:** `harness.config.json` `defaultBranch` is `dev`; `git log --format='%h %s%n%b' --name-only dev..HEAD` at Phase D failed with `fatal: ambiguous argument 'dev..HEAD': unknown revision`. The branch-reviewer (Phase B) and statistics-plan-writer (Phase D.1) each reported the same missing local `dev` and fell back to `origin/dev`.
- **cost this run:** three consumers each re-derived the same fallback independently.
