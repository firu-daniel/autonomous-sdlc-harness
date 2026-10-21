### Task 2 — `doctor` requires an `Edit` deny rule only and never grades a `Write` rule

**Goal:** `doctor`'s `profile-write-protection` check requires an `Edit` deny rule, and nothing else, for each protected path, beside the `denyWrite` entry it already requires. A profile that still carries `Write` rules from an earlier release is not a failure and gets no finding. The doc comments of the path-expression parser that the sibling-glob coverage check depends on are updated to describe the shapes a profile now carries.

**Depends on:** Task 1. It makes `cli/src/generators/writeProtection.ts` → `fileToolDenyRules(entry)` return `Edit` rules only: `file` → `[Edit(/<p>)]`, `directory` → `[Edit(/<p>/**)]`, `entry` → `[Edit(/<p>), Edit(/<p>/**)]`. This check already reads that function, so the requirement follows. This task changes wording, doc comments and tests, and adds no second rule map.

**Where this task stops.** It does not change the generated profile or `cli/test/doctor.test.mjs`, which **Task 3** owns. The end-to-end proof that a linked worktree's root is still covered once the base drops its sibling-glob wrapper rows is Task 3's: its `doctor.test.mjs` case *"a sibling worktree is covered by the profile's worktree pattern and does not warn"*.

### Targets

- `cli/src/doctor/checks.ts`: `PROFILE_WRITE_PROTECTION_CHECK`, `absolutePathExpressions`, `expressionCoversRoot`.
- `cli/test/doctor-profile-sandbox.test.mjs`.

**Work:**

- [ ] **`PROFILE_WRITE_PROTECTION_CHECK`.** In its doc comment, *"an `Edit` and a `Write` deny rule"* becomes *"an `Edit` deny rule"*. Add one sentence: a `Write` rule is not required and is not reported, because the runtime never consults a `Write(path)` rule (`docs/sandbox-verification.md` → F4), so an earlier release's leftover `Write` rules are neither missing nor stale. In both `pass(...)` sentences, *"an Edit and a Write deny rule"* becomes *"an Edit deny rule"*. Keep the `warn`/`fail` grading, the `--remote-job` upgrade, the retired-path stale finding and the `init --force` remedy exactly as they are.
- [ ] **`absolutePathExpressions` and `expressionCoversRoot` doc comments.** `Write` is no longer one of *"the three shapes … in every generated profile"*. The parser stays generic: it still reads a `Write(//…)` rule an older profile carries, and that costs nothing. The wrapper shape is now an exact absolute path, `Bash(bash <abs>/<scripts>/<x>.sh:*)`. In `expressionCoversRoot`'s second bullet, the *"wrapper-script rule under that same pattern"* is no longer generated. A profile an earlier release wrote may still carry it, and a run copy's root is covered by the `Edit(//<glob>/**)` and `Read(//<glob>/**)` rules the base keeps. Change no code in either function.
- [ ] **`doctor-profile-sandbox.test.mjs`.** Make the rule-pair helper (`dropDenyWrite` and the builder behind its line *"returning the path and the two rules"*) build `Edit` rules only, through `fileToolDenyRules` or spelled as `Edit(/<p>)`. Update the assertions in cases that named a `Write(/…)` rule, including the retired sibling-glob `.git` cases (i) and (k), to the `Edit`-only set. Add a case that appends a `Write(/<p>)` (and `Write(/<p>/**)` for a directory) for every protected path to a fresh profile's `permissions.deny`. `profile-write-protection` must still report `PASS` and must not mention `Write`. Add a case where removing only a path's `Edit` rule warns and names exactly that `Edit` rule.

**Verification:**

- `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` passes, as one plain foreground command from the repository root.
- The new leftover-`Write` case shows the task prompt's requirement as behaviour, not only as wording: a profile still carrying `Write` rules passes.
- Run `grep -n 'Write' cli/src/doctor/checks.ts`. No hit may be a requirement. The only hits allowed are the doc comments saying why `Write` is not graded and the `denyWrite` key names.
