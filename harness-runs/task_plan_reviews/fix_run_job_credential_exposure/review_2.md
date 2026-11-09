# Task plan review — iteration 2

All three of round 1's Must Fixes are resolved.
- MF1: `task_4_plan.md` → **Where the sets are read** now computes `session_unset_names` and makes every refusal in `spawn_engine`'s own shell. It also adds the refused-launch test, graded on the registry and the notifier.
- MF2: the HTTPS push derivation, its cost and the ways on are in `task_4_plan.md` and `task_8_plan.md`.
- MF3: `task_4_plan.md` restates `hr_push_refusal_record`. `task_3_plan.md`, `task_2_plan.md`, `task_5_plan.md` and `task_6_plan.md` locate the stored job token through the main checkout's `store --file <absolute path>` helper value, not through `HOME`, and add the job-case test.

Both of round 1's Should Fixes are applied (row 18; the architecture-review citation). There is no `## Rejected findings` section.

Other checks:
- Scope register entries A–C, re-run verbatim, reach the same 16 files, and every one has a row. The register closes.
- Index↔file correspondence is 1:1 (13 entries, 13 files).
- Every task is single-layer, sequenced `cli` → `plugin` → `general`, at most 20 points and at most 5 Work bullets.

## Must Fix

1. **`check_push_refusals`, called from `classify_run_exit`, tears down the process that is running it** — `task_4_plan.md` (and the mirror sentence in `task_8_plan.md`).
   The **Goal 4 — `check_push_refusals`** bullet says three things:
   - *"`classify_run_exit` also calls it once, before it classifies. For each `running` run it calls `hr_push_refusals_for_var` … On a hit it does the following, once per run: Stop the session through the same teardown `check_stalled_runs`' kill path uses"*.
   - *"A record classified after a normal exit takes the same route and wins over `completed`."*

   `classify_run_exit` runs inside `spawn_engine`'s `( … ) &` subshell (`cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`, the `classify_run_exit "$branch" "$worktree" "$log_path" "$rc"` line just before `) &`). `registry_set "$branch" pid "$!"` records that same subshell as the run's pid. When classification starts, the run's status is still `running`. `check_stalled_runs`' kill tier signals exactly that pid (`kill -9 "$pid"`, after `collect_descendants`).

   So the "same route", taken from `classify_run_exit`, `kill -9`s its own subshell before the pass can set `failed`, notify or move the record. The run is then left `running` with a dead pid. That is exactly the case the plan says must "win over `completed`": the agent pushed, the push was refused, and the agent exited 0. It would then fall to the reconcile pass, not the push-refusal route.

   The call also has a second problem. Because it walks *every* `running` run, one run's subshell would, locally, tear down and notify for *other* branches' runs, while the main loop's `tick` pass does the same. That gives two owners of one record. Teardown has a second gap as well: the bullet does not raise a marker before signalling. The kill tier's contract is that `stall_killing` goes up first *"so the dying subshell's classify_run_exit returns instead of stamping a status this teardown did not intend"*. Without such a marker, a session that exits between the tick pass's read and its kill can also be classified, and notified, by its own subshell.

   **Fix:** In `task_4_plan.md` → **Goal 4 — `check_push_refusals`**, split the two call sites:
   - **The tick pass** (`tick` and `run_job`'s supervision loop) keeps the teardown. Before it collects the descendants and signals, it sets a registry marker of its own, as the kill tier sets `stall_killing`. `classify_run_exit` checks that marker first, beside `stall_killing`, and returns when it is set.
   - **The `classify_run_exit` call** checks **its own `$branch` only**, through `hr_push_refusals_for_var "$MAIN_REPO" "$branch"`, and runs **no teardown**, because the engine has already exited. On a hit it sets `failed` with `push refused: <reason>`, notifies, prints the `::error title=Push refused::` line and the `stop` decision in job mode, moves the record to `handled/`, and returns without classifying further. It never reads or touches another branch's record.

   Add a `watcher-push-refusal.test.mjs` case for the normal-exit route. The fake agent writes a record through the sourced `hr_push_refusal_record` and then exits 0. Assert that:
   - the registry status is `failed` (not `completed`) with a detail beginning `push refused:`;
   - exactly one `failed` notification is recorded;
   - the record is in `handled/`.

   Add a two-run local case: a record for branch B, classified by branch A's exit, leaves B's run and record untouched. Update the matching **`check_push_refusals`** bullet of `task_8_plan.md` → **Depends on:** → Task 4 so it states the two call sites as above.

## Should Fix

- `task_11_plan.md` → **Depends on:** → Task 6, **`run`'s own credential.** gets two things wrong:
  - It restates the helper key's value as `credential.https://<host>/<path>.helper store`. The contract Tasks 5 and 6 define is `store --file <store_file>`, an absolute path, and the design depends on that path being fixed in the checkout's `.git/config`.
  - It omits the third key, the marker `harness.pushCredential job-token`.

  Restate the value as `store --file <absolute path>`, add the marker, and say why the path is fixed there. Otherwise the decision block may describe a helper the scan does not read.
- `task_4_plan.md` → **The base set**. The harness-owned names are derived from a grep of the harness's session-side readers only. The agent CLI's own non-secret configuration is therefore dropped from a local session: an endpoint or provider switch such as `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX`, or `ANTHROPIC_MODEL`. The cost bullet names Bedrock/Vertex, but not an operator who routes through a gateway URL. Either add the agent CLI's documented non-secret configuration names to `SESSION_ENV_BASE`, with that derivation recorded in its comment, or name the gateway case beside Bedrock/Vertex in the cost list and in `task_8_plan.md`'s *what breaks* bullet.
