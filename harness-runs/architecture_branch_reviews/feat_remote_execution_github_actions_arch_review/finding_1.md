### 1. Declare the workflow template's mirror of the retrieval cache path in its owning headers

**Severity:** Must Fix · **Layer:** cli

**Site.**
- `cli/templates/github/workflows/harness-run.yml`: the two `echo "HARNESS_RETRIEVAL_CACHE=${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval"` lines (in the `run` job's config step and in the `warm` job's config step). Also the header's `DECLARED MIRRORS` block, which lists `cli/src/machine/paths.ts  machineCacheDir, under which the retrieval runtime sits in \`retrieval/\``.
- `cli/src/retrieval/runtime.ts`: the module header's **The declared mirror.** paragraph (*"`cli/templates/scripts/docs-search-server.sh` is the one mirror of three literals this module owns"*), plus `RETRIEVAL_CACHE_DIRNAME`.
- `cli/src/machine/paths.ts`: the module header's choice 2 (*"`hr_cache_dir()` in `cli/templates/scripts/lib/harness-run-lib.sh` mirrors {@link machineCacheDir} the same way"*), plus `MACHINE_DIR_NAME`.

**Problem.** The run workflow restores and saves the docs-retrieval runtime cache at `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval`. That string copies three owned values byte for byte:
- the `machineCacheDir()` resolution, owned by `machine/paths.ts`, including `MACHINE_DIR_NAME`, which is `autonomous-sdlc-harness`;
- `RETRIEVAL_CACHE_DIRNAME`, which is `retrieval`, owned by `retrieval/runtime.ts`.

The workflow declares the mirror on its own side. Neither owning module declares it:

- `retrieval/runtime.ts`'s header still says `docs-search-server.sh` is **the one** mirror of its literals. It also ends: *"a mirror this header does not declare is a defect (`.claude/context/conventions.md` → `## Configuration is the source of truth…`, the persisted-key bullet)"*.
- `machine/paths.ts` choice 2 names only `hr_cache_dir()` as the shell half of `machineCacheDir`.

The rule violated: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, the persisted-key bullet. The owning module's header declares each mirror outside the package, and *"a mirror the header does not declare is a defect"*. `.claude/context/cli.md` → `## What "done" means here` adds: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* In practice, a later rename of `RETRIEVAL_CACHE_DIRNAME` or `MACHINE_DIR_NAME` guided by either header would update `docs-search-server.sh` and `harness-run-lib.sh`. It would leave the workflow restoring a cache at a path the runtime no longer uses, with no compile error and no failing test.

**Fix.** Edit headers only. No code changes.

1. In `cli/src/retrieval/runtime.ts`, rewrite the **The declared mirror.** paragraph so that it declares **two** mirrors:
   - `cli/templates/scripts/docs-search-server.sh`, as it does now;
   - `cli/templates/github/workflows/harness-run.yml`, which spells `{@link RETRIEVAL_CACHE_DIRNAME}` in the `actions/cache` path `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval`, in both the `run` and the `warm` job.

   Keep the closing sentence that an undeclared mirror is a defect, and state that a change to the literal is an edit to both files in the same change.
2. In `cli/src/machine/paths.ts`, extend choice 2. After the `hr_cache_dir()` sentence, add that `cli/templates/github/workflows/harness-run.yml` mirrors `{@link machineCacheDir}`'s resolution (the `XDG_CACHE_HOME` value, else `$HOME/.cache`, then `{@link MACHINE_DIR_NAME}`) in its retrieval-cache path. A change to that resolution or to `MACHINE_DIR_NAME` is therefore an edit to the workflow template too.
3. Leave the workflow's own `DECLARED MIRRORS` block as it is: it already names `machineCacheDir` and `retrieval/`. Optionally, name `retrieval/runtime.ts` → `RETRIEVAL_CACHE_DIRNAME` there as well, so each side names the exact symbol.
