### 2. `scripts/run-gates.sh` does not name Gate 4's new hand-run jq 1.6 leg, so a green run reads as Gate 4 done

**File:** `scripts/run-gates.sh` (the `== gates this script cannot run` block and the `hand_run=` closing-line assignment) — "echo \"== gates this script cannot run\""; `docs/development.md` → `## 5. Verifying a change`, the **Nine of the sixteen run unattended** paragraph — "and prints the remaining seven, gates 5, 7, 8, 9, 10, 12 and 15, rather than passing over them"

`docs/development.md` → Gate 4 → **The suite under jq 1.6, by hand.** now calls that run *"a hand-run leg of Gate 4 rather than a seventeenth gate"*. `scripts/run-gates.sh` runs Gate 4 and grades it as a pass, but neither its `== gates this script cannot run` block nor its closing `run-gates:` line mentions that leg. `.claude/context/conventions.md` → `## The testing bar` tells every implementer and reviewer to rely on exactly those two outputs: *"The `== gates this script cannot run` block it prints on every run, and the closing `run-gates:` line of a run that exits zero, name each gate and leg it did not run; read those, not the exit status."*

So on any later branch that edits a `.jq` program, or a jq program embedded in a shell asset (the trust-file guard, the watcher's profile render, the run library's trust-check helpers), the Run gates phase reads Gate 4 as fully covered. Nothing in its output says a jq 1.6 run is owed. This branch's own merge does not depend on the script, because the story's `Manual setup required` item 1 owns it; later branches have nothing else that tells them.

**Fix:** name the leg in all three places, in the shape the existing entries already use.

1. In `scripts/run-gates.sh`, in the `== gates this script cannot run` block, insert this line directly after `echo "== gates this script cannot run"` and before the `  5  doctor's exit contract …` line:

   ```bash
   echo "  4  its jq 1.6 leg, the suite under Debian 12's jq 1.6 in gate 15's container, which needs a network and a person"
   ```

2. In the same file, change the closing-line assignment from:

   ```bash
   hand_run="gates 5, 7, 8, 9, 10, 12 and 15 remain hand-run"
   ```

   to:

   ```bash
   hand_run="gates 5, 7, 8, 9, 10, 12 and 15 remain hand-run, with gate 4's jq 1.6 leg"
   ```

3. In `docs/development.md` → `## 5. Verifying a change`, in the paragraph beginning **Nine of the sixteen run unattended, and `scripts/run-gates.sh` is how.**, replace:

   > and prints the remaining seven, gates 5, 7, 8, 9, 10, 12 and 15, rather than passing over them.

   with:

   > and prints the remaining seven, gates 5, 7, 8, 9, 10, 12 and 15, and gate 4's hand-run jq 1.6 leg, rather than passing over them.

The script is hand-written and outside the set `init --force` regenerates (the same paragraph says so), so editing it here is not overwritten. Both new lines are plain `echo` and string assignment, so they stay inside the Bash 3.2 floor. Verify with `bash scripts/typecheck.sh`, which runs `scripts/check-shell-parse.sh` over the edited script. No test file is edited, so no single-file test run is owed.
