### 3. The `stopped` comment on a closed pull request tells the reader to comment `resume` there, which is refused on a closed pull request

**File:** `cli/templates/scripts/remote-run.sh` (`forge_report`, the `stopped)` arm) — `text="The harness run on \`$br\` was stopped. Comment \`${COMMAND_HANDLE} resume\` to continue it from its committed ledger.`; and (`control_close`) — `comment \`$COMMAND_HANDLE resume\` while the branch exists to continue it.`

**The problem.** A `pull_request: closed` event runs `stop <b> --pr <n>`, and `forge_report` posts the `stopped` comment on that **closed** pull request. The comment is built from the generic `stopped` text, which says to comment `@sdlc-harness resume` and that *"A review that requests changes is collected now"*. `control_close`'s note then repeats the `resume` instruction.

On a closed pull request, though, `control_branch_from_pr` refuses every command: `pull request #<n> is CLOSED, not open` with *"Reopen it, then comment again."* So the one instruction the comment gives fails on the item it is posted on. The reader only learns the real way on, which is to reopen first or comment on the issue, from a refusal. The `docs/github-run-control.md` → `## 5.` table row `stopped (closed or deleted)` names its way on as `@sdlc-harness resume` while the branch exists, without saying where that comment works.

**Fix.** The explicit `<pr>` argument reaches `forge_report` only from a close (`stop --pr`, which only `control_close` passes). Give that case its own text, and drop the duplicated way on from the note.

- [ ] In `forge_report`, `stopped)` arm, add a branch between the `gone` text and the generic one:

```bash
      if [ -n "$gone" ]; then
        text="The harness run on \`$br\` was stopped: its branch was deleted, so the run cannot be resumed. Its workflow runs and their artifacts are kept."
      elif [ -n "$pr" ]; then
        text="The harness run on \`$br\` was stopped. While the branch exists, reopen this pull request and comment \`${COMMAND_HANDLE} resume\` here, or comment it on the run's issue, to continue it from its committed ledger."
      else
```

  The generic `text=` line that follows stays unchanged.
- [ ] In `control_close`, change the non-deletion note to `note="$note Its workflow runs and their \`$STATE_ARTIFACT_NAME\` artifacts are kept."` For an issue close, the generic `stopped` text already names `resume`. For a pull-request close, the new text above names it.
- [ ] In the header's `THE CLOSE.` paragraph, change *"Every note but the deletion's adds that the workflow runs and their `harness-state` artifacts are kept and that `@sdlc-harness resume` continues the run while the branch exists."* to *"Every note but the deletion's adds that the workflow runs and their `harness-state` artifacts are kept; a closed pull request's `stopped` comment says to reopen it, or to use the issue, before commenting `@sdlc-harness resume`."*
- [ ] In `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, in the table row `stopped (closed or deleted)`, change the way-on cell to `` `@sdlc-harness resume` while the branch exists: on the issue, or on the pull request once it is reopened; none once the branch is deleted ``.
- [ ] In `cli/test/remote-control-close.test.mjs`, in the case `pull request #9 closed unmerged: the comment and the label go to #9`, add `assert.match(body, /reopen this pull request and comment `@sdlc-harness resume` here/);`. In the issue case, keep asserting `/`harness-state` artifacts are kept/`. Run `npm test -- test/remote-control-close.test.mjs` from `cli/`.

**Deviations from plan:**
- The `cli` dispatch's `stopped)` closed-pull-request text adds one sentence to the finding's wording: `A merged pull request cannot be reopened; after a merge, use the issue.` `control_close` passes `--pr` on `pr_merged` as well as `pr_closed` (its `stop_flags` case), and a merged pull request cannot be reopened, so the finding's text alone would give a merged pull request an instruction that cannot be followed. The merged case in `cli/test/remote-control-close.test.mjs` asserts `/after a merge, use the issue/`.
- The `docs/github-run-control.md` bullet belongs to the `general` layer of this unit's tag and is left to that dispatch. That dispatch's way-on cell should say the same: reopening applies only to a pull request closed unmerged.
- The `general` dispatch's way-on cell adds one clause to the finding's wording, `a merged pull request cannot be reopened, so after a merge only on the issue`, matching the `cli` dispatch's merged-pull-request sentence above.
