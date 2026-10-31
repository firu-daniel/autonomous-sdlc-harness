### 1. The file tools can write a `commondir`, `config.worktree` or `http-alternates` with content into a Linux run copy: add a `PreToolUse` guard for `Edit|Write|NotebookEdit` that refuses them on every platform

**File:** `plugin/hooks/hooks.json` — `"matcher": "Bash"` (the one `PreToolUse` entry today); new `plugin/hooks/git-trust-file-guard.sh`; `plugin/hooks/README.md` — "Six guards ship here, declared in `hooks.json`.", "The only guard in the plugin that denies.", the fail-closed table row "| `allow-qa-credentials-read.sh` | silent | silent | silent |", "The entries are ordered by the severity of what they can emit", the paragraph after the fail-closed table — "with no `jq` no guard can parse its payload, so all six are silent" and "is measured, with a live positive control per guard and with fault injection"; and `## Prerequisites` — "Nothing else — the guards are plain `bash`", "Five of the six run a cheap top-level string filter" and "If `jq` is missing, **every guard exits 0 silently**"; new test `cli/test/git-trust-file-guard.test.mjs`

**What is wrong.** Checked against the current tree.
- On a bubblewrap host, round 1 (`fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_1.md`) dropped the run copy's own trio `Edit` rules from the per-run copy (`autonomous-watcher.sh` → `run_profile_edit_drops`). Its premise was that the sandboxed shell could already write those paths (`cli/src/generators/writeProtection.ts` → "Nothing is lost: the sandboxed shell could already write the path there").
- AP8 (2026-10-31, Claude Code 2.1.316) disproves that premise. A sandboxed `dd` exited 0 but the file never reached the disk: `plain shell | absent through 21 s of polling`.
- The file tools are judged by permission rules, not by bubblewrap. The base allows `Edit(//<work_root>/<project>-*/**)`, and nothing denies the run copy's own trio there any more. So on Linux a session can now `Write` a `commondir` **with content** into its own run copy. The wrappers and the launch check refuse such a clone, but a person who later runs git in that folder follows it.
- `plugin/hooks/hooks.json` registers only `"matcher": "Bash"`. No hook sees a file-tool call.
- Restoring the `Edit` rules is ruled out. On Linux they mount the `/null` placeholder and break git in the run copy (2026-10-30 sessions 1 and 2; §5 AP1, AP2, AP7).

**Fix.** Do not touch the `Edit` rules: the bubblewrap drop stays, the sibling's exact rules stay, macOS keeps every rule, and `.git/config`, `.git/hooks` and `.git/objects/info/alternates` keep their rules everywhere. Do not touch the trust checks.

1. **Registration.** In `plugin/hooks/hooks.json`, add a second object to `hooks.PreToolUse` after the `Bash` one:
   ```json
   {
     "matcher": "Edit|Write|NotebookEdit",
     "hooks": [
       {
         "type": "command",
         "command": "bash \"${CLAUDE_PLUGIN_ROOT}/hooks/git-trust-file-guard.sh\""
       }
     ]
   }
   ```
   Use only `matcher` / `type` / `command`, and quote the token with its path (`plugin/hooks/README.md` → `## Registration, …`).

2. **The guard, `plugin/hooks/git-trust-file-guard.sh`.** Follow the existing guards' shape:
   - a `# git-trust-file-guard.sh — …` header comment and a `REPRO` block (`plugin/hooks/git-commit-branch-guard.sh` is the model);
   - `set -u`, never `set -e`, plus `set -f`;
   - bash 3.2;
   - payload on stdin, at most one JSON object out.

   The guard has no jurisdiction test and reads no `harness.config.json`, so it does not source `lib/harness-config-lib.sh`. That is deliberate: the user asked for it to apply on every platform and in every session that loads the plugin. Say so in its header.

   - **No top-level string filter, argued in the header.** `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A guard hook*, asks for "its own self-verifying top-level string filter". This guard deliberately has none, and its header must argue the exception the way `allow-qa-credentials-read.sh` argues its own under **WHAT THAT COSTS, AND WHY THE COST IS ACCEPTED RATHER THAN UNNOTICED**. Add a paragraph in the existing guards' capitalised-heading style, headed `NO TOP-LEVEL STRING FILTER, DELIBERATELY`, that:
     - states that the guard runs no cheap string test before `jq`;
     - gives the two reasons: a filter on the trio's names would let a non-JSON payload through silently, and the user requires malformed input to be refused rather than silenced; and a symlinked leaf (`<repo>/innocent` → `.git/config.worktree`) carries no trio name in its path, so a name filter would miss it;
     - states what that costs per `Edit`, `Write` or `NotebookEdit` call, in every session that loads the plugin: one `jq`, plus the `cd -P` / `pwd -P` subshell, plus `readlink` on the symlinked-leaf branch only — and nothing on a Bash call. Label this *derived*: the measured latency is owed (Finding 2, step 6).

   - **Payload.** Read `.tool_name`, `.cwd` and the target path in one `jq` call. The target is `.tool_input.file_path` for `Edit` and `Write`, and `.tool_input.notebook_path` for `NotebookEdit`.
   - **Fail closed.** Emit `deny` in each of these cases, with a reason naming what could not be read:
     - the payload is not JSON;
     - the expected path field is missing, not a string, or empty;
     - `.tool_name` is not one of the three;
     - `jq` is missing or cannot run.

     This departs from the README's "payload will not parse → silent" column. The user asked for it ("It fails closed on input it cannot parse … Malformed hook input is refused"), so the README records it (step 3).

     A missing `jq` therefore refuses every file-tool call in a session that loads the plugin. `jq` is already a stated prerequisite. The reason text must say so, e.g. `git-trust-file-guard: jq 1.5 or newer is not on PATH, so the target path cannot be read; refusing (plugin/hooks/README.md → ## Prerequisites)`.

     If you judge that cost too high, do not soften it in the code. Return it to the user as a question.
   - **Normalisation, pure bash plus `cd -P` / `pwd -P`.** A guard may need only `git` and `jq` (`.claude/context/conventions.md` → the stack line). There is one exception, below.
     1. Make the path absolute: resolve a relative one against `.cwd`, else `$PWD`.
     2. **Lexical form.** Collapse repeated `/`, drop `.` segments, resolve `..` segments lexically, and strip any trailing `/`.
     3. **Physical form.** Take the deepest existing ancestor directory of the absolute path as written, `..` included. Resolve it in a subshell with `cd -P … && pwd -P`, then append the remaining segments, normalised as in step 2. This catches a symlinked parent, and a `..` that crosses one.
     4. **A symlinked leaf.** If the full path is an existing symbolic link (`[ -L ]`), resolve it with `readlink` (no `-f`, which macOS's older `readlink` lacks), relative to the link's directory. Follow at most 8 hops, then apply step 3 to the result.

        This is the one use of a binary beyond `git` and `jq`, and only on this rare branch. If `readlink` is missing, fails, or the hop limit is reached, deny (fail closed). Record the departure in the header and in the README's `## Prerequisites`.

        The review does not ask for this branch; it is this plan's addition, kept as a user decision (index → **Decisions the user may want to revisit**). It makes `.claude/context/conventions.md`'s "the only external binaries a guard may need are `git` and `jq`" untrue, and that sentence sits under `.claude/`, which this unit cannot write: the index's **Manual follow-up** lists it. The builtins-only alternative, refusing any file-tool call whose target is an existing symbolic link, was weighed and not chosen: it would refuse every edit to any symlinked file in every session that loads the plugin.
   - **The test.** Run it on both the lexical and the physical form. Refuse if either form ends in `/.git/commondir`, `/.git/config.worktree` or `/.git/objects/info/http-alternates`, or contains one of them followed by `/` (a path under one).

     Match case-insensitively (`shopt -s nocasematch` with `[[ … == … ]]`, available from bash 3.1). On macOS's default case-insensitive filesystem, `.GIT/COMMONDIR` is the same file.

     Every other path gets silence (exit 0, no output). Examples: `.git/config.worktree.bak`, a `commondir` outside `.git`, `.git/worktrees/<n>/commondir`. The guard emits nothing but `deny` or silence.
   - **The refusal.** The output is `hookSpecificOutput.hookEventName: "PreToolUse"`, `permissionDecision: "deny"`, and a `permissionDecisionReason` that names the path as given, the resolved path when it differs, and the reason. For example:

     `git-trust-file-guard: refusing <tool> on <path> (resolves to <resolved>): .git/commondir, .git/config.worktree and .git/objects/info/http-alternates redirect git to another repository or config; a run copy must never carry one written by a session (docs/cli.md §6 residual 12)`
   - **No sandbox mount.** The guard creates nothing and mounts nothing, so AP1–AP3 are unaffected. State this in the header, labelled *derived* until AP1–AP6 are re-taken on this round's head (Finding 4 → owed).
   - **The REPRO block** reproduces each outcome:
     - `Write`, `Edit` and `NotebookEdit` on each trio path → `deny`;
     - a path under each → `deny`;
     - a `..` form → `deny`;
     - a symlinked-parent form → `deny`;
     - `.git/config.worktree.bak` and a `commondir` outside `.git` → silent;
     - a non-JSON payload → `deny`.

     For example: `printf '{"tool_name":"Write","tool_input":{"file_path":"/tmp/x/.git/commondir"},"cwd":"/tmp"}' | bash plugin/hooks/git-trust-file-guard.sh`.

3. **`plugin/hooks/README.md`.** Bring the shared contract into line:
   - "Six guards … All six register on the `PreToolUse` event under the `Bash` matcher" → seven guards. Six are under `Bash`; this one is under `Edit|Write|NotebookEdit` and reads a path, not a command.
   - Add a row to the outcome table for `git-trust-file-guard.sh`, `deny` or silence. In the protected-branch guard's row, change "The only guard in the plugin that denies." to say there are two deny-capable guards, one per matcher.
   - In `## Jurisdiction: no config, no opinion`, add one sentence: this guard is the deliberate exception and applies in every session, because what it protects is git's own redirection files in any repository, and refusing a file-tool write to them costs nothing anywhere.
   - Add a fail-closed table row for it: `deny` | not applicable (reads no configuration) | **`deny`**. Then, in the paragraph after the table:
     - add a sentence explaining why its payload column differs from every other guard's;
     - rewrite "with no `jq` no guard can parse its payload, so all six are silent, the deny guard included" so that the six command guards are silent and `git-trust-file-guard.sh` refuses every file-tool call;
     - narrow the closing claim "Every cell of that column, … is measured, with a live positive control per guard and with fault injection … in `docs/guard-verification.md` §2.3" to the six command guards, and add that `git-trust-file-guard.sh`'s cells are recorded in §2.3 as reproduced decisions (Finding 2, step 6).
   - Change the ordering paragraph ("The entries are ordered by the severity …") to describe the two matcher objects.
   - In `## Prerequisites`:
     - Add the `readlink` exception from step 2.
     - Rewrite "Five of the six run a cheap top-level string filter … `allow-qa-credentials-read.sh` is the exception and cannot be otherwise" so that it covers seven guards: five run the filter, `allow-qa-credentials-read.sh` is one exception for the reason already given, and `git-trust-file-guard.sh` is the second. Point at its header paragraph **NO TOP-LEVEL STRING FILTER, DELIBERATELY**, and say its cost falls on `Edit`, `Write` and `NotebookEdit` calls, not on Bash calls, so the "on every Bash call in every session" cost sentence that follows stays true as written.
     - Rewrite "If `jq` is missing, **every guard exits 0 silently**" (the next paragraph's first case): the six command guards exit 0 silently, while `git-trust-file-guard.sh` refuses every `Edit`, `Write` and `NotebookEdit` call, with a reason naming `jq`. In the same paragraph, cover the too-old-`jq` case for the new guard: it reads no configuration, so the "configuration load is a compile error" outcome does not apply to it; it treats any non-zero `jq` exit as unparseable input and refuses, so with a too-old `jq` it either decides as usual or refuses — never goes silent. Write the guard's single `jq` expression with no construct beyond the 1.5 floor so that this holds.

4. **Tests: a new suite, `cli/test/git-trust-file-guard.test.mjs`.** There is no existing hook-decision suite. Follow `cli/test/main-root-fallback.test.mjs`:
   - its header doc comment, with "The rule these tests exist to enforce", "Not covered" and a `RED ONCE` line once you have seen the suite fail against a broken guard;
   - `WORKSPACE_ROOT` and `runBash` from `./helpers/fixture.mjs`;
   - the guard fed its payload on stdin through `runBash(dir, ['-c', 'printf %s "$1" | bash "$2"', '_', payload, GUARD])`.

   Build the fixtures in a temporary directory: a `git init` repository with a real `.git/`, `.git/objects/info/`, and a directory symlink to its `.git`.

   Cases:
   - **Refused** (assert one JSON object with `permissionDecision` `deny` and a reason containing the path), for each of `Edit`, `Write` and `NotebookEdit`:
     - on each of the three paths;
     - on a path under each (e.g. `.git/commondir/x`);
     - on a `..` form (e.g. `<repo>/sub/../.git/commondir`);
     - on a symlinked-parent form (`<link-to-.git>/commondir`);
     - on a trailing-`/` form;
     - on an upper-case form (`<repo>/.GIT/COMMONDIR`).
   - **A symlinked leaf**: a file symlink `<repo>/innocent` → `.git/config.worktree`, refused.
   - **Allowed** (assert exit 0 and empty stdout):
     - `.git/config.worktree.bak`;
     - `<repo>/commondir`;
     - `<repo>/notes/http-alternates`;
     - `.git/worktrees/w/commondir`;
     - an ordinary source file.
   - **Malformed input refused**: non-JSON text, `{}`, a missing `file_path`, a numeric `file_path`, an empty string, and an unknown `tool_name`.
   - **A relative `file_path`** resolved against `.cwd`, refused.

   Run this new file through the configured per-file test command. It is the only test file this finding creates.

**Manual follow-up, not this unit's.** `.claude/context/conventions.md` → "Exactly one guard in the plugin may answer `deny`" and "it emits `allow` or nothing", and `.claude/context/plugin.md` → the row "a `PreToolUse` decision about a Bash command", and `.claude/context/conventions.md` → "the only external binaries a guard may need are `git` and `jq`" (made untrue by the `readlink` branch), all sit under `.claude/`, which an unattended run cannot write. The index's Context lists them.

**Deviations from plan:**
- `cli` layer (step 4), run first per the tag order `cli, plugin`: `cli/test/git-trust-file-guard.test.mjs` was written before `plugin/hooks/git-trust-file-guard.sh` exists. Its run through `npm test --workspace cli -- test/git-trust-file-guard.test.mjs` fails every case with `bash: …/plugin/hooks/git-trust-file-guard.sh: No such file or directory` (exit 127), so the pass is owed by the `plugin` layer's run of the same file. The suite's correctness rests on a throwaway reference guard under `harness-runs/scratch/` (uncommitted): 83 of 83 cases passed against it; with `nocasematch` removed and the symlinked-leaf loop disabled, 13 of 83 failed (every `upperCase` and symlinked-leaf case) — the `RED ONCE` line records that, not a red against the shipped guard.
- Added beyond the plan's case list: a `NotebookEdit` payload carrying only `file_path` (no `notebook_path`) is asserted refused, per step 2's "the expected path field is missing". Every refusal asserts exit 0 plus one JSON object, the shape the existing guards emit.
- `plugin` layer (steps 1–3): `npm test --workspace cli -- test/git-trust-file-guard.test.mjs` now passes against the shipped guard, `# tests 83`, `# pass 83`, `# fail 0` — the pass the `cli` layer's note left owed. The suite's `RED ONCE` line still records a red against the reference guard, not the shipped one; no mutation run against the shipped guard was made.
- `plugin` layer: the field split uses `jq`'s `@sh` and `eval "set -- …"` rather than the reference guard's `base64`, so no binary beyond `jq` (and `readlink` on the symlinked-leaf branch) is needed; and the `deny` object is printed by a pure-bash JSON escaper, so the missing-`jq` refusal needs no `jq`.
- `plugin` layer, beyond the plan: a path or `.cwd` carrying a NUL is refused (a NUL cannot survive the bash hand-off); a payload of more than one JSON value, or an empty one, is refused (`jq -s`); a `.tool_input` that is not an object is read as carrying no path field; a `cd -P` failure on the deepest existing ancestor is refused rather than falling back to the lexical form; the symlinked-leaf chain is followed from both the path as written and its lexical form, since the two can name different links. The README also gained matching narrowings the plan did not list by quote — "every guard here stays silent in it" (jurisdiction), "A guard that cannot parse its payload at all … exits 0 silently", "outside every guard's jurisdiction", and the `## Reproducing a decision by hand` payload shape for this guard.
- `plugin` layer, evidence: decisions under `/bin/bash` 3.2.57 (the floor) were exercised through a throwaway probe, `harness-runs/scratch/trust-guard-shipped-probe.mjs` (uncommitted): the missing-`jq` refusal (`PATH=/nonexistent`), a 10-hop chain refused, a path carrying `"`, a newline, U+0001 and `\` refused with a reason that parses as JSON, two JSON values and empty stdin refused, and a non-object `tool_input` refused. A too-old `jq` was not exercised: no `jq` older than 1.5 is installed here; that claim rests on reading the expression (no construct past 1.5) and on the non-zero-exit refusal. `claude plugin validate --strict plugin` was not run (a gate, not this unit's); `hooks.json` was confirmed to parse with `jq`, carrying matchers `Bash` and `Edit|Write|NotebookEdit`.
- Outside this layer, left for the orchestrator: `cli/src/doctor/checks.ts` carries the doctor message "so every guard exits 0 silently", now untrue for `git-trust-file-guard.sh`; and `.claude/context/conventions.md` / `.claude/context/plugin.md` per this finding's **Manual follow-up**.
