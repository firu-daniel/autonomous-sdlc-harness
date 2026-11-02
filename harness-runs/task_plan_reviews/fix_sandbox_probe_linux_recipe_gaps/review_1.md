# Task plan review — iteration 1

Both Must Fix findings from iteration 0 are resolved in `task_3_plan.md`:
- its Verification now bans only **new** results;
- all four Work bullets open their cells with "Fixed by `fix_sandbox_probe_linux_recipe_gaps`".

Derivation entries 1 and 2 were re-run verbatim on this branch's base. Every hit falls inside one of rows 1–57. Entry 3's first step printed nothing, and walking the ledger's headings reached no entry. The register is closed.

## Must Fix
1. **Task 2 places the probe run ahead of the recipe's own stop check** — `task_2_plan.md`
   The `**Work:**` bullet *"PD21's placeholder, and the credential (PD22 item 4)"* says to add the placeholder block *"After the "As `probe`, clone the repository" block's last line (`node cli/dist/cli.js doctor`)"*. The PD22 item 2 bullet then adds the run block *"After the placeholder block"*. In `docs/development.md` → *A Linux run, in a local container*, the clone block is followed directly by this paragraph: *"`git status --porcelain` must print nothing; if it prints a path, `init` changed a tracked file and the run stops there."* That paragraph is followed by the **What the recipe places in the container, and how it is removed** bullets. Done as written, the edit produces this order:
   - the clone block;
   - the placeholder block;
   - the run block (`git push --dry-run …`, `bash scripts/sandbox-probe.sh run 2>&1 | tee …`, `echo "exit ${PIPESTATUS[0]}"`);
   - then the check that says the run must stop when `git status --porcelain` prints a path;
   - then the bullet that says when the token is given, which this task rewrites to "the prompt the dry-run push raises".

   A reader following the recipe top to bottom runs the probe before the check that is meant to stop it. Task 2's own last Verification bullet requires that *"no step depends on a later one"*, so the Work bullets as written fail it.
   **Fix:** In `task_2_plan.md`, anchor both new blocks **after** the `git status --porcelain must print nothing …` paragraph and its **What the recipe places in the container, and how it is removed** bullets, and before **What a Linux run expects, and the macOS result it compares against.** Do this in the PD21 bullet and in the PD22 item 2 bullet, quoting the anchor text. Alternatively, move the `git status --porcelain` check so it sits before the placeholder block, and say so. Either way, the stop check must come before the dry-run push and the `run` line.

## Should Fix
1. **Task 2's `PIPESTATUS` grep still misses prose its own Work adds** — `task_2_plan.md`. Raised in iteration 0. It is neither resolved nor recorded under `## Rejected findings`. The Verification bullet says `git grep -n 'PIPESTATUS'` *"reaches only the run block, the refusal block and **Recording a Linux run.**"*. But the PD22 item 3 bullet adds prose by the root block saying *"The recipe's exit-status lines read bash's `PIPESTATUS`"*, and the PD22 item 2 bullet adds prose saying *"the recipe reads `${PIPESTATUS[0]}` on the very next line"*. Either add both prose sites to the list, or word them without the token.
2. **Task 1's `git diff --name-only` check cannot see the new fixture** — `task_1_plan.md`. Raised in iteration 0. It is neither resolved nor recorded. `linux-busy-inter-device.jsonl` is new and untracked, so `git diff --name-only` never lists it. Use the union of `git diff --name-only HEAD` and `git ls-files --others --exclude-standard` (`unit_loop_core.md` → `## The test-run rule` point 7).
3. **Task 2's copy-out step does not cover a run where every leg passes, or the evidence of other `run` invocations** — `task_2_plan.md`. Raised in iteration 0. It is neither resolved nor recorded. **A leg that does not pass leaves its evidence behind.** says *"A passing leg keeps nothing"*, so on an all-pass run there is no `sandbox-probe-evidence.<suffix>` to copy. The prose should say to skip that line when the run log's last stderr line names no directory. The absent-path check's `run --leg headless-parity` invocations are not tee'd to the run log. Say whether any evidence directory they print is copied too.
4. **Scope-register row 11 and Task 2's Work disagree about what the record carries** — the story index (`fix_sandbox_probe_linux_recipe_gaps_story_plan.md`) and `task_2_plan.md`. Row 11's reason reads *"the VM's sysctl reading and the copied-out evidence are recorded"*. Task 2's **Recording a Linux run.** bullet adds only *"the VM's sysctl reading … and whether it was set"*. Make the two say the same thing.

## Nice to Have
1. **Task 3's PD23 bullet describes RG3 as a rename "onto" a present path** — `task_3_plan.md`. §8 RG3 (Linux) records a rename of the directory `<main>/harness-runs/autonomous_logs` aside, not onto a target: *"mv: cannot move '<main>/harness-runs/autonomous_logs' to '<main>/harness-runs/autonomous_logs.aside': Device or resource busy"*. RG2 (Linux) (b) is the rename onto a present path. Word the bullet so each row is cited for what it records.
