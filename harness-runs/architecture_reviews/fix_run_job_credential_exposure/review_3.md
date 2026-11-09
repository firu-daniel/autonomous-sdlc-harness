# Architecture review — iteration 3

All three round-2 Must Fixes are resolved:
- **Must Fix 1** in `task_4_plan.md`. The job-mode output now says *"The watcher writes nothing to `$GITHUB_STEP_SUMMARY"*, the test asserts that the summary file was not written, and there is a `grep -n 'GITHUB_STEP_SUMMARY'` Verification bullet. `task_8_plan.md` and `task_11_plan.md` now name `save`'s row.
- **Must Fix 2** in `task_5_plan.md`. Both closed header lists are named, and each has a Verification bullet.
- **Must Fix 3** in `task_4_plan.md`. The override-channel rewrite is there, with its Verification bullet.

No plan file asks for a test run that `## The test-run rule` forbids. The one new architecture defect is the job push-credential marker, which the clarification fold added after round 2.

## Must Fix

1. **The job push-credential marker is planned as a two-sided mirror between two scripts that already source one shared library** — `task_3_plan.md` (**The job push-credential marker, defined here.**: *"a declared mirror between this script (the reader, where they are first written as constants) and `remote-run.sh` (the writer)"*; the header paragraph's *"MIRRORED BY `remote-run.sh` → `push-credential store`"*), and `task_5_plan.md` (the contract's **The marker** bullet: *"Write them once in this script, as two constants beside the verb"*; the Work bullet's *"the marker constants with their mirror comment naming `push-branch.sh`"*; the Verification bullet *"shows the same key and value on both sides"*). Rules broken: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*, *"Before adding a copy of anything, grep for it"*) and `## Configuration is the source of truth, and it is read at run time` (*"The shared constants have owners, and a value is imported from its owner rather than retyped"*).
   The key `harness.pushCredential` and its value `job-token` are a persisted wire. Two scripts use them: `push-branch.sh` reads them and `remote-run.sh` writes them. Both scripts already source `cli/templates/scripts/lib/harness-run-lib.sh`. That library is the outer-loop family's single home for a shared answer, and it already holds module-level constants (`HR_KEEP_AWAKE_WHO`, `HR_TEST_RUN_LABEL_PATTERN`, `HR_TEST_RUN_LOG_SUBDIR`).
   - A declared mirror is the accepted form only where no shared import site exists, as with a TypeScript owner and a shell template.
   - Here a shared site exists, so the plan adds two literal copies plus a byte-for-byte promise between them.
   - The plan's own Task 2 removes exactly this kind of second copy for the `envVars` read (*"so that a second copy never exists in the tree"*).
   - The marker is also a trust input. If the reader and the writer drift, `push-branch.sh` silently stops refusing workflow-file commits in a job, and no test catches it, because each side's tests set the marker in their own spelling.

   **Fix:**
   - **`task_2_plan.md`.** Make the library the marker's owner:
     - Add two constants, `HR_PUSH_CREDENTIAL_KEY='harness.pushCredential'` and `HR_PUSH_CREDENTIAL_JOB_TOKEN='job-token'`.
     - Add a read-only predicate `hr_push_credential_is_job_token <main_top>`. It runs `git config --file "<main_top>/.git/config" --get` on the key and returns 0 only when the value equals the constant.
     - Add these to the contract table, the opening summary and the **NAMING.** paragraph.
     - Add a Verification bullet: the literal `harness.pushCredential` appears in code only in the library.
   - **`task_3_plan.md`.** `push-branch.sh` takes the mode from `hr_push_credential_is_job_token "$main_top"`. Remove *"where they are first written as constants"* and the **MIRRORED BY** clause. The header paragraph names the library as the marker's owner. Change the `grep -n 'pushCredential'` Verification bullet: no code line in `push-branch.sh` spells the key.
   - **`task_5_plan.md`.** `push-credential store`/`erase` set and unset the marker through `git -C <root> config "$HR_PUSH_CREDENTIAL_KEY" "$HR_PUSH_CREDENTIAL_JOB_TOKEN"` (and `--unset "$HR_PUSH_CREDENTIAL_KEY"`). Remove *"Write them once in this script, as two constants beside the verb"* and the mirror comment. Replace the last Verification bullet with: no code line in `remote-run.sh` or `push-branch.sh` spells `harness.pushCredential` or `job-token`. Both reach it through the library's constants.
   - **`task_6_plan.md`.** Leave the text that restates the marker as it is. **`task_4_plan.md`** needs no change.

## Should Fix

- **The round-2 Should Fixes are neither applied nor recorded under `## Rejected findings`.** The index's `## Context` says *"The round-2 Should Fixes stay unapplied: the answer did not ask for them"*. `harness-runs/lessons.md` → *Unattended control loops* says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* Apply both, or add a `## Rejected findings` section to the index with one reason per item. Both still stand:
  - `task_1_plan.md` still tells the implementer to declare the `SANDBOX_PASS_ENV_PATTERN` shell mirror *"the way `sandboxOptedOut`'s doc comment declares `hr_sandbox_opted_out`"*. That doc comment names `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` as holding the pair equal, and no test holds this pair equal. Task 2 already states that no test holds it. Add one clause to Task 1: the doc comment names no test.
  - `task_4_plan.md` → `SESSION_ENV_BASE` lists `CLAUDE_CONFIG_DIR`, whose owner is `cli/src/machine/paths.ts` → `CLAUDE_HOME_VARIABLE`. A pointer to that owner in the constant's comment keeps the inventory of shell copies in `paths.ts`'s header findable.

## Nice to Have

- None.
