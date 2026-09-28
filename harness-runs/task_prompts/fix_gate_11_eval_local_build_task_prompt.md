`scripts/run-gates.sh` → gate `11 docs-retrieval relevance floor` fails on every checkout whenever `dev`'s version
differs from the machine-wide retrieval runtime. The eval never uses that runtime. Make the gate check the
eval against the local build, so a version bump on `dev` stops turning it red.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## The defect

Gate 11 runs `node evals/docs-retrieval/check-floor.mjs`. Before it loads anything,
`evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable` makes three refusals. The third one
calls `retrievalRuntimeState()` from `cli/dist/retrieval/runtime.js`, which reports the runtime installed only
when all of these hold:
- the machine-wide runtime under `<machine cache>/retrieval/runtime` holds this package's CLI;
- that CLI's version equals the version of the local `cli/package.json`;
- every optional peer is installed there.

When the two versions differ, the refusal throws with `missing: autonomous-sdlc-harness`, `check-floor.mjs` exits 1,
and the script counts it as `FAIL`. The status the script reports as `BLOCKED` and leaves out of both counts, 3, is
reserved for an empty model cache.

It has happened on both version bumps so far:
- **`0.3.0`** (`chore: bump version to 0.3.0`): the runtime on this machine stayed at `0.2.0`. npm had only `0.2.0`
  published, so `init`'s retrieval setup could not install a matching runtime at all.
- **`0.4.0`** (`chore: bump version to 0.4.0 (#35)`): the runtime was still `0.2.0`. On 2026-09-28 gate 11 failed in
  Run gates rounds 1 and 2 of `fix_remote_job_permission_profile`, and the run parked on it, since no change on
  that branch could fix it. It was cleared only by reinstalling the runtime by hand at `0.4.0`, which npm had by
  then.

So this machine's runtime currently matches `0.4.0`, and the defect is dormant until the next bump. Publishing does
not close it either: every machine still has to reinstall before gate 11 goes green again.

The runtime check guards a dependency the eval does not have:
- The eval imports the retrieval code straight from the local `cli/dist/…`.
- The workspace's own `node_modules` already holds all five optional peers: `@electric-sql/pglite`,
  `@electric-sql/pglite-pg_textsearch`, `@electric-sql/pglite-pgvector`, `@huggingface/transformers` and
  `@modelcontextprotocol/sdk`.
- The model cache check passes on this machine.

So the gate refuses to measure the code under review because a copy it does not load is out of date. This
happens on every version bump until the new version is published and every machine reinstalls the runtime. In
between, gate 11 is red in every per-branch worktree, and `commands.test` exits 1 on every unit of every run.

## What to deliver

1. Gate 11 grades the local build and the workspace's own peers. It does not refuse to run because of the
   machine-wide runtime's presence or version. The other two refusals stay: the model cache must be complete,
   and the stub env var must be unset.
2. Where the local peers cannot be loaded, the eval refuses with a message saying so and naming what to install
   (for example, `npm ci` not run). That case is graded the way the script grades a setup problem rather than a
   regression. Settle whether it is `BLOCKED` like the empty model cache, and record why.
3. `docs/development.md` → `## 5` → **Gate 11** and `docs/retrieval-eval.md` describe what the gate now depends
   on.

## Establish, do not assume

- **Every caller of `assertRealModelsAreAvailable`.** It is exported: `cold-build.mjs` and `query-log-pass.mjs`
  call it too, and `query-log-pass.mjs` says it *"measures the shipped server"*. Work out which callers really
  run the installed runtime, and so still need the runtime check, and which load the local build. Keep the check
  for the first group and drop it for the second. Do not remove it everywhere because one caller does not need
  it.
- **Whether gate 10's hand-run legs rely on the same refusal** to stop someone measuring a stale runtime, so a
  change here does not quietly weaken them.
- **Whether the recorded floors in `evals/docs-retrieval/floor.json` still hold** once the gate runs again on the
  local build. A shortfall is a finding to report, not a floor to lower.

## Out of scope

- Publishing a version, or changing how `init` installs the runtime.
- The floor values and the floor policy in `docs/retrieval-eval.md` → `## The regression floor`.
- Any other gate.

## Acceptance

1. In a per-branch worktree whose `cli/package.json` version differs from the machine-wide runtime's,
   `bash scripts/run-gates.sh` reports gate 11 as `ok`. Record the output, and both versions. This machine's runtime
   matches the checkout today, so create the mismatch for that one run without touching the shared cache. Either:
   - change the worktree's `cli/package.json` version, rebuild, and restore it afterwards, never committing it; or
   - point `XDG_CACHE_HOME` at a scratch directory holding a copy of the real `models/` and a runtime at another
     version.

   A scratch cache without the models reports `BLOCKED` (Acceptance 2's case), not the mismatch. Before the fix, the
   same setup must report gate 11 as `FAIL` with `missing: autonomous-sdlc-harness`, so record that too: it shows the
   mismatch was really reproduced.
2. With `XDG_CACHE_HOME` pointed at an empty scratch directory for that one invocation, gate 11 is still reported
   `BLOCKED`, not `FAIL`. Never move or delete the real machine-wide cache: concurrent runs share it. Record the
   output.
3. `bash scripts/run-gates.sh` prints no new failure.
