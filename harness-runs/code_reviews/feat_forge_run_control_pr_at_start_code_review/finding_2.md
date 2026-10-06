### 2. When the ready flip is refused, the issue's `completed` comment still says the pull request is ready for review

**File:** `cli/templates/scripts/remote-run.sh` (`verb_deliver`) — "Its pull request #$FORGE_PR is ready for your review: $pr_url" and "Pull request #$FORGE_PR is ready for review again: $pr_url"

`verb_deliver` picks the pull request's `completed` text by the flip's outcome (`ready` is `flipped`, `not-draft` or `refused`), so on a refused flip the pull request's comment says *"Marking this draft ready for review was refused; mark it ready by hand."* The issue's comment, written a few lines further down, ignores `ready`. It always says *"Its pull request #N is ready for your review"* for a run, or *"Pull request #N is ready for review again"* for a round. On `refused` the pull request is still a draft, so the two comments `deliver` posts for one completion contradict each other. Someone watching only the issue is told the pull request is ready while it is still a draft, and nothing on the issue tells them it needs marking ready by hand. The task prompt (item 4) makes a refused flip a warning that never fails the step, so the comments are the only place a person learns it was refused.

`cli/test/remote-deliver.test.mjs` → *"a refused flip is one warning line, exit 0, the refused sentence, and both comments still posted"* checks the issue comment's count and not its text, so this was not caught.

**Fix:** in `verb_deliver`, inside `if [ -n "$FORGE_ISSUE" ]; then` under `if [ -n "$FORGE_PR" ]; then`, replace the two-arm `if [ "$noun" = round ]` that sets `text` with:

```bash
      if [ "$ready" = refused ]; then
        text="The harness $noun on \`$branch\` $verb_done. Its pull request #$FORGE_PR is still a draft — marking it ready for review was refused, so mark it ready by hand: $pr_url"
      elif [ "$noun" = round ]; then
        text="The harness round on \`$branch\` finished. Pull request #$FORGE_PR is ready for review again: $pr_url"
      else
        text="The harness run on \`$branch\` completed. Its pull request #$FORGE_PR is ready for your review: $pr_url"
      fi
```

Keep the `deliver_comment "$FORGE_ISSUE" …` call after it unchanged; it still appends *"Review it there; a review that requests changes starts another round."*

Then, in `cli/test/remote-deliver.test.mjs` → that same refused-flip case, replace `assert.equal(commentsOn(calls, 7).length, 1);` with:

```js
  const onIssue = commentsOn(calls, 7);
  assert.equal(onIssue.length, 1);
  assert.match(onIssue[0].body, /still a draft — marking it ready for review was refused/);
  assert.doesNotMatch(onIssue[0].body, /is ready for your review/);
```

Run only that file: `npm test --workspace cli -- test/remote-deliver.test.mjs`.
