### 2. FR2 looks for the `::warning::` spelling, but a step log shows a warning as `##[warning]`, so FR2 misreports the install step's outcome

**File:** `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`g12_fr2`): "grep -F -e 'The sandbox prerequisites are present.' -e '::warning::' | grep -v -F 'echo \""

`Install the sandbox prerequisites` (`cli/templates/github/workflows/harness-run.yml`) reports every outcome other than "present" as `echo "::warning::…"`: not a Linux runner, no root and no sudo, apt-get, dnf or neither could not install, could not write the profile, or could not reload apparmor. The runner treats `::warning::<text>` as a workflow command. In the step log that `gh run view --log` returns, the output line reads `##[warning]<text>`. The literal `::warning::` survives only on the echoed `run:` block's own lines, which carry `echo "` and are dropped by the `grep -v -F 'echo "'` that follows.

The same file family already accounts for this rewrite on the error side. `g12_js1_arm` in `grade-plant.sh` greps `-e '::error::' -e '##[error]'` for exactly this reason.

So on a real run where the step installed nothing, or failed to install something, FR2 finds no line. It then prints `… Install the sandbox prerequisites logged no outcome line` and records the whole log under the heading *"logged neither its present line nor a ::warning:: line"*. The row's **Expected** says *"what it installs is recorded"*. The operator who fills FR2's cell from this line is told that the step said nothing, when it actually named what it could not install. The verdict stays `pass`, because FR2 grades on `Preflight with doctor`, so this misreports the evidence rather than flipping the grade.

The suite does not catch it. `fullRun` in `cli/test/gate12-sandbox-round-full-run.test.mjs` only ever puts `PRESENT_LINE` in the install step.

**Fix:**

1. In `g12_fr2`, match both spellings and drop the echo as before:

   ```bash
   lines="$(printf '%s\n' "$inst" |
     grep -F -e 'The sandbox prerequisites are present.' -e '::warning::' -e '##[warning]' | grep -v -F 'echo "')"
   ```

   Change the fallback record heading from `logged neither its present line nor a ::warning:: line` to `logged neither its present line nor a warning line`. Change the comment above `g12_fr2` from *"or each of its ::warning:: lines"* to *"or each of its warning lines (`##[warning]…` in the step log, as the runner renders `::warning::`)"*.

2. In `cli/test/gate12-sandbox-round-full-run.test.mjs`, add an `install` option to `fullRun`, defaulting to `[PRESENT_LINE]`. Use it in place of the parked job's fixed `[STEP.install, PRESENT_LINE]` entry, as `...install.map((text) => [STEP.install, text])`. Then add a case that stages `fullRun({ install: ['##[warning]apt-get could not install bubblewrap.'] })`, grades it, and asserts three things:
   - FR2 is `pass`;
   - its evidence contains `1 Install the sandbox prerequisites line(s)`;
   - the FR2 evidence file (`evidencePath(fixture, 'FR2')`) contains `##[warning]apt-get could not install bubblewrap.`.

   Take the warning's text from the shipped step the way `PRESENT_LINE` is taken: extract `apt-get could not install` from `installBlock`, with `extract`.

This fix edits `cli/test/gate12-sandbox-round-full-run.test.mjs`, so that is the test file the fix runs.

- **Deviations from plan:** The `cli` dispatch implemented Fix step 2 only (`cli/test/gate12-sandbox-round-full-run.test.mjs`): `fullRun`'s `install` option, defaulting to `[PRESENT_LINE]`, now builds the parked job's install entries, and a new case, `FR2: an install step that logged a ##[warning] line is pass, that line recorded`, covers the warning form. The warning text is `APT_COULD_NOT`, extracted from `installBlock`. Fix step 1 (`scripts/lib/gate12-sandbox-round/grade-full-run.sh` → `g12_fr2`) is outside `cli/`; the index tags this unit `_(layer: cli, general)_`, so the `general` dispatch owns it. Evidence: `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs` ran with `# tests 14`, `# pass 13`, `# fail 1`. The one failure is the new case, with evidence `Install the sandbox prerequisites logged no outcome line`. That is the pre-fix behaviour this finding describes. The case passes only once the `general` half lands, and the Run gates phase's `commands.test` run verifies that.
