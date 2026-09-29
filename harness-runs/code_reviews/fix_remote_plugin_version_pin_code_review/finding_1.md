### 1. `claude plugin install` runs inside the checkout, where a project-scope marketplace of the same name can win over the pinned clone

**File:** `cli/templates/github/workflows/harness-run.yml` (step `Install the pinned plugin`) — "claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness"

The step adds the tag clone as a **user-scope directory** marketplace from `$RUNNER_TEMP`:

```bash
(cd "$RUNNER_TEMP" && claude plugin marketplace add ./harness-marketplace)
claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness
```

but it then runs `claude plugin install` from the step's default working directory, which is the job's checkout. That checkout's committed `.claude/settings.json` declares `extraKnownMarketplaces["autonomous-sdlc-harness"]` as a **project-scope github** source with the same name. The story index lists this same-name clash as its first top risk. `docs/remote-execution.md` → `## 6. What is not verified here` covers it only at **session start** (the row beginning "At session start the runtime uses the user-scope *directory* marketplace"). Nothing covers it at **install** time. Before this branch the clash could not matter, because both entries named the same github source. Now they name different trees: the tag clone, and the default branch.

If `plugin install` resolves `@autonomous-sdlc-harness` against the project-scope entry, it installs the default branch's plugin. The version check then refuses every job whose pin is behind `main`. That is exactly the case the branch exists to fix, and the acceptance criterion "the job runs rather than refusing" fails. `cli/test/workflow-plugin-pin.test.mjs` cannot catch this, because its stub `claude` ignores the working directory. The install has no reason to run inside the checkout. The `marketplace add` beside it already runs outside the checkout, so running the install there too costs nothing and removes the project-scope entry from its view.

**Fix:**

- [ ] In `cli/templates/github/workflows/harness-run.yml`, step `Install the pinned plugin`, run the install from `$RUNNER_TEMP` as well. Replace the two lines quoted above with:

  ```bash
  (cd "$RUNNER_TEMP" && claude plugin marketplace add ./harness-marketplace && claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness)
  ```

  Leave the `installed=$(claude plugin list --json | …)` line and the check after it unchanged. They already filter on `.scope == "user"`.
- [ ] In the same template's header block `# THE PLUGIN PIN.`, after the sentence ending "adds the clone as a directory source, so what it installs is the tag's plugin whatever the default branch carries.", add one sentence: `Both the add and the install run from $RUNNER_TEMP, outside the checkout, so the committed .claude/settings.json's project-scope entry of the same name is not in view while installing.` Keep the `# ` comment prefix and wrap it like the lines around it.
- [ ] In `cli/test/workflow-plugin-pin.test.mjs`, make the stub record where the install ran. In `STUB_CLAUDE`'s `'plugin install')` branch, add `pwd -P > "$state/install-cwd"` as its first line. In test `(a)`, add:

  ```js
  assert.equal(readFileSync(join(w.state, 'install-cwd'), 'utf8').trim(), w.runnerTemp);
  ```

  This test file is the one the fix edits, so it is the only suite the fix runs. The full suite runs in the Run gates phase.
