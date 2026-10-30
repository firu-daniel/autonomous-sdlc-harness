### Task 1 — Add the run library's `hr_deny_glob_expand` and `hr_profile_deny_paths`

**Goal:** Give the run library one home for what a `denyWrite` glob yields on disk. On Linux, Claude Code expands such an entry against the directories that exist when the sandbox starts, and mounts a placeholder at each absent path it yields. That was measured on 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0 (`docs/sandbox-verification.md` §5 AP2). The watcher (Task 2) and the absent-path check (Task 5) both need exactly that expansion: the watcher to re-root the trio and to record leftovers, the check to read and record the same set. A second copy of the expansion would drift.

**Where this layer stops.** These are two pure readers. They print paths and remove, create and log nothing, and they set no shell option (`.claude/context/conventions.md` → `## Shell assets`, the sourced-library rule). Deciding which globs to drop, which siblings to re-root at, and what goes in a manifest is **Task 2's**, in `cli/templates/scripts/autonomous-watcher.sh`.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the two new functions, placed beside `hr_placeholder_manifest_write` under the manifest helpers, plus the comment above `hr_wrapper_target_check_var`.
- `cli/test/placeholder-sweep-lib.test.mjs`: the cases.

**Work:**

- [ ] `hr_deny_glob_expand <entry> [<exclude>]`. **The contract Task 2 and Task 5 call:**
  - **Accepted shape.** `<entry>` is an absolute path carrying exactly one `*`, and that `*` is the last character of its path segment. This is the shape `cli/src/core/paths.ts` → `worktreeGlob` emits, `<work_root>/<projectName>-*`, followed by a suffix such as `/.git/commondir`. Split it as `<parent>/<stem>*<suffix>`, where `<suffix>` is empty or starts with `/`.
  - **What it prints.** For each name in `<parent>` matching `<stem>*` that is a directory (`-d`, so a link to a directory counts), it prints `<parent>/<name><suffix>`, one per line, in the shell's glob order.
  - **Exclusion.** When `<exclude>` is given and non-empty, a directory with `[ "<parent>/<name>" -ef "<exclude>" ]` is skipped. The comparison is by identity, never by spelling.
  - **Skips.** A name carrying a newline is skipped.
  - **The expansion.** `<parent>/<stem>` is quoted and only the `*` is left unquoted, so a glob character in the project name or the work root is literal.
  - **Exit codes.** 0, including when nothing matches. 2, printing nothing, when the shape differs: a relative entry, no `*`, more than one `*`, or a `*` that does not end its segment. 3, printing nothing, when the calling shell has `noglob` on (`case $- in *f*`), because the library may not turn it off.
- [ ] `hr_profile_deny_paths <profile>`. **The contract:**
  - **Exact entries.** It prints every string in `<profile>`'s `.sandbox.filesystem.denyWrite` that carries no `*`, verbatim, in file order.
  - **Glob entries.** It then prints, for each string that does carry one, in file order, what `hr_deny_glob_expand <that string>` prints, with no exclude. An entry the expander refuses contributes nothing.
  - **What it leaves alone.** It does not test existence and does not deduplicate. `hr_placeholder_manifest_write` already drops paths that exist and tolerates repeats.
  - **Exit codes.** 0. 1, printing nothing, when `<profile>` is unreadable or `jq` cannot read that array as a list.
- [ ] The header comment above `hr_wrapper_target_check_var`: its last clause *"how the Linux sandbox treats those globbed entries is unverified"* becomes the measured statement. On Linux a `denyWrite` glob is expanded against the directories that exist at sandbox start, and a placeholder is mounted at each absent path it yields (AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0). A new file under an existing directory such an entry matched was not refused (GW1, 2026-10-29).
- [ ] `placeholder-sweep-lib.test.mjs`. Add the two functions to the header's list of primitives. Each case copies the template library into its own throwaway directory under `os.tmpdir()` and sources it in one `bash` process, as that file's existing cases do.
  - `hr_deny_glob_expand` against a work root holding `<p>-a/`, `<p>-b/`, a file `<p>-c` and a link `<p>-d` to `<p>-a`. It prints the suffixed paths of `a`, `b` and `d`, and not `c`.
  - With `<exclude>` set to a differently spelled path to `<p>-a`, both `a` and its link `d` are skipped.
  - A project name carrying `[` matches only literally.
  - Each refused shape exits 2 and prints nothing: no `*`, two `*`s, `*` mid-segment, a relative entry.
  - Under `set -f` it exits 3 and prints nothing.
  - `hr_profile_deny_paths` over a profile with two exact entries and one glob prints the exact two, then the glob's expansions. An unreadable profile exits 1.

**Verification:**

- `npm test --workspace cli -- test/placeholder-sweep-lib.test.mjs` passes, with the cases above among its subtests.
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0. `grep -nE '^[[:space:]]*(set|shopt) ' cli/templates/scripts/lib/harness-run-lib.sh` shows no line added by this task.

**Deviations from plan:**

- `hr_profile_deny_paths` drops a `denyWrite` string carrying a newline instead of printing it verbatim: printed raw, it would read back as two paths. That matches `hr_placeholder_manifest_write`'s and `hr_deny_glob_expand`'s own newline skip. It also drops non-string elements. A `denyWrite` that is absent or not an array exits 1, read as "jq cannot read that array as a list".
- `bash -n` was not run on its own. The evidence is `bash scripts/typecheck.sh`, whose `check-shell-parse` leg reported `97 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`. The `set`/`shopt` check rests on reading the diff: neither added function has a line beginning with `set` or `shopt`.
