### Task 9 — JS3's fixtures: the stalling prompt, its derived durations and the refusal of a threshold no Bash call can outlast

**Goal:** Hold Task 8's plant with fixtures, so that JS3's planted task prompt always asks for exactly one silent stall longer than the kill threshold, and the leg refuses a threshold no single Bash call can outlast.

**Depends on:** Task 8, which changes `scripts/lib/gate12-sandbox-round/default-branch.sh`.

- **The prompt.** `g12_js3_files <branch> <dir>` writes an empty `manifest` and a `task_prompt.md` stating three steps in order:
  1. Write `<G12_STATE_DIR>/scratch/gate12_js3_stall.mjs` with a fixed Node body. The body exits 0 at once when `<G12_STATE_DIR>/scratch/gate12_js3_stalled` exists. Otherwise it creates that marker, then waits `S` seconds with `setTimeout` and prints nothing.
  2. Run `bash <G12_SCRIPTS_DIR>/scratch-run.sh <G12_STATE_DIR>/scratch/gate12_js3_stall.mjs` once, in the foreground, with the Bash tool's timeout set to `T` ms.
  3. Add the README line.

  `S = G12_STALL_KILL_SECS + 60` and `T = (S + 60) * 1000`.
- **The refusal.** `default-branch` refuses before any change, with exit 2 through `g12_db_refuse`, when `G12_STALL_KILL_SECS > 480`, so that `T` would exceed 600000 ms.

### Targets

- `cli/test/gate12-sandbox-round-default-branch.test.mjs`: new cases, and any existing case asserting the old one-line honest prompt.

**Work:**

- [ ] Existing cases: update any expectation of the old prompt text (*"Add a line to README.md naming the date this repository was last checked."* as the whole prompt) to the new prompt. Change nothing else.
- [ ] Case `JS3: the planted prompt asks for one silent scratch-run stall past STALL_KILL_SECS`. Use the default `120` and a named `--stall-kill-secs 200`, and assert:
  - the `.mjs` path and the exact `bash <scriptsDir>/scratch-run.sh …` command;
  - `S` (180, 260) and `T` (240000, 320000);
  - the marker path;
  - the README step last.
- [ ] Case `JS3: the stall body waits S seconds once and prints nothing`. Extract the body from the written prompt, run it under `node` from a temporary directory with `S` overridden to 1 through the fixture's own substitution, and assert: exit 0, empty stdout, the marker created, and a second run returning at once.
- [ ] Case `JS3: a stall-kill threshold over 480 s is refused before anything changes`. `--stall-kill-secs 481` exits 2 with the refusal naming the value and the 600000 ms ceiling. The suite's `gh` and `git` stubs record no default-branch change, no variable change and no push.

**Verification:**

- `cli/test/gate12-sandbox-round-default-branch.test.mjs` passes.
- The refusal case fails when Task 8's refusal is removed in a scratch copy of `default-branch.sh` the suite sources. Check this once, then restore.
