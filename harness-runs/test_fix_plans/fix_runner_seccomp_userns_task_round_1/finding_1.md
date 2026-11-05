### 1. The run workflow template's DECLARED MIRRORS entry freezes the `scripts/` directory into the file

**Site anchor:** `cli/templates/github/workflows/harness-run.yml` — the `# DECLARED MIRRORS` header block, the entry beginning `#   cli/templates/scripts/lib/harness-run-lib.sh hr_sandbox_opted_out, sourced` (near line 64, a navigation hint only). Grep-verified: it is the only line of the template that matches `(^|[^A-Za-z0-9_])scripts/`; the template has no match for the companion `(^|[^A-Za-z0-9_-])sdlc-harness/` assertion.

**Failing test:** `cli/test/workflow-templates.test.mjs` — `no configured directory is frozen into the file` (TAP `not ok 1656`).

**Failure, quoted from the log:**

```
not ok 1656 - no configured directory is frozen into the file
  location: 'cli/test/workflow-templates.test.mjs:733:1'
  failureType: 'testCodeFailure'
  error: |-
    The input was expected to not match the regular expression /(^|[^A-Za-z0-9_])scripts\//m. Input:
    '# harness-run.yml — runs one autonomous-sdlc-harness run in a GitHub Actions job,\n' +
```

The test gate's summary: `run-gates: 1 failed, 24 passed` / `- 4 npm test` / `FAIL: test (exit 1)`; the suite reports `# tests 3484`, `# pass 3475`, `# fail 1`.

**Diagnosis (new this round — no earlier log exists, so it is a first-round failure):** The test (`cli/test/workflow-templates.test.mjs`, `test('no configured directory is frozen into the file', …)`) reads the raw template text (`TEXT`, read from `templates/<WORKFLOW_TEMPLATE_DIR>/<WORKFLOW_RUN_FILE>`) and asserts that no `scripts/` path segment appears in it, because the adopter's `scriptsDir` is configurable and the workflow must reach its scripts only through `$SCRIPTS_DIR`. This branch (commit `67f1da35b`) added a DECLARED MIRRORS entry for `hr_sandbox_opted_out` whose first column spells the library's source path, `cli/templates/scripts/lib/harness-run-lib.sh`. The `/` before `scripts/` is not in `[A-Za-z0-9_]`, so the regular expression matches inside this comment. The assertion covers comments too, and the template has no other match. The neighbouring entry for the same family already avoids the problem with `#   remote-run.sh (the scriptsDir copy) RUN_JOB_NAME …`. The continuation line `in a subshell from $SCRIPTS_DIR/lib/ by` does not match, because the regular expression is case-sensitive.

**Fix:**

- [ ] In `cli/templates/github/workflows/harness-run.yml`, rewrite the first line of that DECLARED MIRRORS entry so that no lowercase `scripts/` segment remains. Follow the shape of the `remote-run.sh (the scriptsDir copy)` entry above it:

  ```
  #   lib/harness-run-lib.sh (the scriptsDir copy) hr_sandbox_opted_out, sourced
  ```

  Leave the four continuation lines (`in a subshell from $SCRIPTS_DIR/lib/ by` … `held by workflow-sandbox-install.test.mjs`) unchanged.
- [ ] Do not change the test or its regular expression. The rule it guards (no configured directory frozen into the template) is correct, and the entry can say the same thing without the path.
- [ ] No other test reads this header line. `cli/test/workflow-sandbox-install.test.mjs` reads the step body's `/lib/harness-run-lib.sh" && <fn>` call and the library file itself, not the mirror comment, so the reword affects nothing else.
