### 7. `control`'s exit map says exit 1 means "not an `issue_comment` event", but it also handles `pull_request_review`

**Severity:** Nice to Have

**Site:** `cli/templates/scripts/remote-run.sh`, the header's `control` paragraph, its closing exit map, the line `#     1  not an \`issue_comment\` event, or the event could not be read`.

**Problem.** The same paragraph says earlier that `control` handles `GITHUB_EVENT_NAME` `issue_comment` **and** `pull_request_review`. `verb_control`'s own `case` accepts both and exits 1 only for any other event name. The exit map's line 1 names only `issue_comment`, so a reader of the map alone would expect a review event to exit 1.

**Fix.** Replace that line with `#     1  neither an \`issue_comment\` nor a \`pull_request_review\` event, or the event could not be read`, keeping the `#     ` indentation. No test covers header text.
