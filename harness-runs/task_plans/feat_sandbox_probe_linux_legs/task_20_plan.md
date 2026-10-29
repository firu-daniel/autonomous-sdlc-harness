### Task 20 — Test the refusal leg's grading

**Goal:** A new suite, `cli/test/sandbox-probe-refusal-leg.test.mjs`, holds the `refusal` leg's three grades to their contracts:

- **RF1** passes a startup refusal and fails a call that ran.
- **RF2** passes the watcher's refusal naming a package, fails its acceptance, and prints `not run` under a taken opt-out.
- **RF3** records an ignored invalid profile or a startup refusal.
- A permission-refused call is `not run` in RF1 and RF3.

**Depends on:** Task 10 (`scripts/lib/sandbox-probe/legs-refusal.sh`):

- **`sp__rf1_grade <stream> <stderr file> <agent exit status> <command>`**:
  - a `tool_result` for the call that is not a permission-layer refusal → `fail`, `the session ran its call although failIfUnavailable is true and the sandbox cannot start: …`;
  - no call and a non-zero exit → `pass`, `refused at startup (exit <n>): <the stderr file's first non-empty line, else the stream's result event text, else (no message)>`;
  - a permission-layer refusal → `not run`;
  - no call and exit 0 → `not run`.
- **`sp__rf2_grade <status> <refusal>`**:
  - `1` with a refusal naming `bwrap` or `socat` → `pass`, `the watcher would refuse the launch: <refusal>`;
  - `0` → `fail`;
  - `3` → `not run`, naming `sandbox.optOut`;
  - anything else → `not run`.
- **`sp__rf3_grade <stream> <stderr file> <agent exit status> <command> <marker written: 1|0>`**:
  - marker written → `pass`, `the invalid file was ignored: failIfUnavailable was never read, and the session ran unsandboxed with no startup refusal`;
  - no call and a non-zero exit → `pass`, `refused at startup (exit <n>): <line>`;
  - a call refused at the `sandbox` layer → `pass`, `started sandboxed and refused the write: …`;
  - a permission-layer refusal, or anything else → `not run`.

**Where this task stops.** No case launches a session or removes a package. `hr_sandbox_prereq_probe_var` itself is the run library's and is tested where that library is.

### Targets

- `cli/test/sandbox-probe-refusal-leg.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/rf-no-call.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/rf-ran.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/rf-permission.jsonl` (new)

**Work:**

- [ ] **The header** states the rule the suite enforces: **on a host that cannot sandbox, a session that runs its call is a finding, a startup refusal is quoted, and the watcher's prerequisite probe must refuse naming the missing package.** It also says that no positive control applies, as `legs-refusal.sh`'s header states.
  - It sources `core.sh`, `platform.sh`, `judge.sh`, `session.sh`, `controls.sh`, `legs-settings.sh` and `legs-refusal.sh` through `runBash`, with `SP_PLATFORM=linux`.
  - Its stderr files are written into a `mkdtemp` under `os.tmpdir()`.
- [ ] **The fixtures**, hand-written in the existing shape, unsubstituted:
  - **`rf-no-call`:** a `system`/`init` event if the agent CLI would print one, and a `result` event with `is_error: true` and text `sandbox required but unavailable`, with no `tool_use`. The exact wording is a placeholder that a real run replaces; the grade quotes, never matches, it.
  - **`rf-ran`:** a `dd if=/dev/null of=@FIXTURE_ROOT@/clone/sbx_rf1_ctl conv=notrunc` call with a non-error `0+0 records out` result.
  - **`rf-permission`:** the same call refused at the permission layer.
- [ ] **RF1:**
  - `sp__rf1_grade` on `rf-no-call` with a stderr file whose first non-empty line is `Error: sandbox unavailable: bwrap not found` and exit `1` → `pass`, `refused at startup (exit 1): Error: sandbox unavailable: bwrap not found`;
  - the same with an empty stderr file → `pass`, quoting the result event's text;
  - `rf-ran` → `fail`;
  - `rf-permission` → `not run`;
  - `rf-no-call` with exit `0` → `not run`.
- [ ] **RF2:**
  - `sp__rf2_grade 1 'The sandbox needs bwrap on PATH; install with …'` → `pass`;
  - `1` with a refusal naming neither package → `not run`;
  - `0 ''` → `fail`;
  - `3 ''` → `not run`, naming `sandbox.optOut`;
  - `2 ''` → `not run`.
- [ ] **RF3:**
  - marker written `1` with `rf-no-call` → `pass`, the ignored-file evidence;
  - marker `0` with `rf-no-call`, a stderr line and exit `1` → `pass`, `refused at startup`;
  - marker `0` with `rf-permission` → `not run`;
  - marker `0` with the existing `cs8-bad-sandbox.jsonl`, against its helper command → `pass`, `started sandboxed and refused the write`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-refusal-leg.test.mjs` passes, run from the repository root as one plain foreground command.
- The suite reads fixed fixture files and its own temporary files, never a tree of repository files, so it owes no `treeGuards` entry (`unit_loop_core.md` → `## The test-run rule` point 8's boundary).
</content>
</invoke>
