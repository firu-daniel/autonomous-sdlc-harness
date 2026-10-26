### Task 2 — Add the `tree-guards` doctor check that warns on a `test` naming no file

**Goal:** `doctor` reports, as a warning, every `treeGuards` entry whose `test` names no file in this repository — the half of keeping the list current that a machine can check (task prompt, Proposal item 4: *"`doctor` warns when a `test` path does not exist"*).

**Depends on:** Task 1, which exports `configuredTreeGuards(config: HarnessConfig): readonly HarnessTreeGuard[]` from `cli/src/config/model.ts`, where `HarnessTreeGuard` is `{ test: string; covers: string }` and an absent key yields `[]`. This task imports that accessor and re-derives nothing about the key.

**Where this layer stops.** The check reads files and grades; it repairs nothing and runs no guard. Whether a `covers` glob matches anything is **not** graded — the task prompt asks only about `test`. The `docs/cli.md` §7 row and bullet for this check are **Task 7's**; Task 7 restates the id `tree-guards`, the title and the grading below.

**How `test` is resolved.** `test` is the argument the single-file test command takes, verbatim, so it is not necessarily repo-relative (in this repository the command runs from `cli/`). The check counts an entry as resolved when a **regular file** exists at `test` joined to the repository root, **or** joined to any `layers[].path` the configuration carries, in config order. No other base is tried. A `test` value that is absolute, or that carries a `..` segment, is not resolved against anything and is reported among the missing — a guard the unit loop would hand to a command that runs from inside the repository.

### Targets

- `cli/src/doctor/checks.ts` — the `TREE_GUARDS_CHECK` constant and its row in `CHECKS`.
- `cli/test/doctor-tree-guards.test.mjs` (new) — the accompanying suite.
- `cli/test/doctor.test.mjs` — the frozen `PRE_BRANCH_CHECK_IDS` list.

**Work:**

- [ ] `checks.ts`: add `TREE_GUARDS_CHECK` with `id: 'tree-guards'` and `title: 'every treeGuards test names a file this repository has'`, with a doc comment stating the resolution rule above and why it is a `warn` (a missing guard is never run, so the rule it enforces goes unchecked until Run gates; nothing stops a run). `run`: `unevaluated` when `ctx.repoRoot` or `ctx.config` is undefined, in the wording the neighbouring checks use; `pass` with *"no treeGuards are configured, so a unit runs no tree guard"* when the list is empty; `warn` naming each unresolved `test` through `nameList` and the remedy — correct or remove the entry with `` `${CLI} config set treeGuards '<json>'` `` — when any is unresolved; otherwise `pass` naming how many guards resolved.
- [ ] `checks.ts`: insert `TREE_GUARDS_CHECK` into `CHECKS` directly after `LAYER_DRIFT_CHECK`, and add one sentence to the `CHECKS` doc comment's ordering rationale saying why it sits there (beside the other checks that grade what the configuration points at in the tree).
- [ ] `doctor.test.mjs`: insert `'tree-guards'` into `PRE_BRANCH_CHECK_IDS` directly after `'layer-drift'`. Before editing, run `git grep -n "'layer-drift'" -- cli/test` and give every exhaustive check-id list or adjacency assertion it finds the same insertion; this file is the one that list holds today.
- [ ] `doctor-tree-guards.test.mjs`: header first, stating the rule. Against a wired throwaway fixture (`cli/test/helpers/fixture.mjs`), run the compiled CLI's `doctor` and assert the `tree-guards` line: key absent → PASS with the no-guards sentence; an entry whose `test` exists relative to the root → PASS; one that exists only under a configured `layers[].path` → PASS; one that exists nowhere → WARN naming that `test`, with the exit status unchanged from the all-pass run (a warning never moves it, `docs/cli.md` §7); an entry whose `test` carries `..` → WARN. Add an `it is listed directly after layer-drift` case in the shape `cli/test/doctor.test.mjs` uses for `remote-execution`.

**Verification:**

- `npm test --workspace cli -- test/doctor-tree-guards.test.mjs` passes.
- `npm test --workspace cli -- test/doctor.test.mjs` passes — this task edits it.
- `bash scripts/typecheck.sh` passes.
- `git grep -n "configuredTreeGuards" -- cli/src` shows this check as the accessor's consumer — the end-to-end path from Task 1's accessor through `CHECKS` to a reported line is what the new suite exercises.
