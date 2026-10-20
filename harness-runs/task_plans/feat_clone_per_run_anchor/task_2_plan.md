### Task 2 — Add the `doctor` check `profile-main-anchor`, which grades the profile's allow rule for the anchor read

**Goal:** Make `doctor` report a profile that lacks the anchor's allow rule, since that profile silently leaves every plugin reader on its `git worktree list` fallback. The new check `profile-main-anchor` passes when `permissions.allow` carries `MAIN_REPO_ANCHOR_RULE`, and warns otherwise, printing the exact line to paste.

**Depends on:** Task 1, which exports from `cli/src/core/mainRepoAnchor.ts`:

- `MAIN_REPO_ANCHOR_VARIABLE` (`'HARNESS_MAIN_REPO'`);
- `MAIN_REPO_ANCHOR_READ` (`'printenv HARNESS_MAIN_REPO'`);
- `MAIN_REPO_ANCHOR_RULE` (`'Bash(printenv HARNESS_MAIN_REPO)'`);

and makes every freshly generated profile carry that rule once in `permissions.allow`. This task imports all three and spells none of them.

**Where this task stops.** The check's row in `docs/cli.md` §7 is **Task 17's**. This task changes no generator.

### Targets

- `cli/src/doctor/checks.ts` — the check, and its place in `CHECKS`.
- `cli/test/doctor-main-anchor.test.mjs` (new) — the check's suite.
- `cli/test/doctor.test.mjs` — the frozen `PRE_BRANCH_CHECK_IDS` list only.

**Work:**

- [ ] **The check.** Add `PROFILE_MAIN_ANCHOR_CHECK`, with `id: 'profile-main-anchor'` and title *"the permission profile allow-lists the read of the main-checkout anchor"*. Insert it into `CHECKS` directly after `PROFILE_DENY_FLOOR_CHECK`. Read the lists through the module's existing `permissionEntries`.
  - `unevaluated`, pointing at the `permission-profile` check, when `ctx.profile` is undefined.
  - `warn` when the rule is missing from `allow`, or present in `ask` or `deny`. `ask` is evaluated before `allow` and refuses under `dontAsk`, and `deny` cannot be overridden. The message names which list is at fault and what it costs: each plugin reader's `MAIN_REPO_ANCHOR_READ` is refused and the reader falls back to the first `git worktree list` entry. That answer is right in the main checkout and in a linked worktree, and names the copy itself in a clone. The remedy is to add the rule (printed on its own line, unquoted) or to regenerate with `init --force`, which writes a `.bak` first.
  - `pass` otherwise, naming the rule.
  - **It never fails, `--remote-job` included.** A job's checkout is its own main checkout, so the fallback answers the same directory there. Say so in the check's doc comment, beside the comparison with `PROFILE_DENY_FLOOR_CHECK`'s warn-only grading.
- [ ] **The doc comment.** State what the check asks, why it is a `warn`, and that every name in its messages comes from Task 1's constants. That follows `.claude/context/conventions.md` → *"read through its constant and never retyped as a literal — including in the message that names it to a reader"*.
- [ ] **`cli/test/doctor-main-anchor.test.mjs`.** Open with the rule it enforces, then cases on throwaway fixtures through `createFixture` / `runCli` from `./helpers/fixture.mjs`, following `cli/test/doctor-profile-sandbox.test.mjs`'s pattern of editing the generated profile in place:
  - a fresh `init` → the `profile-main-anchor` line is a pass;
  - the rule removed from `allow` → a warn whose text carries `MAIN_REPO_ANCHOR_RULE`, and `doctor` still exits 0;
  - the rule also copied into `ask` → a warn naming `ask`;
  - the rule removed, under `doctor --remote-job` → still a warn, never a fail;
  - the profile deleted → the line is unevaluated.
- [ ] **`cli/test/doctor.test.mjs`.** Add `'profile-main-anchor'` to `PRE_BRANCH_CHECK_IDS` directly after `'profile-deny-floor'`. Change nothing else in the file.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `npm test --workspace cli -- test/doctor-main-anchor.test.mjs`, then `npm test --workspace cli -- test/doctor.test.mjs`, each from the repository root as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status of each: `# fail 0`.
- `grep -n "HARNESS_MAIN_REPO\|printenv" cli/src/doctor/checks.ts` prints nothing: the names arrive through imports.
