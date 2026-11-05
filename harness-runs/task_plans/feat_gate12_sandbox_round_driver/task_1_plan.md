### Task 1 — Add the entry point and `core.sh`: the row table, `--list`, the result line and the exit accumulator

**Goal:** Give the round driver its skeleton, shaped like `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/core.sh`:
- the entry point and its argument parsing;
- the single row table every other task reads;
- the result-line printer;
- the exit-code accumulator.

**Where this task stops.** It defines no subcommand body. For each subcommand that takes `--repo`, the entry point runs, **in this order, one function at a time**:
1. `g12_need g12_preflight` — exit 1 naming `g12_preflight` when it is absent;
2. `g12_preflight` — on a non-zero return, stop there and exit with the code accumulated so far (2 for a refusal, 3 for a failed `gh` / `git` call), never reaching step 3;
3. `g12_need <subcommand fn>` — exit 1 naming that function when it is absent;
4. `<subcommand fn>`, then `g12_exit_final`.

So until a later task ships a library, the subcommand is a usage refusal (exit 1) naming the first missing function, and once Task 2 ships, a preflight refusal is exit 2 even while the subcommand's own library is absent. The subcommand functions:
- `plant` → `g12_plant_cmd` (Task 3);
- `default-branch` → `g12_default_branch_cmd` (Task 5);
- `grade` → `g12_grade_cmd` (Task 6);
- `teardown` → `g12_teardown_cmd` (Task 9).

### Targets

- `scripts/gate12-sandbox-round.sh` (new) — the entry point.
- `scripts/lib/gate12-sandbox-round/core.sh` (new) — the row table, the printer and the exit accumulator.

**Work:**

- [ ] `gate12-sandbox-round.sh`:
  - Open with the header the model's carries: `# gate12-sandbox-round.sh — …`, what it changes and what it never does, the usage block and the exit map.
  - State that it is hand-written for this repository, is not in the set `init --force` regenerates, is not a `cli/templates/` file, and never runs in this repository (`docs/development.md` → **This repository cannot host its own remote runs.**).
  - Use `#!/usr/bin/env bash` and `set -u` with no `-e`, arguing it in the header as `scripts/sandbox-probe.sh` does.
  - Resolve the library directory from `${BASH_SOURCE[0]}`. Source, each only if present and in this order: `core.sh`, `preflight.sh`, `state.sh`, `plant.sh`, `plants.sh`, `default-branch.sh`, `runs.sh`, `grade-plant.sh`, `grade-state.sh`, `grade-full-run.sh`, `teardown.sh`.
  - `core.sh` itself missing is exit 1.
- [ ] Argument parsing:
  - `--help` and `--list` take no option.
  - `plant`, `default-branch`, `grade` and `teardown` each require `--repo <owner>/<name>`, exactly once and non-empty, and set `G12_REPO`.
  - `plant` and `grade` take repeatable `--row <ID>`, refused unless the row is in the table. `grade` also takes `--full-run <branch>`, once.
  - `default-branch` takes `--other-branch <name>`, and takes `--stall-warn-secs`, `--stall-kill-secs` and `--wait-secs`, each a positive integer.
  - **This task owns the defaults**, applied here after parsing so every later task reads a set value: `G12_OTHER_BRANCH` defaults to `gate12_other_<UTC yyyymmddHHMMSS>`, `G12_STALL_WARN_SECS` to `60`, `G12_STALL_KILL_SECS` to `120` and `G12_WAIT_SECS` to `600`. The usage block states each default.
  - An unknown argument is a usage error.
  - Store the parsed values in globals named in the header: `G12_REPO`, `G12_ROWS_SELECTED`, `G12_FULL_RUN_BRANCH`, `G12_OTHER_BRANCH`, `G12_STALL_WARN_SECS`, `G12_STALL_KILL_SECS`, `G12_WAIT_SECS`. Assign them in the script and never inherit them from the environment.
- [ ] `core.sh`, the row table:
  - `G12_ROWS` is the single declaration, one tab-separated line per row in this order: FR1 FR2 FR3 FR4 FR5 FR6 FR7 JS1 JS4 SB2 SB4 RJ2 JS3 JS3N SB3 RJ3.
  - The fields are `<row>`, `<round step>` (6, 7, 8 or 9), `<route>` (`full-run` | `plant` | `reads-SB2` | `default-branch` | `hand`), `<arms, comma-joined, or ->` and `<note>`.
  - **Every row's route, stated once here** (later tasks restate it, never re-decide it): FR1–FR7 `full-run`, round step 6, arms `-`; JS1, JS4, SB2 and RJ2 `plant`, round step 7; **SB4 `reads-SB2`, round step 7, arms `-`**; JS3 `default-branch`, round step 8; JS3N `hand`, round step 8; SB3 `hand`, round step 7; RJ3 `hand`, round step 9.
  - The arms are JS1 `settings,remote-run`, JS4 `npmrc,node-modules`, SB2 `clarifications`, RJ2 `profile` and JS3 `stall`. Every other row's arms field is `-`.
  - **`reads-SB2`** is SB4's route alone: the row has no plant and no hand step of its own for its bundle half; `grade` reads it from SB2's planted job's `harness-state` artifact. It is neither `plant` (Task 3 never plants it) nor `hand` (Task 7 never prints it as a hand row). SB4's note says so, and that its optional half (a throwaway upload workflow, a background process) stays a hand step.
  - SB2's route is `plant`. Its note states that its `PAUSE_PROGRESS.md` arm and its `remote_status.json` variant are hand steps.
  - RJ2's route is `plant`. Its note states that the planted profile is itself a job surface (`protectedPaths` → `PROFILE_PATH`, kept by `jobSurfacePaths`), so `Refuse a branch that changed the job's own files` refuses the branch before the launch check, and the launch-check clause has no route.
  - JS3N, SB3 and RJ3 are `hand`. Each note gives the reason the story index's route table gives, in one sentence, and cites the source symbol (`hr_remote_move_aside` / `hr_remote_status_write`, `protectedPaths` → `CONFIG_FILENAME`, `jobSurfacePaths`), with no `|`, tab, double quote or backtick, so a Markdown cell can restate it. RJ3's note reads round step 9, a local leg.
  - Add `g12_rows_print` (`--list`, the table verbatim), `g12_row_field <row> <n>`, `g12_row_names` and `g12_row_arms <row>`.
- [ ] `core.sh`, the result line, the refusal printer and the exit accumulator:
  - `g12_result_line <row> <result> <evidence> [<departure>]` prints `row="<ID>" result="<r>" evidence="<e>" departure="<d|none>"`.
  - It refuses a row not in `G12_ROWS`, and a result outside `pass` / `fail` / `not run` / `expired` / `source`. Each refusal counts as a fail, as `sp_result_line` does, so a caller's bug never reads as a pass.
  - It cuts the evidence and the departure at the first newline and replaces a `"` with `'`. The full record goes to the evidence directory (Task 6), never only into this line (`harness-runs/lessons.md` → *"A measurement script stores and reports every reading in full"*).
  - Add `g12_refuse` (stderr, prefixed `gate12-sandbox-round: `), `g12_exit_raise <code>`, `g12_exit_final` (folds the counted fails into 4) and `g12_need <fn>...`.
  - Open `core.sh` with `#!/usr/bin/env bash` on the first line, as every `scripts/lib/sandbox-probe/*.sh` does (`.claude/context/conventions.md` → `## Shell assets`), then a header stating that the file is sourced, sets no shell option, and has a Bash 3.2 floor.

**Verification:**

- `bash scripts/gate12-sandbox-round.sh --list` prints one tab-separated line per row, in the order the Work bullet lists them, with nothing else, and `--help` exits 0.
- `bash scripts/gate12-sandbox-round.sh plant` with no `--repo` exits 1 with a usage line. `grade --repo a/b` exits 1 naming `g12_preflight` while Task 2's library is absent.
- `commands.typecheck` (`bash scripts/typecheck.sh`), whose shell-parse step covers both new files.
  - **Deviations from plan:** (1) The entry point also sets `G12_SCRIPT_ROOT` (the top level of the checkout the script sits in, empty outside one), because Task 2's `**Depends on:**` reads *"the script's own root"* from Task 1 and this plan named no global for it. (2) No row note carries an angle bracket as well as the four characters the plan bars: Task 16 restates each note as a Markdown cell, where `<branch>` would be read as an HTML tag. (3) `G12_ROWS_SELECTED` is space-separated in the order given, each row once; `g12_row_arms` prints one arm per line and nothing for `-`; the plan fixed neither shape. (4) A preflight that returns non-zero without raising a code exits 2, so a refusal never exits 0. (5) The throwaway probe `harness-runs/scratch/g12_core_probe.py` (gitignored) could not be removed: `rm` was refused by the permission layer.
