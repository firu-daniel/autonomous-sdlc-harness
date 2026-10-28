### Task 9 — Test the write-protection and git legs' permission-layer grading against recorded streams

**Goal:** Add cases to `cli/test/sandbox-probe-protection-legs.test.mjs` that drive Task 3's three new grading functions over recorded streams. A permission-layer refusal of a `dd`, of a CS3 call or of CL5's `git config` is `not run`, and the sandbox and `ran` shapes keep their grades.

**Depends on:** Task 3, which produces these in `scripts/lib/sandbox-probe/legs-protection.sh`. Their contract is restated here:

- **`sp__wp_dd_grade <stream> <exact dd command>`** → `SP__WP_DD_V` / `SP__WP_DD_E`:
  - **Sandbox layer:** `pass`, the evidence line.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never reached the sandbox: <evidence>`.
  - **Not in the stream:** `not run`, `no Bash call "<cmd>" in the session`.
  - **Any other layer:** `fail`, `<layer>: <evidence>`.
- **`sp__git_cs3_call <stream> <exact command>`** → `SP__GIT_CALL_V` / `SP__GIT_CALL_E`:
  - **Layer `ran`:** `pass`.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never ran: <evidence>`.
  - **Any other layer:** `fail`, `<layer>: <evidence>`.
- **`sp__git_cl5_grade <stream> <exact command>`** → `SP_VERDICT` / `SP_EVIDENCE`:
  - **Sandbox layer, with a `could not lock config file` line:** `pass`.
  - **Sandbox layer, without it:** `fail`, `refused, but with no 'could not lock config file' line: …`.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never reached the sandbox: <evidence>`.
  - **Not in the stream:** `not run`.

### Targets

- `cli/test/sandbox-probe-protection-legs.test.mjs`
- `cli/test/fixtures/sandbox-probe/wp-dd-permission.jsonl` (new): one call, `dd if=/dev/null of=@FIXTURE_ROOT@/clone/.git/config conv=notrunc`, refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`
- `cli/test/fixtures/sandbox-probe/git-permission.jsonl` (new), three calls:
  - `git add sbx_a.txt`, refused with that same dontAsk text;
  - `git config sbx.probe true`, refused with that same text;
  - `git status --porcelain` (the control), with an empty `tool_result`.
- `cli/test/fixtures/sandbox-probe/cl5-sandbox.jsonl` (new): `git config sbx.probe true` refused with `error: could not lock config file .git/config: Operation not permitted`.

**Work:**

- [ ] The three fixtures, in the existing fixtures' event shape (`system` init, the `user` prompt, `assistant` `tool_use`, `tool_result`, a closing `result` with `permission_denials: []`).
- [ ] `test('sp__wp_dd_grade: …')`:
  - the existing `sandbox-dd` fixture with its command → `pass`;
  - `wp-dd-permission` → `not run` with the permission text;
  - `ran` (a fixture without the call) → `not run`.
- [ ] `test('sp__git_cs3_call: …')`:
  - `git-permission` with `git add sbx_a.txt` → `not run` with `refused at the permission layer, so it never ran: …`;
  - with `git status --porcelain` → `pass`.
- [ ] `test('sp__git_cl5_grade: …')`:
  - `cl5-sandbox` → `pass`;
  - `git-permission` with `git config sbx.probe true` → `not run` with the permission text;
  - the existing `sandbox-dd` fixture with `git config sbx.probe true`, which it does not hold → `not run`.
- [ ] The header's function list and rule sentence gain the three functions and the clause *a call refused at the permission layer never reached the layer CS1, CS2, CS7, CS3 and CL5 measure, and is `not run`*. Assert each full `<verdict>|<evidence>` string with `assert.equal`, using the file's existing `VERDICT`-style printf helper or one shaped like it.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`, from the repository root as one plain foreground command, exits 0, and its TAP counts show no failure.
- `git diff` leaves the file's existing cases unchanged.
