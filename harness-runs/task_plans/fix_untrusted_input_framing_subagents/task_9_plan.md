### Task 9 — Register the untrusted-input corpus check as a tree guard

**Goal:** Add the `treeGuards` entry that makes every unit touching a plugin Markdown file run `cli/test/untrusted-input-corpus.test.mjs`, so a later change that adds a reader without the pointer — or drops one — fails inside that unit rather than only at the branch's gate round.

**Depends on:** Task 8, which creates `cli/test/untrusted-input-corpus.test.mjs` and names this task as its registering task (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 8). This task edits nothing that test reads.

### Targets

- `harness.config.json` (repository root)

**Work:**

- [ ] Append one object to the `treeGuards` array: `{ "test": "test/untrusted-input-corpus.test.mjs", "covers": "plugin/**/*.md" }` — `test` relative to the `cli` workspace as every existing entry's is (compare `test/main-repo-resolution-corpus.test.mjs`), `covers` repo-relative. Keep the file's existing two-space formatting and key order; change no other entry or key.

**Verification:**

- The new entry carries exactly the two keys every existing `treeGuards` entry carries, `test` and `covers`, both strings — the shape `schemas/harness.config.schema.json` declares for an entry — and the file still parses as JSON. The schema validation itself runs at the branch's gate round, not here.
- `git diff -- harness.config.json` adds exactly the one object and nothing else.
- The entry's `test` value names a file that exists at `cli/test/untrusted-input-corpus.test.mjs`.
