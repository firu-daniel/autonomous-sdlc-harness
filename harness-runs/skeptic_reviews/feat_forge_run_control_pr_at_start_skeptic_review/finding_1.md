### 1. A round's start comment says the pull request is a draft again even when turning it back to a draft was refused

**File:** `cli/templates/scripts/remote-run.sh` (`forge_report`, the `round)` arm) — "# Written before the undo below, so it states the intent; a refusal is its warning line." and, further down the same function, "if [ \"$undo\" -eq 1 ] && ! gh_call pr ready \"$FORGE_PR\" --repo \"$FORGE_REPO\" --undo; then"

**Problem.** When a user-review round starts on a pull request that is not a draft, `forge_report round` puts *"This pull request is a draft again until the round completes."* into the round comment unconditionally. It posts the comment and the labels, and only then runs `gh pr ready <pr> --undo`. When that call is refused, the only trace is a `::warning::` line in the job log. The pull request keeps saying, in its own conversation, that it is a draft, while GitHub still shows it as ready for review for the whole round.

**Why it is reachable.** This is the case the branch itself designs for:

- `forge_open_pr` retries once without `--draft` when a draft create fails, setting `FORGE_PR_DRAFT=false`, because "drafts depend on the account's plan". So on a plan without drafts, the run's pull request is opened ready.
- `docs/github-run-control.md` → `## 8.` carries a row stating that *"A draft cannot be re-converted on a plan without drafts, so `gh pr ready --undo` is refused there"*, and that the round then runs *"on a pull request left ready for review"*.
- So on such a plan, **every** round start takes the refused path, and every round comment states the opposite of what the §8 row says happens.

**Precedent this departs from.** The sibling transition in the same file, `verb_deliver`'s ready flip, runs the flip first and then picks its comment by the outcome (`ready` is `flipped`, `not-draft` or `refused`). The code review's Finding 2 also fixed the issue-side comment so that it no longer claims a state the refused flip did not reach. The `round` arm is the only flip whose comment ignores the outcome. Its only justification is the code comment "states the intent", and a code comment is not an exclusion basis (lessons ledger → *Ports and parallel implementations*).

**Fix.** Run the undo inside the `round)` arm, before the comment text is final, and word the comment by the outcome.

- [ ] In `forge_report`, replace the `round)` arm:
  ```bash
      round)
        text="A user-review round started on \`$br\`; a \`completed\` comment follows when the branch is ready for review again."
        # Written before the undo below, so it states the intent; a refusal is its warning line.
        if [ "$kind" = pr ] && [ "$FORGE_PR_DRAFT" = false ]; then
          undo=1
          text="$text This pull request is a draft again until the round completes."
        fi ;;
  ```
  with:
  ```bash
      round)
        text="A user-review round started on \`$br\`; a \`completed\` comment follows when the branch is ready for review again."
        # The undo runs before the comment is written, so the comment states its outcome.
        if [ "$kind" = pr ] && [ "$FORGE_PR_DRAFT" = false ]; then
          if gh_call pr ready "$FORGE_PR" --repo "$FORGE_REPO" --undo; then
            text="$text This pull request is a draft again until the round completes."
          else
            echo "::warning::remote-run.sh: report: turning pull request #$FORGE_PR back to a draft was refused: $GH_ERR"
            text="$text Turning this pull request back to a draft was refused, so it stays ready for review while the round works."
          fi
        fi ;;
  ```
- [ ] In the same function, delete the block after the two `forge_set_state` lines:
  ```bash
    if [ "$undo" -eq 1 ] && ! gh_call pr ready "$FORGE_PR" --repo "$FORGE_REPO" --undo; then
      echo "::warning::remote-run.sh: report: turning pull request #$FORGE_PR back to a draft was refused: $GH_ERR"
    fi
  ```
  and remove ` undo=0` from the function's second `local` line (the one ending `route engine="" undo=0`).
- [ ] In the same file's header, `report` paragraph, replace:
  > On a pull-request target that is not a draft, `round` runs `gh pr ready --undo` after its labels, with the caller's own token, and its comment says the pull request is a draft again until the round completes; a refusal (a plan without drafts) is one `::warning::` line naming gh's error.

  (wrapped across the lines beginning `# On a pull-request target that is not a draft`) with:
  > On a pull-request target that is not a draft, `round` runs `gh pr ready --undo` before its comment, with the caller's own token, and its comment says the pull request is a draft again until the round completes; a refusal (a plan without drafts) is one `::warning::` line naming gh's error, and the comment then says turning it back was refused and it stays ready for review while the round works.

  Keep the header's existing `# ` comment wrapping.
- [ ] In `cli/test/remote-report.test.mjs`:
  - In the file's header comment, change *"undoing a ready one after its labels"* to *"undoing a ready one before its comment"*.
  - Rename the test `'round on a ready pull request turns it back to a draft after its labels, and says so'` to `'round on a ready pull request turns it back to a draft before its comment, and says so'`. In its body, replace the two lines
    ```js
      const lastLabel = calls.findLastIndex((call) => /\/labels\b/.test(call.line));
      assert.ok(calls.findIndex((call) => call.args[1] === 'ready') > lastLabel, calls.map((c) => c.line).join('\n'));
    ```
    with
    ```js
      const firstComment = calls.findIndex((call) => /issues\/12\/comments\b/.test(call.line));
      assert.ok(calls.findIndex((call) => call.args[1] === 'ready') < firstComment, calls.map((c) => c.line).join('\n'));
    ```
  - In `'round whose undo is refused prints one ::warning:: line, exits 0 and keeps the running label'`, append before the closing `});`:
    ```js
      const [posted] = commentsOn(f.calls(), 12);
      assert.ok(!posted.body.includes(DRAFT_AGAIN), posted.body);
      assert.match(posted.body, /Turning this pull request back to a draft was refused, so it stays ready for review while the round works\./);
    ```
  Run only that file: `npm test --workspace cli -- test/remote-report.test.mjs`.
