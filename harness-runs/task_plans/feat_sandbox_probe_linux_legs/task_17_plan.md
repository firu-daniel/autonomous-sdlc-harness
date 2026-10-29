### Task 17 — Test the write-protection and git legs' Linux grading

**Goal:** Hold Task 5's `legs-protection.sh` changes to fixtures in `cli/test/sandbox-probe-protection-legs.test.mjs`:

- `sp__wp_dd_grade` passes a `Read-only file system` refusal on Linux and prints `not run` for an `unrecognised` one;
- `sp__wp_mv_class` classifies a rename helper line by platform;
- `sp__git_cs3_fetch` prints `not run` for an `unrecognised` refusal.

Each Linux case has a twin with `SP_PLATFORM` empty, asserting today's macOS outcome.

**Depends on:**

- **Task 5** (`scripts/lib/sandbox-probe/legs-protection.sh`):
  - **`sp__wp_dd_grade <stream> <exact dd command>`** sets `SP__WP_DD_V` and `SP__WP_DD_E`. Its arms: `sandbox` → `pass`; `permission` → `not run`; `unrecognised` → `not run` with the judge's evidence; any other layer → `fail`.
  - **`sp__wp_mv_class <helper line>`** prints one class, checked in order:
    1. ` landed` at the end → `landed`;
    2. ` stage failed: ` → `stage-failed`;
    3. `Operation not permitted` → `refused`;
    4. on Linux, `Read-only file system` → `refused`;
    5. otherwise `unrecognised` on Linux and `other` on macOS.
  - **`sp__git_cs3_fetch <stream> <command>`** sets `SP__GIT_FETCH_V` and `SP__GIT_FETCH_E`; `unrecognised` → `not run` with the judge's evidence.
- **Task 3** (`judge.sh`). On Linux, `Read-only file system` is layer `sandbox`. An expected `sandbox` or `network` call that errors with no known string is layer `unrecognised`, verdict `not run`, evidence `no refusal string this judge knows on Linux, so not graded: …`.

**Where this task stops.** It tests these three functions. The leg's sessions are not launched. The parity script's Linux text is Task 14's.

### Targets

- `cli/test/sandbox-probe-protection-legs.test.mjs`
- `cli/test/fixtures/sandbox-probe/wp-dd-erofs.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/wp-dd-unrecognised.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/cs3-fetch-unrecognised.jsonl` (new)

**Work:**

- [ ] **Three fixtures**, in the shape of `sandbox-dd.jsonl` and `cs3-fetch-refused.jsonl`, unsubstituted:
  - `wp-dd-erofs.jsonl`: `dd if=/dev/null of=@FIXTURE_ROOT@/clone/.git/config conv=notrunc`, error `Exit code 1\ndd: failed to open '@FIXTURE_ROOT@/clone/.git/config': Read-only file system`;
  - `wp-dd-unrecognised.jsonl`: the same, ending `Device or resource busy`;
  - `cs3-fetch-unrecognised.jsonl`: `git fetch origin`, error `Exit code 128\nfatal: unable to access 'https://github.com/x/y.git/': sbx unknown network failure`.
- [ ] **A new `test(...)`, *sp__wp_dd_grade on Linux*,** sourcing the suite's libraries plus `platform.sh`:
  - `wp-dd-erofs` with `SP_PLATFORM=linux` → `pass`, evidence the `Read-only file system` line;
  - the same with `SP_PLATFORM` empty → `fail`, evidence beginning `ran:`;
  - `wp-dd-unrecognised` with `linux` → `not run`, evidence beginning `no refusal string this judge knows on Linux`;
  - the same with `SP_PLATFORM` empty → `fail`;
  - the existing `wp-dd-permission.jsonl` → `not run` under both.
  - The header's rule gains the Linux grading.
- [ ] **A new `test(...)`, *sp__wp_mv_class*,** one assertion per class:
  - `sbx_wp_mv 0 landed` → `landed`;
  - `sbx_wp_mv 0 stage failed: cp: x` → `stage-failed`;
  - `sbx_wp_mv 0 mv: rename a to b: Operation not permitted` → `refused` on both platforms;
  - `sbx_wp_mv 0 mv: cannot move 'a' to 'b': Read-only file system` → `refused` with `linux`, `other` with it empty;
  - `sbx_wp_mv 0 mv: cannot move 'a' to 'b': Device or resource busy` → `unrecognised` with `linux`, `other` with it empty.
- [ ] **A subtest for `sp__git_cs3_fetch`:**
  - `cs3-fetch-unrecognised` with `linux` → `not run`;
  - with it empty → `fail`, its `git fetch origin reached origin…` evidence, as today;
  - the existing `cs3-fetch-refused.jsonl` → `pass` under both.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs` passes, run from the repository root as one plain foreground command.
</content>
</invoke>
