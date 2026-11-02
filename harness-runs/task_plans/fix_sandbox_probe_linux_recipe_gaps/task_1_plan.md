### Task 1 — Pin PD23's inter-device refusal shape with a judge fixture and its no-platform twin

**Goal:** Give `cli/test/sandbox-probe-judge.test.mjs` a fixture for PD23's third refusal shape, the rename across to the main checkout that fails with `mv: inter-device move failed: '<src>' to '<dst>'; unable to remove target: Device or resource busy`.
- On Linux the judge grades it a sandbox refusal and quotes the line.
- With no platform it stays a call that ran, so the macOS grade is shown unchanged.

All three PD23 shapes then have a fixture in this suite.

**Where this layer stops.** This task changes **no judge code and no other test fixture**: `scripts/lib/sandbox-probe/judge.sh` stays byte-identical, `SP__LINUX_SANDBOX_STRINGS` included. The PD23 decision behind that is in the story index's `## Context`, and Task 3 records it:
- Keep all three shapes and add none.
- F9's fix removed only the run copy's trio placeholders (§5 AP2). AP5 (2026-10-31, head `fc5aab79`) still reads seven non-trio placeholders inside the sandbox.
- Renames onto read-only binds of present files still fail with `Device or resource busy` (§8 RG2, RG3, CS1).

Task 3 writes it into `docs/sandbox-verification.md` §5 PD23. It names this task's fixture by its file name, `linux-busy-inter-device.jsonl`, and by the case it adds to the PD23 test. Keep both names exactly as below.

### Targets

- `cli/test/fixtures/sandbox-probe/linux-busy-inter-device.jsonl` (new): the recorded session.
- `cli/test/sandbox-probe-judge.test.mjs`: the new case in the PD23 test, and the header's account of PD23.

**Work:**

- [ ] **`linux-busy-inter-device.jsonl`.** Shape it line for line on the sibling `cli/test/fixtures/sandbox-probe/linux-busy.jsonl`, with only these values changed:
  - `session_id` is `sp-linux-busy-inter-device`.
  - The `Bash` `tool_use` `command` is `mv @FIXTURE_ROOT@/clone/sbx_wp_mv_xdev @FIXTURE_ROOT@/main/scripts/commit-on-branch.sh`.
  - The `tool_result` has `is_error: true` and content `Exit code 1\nmv: inter-device move failed: '@FIXTURE_ROOT@/clone/sbx_wp_mv_xdev' to '@FIXTURE_ROOT@/main/scripts/commit-on-branch.sh'; unable to remove target: Device or resource busy`.
  - `permission_denials` is `[]`.

  The message follows GNU `mv`'s form, as quoted in `docs/sandbox-verification.md` §8 row CS1 (Linux) (`mv: inter-device move failed: … to '<main>/scripts/commit-on-branch.sh'; unable to remove target: Device or resource busy`). The test `sp__wp_mv_class` in `cli/test/sandbox-probe-protection-legs.test.mjs` already uses the same form. `@FIXTURE_ROOT@` stands in for every path, as the header requires, and no machine path appears.
- [ ] **`sandbox-probe-judge.test.mjs` → `test('PD23: Permission denied and Device or resource busy are sandbox refusals, on Linux only', …)`.** Add a third entry to its `cases` array:
  - `name: 'inter-device move failed … Device or resource busy'`
  - `stream: 'linux-busy-inter-device'`
  - `command`: the fixture's command, verbatim.
  - `line`: the fixture's second content line, verbatim.

  The loop already turns each entry into a Linux `pass` case and a no-platform `fail` twin (`Exit code 1: <line>`). Add no new `test(...)` block, and leave the test's title and the two existing entries unchanged.
- [ ] **The file's header doc comment.** It now says that from PD23 `Permission denied` and `Device or resource busy` are sandbox refusals. Extend that sentence to say three things:
  - PD23's third recorded shape, the `inter-device move failed: … unable to remove target: Device or resource busy` line, is matched by the same `Device or resource busy` string and has its own fixture.
  - Each of the three shapes was checked against the evidence and kept: AP5 (2026-10-31) still reads the non-trio placeholders, and present read-only binds still refuse a rename.
  - No shape the current code can no longer produce is held here.

  Keep the header's *"The rule these tests exist to enforce"* sentence and its *"Left out deliberately"* paragraph as they are.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`, from the repository root, as one plain foreground command, exits 0:
  - The new Linux case passes, its printed line quoting the fixture's whole `mv: inter-device move failed: …` line.
  - Its no-platform twin passes as a `fail` verdict whose evidence is `Exit code 1: ` followed by that line, so the macOS grade is unchanged.
- `git diff --name-only` for this task names only the two targets. `scripts/lib/sandbox-probe/judge.sh`, every other fixture and every other test file are untouched.
- `git grep -n 'inter-device' -- cli/test/sandbox-probe-judge.test.mjs cli/test/fixtures/sandbox-probe` reaches only the new fixture, the new case and the header sentence.
