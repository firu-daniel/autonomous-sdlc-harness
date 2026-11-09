# Task plan review — iteration 3

Round 2's Must Fix is resolved. `task_4_plan.md` → **Goal 4 — push refusals, at two call sites with two different jobs** now does four things:
- It makes the tick pass `check_push_refusals` the only site that tears a session down, and it raises `push_refusing` before `collect_descendants` / `kill`.
- `classify_run_exit` and `record_run_analytics` test that marker beside `stall_killing`. The marker is cleared where `launch_run` and `run_job` clear `stall_killing` (`autonomous-watcher.sh`, the `registry_set "$branch" stall_killing ""` lines at 3525 and 6051).
- `classify_run_exit` checks its own `$branch` only, with no teardown.
- It adds the normal-exit and two-run test cases. `task_8_plan.md` → **Depends on:** → Task 4 restates both call sites.

Other checks:
- **Scope register.** Entries A–C, re-run verbatim, reach the same 16 files, and every one has a row. The register closes.
- **Index↔file correspondence.** It is 1:1: 13 entries and 13 files.
- **Shape of the tasks.** Every task is single-layer, and the tasks are sequenced `cli` → `plugin` → `general`. No `**Depends on:**` points forward. Every task is at most 20 points and at most 5 Work bullets.
- **Test runs.** No Verification bullet asks for a forbidden test run, and no new tree-reading test is added.
- **Cited anchors.** I spot-checked them in `autonomous-watcher.sh`, `remote-run.sh`, `lib/harness-run-lib.sh`, `launch-sandboxed-gates.sh`, `init.ts`, `workflow-templates.test.mjs`, `workflow-sandbox-install.test.mjs`, `check-rendered-workflows.mjs`, `docs/github-run-control.md`, `docs/watcher.md`, `docs/sandbox-record.md`, `ARCHITECTURE.md` and `docs/development.md`. All of them resolve.

## Must Fix

1. **Round 2's two Should Fixes were neither applied nor recorded under `## Rejected findings`.** Files: `task_11_plan.md` and `task_4_plan.md` (with mirrors in `task_8_plan.md` and `task_9_plan.md`), or the story index (`fix_run_job_credential_exposure_story_plan.md`).
   The ledger entry being repeated is `harness-runs/lessons.md` → *Unattended control loops*: **"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."** The story index already cites this same entry for the architecture reviews' Should Fixes (`## Context`, *"The round-2 Should Fixes, re-raised in architecture review round 3, are applied"*). But neither of `task_plan_reviews/.../review_2.md`'s Should Fixes was handled:
   - **`task_11_plan.md` was not revised after round 2.** **Depends on:** → **Task 6** → **`run`'s own credential.** still reads *"`credential.https://<host>/<path>.helper store`"*. The contract Tasks 2, 3, 5 and 6 define is `store --file <absolute path>`. The bullet also still leaves out the third key, the marker `harness.pushCredential job-token`.
     - This file's decision block is the one place `docs/remote-execution.md` records the design (its own Goal: *"Every other document cites it"*). From this restatement it would document a helper that `push-branch.sh`'s scan does not read: Task 2's `hr_credential_values_var` adds nothing for a plain `store` value.
     - The restatement also leaves out why the path must be fixed in the checkout's `.git/config`: the session cannot write that file, and in a job the scan finds the job token only through it.
   - **`task_4_plan.md` → The base set** still drops the agent CLI's own non-secret configuration from a local session, such as a gateway `ANTHROPIC_BASE_URL` or `ANTHROPIC_MODEL`. The *what breaks* bullets name only *"a Bedrock/Vertex setup"*, and so do `task_8_plan.md`'s and `task_9_plan.md`'s. An operator who routes through a gateway URL would find the local session failing to reach the API, with no document naming why.

   **Fix:** Do one of the following for each item.
   - **Apply it.**
     - In `task_11_plan.md` → **Depends on:** → **Task 6** → **`run`'s own credential.**, restate the helper value as `store --file <absolute path>`. Add the marker `harness.pushCredential job-token` as the third key that `push-credential store` sets last. Say that the path is fixed in the checkout's `.git/config` because that file is a record the session cannot write, and that `push-branch.sh`'s scan reads the job token's file from it, never from `HOME`. Add a Work or Verification bullet so the decision block's description of the stored entry names `store --file <absolute path>`.
     - In `task_4_plan.md` → **The base set**, either add the agent CLI's documented non-secret configuration names (at least `ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL`, plus `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` if they are kept rather than left to `sandbox.passEnv`) to `SESSION_ENV_BASE`, and record that derivation in its comment, **or** name the gateway case beside Bedrock/Vertex in Task 4's **what breaks under the allow-list** bullet, in `task_8_plan.md`'s `### The session's environment` bullet, and in `task_9_plan.md`'s `docs/config.md` row bullet.
   - **Or reject it.** Add a trailing `## Rejected findings` section to the story index that records the finding with its reason.

## Should Fix

- **`task_6_plan.md` → Depends on: → Task 5 → The marker.** The bullet says the marker is *"(defined by Task 3)"*. Since architecture review round 3, Task 2 owns it (`lib/harness-run-lib.sh` → `HR_PUSH_CREDENTIAL_KEY` / `HR_PUSH_CREDENTIAL_JOB_TOKEN`), and Task 5 writes it through those constants. Re-point the attribution so Task 6's header text does not name `push-branch.sh` as the owner.
- **`task_2_plan.md` → Credential sources.** Locally, every password in `$HOME/.git-credentials` and `${XDG_CONFIG_HOME:-$HOME/.config}/git/credentials` becomes a pattern for every host, and so does every extraheader value. The plan excludes only the empty value. A short stored password (a 4-character test-registry password, say) would match ordinary patch text and refuse a clean push, which fails the run. Add a minimum length below which a value from those **extra** sources is not recorded, state it in the contract table, and add a test case for it. Alternatively, state this residual in `push-branch.sh`'s header paragraph (Task 3).
