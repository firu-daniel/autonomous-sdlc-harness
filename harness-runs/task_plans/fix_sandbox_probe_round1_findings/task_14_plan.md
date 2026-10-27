### Task 14 — Test W8, CS7's `Edit`, CS3's fetch and `sp__wp_tracked` against recorded streams and logs

**Goal:** Drive Task 5's write-protection and git-leg fixes with recorded fixtures:

- W8 grades both sessions' debug logs, and is `not run` when W7's is missing;
- CS7's `Edit` half is taken;
- CS3's `git fetch origin` refused by the network allowlist is the expected result, not a `fail`;
- `sp__wp_tracked` writes nothing to stderr however long the tracked list is.

**Depends on:** Task 5, which changed `scripts/lib/sandbox-probe/legs-protection.sh`. The functions below read only their arguments, the stream and (for W8) `SP_RUN_PROFILE`.

- **`sp__wp_w8 <departure> <write-protection log> <W7 log, or empty>`** prints W8's line through `sp_result_line`:
  - `fail` when either log carries `is not matched by file permission checks` or `mixes * with the trailing :* prefix syntax` for a rule `SP_RUN_PROFILE`'s `permissions.allow` / `deny` / `ask` carries, quoting the line and naming its log;
  - otherwise `not run` when either log is missing or empty, its evidence naming which (`W7's --debug-file log is missing or empty …`);
  - otherwise `pass`.
- **`sp__wp_cs7_edit <stream> <run profile>`** sets `SP__WP_EDIT_V` / `SP__WP_EDIT_E`:
  - `Edit` refused at `file-tool` or `permission` → `pass`, `Edit refused at the <layer> layer: …`;
  - `ran` → `fail`;
  - absent → `not run`.
- **`sp__git_cs3_fetch <stream> <command>`** sets `SP__GIT_FETCH_V` / `SP__GIT_FETCH_E`:
  - layer `network` → `pass`, `refused by the network allowlist, as the clone layout intends (§7 OR2): …`;
  - `ran` → `fail`, `git fetch origin reached origin from inside the sandbox: …`;
  - otherwise → `not run`.
- **`sp__wp_tracked [<exclude>]`** prints one tracked regular file of `SP_CLONE`, `README.md` first, with no pipe.

### Targets

- `cli/test/fixtures/sandbox-probe/cs7-edit-refused.jsonl` (new): a `Read` then an `Edit` of `@FIXTURE_ROOT@/run-profiles/sbx.json`, the `Edit` refused with `Permission to use Edit has been denied because Claude Code is running in don't ask mode.`
- `cli/test/fixtures/sandbox-probe/cs3-fetch-refused.jsonl` (new): `git fetch origin` answered `is_error: true` with `sandbox proxy: github-firu:22: 403 host is not on the allow list`, as row CS3 quotes.
- `cli/test/fixtures/sandbox-probe/w8-clean.debug.log` (new): plain debug lines, none carrying either phrase.
- `cli/test/fixtures/sandbox-probe/w8-unmatched.debug.log` (new): one line `Permission rule Edit(@FIXTURE_ROOT@/scripts/**) is not matched by file permission checks`.
- `cli/test/sandbox-probe-protection-legs.test.mjs` (new).

**Work:**

- [ ] **The suite's header and harness.**
  - Open with the rule: *W8 needs both sessions' debug logs, CS7 includes its `Edit`, CS3's fetch refusal is the clone layout's design, and no probe helper writes `Broken pipe`.*
  - Source `core.sh`, `judge.sh`, `controls.sh` and `legs-protection.sh` through `runBash` from `./helpers/fixture.mjs`, in a case directory from `mkdtemp(join(tmpdir(), …))` removed in `t.after`.
  - For W8, the case writes a run profile JSON whose `permissions.deny` carries `Edit(@FIXTURE_ROOT@/scripts/**)`, and exports it as `SP_RUN_PROFILE`.
- [ ] **W8's cases.**
  - Clean + clean → one `pass` line.
  - Clean + unmatched → `fail`, quoting the line and naming `W7`.
  - Clean + empty third argument → `not run`, naming W7's log.
  - Assert the whole printed line with `SP_VERSION` blanked (`claude="unknown"`).
- [ ] **CS7 and CS3.**
  - `sp__wp_cs7_edit cs7-edit-refused.jsonl @FIXTURE_ROOT@/run-profiles/sbx.json` → `pass|Edit refused at the permission layer: …`.
  - On `ran.jsonl` → `not run`.
  - `sp__git_cs3_fetch cs3-fetch-refused.jsonl 'git fetch origin'` → `pass`, with evidence naming §7 OR2 and the proxy line.
- [ ] **`sp__wp_tracked` with no pipe.**
  - Build a repository with `seedRepository` (from `./helpers/fixture.mjs`) under the case directory. Commit `README.md` plus enough further files that the `git ls-files` list exceeds a pipe buffer: 5,000 files, each named `f<n>.txt`, written and added in one commit.
  - Set `SP_CLONE` to it and call `sp__wp_tracked`. Assert stdout `README.md\n` and stderr `''`.
  - Then call `sp__wp_tracked README.md`. Assert one non-dot tracked file and stderr `''`.
- [ ] **Fixture hygiene.** Every stream fixture follows `ran.jsonl`'s event shape and uses `@FIXTURE_ROOT@` for every path. The debug-log fixtures carry no machine path.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs` passes.
- The `sp__wp_tracked` cases assert an empty stderr, which is the defect's observable: `printf: write error: Broken pipe`.
