### Task 3 — Add the walker's gate library `lib/flow-walker-gates.sh`

**Goal:** Put the mechanical answers the walker needs at a gate into one sourced library of pure functions. There are five:

- the next free `review_<n>` index in a findings folder;
- a findings folder's own round count;
- the run mode's skipped ids, read from its durable record;
- whether a `phases.*` flag is on;
- the escalation evidence a story index or UI-test index carries.

Each answer then has one definition, which the walker (**Task 4**) calls and the tests (**Tasks 6, 7**) pin down through it.

**Depends on:** Task 2, which adds `hr_phase_enabled <repo_root> <phase>` to `lib/harness-run-lib.sh`. That function returns 0 (on), 1 (off or unset) or 2 (unresolvable), and prints nothing. `fw_phase_on` below wraps it rather than reading `harness.config.json` a second way.

**Where this task stops.** These functions answer questions and never decide the route. Which node comes next, whether a counter hit its cap and what is printed all belong to **Task 4**. The library writes nothing, not even the walker's state file.

### Targets

- `cli/templates/scripts/lib/flow-walker-gates.sh` (new): a sourced library, mode `0o644` once Task 5 ships it. It opens with the `#!/usr/bin/env bash` shebang and a `# flow-walker-gates.sh — …` header stating what it decides, followed by a `REPRO` block, as `lib/harness-run-lib.sh` does.

**Work:**

- [ ] `fw_next_review_index <folder_abs>` prints one past the highest `<n>` among entries named exactly `review_<n>.md` (with `<n>` decimal digits). It prints `0` when the folder is absent or holds no such file. It never back-fills a gap: a folder holding `review_0.md` and `review_3.md` answers `4`. This is the core's rule, word for word: *"pass one past the highest `review_<n>.md` it holds, so an existing gapped series is never back-filled; a folder holding no `review_*.md` — including one that does not exist yet — starts at 0"*. `fw_round_count <folder_abs>` prints how many entries start with `review_`. It mirrors the core's `ls <findings_folder> | grep -c '^review_'` (not the highest index) and prints `0` for an absent folder. Both list names only and open no file.
- [ ] `fw_run_mode_skipped <repo_root> <state_dir> <branch> <flag_value>` prints the skipped ids as a comma-separated list, or `none`.
  - When `<state_dir>/flow_progress/<branch>_progress.md` exists, the ledger is the record (`plugin/instructions/run_mode_instructions.md` → `## The durable record`, whose **Tie-break** says the recorded block wins). The value is the text after `- skipped: ` on that file's `## Run mode` block line, and `<flag_value>` is ignored.
  - Otherwise `<flag_value>` is the answer. When it is empty, the function returns 1 and prints nothing: the orchestrator failed to pass the prompt's re-read, and there is no default.

  `fw_id_in_list <id> <csv>` answers membership, exiting 0 or 1. `none` is the empty set.
- [ ] `fw_phase_on <repo_root> <phase>` passes `hr_phase_enabled`'s status through unchanged (0, 1 or 2). `lib/harness-run-lib.sh` is sourced by the walker rather than by this file: a sourced library sources nothing.
- [ ] `fw_index_evidence <index_abs>` prints nothing when the file is absent. Otherwise it prints:
  - `evidence: <index_abs> ## Rejected findings` when the file carries that heading;
  - one `evidence.open: <entry line>` for each `- ` line under that heading that does **not** contain `call stands` (the rebutted form `plugin/agents/task-plan-writer.md` → `## Revision mode` defines);
  - `evidence: <index_abs> ## Scope register` when that heading is present.

  This is the mechanical half of the core's *"naming the story index's `## Rejected findings` section and its open entries when the index carries one, and its `## Scope register` rows whose `Disposition` is in dispute"*. Which register rows are *in dispute* is a judgement, and it stays with the orchestrator's prose in **Task 9**.
- [ ] Header and `REPRO`. State that the file is sourced and never executed, sets no shell option (`.claude/context/conventions.md` → `## Shell assets`), stays within bash 3.2 (no `declare -A`, no `mapfile`, no `${x,,}`) and jq 1.5, prefixes every function `fw_`, and returns the same 0/1/2 shape as `lib/harness-run-lib.sh`. Give one `REPRO` line per function, against a throwaway fixture. The index example must include a gapped `review_0.md` + `review_3.md` folder answering `4` with a round count of `2`.

**Verification:**

- Run each `REPRO` line in a throwaway `git init` fixture with a `harness.config.json`. The gapped-folder line prints `4` and `2`. A ledger whose block reads `- skipped: parity, qa` beats a `--skipped none` flag value. An index with one rebutted `… call stands) — …` entry and one open entry prints exactly one `evidence.open:` line.
- `bash -n cli/templates/scripts/lib/flow-walker-gates.sh` exits 0. Grep the file for `declare -A`, `mapfile` and `set -` and find none.

**Deviations from plan:**
- The header's bash-3.2 line says "no associative array, no array-reading builtin" rather than spelling `declare -A` / `mapfile`, and the `set -f` note reads "pathname expansion off": the Work bullet asked for the literals, the Verification grep requires none in the file; the grep wins.
- `fw_run_mode_skipped` returns 2 (prints nothing) when the ledger exists but its `## Run mode` block carries no `- skipped: ` line — the plan named no outcome for a ledger that is the record yet unreadable, and falling back to `<flag_value>` would contradict the Tie-break.
- The findings-folder functions read `ls -1` through a pipeline rather than a glob, so a caller with pathname expansion off gets the same answer.
