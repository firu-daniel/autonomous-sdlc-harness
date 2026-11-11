### 2. The watcher's `SESSION_ENV_BASE` derivation grep can no longer find a `DEVSCENE_*` name, though its own prose lists two among its hits

> **Self-contained per-finding file** for the `chore_devscene_env_variables` skeptic-review index (`harness-runs/skeptic_reviews/chore_devscene_env_variables_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh`, in the comment block above `SESSION_ENV_BASE=`, in the bullet "The harness-owned names a session-side reader needs, derived from". The line to change is:

```sh
#       grep -rhoE '\$\{?(HARNESS|CLAUDE_CODE)_[A-Z0-9_]+|printenv (HARNESS|CLAUDE_CODE)_[A-Z0-9_]+' \
```

The same line is in the self-adopted copy, `scripts/autonomous-watcher.sh`, which has the same blob id as the template (`git ls-files -s`).

**The problem.** `SESSION_ENV_BASE` is the allow-list of names a local session keeps. Every exported name outside it is `unset` before the engine's `exec`. The comment gives a re-runnable grep as the derivation of which harness-owned names belong in that list, and then states the result: "Its other hits are DEVSCENE_MAIN_REPO, which the launch exports itself, the strip set's HARNESS_PR_TOKEN and DEVSCENE_GIT_TOKEN, and two job-only names …".

This branch respelled the hits in that prose to `DEVSCENE_` but left the grep's alternation at `(HARNESS|CLAUDE_CODE)`. That grep cannot match a `DEVSCENE_` token, so it no longer prints `DEVSCENE_MAIN_REPO` or `DEVSCENE_GIT_TOKEN`, and the prose and the command now disagree. Worse, the adopter-visible family now lives under `DEVSCENE_`. A maintainer who re-runs the derivation after a session-side reader starts reading a `DEVSCENE_*` variable gets no hit for it. That name is then left out of `SESSION_ENV_BASE` and silently stripped from every local session. This is the same class of defect as code-review Finding 2 (`launch-sandboxed-gates.sh`'s trust clause), at a site that review did not raise.

**Proof.** The grep with `DEVSCENE` added to the alternation, run as `git grep -hoE` over the same paths, prints exactly the set the prose claims:
- `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`;
- `HARNESS_PR_TOKEN` and `DEVSCENE_GIT_TOKEN`;
- `HARNESS_INPUT_CHAIN` and `HARNESS_GITHUB_DEFAULT_COMMIT`;
- `DEVSCENE_MAIN_REPO`.

So the corrected command reproduces the comment, and `SESSION_ENV_BASE` itself needs no change.

**Fix.** In **both** files, replace that one line with:

```sh
#       grep -rhoE '\$\{?(HARNESS|DEVSCENE|CLAUDE_CODE)_[A-Z0-9_]+|printenv (HARNESS|DEVSCENE|CLAUDE_CODE)_[A-Z0-9_]+' \
```

Change nothing else in either file. Do not change `SESSION_ENV_BASE` or `SESSION_ENV_STRIP_EXTRA`. Keep `scripts/autonomous-watcher.sh` at its current mode and byte-identical to the template. After the edit, `git ls-files -s cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` must show one blob id for both. This fix edits no test file.

- **Deviations from plan:** The one-blob-id check was not executed as `git ls-files -s` / `git hash-object`: the index is unchanged until the committer stages, and `git hash-object` on the two working-tree files was refused by the permission layer. It rests instead on `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh`, which exited 0 with no output (byte-identical), and on `ls -l`, which shows the modes unchanged (`-rw-r--r--` template, `-rwxr-xr-x` self-adopted copy, matching index modes `100644` / `100755`). The committer's staging is where `git ls-files -s` will show the single blob id.
