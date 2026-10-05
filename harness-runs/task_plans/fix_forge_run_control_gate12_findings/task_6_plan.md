### Task 6 — Refuse a `harness-run.yml` run or pause dispatched from a ref other than its branch

**Goal:** Fix item 9. A `harness-run.yml` dispatch whose `action` is `run` or `pause` and whose ref (*Use workflow from*) is not its `branch` input fails fast, in a job that names the ref to use. It never runs a job GitHub would then list under the wrong `headBranch`, where every `--branch <branch>` lookup misses it (`remote-run.sh` → `list_runs`, `verb_pause_requested`).

**Why `stop` and `warm` are exempt.** `warm` dispatches on GitHub's default branch with that same branch as its input, so ref and input already agree. `stop` must stay dispatchable from the default branch: **Task 9** sends a deleted branch's stop marker from there, because the branch's own ref is gone. A stop marker's reader, `remote_branch_stopped`, matches the `harness stop <branch>` title across every branch's runs (`list_all_runs`), so it finds a marker under any ref. State this exemption in the header paragraph.

**Where this task stops.** The workflow and its template test only. No script changes. The docs, `docs/remote-execution.md` → *Working a run from GitHub alone*, are **Task 18**'s. `harness-control.yml` and the rest of `workflow-templates.test.mjs` are **Task 13**'s, after this one.

### Targets

- `cli/templates/github/workflows/harness-run.yml` — a new job, the `if:` of `run` and `collect`, and its header.
- `cli/test/workflow-templates.test.mjs` — assertions (this task edits it first; **Task 13** after).

**Work:**

- [ ] Add a job, `wrong-ref`. Its key must never be `run`, which `RUN_JOB_NAME` and the settledness test read. Its `if:` is `(inputs.action == 'run' || inputs.action == 'pause') && github.ref_name != inputs.branch`. Its one step takes `github.ref_name` and `inputs.branch` through `env:` (never a `${{ }}` inside `run:`), and prints `::error::this run was dispatched from '<ref>', but its branch input is '<branch>': GitHub lists a run under the ref it was dispatched from, so no lookup of '<branch>' would find it. Run the workflow again with Use workflow from set to '<branch>'.`, then exits 1. Keep a space after every `${{`, per the file's two rules.
- [ ] Append `&& github.ref_name == inputs.branch` to the `if:` of the `run` job and of the `collect` job, so neither runs on a wrong-ref dispatch. The `collect` job's `!cancelled()` would otherwise run it after a skipped `run`.
- [ ] Add a header paragraph, `THE REF CHECK`, naming finding 6 of Gate 12 round 6, the condition, why `stop` and `warm` are exempt (the reason above), and that the jobless `pause` marker gains a failing job only when its ref is wrong.
- [ ] `cli/test/workflow-templates.test.mjs`: assert the `wrong-ref` job's `if:` text, that its step reads the ref and branch only through `env:`, and that the `run` and `collect` `if:` lines carry the ref condition. Update the file's header list of what it checks for `harness-run.yml`.

**Verification:**

- `npm test -- test/workflow-templates.test.mjs` from `cli/` passes.
- `grep -n '${{[^ ]' cli/templates/github/workflows/harness-run.yml` finds nothing. A brace followed by a letter would be read as an `init` template token.
- The rendered workflow is still accepted by the suite's existing YAML-shape assertions. `init`'s render is unchanged apart from the new lines.
