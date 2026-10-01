## A Run gates fix unit cannot run the Python formatter, so a `ruff format` finding is fixed by hand and incompletely
- **category:** tooling-gap
- **evidence:** Round-1 test fix plan `harness-runs/test_fix_plans/feat_docs_retrieval_python_backend_task_round_1.md`, Finding 2 (gate 13a, "6 files would be reformatted"). The `layer-implementer` return for that unit reported it could not run `ruff format`: `scripts/python-service.sh` has no formatter sub-command (its only ruff entry is `lint`, the gate itself), the synced environment lives in the user-level uv cache directory, which the session's permission profile refused to list, and `ruff` is not on PATH. It collapsed five files by reading (commit `71b339a`) and recorded the sixth as not found in `harness-runs/test_fix_plans/feat_docs_retrieval_python_backend_task_round_1/finding_2.md`. Gate round 2 (`harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_2.log`) then failed 13a on that sixth file, `docs-retrieval-service/src/harness_docs_retrieval/chunk.py:58` ("1 file would be reformatted").
- **cost this run:** one extra Run gates round (round 2), plus its test-fix-plan writer, architecture gate, plan commit and two implement/commit pairs (7 dispatches).
- **hypothesis:** a fix unit with the formatter's write mode available would have closed the finding in one pass.

## The Run gates log keeps only the tail of a failing gate's output, hiding most of gate 13a's failures
- **category:** silent-failure
- **evidence:** `harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_1.log` lines 46–71: gate 13a reports "6 files would be reformatted" but the log shows a diff for only one file (`tests/test_store_postgres.py`), and it shows no `ruff check` output at all. `harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_2.log` lines 28–41 report "Found 4 errors." but show only one E501 in full (`tests/ts_bridge.py:4`). The round-2 `test-fix-plan-writer` return said the log had cut off the start of the `ruff check` output, and found the other three E501 lines by searching the tree. It also said none of those four files changed in the round-1 fix commit. So the four E501 errors existed at round 1 but were not in the round-1 log.
- **cost this run:** the round-1 test fix plan covered 5 of the 6 format failures and none of the 4 E501 errors, so a second fix round was needed for failures already present at round 1.

# User-review fix round 1 — Python transports' lone-surrogate serialization, one-line driver errors, stub `fetch-models` refusal, SIGTERM drain, README seam and deferred-work records

## The user-review-fix-plan writer edits the tracked lessons ledger, but no commit point stages it
- **category:** silent-failure
- **evidence:** After the `user-review-fix-plan-writer` dispatch (fix-plan step 5), `git status --short` showed ` M harness-runs/lessons.md`; the writer's return said it appended two lessons under a new "Ports and parallel implementations" section, per its contract step 6. The fix-plan fork's Override 3 explicit path list (fix-plan index, source review, per-finding folder, two gate folders) does not include `harness-runs/lessons.md`, and a grep for `lessons.md` across `plugin/instructions/` (main checkout) finds it only in `run_mode_instructions.md`. The orchestrator added the path to the Override 3 call by hand (commit `ff212fe`).
- **cost this run:** none landed; without the hand-added path the ledger edit would have stayed modified and tracked through Phase A, or been swept into whichever later commit staged it.

## The user-review fix-plan fork's ledger rule has no case for an existing task-engine ledger
- **category:** agent-contract
- **evidence:** At round-1 Setup, `harness-runs/flow_progress/feat_docs_retrieval_python_backend_progress.md` held the task-engine ledger (header `(engine: task)`, no round number). `autonomous_pause_and_ledger.md` §1.4's user-review cases compare "the existing ledger's header round" to the active round: equal → resume, older → re-seed, absent → create. A task-engine header carries no round, so none of the three applies as written. The orchestrator treated it as a re-seed and overwrote the file from the user-review template (commit `c8f6d10`), matching the round-1 ledger committed on an earlier merged branch (`harness-runs/flow_progress/feat_docs_catalog_retrieval_progress.md` at `0f25bec`).
- **cost this run:** none; the case was decided by precedent rather than by the rule.

## A Phase A implementer ran a test file its unit did not edit
- **category:** agent-contract
- **evidence:** The `layer-implementer` return for Finding 6 (`harness-runs/user_reviews/feat_docs_retrieval_python_backend_fix_plan/finding_6.md`, commit `82abcea`) said, under its own "outside the test-run rule" heading, that it also ran `tests/test_mcp_parity.py` (2 passed), a file that unit did not create or edit. `unit_loop_core.md` → `## The test-run rule` point 1 excludes that run.
- **cost this run:** one unneeded targeted test run; no effect on the result.
