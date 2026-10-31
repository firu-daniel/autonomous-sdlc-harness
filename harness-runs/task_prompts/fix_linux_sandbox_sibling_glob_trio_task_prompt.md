`fix_linux_sandbox_sibling_glob_trio` finishes what `fix_linux_sandbox_deny_placeholders` (#212, merged as #217) set out to do: a sandboxed session on Linux can use git in its own run copy. Today it still cannot. #212 removed the per-run copy's **exact** `denyWrite` entries for the run copy's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. The same three paths are also denied by the base profile's **sibling-run-copy glob** entries, and on Linux Claude Code enforces those exactly as it enforced the exact ones: it mounts a `/dev/null` placeholder at each absent path the glob matches.

It comes before sandbox3b2 (#194) and sandbox3b3 (#195), and before the re-take of the probe rows F9 blocked. All of them run on Linux, and none of them gives a meaningful result while every sandboxed git call in the run copy fails.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What was measured (2026-10-30)

AP1–AP5 (`docs/sandbox-verification.md` §5, *The route's re-take (owed)*) were taken in Gate 15's container (`docs/development.md`, *A Linux run, in a local container*) on `dev` at `1a41540c`, the merge of #217:

- Claude Code **2.1.314**, bubblewrap 0.8.0, git 2.39.5, Debian 12 (`node:22-bookworm`), on a colima VM running Ubuntu 24.04, aarch64, kernel 6.8.0-117, with `kernel.apparmor_restrict_unprivileged_userns` set to `0`.
- The procedure: while `bash scripts/sandbox-probe.sh run --leg headless-parity` held its clone, `bash scripts/sandbox-absent-path-check.sh run`, then `sweep`, then `report`, then `after-teardown` and `report` again.

| Row | Verdict | Observed |
|---|---|---|
| AP1 | **fail** | Sandboxed `git status` in the clone exits 128 in phases A and B: `fatal: failed to read <clone>/.git/commondir: Permission denied`. In the main checkout it exits 0 but lists `?? .mcp.json ?? harness-runs/.mcp.json`. |
| AP2 | **fail** | Inside every sandboxed call, `commondir` and `http-alternates` read `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)`. Outside, both are absent after phases A, B and C, and are left behind as `regular empty file, 0 B, -r--r--r--, probe` after the killed session (D). `config.worktree` is a **real** `regular empty file, 0 B, -rw-r--r--, probe` from session A's start (mtime 11:02:14.30, the session's own start) to the end of the run. Inside the sandbox it is mounted read-only over itself (`overlay, ro`). |
| AP3 | **fail** (the sweep half holds) | The sweep removed the seven paths its manifest recorded, the main checkout's `.mcp.json`, `.claude/settings.local.json`, `scripts/.git` and `harness-runs/.mcp.json` among them. After that, `hr_wrapper_main_of` exits 0. But `hr_run_copy_check_var` refuses the clone: `'<clone>' is a clone, but <clone>/.git/commondir exists, and a clone the harness made has none`. `git status` in the clone exits 128 even outside the sandbox: `failed to read <clone>/.git/commondir: No such file or directory`. |
| AP4 | **pass** | Claude Code's own `harness-runs/.mcp.json` was left behind after D and removed by the sweep. |
| AP5 | **pass** | Every other absent entry reads as a `/dev/null` placeholder inside the sandbox. |

## Why: the sibling-glob entries

The per-run profile measured carries **no** exact entry for the trio: #212's omission works. Its `sandbox.filesystem.denyWrite` still carries these three, from the base profile:

```
/home/probe/autonomous-sdlc-harness-*/.git/commondir
/home/probe/autonomous-sdlc-harness-*/.git/config.worktree
/home/probe/autonomous-sdlc-harness-*/.git/objects/info/http-alternates
```

The clone `/home/probe/autonomous-sdlc-harness-chore_sbx_probe_20261030110027` matches that glob. The placeholders are the same `/null` tmpfs mounts the exact entries made in the 2026-10-29 check. So on Linux, Claude Code expands a `denyWrite` glob against the directories that exist when the sandbox starts, and mounts a placeholder at each absent path it yields.

That answers the question the generated profile's `_README` still leaves open: *"How the Linux sandbox treats a `denyWrite` entry containing `*` is unverified - it may skip one, or expand it to the paths that exist when the sandbox starts"* (`cli/src/generators/writeProtection.ts`). It expands, absent paths included. This is the case `docs/sandbox-verification.md` §5 *The route's re-take (owed)* → **The decision rule** names: *"the base profile's sibling-glob `denyWrite` entry for that path"*.

Two consequences:

1. **The omission does not stop the placeholders.** Git in the run copy fails in every sandboxed call, as before #212.
2. **The sweep does not remove the glob's leftovers.** The manifest records the per-run copy's absent **exact** entries. A glob-made leftover is in no manifest, so after a killed session `commondir` and `http-alternates` stay on disk, and the clone is refused for good.

## The proposed fix, for the plan to verify against the code

These are suggestions to check against the code, not constraints. Keep what holds, replace what does not, and say why.

- **Leave the three sibling-glob entries out of the per-run copy as well, on a bubblewrap host only**, exactly as #212 left out the exact ones. Where that is done is the plan's to find: `run_profile_entries` and the render in `cli/templates/scripts/autonomous-watcher.sh`, `COPY_GIT_PATHS` and `bubblewrapDenyWrite` in `cli/src/generators/writeProtection.ts`, or the base profile itself. The `Edit` deny rules for the trio stay. macOS keeps every entry.
- **Say what dropping the glob rows costs.** Today they also protect every **other** sibling run copy, a parked run's clone for example, from a session's writes. Without them on Linux, a session could plant a trio file in another run's clone. Check whether the launch check (`hr_run_copy_check_var` in `spawn_engine`) refuses that clone at its next launch or resume, and whether the one-run-per-repository cap on bubblewrap hosts changes the exposure.
- **Make the sweep cover what a glob made, or show that nothing is left for it.** If the glob rows stay anywhere a session runs, the manifest has to record the absent paths each glob matches in the run copy at launch.
- **Leave the wrappers' refusal of an existing `commondir`, `config.worktree` or `http-alternates` as it is.** A wrapper that accepts an empty file is not a fix.

## `config.worktree`

It is still created as a real file, and still never cleaned up. Its cause is still unknown: `docs/sandbox-verification.md` §0 → **Why `config.worktree` differed: unknown** stands. This run adds three facts:

- It appeared at session A's start, not during a call.
- It is `-rw-r--r--`, not the placeholder's `-r--r--r--`.
- Inside the sandbox it is mounted read-only over itself, the treatment a path that exists when the mounts are built gets.

Whether the glob route above removes it as well can only be measured. If it still appears after the fix, the plan says so and leaves it to the upstream report (`docs/sandbox-placeholder-upstream-report.md`), unless the code it reads shows the cause. Until then, a run copy carrying it is refused by the wrappers, so the fix is not done while it appears.

## Also in scope

- The generated `_README` sentence above, and `doctor`'s `profile-write-protection` Linux note. Both should say what was measured: on Linux a glob `denyWrite` entry is expanded, absent paths included.
- `docs/cli.md` §6's Linux statements on the same point.
- §5 F9's follow-up cell, and the AP rows' expectations where the route changes them.

## Constraints

- **No measured result is invented.** Every Linux claim rests on a container measurement the branch records, with the Claude Code and bubblewrap versions. AP1–AP5 are re-taken after the change, the same way as above, before merge.
- **macOS is unchanged**, and fixtures show it.
- **The wrappers' trust checks are not weakened.**
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- The rows F9 blocked (T3, SR1, SR2, CS3, CS4, CL5, R1–R4, C2, K2, CW4, CS15, CS12, CS14) are re-taken on Linux after this fix, on a record branch of their own.

## Also seen in the same container run, filed separately

The CLI test suite run on Linux in the same container (2,850 tests, 21 failed, none in #212's own tests) found failures that are not this branch's. They are filed separately: the jq 1.6 run-analytics failure in sandbox3b1d, and the `E2BIG`, author-identity and hanging-fetch failures in sandbox3b1e.
