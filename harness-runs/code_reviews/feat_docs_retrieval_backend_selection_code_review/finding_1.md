### 1. The documents say a remote job with the Python backend selected still runs without `search_docs`, but the job's `doctor --remote-job` preflight fails and stops it

**File:** `docs/remote-execution.md` (`**Retrieval.**` paragraph): "the launcher exits `3` in a job, the session has no `harness-docs` server, and the run proceeds without `search_docs`"
**And:** `docs/retrieval.md` (`### Switching back, and what stays`, the **A remote job does not run it.** bullet): "so with `python` selected the `harness-docs` server does not start there"

**Problem.** The job runs `doctor --remote-job` as its `Preflight with doctor` step (`cli/templates/github/workflows/harness-run.yml` → `- name: Preflight with doctor`). `docs/remote-execution.md` → **The permission profile.** already says *"`doctor --remote-job` then runs as a preflight, so any check it fails stops the job before launch"*, and `doctor` exits `1` when any check fails (`cli/src/commands/doctor.ts` → `return counts.fail > 0 ? EXIT.FAILURE : EXIT.OK`).

With `docs.retrievalBackend: "python"` and retrieval on, `pythonRetrievalApplies` is true in the job, so the three `retrieval-python-*` checks grade the job's machine (`cli/src/doctor/checks.ts` → `RETRIEVAL_PYTHON_DEPENDENCIES_CHECK`). The job installs no `harness-docs-retrieval`, so `runPythonSelfCheck` returns `{ kind: 'unresolved' }`. `retrieval-python-dependencies` then fails, and the other two fail pointing at it. None of the three reads `ctx.remoteJob`. The preflight step exits non-zero, every later step's `if: env.HARNESS_STOPPED != '1'` keeps the default `success()` condition, and the run never starts.

Both documents describe the opposite outcome: a run that proceeds and degrades gracefully. An adopter who runs remote jobs, reads this and selects `python` gets every remote run stopped at preflight. The documents also break the ledger rule *"A new execution environment must state, for every configurable phase, whether that phase runs there"*: they state it, but they state it wrongly.

**Fix.** Make both documents say what the code does.

- [ ] In `docs/remote-execution.md` → the **Retrieval.** paragraph, replace the sentence
  > So with `docs.retrievalBackend: "python"` the launcher exits `3` in a job, the session has no `harness-docs` server, and the run proceeds without `search_docs`.

  with
  > So with `docs.retrievalBackend: "python"` the job's `Preflight with doctor` step fails `retrieval-python-dependencies`, `retrieval-python-model-cache` and `retrieval-python-index`, because the job has no `harness-docs-retrieval` on `PATH`. Like any check `doctor --remote-job` fails, that stops the job before launch (**The permission profile.** below), so no remote run starts.

  Keep the paragraph's closing sentence ("The Python backend is a local-machine option, and a repository that runs remote jobs keeps the default …") as it is.
- [ ] In `docs/retrieval.md` → `### Switching back, and what stays` → the **A remote job does not run it.** bullet, replace
  > so with `python` selected the `harness-docs` server does not start there.

  with
  > so with `python` selected the job's `doctor --remote-job` preflight fails the three `retrieval-python-*` checks and the job stops before its run starts ([`remote-execution.md`](remote-execution.md) → **Retrieval.**).

Both files are prose and no test covers them, so this fix runs no test. The full suite runs later, in the Run gates phase.

Whether `doctor --remote-job` *should* let the job proceed instead is a separate product decision. It is raised as a question beside this review, not decided here. This finding fixes the documents to match the code as it stands.
