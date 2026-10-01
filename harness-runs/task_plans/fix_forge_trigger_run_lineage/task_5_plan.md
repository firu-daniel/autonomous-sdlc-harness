### Task 5 — Carry the trigger confirmation on every `remote-github` outcome, and point `forge` at it under `--check-github`

**Goal:** Under `doctor --check-github`, the `remote-github` check must report whether GitHub knows `harness-trigger.yml` and whether the trigger label exists, whatever else it graded. Today the confirmation is appended only to the `pass(...)` message, so any unrelated warning hides it; Gate 12 round 5's warning was `HARNESS_PUSH_URL is not a repository secret`. Separately, the `forge` line must stop telling a user who has just run `--check-github` to run it.

**Where this task stops.** It changes `cli/src/doctor/checks.ts` and its suite only. `docs/cli.md`'s description of the outcome is Task 10's, and Gate 12's setup pass condition is Task 12's.

### Targets

- `cli/src/doctor/checks.ts`: `REMOTE_GITHUB_CHECK` (its doc comment and its three return statements) and `FORGE_CHECK` (its doc comment and its final `pass(...)`).
- `cli/test/doctor.test.mjs`: the `the remote-github check asks GitHub only under --check-github …` test's subtests, and the `forge` subtest that `points at --check-github`.

**Work:**

- [ ] **`REMOTE_GITHUB_CHECK`**: append the trigger confirmation (`; GitHub knows harness-trigger.yml and the label \`<label>\` exists`) to the `fail(...)` and `warn(...)` messages as well as `pass(...)`, in the same position before `${noted}`. When either trigger answer was not positive, the existing trigger warning is already among `warnings` and so already printed. Rename the local `triggerKnown` only if a clearer name is needed; it is not exported. State in the doc comment's grading list that the trigger answers appear on every outcome.
- [ ] **`FORGE_CHECK`**: its `github` pass names `` `doctor --check-github` asks GitHub ``. When `ctx.probeGithub` is true, say instead that `remote-github` reports what GitHub says. `CHECKS` already orders `remote-github` before `forge`. Keep the existing text when the flag is absent. Note the branch in the doc comment.
- [ ] **`cli/test/doctor.test.mjs`**:
  - Subtest: `--check-github` with the trigger on and `HARNESS_PUSH_URL` missing from the secret list. Expected: `remote-github` is `warn` and its line contains both `HARNESS_PUSH_URL is not a repository secret` and `GitHub knows harness-trigger.yml and the label \`harness\` exists`.
  - Subtest: a failing grade (neither credential secret). Expected: the `fail` line still carries the confirmation.
  - Subtest: under `--check-github`, the `forge` pass line names `remote-github` and does not contain `doctor --check-github` asks GitHub. Without the flag, the existing subtest still sees `doctor --check-github`.

**Verification:**

- `npm test -- test/doctor.test.mjs` from `cli/` passes: the new subtests, the existing `the label exists` pass subtest, and the existing `unknown harness-trigger.yml warns` subtest.
- The type check passes. The edit adds no `console` call and no `gh` invocation, and every message still goes through the check's `pass` / `warn` / `fail` (`.claude/context/conventions.md` → `## Output, logging and errors`).
