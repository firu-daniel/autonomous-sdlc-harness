### Task 13 — Add `scripts/check-command-spelling.sh` as gate 6d, sweep `run-gates.sh`, and prove the gate fails on a planted bare spelling

**Goal:** Add a check in this repository's gate runner that fails whenever a bare `/branch-…`, `/branch-*` or `/harness-analyze` spelling appears outside the carve-outs. It must pass on the tree Tasks 1–12 swept, and it must be shown to fail when a bare spelling is planted.

**Depends on:** Tasks 1–12. The tree must already be swept for this gate to pass on landing.
- **Task 11** wrote the contract this script implements, in `docs/development.md` → `## 5. Verifying a change` → gate 6, in the paragraph opening *"A fourth command checks that every slash spelling of a plugin command carries the plugin prefix"*. The contract is restated here so this file stands alone:
  - **Invocation:** `bash scripts/check-command-spelling.sh`. It takes no argument; any argument prints a usage line and exits 2. It resolves the repository root from `${BASH_SOURCE[0]}` through `git -C <dir> rev-parse --show-toplevel`, the same way `scripts/check-llms-txt.sh` does.
  - **Scan set:** `git grep --untracked -nE <pattern>`, which covers tracked plus untracked-unignored files. It excludes the pathspecs `.claude/`, `examples/notes-app/.claude/`, `examples/notes-app/sdlc-harness/`, `harness-runs/` and `scripts/check-command-spelling.sh`.
  - **Pattern:** `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. A path citation like `commands/branch-start-plan.md` or `agents/branch-reviewer.md` does not match, and neither does the qualified `/autonomous-sdlc-harness:<name>`. A spelling followed by a `.md` suffix (`/branch-start-plan.md`) still does not match: a period may end a match only when a non-name character or the end of the line follows it. A sentence-final bare spelling such as `Then run /branch-status.` does match.
  - **Exemptions:** an in-script table of `<path>|<kind>|<text>` entries, where `<kind>` is `line` or `contains`.
    - A `line` entry covers a line of `<path>` whose entire content, with trailing whitespace stripped, equals `<text>`. A `contains` entry covers a line of `<path>` that contains `<text>` as an exact substring. A matching line is exempt when an entry covers it.
    - **Every entry must cover exactly one line of its file**, counted over every line of that file, not only the lines the pattern matches. An entry that covers no line is a finding with reason `stale exemption`. An entry that covers more than one line is a finding with reason `ambiguous exemption`. A `stale exemption` is reported as `check-command-spelling: <path>:0 — stale exemption: <text>`. An `ambiguous exemption` is reported once for each line the entry covers, as `check-command-spelling: <path>:<line> — ambiguous exemption: <text>`. So an entry cannot excuse a line added after it was written: the added line makes the entry cover two.
    - A bare spelling added **inside** a line an entry already covers is not caught. The contract states this, and so does the header.
  - **Output:** every finding goes to stderr as `check-command-spelling: <path>:<line> — <reason>`. All findings are reported, not just the first. The script exits 0 when there are none and 1 otherwise.
- **Task 1** decided the watcher route. It is readable in `cli/templates/scripts/autonomous-watcher.sh`, from the three `ENGINE_COMMAND_*` assignments and the comment block whose first line is `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`

**Where this task stops.** This task edits no swept file to make the check pass. A finding that is neither a carve-out nor a quoted measurement is a site an earlier task missed. Return `blocker:` naming each such path and line instead of exempting it. The plants in `docs/cli.md` and `docs/development.md` are mutation checks: revert each before this task's own verification runs, and never stage either file.

### Targets

- `scripts/check-command-spelling.sh` (new)
- `scripts/run-gates.sh`

**Work:**

- [ ] **Write the script** to the contract above. Open with `#!/usr/bin/env bash` and `set -uo pipefail`, then a header in `scripts/check-llms-txt.sh`'s shape: a `check-command-spelling.sh — …` first line, `THE CONTRACT.` restated, and a line saying `docs/development.md` §5 gate 6 states it in prose. Put no machine path anywhere, because gate 6a greps for `$HOME`.
- [ ] **Fill the exemption table from what the tree actually holds.** Run the script with an empty table. Classify every finding it prints into exactly one class and add one entry per line. **How to pick an entry:** use a `line` entry whenever the line is short enough to state whole. Otherwise use a `contains` entry whose text occurs on that line and on **no other line of the same file**. Check it with `grep -cF '<text>' <path>`, which must print `1`. Never use the bare command spelling alone, or a flag such as `--dry-run`, as `contains` text. Prefer text that is distinctive of the record, such as the paragraph's opening words or the capture-table row's first cell.
  - **(a) The gate-8 block:** two `line` entries, `docs/development.md|line|/harness-analyze --dry-run` and `docs/development.md|line|/harness-analyze`. A `contains` entry is not allowed for these.
  - **(b) A bare spelling quoted as a measured subject:**
    - the closed §6 paragraph in `docs/development.md`
    - the measurement comment block in `cli/templates/scripts/autonomous-watcher.sh` and its mirror `scripts/autonomous-watcher.sh`
    - the `Headless first-message leg, re-measured:` paragraph in `cli/src/commands/init.ts`
    - the `### 2.2 The launch prompt` capture-table rows in `docs/outer-loop-verification.md`
  - **(c) Only when the route is `bare`:** the three `ENGINE_COMMAND_*=` assignments and the three `<file> -> /branch-…` header mapping lines, in both watcher copies, and the drop-to-engine table rows in `docs/watcher.md`.

  Put a one-line comment above each group of entries naming its class. Anything that fits none of them goes into the blocker described above. The gate-6d contract paragraph in `docs/development.md` is in none of these classes on purpose: Task 11 describes the period rule in words and writes no bare example there, so a finding on that paragraph is a Task 11 miss and goes into the blocker, never into the table.
- [ ] **Wire and sweep `run-gates.sh`.** Add `gate "6d plugin command spellings carry the prefix" bash scripts/check-command-spelling.sh` directly after the `6c` line under `== gate 6 — self-containment`. Qualify the echo line `8  /harness-analyze, which is judgement and runs inside a model session` to `/autonomous-sdlc-harness:harness-analyze`.
- [ ] **Prove it fails, then revert.** Append a line holding `` Run `/harness-analyze` here. `` to `docs/cli.md`. Run `bash scripts/check-command-spelling.sh`, and keep its exit code and the exact finding line it prints for `docs/cli.md`. Remove the planted line so `git diff -- docs/cli.md` is empty, then run the script again and confirm it exits 0. Then do the same in the exemption table's own home file: append `` Run `/harness-analyze` here. `` to `docs/development.md`, **outside** the gate-8 block. Confirm the script exits 1 with a `docs/development.md` finding, and revert so `git diff -- docs/development.md` is empty. Then plant the unquoted, sentence-final line `Then run /branch-status.` at the end of `docs/cli.md`. Confirm the script exits 1 with a `docs/cli.md` finding, and revert so `git diff -- docs/cli.md` is empty. Record every run in the header's `REPRO` block: each planted line and its file, the command, the exit code, and the verbatim finding line. Add one sentence saying the `<path>:<line>` coordinates are the output of that one run and are not anchors into the current file.

**Verification:**

- `bash scripts/check-command-spelling.sh` exits 0 on the swept tree.
- The header's `REPRO` block holds the planted run's non-zero exit code and its verbatim `check-command-spelling: docs/cli.md:<line> — …` finding. `git diff -- docs/cli.md` is empty.
- `bash scripts/check-command-spelling.sh extra` exits 2.
- `bash scripts/test.sh` exits 0, and the gate run lists `ok    6d plugin command spellings carry the prefix` with no failure line it did not list before this branch.
- Stale-exemption half: add a temporary exemption entry naming a substring no line holds, run the script, and confirm it exits 1 with a `stale exemption` finding. Then remove the entry.
- Exemption-scope half: the `REPRO` block holds the `docs/development.md` plant, placed outside the gate-8 block, with exit code 1 and its verbatim `check-command-spelling: docs/development.md:<line> — …` finding. `git diff -- docs/development.md` is empty.
- Sentence-final half: the `REPRO` block holds the `Then run /branch-status.` plant in `docs/cli.md`, with exit code 1 and its verbatim `check-command-spelling: docs/cli.md:<line> — …` finding. `git diff -- docs/cli.md` is empty.
- Ambiguous-exemption half: temporarily append a second line whose whole content is `/harness-analyze` to `docs/development.md`. Confirm the script exits 1 and reports an `ambiguous exemption` for the gate-8 `line` entry. Revert.
- Every `contains` entry in the table passes `grep -cF '<text>' <path>` with output `1`.

**Deviations from plan:**
- The scan runs `git --no-pager grep --untracked --no-color -I -nE`: `--no-color` keeps a `color.grep` setting from corrupting the `<path>:<line>:` parse, and `-I` skips binary files, whose `Binary file … matches` line carries no line number to report. The scan set and pattern are the contract's.
- A match on a line an `ambiguous exemption` entry covers is also reported as a bare spelling, because an entry covering more than one line exempts none of them.
- `bash scripts/test.sh` exits 1 on `6a no machine paths` alone, whose hits are the worktree's `.git` pointer file and gitignored files under `harness-runs/` (an earlier dispatch's `harness-runs/scratch/t3npm.log`, and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, which records the same `.git` hit on a prior branch). Every other gate, 6d included, reports `ok`.
