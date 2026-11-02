### Task 19 — Test PD23's shapes, and move the existing `unrecognised` cases onto a string the judge still does not know

**Goal:** Hold PD23's addition to its contract: on Linux only, `Permission denied` and `Device or resource busy` are sandbox-layer refusals in the judge and in the write-protection leg's rename classifier, and nothing changes on macOS. Three existing suites used `Device or resource busy` as their example of a Linux string the judge does not know. Move each such case onto a string still unknown, so the `unrecognised` mechanism stays tested, and add the PD23 cases beside it.

**Depends on:**

- **Task 6:** `judge.sh` → `sp__layer` files `Read-only file system`, `Permission denied` and `Device or resource busy` under `sandbox` when `SP_PLATFORM` is `linux`, and under `ran` otherwise. An expected `sandbox` or `network` refusal that errors with any other text on Linux is still `unrecognised`, verdict `not run`.
- **Task 12:** `legs-protection.sh` → `sp__wp_mv_class <helper line>` prints `refused` for a line carrying `Device or resource busy` on Linux, and `other` for it on macOS.

The cases this moves, as the suites hold them today:

- `sandbox-probe-judge.test.mjs` → *the Linux refusal string and the unrecognised layer, on Linux only*, its `busy` example and fixture `linux-unrecognised.jsonl`;
- `sandbox-probe-protection-legs.test.mjs` → the `wp-dd-unrecognised` cases and the `sbx_wp_mv 0 mv: cannot move 'a' to 'b': Device or resource busy` row of the mv-class table;
- `sandbox-probe-glob-registry-legs.test.mjs` → `RG2_BUSY` and RG3's *not moved, an unrecognised busy error* case.

**Where this task stops.** It edits these three suites and the two existing fixtures named, and creates the three new fixtures named in `### Targets`, one per PD23 judge string and one for the new `Permission denied` dd case. It creates no other file and never edits a grading function. Where the RG2 (a) and RG3 evidence now names the sandbox layer, only the expected evidence text changes; every verdict stays as the case asserts it today.

### Targets

- `cli/test/sandbox-probe-judge.test.mjs`
- `cli/test/sandbox-probe-protection-legs.test.mjs`
- `cli/test/sandbox-probe-glob-registry-legs.test.mjs`
- `cli/test/fixtures/sandbox-probe/linux-unrecognised.jsonl`
- `cli/test/fixtures/sandbox-probe/wp-dd-unrecognised.jsonl`
- `cli/test/fixtures/sandbox-probe/linux-permission-denied.jsonl` (new): the judge's `Permission denied` case, quoting PD23's recorded line
- `cli/test/fixtures/sandbox-probe/linux-busy.jsonl` (new): the judge's `Device or resource busy` case, quoting PD23's recorded line
- `cli/test/fixtures/sandbox-probe/wp-dd-eacces.jsonl` (new): the dd case's `dd: failed to open '<p>': Permission denied`, shaped as `wp-dd-erofs.jsonl` is

**Work:**

- [ ] **The unknown string.** Pick one error text no layer-table arm matches, for example `Input/output error`, and use it in every moved case and in both fixtures in place of `Device or resource busy`. Keep each fixture's shape otherwise byte-identical. Each moved case asserts exactly what it asserted before: `unrecognised`, `not run` and its evidence on Linux, and its macOS verdict without the seam.
- [ ] **`sandbox-probe-judge.test.mjs`.** Its header's rule gains PD23's two strings. A new subtest holds each of `Permission denied` and `Device or resource busy`:
  - judged `sandbox` → `pass` on Linux, quoting the line;
  - with `SP_PLATFORM` empty or `macos` → `ran`, so an expected `sandbox` refusal is `fail`, as before;
  - one fixture per string, `linux-permission-denied.jsonl` and `linux-busy.jsonl`, quoting PD23's recorded lines with `@FIXTURE_ROOT@` for the paths, as the existing fixtures do.
- [ ] **`sandbox-probe-protection-legs.test.mjs`.**
  - The mv-class table gains the busy line → `refused` on Linux, `other` on macOS, and the `inter-device move failed: … unable to remove target: Device or resource busy` line → `refused` on Linux.
  - The `wp-dd-unrecognised` cases take the new unknown string.
  - A dd case on the new fixture `wp-dd-eacces.jsonl`, carrying `dd: failed to open '@FIXTURE_ROOT@/clone/.git/config': Permission denied`, grades as the `wp-dd-erofs` case does on Linux.
- [ ] **`sandbox-probe-glob-registry-legs.test.mjs`.**
  - RG2 (a)'s busy evidence is now `(a) refused at the sandbox layer: …`, where it read `(a) failed with no refusal string: …`.
  - RG3's busy case keeps its `pass` with evidence `refused: …`.
  - A new RG3 case with the unknown string keeps today's `unrecognised` path.
  - Each header says why the expectation moved: PD23.

**Verification:**

- Each edited suite passes, each run as one plain foreground command from the repository root:
  - `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`
  - `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`
  - `npm test --workspace cli -- test/sandbox-probe-glob-registry-legs.test.mjs`
- Read the counts and the exit status, not a summary line.
- `git diff --stat` shows no file under `scripts/` changed by this task.
- `git status --porcelain cli/test/fixtures/sandbox-probe/` lists no new fixture outside the three `(new)` entries of `### Targets`.

**Deviations from plan:**

- RG2 (a): no existing case held a busy `(a)` evidence — every existing RG2 case's `(a)` is the permission-layer `DONT_ASK` refusal from `rg-session.jsonl`, and `RG2_BUSY` is (b)'s helper line, which `sp__rg2_grade` quotes rather than classifies, so it is unchanged. Added instead a two-platform RG2 case on the existing `rg3-refused.jsonl` (its busy mv as `(a)`, no helper call): Linux reads `(a) refused at the sandbox layer: mv: … Device or resource busy`, SP_PLATFORM empty keeps `(a) failed with no refusal string: Exit code 1: mv: …`; verdict `not run` on both, from (b).
- RG3's new unknown-string case needs a stream and the task creates no fixture beyond the three named, so the case writes one into its own temp directory, derived from `rg3-refused.jsonl` with `Device or resource busy` replaced by `Input/output error`.
- The mv-class table's `inter-device move failed` row also asserts `other` with SP_PLATFORM empty, matching the table's two-column shape; the eacces dd case also carries the SP_PLATFORM-empty twin (`fail`, `ran:`), as `wp-dd-erofs` does.
- Evidence downgrade, run form: the judge suite ran as one plain foreground command; the protection-legs and glob-registry suites' recorded runs had their output piped or redirected to read the counts (exit 0; 54/54 and 29/29 pass). The conventions document's no-pipe rule was not met on those two runs; the counts and exit status are as read.
- Tree guard `test/main-anchor-isolation.test.mjs` (covers `cli/test/**/*.mjs`) run: 2/2 pass.
</content>
</invoke>
