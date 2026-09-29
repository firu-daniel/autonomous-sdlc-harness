### 2. The Node 24 majors all require Actions Runner 2.327.1, and neither the pins header nor the self-hosted setup says so

**Files:**
- `cli/templates/github/workflows/harness-run.yml`, the `# ACTION PINS.` header block — "Each is the lowest major whose own action.yml declares `runs.using: node24`,"
- `cli/templates/github/workflows/harness-resume.yml`, the `# ACTION PINS.` header block — the same sentence
- `docs/remote-execution.md` → `## 8. Choosing a runner` → `### Setting up a self-hosted runner` → **Install the prerequisites beside it**

Task 3 moved every pin to a Node 24 major: `actions/checkout@v5`, `actions/setup-node@v5`, `actions/cache@v5` / `actions/cache/restore@v5` and `actions/upload-artifact@v6`. The maintainer's own record, `harness-runs/task_prompts/fix_remote_pause_state_and_gate12_record_action_runtimes.md`, quotes each major's opening release notes, and every one of them sets a minimum runner version:

- `actions/checkout` v5.0.0: "⚠️ Minimum Compatible Runner Version **v2.327.1**"
- `actions/setup-node` v5.0.0: "Make sure your runner is on version v2.327.1 or later"
- `actions/cache` v5.0.0: "requires a minimum Actions Runner version of `2.327.1`"
- `actions/upload-artifact` v6.0.0: "requires a minimum Actions Runner version of 2.327.1. If you are using self-hosted runners, ensure they are updated before upgrading."

The templates still support a self-hosted runner through `HARNESS_RUNNER`, and `docs/remote-execution.md` §8 lists that runner's prerequisites. Neither place states the new minimum. **Who gets it wrong:** an adopter whose self-hosted runner application is older than 2.327.1, for example one registered with auto-update disabled. They follow §8, re-render the workflows as §7 step 3 says, and every job then fails at its first `actions/` step with no line in the harness's documents explaining why. This branch caused the requirement, so stating it keeps the headers true, which the task prompt asks for, without adding self-hosted support or testing.

**Fix:**

- [ ] In **both** workflow templates, directly after the `# ACTION PINS.` block's existing sentence that ends "…per a maintainer's lookups of each action's action.yml and release notes on 2026-09-29T08:21Z (UTC).", insert this comment text. Re-wrap it to the block's width, keep every line prefixed `# `, and do not start any line with `#   actions/`, so that `cli/test/workflow-templates.test.mjs` → `actionPins` still reads exactly the pin lines:

  ```
  # Each of those majors' release notes requires Actions Runner 2.327.1 or
  # newer; a GitHub-hosted runner already has it, and a self-hosted one must
  # run it (docs/remote-execution.md, section 8).
  ```

  Place it before the "A major tag, not a commit sha:" sentence.

- [ ] In `docs/remote-execution.md` → `### Setting up a self-hosted runner`, in the **Install the prerequisites beside it** paragraph, directly after its first sentence (the one ending "…since the job bootstraps the checkout and runs your verification commands there."), insert:

  ```
  The runner application itself must be version 2.327.1 or newer: every action the two workflows pin (each header's `# ACTION PINS.` block) runs on Node 24 and names that minimum in its release notes, so leave the runner's automatic update on, or update it by hand before re-rendering the workflows.
  ```

This fix edits no test file, so it runs no test. The existing `cli/test/workflow-templates.test.mjs` cases run later, in the gates phase.
