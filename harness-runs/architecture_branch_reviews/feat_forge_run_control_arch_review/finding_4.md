### 4. Point the `user_reviews/` template README at the pull-request round's owner instead of restating it

**Severity:** Should Fix

**Site:** `cli/templates/state-dir/user_reviews/README.md`, the second paragraph's new sentence opening `That round opens with the review's text verbatim, or `(The review carries no summary.)`` and running through `so a reader re-locates a comment the round's fixes may have moved.`

**Problem.** This branch adds a new run-artifact shape: the user-review round that `remote-run.sh control` builds from a pull-request review. It has a body, a `---` provenance line, `## Inline comments`, `` ### `<path>`, line <n> `` headings, a `Made on commit` line and a fenced `diff` hunk. The shape is now written out in full in two places:
- `cli/templates/scripts/remote-run.sh`, the header's `control` paragraph (*THE REVIEW*). This is the producer.
- `cli/templates/state-dir/user_reviews/README.md`, the sentence above.

The one consumer, `plugin/agents/user-review-fix-plan-writer.md` → `## Process` step 1, names the script's header as the owner: *"its shape is owned by `<scripts_dir>/remote-run.sh`, the header's `control` paragraph"*. The README is a second, full statement of a wire. A later change to the heading form in the script, which is the file the writer is told to trust, would leave the README describing a format nothing produces. This breaks `.claude/context/plugin.md` → `## The placeholder vocabulary` (*"A run-artifact path shape is a wire … each is owned by the file that states it"*) and `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*).

The README describing the directory is legitimate. Restating the round's internal format is the problem. Both files are in the `cli` layer.

**Fix.** In `cli/templates/state-dir/user_reviews/README.md`, keep the first clause of the change, which says a pull-request review requesting changes on the run's branch becomes the next round. Replace the sentence that spells out the round's layout with one pointer, for example: `Its layout — the review's text, a provenance line, and each inline comment with its file, line, commit and diff hunk — is set by the \`control\` paragraph of \`remote-run.sh\`'s header in the configured scripts directory.` Leave the rest of the paragraph, including the commit-and-push sentence in the following paragraph, unchanged. No test file is named here. If one asserts the removed sentence, update that assertion and run that file only.
