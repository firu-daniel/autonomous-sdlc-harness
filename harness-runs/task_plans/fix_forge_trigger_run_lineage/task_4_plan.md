### Task 4 — Ask GitHub for run history in the trigger's name derivation, and cover it

**Goal:** Have `remote-run.sh trigger` derive its branch name with the run-history probe, so that an issue whose title folds to a name with run history starts on the next free suffix. A failed history listing becomes a commented refusal.

**Depends on:**
- **Task 3**, which adds the optional fifth argument `hr_derive_branch <root> <text> <fallback> [<registry>] [<gh_cli>]`. With a non-empty `<gh_cli>`, a name under which any `harness-run.yml` run is listed is taken: `HR_TAKEN_WHY="a run of the run workflow listed under that name"`. A failed listing returns 2: `HR_TAKEN_WHY="the run history of <name> could not be listed"`. The probe's argument vector is `run list --workflow harness-run.yml --branch <name> --limit 1 --json databaseId`.
- **Task 2**, which owns the shape of `cli/test/remote-trigger.test.mjs`'s `STUB` and the `trigger` header paragraph that this task extends.

**Where this task stops.** It wires the existing call site and covers it. Task 3 owns the rule itself, and Task 11 owns its documentation.

### Targets

- `cli/templates/scripts/remote-run.sh`: the `hr_derive_branch` call in `verb_trigger`, and the `trigger` header paragraph's "derives the branch with `hr_derive_branch <title> issue_<number>`" sentence.
- `cli/test/remote-trigger.test.mjs`: its `STUB`, its header and one new case.

**Work:**

- [ ] **`verb_trigger`**: call `hr_derive_branch "$root" "$title" "$fallback" "" "$GH"`. `$GH` is the script's existing `gh` binary (`HARNESS_GH_CLI` or `gh`), so the probe reaches the same stub as every other call. The existing `status` arms already cover the outcomes: 3 is the every-suffix-taken refusal, and any other non-zero status is `the branch name for … could not be checked (${HR_TAKEN_WHY})`. A failed probe is therefore commented with its reason, and the label is removed.
- [ ] **Header**: amend the derivation sentence to say the trigger passes `gh`, so run history counts as taken.
- [ ] **`STUB`**: answer the probe (identified by `--json databaseId`) from a per-branch table read from an environment variable, defaulting to `[]`, so that every existing case still derives its unsuffixed name. Keep Task 2's comment-lookup answer for the `--json url,displayTitle,headSha` call.
- [ ] **New cases**:
  - **(a)** A title that folds to `add_comments_to_items`, whose history table lists one run under that name. Expected: exit 0, the comment and the `workflow run … --ref add_comments_to_items_2` dispatch name `add_comments_to_items_2`, and the probe for the bare name appears in the stub log before the dispatch.
  - **(b)** A stub failing the probe. Expected: exit 2, no `workflow run`, one comment naming that the run history could not be listed, and the label removed.

**Verification:**

- `npm test -- test/remote-trigger.test.mjs` from `cli/` passes, with the two new cases, Task 2's cases and every existing case. In particular, `a second issue with the same title starts on <slug>_2` still passes on the existing origin-branch reason.
- The type check passes.
