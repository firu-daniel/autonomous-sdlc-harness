### 4. `harness-run.yml`'s `DECLARED MIRRORS` does not declare the two things `harness-control.yml` now reads from it

**Severity:** Should Fix. **Layer:** cli.

**Sites:**
- `cli/templates/github/workflows/harness-control.yml` → the `Fetch the pinned plugin` step. Its `awk` parses `harness-run.yml`'s first `HARNESS_CLI_VERSION:` line, and it builds the release tag `autonomous-sdlc-harness--v$pin`.
- `cli/templates/github/workflows/harness-control.yml` → `DECLARED MIRRORS`, the `harness-run.yml` row: *"the release-tag shape `autonomous-sdlc-harness--v<version>` of its `Install the pinned plugin` step"*.
- `cli/templates/github/workflows/harness-run.yml` → `DECLARED MIRRORS`, the `harness-control.yml` row, which names only *"the concurrency group `harness-review-<branch>`"*.

**Problem.** This branch makes `harness-control.yml` depend on `harness-run.yml` in two ways:
- the `HARNESS_CLI_VERSION: '<version>'` env line, in the form the `awk` parses;
- the release-tag shape its install step clones.

Only `harness-control.yml`'s header declares the dependency. Both headers carry the rule *"DECLARED MIRRORS — a rename on either side is an edit to both"*, and the one existing cross-file mirror between these two files, the `harness-review-<branch>` group, is declared in both. Someone who edits `harness-run.yml` reads that file's own `DECLARED MIRRORS`, and nothing there tells them that renaming the env key, moving it, or changing the tag shape breaks every mention. The breakage would also be quiet: the fetch step is `continue-on-error`, so each mention would get the no-plugin reply.

**Fix.**

- [ ] In `cli/templates/github/workflows/harness-run.yml` → `DECLARED MIRRORS`, extend the `harness-control.yml` row so that it reads:

```
#   harness-control.yml               the concurrency group
#                                     `harness-review-<branch>`, shared by its
#                                     review jobs and the `collect` job here;
#                                     and, read by its `Fetch the pinned
#                                     plugin` step, the first
#                                     `HARNESS_CLI_VERSION:` env line (key, then
#                                     the quoted version) and the release-tag
#                                     shape `autonomous-sdlc-harness--v<version>`
#                                     of the `Install the pinned plugin` step
```

- [ ] If `cli/test/outer-loop-scripts.test.mjs`, or any other suite, compares this header byte for byte, update its expectation in the same edit. Find them with `grep -rn "harness-review-<branch>\`, shared by its" cli/test`.
