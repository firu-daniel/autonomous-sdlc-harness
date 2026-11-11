### 2. `launch-sandboxed-gates.sh`'s trust clause names `DEVSCENE_MAIN_REPO` as "that or any other `HARNESS_*` name"

> **Self-contained per-finding file** for the `chore_devscene_env_variables` code-review index (`harness-runs/code_reviews/chore_devscene_env_variables_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/launch-sandboxed-gates.sh` (the `NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET.` header paragraph): "nothing here reads that or any other `HARNESS_*` name". The same line is in its self-adopted copy, `scripts/launch-sandboxed-gates.sh`, which has the same blob id as the template (`git ls-files -s`).

**The problem.** Before this branch the sentence read: "as `autonomous-watcher.sh`'s header says of `HARNESS_MAIN_REPO`; nothing here reads that or any other `HARNESS_*` name". There, "that" was one member of the `HARNESS_*` family the clause rules out. Tasks 5 and 16 respelled only the variable. The clause now reads "`DEVSCENE_MAIN_REPO`; nothing here reads that or any other `HARNESS_*` name". That calls `DEVSCENE_MAIN_REPO` a `HARNESS_*` name, which it is not. It also narrows the trust statement: it no longer says the launcher reads none of the adopter-visible `DEVSCENE_*` variables, such as `DEVSCENE_GH_CLI` and `DEVSCENE_AGENT_CLI`, and those are now the family an assignment prefix would set. The statement is still true: `grep -nE 'DEVSCENE_|HARNESS_' cli/templates/scripts/launch-sandboxed-gates.sh` prints only this comment line. But a reader auditing the trust claim can no longer read that from it. The story index's *Bare prefix mentions* entry keeps the `HARNESS_*` token. This fix keeps it too and only adds the family the sentence's own subject belongs to.

**Fix.** In **both** files, replace this one line:

```sh
# `DEVSCENE_MAIN_REPO`; nothing here reads that or any other `HARNESS_*` name.
```

with these two lines:

```sh
# `DEVSCENE_MAIN_REPO`; nothing here reads that or any other `DEVSCENE_*` or
# `HARNESS_*` name.
```

Change nothing else in either file. Keep `scripts/launch-sandboxed-gates.sh` at mode `100755` and byte-identical to the template. After the edit, `git ls-files -s cli/templates/scripts/launch-sandboxed-gates.sh scripts/launch-sandboxed-gates.sh` must show one blob id for both. This fix edits no test file.
