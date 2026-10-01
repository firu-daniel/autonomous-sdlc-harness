### Task 3 — Count run-workflow history as "taken" in the run library's branch-name rule

**Goal:** Give the run library's branch-name rule an optional GitHub probe. With the probe, a name under which any run of the run workflow is listed counts as taken, so `feat: invoices` after an abandoned `feat_invoices` derives `feat_invoices_2`. A listing that fails is a refusal, never a pass, as the rule already says of every other check.

**Where this task stops.** The library gains the probe and an **optional** argument that enables it. No caller passes that argument yet. Wiring the trigger to pass `gh` is **Task 4**, and so is the trigger-level test. With the argument absent, every existing caller and every existing `cli/test/branch-naming.test.mjs` case behaves exactly as today.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the `DERIVING A BRANCH NAME FROM A TITLE.` section header, a new `hr_branch_run_history`, `hr_branch_taken_judge`, `hr_branch_name_taken` and `hr_derive_branch`.
- `cli/test/branch-naming.test.mjs`: its file header and new cases.

**The interface this task defines, which Task 4 calls and Task 11 documents:**

- **`hr_branch_run_history <root> <gh_cli> <name>`**:
  - Runs `"<gh_cli>" run list --workflow "$HR_REMOTE_WORKFLOW_RUN_FILE" --branch <name> --limit 1 --json databaseId` from `<root>`, in a subshell `cd`. The workflow name comes from `hr_remote_names_var`; no new literal is introduced.
  - Return 0 when the answer is a non-empty JSON array (history), 1 when it is `[]` (none), and 2 when `<gh_cli>` cannot run, exits non-zero, or answers anything else.
  - Sets no `HR_` variable.
- **`hr_branch_taken_judge <root> <name> [<registry>] [<gh_cli>]`.** After every existing check, when `<gh_cli>` is non-empty:
  - history → return 0, with `HR_TAKEN_WHY="a run of the run workflow listed under that name"`;
  - cannot tell → return 2, with `HR_TAKEN_WHY="the run history of <name> could not be listed"`.
- **`hr_branch_name_taken <root> <name> [<registry>] [<gh_cli>]`** and **`hr_derive_branch <root> <text> <fallback> [<registry>] [<gh_cli>]`** pass `<gh_cli>` through to the judge. A caller with no registry passes `""` in the fourth position.

**Work:**

- [ ] **`hr_branch_run_history`**: the probe above, with a doc comment covering two points.
  - Why the probe is per candidate and not one listing of every branch: a bounded all-branch listing could miss an old name.
  - Why GitHub's run list is evidence of a reused name: Gate 12 round 5 listed run `36569531374` of the deleted `feat_invoices` under that name (`docs/development.md` → Gate 12 → Round 5, finding 1).
  - It uses Bash 3.2 and jq 1.5 only (the library header's floors), and fixed argument vectors only.
- [ ] **`hr_branch_taken_judge`**: the optional fourth argument and the two outcomes above, checked **last** so the free local checks short-circuit first. **`hr_branch_name_taken`** and **`hr_derive_branch`**: the optional argument, passed through. Update each function's doc comment, including `hr_branch_name_taken`'s "Taken: …" list.
- [ ] **Section header**: amend `THIS SECTION ONLY READS. It fetches nothing …` to say that, given a `<gh_cli>`, it also asks GitHub one read per candidate, and still writes nothing.
- [ ] **`cli/test/branch-naming.test.mjs`**:
  - Add a small `gh` stub, written into the fixture and answering `run list` from a per-branch table.
  - Case: a name with run history derives `<name>_2`.
  - Case: a name with history on both `<name>` and `<name>_2` derives `<name>_3`.
  - Case: a stub that exits non-zero on `run list` makes `hr_derive_branch` return 2, with `HR_TAKEN_WHY` naming the run history.
  - Case: with no `<gh_cli>` the same fixture derives `<name>` and the stub's log is empty.
  - Amend the file header to state the run-history rule.

**Verification:**

- `npm test -- test/branch-naming.test.mjs` from `cli/` passes, with the four new cases and every existing case.
- The type check passes.
- `git grep -n 'harness-run.yml' -- cli/templates/scripts/lib/harness-run-lib.sh` shows no new occurrence beyond the existing `HR_REMOTE_WORKFLOW_RUN_FILE` assignment and its mirror row, so the probe names the workflow through that variable.
