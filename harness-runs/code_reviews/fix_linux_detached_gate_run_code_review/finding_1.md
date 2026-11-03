### 1. Five durable files cite the ruling at a gitignored clarification path that no reader can open

**Severity:** Must Fix

**Sites** (each is the quoted substring `harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`):

- `cli/templates/scripts/launch-sandboxed-gates.sh`, header paragraph `# WHY IT EXISTS.`: "(`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, Q2 route 1)". This template ships to every adopter.
- `scripts/launch-sandboxed-gates.sh`: this checkout's byte-identical copy of that template, with the same paragraph.
- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`, opening header: "(harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md, Proof)".
- `docs/cli.md` → §6, residual 13, the bullet **The fact and the route.**: "The user's ruling (`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, Q2) rejected …".
- `docs/sandbox-verification.md` → §5 row `F10`, its **Fixed by `fix_linux_detached_gate_run` (#232)** clause: "by the user's ruling (`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, Q2), route 1".

**Problem.**

The file these citations name is not in the repository. `git check-ignore -v` answers `.gitignore:66:harness-runs/clarifications/*` for it, and `git ls-files harness-runs/clarifications` lists only `harness-runs/clarifications/README.md`. The answer file exists only on the machine that ran this branch's planning session. Once the watcher archives the pair into `answered/`, it no longer exists at the cited path even there.

So each citation is a pointer whose target does not exist, for every reader:

- a maintainer reading `docs/cli.md` or `docs/sandbox-verification.md` from a clone;
- an adopter reading the shipped `launch-sandboxed-gates.sh`, whose repository's state directory is not even named `harness-runs`.

Five durable artifacts rest their central design decision on this citation: the launcher's reason to exist, the rejected run-copy exclusion, and the probe's claims. A reader who follows the citation to check that decision finds nothing.

The ruling's substance is already recorded in a durable place. F10's row states route 1 and the rejected alternative in full ("The alternative, excluding the run copy's own `run-test-suite.sh`, was rejected by the same ruling: a gate run executes the build, the tests and the package scripts the session wrote, and session-written code never runs unsandboxed through an excluded command."). So every other site can cite F10, and F10 can drop the dead path.

**Fix.**

1. In `cli/templates/scripts/launch-sandboxed-gates.sh`, header paragraph `# WHY IT EXISTS.`, replace
   ```
   # inside the `bwrap` sandbox it builds below
   # (`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, Q2
   # route 1).
   ```
   with
   ```
   # inside the `bwrap` sandbox it builds below (`docs/sandbox-verification.md`
   # §5 F10, the user's ruling: route 1, the run copy's own `run-test-suite.sh`
   # never excluded).
   ```
2. Make the same edit in `scripts/launch-sandboxed-gates.sh`, so that `cmp cli/templates/scripts/launch-sandboxed-gates.sh scripts/launch-sandboxed-gates.sh` still prints nothing.
3. In `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`, opening header, replace `(harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md, Proof)` with `(docs/sandbox-verification.md §5 F10 and §8 GS1–GS4)`.
4. In `docs/cli.md` → §6, residual 13, **The fact and the route.**, replace `The user's ruling (\`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md\`, Q2) rejected` with `The user's ruling, recorded in \`docs/sandbox-verification.md\` §5 F10, rejected`.
5. In `docs/sandbox-verification.md` → §5 row `F10`, replace `by the user's ruling (\`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md\`, Q2), route 1:` with `by the user's ruling on this branch's planning question, route 1:`. The same cell's **`excludedCommands` was widened by one entry** sentence already states the rejected alternative and why.
6. Re-run `git grep -n 'harness-runs/clarifications/fix_linux_detached_gate_run' -- cli docs plugin scripts`. It must print nothing.

Each edit is to a comment or to documentation prose, so no test file changes and no test is run for this fix. `bash scripts/typecheck.sh`'s shell-parse check covers the three shell files. The full suite runs in the Run gates phase.
