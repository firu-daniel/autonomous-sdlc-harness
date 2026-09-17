### Task 1 — Measure the watcher's first-message spelling and set `ENGINE_COMMAND_*` in the watcher template from the result

**Goal:** Measure whether the prefixed engine-command spelling resolves on the watcher's own first-message path, the way the bare spelling does today. Set the three `ENGINE_COMMAND_*` strings in `cli/templates/scripts/autonomous-watcher.sh` from that result, and record the measurement in the template, where Tasks 9, 11, 12 and 13 read it.

**Where this task stops.** This task owns the **template** alone. The byte-for-byte copy at `scripts/autonomous-watcher.sh` is Task 9's. The docs tables that quote the engine commands (`docs/watcher.md`, `docs/outer-loop-verification.md`) are Task 9's. The measured-fact record in `docs/development.md` §6 is Task 11's. The drift-check exemptions for whatever stays bare are Task 13's. The probe script is a `harness-runs/scratch/` file. It lives for this dispatch only and is deleted once the comment below is written, so nothing downstream reads it.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`: the three `ENGINE_COMMAND_*` assignments, the header comment's three `<file> -> <command>` mapping lines, and a new measurement comment block directly above `ENGINE_COMMAND_TASK=`.

**Work:**

- [ ] **Write the probe** at `harness-runs/scratch/command_spelling_probe.sh`, taking one argument, `bare` or `prefixed`. It builds the task-engine first message **exactly** as the `else` arm of the watcher's launch function builds `launch_prompt`: the assignment that begins `launch_prompt="Run the autonomous engine command ${ENGINE_COMMAND_TASK} on the current branch '${branch}'.` Copy that text verbatim, with these values:
  - `ENGINE_COMMAND_TASK`: `/branch-start-plan-autonomous` for `bare`, `/autonomous-sdlc-harness:branch-start-plan-autonomous` for `prefixed`
  - `branch`: `spelling_probe_no_such_branch`
  - `state_rel`: `harness-runs`
  - `resume_clause` and `pause_resume_clause`: empty
  - `GLOBAL_STOP`: `harness-runs/AUTONOMOUS_STOP`

  From the checkout root, it prints `claude --version` and the first lines of `claude plugin details autonomous-sdlc-harness@autonomous-sdlc-harness`. It then runs `claude -p "$launch_prompt" --permission-mode plan --max-turns 4 --output-format stream-json --verbose` and saves the event stream to a file beside the probe, not through a pipe. It prints four things:
  - the exit code
  - whether the stream's `system`/`init` event lists `autonomous-sdlc-harness:branch-start-plan-autonomous` and/or `branch-start-plan-autonomous` among its slash commands or skills
  - every `tool_use` event named `Skill`, with its full `input`, and whether its `tool_result` has `is_error`
  - any text containing `Unknown`, plus the final `result` event's `subtype`, `is_error` and first line
- [ ] **Run both legs** as two separate calls: `bash scripts/scratch-run.sh harness-runs/scratch/command_spelling_probe.sh bare`, then the same with `prefixed`. A literal command with no pipe or substitution is what the script-allowlist guard permits. If both legs show a `Skill` call refused for permission rather than for its name, re-run both with `--allowedTools Skill` added and keep both attempts. If `claude` is absent or the call is refused, keep the exact refusal message: that is the result.
- [ ] **Decide the route from the evidence, by this table and no other:**
  - **`prefixed`**: the `prefixed` leg emitted a `Skill` `tool_use` whose input names `autonomous-sdlc-harness:branch-start-plan-autonomous`, and its `tool_result` is not an error. The engine command loaded, which is this path's first phase.
  - **`bare`**: every other outcome, including a probe that could not run. The bare spelling is what `fix_line_number_citations_never_block` and `feat_readme_summary_compact_llms_txt` launched with, and both runs completed. So the existing strings stand.

  The docs and user-review engines use the same sentence and the same name-resolution step, so one route applies to all three strings. Say so in the comment.
- [ ] **Apply the route** to `ENGINE_COMMAND_TASK`, `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS`: all prefixed as `/autonomous-sdlc-harness:<name>`, or all left bare. Make the header's three mapping lines (`<branch>_task_prompt.md -> …`, `<branch>_review[_<n>].md -> …`, `<branch>_docs.md -> …`) show the same values.
- [ ] **Write the measurement comment** directly above `ENGINE_COMMAND_TASK=`. Its first line is exactly `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.` Tasks 9, 11 and 13 find it by that text. It states:
  - the Claude Code version and the plugin version shown by `plugin details`
  - the probe's flags, written out as `claude -p "<the task-engine launch_prompt, spelled either way>" --permission-mode plan --max-turns 4 --output-format stream-json --verbose`, run from a checkout that enables the plugin
  - for each spelling: the verbatim `Skill` input or the verbatim error, and the exit code
  - the route taken and the table row that decided it
  - that the observation still owed is an unattended run launched after this change reaching its first phase
  - a pointer to `docs/development.md` → `## 6. The roadmap this tree defers to` for the record

  Quote each spelling literally: Task 13 exempts these quoted lines by their text. Write no machine path: gate 6a greps for `$HOME`. Then delete the probe and its stream file from `harness-runs/scratch/`.

**Verification:**

- `bash scripts/test.sh` exits 0. `cli/test/outer-loop-scripts.test.mjs` compares what `init` writes against this template byte for byte, so it must still pass.
- `grep -n 'ENGINE_COMMAND_' cli/templates/scripts/autonomous-watcher.sh` shows all three assignments in one spelling, and that spelling matches the route the measurement comment names.
- The measurement comment carries a version string and verbatim evidence for **both** legs, or the verbatim refusal that stopped the probe. It does not contain a summary in place of either.
- `ls harness-runs/scratch/` shows no probe file left behind.

**Deviations from plan:**

- The probe was written as `harness-runs/scratch/command_spelling_probe.py`, not `.sh`: `scripts/scratch-run.sh` refuses a `.sh` extension (exit 66, stated in its header). It built the task-engine `launch_prompt` verbatim with the values this plan gives and ran both legs through `bash scripts/scratch-run.sh … bare|prefixed`. Neither leg emitted a `Skill` call, so the `--allowedTools Skill` re-run condition (a `Skill` call refused for permission on both legs) did not arise. Route: `bare`. The strings and header mapping lines were already bare and are unchanged. Only the measurement comment was added.
- `bash scripts/test.sh` exits 1. Gate 4 (`npm test`, which includes the byte-for-byte template test) passes, and so do 12 of 13 gates. The one failure is `6a no machine paths`, whose hits are this worktree's untracked `.git` pointer file and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`. Neither is the edited template. The "exits 0" bullet does not hold, and its evidence is that gate output.
