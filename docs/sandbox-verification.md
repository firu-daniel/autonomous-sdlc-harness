# Sandbox verification

**Who reads this:** anyone changing the unattended permission profile's `sandbox` block, `cli/src/generators/writeProtection.ts`, the three excluded wrappers (`commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`) or the watcher's launch line. It records what the profile `feat_unattended_bash_sandbox` shipped actually does under Claude Code's own sandbox, measured by hand on the day it landed. These are the checks its plan marked **Manual setup required** or left **unresolved**. A later change re-runs a row rather than re-arguing it. Its siblings are `docs/guard-verification.md` and `docs/outer-loop-verification.md`.

**Stamp.** 2026-10-14 · profile regenerated from `46c4b45e` (`dev`), scripts committed as `0cfd4014` · macOS 15.7.4 (24G517), arm64 · `claude --version` **2.1.299 (Claude Code)** · `git --version` **2.50.1 (Apple Git-155)** · SSH remote `git@github-firu:firu-daniel/autonomous-sdlc-harness.git` (a host alias for `github.com`).

**The headline, before the rows.** Three defects stop an unattended macOS run under this profile as shipped:

- **No sandboxed git call in a linked worktree can write that worktree's record**, so no run can commit. The full flow parked at its first commit. See §2 G1 and §5 F1. Since `fix_sandbox_worktree_record_writes`, runs commit through the main checkout's `commit-on-branch.sh` as a third excluded command; its rows, CW1–CW6 in §3, are owed.
- **The two `excludedCommands` entries match nothing**, so the main checkout's wrappers run sandboxed and every SSH push and refresh fails. See §3 P1 and R0. `fix_sandbox_excluded_commands_form` changes the generated form to P2's; the rows it affects are owed a re-run (§3).
- **`run-gates.sh` fails every status-graded gate sandboxed.** See §5 F2.

Each one has its own follow-up. The write protection, the credential denial and the network allowlist all held.

---

## 0. Method

**The regeneration (step 1).** `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze` was run from the main checkout with the merged CLI built by `npm run build`. Afterwards, `cmp` of each `scripts/*` against `cli/templates/scripts/*` matched for every file except the two project-command wrappers, which are rendered from the configuration, not copied. The profile carried the strict block:

- `enabled` and `failIfUnavailable` are `true`;
- `allowUnsandboxedCommands` and `autoAllowBashIfSandboxed` are `false`;
- `network.strictAllowlist` is `true` and `allowedDomains` is `[]`;
- `allowWrite` is `[<main>/harness-runs]`;
- `excludedCommands` names the 2 wrapper rules;
- `denyWrite` has 37 entries.

The forced run also rewrote files this repository keeps by hand: `.claude/CLAUDE.md` and the context documents, `githooks/pre-push`, `.gitignore`, the state-dir READMEs, and the bodies of `scripts/test.sh` and `scripts/typecheck.sh`. Those were restored from git, or by line for the two wrappers, before any check ran. Every check below runs against that output. The watcher was restarted on it (`restart-watcher.sh`).

**Host git against the floors.** 2.50.1 meets the wrappers' **2.23** floor (`worktrees/<name>/HEAD`) and `refresh-branch.sh`'s **2.38** floor (`merge-tree --write-tree`).

**The launch line.** Every sandboxed session is the watcher's own (`scripts/autonomous-watcher.sh`, the `"$AGENT_CLI" -p` call), run from the working copy under test:

```sh
cd <working copy> && claude -p "<probe prompt>" \
  --settings <main>/.claude/settings.autonomous.json \
  --permission-mode dontAsk --model opus \
  --output-format stream-json --verbose \
  --add-dir <working copy> --add-dir <main>/harness-runs
```

The probe prompt names each command verbatim, one Bash call each, and forbids retries and workarounds. A probe that appended `; echo $?` was discarded and re-run, because a compound changes which rules match. Evidence is the stream's `tool_result` text and the session's `permission_denials`, quoted below.

**Three deliberate departures, each named in its row:**

- **`--allowedTools <rule>`** on the launch line, where a check needs a command the profile does not allow (`dd`, `mv`, `git switch`, `git config`, `git init`, the QA-lock scripts). It adds an allow rule without touching the profile, so the call reaches the sandbox instead of stopping at the permission layer.
- **A scratch copy of the profile**, passed as `--settings`, for diagnostics only, and always against the real profile's result in the same row. The real `.claude/settings.autonomous.json` was never edited, except the two `doctor` stale variants, and that file was restored byte-identical (`cmp`).
- **Fixtures written from an ordinary terminal**, where the check needs a commit or a planted configuration that the sandbox itself refuses to write (§2 G1).

**Reading a refusal.** The layers say different things:

| Layer | What it says |
|---|---|
| Sandbox | The OS's own `Operation not permitted` (for `dd`: `dd: <path>: Operation not permitted`), or `<sandbox_violations>` for network |
| Permission layer | `Permission to use Bash with command … has been denied`, or `… because Claude Code is running in don't ask mode` |
| File tools | `File is in a directory that is denied by your permission settings.` |

Every sandbox write probe carries a positive control in the same session: the worktree itself, `<main>/harness-runs/` and a new file directly in `<main>/.git/`. So a refusal is attributable to the entry under test, not to the write mechanism.

**Clean-up.** Each fixture was removed afterwards: worktrees, branches and remote branches, planted configuration, control files. `harness.config.json`, `.git/config` and every protected file were compared against a `shasum` taken before the first probe.

---

## 1. Regeneration and `doctor`

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| D1 | `doctor`, fresh profile | `profile-sandbox` and `profile-write-protection` pass with and without `--remote-job` | Both checks `PASS`, with and without `--remote-job`: "`sandbox` block is on and strict, excludes exactly the 2 expected wrapper rules and allows exactly the 0 expected domains"; "write-protects each of the 37 paths … on both sides". Separately, `--remote-job` failed `plugin-permissions` ("missing 1 of the 1 `permissions.allow` entry this machine's plugin roots need"), which is outside this record. | **pass** |
| D2 | `doctor`, profile with no `sandbox` block | warn without `--remote-job`, fail with it | `! WARN profile-sandbox … has no sandbox object` and `! WARN profile-write-protection` (all 37 paths listed) → `!! FAIL` for both under `--remote-job` | **pass** |
| D3 | `doctor`, the `harness.config.json` entries removed (its `denyWrite` entry and its `Edit`/`Write` denies) | warn without, fail with | `profile-sandbox` `PASS`; `profile-write-protection` `! WARN` naming the missing `denyWrite` entry and both file-tool rules → `!! FAIL` under `--remote-job` | **pass** |

D1 grades the `excludedCommands` spelling P1 shows to be inert, and it requires `Write` deny rules W5 shows to be inert. A pass here is not evidence that either works. Since `fix_sandbox_excluded_commands_form`, `profile-sandbox` grades the corrected `bash <main>/scripts/<wrapper>.sh:*` form and reports the `Bash(…)` one as stale.

---

## 2. Git under the record protection

**Owed a re-run.** G1 and G3 are the 2026-10-14 record. Both are owed a re-run on a profile carrying the third excluded entry, `bash <main>/scripts/commit-on-branch.sh:*`. Under that route G1's raw `git add` is still expected to fail sandboxed, since nothing in the profile's sandbox changed. G3 is expected to get past its first commit and then stop at Run gates while F2 is open.

**G4–G7 are owed measurements, not results.** None has been taken. Each is filled in by a person under §0's method, launch line and controls, with `claude --version` recorded in its Observed cell, because a run cannot launch a sandboxed session under the profile it is measuring.

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| G1 | From a worktree: commit, checkout, rebase, merge, fetch, stash push and pop | all succeed | `git add`/`git commit`: `fatal: Unable to create '<main>/.git/worktrees/<name>/index.lock': Operation not permitted` (128). `git fetch origin dev`: `error: cannot open '<main>/.git/worktrees/<name>/FETCH_HEAD': Operation not permitted` (255). `git stash push` / `pop`: `error: could not write index`. `git switch -c` (the checkout path, through `--allowedTools`): `Unable to create '<main>/.git/worktrees/<name>/HEAD.lock': Operation not permitted`, **after** it had already created the branch ref. `checkout`, `merge` and `rebase` themselves never reach the sandbox: they are on the profile's `ask` list, and also on the user's own `~/.claude/settings.json` one, which `dontAsk` refuses. | **fail**: F1 |
| G2 | G1's cause: the `name` entry on `<main>/.git/worktrees/*` | — | **Not the cause.** `git add` fails the same way on scratch profiles with that entry removed; with all four record entries removed plus `allowWrite += <main>/.git`; with **no `denyWrite` at all** plus that grant; with `--add-dir <main>/.git`; and with `allowWrite +=` the exact record directory. From the same worktree session, `git branch <x>` **succeeds**, so `<main>/.git/refs` is writable. With cwd = the main checkout, `git add` succeeds. | settled: the record outside the session's cwd is closed by the runtime, not by a profile entry |
| G3 | The full flow: one throwaway task (`chore_sbx_flow_probe`, a one-sentence docs edit) dropped in the inbox and run by the watcher under the regenerated profile and `dontAsk` | completes; any permission refusal of a call the flow needs is a missing profile entry | **Parked at its first act.** `commit-on-branch.sh` (sandboxed) → `fatal: Unable to create '<main>/.git/worktrees/autonomous-sdlc-harness-chore_sbx_flow_probe/index.lock': Operation not permitted`, twice; then `PARKED: … 1 question(s)`. Its one `permission_denials` entry is a diagnostic compound the agent improvised (`ls -la …; touch …`), not a call the flow needs. No refusal of a needed call was seen. The flow never got past the ledger, so the plan's top risk (entries `acceptEdits` covered silently) is **still unmeasured** beyond that point. | **fail**: F1 |
| G4 | G1's `git add` taken again on the installed Claude Code (2.1.303 on this machine as of 2026-10-19). The real regenerated profile, §0's launch line with cwd = a linked worktree. One exact call: `git add <file>`. In the same session, the controls: `git branch <x>` and `dd if=/dev/null of=<main>/.git/sbx_probe_control conv=notrunc` (a new file directly in `<main>/.git`). Then, through `--allowedTools Bash(dd:*)`, two `dd` calls: one creating a new file directly in `<main>/.git/worktrees/<name>/`, one opening that record's existing `index`. | either `git add` fails as G1 did, or it succeeds. The two `dd` calls separate a per-file deny (the new file written, `index` refused) from a closed directory (both refused) | **not run — owed.** Measurement not yet taken. | not run — owed |
| G5 | The launch-line candidate: §0's launch line with the session's cwd = the main checkout and `--add-dir <worktree>`. One exact call: `git -C <worktree> add <file>`, through `--allowedTools Bash(git -C:*)` because the profile has no `git -C` allow rule. Controls in the same session: `git add <file>` on a file in the main checkout (G2's passing case), and `dd` creating a new file in `<worktree>`. A run launched this way resolves the main checkout, not its worktree, from a bare `git rev-parse --show-toplevel`. Whatever this row finds, adopting it means changing every checkout-root resolution in the plugin. | either the record write is refused as in G1, or `git add` succeeds and `git -C <worktree> diff --cached --name-only` lists `<file>` | **not run — owed.** Measurement not yet taken. | not run — owed |
| G6 | The relocated-record candidates. **(a)** A per-run clone whose git dir sits inside its own working tree: `git clone --no-hardlinks <main> <dir>` from an ordinary terminal, then a session launched per §0 with cwd = `<dir>`, two exact calls: `git add <file>`, then `git commit -m "<subject>"` (through `--allowedTools` if the profile refuses it). Control: `dd` creating a new file in `<dir>/.git`. **(b)** A `git worktree add` record moved into its own worktree: from a terminal, move `<main>/.git/worktrees/<name>/` to a directory inside `<worktree>`, rewrite `<worktree>/.git` to point at it and the moved record's `gitdir` to point back. Record what `git worktree list` (from the main checkout) and `bash <main>/scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"` (from a terminal) then say, then probe `git add <file>` from a session launched per §0 with cwd = `<worktree>`, with the same `dd` control in `<worktree>`. | (a) and (b) each: `git add` and `git commit` either succeed, judged by `git rev-parse HEAD` before and after, or are refused, with the message quoted. (b) also records whether `git worktree list` still lists `<worktree>` and whether the wrapper's target check accepts it | **not run — owed.** Measurement not yet taken. | not run — owed |
| G7 | What the sandbox does with the cwd's git common dir. §0's launch line with cwd = a linked worktree, plus `--debug`. Quote, from the debug log, every write allow and deny entry the runtime adds for `<main>/.git` and for `<main>/.git/worktrees/<name>/`. Control: the same session launched with cwd = the main checkout, quoted the same way. A reading of 2.1.303's bundled code suggests the runtime grants write on the common dir and denies, per record, only `config.worktree`, its lock and `commondir`. That is a lead to confirm, not a finding. | the entries quoted verbatim, and whether they match the lead | **not run — owed.** Measurement not yet taken. | not run — owed |

---

## 3. The wrappers

**Owed a re-run.** This table's cells are the 2026-10-14 record, taken against the `Bash(…)` form of the `excludedCommands` entries. `fix_sandbox_excluded_commands_form` changes the generated form to `bash <main>/scripts/<wrapper>.sh:*`, so P1, P3, R0–R4, C1, C2, K2, L1 and L2 are owed a re-run on a profile carrying it. C1, C2 and K2 ran through the main wrapper while it was sandboxed; under the corrected entry it runs unsandboxed, which is the case their refusals exist for. Two boundaries the corrected entry makes load-bearing have never been measured against a matching entry, and are owed new rows beside P1a before this note is removed: an assignment prefix, `GIT_SSH_COMMAND=<probe> bash <main>/scripts/push-branch.sh <worktree>`, which `push-branch.sh`'s header keeps `GIT_SSH_COMMAND` on the ground that it stays sandboxed; and a compound, `bash <main>/scripts/push-branch.sh <worktree>; <a second allow-listed command>`, which `docs/cli.md` §6 and the profile's `_README` state stays sandboxed. If either runs unsandboxed, the `GIT_SSH_COMMAND` decision and the compound sentence are wrong and must be reopened.

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| P1 | `bash <main>/scripts/push-branch.sh <worktree>` from a sandboxed session (one exact call), shipped profile | runs outside the sandbox; the remote branch moves | **Runs sandboxed.** `push-branch.sh: could not ask origin whether it still has chore_sbx_probe (ls-remote exited 128)`, then three times `Received disconnect from UNKNOWN port 65535:1: This proxy requires authentication …`. `git ls-remote` unchanged. | **fail**: F3 |
| P1a | Why: the entry spelling, isolated with a script that reports whether it can write `$HOME` | — | `excludedCommands` entry → result: `Bash(bash <s>:*)` → sandboxed, with or without an argument, and with `allowUnsandboxedCommands` `true` too. `bash <s>` → **unsandboxed** with no argument, sandboxed with one. `bash <s> *` → **unsandboxed** with an argument. `bash <s>:*` → **unsandboxed** with an argument. An excluded command inherits none of the sandbox's proxy variables. A sandboxed one carries `GIT_SSH_COMMAND=ssh … -o ProxyCommand='nc -X 5 -x localhost:<port> %h %p'`, which `push-branch.sh` keeps by design. | settled: the profile's `Bash(…)` form is inert |
| P2 | P1 under a scratch profile whose only change is `excludedCommands: ["bash <main>/scripts/push-branch.sh:*", "bash <main>/scripts/refresh-branch.sh:*"]` | as P1 | `46c4b45e..ee930ce5  chore_sbx_probe -> chore_sbx_probe` / `push-branch.sh: pushed chore_sbx_probe to origin`; `ls-remote` moved to `ee930ce5`. | **pass** under the corrected entry |
| P3 | The worktree's own `bash scripts/push-branch.sh`, shipped profile | stays sandboxed and fails over SSH | the same proxy refusal; the remote stayed at `ee930ce5` with `aca1f287` local | **pass** |
| R0 | `bash <main>/scripts/refresh-branch.sh <worktree>`, fixture (a), shipped profile | runs outside the sandbox | sandboxed: the fetch is refused by the proxy, then `fatal: Unable to create '<main>/.git/worktrees/…/index.lock': Operation not permitted`; `refresh-branch.sh: could not update … — nothing was merged, working copy unchanged`, **exit 1**; tip unchanged | **fail**: F3 |
| R1 | Fixture (a): a branch cut from `dev~2` (`856389ca`) with no commits of its own; corrected entry | fast-forward | `merged origin/dev into chore_sbx_ref_a`, **exit 0**; `856389ca → 46c4b45e`, one parent. `git status` clean. Refs moved: `refs/heads/chore_sbx_ref_a` only (`origin/dev` was already current). | **pass** under the corrected entry |
| R2 | Fixture (b): its own non-conflicting commit `80d1da5c` | two-parent merge, `git merge`'s default message | **exit 0**; `72656592 parents=80d1da5c 46c4b45e Merge remote-tracking branch 'origin/dev' into chore_sbx_ref_b`; clean; only `refs/heads/chore_sbx_ref_b` moved | **pass** under the corrected entry |
| R3 | Fixture (c): its own commit editing `ROADMAP.md` line 137, which `dev` also changed | exit 4, `conflicted:` paths, nothing written | **exit 4**; `origin/dev conflicts with chore_sbx_ref_c — nothing was merged, working copy unchanged` / `conflicted: ROADMAP.md`. Before against after: every ref, the record's `index` (`shasum`), `git status --porcelain` and the tracked files' `shasum` all **identical**. | **pass** under the corrected entry |
| R4 | The worktree's own `bash scripts/refresh-branch.sh`, then `--local` (fixture (d): `dev~2` plus the current wrapper committed) | the fetch fails sandboxed over SSH; `--local` succeeds | The fetch failed with the proxy refusal, as expected. **`--local` failed too:** `fatal: Unable to create '<main>/.git/worktrees/autonomous-sdlc-harness-chore_sbx_ref_d/index.lock': Operation not permitted`, exit 1, nothing merged. No plugin instruction calls this spelling, so this is evidence for F1, not a defect of its own. | **fail**: F1 |
| H1 | A human commit and push from an ordinary terminal in a worktree after the forced `init`: plain `git commit` and `git push`, then `bash scripts/push-branch.sh` | both land; `pre-push` runs; nothing the profile or `setup-worktree.sh` wrote gets in the way | `git push`: `GIT_TRACE` shows `run_command: <worktree>/githooks/pre-push origin …` and `ee930ce5..2ad89f2a`. Wrapper: `2ad89f2a..8b3150fa`, `pushed chore_sbx_probe to origin`. (The wrapper unsets `GIT_*`, `GIT_TRACE` included, so its hook run cannot be shown this way.) `core.hooksPath` in `config.worktree` = `<worktree>/githooks`. | **pass** |
| C1 | A scratch repository whose `.git/config` sets `core.sshCommand`, built by sandboxed commands (`git init`, `git config` through `--allowedTools`) and passed to the main wrapper | refused before any git network call | `push-branch.sh: refusing to push: '<tmp>/scr_sshcmd' is neither the main checkout <main> nor a worktree it lists: its .git is not a regular pointer file`. The marker the `sshCommand` would `touch` was never created. | **pass** |
| C2 | The same setting planted (from a terminal, since the sandbox refuses the write) in a **listed** worktree's `config.worktree`; push through the main wrapper | refused | `refusing to push: <main>/.git/worktrees/<name>/config.worktree sets core.sshcommand, and only core.hooksPath may be set there`; no marker | **pass** |
| K1 | `git config --worktree core.hooksPath <elsewhere>` from a sandboxed command | refused, or the next push refuses | the write itself is refused: `error: could not lock config file <main>/.git/worktrees/<name>/config.worktree: Operation not permitted` (255) | **pass** |
| K2 | The same value planted from a terminal; push through the main wrapper | refused | `refusing to push: … config.worktree sets core.hooksPath to something other than <worktree>/githooks, the value setup-worktree.sh writes` | **pass** |
| L1 | `push-branch.sh` on a worktree whose branch is `-sbxdash` (a throwaway ref and worktree) | refused | `push-branch.sh: branch '-sbxdash' starts with '-', which git would read as an option — refusing to push` | **pass** |
| L2 | `refresh-branch.sh` from a scratch main checkout whose `harness.config.json` has `defaultBranch: "-x"` | refused | **exit 1**: `defaultBranch '-x' in '<tmp>/dashrepo/harness.config.json' starts with '-' … — refusing to merge` | **pass** |

Every push row above is judged by `git ls-remote origin <branch>`, never by the exit status: a refused or failed push exits 0 by contract.

**The commit wrapper.** `fix_sandbox_worktree_record_writes` adds the main checkout's `commit-on-branch.sh` as a third `excludedCommands` entry, `bash <main>/scripts/commit-on-branch.sh:*`. CW1–CW6 are owed: none has been taken. Each is filled in by a person under §0's method, on a profile regenerated with that entry, with `claude --version` recorded in its Observed cell. Each is judged by `git rev-parse refs/heads/<branch>` before and after and by `git -C <worktree> status --porcelain`, never by the wrapper's message alone. CW1 is the positive control for CW2–CW6 and runs first in the same session.

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| CW1 | From a sandboxed session in a worktree (§0's launch line), one exact call: `bash <main>/scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"`, where `<file>` is a tracked file edited beforehand | runs outside the sandbox: exit 0, `commit-on-branch.sh: committed <short_sha> on <branch>`; `refs/heads/<branch>` moves to a commit whose only change is `<file>`; `git -C <worktree> status --porcelain` is empty | **not run — owed.** Measurement not yet taken. | not run — owed |
| CW2 | The worktree's own copy, one exact call: `bash scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"` | stays sandboxed and fails on the record: exit 1, an `Operation not permitted` under `<main>/.git/worktrees/<name>/`. Record whether `refs/heads/<branch>` moved before the failure, as G1's `git switch -c` created its ref before it failed | **not run — owed.** Measurement not yet taken. | not run — owed |
| CW3 | A scratch repository built from a terminal (`git init`, one commit), whose `.git/config` sets `core.fsmonitor` to a command that touches a marker file, passed as the target: `bash <main>/scripts/commit-on-branch.sh --repo <tmp>/scr <file> -- "<subject>"` | refused before git runs: exit 1, a `commit-on-branch.sh: refusing to commit:` line naming the target as neither the main checkout nor a worktree it lists; the marker is never created; the scratch repository's `HEAD` is unchanged | **not run — owed.** Measurement not yet taken. | not run — owed |
| CW4 | The same `core.fsmonitor` key planted from a terminal in the worktree's `config.worktree` (`git config --worktree`), then CW1's call | refused: exit 1, a `refusing to commit:` line naming `config.worktree` and the key; no marker; `refs/heads/<branch>` unchanged. Perturbation: remove the key, same call → exit 0 as CW1 | **not run — owed.** Measurement not yet taken. | not run — owed |
| CW5 | A compound, one exact call: `bash <main>/scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"; git status` | stays sandboxed: the wrapper fails as CW2, or the call is refused at the permission layer; record which, and whether `refs/heads/<branch>` moved | **not run — owed.** Measurement not yet taken. | not run — owed |
| CW6 | An assignment prefix, one exact call: `GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"`, where `<x>` is the `.git` of a scratch repository | stays sandboxed and fails as CW2; or, if it runs excluded, `hr_git_env_drop` neutralises the prefix: the commit lands on `refs/heads/<branch>` exactly as CW1, and `<x>`'s refs are unchanged. Record which | **not run — owed.** Measurement not yet taken. | not run — owed |

---

## 4. The profile's denials

**Network**

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| N1 | `git fetch https://example.com/…` and `https://registry.npmjs.org/…`, under `dontAsk`, cwd = main checkout | refused at once | `CONNECT tunnel failed, response 403` / `<sandbox_violations> deny network-outbound example.com:443 (host is not on the allow list)`; the same for `registry.npmjs.org:443`; no prompt, no stall | **pass** |
| N2 | The same under `--permission-mode acceptEdits` | honoured: refused; not honoured: prompts or stalls | **identical refusals**, `permission_denials` empty, no stall | **pass**: `strictAllowlist` is honoured from `--settings` |

**Credentials**

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| S1 | A read of `~/.ssh` from a sandboxed command | refused | `cat ~/.ssh/config`, `ls ~/.ssh`, `find /Users/<u>/.ssh …` and `grep -c Host …/.ssh/config` are refused at the permission layer. A read hidden inside `awk` (`getline < "…/.ssh/config"`) reaches the sandbox and gets `lines=0`, against `lines=268` for `README.md` in the same session. | **pass** |
| S2 | `Read` tool on `~/.ssh/config` | refused | `File is in a directory that is denied by your permission settings.` | **pass** |
| S3 | `Grep` and `Glob` tools on `~/.ssh` | refused | **not run**: neither tool exists in this build. The session's `init` tool list has `Bash` and `Read` and no `Grep` or `Glob`. Search goes through Bash, which is S1. | not run |

**Write protection: sandboxed commands.** Each `dd if=/dev/null of=<path> conv=notrunc` through `--allowedTools Bash(dd:*)` opens for writing, writes nothing, and creates a missing file. Before any `dd`, the same paths were probed with an empty `awk` append, with the same outcome.

| # | Path | Observed | Verdict |
|---|---|---|---|
| W0 | controls: `<worktree>/sbx_probe_control.txt`, `<main>/harness-runs/scratch/…`, `<main>/.git/sbx_probe_control` | `0+0 records out` (written) | control |
| W1 | `<main>/scripts/push-branch.sh`, `<main>/scripts/lib/harness-run-lib.sh` | `Operation not permitted` | **pass** |
| W2 | `<main>/githooks/pre-push`, `<worktree>/githooks/pre-push`, `<main>/.git/hooks/sbx_probe_new` | `Operation not permitted` | **pass** |
| W3 | `<main>/.mcp.json`, `<worktree>/.mcp.json` | `Operation not permitted` | **pass** |
| W4 | `<main>/harness.config.json`, `<main>/.git/config`, `<main>/.git/config.worktree`, `<main>/.claude/settings.json`, `settings.autonomous.json`, `settings.local.json`, `<worktree>/.claude/settings.json` | `Operation not permitted` | **pass** |

The same set through the plain permission layer (`echo -n >> …`, `mkdir -p …`, `mv …`) is refused by the permission layer first.

**Write protection: `Edit` and `Write`**

| # | Check | Observed | Verdict |
|---|---|---|---|
| W5 | `Write` creating `<main>/.mcp.json`, `<worktree>/.mcp.json`, `<main>/scripts/lib/…`, `<main>/.git/hooks/…`, `<main>/.claude/settings.local.json`; `Edit` (after `Read`) of `harness.config.json`, `.git/config`, both `.claude/settings*.json`, `push-branch.sh`, `githooks/pre-push`, `scripts/lib/harness-run-lib.sh`, `<worktree>/.claude/settings.json` | every call: `File is in a directory that is denied by your permission settings.`; 11 of 11 `Edit` calls in `permission_denials`; every file's `shasum` unchanged | **pass** |

The `--debug` log warns for every `Write(...)` rule: `… is not matched by file permission checks — only Edit(path) rules are`. The `Edit` denies carry the whole file-tool side (F4).

**The worktree record.** Probed on a throwaway worktree, `chore_sbx_rec`.

| # | Probe | Sandboxed command | `Edit`/`Write` | Verdict |
|---|---|---|---|---|
| WR1 | create a directory under `<main>/.git/worktrees/` | `git worktree add --detach …` → `fatal: could not create directory of '<main>/.git/worktrees/…': Operation not permitted`; `dd` of `<main>/.git/worktrees/sbx_probe_newrec` → `Operation not permitted`; `mkdir -p` refused by the permission layer | `Write <main>/.git/worktrees/sbx_probe_newrec/HEAD` → denied | **pass** |
| WR2 | rename an existing record | `mv <record> <record>-renamed` (through `--allowedTools`) refused by the permission layer; never reached the sandbox | — | **not run** at the sandbox layer |
| WR3 | write a record's `commondir`, `gitdir`, `config.worktree` | `dd` → `Operation not permitted` (all three) | `Edit` → denied (all three) | **pass** |
| WR4 | write the worktree's `.git` pointer | `dd` → `Operation not permitted` | `Edit` → denied | **pass** |
| WR5 | write `<main>/.git/commondir` | `dd` → `Operation not permitted` | `Write` → denied | **pass** |
| WR6 | `<main>/.git/remotes/origin` and a file under `<main>/.git/branches/` | `dd` of `<main>/.git/remotes` and `<main>/.git/branches` → `Operation not permitted` (neither exists, so creating the directory itself is what is refused) | `Write` of both files → denied | **pass** |
| WR7 | create `<main>/scripts/.git` as a file and as a directory | file: `dd` → `Operation not permitted`; directory: `mkdir -p` refused by the permission layer | `Write` → denied | **pass** |

The record's own `HEAD` is refused too (`dd` → `Operation not permitted`), which is G1. Nothing that a probe attempted was created or changed.

**`.claude/` and the QA lock**

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| Q1 | `Write` of `<worktree>/.claude/sbx_probe_note.md` under `dontAsk` | recorded | **refused**: `Permission to use Write has been denied because Claude Code is running in don't ask mode`. Under `acceptEdits`: `Claude requested permissions to edit … which is a sensitive file.` Nothing written in either. | settled |
| Q2 | `reserve-qa-user.sh`, then `release-qa-user.sh 1`, from a sandboxed session in a worktree. The worktree's own `harness.config.json` had `phases.qa: true` and a one-account credentials file; both scripts were allowed through `--allowedTools`, because a profile generated with QA off allows neither. | the lock goes under `<main>/harness-runs/qa_user_locks/`; release removes it | reserve printed `1`; `ls <main>/harness-runs/qa_user_locks` → `user_1`; release: `released account slot 1`, and the directory was then empty. No `qa_user_locks` under the worktree or anywhere under `/tmp`. | **pass** |

---

## 5. Failures and their follow-ups

| # | Failure | Rows | Follow-up |
|---|---|---|---|
| F1 | A sandboxed git call cannot write a linked worktree's record. Every unattended run's commits fail, and so do `--local` refreshes and `switch`. No profile entry measured opens it. | G1, G3, R4 | `fix_sandbox_worktree_record_writes` (task prompt `sandbox1d`): runs commit through the main checkout's `commit-on-branch.sh`, a third `excludedCommands` entry, which builds the commit by plumbing and runs no hook. Owed: G4–G7 (§2) and CW1–CW6 (§3). |
| F2 | `run-gates.sh` fails all 24 status-graded gates sandboxed (`run-gates: 24 failed, 4 passed`). `log="$(mktemp -t harness-gates)"` gets `mkstemp failed on /var/folders/…/T/harness-gates.…: Operation not permitted`: macOS `mktemp -t` ignores `TMPDIR`, and the per-user temp directory is not writable, while the sandbox's own `TMPDIR` (`/tmp/claude-501`) is. Setting `TMPDIR` on the command line does not help, for the same reason. | gates row below | `fix_run_gates_sandbox_tmpdir` (`sandbox1f`) |
| F3 | The `excludedCommands` entries in `Bash(…:*)` form are inert. Both main-checkout wrappers run sandboxed, and every SSH push and refresh fails. | P1, P1a, R0 | `fix_sandbox_excluded_commands_form` (`sandbox1e`): the generator now writes P2's `bash <main>/scripts/<wrapper>.sh:*` form, and `doctor`'s `profile-sandbox` reports an entry in the `Bash(…)` form as stale. |
| F4 | `Write(...)` rules are inert, and the `Bash(bash <main>-*/scripts/<x>.sh:*)` allow rules are literal prefixes (`--debug`: "the * is not expanded"). Protection holds through `Edit`, but `doctor` grades the dead rules. | D1, W5 | `fix_profile_inert_permission_rules` (`sandbox1g`) |

**The gates row.**

| # | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| T1 | `bash scripts/test.sh` (→ `scripts/run-gates.sh`) in a sandboxed session in a worktree | green | as F2 | **fail**: F2 |

Unsandboxed, on this branch's final tree, `scripts/run-gates.sh` reports every gate `ok` except two. Gate 6a is red in a self-adopted checkout by design (`run-gates.sh`'s own note): the machine-local profile names this checkout's paths. Gate 13 is `BLOCKED` because this host has no synced `uv` environment. Neither is caused by the sandbox.

---

## 6. The unresolved points, settled or not

- **`strictAllowlist` set from `--settings`:** **honoured**, on 2.1.299, macOS, headless. Under `acceptEdits` an unlisted host was refused at once with `<sandbox_violations>`, exactly as under `dontAsk` (N1, N2).
- **The `name` entry on `<main>/.git/worktrees/*` (the record protection's top risk):** git cannot write the record's `HEAD`, `index` or logs from inside the sandbox, so every run's commits fail, as the risk predicted. **But that entry is not the cause.** With no `denyWrite` entry at all, and with explicit `allowWrite` on the record, the record stays closed (G2). What the entry itself adds cannot be measured until F1 opens the record.
- **A `.claude/**` write under `dontAsk`:** **refused**, as under `acceptEdits` (Q1). Under `dontAsk` the refusal is the mode's; under `acceptEdits` it is the sensitive-file prompt nobody answers.
- **Headless parity:** **still open.** No interactive session was run beside these headless ones, so nothing here compares the two. These headless behaviours depart from what `docs/cli.md` §6 and the profile's `_README` expected: the `excludedCommands` spelling (P1a), the record of a worktree outside the cwd (G2), and the `Write(...)` and glob-`:*` rules (F4). The task prompt's facts came from the documentation pages, not from an interactive measurement. Whether an interactive session differs on any of them is not known.
- **How the Linux sandbox treats a `denyWrite` entry containing `*`:** **not run.** No Linux or WSL2 host with `bubblewrap` and `socat` and a signed-in Claude Code was used. The `failIfUnavailable` startup refusal, the worktree-record probe and the ordinary-git check on Linux are **not run** for the same reason. A Docker VM (colima) exists on this machine. Using it means placing Claude Code's credentials inside it, which this run did not do unasked.

**Also observed, not a row of the task:**

- An empty `--settings` file starts a session with **no sandbox and no error**: a scratch profile truncated by a failed `jq` let a script write `$HOME`. `failIfUnavailable` does not apply, because no `sandbox` block is read. This belongs to `feat_unattended_sandbox_preflight`'s launch refusal.
- The forced self-adopt `init` regresses hand-set files in this repository (step 1 above), and leaves five `README.md.bak` files in gitignored state-dir folders. Follow-up: `chore_self_adopt_regeneration_friction` (`sandbox1h`).
