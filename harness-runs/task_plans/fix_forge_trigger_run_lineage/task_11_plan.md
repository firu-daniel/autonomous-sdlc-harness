### Task 11 — State run history as taken, the `headSha` comment lookup and the new not-verified rows in `docs/github-issue-trigger.md`

**Goal:** Bring the issue-trigger document in line with Tasks 2–5:
- "What counts as taken" lists run history;
- the comment step says how the dispatched run is identified;
- the setup step says the trigger answers appear on every `remote-github` outcome;
- §7 records what is now fixed but not yet re-observed on GitHub, and what round 5 did observe.

**Depends on:**
- **Task 3 and Task 4.** With `gh` passed, a name under which any `harness-run.yml` run is listed is taken, with the reason `a run of the run workflow listed under that name`. A failed listing is a refusal: `the run history of <name> could not be listed`.
- **Task 2.** The comment names the run whose `headSha` equals `refs/remotes/origin/<branch>` after `start`, looked up at most `TRIGGER_RUN_LOOKUP_TRIES` times, else the filtered run list. It never names an older run.
- **Task 5.** The trigger answers appear on `pass`, `warn` and `fail`.

### Targets

- `docs/github-issue-trigger.md`:
  - `## Turning it on, in short` → **6. Check the setup.**;
  - `## 1.` step 6, **The comment and the label.**;
  - `## 2. The branch name` → **What counts as taken**, and the closing paragraph of that list;
  - `## 7. What is not verified here`'s table, and `### Verified in Gate 12 round 5`.

**Work:**

- [ ] **What counts as taken**: add a fifth reason with its rationale, in the list's own style. *A run of the run workflow listed under that name*: an abandoned, unmerged branch leaves no artifact on the default branch, yet its runs and their state bundles stay listed under its name for the artifact retention. A reused name would inherit them (Gate 12 round 5, finding 1). The trigger asks GitHub this once per candidate. Amend the list's closing sentence ("A name that cannot be judged, because a listing failed, is a refusal") to include the run listing. Amend the "for it these two never fire" sentence only if it now reads wrongly.
- [ ] **`## 1.` step 6**: the job looks up the `harness run <branch>` run whose head commit is the one `start` pushed, so a run of an earlier branch of the same name is never named. Otherwise it comments the filtered run list. **6. Check the setup.**: add that both answers appear whatever else `remote-github` reports.
- [ ] **§7.** Add a row for the same `headSha` behaviour Task 10 records in `docs/remote-execution.md` → `## 6.`, with this document's own "What rests on it" (the comment lookup) and the same source, *Gate 12 (xiii) leg (d) records it*. Amend the round-5 verified row's second sentence: the defect it records was fixed in `fix_forge_trigger_run_lineage` by the `headSha` match and is not yet re-observed. Add a verified row: *runs of a deleted branch stay listed under its name by `gh run list --branch`*, observed in round 5 when `restore` found run `36569531374` of the deleted `feat_invoices`. That observation is the evidence the run-history rule rests on.

**Verification:**

- `git grep -n 'What counts as taken' -A12 -- docs/github-issue-trigger.md` shows the run-history reason within the list.
- The reason phrase quoted in the document is byte-identical to `HR_TAKEN_WHY`'s text in `cli/templates/scripts/lib/harness-run-lib.sh`: `git grep -nF 'a run of the run workflow listed under that name' -- docs/github-issue-trigger.md cli/templates/scripts/lib/harness-run-lib.sh` matches in both files.
- Every new §7 row has the table's four cells, and every verified row has two.

**Deviations from plan:**
- The first `**Verification:**` command as written (`git grep -n 'What counts as taken' -A12 -- …`) fails with `fatal: unable to resolve revision: -A12`, because `-A12` after the pattern is read as a revision. Ran `git grep -n -A12 'What counts as taken' -- docs/github-issue-trigger.md` instead; it shows the run-history reason within the list.
- The §7 lead sentence said "the row moved to *Verified in Gate 12 round 5*"; with a second verified row it now reads "the rows under *Verified in Gate 12 round 5*".
