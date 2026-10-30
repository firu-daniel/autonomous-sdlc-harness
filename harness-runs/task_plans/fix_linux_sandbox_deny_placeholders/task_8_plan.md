### Task 8 — Record the absent-path check, the route and the owed re-take in `docs/sandbox-verification.md`

**Goal:** Make `docs/sandbox-verification.md` the record of what the 2026-10-29 absent-path check measured, what this branch changed because of it, and what is still owed. Every Linux claim rests on a recorded container measurement with its versions. The change's own Linux effect appears only as owed rows the maintainer takes by hand.

**Depends on:**

- **Task 4**, which makes the watcher, on a host where `hr_placeholder_host_probe_var` answers `1`:
  - render a clone's per-run copy with no exact `denyWrite` entry for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`, keeping their `Edit` rules;
  - run `hr_run_copy_check_var` on a clone in `spawn_engine`, before every launch and resume;
  - cap itself at one run.
- **Task 11**, which makes the same watcher sweep recorded 0-byte, read-only leftovers at four points: each pass start, after a stall-watchdog kill, before an inbox launch, and at the head of `spawn_engine`. It also sweeps at the watcher's own start, when a leftover stops git placing the main checkout.
- **Task 6**, which ships `scripts/sandbox-absent-path-check.sh` with `run`, `sweep`, `after-teardown` and `report`.
- **Task 7**, which creates `docs/sandbox-placeholder-upstream-report.md`.

This task records those facts and changes none of those files.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` binds this file: a measured fact states what was measured, the command and the exact message. Also bound by the ledger's *Evidence and measurement* rules: a decision rule's outcome is a proposal to the maintainer, never written into other documents as pending work.

### Targets

- `docs/sandbox-verification.md`

**Work:**

- [ ] §0, after *The targeted check (2026-10-29)*, a new paragraph block **The absent-path check (2026-10-29).** Record the task prompt's *Measured: the absent-path check (2026-10-29)* as taken:
  - **Stamp:** Claude Code 2.1.312, bubblewrap 0.8.0, Debian 12 on the Ubuntu 24.04 colima VM, `kernel.apparmor_restrict_unprivileged_userns` `0`.
  - **Scope:** the 35 exact `denyWrite` entries read, the globs left out, and phases A–D plus the teardown reading.
  - **Results:** the three-row table, and the *Also measured* bullets on git, the wrappers after a killed session, Claude Code's own `harness-runs/.mcp.json`, the excluded call's namespace and phase C.
  - **The script.** The script that ran is the prompt's `measure.sh`. Name its in-tree successor, `scripts/sandbox-absent-path-check.sh`, and the two things it adds: the trio is read whether or not the profile names it, and the `sweep` phase.
- [ ] Below that table, a paragraph on why `config.worktree` differed. The measurement shows the following, and nothing more:
  - it was `-rw-r--r--` where bubblewrap's leftovers were `-r--r--r--`;
  - it was mounted read-only over itself inside the sandbox, the treatment a path present when the mounts were built gets;
  - its mtime was the session's start;
  - so something other than the bubblewrap placeholder path created it before those mounts.

  State that no code this branch read shows what, or why it is never cleaned up, so the cause is **unknown**. State what the harness's own code shows, citing the function rather than a grep: `setup-worktree.sh` → `hooks_config_write` (`cli/templates/scripts/setup-worktree.sh`, and its self-adopted copy under `scripts/`) writes a `config.worktree` only for a worktree — `git -C "$top" config --worktree core.hooksPath …` for a plain worktree, and `git -C / config --file "$target_gitdir/config.worktree" …` for a `--target` worktree — while for a `--target` clone (`target_kind` `clone`) it writes `git -C / config --file "$target_gitdir/config" …`, the clone's own `.git/config`. So no harness code path writes a clone's `.git/config.worktree`. What would settle it: the Claude Code bundle's own code for that path. The upstream report's third ask (`docs/sandbox-placeholder-upstream-report.md`) puts the question to upstream.
- [ ] §5 F9's follow-up cell. Replace *"Fix filed: #212 … The blocked rows are re-taken on Linux after it."* with the route `fix_linux_sandbox_deny_placeholders` takes, each part cited to its owner:
  - the trio's omission on a bubblewrap host (`cli/src/generators/writeProtection.ts` → `COPY_GIT_PATHS`, `bubblewrapDenyWrite`; `autonomous-watcher.sh` → `run_profile_entries`);
  - the launch check (`spawn_engine`) and the sweep (`autonomous-watcher.sh` → `placeholder_sweep_pass` and `placeholder_start_recover`; `lib/harness-run-lib.sh` → `hr_placeholder_sweep_var`);
  - the cap of one run;
  - the upstream report.

  End with *Owed:* AP1–AP5 (below), taken by hand on this branch's head before merge, and the blocked rows re-taken on Linux on a record branch of their own.
- [ ] A new owed table under §5, **The route's re-take (owed)**, with the columns `| # | Check | Expected on Linux | Observed | Verdict |`. Every Observed cell reads `owed`, every Verdict `owed`. Each row's check is `bash scripts/sandbox-absent-path-check.sh run`, then `sweep`, then `report`, in Gate 15's container on this branch's head:
  - **AP1:** sandboxed `git status` in the clone exits 0 in phases A and B.
  - **AP2:** none of the trio exists inside or outside the sandbox in any phase.
  - **AP3:** after phase D and `sweep`, every recorded 0-byte, read-only leftover is removed, `hr_wrapper_main_of "$M/scripts"` exits 0, and `hr_run_copy_check_var` accepts the clone.
  - **AP4:** Claude Code's own `harness-runs/.mcp.json` leftover is removed by the sweep.
  - **AP5:** the other absent entries still read as placeholders inside a sandboxed call, so the protection they give holds.

  After the table, the decision rule. If AP2 finds any of the trio still created, the omission does not stop that path, and the row records which source made it: the glob entry or Claude Code's own. That verdict is a proposal to the maintainer, written in that row alone and in no other document.
- [ ] §6's Linux point and §8:
  - §6 *How the Linux sandbox treats a `denyWrite` entry containing `*`*: append that an exact entry for an absent path is now measured (§0 *The absent-path check*), while the glob treatment stays **not run**, because that check left the globs out.
  - §8's `CS1 (Linux)` *Expected on Linux* cell: append that on a bubblewrap host the per-run copy carries no `denyWrite` for the trio, so CS1's set, read off the profile, no longer includes them. Their sandboxed writes are expected to land, and the launch check and the wrappers refuse the copy afterwards (CS12–CS14). The macOS baseline cell is untouched.

**Verification:**

- `grep -n 'AP1\|AP5\|The absent-path check (2026-10-29)\|bubblewrapDenyWrite' docs/sandbox-verification.md` finds each new anchor.
- No row outside the new AP table and `CS1 (Linux)` changed its Verdict cell: `git diff -U0 -- docs/sandbox-verification.md` shows no edited line in §8 other than `CS1 (Linux)`.
- Every number and quoted message in the new §0 block is found by `grep -F` in `harness-runs/task_prompts/fix_linux_sandbox_deny_placeholders_task_prompt.md`. Nothing records an AP result.

**Deviations from plan:**

- §6's Linux bullet: the plan asked to say the glob treatment "stays **not run**". §8 GW1 and GW2 already record what the first Linux run (2026-10-29) found for a glob entry (`recorded: **written**`, `recorded: **refused**, by an F9 placeholder`), so "not run" would contradict §8 (`.claude/context/conventions.md` → `## Documents of record`). Written instead: the absent-path check left the globs out and measures nothing about the glob treatment; what the first Linux run recorded for a glob entry is GW1 and GW2 (§8).
- The `config.worktree` paragraph: the `-rw-r--r--` mode is the **targeted check's** reading (task prompt, `after:   -rw-r--r-- 1 probe probe 0 Oct 29 11:34 …`); the absent-path check's record states only *a real empty file owned by `probe`*. The paragraph attributes the mode to the targeted check, and compares it with this check's phase-D `-r--r--r--` leftovers.
- *The script.*: the first thing the in-tree successor adds is stated as reading the trio **and each `--add-dir` root's `.mcp.json`** whether or not the profile names them, because `scripts/sandbox-absent-path-check.sh` → `write_entries` adds both.
- The AP table sits at the end of §5, after the BG note, so it does not separate the F table from *The probe's own defects*; F9's follow-up cell points at it by its heading as well as "below".
- The decision rule's glob source is named as *the base profile's sibling-glob `denyWrite` entry for that path* (`cli/src/generators/writeProtection.ts` → `CopyGitPath.bubblewrapDenyWrite`'s doc: *"The base profile carries every row on every host"*).
- Line-number probe (`grep -rno "sandbox-verification.md:[0-9]*"` over `plugin`, `.claude`, `harness-runs`, `docs`, `cli/src`, `cli/templates`): the only hits are in `harness-runs/story_plans/fix_sandbox_excluded_commands_form_story_plan.md`'s scope register, a merged branch's point-in-time artifact whose coordinates (`:3`, `:10`, `:25`, `:72`, `:91`, `:92`, `:177`, `:195`) already do not resolve against the current file. The plan fixes this task's insert points, so those hints were left as they are.
- Verification bullet 3 was executed: each number and quoted message of the new §0 block, as one `grep -Fo -e … -e …` over the task prompt, matched (24 patterns, every one printed). The `config.worktree` paragraph's quoted code (`hooks_config_write`, its three `git … config` forms) was read off `cli/templates/scripts/setup-worktree.sh` → `hooks_config_write`, not the task prompt; for `scripts/setup-worktree.sh` only the function's presence was checked, by `grep -n hooks_config_write`.
