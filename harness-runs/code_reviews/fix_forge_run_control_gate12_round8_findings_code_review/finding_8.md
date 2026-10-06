### 8. The refused-push reason says "names the refusal above" in a pull-request comment that has nothing above it

**File:** `cli/templates/scripts/remote-run.sh` (`verb_start` and `verb_review`) — "(push-branch.sh names the refusal above)"

`start` and `review` now fail a refused push with:

```bash
placement_fail "pushing $branch: the remote refused the push (push-branch.sh names the refusal above)"
review_fail "pushing $branch: the remote refused the push (push-branch.sh names the refusal above)"
```

In a job log, "above" is right. `collect`, however, posts a failed child's **last stderr line** alone as a pull-request comment (header, `` `collect` STARTS THE NEXT ROUND ``: "naming its last stderr line"), and `control` does the same in its reply. In those comments nothing sits above the line, so the pointer leads nowhere. Round 8's finding 2 was a misleading reason in exactly that comment.

**Fix:** keep the wire phrase "the remote refused the push", which `docs/github-run-control.md` → `## 2.` and the tests quote, and repoint only the parenthetical, in both calls:

```bash
placement_fail "pushing $branch: the remote refused the push (push-branch.sh's lines in this job's log name why)"
review_fail "pushing $branch: the remote refused the push (push-branch.sh's lines in this job's log name why)"
```

No test asserts on the parenthetical (`cli/test/remote-start.test.mjs` and `cli/test/remote-collect.test.mjs` match only "the remote refused the push"). This fix edits no test file and runs no test; the full suite runs in the Run gates phase.
