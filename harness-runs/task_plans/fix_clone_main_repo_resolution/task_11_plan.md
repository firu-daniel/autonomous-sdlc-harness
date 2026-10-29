### Task 11 — Register the corpus check as a tree guard in `harness.config.json`

**Goal:** Make the unit loop run Task 8's corpus check whenever a later change touches a Markdown file under `plugin/`. A suite that reads a tree of repository files as text must be registered in `treeGuards` (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 8), and Task 8 names this task as its registering task.

**Depends on:** Task 8, which creates `cli/test/main-repo-resolution-corpus.test.mjs`. That suite reads every `.md` file under `plugin/` and asserts that the `<MAIN_REPO>` resolution clause is carried byte-identical at its sites. The suite runs through the single-file command `npm test --workspace cli -- test/<name>.test.mjs`, so the `test` value is relative to `cli/`, like the existing entries.

### Targets

- `harness.config.json` — the `treeGuards` array only.

**Work:**

- [ ] Append `{ "test": "test/main-repo-resolution-corpus.test.mjs", "covers": "plugin/**/*.md" }` to `treeGuards`, after the existing four entries. Keep the file's existing formatting (two-space indent, one object per entry as the neighbours are written), and change no other key.

**Verification:**

- `jq -e '.treeGuards | map(select(.test == "test/main-repo-resolution-corpus.test.mjs" and .covers == "plugin/**/*.md")) | length == 1' harness.config.json` exits 0.
- `git diff harness.config.json` adds that one entry and changes nothing else.
