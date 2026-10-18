### Task 2 — Have `doctor`'s `profile-sandbox` expect the new form and report the old one as stale

**Goal:** `doctor`'s `profile-sandbox` check grades `sandbox.excludedCommands` against the corrected form. A profile still carrying the `Bash(…)` spelling an earlier release generated gets a finding of its own, saying that the entry matches no command and that the wrapper runs sandboxed. Today that profile gets the wrong message: *"which the configuration does not name: it runs with full access and reaches any host"*. The new finding takes the check's existing grading: `warn` without `--remote-job`, `fail` with it. It also names the existing remedy, `init --force`, so an adopter's profile is regenerated.

**Depends on:** Task 1, which produces these two `ExpectedSandbox` fields from `cli/src/generators/sandboxProfile.ts` → `expectedSandbox({ repoRoot, config })`:

- `excludedCommands`, e.g. `bash <profileRoot>/scripts/push-branch.sh:*` and `bash <profileRoot>/scripts/refresh-branch.sh:*`;
- `staleExcludedCommands`, e.g. `Bash(bash <profileRoot>/scripts/push-branch.sh:*)` and its refresh twin.

Index `i` of `staleExcludedCommands` is the stale spelling of index `i` of `excludedCommands`. This task reads both and re-derives neither. It does not change what `init` writes.

### Targets

- `cli/src/doctor/checks.ts` → `PROFILE_SANDBOX_CHECK` and its doc comment.
- `cli/test/doctor-profile-sandbox.test.mjs`: the `profile-sandbox` cases, and the file header's rule sentence.

**Work:**

- [ ] `PROFILE_SANDBOX_CHECK`, the `excludedCommands` block. For each profile entry found in `expected.staleExcludedCommands`, push one finding of this shape:

  ``\`sandbox.excludedCommands\` carries <stale entry>, the \`Bash(…)\` spelling an earlier release generated, which matches no command: <paired excludedCommands entry> is the spelling that runs outside the sandbox, and without it that wrapper runs sandboxed and its SSH push or fetch fails``

  Then:
  - leave a stale entry out of the *"which the configuration does not name: it runs with full access"* loop;
  - leave its paired new entry out of the *"lacks"* loop when the new entry is absent, so one stale entry gives one finding rather than three.

  Every finding still goes through `grade` and ends with `regenerate`, so the `warn`/`fail` split and the `init --force` remedy are the existing ones.
- [ ] The check's doc comment: add one sentence saying that an excluded entry in the earlier release's `Bash(…)` form is reported as stale by name, under the same grading, and why (`docs/sandbox-verification.md` P1a: that form matches nothing).
- [ ] `doctor-profile-sandbox.test.mjs`, a new case in the `profile-sandbox` suite: **warns on the earlier release's `Bash(…)` excluded spelling, naming it as stale**.
  - On a `wiredFixture`, use `editJson` to replace each `profile.sandbox.excludedCommands` entry `e` with `` `Bash(${e})` ``.
  - Assert the `WARN` line includes the stale push entry literally, includes `matches no command`, includes `init --force`, and does **not** include `runs with full access`.
  - Assert exit status 0.
- [ ] A second new case: **fails that profile under `--remote-job`**. Do the same edit, then assert a `FAIL` line for the check and a non-zero status, following the existing case (f)'s pattern. Update the file header's rule sentence to name the stale-spelling finding.

**Verification:**

- `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs` from the repository root, as one plain foreground command, exits 0. The run includes the existing case (a), *"passes on a freshly generated profile"*. That case is the end-to-end proof that Task 1's generator and this check agree on the new form: the story index's first `Top risks:` entry.
- `bash scripts/typecheck.sh` exits 0.
- Read the new finding's text against the existing *"lacks"* and *"carries … which the configuration does not name"* messages. A profile with one stale entry and no new entry yields exactly the stale finding for that wrapper.
