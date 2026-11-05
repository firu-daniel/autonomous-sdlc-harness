### 5. The `harness-control.yml` row of the workflow's mirrors header lost a column of alignment

**Site:** `cli/templates/github/workflows/harness-run.yml`, the header's `DECLARED MIRRORS` block, the line `#   harness-control.yml              the concurrency group`.

**Problem.** Commit `67f1da35` added the new `harness-run-lib.sh` entry to this block and also removed one space from the following `harness-control.yml` line. That line's second column now starts one character left of every other row (for example `#   cli/src/config/model.ts           DEFAULTS.scriptsDir …`) and of its own continuation lines (`#                                     \`harness-review-<branch>\`, …`). On `origin/dev` it read `#   harness-control.yml               the concurrency group`. Nothing parses this block, so this is presentation only.

**Fix.**

- [ ] Restore the space, so the line reads exactly `#   harness-control.yml               the concurrency group` (fifteen spaces between `harness-control.yml` and `the`). This is a comment-only edit, and it needs no test.
