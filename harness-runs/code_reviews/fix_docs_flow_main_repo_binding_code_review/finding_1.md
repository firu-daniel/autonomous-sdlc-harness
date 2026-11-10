### 1. The bare-push guard passes a run-copy-prefixed push spelling, but the suite header says it forbids any spelling other than the main checkout's copy

**File:** `cli/test/main-repo-resolution-corpus.test.mjs` (`CASES`, row `main-repo-resolved-values-row`, its `forbidden` list) — "/(^|[^/])<scripts_dir>\/push-branch\.sh/m"; and the same file's module header — "and no plugin file names the push other than as the main checkout's copy"

The module header states the new rule broadly: *"no plugin file names the push other than as the main checkout's copy (`<MAIN_REPO>/<scripts_dir>/push-branch.sh`)"*. The pattern that enforces it only matches a `<scripts_dir>/push-branch.sh` that has **no** `/` in front of it. Any prefixed spelling therefore passes, including `<repo_root>/<scripts_dir>/push-branch.sh` and `$REPO_ROOT/<scripts_dir>/push-branch.sh`. Those are the run copy's own copy of the wrapper, which is the sandboxed spelling this branch exists to remove (task prompt, `## Why it matters`). In both cases the character before `<scripts_dir>` is `/`, so `[^/]` does not match. The `$`-argument pattern (`/push-branch\.sh\s+"?\$/`) does not catch them either, because the `$` comes before the script path, not after it.

`.claude/context/cli.md` → `## What "done" means here` says a module's header is a guarantee that the change must satisfy or amend. This header promises more than the case enforces. The goal-4 shapes the task prompt lists (a bare `<scripts_dir>/push-branch.sh`, a `$REPO_ROOT` argument) are covered. A prefixed run-copy spelling is a regression the header says is guarded, and it is not.

The plugin corpus currently has no hit for the stricter pattern below: `git grep -n -P '(?<!<MAIN_REPO>/)<scripts_dir>/push-branch\.sh' -- plugin` prints nothing. Tightening the pattern therefore keeps the suite green.

**Fix:**

1. In the `main-repo-resolved-values-row` row's `forbidden` list, replace the first entry:

   ```js
   /(^|[^/])<scripts_dir>\/push-branch\.sh/m,
   ```

   with a negative lookbehind that refuses every `<scripts_dir>/push-branch.sh` not directly preceded by `<MAIN_REPO>/`:

   ```js
   /(?<!<MAIN_REPO>\/)<scripts_dir>\/push-branch\.sh/,
   ```

2. In the module header, replace the clause

   > and no plugin file names the push other than as the main checkout's copy (`<MAIN_REPO>/<scripts_dir>/push-branch.sh`), or resolves `<MAIN_REPO>` through "watcher-supplied" or a pipeline.

   with

   > and no plugin file spells the push path as `<scripts_dir>/push-branch.sh` under any prefix but `<MAIN_REPO>/`, passes it a `$` argument, or resolves `<MAIN_REPO>` through "watcher-supplied" or a pipeline. A mention of the bare name `push-branch.sh` with no `<scripts_dir>/` in front is not policed: wrapper-property and inventory sentences ("`push-branch.sh` is non-fatal") use that name legitimately.

3. Add a `RED ONCE` record under the existing ones for the widened pattern. In the working tree only, change the hard boundary's push in `plugin/commands/branch-start-docs-autonomous.md` to "via `bash <repo_root>/<scripts_dir>/push-branch.sh`", run this suite, confirm that `main-repo-resolved-values-row` fails with a `forbidden` hit on the lookbehind pattern, then restore the file. Record it in the existing style, giving the date, the mutation, the failing case and the hit.

This test file is the one this fix edits, so it is the only test file the fix runs: `npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs`, from the repository root, once for the red run and once after the restore.
