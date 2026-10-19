### Task 1 — Rebuild `commit-on-branch.sh` as an excluded main-checkout wrapper: the target and per-working-copy checks, then a plumbing commit through the core it now shares with `hr_commit_placed`

**Goal:** Make the main checkout's copy of the commit wrapper safe to run outside the sandbox, and able to commit into a linked worktree without a sandboxed git ever writing that worktree's record. Before any git call it applies the same trust checks `push-branch.sh` and `refresh-branch.sh` carry. It then commits through the **one** plumbing-commit owner the library has, which this task factors out of `hr_commit_placed`, borrowing only the record's `index` and the worktree's files, and keeps the caller-facing contract byte-identical.

**Why one owner, not a second body.** `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_commit_placed` already builds a commit by exactly this mechanism for the watcher and `remote-run.sh`: a temporary index seeded from the tip, `write-tree`, `commit-tree`, a compare-and-swap `update-ref`, then the copy's own index entry set. A second copy in the wrapper would break `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*, and it would already diverge on a security point: `hr_commit_placed` hashes with `hash-object -w --no-filters`, so no filter driver a run-written `.gitattributes` selects ever runs, while a `git add` under an excluded wrapper would run one with full access. So the core moves into one library function, both callers use it, and the filter policy is stated once, there.

**Where this task stops.** It edits the script template and the library template only. It does **not**:

- mark the row `runsUnsandboxed` or touch any generator, which is **Task 4**;
- write the test suites, which are **Tasks 2 and 3**: they assert the contract stated below, so state it exactly in the header;
- change any caller's spelling, which is **Tasks 6–8**;
- edit any test file. `hr_commit_placed`'s existing suites (`cli/test/outer-loop-scripts.test.mjs`, `cli/test/watcher-review-drop-payloads.test.mjs`, `cli/test/remote-review-payloads.test.mjs`) must stay green **unedited**, which is the evidence that `hr_commit_placed`'s behaviour did not change. They are left to the run's closing gate (**Task 3** records this).

Until Task 4 lands, the script is simply a stricter wrapper that still runs sandboxed.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/commit-on-branch.sh`

**The contract other tasks restate — keep it exact.**

- **Usage is unchanged:** `commit-on-branch.sh [--repo <repo-dir>] <path>... -- <subject> [<body-line>...]`. The target defaults to `$PWD`.
- **Exit codes are unchanged:**
  - **0**: committed. Stdout is exactly `commit-on-branch.sh: committed <short_sha> on <branch>`.
  - **1**: a usage error, a non-git directory, a detached HEAD, a configuration that cannot be resolved, a refused target or `config.worktree`, a refused hooks pin, a branch starting with `-`, a branch with no commit yet, a path whose attributes select a filter driver, a path reached through a symbolic link or that is neither a regular file nor a symbolic link (a submodule, a special file), a git failure, or the branch moving under the wrapper. Only the last leaves the given paths staged, the same residue today's failed `git commit` leaves.
  - **2**: a protected-branch refusal, with nothing staged.
  - **3**: nothing to commit.
- **Every refusal names its reason** on one stderr line beginning `commit-on-branch.sh: refusing to commit: `, except the four existing messages, which keep their text: detached HEAD, not a git repository, protected branch, and configuration that cannot be resolved.
- **No commit hook runs**: not `pre-commit`, `prepare-commit-msg`, `commit-msg` or `post-commit`. The commit's own git calls go through the library's pinned runners (`core.hooksPath=/dev/null`), so no hook of any kind runs there.
- **No filter driver runs, and content is stored as it is in the working tree.** Every blob is hashed with `--no-filters`. A path whose attributes select a `filter` is refused rather than committed raw; `text`/`eol` conversion is not applied either.

**Work:**

- [ ] **The checks, before any git call, in `refresh-branch.sh`'s order.** Use the same helpers and the same variable discipline (`cli/templates/scripts/refresh-branch.sh`, from the library source down to the `main_git`/`wt_git` definitions):
  1. source the library;
  2. drop the inherited git environment with `hr_git_env_drop`;
  3. parse the arguments;
  4. find the target's top with `hr_checkout_top_nogit` (a non-repository keeps today's message and exit 1);
  5. place the main checkout from this file's own directory with `hr_wrapper_main_of`;
  6. check the target with `hr_wrapper_target_check_var "$main_top" "$top_nogit"`;
  7. check its per-working-copy configuration with `hr_worktree_config_check_var`;
  8. resolve the hooks pin with `hr_pinned_hooks_path "$main_top"`, exported as `GIT_CONFIG_COUNT=1` / `core.hooksPath`.

  Then define `main_git` (`git -C "$main_top" -c core.hooksPath="$pinned" -c submodule.recurse=false`) and `wt_git` (the same, plus `GIT_DIR="$main_top/.git" GIT_INDEX_FILE="$HR_TARGET_GITDIR/index" GIT_WORK_TREE="$top"`), exactly as `refresh-branch.sh` spells them. `HR_TARGET_GITDIR` is `<main>/.git` when the target is the main checkout itself, so one path serves both the supervised case and a run's worktree. Call the library functions as `cli/templates/scripts/lib/harness-run-lib.sh` defines them. The rebuilt wrapper therefore needs the template library beside it: this checkout's root `scripts/lib` lags the template on purpose and does not define `hr_git_env_drop` (`grep -n hr_git_env_drop scripts/*.sh scripts/lib/*.sh` prints nothing). The script runs `set -uo pipefail` without `-e`, so a wrapper copied there alone would carry on past `command not found` with the inherited `GIT_*` environment. That is why the story index's Manual setup step 1 re-renders the wrapper together with `scripts/lib/`, never on its own.
- [ ] **Branch and protection, from the main checkout only.**
  - Read the branch once with `hr_wrapper_branch_var "$main_top" "$HR_TARGET_GITDIR"`. Its failure is today's detached-HEAD refusal (exit 1).
  - Refuse a branch starting with `-` (exit 1).
  - Load the configuration and judge protection against `$main_top`, never the target. Use `hr_branch_is_protected "$main_top" "$branch"`: exit 2 with today's two-line message, whose set comes from `hr_protected_patterns "$main_top"`, or exit 1 for "cannot resolve '<main>/harness.config.json'". This keeps every row of `docs/outer-loop-verification.md` §1.1 true when the main checkout is the target, and closes the hole a worktree's sandbox-writable `harness.config.json` would open.
  - Take `old_tip` from `main_git rev-parse --verify --quiet "refs/heads/$branch^{commit}"`. A branch with no commit yet is exit 1, naming why. `hr_commit_placed` refuses the same.
- [ ] **Factor the plumbing core out of `hr_commit_placed` into the library, in `THE WATCHER FAMILY'S GIT IN A RUN'S COPY` section** (`cli/templates/scripts/lib/harness-run-lib.sh`). Two new functions, and `hr_commit_placed` calls them unchanged in behaviour:
  - **`hr_run_blob_var <rel> <file_mode>`** — the library's **one** hashing site, under the `HR_RUN_*` globals. It refuses (1) an empty or absolute `<rel>`, a `..` segment, and a symbolic link in any **parent** segment, using the same walk `hr_run_path_safe` makes but allowing a symbolic-link leaf. It sets `HR_RUN_BLOB_MODE` and `HR_RUN_BLOB`:
    - an absent leaf is a removal: mode `0`, `HR_RUN_BLOB` empty, and the record carries the repository's null object id;
    - a symbolic link is `120000`, and its link text is hashed with `hash-object -w --no-filters --stdin`;
    - a regular file is hashed with `hr_run_main_git hash-object -w --no-filters -- <top>/<rel>`. Its mode is `<file_mode>` when that is `100644`, and with `auto` it is `100755` for an executable file and `100644` otherwise;
    - anything else (a directory, a submodule, a special file) returns 1.
  - **`hr_commit_paths_var <main> <top> <gitdir> <branch> <tip> <file_mode> <sync> <reflog_subject> <rel>... -- <message>...`** — the shared commit. It takes the values its caller's own checks already read, and **reads no record**:
    - it establishes the runner globals with `hr_run_main_set_var "$main"` (which reads only `<main>/.git`) and then assigns `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` and `HR_RUN_COPY_TIP` from its arguments, so every call runs through `hr_run_main_git` / `hr_run_copy_git` (no hook, no `fsmonitor`, no replace objects, no grafts);
    - it builds one `update-index -z --index-info` record per `<rel>` from `hr_run_blob_var`, in a `mktemp -d "${TMPDIR:-/tmp}/hr-commit-index.XXXXXX"` directory (never `mktemp -t`: macOS ignores `TMPDIR` there, `docs/sandbox-verification.md` F2), removed on every return path, as `hr_commit_placed` removes its own today;
    - it seeds a temporary index from `<tip>` with `read-tree`, applies the records, and runs `write-tree`;
    - when the tree equals `<tip>^{tree}` it returns **3**;
    - otherwise it runs `commit-tree <tree> -p <tip>`, with one `-m` per message argument in order, and then the compare-and-swap `update-ref -m <reflog_subject> refs/heads/<branch> <new> <tip>`. A lost or unlockable swap returns **4**, with only objects written;
    - after a moved ref it sets `HR_RUN_COPY_TIP` and `HR_COMMIT_NEW` and applies the same records to the copy's own index with `hr_run_copy_git update-index -z --index-info`. It returns **0**;
    - `<sync>` is `committed` (sync the copy's index only on 0) or `always` (also on 3 and 4). Any other failure returns **1**, with `HR_COMMIT_REFUSAL` set to one sentence that names a path and never a file's contents.
  - **`hr_commit_placed`** keeps every line up to and including its identical-re-drop check. Its blob comes from `hr_run_blob_var "$rel" 100644`, which runs the same `hash-object -w --no-filters` it runs today. It then calls `hr_commit_paths_var "$HR_RUN_MAIN" "$top" "$HR_RUN_COPY_GITDIR" "$branch" "$tip" 100644 committed "hr_commit_placed: $subject" "$rel" -- "$subject"`. It maps 0 to its unchanged `committed <short sha> on <branch>` line and 3 to 3, and it maps 1 and 4 to 1. Its exits, stdout, stderr lines, reflog message, file mode and its "sync only after a moved ref" order are unchanged.
  - **The library header.** It states the filter policy once, in `hr_commit_paths_var`'s comment, and moves the existing `--no-filters` comment off `hr_commit_placed`: every blob a commit in this library writes is hashed with `--no-filters`, so no filter driver a run-written `.gitattributes` selects ever runs. The cost is that content is stored exactly as the working tree holds it, so neither an eol conversion nor a clean filter is applied. In the same header, add both new functions to write exception 4's "Written only by" list and to the read-only-library caller list, and add one line saying that a parent swapped for a symbolic link between the check and the hash is the same race `hr_commit_placed` already carries. Change no existing function's signature.
- [ ] **The wrapper's staging set, then the shared commit.** The wrapper owns only what is its own: its paths and its messages.
  - For each given path `p`, keep today's existence check against `$top/$p` and its warn-and-skip line. Then expand `p` to file-level paths. A directory (not a symbolic link) gives the union of `main_git ls-tree -r -z --name-only "$old_tip" -- "$p"`, the tip's entries, which is how a deletion under a passed parent directory is staged, and `wt_git ls-files -z --cached --others --exclude-standard -- "$p"`. Anything else gives `p` itself. Deduplicate the result. This keeps the STAGING POLICY's trap and its remedy true, and the commit is exactly the tip plus these paths. Nothing the working copy had staged before is swept in.
  - **Refuse a filtered path before hashing.** If `wt_git check-attr -z filter -- <paths>` reports any path whose `filter` is neither `unspecified` nor `unset`, exit 1 with `commit-on-branch.sh: refusing to commit: '<path>' selects a filter driver, which this wrapper never runs`. Name the path and never the driver's value. Attributes are only read here, as data. Safety does not rest on this check: `--no-filters` holds even if the attributes are rewritten after it. The check exists so that an LFS-tracked path is never committed raw without anyone noticing.
  - Call `hr_commit_paths_var "$main_top" "$top" "$HR_TARGET_GITDIR" "$branch" "$old_tip" auto always "commit-on-branch.sh: <subject>" <paths>... -- <message arguments>...`, and map its result:
    - **0**: print the unchanged stdout line from `main_git rev-parse --short "$HR_COMMIT_NEW"`, and exit 0;
    - **3**: today's `nothing to commit` line, and exit 3. The `always` sync is what lets a caller re-stage a reverted file with a second wrapper call, and Task 7 relies on it;
    - **4**: exit 1 with "no commit made". The branch moved or could not be locked, and the paths are left staged by the `always` sync, which is today's residue;
    - **1**: `commit-on-branch.sh: refusing to commit: $HR_COMMIT_REFUSAL`, and exit 1.
  - The identity and signing come from the main repository's configuration, as in `refresh-branch.sh`.

  Nothing ever sends git to the target's `.git` pointer, its record's `HEAD`, its `commondir` or its `config.worktree` after the checks. The wrapper keeps no plumbing body of its own: no `read-tree`, `write-tree`, `commit-tree` or `update-ref` call appears in it.
- [ ] **Rewrite the header** in the style of `push-branch.sh`'s, which the reviewer holds the code to (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"* applies to these templates too).
  - Keep the paragraph titles other files cite — **STAGING POLICY, AND THE ONE TRAP IN IT**, **MESSAGE ARGUMENTS, AND THE BYTES ONE MAY NOT CARRY**, **LOUD-FAILURE CONTRACT** and **WHAT IT NEVER DOES** — byte-identical, and update their bodies.
  - Add these paragraphs, each citing its basis:
    - **WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.** A sandboxed git cannot write a linked worktree's record: `docs/sandbox-verification.md` G1, G2 and F1, measured on Claude Code 2.1.299, macOS, headless.
    - **THE TARGET IS NOT TRUSTED.**
    - **GIT NEVER RE-READS THE TARGET'S RECORDS.**
    - **THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER.**
    - **THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.**
    - **THE INHERITED GIT ENVIRONMENT IS DROPPED.**
    - **THE COMMIT IS BUILT FROM PLUMBING, AND NO COMMIT HOOK RUNS.** A hook runs project content, which would run with full access. The commit is `hr_commit_paths_var`'s, the same owner `hr_commit_placed` uses. Cite it by name and do not restate its mechanism. Its runners pin `core.hooksPath=/dev/null`, so no hook of any kind runs during the commit. The wrapper's own pre-commit git calls (`ls-tree`, `ls-files`, `check-attr`, `rev-parse`) carry the pinned `<main>` hooks directory, and none of them starts a hook. The message lands exactly as given, because `commit-tree` does no clean-up. The ref update is logged in `logs/refs/heads/<branch>`, and no `logs/HEAD` entry is written for a linked worktree.
    - **NO FILTER DRIVER RUNS.** This paragraph cites `hr_commit_paths_var`'s filter policy rather than restating it. It names the wrapper's own `check-attr` refusal and the cost: content is stored as the working tree holds it.
  - Cite `push-branch.sh` by paragraph name rather than restating where the reasoning is identical, as `refresh-branch.sh` does.
  - In MESSAGE ARGUMENTS, add: the main checkout's copy, called from a worktree, is granted only by the profile's literal `allow` entry, so its caller spells everything literally and carries no `$` at all. Rewrite WHY A WRAPPER EXISTS AT ALL to match.
  - Rewrite `REPRO`. Keep its existing cases, re-pointed at a fixture whose wrapper copy sits under the fixture's own scripts directory, and add:
    - a linked-worktree case (`git -C "$d" worktree add …`, then call the main copy with `--repo <worktree>`): exit 0, and `git -C <worktree> status --porcelain` is empty;
    - a scratch repository as the target: refused, exit 1;
    - a `config.worktree` carrying `core.fsmonitor`: refused, exit 1, naming the key and never its value.

**Verification:**

- Run the rewritten `REPRO` block by hand against a throwaway fixture under the temp directory, never against this checkout (`.claude/context/plugin.md` → *"A shell change is verified by running the file's own `REPRO` block"*). Each case must give its stated exit status. The linked-worktree case must leave the worktree's `git status --porcelain` empty and `git -C <worktree> log -1 --pretty=%B` showing the subject and body as separate paragraphs.
- In that fixture, put a `pre-commit` hook that writes a marker in `<d>/githooks`, and set `core.hooksPath` there. The marker is never created by a committing call. This is the property the story index's first `Top risks:` entry depends on.
- `bash -n cli/templates/scripts/commit-on-branch.sh` and `bash -n cli/templates/scripts/lib/harness-run-lib.sh` both pass. A grep of the wrapper finds no `git -C "$top" commit`, no `git commit`, no `git add`, no `read-tree`, `write-tree`, `commit-tree` or `update-ref`, no `mktemp -t` and no `--no-verify`. `grep -n 'hash-object' cli/templates/scripts/lib/harness-run-lib.sh` shows every hit carrying `--no-filters`, inside `hr_run_blob_var` alone.
- In the same fixture, give a tracked path a `.gitattributes` entry `filter=marker`, with `filter.marker.clean` in the main `.git/config` writing a marker. A wrapper call naming that path exits 1 with the filter refusal, and the marker is never created.
- Re-run `hr_commit_placed`'s own `REPRO`-style check by hand on that fixture: drop one artifact into the worktree, call `hr_commit_placed`, and confirm exit 0 with its unchanged stdout line, a clean `git -C <worktree> status --porcelain`, and the reflog message `hr_commit_placed: <subject>`. The same call again gives exit 3. Its three existing suites are left unedited to the closing gate.
- The stdout line, the four kept messages and the exit codes match the contract block above character for character, because Tasks 2 and 3 and every commit point in `plugin/` quote them.
