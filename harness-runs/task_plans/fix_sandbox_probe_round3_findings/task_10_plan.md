### Task 10 — Test the planted-config refusal's permission-layer grading against a recorded stream

**Goal:** A new suite that drives `sp__pc_refusal` over recorded streams of CS15's shape: a push then a commit through the main checkout's wrappers. A permission-layer refusal must be `not run`, a wrapper's own refusal line `pass`, and a sandbox refusal `fail`.

**Depends on:** Task 4, which changes this in `scripts/lib/sandbox-probe/legs-planted.sh`. Its contract is restated here: **`sp__pc_refusal <stream> <exact command> <prefix> <wanted text>`** → `SP__PC_RV` / `SP__PC_RE`, matching `<prefix>` then `<wanted text>` case-insensitively:

- **Not in the stream:** `not run`, `no Bash call "<cmd>" in the session`.
- **Permission layer:** `not run`, `refused at the permission layer, so it never reached the wrapper: <evidence>`.
- **Any other non-`ran` layer:** `fail`, `the wrapper did not run: refused at <layer>: <evidence>`.
- **`ran`, with a line carrying `<prefix>` then `<wanted text>`:** `pass`, that line.
- **`ran` without it:** `fail`, `no '<prefix> … <wanted text>' line, so the wrapper did not refuse on the plant: <first line>`.

**How the suite runs it.** As `cli/test/sandbox-probe-remote-legs.test.mjs` → `sourced()` does: source `core.sh`, `judge.sh`, `controls.sh` and `legs-planted.sh` in a `bash -c` from a case directory under `os.tmpdir()`, with `SP_VERSION: ''`. Fixtures are passed unsubstituted.

### Targets

- `cli/test/sandbox-probe-planted-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/cs15-permission.jsonl` (new):
  - CS15's push, `bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone_cfg`, refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`;
  - CS15's commit, `bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone_cfg sbx_pc_cs15.txt -- "chore: Sandbox probe CS15"`, answered with `commit-on-branch.sh: refusing to commit: @FIXTURE_ROOT@/clone_cfg/.git/config sets sbx.cs15, which the clone allow-list does not hold, so this clone's configuration is not trusted`.

**Work:**

- [ ] The fixture, in the existing fixtures' event shape, with the subject's double quotes escaped.
- [ ] The suite's header states its rule: *a planted-config row passes only on the wrapper's own refusal line; a wrapper call refused at the permission layer never reached the wrapper and is `not run`; any other refusal of the main wrapper is `fail`*. It also says that the cases read fixtures only.
- [ ] Cases:
  - **Push**, with prefix `refusing to push:` and the CS15 wanted text `@FIXTURE_ROOT@/clone_cfg/.git/config sets sbx.cs15, which the clone allow-list does not hold, so this clone's configuration is not trusted` → `not run|refused at the permission layer, so it never reached the wrapper: Permission to use Bash has been denied because Claude Code is running in don't ask mode.`
  - **Commit**, with prefix `refusing to commit:` and the same wanted text → `pass|<the refusal line>`.
  - **The existing `sandbox-dd` fixture** with its own `dd` command as `<cmd>` → `fail|the wrapper did not run: refused at sandbox: …`.
  
  Assert each full `<verdict>|<evidence>` string with `assert.equal`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-planted-legs.test.mjs`, from the repository root as one plain foreground command, exits 0, and its TAP counts show no failure.
