### Task 2 — Add the run library's placeholder-host seam, absent-path manifest and leftover sweep, and delete the manifest with its per-run profile

**Goal:** Give the outer loop the primitives the recovery route needs, all in `cli/templates/scripts/lib/harness-run-lib.sh`:

- a seam that answers whether this host's sandbox is bubblewrap;
- a manifest of the protected paths that were absent before a session;
- a sweep that removes, outside the sandbox, only a 0-byte, read-only, regular file at a listed path.

`cleanup-merged-worktrees.sh` deletes the manifest when it deletes the per-run profile beside it.

**Where this layer stops.** This task defines the functions and calls none of them from the watcher. **Task 4** wires the seam, the manifest path and the manifest write into `spawn_engine` and the cap. **Task 11** wires the sweep into the watcher's passes and its start, and adds a no-git main-checkout walk to this library that calls `hr_placeholder_leftover_var` unchanged. **Task 3** gives the test passes a default for the seam. The library sets no shell option and logs nothing. Each function answers through its status and its `HR_*` variables, and the caller owns every log line.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `cli/test/placeholder-sweep-lib.test.mjs` (new)
- `cli/test/cleanup-run-copies.test.mjs`

**Work:**

- [ ] `hr_placeholder_host_probe_var`:
  - Sets `HR_PLACEHOLDER_HOST` to `1` when `hr_host_kind_var "$(uname -s)" "$(uname -r)"` answers `linux` or `wsl2`, and to `0` otherwise, including when `uname` fails.
  - Always returns 0. Its comment says **THE SEAM TESTS OVERRIDE**, as `hr_keep_awake_probe_var`'s does, and cites `docs/sandbox-verification.md` → §5 F9 for why a bubblewrap host differs.
  - Put it beside `hr_keep_awake_probe_var`, reusing `hr_host_kind_var` rather than re-deriving the host kind.
- [ ] `hr_run_profile_absent_file <slug> <branch>` and `hr_placeholder_manifest_write <manifest> <path>...`:
  - `hr_run_profile_absent_file` prints `hr_run_profile_file`'s path with its trailing `.json` replaced by `.absent`, returning 1 and printing nothing whenever `hr_run_profile_file` refuses. It sits beside `hr_run_profile_file`, and the lane-layout comment above that function names the new file.
  - `hr_placeholder_manifest_write` writes one line per argument path that neither exists nor is a symbolic link at call time (`[ ! -e ] && [ ! -L ]`). It skips any path carrying a newline. It writes through `mktemp "<manifest dir>/.absent.XXXXXX"` plus `mv -f`, with mode 600 inside a directory it creates at mode 700, as `run_profile_render` does. It returns 1, leaving any earlier manifest untouched, on any failed step.
- [ ] `hr_placeholder_leftover_var <path>` and `hr_placeholder_sweep_var <manifest>...`, side by side:
  - `hr_placeholder_leftover_var` is the **one home of the "is this a placeholder leftover" test** (`.claude/context/conventions.md` → `### Where a new responsibility goes`). It returns 0 only when **all** of these hold, and otherwise returns 1 and sets `HR_PLACEHOLDER_REASON` to the reason of the first test that failed:
    - it is a regular file (`-f`) and not a symbolic link (`! -L`) — else `not a regular file`;
    - it is 0 bytes (`! -s`) — else `has content`;
    - it carries no write permission bit for user, group or other — else `writable`;
    - it is owned by the effective user (`-O`) — else `not owned by this user`.
    It sets `HR_PLACEHOLDER_REASON` to empty on success. It sets no shell option, logs nothing and removes nothing. Read the write bits portably under bash 3.2 and both BSD and GNU userlands, for example `find "<path>" -prune -perm -u+w` and its group and other siblings, never `stat -c` or `stat -f` alone. Its comment names its two callers: `hr_placeholder_sweep_var` here, and Task 11's no-git main-checkout walk.
  - `hr_placeholder_sweep_var`: for every line of every readable manifest, when the path exists (`-e` or `-L`), it calls `hr_placeholder_leftover_var` on it, and removes it with a non-recursive `rm -f -- "<path>"` only when that returns 0. It carries no file test of its own.
  - It sets `HR_PLACEHOLDER_REMOVED` to the removed paths and `HR_PLACEHOLDER_KEPT` to `<path>: <HR_PLACEHOLDER_REASON>` for every listed path that exists but failed the predicate, one per line. An absent path is neither.
  - It never removes a path no manifest lists. It returns 0, or 1 when no manifest argument was readable.
  - The header comment states the rule: a session-planted file with content is never removed, so the clone check still refuses it.
- [ ] `cleanup-merged-worktrees.sh`:
  - Wherever it deletes a run's per-run profile (`hr_run_profile_file`), it deletes `hr_run_profile_absent_file`'s path for the same slug and branch too, under the same refusal rules and with the same kind of log line.
  - Update the numbered header item that names the per-run profile.
  - Add a `REPRO` line for the manifest beside the existing one.
- [ ] Tests:
  - `placeholder-sweep-lib.test.mjs`, new. Its header states the rule *the sweep removes only a 0-byte, read-only regular file owned by this user at a path a manifest recorded as absent*. It sources the library from a throwaway fixture under `os.tmpdir()` and covers:
    - the probe's answer for `Linux` / generic, `Linux` / `…microsoft-standard-WSL2`, `Darwin` and a failing `uname`, through a `uname` stub on `PATH`;
    - the manifest listing only the absent arguments;
    - `hr_placeholder_leftover_var` called directly: 0 with an empty `HR_PLACEHOLDER_REASON` for a `0444` empty file, and 1 with the matching reason for a file with content, a `0644` empty file, a symbolic link and a directory, the path left untouched in every case;
    - the sweep removing a `0444` empty file;
    - the sweep keeping, each with its reason, a file with content, a `0644` empty file, a symbolic link and a directory;
    - the sweep leaving untouched a `0444` empty file at a path no manifest lists.
  - `cleanup-run-copies.test.mjs`: the case that asserts the per-run profile's deletion also asserts the `.absent` sibling's.

**Verification:**

- `npm test --workspace cli -- test/placeholder-sweep-lib.test.mjs` and `npm test --workspace cli -- test/cleanup-run-copies.test.mjs` pass.
- The keep cases are asserted on the bytes on disk. Each kept file still exists with its content and mode unchanged.
- `git grep -n 'rm -rf\|rm -r ' -- cli/templates/scripts/lib/harness-run-lib.sh` finds no new line. The sweep removes one file per call.
- `git grep -n 'perm -u+w\|perm -g+w\|perm -o+w' -- cli/templates/scripts/lib/harness-run-lib.sh` shows hits only inside `hr_placeholder_leftover_var`'s body: the sweep carries no copy of the test.
