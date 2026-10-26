### Task 7 — Document `treeGuards` and the `tree-guards` check in the documents of record

**Goal:** `docs/config.md` documents the new key and the `<tree_guards>` token, and `docs/cli.md` §7 lists the new `doctor` check and how it grades — the fourth place a configuration key lives, and the catalogue every `doctor` check has a row in.

**Depends on:** Task 1 (the model and shape check), Task 2 (the `tree-guards` check), Task 4 (the `<tree_guards>` token and `## The test-run rule` point 7) and Task 6 (the schema). This task restates, and must not contradict:

- the key: optional top-level array, `default: []`, entries `{ test, covers }`, both required non-empty strings, no other key; `test` is the argument the single-file test command takes, verbatim, **not necessarily repo-relative**; `covers` is a repo-relative glob — `**` zero or more whole path segments, `*` any run inside one segment, `?` one character inside one segment, whole-path match;
- the run (owned by `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7 — cite it, do not restate the matching steps): after a unit's own test run, every guard whose `covers` matches a path in the unit's change runs through the single-file test command, and a failing guard is handled like a failing own test;
- the check: id `tree-guards`, title *every treeGuards test names a file this repository has*, listed after `layer-drift`; PASS when none are configured or all resolve; WARN naming each `test` with no file at the repository root or under any `layers[].path`, an absolute or `..`-bearing value included; never FAIL.

**Where this layer stops.** Prose in two documents of record. No source, schema or plugin file changes here.

### Targets

- `docs/config.md` — `## 4. Token → class → home` and `## 5. Key reference`.
- `docs/cli.md` — §7's check table and its per-check bullets.

**Work:**

- [ ] `docs/config.md` §5: add a `treeGuards` row after the `sandbox.optOut` row — type `array of { test, covers }`, default `[]`, meaning as above: what a tree guard is (a test that enforces a rule over every file under a path, so a unit can break it without touching it), when the unit loop runs one (point 7, cited), the `test` exception to the file's repo-relative rule stated outright, the glob syntax, the self-registration rule (a new test that reads a tree of source files as text adds itself here in the same change), and that `doctor`'s `tree-guards` check warns on a `test` naming no file.
- [ ] `docs/config.md` §4: add the row `` `<tree_guards>` | config value | `treeGuards` `` beside `<test_cmd>` / `<typecheck_cmd>`.
- [ ] `docs/cli.md` §7: add the `tree-guards` row to the check table directly after `layer-drift`, with the title above as its *Asks* cell, and one bullet among the per-check bullets stating the grading above, the two resolution bases and why each, and that it does not grade whether `covers` matches anything.

**Verification:**

- `git grep -n "treeGuards\|tree-guards\|<tree_guards>" -- docs/config.md docs/cli.md` shows the §5 row, the §4 row, the §7 table row and the §7 bullet.
- In `docs/cli.md` §7 the table's row order matches `CHECKS` in `cli/src/doctor/checks.ts` around the insertion: `layer-drift`, `tree-guards`, `ignore-rules`.
- The §5 row cites `plugin/instructions/unit_loop_core.md` → `## The test-run rule` for the run rather than restating its changed-path commands.
