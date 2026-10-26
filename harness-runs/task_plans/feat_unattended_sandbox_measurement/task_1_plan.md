### Task 1 — Add the probe's entry point `scripts/sandbox-probe.sh` and its core library: leg table, result line, exit codes

**Goal:** Give the probe the frame every later task fills. This is the entry point a person runs from a terminal. The entry point owns argument dispatch, usage and the exit codes, and sources each library file under `scripts/lib/sandbox-probe/` in a fixed order. `core.sh` owns three things:
- the leg table, the single declaration of leg → rows → expected → recorded-in;
- the result line;
- the `not run — leg not implemented` fallback.

**Where this task stops.** This task owns only `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/core.sh`. Each other library file is owned by its own task:
- `preflight.sh` — Task 2;
- `judge.sh` — Task 3;
- `session.sh` — Task 4;
- `controls.sh` — Task 19 (the positive controls and the `not run` gate);
- the `legs-*.sh` files — Tasks 5–12 (`legs-planted.sh` Task 8, `legs-planted-files.sh` Task 9);
- the parity script `sp_print_parity_script` — Task 12.

The entry point sources each listed file **only when it exists**, so this task ships before them. It calls a library function only after `declare -F` confirms it is defined.

### Targets

- `scripts/sandbox-probe.sh` (new) — the entry point.
- `scripts/lib/sandbox-probe/core.sh` (new) — the leg table, the result line, the shared refusal printer.

**Work:**

- [ ] **`scripts/sandbox-probe.sh` header**, in the form of `scripts/probe-plugin-cli.sh`'s and the `# <basename> — …` rule `.claude/context/conventions.md` → `## Shell assets` states. It says:
  - what the probe is, and that it is hand-written for this repository like `probe-plugin-cli.sh`, not in the set `init --force` regenerates, and not a `cli/templates/` file;
  - that it changes nothing outside its own temp area, the probe clone and the probe branch;
  - that it is macOS-only on this branch, with the Linux legs sandbox3b's;
  - **why a person starts it from a terminal:** auto mode refuses a `claude -p` launch carrying `--allowedTools`. `! bash <main>/scripts/sandbox-probe.sh run` from a session works.
  - Shebang `#!/usr/bin/env bash`, `set -u`, no `-e`. The header records the standalone-script choice, since `.claude/context/conventions.md` → `## Not determined` leaves it open.
- [ ] **Usage and dispatch.** `sandbox-probe.sh [--help] | --list | preflight | run [--leg <name>]... | judge <kind> <args> | print-parity-script`. Resolve the probe's own checkout from `${BASH_SOURCE[0]}` exactly as `scripts/run-gates.sh` does (`script_dir`, then `git -C "$script_dir" rev-parse --show-toplevel`). Source the library files in this order, each only if present: `core.sh`, `preflight.sh`, `judge.sh`, `session.sh`, `controls.sh`, `legs-local.sh`, `legs-wrappers.sh`, `legs-refresh.sh`, `legs-planted.sh`, `legs-planted-files.sh`, `legs-protection.sh`, `legs-network.sh`, `legs-settings.sh`.
  - `--list` and `--help` touch nothing.
  - `preflight` calls `sp_preflight` (Task 2).
  - `run` calls `sp_preflight`, then `sp_setup` (Task 4), then each selected leg's `sp_leg_<name>` in table order, with each `-` in the leg name read as `_` (`wrappers-refresh` → `sp_leg_wrappers_refresh`, `planted-config` → `sp_leg_planted_config`), then `sp_teardown` (Task 4).
  - `judge` calls `sp_judge_cli` (Task 3).
  - Any of these functions that is undefined is a usage refusal naming it: exit 1.
- [ ] **Exit codes**, stated in the header and used by every task:
  - `0` — every leg printed `pass` or `not run`;
  - `1` — usage, or a library function not yet present;
  - `2` — a preflight refusal, nothing created;
  - `3` — a protected main-checkout file changed (the `shasum` guard, Task 2);
  - `4` — at least one leg printed `fail`;
  - `5` — teardown could not remove something, named on stderr.
  - When several apply, the highest wins.
- [ ] **`core.sh` → its header, and `SP_LEGS`, the leg table.**
  - **Every library file's opening, stated here once.** Each file under `scripts/lib/sandbox-probe/` — `core.sh` here, and every file Tasks 2–12 and 19 add — opens with `#!/usr/bin/env bash` and a `# <basename> — …` header, and **sets no shell option** (no `set`, no `shopt`): the entry point owns `set -u`. This is `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*, together with its shebang rule.
  - **The leg table.** One line per leg, tab-separated: `<leg>\t<rows, comma-joined>\t<expected, one sentence>\t<recorded in>`. Use these legs, in this order:
  - `gates` — T2, W7
  - `mktemp` — TD2
  - `scratch` — SR1, SR2
  - `retrieval` — MC1
  - `wrappers` — CS4, P3, CW2, P1c, CW5, P1b, CW6
  - `wrappers-refresh` — R0, R1, R2, R3, R4 (CS4 is the `wrappers` leg's alone: its commit, push and refresh are one session, Task 6)
  - `planted-config` — C1, CW3, C2, K2, CW4, CS15
  - `planted-files` — CS12, CS13, CS14, L1, L2
  - `write-protection` — CS1, CS2, CS7, W6, W8
  - `git` — CS3, CL5
  - `network` — N1, N2, N3, N4, N5
  - `retry` — RT1
  - `repo-settings` — RS1
  - `credentials` — S1, S2, S4, S5
  - `invalid-profile` — CS8
  - `headless-parity` — HP1

  "Recorded in" names the `docs/sandbox-verification.md` section of the row. `--list` prints the table. `run` with no `--leg` runs every leg except `headless-parity`, which is a printed script (Task 12). L1's expected sentence is `not run — unreachable on the clone layout` (Task 9 states why). `repo-settings` stays after `network`, `retry` and `write-protection`, because it re-issues their calls.
- [ ] **`core.sh` → `sp_result_line <leg> <row> <verdict> <evidence> <departure>`.** It prints exactly
  `leg="<leg>" row="<row>" result="<pass|fail|not run>" evidence="<evidence>" departure="<departure or none>" claude="<SP_VERSION or unknown>"`.
  - The evidence is reduced to its first line, with each `"` replaced by `'`.
  - It counts `fail`s for exit 4.
  - `sp_leg_missing <leg>` prints a `not run` line with evidence `leg not implemented` for each of that leg's rows.
  - `run` calls it for any leg whose `sp_leg_<name>` is undefined.

**Verification:**

- `bash scripts/sandbox-probe.sh --list` prints one line per leg above, in that order, each carrying the rows listed. Compare it with the story index's new-row-id table.
- `grep -nE '^[[:space:]]*(set|shopt)[[:space:]]' scripts/lib/sandbox-probe/core.sh` finds no match, and the file's first line is `#!/usr/bin/env bash`.
- `bash scripts/sandbox-probe.sh --help` prints the usage and the `! bash` sentence, and exits 0.
- `bash scripts/sandbox-probe.sh run` from this run copy exits 1, naming `sp_preflight` as not present. Nothing is created, and `git status --porcelain` shows only this task's two new files.

**Deviations from plan:**

- **Interfaces this task added that the plan leaves to the implementer**, each in `core.sh`, for Tasks 2–4 to call: `sp_exit_raise <code>` (keeps the highest code; the route by which Task 2's "sets exit 3" and Task 4's exit 5 reach the final status), `sp_exit_final` (folds the counted `fail`s in as 4), `sp_refuse <message>` (the shared refusal printer: `sandbox-probe: <message>` on stderr), `sp_leg_rows <leg>`, `sp_leg_names` and `sp_legs_print`. The probe's own checkout is `SP_ROOT`, not `SP_MAIN`, because Task 2 sets `SP_MAIN` from its own check 1.
- **`run` checks `sp_preflight`, `sp_setup` and `sp_teardown` all up front**, naming each missing one, so a partly shipped library never starts a run it cannot tear down. A non-zero `sp_preflight` or `sp_setup` raises exit 2 (a refusal); after a failed `sp_setup` the legs are skipped and `sp_teardown` still runs.
- **`preflight` calls `sp_snapshot_check` after a passing `sp_preflight`, when it is defined**, since Task 2 says "`preflight` alone ends with it" and Task 2 owns no edit to the entry point.
- **`run --leg headless-parity`, named explicitly, is run**; only the no-`--leg` run leaves it out. An unknown `--leg` name is a usage refusal, exit 1. With no argument the probe prints the usage and exits 0, reading `[--help]` as optional.
- **The departure field gets the evidence's treatment too** (first line, `"` → `'`), so a caller's departure text cannot break the double-quoted line format. A verdict other than `pass` / `fail` / `not run` is refused on stderr and counted as a `fail`.
- **"Recorded in" names the section of each row**: where a leg's rows sit in two sections, the field lists both with the rows in each (`§2 The clone layout (owed) (CS4); §3 The wrappers (…)`). Section placement of the new rows follows Task 16's plan (`task_16_plan.md` → *The new rows*); SR2's expected sentence follows Task 16's definition (a write outside the allowed roots refused), not this file's "mutation check" wording in the story index.
- **Bash 3.2 (macOS `/bin/bash`) is the floor**: `${x//\"/\'}` keeps the backslash under 3.2.57, so the quote replacement goes through a variable. Measured with `bash scripts/scratch-run.sh harness-runs/scratch/sp_core_probe.py` under `/bin/bash` 3.2.57: before the fix `evidence="a \'q\' line"`, after it `evidence="a 'q' line"`.
- **Verification evidence.** `--list` printed 16 lines in table order, every new row id of the story index's table present in exactly one leg. `--help` exited 0 with the `! bash` sentence. `run` exited 1 naming `sp_preflight`, `sp_setup` and `sp_teardown`; `git status --porcelain --untracked-files=all` showed only the two new files. The `grep` for `set`/`shopt` in `core.sh` found nothing. A stub-library probe (`harness-runs/scratch/sp_run_probe.py`, in a throwaway git repository under the temp directory) showed: legs run in table order whatever the `--leg` order, an undefined leg prints one `not run` / `leg not implemented` line per row, a `fail` exits 4, a failed `sp_preflight` exits 2 before `sp_setup`, a teardown raising 5 exits 5 over a `fail`, and a full `run` prints 48 lines with no `headless-parity` line.
