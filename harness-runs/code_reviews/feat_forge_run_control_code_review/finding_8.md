### 8. The fix-plan writer's pull-request review comment form omits the line-less heading `remote-run.sh` writes for a comment on a whole file

**Severity:** Should Fix

**Site:** `plugin/agents/user-review-fix-plan-writer.md` → `## Process`, the **Pull-request review comment** bullet, beginning `(a `` ### `<file>`, line <line> `` or `` ### `<file>`, original line <line> (outdated) `` heading under `## Inline comments``.

**Problem.** The producer, `cli/templates/scripts/remote-run.sh` → `control_review_round`, builds each inline-comment heading in its `jq` program with three outcomes, not two:

```
+ (if .line != null then ", line \(.line)"
   elif .original_line != null then ", original line \(.original_line) (outdated)"
   else "" end)
```

When GitHub reports both `line` and `original_line` as `null`, which is the case for a comment made on a whole file rather than on a line, the heading is the bare `` ### `<file>` ``. The plugin bullet names only the two line-bearing forms. It also tells the writer to re-locate the comment by its hunk's context and `+` lines, and to file it under `## Out of scope / verified-OK` when "the hunk's lines exist nowhere in the file". A file-level comment has no line to re-locate, and its hunk need not identify one, so a writer that follows that bullet literally can discard a real observation as out of scope. `.claude/context/plugin.md` → `## Wires: dispatch in, return out` treats a quoted heading literal as interface, so the consumer has to name every shape the producer emits.

The bullet's step-1 rule ("each comment under `## Inline comments` is one observation") still counts the comment. Only its verification route is unstated, which is why this is graded Should Fix.

**Fix.**
- [ ] In that bullet, replace the opening parenthetical's heading list
  `` (a `` ### `<file>`, line <line> `` or `` ### `<file>`, original line <line> (outdated) `` heading under `## Inline comments`, ``
  with
  `` (a `` ### `<file>`, line <line> ``, `` ### `<file>`, original line <line> (outdated) `` or `` ### `<file>` `` heading under `## Inline comments`, ``
- [ ] After the sentence ending `an `(outdated)` heading is one GitHub could no longer map to the current diff.`, insert this sentence:
  `A bare `` ### `<file>` `` heading is a comment on the whole file: there is no line to re-locate, so check the observation against the current `<file>` as a whole, and never file it as out of scope because its hunk matches nothing.`
- [ ] In the `## Resolved values` paragraph's list of ordinary placeholders, the existing entry `` `<sha>` / `<file>` / `<line>` in the pull-request review comment form `` already covers the new heading. Leave it unchanged.
