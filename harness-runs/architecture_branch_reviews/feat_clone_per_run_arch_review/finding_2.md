### 2. Give the run library's main-side and clone-side git pins one body each

**Severity:** Should Fix. **Layer:** cli.

**Site:** `cli/templates/scripts/lib/harness-run-lib.sh`, these functions:
- `hr_copy_sync_main_git` — its header begins "`hr_run_main_git`'s pins, on the main checkout named by the argument rather than `HR_RUN_MAIN`."
- `hr_run_main_git`
- `hr_copy_sync_out_var` — the substring `GIT_DIR="$gitdir" GIT_COMMON_DIR="$gitdir" GIT_OBJECT_DIRECTORY="$cmain/.git/objects"`
- `hr_clone_git` — its header begins "git in a clone with sync-out's pins"
- `hr_clone_create_var` — the substring `GIT_DIR="$main/.git" GIT_INDEX_FILE="$gd/index" GIT_WORK_TREE="$dir"`

**Problem.** The branch adds new git runners to the library by copying an existing pin set rather than calling the body that already owns it:

1. **Main-side pins, two bodies.** `hr_copy_sync_main_git` re-spells `hr_run_main_git`'s exact set (`GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null` plus `-c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false -c advice.graftFileDeprecated=false`). The section header (THE CLONE ARM'S SYNC → THE GLOBALS CONTRACT) says why the new function cannot *call* `hr_run_main_git`, which reads `HR_RUN_MAIN`. That is a reason to parameterise the one body, not to keep two. A pin added to one runner later, such as the next `-c` a measurement calls for, silently misses the other.
2. **Clone-side pins, already drifted.** `hr_clone_git`'s header says it runs "with sync-out's pins". But `hr_copy_sync_out_var` spells its own inline environment for its `update-ref`, and the two sets differ. `hr_clone_git` adds `GIT_GRAFT_FILE=/dev/null` and `-c advice.graftFileDeprecated=false`, which sync-out's inline call lacks. The header claims equality the code does not hold. This is the drift `.claude/context/conventions.md` cites `cli/src/core/repoPaths.ts` as the worked cost of: two bodies under one description, so moving a caller between them changes behaviour with no error.
3. **Copy-side pins, a third spelling.** `hr_clone_create_var`'s populating `read-tree` builds `hr_run_copy_git`'s environment and `-c` set inline (`GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<clone>/.git/index`, `GIT_WORK_TREE=<clone>`, the same four `-c` pins).

Rules this breaks:
- `.claude/context/conventions.md` → `## The layers` → `### Where a new responsibility goes`: "A responsibility that already has a home does not get a second one", and "Before adding a copy of anything, grep for it".
- `.claude/context/cli.md` → `## What "done" means here`: "A reviewer holds a change to its module's own header … a header a review reads as a guarantee is worth exactly what the code under it still does". `hr_clone_git`'s "with sync-out's pins" is such a header.

All of this sits inside the shared run library, the right home for it, so the finding is about duplication rather than placement. That is why it is not Must Fix.

**Fix.** In `cli/templates/scripts/lib/harness-run-lib.sh`, without changing any function's name, arguments, return codes or globals:

1. **One main-side runner.** Keep `hr_copy_sync_main_git <canonical-main> <git-args>...` as the single body carrying the main-side pins. Rewrite `hr_run_main_git` to delegate to it:
   ```bash
   hr_run_main_git() {
     [ -n "${HR_RUN_MAIN-}" ] || return 1
     hr_copy_sync_main_git "$HR_RUN_MAIN" "$@"
   }
   ```
   `hr_copy_sync_main_git` reads no `HR_RUN_*` global, so the GLOBALS CONTRACT still holds. Move the full pin list's statement to `hr_copy_sync_main_git`'s header, and have `hr_run_main_git`'s header and the THE PINS paragraph point at it. Also update the header line "`hr_run_main_git`'s pins, on the main checkout named by the argument" so it says this function is the one body and `hr_run_main_git` is the `HR_RUN_MAIN` wrapper.
2. **One clone-side runner.** Have `hr_copy_sync_out_var` run its `update-ref` through `hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$oid" ${old[@]+"${old[@]}"}` instead of its inline environment. This brings `GIT_GRAFT_FILE=/dev/null` and `-c advice.graftFileDeprecated=false` to sync-out, which are harmless for `update-ref`. `hr_clone_git` is defined later in the file, but bash resolves a function at call time, so the order needs no change. Its header and the THE PINS paragraph should then state the clone-side set once, in `hr_clone_git`.
3. **Copy-side pins.** Do one of these:
   - (a) Factor a parameterised `hr_copy_git_at <main> <gitdir> <top> <git-args>...` carrying `hr_run_copy_git`'s environment and pins. Make `hr_run_copy_git` delegate to it with `"$HR_RUN_MAIN" "$HR_RUN_COPY_GITDIR" "$HR_RUN_COPY_TOP"`, and call it from `hr_clone_create_var`'s `read-tree`.
   - (b) If that is judged not worth it, add a header line at the inline `read-tree` naming it a deliberate copy of `hr_run_copy_git`'s pins and saying why it cannot call it. `HR_RUN_COPY_*` are not set during creation.

   Prefer (a).
4. Verification: no shell behaviour a caller can observe changes. The existing suites that exercise these functions are `cli/test/clone-sync.test.mjs`, `cli/test/run-copy-clone-arm.test.mjs`, `cli/test/clone-create-remove.test.mjs` and the worktree-arm suites the story index lists. This unit creates or edits none of them, so under the test-run rule it runs none. Its own check is reading the four rewritten call sites against the pin lists above. If the implementer does edit one of those suites, it runs that one file only.

**Deviations from plan:** Fix item 3 took option (a). Beyond the four named sites, the library header's write-exception 5 runner list and its "library that only reads" function list now name `hr_copy_git_at`, and the CREATING AND REMOVING A RUN'S CLONE header (which said creation ran git in the clone only through `hr_clone_git`) now names `hr_copy_git_at` as the populating runner, so each header still matches the code under it. The verification check (reading the rewritten call sites) was done by reading, and `bash -n` passed; the listed suites were not run, per the test-run rule — deferred to the Run gates phase.
