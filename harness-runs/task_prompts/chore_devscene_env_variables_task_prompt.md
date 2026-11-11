`chore_devscene_env_variables` renames the `HARNESS_*` variables that an adopter sets or reads about to `DEVSCENE_*`. It is the third of five rename branches after `chore_rename_to_devscene`. No adopters need migrating, so backward compatibility is out of scope: the old names are not read as fallbacks.

## Which variables

**Rename a variable when an adopter can see it.** That means it is one of:
- a GitHub repository variable or secret a workflow template reads (`vars.HARNESS_*`, `secrets.HARNESS_*`), such as `HARNESS_RUN_ACTORS`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN`, `HARNESS_GIT_TOKEN` and `HARNESS_PUSH_URL`;
- an environment override documented for adopters in `README.md`, `docs/` or `cli/README.md`, such as `HARNESS_CLI` and `HARNESS_AGENT_CLI`;
- a variable named in a CLI or `doctor` message, or in a script's error text.

**Leave a variable alone when an adopter never meets it.** Two kinds stay:
- internal plumbing between the outer-loop scripts or workflow steps, such as `HARNESS_INPUT_*`, `HARNESS_JOB_*` and `HARNESS_STOPPED`;
- contributor-only switches documented only in `docs/development.md` or `CONTRIBUTING.md`, such as `HARNESS_SELF_ADOPT` and `HARNESS_EVAL_CORPUS_ROOT`.

**Excluded:**
- the docs-retrieval variables (`HARNESS_DOCS_RETRIEVAL_*`, `HARNESS_RETRIEVAL_*`, and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` / `_STUB`), which `chore_devscene_docs_retrieval` renames;
- variables with no `HARNESS_` prefix (`STALL_*`, `USAGE_*`, `REMOTE_*`, `PARK_LOOP_*`), which keep their names.

The plan lists every `HARNESS_` name it finds, with the classification and the evidence for each. A variable that is both set by adopters and passed internally is renamed throughout.

## The goal

1. Rename the selected variables everywhere they are set, read, documented, checked by `doctor` or asserted in tests. Where `init` or `doctor` prints a `gh variable set` or `gh secret set` line, the line carries the new name.
2. Rename this repository's own uses to match, so its self-adopted scripts and documents agree with the templates.

## Done when

- Every renamed variable has zero remaining `HARNESS_` uses outside `harness-runs/` and recorded-release fixtures.
- The report gives the final rename table and the list of names deliberately kept.
- The test suite and the gates pass.
