### Task 2 — Place `run-test-suite.sh`'s and `scratch-run.sh`'s root through `hr_script_root`, held on a job-layout fixture with a placeholder `<scriptsDir>/.git`

**Goal:** Fix the two scripts in round 14's evidence that a session or the gate worker runs inside a sandbox: the gate worker's `run-test-suite.sh --no-detach`, and an implementer's `scratch-run.sh`. Each must place its root in job mode past the placeholder at `<scriptsDir>/.git`.

**Depends on:** Task 1. It adds `hr_script_root <script_dir>` to `cli/templates/scripts/lib/harness-run-lib.sh`, and this task calls it by that contract:

- It walks from the physical `<script_dir>` upward.
- At each directory holding a regular `harness.config.json`, it runs `git -C <dir> rev-parse --show-toplevel`. The first directory whose answer equals itself is printed, with status 0.
- When none confirms, it returns `hr_repo_root "<script_dir>"`'s answer and status.

Task 1 also adds `cli/test/helpers/runner-git-shim.mjs`, which this task imports:

- `installRunnerGitShim(binDir)` writes a `git` first on `PATH`. It answers `-C <d> rev-parse --show-toplevel` with `fatal: not a regular file` or `fatal: invalid gitfile format: <path>` (exit 128) when the first `.git` above `<d>` is a device or an empty file, and runs the real git otherwise.
- `plantPlaceholder(path, 'empty-file' | 'device')` plants either shape.

This task changes nothing in the library, the helper, or any other script.

### Targets

- `cli/templates/scripts/run-test-suite.sh`: its root placement.
- `cli/templates/scripts/scratch-run.sh`: its root placement.
- `cli/test/job-layout-root.test.mjs` (new): the job-layout cases for both scripts.

**Work:**

- [ ] `run-test-suite.sh`: replace `root="$(hr_repo_root "$script_dir")" || refuse "'$script_dir' is not inside a git repository"` with the same line calling `hr_script_root`. The refusal text stays byte-identical. Add one sentence to the comment above it naming F15, the placeholder, and `hr_script_root`.
- [ ] `scratch-run.sh`: replace `repo_root="$(hr_repo_root "$script_dir")"` with `hr_script_root`, keeping the refusal and exit code 68 as they are. Amend the comment *"The repository is THIS FILE's own checkout"* by one sentence naming the function and why.
- [ ] `job-layout-root.test.mjs`: a header stating the rule. **In a job-layout checkout whose `<scriptsDir>/.git` is a placeholder, the gate worker's `run-test-suite.sh` and an agent's `scratch-run.sh` place the checkout root and run.** The header also names what is substituted, citing `helpers/runner-git-shim.mjs`. The fixture:
  - Built with `cli/test/helpers/fixture.mjs` and adopted through the compiled CLI's `init`.
  - `scriptsDir` `harness-scripts`, `stateDir` its own, `commands.typecheck` `<none>`, and `commands.test` a stub that counts its runs.
  - The shim first on `PATH`.
  - `harness-scripts/.git` planted as an empty file, then as a device, one case each.
- [ ] `job-layout-root.test.mjs`: the cases.
  - **(a)** `bash harness-scripts/run-test-suite.sh --no-detach <label>`, run from the checkout root, answers `pass`, and the stub ran once.
  - **(b)** `bash harness-scripts/scratch-run.sh <stateDir>/scratch/probe.mjs`, on a file printing a fixed line, prints that line and exits 0.
  - **(c)** Run both scripts from a copy of the scripts directory placed outside any repository. Each still refuses with its own unchanged message (`… is not inside a git repository`), proving the no-root refusal survives.

**Verification:**

- `cli/test/job-layout-root.test.mjs` passes. With the two edits reverted, cases (a) and (b) fail under the shim with the round-14 refusal. Check this once during the unit with a throwaway revert, then restore.
- `git diff` of both scripts changes only the placement line and its comment. The refusal strings and exit codes are byte-identical.
  - **Deviations from plan:** `run-test-suite.sh` had no comment directly above the placement line (a blank line separates it from the label checks), so the F15 sentence was added as a new two-line comment immediately above it rather than appended to an existing one.
  - **Revert check, executed:** with both placement lines switched back to `hr_repo_root`, `npm test --workspace cli -- test/job-layout-root.test.mjs` failed (a) and (b) under both shapes with the round-14 refusals (`run-test-suite.sh: '<fixture>/harness-scripts' is not inside a git repository`, exit 2; `scratch-run.sh: '<fixture>/harness-scripts' is not inside a git repository — refusing to run anything`, exit 68) while (c) passed; restored, all 6 cases pass.
