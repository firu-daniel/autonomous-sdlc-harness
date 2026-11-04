### Task 15 — Register Task 14's tree guard in `harness.config.json`

**Goal:** Add the `treeGuards` entry for `cli/test/no-container-home-paths.test.mjs`, so that a unit whose change touches a Markdown file runs it after its own test run. A unit that reintroduces the container user's home spelling then meets the failure in its own change, not first at Run gates (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 7 and 8).

**Depends on:** Task 14, which creates `cli/test/no-container-home-paths.test.mjs`. That tree-reading test lists the repository's tracked and untracked-unignored files and fails on any line naming the Gate 15 container user's home. It names this task as its registering task. An entry naming a file that does not exist yet would be selected and fail for every unit before Task 14, which is why this task ships after it.

**The entry's shape** follows the existing entries and `docs/config.md` → the `treeGuards` row. `test` is the single-file test command's argument as that command takes it, relative to `cli/` (`npm test --workspace cli -- test/<name>.test.mjs`). `covers` is a repo-relative glob. The guard reads every file, but the spellings it exists to stop live in Markdown (docs, run artifacts, plans, reviews), so `**/*.md` selects it for exactly the changes that can reintroduce one. A non-Markdown reintroduction is still caught by the full suite at Run gates.

### Targets

- `harness.config.json`

**Work:**

- [ ] Append `{ "test": "test/no-container-home-paths.test.mjs", "covers": "**/*.md" }` as the last element of `treeGuards`, in the file's existing two-space JSON style. Change no other key.

**Verification:**

- `jq -r '.treeGuards[] | "\(.test) \(.covers)"' harness.config.json` lists the new pair as its last line, and lists every earlier pair unchanged.
- `jq -e . harness.config.json` exits 0: the file is still one valid JSON document.
- `test -f cli/test/no-container-home-paths.test.mjs` exits 0, so `doctor`'s `tree-guards` check, which resolves `test` against `layers[].path` `cli`, finds the file.
