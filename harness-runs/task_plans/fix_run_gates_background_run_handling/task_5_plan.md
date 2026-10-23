### Task 5 — Rewrite the `pending` bullet of the three supervised flows that run the gates

**Goal:** The three supervised flows that run the gates before writing statistics share one bullet that starts *"If the tool layer moves the run to the background, or the command prints `pending`"*. Bring it in line with the detached run form. The command prints `pending` at once as a matter of course, the session re-issues `--wait` until a verdict, and a run in flight is never stopped or re-launched. The bullet stays byte-identical across the three files.

**Depends on:** Task 1. The run form `bash <scripts_dir>/run-test-suite.sh <label>` starts both gates detached from the calling session and prints `pending` (exit 3). When a run of the label is already in flight, it starts nothing and answers as `--wait` would. `--wait <label>` prints `pending` while the run is live, `pass` / `fail <log>` once it has finished, and refuses with nothing on stdout when no run is in flight. Task 4 rewrites `### G.1 Run the gates`, keeping that heading text, which these bullets cite as the mechanism. This task edits neither the script nor the plan core.

### Targets

- `plugin/instructions/code_review_instructions.md`: step 6's sub-step 1, the last bullet.
- `plugin/instructions/code_review_fixes_instructions.md`: `## Phase 3`, step 1's last bullet.
- `plugin/instructions/user_review_fixes_instructions.md`: `## Phase 3`, step 1's last bullet.

**Work:**

- [ ] Replace the bullet in all three files with one wording, carried byte-for-byte into each. In these terms:

  > The command starts both gates detached from this session and prints `pending` at once. After each `pending`, re-issue the same command with `--wait` before the label, as a plain foreground command, until it prints the verdict line — the mechanism of `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`. Never stop or re-launch a run in flight. No `Monitor` and no `sleep`. A `--wait` refusal is the no-line case.

  Keep each file's surrounding bullets (`pass` →, `fail <log>` →, no stdout line →) and their order as they are. The list item's indentation differs between `code_review_instructions.md` (six spaces) and the two fix flows (three spaces): keep each file's own indentation and change only the bullet's text.
- [ ] Name no duration, no Claude Code time limit and no `timeout` value in any of the three bullets.

**Verification:**

- `grep -c 'moves the run to the background' plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md` prints `0` for each file.
- `grep -h 'starts both gates detached from this session' plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md`, with leading whitespace stripped, prints three identical lines.
- The cited heading `### G.1 Run the gates` still exists in `plugin/instructions/plan_orchestration_instructions_core.md`.
