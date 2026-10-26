### Task 4 — Add the probe clone, its per-run profile, the session launcher, scratch profiles and the every-exit teardown

**Goal:** Give every leg a real probe clone, cut the way the watcher cuts one, with the per-run profile the watcher renders for it. Give every leg a launcher that starts a sandboxed headless session on the watcher's own launch line. Remove everything the probe created on every exit path, success and failure alike, and never anything it did not create (`harness-runs/lessons.md`, *"A script that creates a temporary working copy or branch removes it on every exit path…"*).

**Depends on:**
- **Task 1**, which calls `sp_setup` before the legs and `sp_teardown` after them.
- **Task 2**, which sets `SP_MAIN`, `SP_DEFAULT_BRANCH`, `SP_TMP` and `SP_VERSION` and defines `sp_snapshot_check`. This task's teardown calls that check last.

The legs (Tasks 5–12) consume the API below. This task runs no leg.

### Targets

- `scripts/lib/sandbox-probe/session.sh` (new). It opens with `#!/usr/bin/env bash` and a `# session.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **`sp_setup`.**
  - **Branch.** Pick `SP_BRANCH=chore_sbx_probe_<UTC yyyymmddHHMMSS>`. Refuse with exit 2 if it already exists locally or on origin.
  - **State directory and registry, resolved once.** Before anything is created, resolve both from `stateDir` through the run library, never as a literal (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`; the library already owns the answer, so the probe does not hold a second one):
    - `SP_STATE_DIR="$(hr_state_dir "$SP_MAIN")"` — the repo-relative state directory;
    - `SP_REGISTRY="$(hr_state_path "$SP_MAIN" autonomous_logs/registry.json)"` — the same call `hr_clone_remove_var` makes to find the registry;
    - `SP_AGENT_MODEL="$(hr_agent_model "$SP_MAIN")"` — the same read the watcher makes at start-up (`AGENT_MODEL="$(hr_agent_model "$MAIN_REPO")"` in `scripts/autonomous-watcher.sh`), so the probe launches the model `agentModel` names today, never a remembered one;
    - `SP_AGENT_EFFORT="$(hr_agent_effort "$SP_MAIN")"` — the watcher's `AGENT_EFFORT` read.

    A status of 2 from any of the four (the library's "configuration unresolvable") is a refusal with exit 2, before `create-worktree.sh` runs. **One distinction the library draws, kept here:** `hr_agent_effort` returns **1** when `agentEffort` is unset (`scripts/lib/harness-run-lib.sh`, its comment: *"1 means the adopter pinned none … that is an ordinary project, not an error"*), and `hr_agent_model` can do the same. Status 1 from either of those two sets the value empty and is **not** a refusal — exactly what the watcher's `|| AGENT_EFFORT=""` does. All four are exported with the session API so every leg and the teardown read the same values.
  - **Clone.** Run `bash <main>/scripts/create-worktree.sh <SP_BRANCH>` in default mode, with its bootstrap: the gates leg needs the dependencies. Read the clone path from the run registry, `hr_registry_peek "$SP_REGISTRY" <branch> worktree`, and check that its `copy_kind` is `clone`. That sets `SP_CLONE`.
  - **Per-run profile.** Render it with the watcher's own functions in a child shell that sourced `<main>/scripts/autonomous-watcher.sh status >/dev/null`: `run_profile_render <branch> <clone> clone`, then `run_profile_check "$RUN_PROFILE_FILE" <clone>`. That sets `SP_RUN_PROFILE`.
  - **Failure.** A failed render or check is a refusal quoting `RUN_PROFILE_REFUSAL`. Teardown still runs.
  - **Exit trap.** Install the `EXIT`/`INT`/`TERM` trap that calls `sp_teardown` **before** `create-worktree.sh` runs.
- [ ] **`sp_session <name> <settings file> <prompt file> [--mode dontAsk|acceptEdits] [--allowed <rule>]... [--debug-file <f>] [--cwd <dir>]`.**
  - It runs `cd <cwd, default SP_CLONE> && HARNESS_MAIN_REPO=<main> <agent cli> -p "<prompt>" --settings <file> --permission-mode <mode, default dontAsk> ${model_args[@]+"${model_args[@]}"} ${effort_args[@]+"${effort_args[@]}"} --output-format stream-json --verbose --add-dir <cwd> --add-dir "$SP_MAIN/$SP_STATE_DIR"`, plus one `--allowedTools <rule>` per `--allowed`, and `--debug-file` when given.
  - **Model and effort, the watcher's conditional form.** `model_args=(--model "$SP_AGENT_MODEL")` only when `SP_AGENT_MODEL` is non-empty, and `effort_args=(--effort "$SP_AGENT_EFFORT")` only when `SP_AGENT_EFFORT` is non-empty; otherwise each array stays empty. Both are spliced with the `${arr[@]+…}` form `spawn_engine` uses, so an empty array is safe under the entry point's `set -u`. No model name is spelled as a literal anywhere in the file.
  - That is the line `docs/sandbox-verification.md` → `### The clone layout (owed)` gives, with the anchor set as `spawn_engine` sets it in `scripts/autonomous-watcher.sh`. The state-directory argument is the watcher's own spelling, `--add-dir <MAIN_REPO>/<state_dir>` (the `spawn_engine` header comment), built from `SP_STATE_DIR` above.
  - stdout goes to `SP_TMP/<name>.stream.jsonl`, which sets `SP_STREAM`. stdin is `/dev/null`.
  - `sp_departures` prints the `--allowedTools` rules as a departure string, so each leg's line names them.
  - **The positive-control rule, part of this launcher's contract** (§0, quoted by the prompt's goal item 1: *"a positive control in the same session for every refusal"*). Every session that measures a refusal row also issues a positive control, after the calls it measures. The row prints `not run`, with evidence `control did not succeed: …`, when its control did not succeed. `sp_session` launches whatever prompt it is given and judges nothing. The helpers that carry the rule live in **Task 19's** `controls.sh`: `sp_ctl_clone`, `sp_ctl_prepare`, `sp_ctl_add`, `sp_ctl_held` and `sp_row_result`. Each leg names its own control calls. This file states the rule so that every session's contract carries it, and calls none of those helpers.
- [ ] **The prompt builders.**
  - **`sp_prompt_new <file>`** writes the fixed preamble: issue each call below exactly as written, one tool call each, in order; no retries, no workarounds, no added commands, no `; echo $?`; stop after the last.
  - **`sp_prompt_bash <file> <command>`** appends one Bash call.
  - **`sp_prompt_tool <file> <sentence>`** appends one non-Bash tool call, such as `Edit <path> (after Read)`, `Write <path>`, or a call carrying a named parameter.
  - **`sp_scratch_profile <name> <jq filter> [<base>]`** writes `jq <filter> <base, default SP_RUN_PROFILE>` to `SP_TMP/<name>.json` and prints the path. It **never** edits `<main>/.claude/settings.autonomous.json` or `SP_RUN_PROFILE`.
- [ ] **The registration helpers.**
  - **`sp_extra_clone <branch> [--no-bootstrap] [--existing]`** cuts another clone through `bash <main>/scripts/create-worktree.sh [--existing] [--no-bootstrap] <branch>`, the script's own usage order. It reads the clone path from the registry as `sp_setup` does, renders that clone's per-run profile the same way, registers the clone and `<branch>` for teardown, and sets `SP_EXTRA_CLONE` and `SP_EXTRA_PROFILE`.
    - **Default mode** cuts a new `<branch>` at the default's tip and pushes it. Tasks 8 and 9 use it with `--no-bootstrap` for their plant clones.
    - **`--existing`** checks out a `<branch>` that already exists as a local `refs/heads/<branch>` in `<main>`, and never pushes. Task 7 uses it for its refresh fixtures, which sit behind the default and so cannot be cut in default mode, since that mode refuses an existing local branch. With `--existing`, teardown step 5's origin delete finds no remote branch. That is success: `sp_remote_tip` is empty afterwards.
    - A refusal from `create-worktree.sh` sets `SP_EXTRA_CLONE` empty, returns 1, and quotes its line, so the calling leg prints `not run` for its rows.
  - **`sp_track <path>`** registers a control, marker, helper or planted file, or a scratch directory under `SP_TMP`, for removal. The teardown removes a tracked plain file by name and a tracked directory through `sp_rm_tree`.
  - **`sp_track_branch <name>`** registers a branch for removal, local and on origin.

  Every clone and branch the probe creates goes through these or `sp_setup`, and the teardown removes exactly what was registered.
- [ ] **`sp_teardown`.** It is idempotent and runs every step even after a failed one, recording each failure. For each registered clone, last created first:
  1. remove it through the run library's `hr_clone_remove_var <main> <clone>`;
  2. remove its record through `hr_registry_drop "$SP_REGISTRY" <branch>` — the registry `sp_setup` resolved, never a path rebuilt here;
  3. delete its per-run profile at `hr_run_profile_file <slug> <branch>`;
  4. `git -C <main> branch -D <branch>`;
  5. `git -C <main> push origin --delete <branch>`, judged by `sp_remote_tip` from Task 3 being empty afterwards.

  Then remove what lies outside the registered clones:
  - **each tracked plain file** (a control, marker, helper, or a file planted in the clone) by name with `rm -f -- <path>`, never recursively;
  - **each tracked directory** (Task 8's scratch repositories, each with its own `.git`; Task 9's L2 scratch main checkout; Task 7's fixture scratch clone), and finally **`SP_TMP` itself**, through the one helper **`sp_rm_tree <dir>`**, defined in this file.

  **`sp_rm_tree` takes the exception `hr_clone_remove_var` takes, and says why in its comment.** The run library's own clone removal ends in `rm -rf -- "$cdir"` after its guards (`scripts/lib/harness-run-lib.sh` → `hr_clone_remove_var`), because bash has no in-process recursive removal. `.claude/context/conventions.md` → `## Shell assets` → *"Never shell out to a recursive removal"* exists because a user-level `permissions.deny` on `rm -rf` blocks an **agent's Bash tool call**. That deny matches the command string the agent issues. It does not match a command inside a script the agent did not issue. This probe is started by a person from a terminal, or as `! bash …`, which the permission system does not mediate (Task 1's header). Its removals are lines inside the script, so no deny rule reaches them. The exception is bounded the way the library bounds its own:
  - `sp_rm_tree` refuses, removing nothing and recording a teardown failure, unless `<dir>` is a directory and not a symbolic link, and its `cd -P … && pwd -P` canonical path is `SP_TMP` or lies under it;
  - it then runs `rm -rf -- <canonical dir>`, and records a failure when the path still exists afterwards.

  The registered clones never pass through `sp_rm_tree`; they go only through `hr_clone_remove_var` (step 1). Then call `sp_snapshot_check`. Anything left over is named on stderr, with exit 5.

**Verification:**

- Read `sp_session`'s argument vector against `scripts/autonomous-watcher.sh` → `spawn_engine`'s `"$AGENT_CLI" -p` call. Every flag is the watcher's, except the named `--allowedTools` and `--debug-file` departures.
- `grep -n 'opus' scripts/lib/sandbox-probe/session.sh` finds no match: the model reaches the launch line only through `SP_AGENT_MODEL`.
- Read the `--model` / `--effort` splice against `spawn_engine`'s `model_args` / `effort_args`: both conditional on a non-empty value, both in the `${arr[@]+…}` form.
- Grep `session.sh` for `settings.autonomous.json`. It appears only as a path read or hashed, never as a write target.
- `grep -nE 'rm -[a-zA-Z]*r' scripts/lib/sandbox-probe/session.sh`: every hit lies inside the body of `sp_rm_tree`, and that body checks, before the removal, that the canonical path is `SP_TMP` or lies under it. Every other removal in the file is `rm -f -- <path>` or a call to `hr_clone_remove_var`.
- `sp_rm_tree`'s comment names `hr_clone_remove_var` as the precedent, and states that the probe runs outside the agent permission system.
- `grep -n 'harness-runs' scripts/lib/sandbox-probe/session.sh` finds no match: the state directory and the registry are reached only through `SP_STATE_DIR` and `SP_REGISTRY`. Comments cite the lessons ledger by name, not by its path.
- No session is launched by this task's verification, because a run cannot launch one under the profile it measures.
