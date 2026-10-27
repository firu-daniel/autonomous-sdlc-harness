### Task 8 — Allow P1b's prefixed call and grade a permission-layer refusal of it as not run

**Goal:** Fix P1b (defect 11, PD9). The assignment-prefixed push was refused at the permission layer in don't-ask mode, so it never reached the sandbox or the `excludedCommands` match, yet the row printed `pass`.

- The leg allows the exact prefixed call through `--allowedTools`, so the sandbox half is measured.
- A permission-layer refusal of the call under test grades `not run` with that reason.

The task also confirms that defect 13 (CS4's exit 3) needs no code change.

**Depends on:** Task 1. The wrappers leg's expected text is now *"… the assignment prefix stay sandboxed or are neutralised, the prefix allowed through --allowedTools so a permission-layer refusal of it is not run"*.

**Where this layer stops.** **Task 15** tests `sp__wr_permission_screen` against a recorded permission-refused stream and a sandbox-refused one, by sourcing `core.sh`, `judge.sh`, `controls.sh` and this file. So it reads only its arguments and the stream. **Task 16** amends P1b's call and expected columns and CS4's expected column.

### Targets

- `scripts/lib/sandbox-probe/legs-wrappers.sh`: `sp__wr_session`, `sp__wr_prefix`, the new `sp__wr_permission_screen`, and the header.

**Work:**

- [ ] **`sp__wr_session <name> <prompt file> [sp_session option]...`.** Pass any options after the prompt file through to `sp_session` unchanged. The existing two-argument callers (`sp__wr_cs4`, `sp__wr_own`, `sp__wr_compound`) are unaffected.
- [ ] **P1b's allow rule.**
  - In `sp__wr_prefix`, launch with `sp__wr_session wrappers-prefix "$pfile" --allowed "Bash($p1b)"`.
  - P1b's and CW6's departure, from `sp_departures`, then names it.
  - CW6's call and grading are unchanged.
- [ ] **`sp__wr_permission_screen <stream> <command>`.**
  - It runs `sp_judge_call <stream> ran <command>`.
  - When the call is matched and `SP_LAYER` is `permission`, it sets `SP__WR_V="not run"` and `SP__WR_E="refused at the permission layer, so it never reached the sandbox or the excludedCommands match: $SP_LAYER_EVIDENCE"`, and returns 0.
  - Otherwise, including when the call is absent, it returns 1 and sets nothing.
  - In `sp__wr_prefix`, call it for `$p1b` **before** `sp__wr_push_held`. On status 0, print P1b through `sp_row_result --direct` with `SP__WR_V` / `SP__WR_E`, and skip the marker and push arms.
  - The existing arms are unchanged otherwise: a marker present or a push that landed is `fail`; stayed sandboxed is `pass`.
- [ ] **CS4's exit 3: confirm, do not change.** `sp__wr_cs4` already maps a refresh `Exit code 3` to `refresh exit 3 (…)` and accepts it. Its comment reads *"exit 0, 3 (nothing to do) or 4 with conflicted: paths"*. Leave the code and comment as they are. The defect is in the row's expected column, which Task 16 amends.
- [ ] **The header.** Replace the P1b paragraph:
  - P1b's call is allowed through `--allowedTools` for exactly that command, so it reaches the sandbox.
  - A permission-layer refusal is `not run`, because that layer is not the one the row measures.
  - Name `sp__wr_permission_screen`'s signature.

**Verification:**

- The `wrappers-prefix` launch carries exactly one `--allowed`, `Bash($p1b)`. No other session in the file gained one.
- In `sp__wr_prefix`, the permission screen runs before `sp__wr_push_held`, and P1b is printed exactly once on every path.
- `sp__wr_cs4`'s refresh arm still accepts `Exit code 3` (`grep -n 'refresh exit 3' scripts/lib/sandbox-probe/legs-wrappers.sh`).
