## The plan writer reported `docs-retrieval-service/` as a directory no layer describes
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return's `## Corpus staleness` section carried one `undescribed-layer` entry: directory `docs-retrieval-service/`, which holds the Python docs-retrieval backend, its pytest suite and `tests/ts_bridge.mjs`. Only the catch-all `general` row (`path: "."`) covers it, and `.claude/context/conventions.md` → `## The layers` does not name it. Tasks 2 and 3 of this branch landed there.
- **cost this run:** none blocking. What it owes is the supervised remedy, in the writer's own words: run `/autonomous-sdlc-harness:harness-analyze` in a session in this repository, answering `skip` for every already-filled document (not the `--yes` spelling), then apply the layer profile with `npx autonomous-sdlc-harness config set layers`. `doctor`'s `layer-drift` check reports the same directory.

## The Python service environment was not provisioned in the run copy, so the Python tests ran nowhere on this branch
- **category:** tooling-gap
- **evidence:** the Task 2 and Task 3 `layer-implementer` returns both report `bash scripts/python-service.sh test tests/test_corpus.py` (and `tests/test_chunk_parity.py`) exiting 3 with `python-service: not provisioned: no synced environment … run bash scripts/python-service.sh sync`. The implementers did not run `sync`, because it needs the network and writes under the user cache. A fallback through the system `python3` failed to import the package (`TypeError: unsupported operand type(s) for |` in `jscompat.py`; that interpreter is older than 3.10). The round-1 `test-fix-plan-writer` return lists gates 13a–13c as BLOCKED for the same reason, under `harness-runs/test_fix_plans/fix_docs_retrieval_symlink_corpus_escape_task_round_1.md` → `## Not fixable on this branch`.
- **cost this run:** the new and rewritten cases in `docs-retrieval-service/tests/test_corpus.py` and the new `test_symlinked_corpus_matches_typescript` parity case shipped without ever being executed. Both Run gates rounds counted the blocked gates as non-failures.

## Implementers wrote a home-directory path into task-plan deviation notes, and gate 6a failed on it
- **category:** agent-contract
- **evidence:** the Task 2 and Task 3 implementers quoted the `python-service.sh` refusal line verbatim, home-directory venv path included, into `**Deviations from plan:**` in `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_2_plan.md` and `task_3_plan.md`. Round 1 of the Run gates failed gate 6a ("no machine paths") on those two lines (test fix plan `harness-runs/test_fix_plans/fix_docs_retrieval_symlink_corpus_escape_task_round_1.md`, Finding 1, fixed in commit `3fdc49c1`).
- **cost this run:** one extra Run gates round (the full suite ran twice) plus two dispatches for this finding's fix and commit.

## The run copy carries no local `dev` ref, so every `dev..HEAD` read failed or was silently rebased onto `origin/dev`
- **category:** tooling-gap
- **evidence:** at Phase D, `git log --format='%h %s%n%b' --name-only dev..HEAD` exited 128 (`fatal: ambiguous argument 'dev..HEAD': unknown revision`). The `branch-reviewer`, `review-plan-reviewer`, `skeptic-reviewer` and `statistics-plan-writer` returns each reported that no local `dev` exists and that they diffed against `origin/dev` instead.
- **cost this run:** none visible. Each agent chose its own fallback base, and the statistics file records it under `## Notes`.

## The `branch-reviewer` regex sweep did not run because its table's regex column is empty
- **category:** agent-contract
- **evidence:** the Phase B `branch-reviewer` return: "The regex sweep did not run, because the regex column of its table is empty in my agent definition." It did a manual check for console/print calls instead.
- **cost this run:** the end-of-branch review ran without its regex sweep.
