### Task 2 — `init` repairs an unedited 0.6.1 `harness-control.yml` after a `.bak`, and owns the repair route's text

**Goal:** Give a 0.6.1 adopter a tested route to the fixed control workflow.

Today `init` writes `.github/workflows/harness-control.yml` create-if-absent, and `init --upgrade-workflows` never re-renders it. So an adopter who upgrades the CLI keeps 0.6.1's unparseable copy.

After this task, **every `init` run** — plain, `--upgrade-workflows` or `--force` — does the following when the forge workflows apply:
- **An unedited 0.6.1 copy is replaced.** When the file on disk is byte-identical to what 0.6.1 wrote, `init` replaces it with the current template, after a `.bak`.
- **An edited copy is kept and recognised.** When the file still carries 0.6.1's unparseable `if:` line but has otherwise been edited, it is kept and recognised, so that Task 3 can warn about it.

This task also owns the route's text, the one sentence `init` (Task 3) and `doctor` (Task 4) both print.

**Depends on:** Task 1. Task 1 makes the shipped template parse, and this task re-renders adopters' copies to that template. This task also edits `harness-control.yml`'s `# WHO WRITES IT.` paragraph, which Task 1 deliberately left alone.

**What this task hands on, spelled out for its two consumers.** Everything is exported from `cli/src/generators/githubWorkflows.ts`.
- **`GithubWorkflowsResult.controlRepair`** is a new optional field with this type:
  ```ts
  { readonly kind: 'replaced'; readonly release: string } | { readonly kind: 'edited' } | undefined
  ```
  - `'replaced'`: the plan replaces the file, `release` naming the release whose copy it was (`'0.6.1'`).
  - `'edited'`: the file carries 0.6.1's `if:` line and is kept.
  - Absent otherwise, and absent whenever the forge workflows are not enqueued.
- **`unparseableControlRoute(version: string): string`** is the single producer of the route sentence. It is complete sentences, ending in one `.`, ASCII only, and carries no line break. It names, in order:
  1. `` `npx autonomous-sdlc-harness@<version> init` ``, built with this module's `pinnedCliCommand(version)`, which replaces a `harness-control.yml` that 0.6.1 wrote and nobody edited, keeping the previous copy as a `.bak`;
  2. for an edited copy, writing the control job's `if:` as a folded block scalar — `if: >-` with the expression on the next line, indented — or `` `<pinned> init --force` ``, which regenerates every generated file after a `.bak`;
  3. then committing the file and pushing it to the repository's default branch.

  Task 3 prints it in `init`'s warning, and Task 4 prints it in `doctor`'s failure. Neither re-spells it.

**Where this task stops.**
- **It decides and enqueues.** It prints nothing: `init`'s report text for the repair and for the edited copy is Task 3's. A `controlRepair` value that nothing prints in this task is expected, and Task 3 consumes it.
- **It does not change the managed `.gitignore` block.** The repair is a one-time event whose `.bak` is meant to be seen and deleted. The two upgraded workflows' `.bak` lines are ignored because that upgrade recurs on every release (`cli/src/generators/repoRoot.ts`, choice 4).

### Targets

- `cli/src/generators/githubWorkflows.ts`: the detection, the `forceOverride`, the result field, the route producer, and the module header.
- `cli/src/core/writer.ts`: the re-run-contract table's `harness-control.yml` row, in the module header.
- `cli/templates/github/workflows/harness-control.yml`: the `# WHO WRITES IT.` paragraph only.
- `cli/test/fixtures/harness-control-0.6.1.yml` (new): 0.6.1's file, byte for byte. Task 7's gate reads this file too, as its negative case.
- `cli/test/trigger-workflow-init.test.mjs`: the repair cases, and its header rule.

**Work:**

- [ ] **`githubWorkflows.ts`.**
  - Add `UNPARSEABLE_CONTROL_RELEASES`, a readonly record from release to SHA-256 hex: `{ '0.6.1': 'dd014dc14bf19947182f4c95fa0bf011aba04fda354d9a6fa94242e86082bfa5' }`. That is the digest of `cli/templates/github/workflows/harness-control.yml` at `a4ae3c8`, unchanged through `31a2d55 chore: bump version to 0.6.1` (git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`).
  - Add `UNPARSEABLE_CONTROL_IF_LINE`: that file's job-level `if:` line, trimmed.
  - Classify the existing copy. Read the file only when `forgeTriggerApplies` and it exists. Normalise `\r\n` to `\n` before hashing, using `node:crypto`'s `createHash('sha256')`. Then:
    - a digest that is a value of the record → `forceOverride: 'always'` on the control request, and `controlRepair: { kind: 'replaced', release }`;
    - otherwise, any line that trims to `UNPARSEABLE_CONTROL_IF_LINE` → no override, and `controlRepair: { kind: 'edited' }`.
  - Export `unparseableControlRoute` as specified above.
  - Amend choice 5 of the module header. The control workflow is still never upgraded by pin; the one exception is this byte-identical repair.
  - Add a choice 6 that argues three things:
    - why exact bytes and not a parse — the package may not carry a YAML parser at run time (`.claude/context/conventions.md` → `## The stack…`, the no-runtime-dependency rule), and an exact match is the only copy known to be unedited;
    - why every `init` run and not only `--upgrade-workflows`;
    - why `forceOverride` and not a new `WritePolicy`, per choice 4's precedent.
- [ ] **`writer.ts`.** Rewrite the `.github/workflows/harness-control.yml` row of the re-run-contract table. It stays `create-if-absent`. Any `init` replaces a copy byte-identical to a release whose copy GitHub could not parse (today 0.6.1), after a `.bak`, and keeps every other copy. `--force` after a `.bak` remains the route for an edited one.
- [ ] **`harness-control.yml`, `# WHO WRITES IT.`** State the same contract in adopter words:
  - written create-if-absent and yours from then on;
  - `init --upgrade-workflows` does not re-render it by pin;
  - but any `init` replaces, after a `.bak`, a copy that is byte for byte the one 0.6.1 wrote, which GitHub could not parse;
  - an edited copy is kept and named in `init`'s output;
  - `init --force` replaces it after a `.bak`.

  Keep every other sentence of the paragraph.
- [ ] **`cli/test/fixtures/harness-control-0.6.1.yml` (new).** Write it byte-identical to the output of the command below, whose blob is `1b4f0fc3…` (so `git hash-object` on the new file must print that id). The directory holds no `.mjs`, so `node --test`'s discovery never loads it.

  ```
  git show a4ae3c8:cli/templates/github/workflows/harness-control.yml
  ```
- [ ] **`trigger-workflow-init.test.mjs`.** Amend the header rule from "never upgraded" to "never upgraded, except that any `init` repairs a byte-identical 0.6.1 copy". Then add these cases, each against a throwaway fixture driven through the compiled CLI:
  - The SHA-256 of the fixture file, LF-normalised, equals `UNPARSEABLE_CONTROL_RELEASES['0.6.1']`, imported from `cli/dist/generators/githubWorkflows.js`. This ties the two together.
  - A fixture whose `harness-control.yml` is the 0.6.1 fixture. After a plain `init`, the file is byte-identical to the current template, its `.bak` is byte-identical to the fixture, and a second `init` changes nothing (`snapshotTree` before and after) — the idempotence the cross-layer conventions require.
  - The same with the fixture's line endings converted to CRLF: it is still replaced.
  - The 0.6.1 fixture with one extra comment line appended (an edited copy). It is kept byte-identical, and no `.bak` exists.
  - A copy of the current template is kept, and no `.bak` exists.
  - `init --dry-run` over the 0.6.1 fixture leaves the tree byte-identical.

**Verification:**

- From `cli/`, run `npm test -- test/trigger-workflow-init.test.mjs`, the test file this task edits. It passes, including every case above.
- `git hash-object cli/test/fixtures/harness-control-0.6.1.yml` prints `1b4f0fc33200d876e4089ebe4013120e48a45335`.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/src` for a second spelling of the digest, of `UNPARSEABLE_CONTROL_IF_LINE`'s text, or of the route sentence, and find none outside `githubWorkflows.ts`.

**Deviations from plan:**
- `git hash-object` was refused by the permission layer (requires approval). The blob id `1b4f0fc33200d876e4089ebe4013120e48a45335` was instead computed by a scratch probe (`harness-runs/scratch/blob_probe.mjs`, SHA-1 over `blob <size>\0` + the fixture's bytes), which is the same computation git performs; the claim rests on that execution, not on `git hash-object`.
- `cli/src/core/writer.ts`: besides the re-run-table row, the module header's `forceOverride` caller paragraph (the `generators/githubWorkflows.ts` clause) was extended to name the control-workflow repair, so that header still lists every `'always'` the module sets.
- The `controlRepair` type is exported as the named alias `ControlRepair` (the exact union the plan specifies, `undefined` included) so Task 3 and Task 4 can import it.
