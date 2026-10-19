### 6. The run library's NAMING list omits six globals this branch introduces

**File:** `cli/templates/scripts/lib/harness-run-lib.sh`, the header paragraph beginning "NAMING. Every function is prefixed `hr_`; every variable this file touches outside a `local` is prefixed `HR_`", in particular its closing span "and the shared commit's `HR_COMMIT_REFUSAL` and `HR_COMMIT_NEW`, and the clone arm's sync's `HR_SYNC_TIP` and `HR_SYNC_REFUSAL`, and the clone creation's `HR_CLONE_DIR` and `HR_CLONE_REFUSAL`."

**Problem.** The paragraph enumerates the `HR_` globals that return values without a command substitution, and states that *"Every one of them is assigned before it is read by the function that owns it"*. This branch added four names to it. It left out six other globals it introduces, each of which sits outside a `local`:

- `HR_TARGET_KIND` and `HR_TARGET_BRANCH`, set by `hr_wrapper_target_check_var`;
- `HR_CLONE_CONFIG_REFUSAL`, set by `hr_clone_config_check_var`;
- `HR_CLONE_RULE`, set by `hr_clone_spec_rule_var`;
- `HR_RUN_COPY_KIND`, set by `hr_run_main_set_var` and `hr_run_copy_check_var`;
- `HR_COMMIT_SYNC_FAILED`, set by `hr_commit_paths_var`.

`commit-on-branch.sh` and the three wrappers read two of them (`HR_TARGET_KIND`, `HR_COMMIT_SYNC_FAILED`).

**Fix.** Extend the closing span to:

```text
# commit's `HR_COMMIT_REFUSAL`, `HR_COMMIT_NEW` and `HR_COMMIT_SYNC_FAILED`,
# the target check's clone arm's `HR_TARGET_KIND`, `HR_TARGET_BRANCH`,
# `HR_CLONE_CONFIG_REFUSAL` and `HR_CLONE_RULE`, the watcher family's
# `HR_RUN_COPY_KIND`, and the clone arm's sync's `HR_SYNC_TIP` and
# `HR_SYNC_REFUSAL`, and the clone creation's `HR_CLONE_DIR` and
# `HR_CLONE_REFUSAL`.
```

Leave the following sentence ("Every one of them is assigned before it is read …") unchanged; it holds for all six. Comment edit only; no test runs.
