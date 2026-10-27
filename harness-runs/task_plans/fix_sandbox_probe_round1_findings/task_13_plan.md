### Task 13 — Test T2's and TD2's grading against recorded streams

**Goal:** Drive Task 4's three grading functions with recorded stream fixtures and lane files the test writes:

- **T2** is graded from the lane's verdict and log, never from a foreground exit.
- **TD2's TMPDIR** is read as a literal path.
- **TD2's control** is never `fail` when it was refused at the permission layer.

**Depends on:** Task 4, which added these to `scripts/lib/sandbox-probe/legs-local.sh`. Each one calls only `core.sh`, `judge.sh` and `controls.sh` functions.

- **`sp__t2_grade <stream> <run command> <verdict file> <log file>`.** It sets `SP_VERDICT` / `SP_EVIDENCE`:
  - run command absent, or answered at the permission layer → `not run`;
  - no verdict file → `not run`, `no verdict for the gate run: …`;
  - `pass` → `pass`, `run-test-suite.sh verdict pass`;
  - `fail <path>` → `fail`, quoting the log's first `mkstemp failed` / `Operation not permitted` line, else its first non-zero `== run-test-suite.sh: gate … exited <n> ==` line, plus `; compare with the same call unsandboxed on the same tree before filing its row`;
  - any other line → `not run`.
  - Every evidence ends with the count of log lines carrying `<sandbox_violations>` or `host is not on the allow list`, and the first such line. These are recorded, never graded.
- **`sp__td2_tmpdir <stream> <command>`.** It prints the path the `printenv TMPDIR` call printed, without a trailing slash. It returns status 1 when the call is absent, not layer `ran`, not absolute, or not `sp__ctl_literal`-spellable.
- **`sp__td2_grade <stream> <tmpdir>`.** It reads `mktemp`, `mktemp -d`, `mktemp -t harness-gates` and `mktemp <tmpdir>/harness-gates.XXXXXX`:
  - any answered at the permission layer → `not run` (`<form>: refused at the permission layer, so it never reached the sandbox: …`);
  - otherwise `fail` when a bare/`-d`/`-t` form ran or was refused without `mkstemp failed` / `mkdtemp failed`, or when the explicit form did not print a path under `<tmpdir>/harness-gates.`;
  - otherwise `not run` when any call is absent;
  - otherwise `pass`.

### Targets

- `cli/test/fixtures/sandbox-probe/t2-run-form.jsonl` (new): the run form `bash scripts/run-test-suite.sh sbx_probe_t2` answered `pending`, then `--wait` calls answered `pending` and finally `pass`.
- `cli/test/fixtures/sandbox-probe/t2-run-permission.jsonl` (new): the run form refused with `Permission to use Bash … has been denied because Claude Code is running in don't ask mode.`
- `cli/test/fixtures/sandbox-probe/td2-tmpdir.jsonl` (new): `printenv TMPDIR` answered `@FIXTURE_ROOT@/claude-tmp/`.
- `cli/test/fixtures/sandbox-probe/td2-forms.jsonl` (new). It records the four forms:
  - bare, `-d` and `-t` each refused with `mktemp: mkstemp failed on /var/folders/…: Operation not permitted` (`mkdtemp` for `-d`), as row TD2 quotes;
  - the explicit `mktemp @FIXTURE_ROOT@/claude-tmp/harness-gates.XXXXXX` answered `@FIXTURE_ROOT@/claude-tmp/harness-gates.AbC123`.
- `cli/test/fixtures/sandbox-probe/td2-control-permission.jsonl` (new): the same, except that the explicit form is refused at the permission layer.
- `cli/test/sandbox-probe-gates-legs.test.mjs` (new).

**Work:**

- [ ] **The suite's header and harness.**
  - Open with the rule: *T2 is graded from the gate lane's verdict and log, and TD2's control is a literal path, and a permission-layer refusal of any measured call or control is `not run`, never `fail`.*
  - Source `core.sh`, `judge.sh`, `controls.sh` and `legs-local.sh` through `runBash` from `./helpers/fixture.mjs`, under a case directory from `mkdtemp(join(tmpdir(), …))` removed in `t.after`. Print `"$SP_VERDICT|$SP_EVIDENCE"`.
  - **The three TD2 fixtures are substituted; the T2 fixtures are not.** Before each TD2 case, the suite writes a copy of `td2-tmpdir.jsonl`, `td2-forms.jsonl` and `td2-control-permission.jsonl` into the case directory, with every `@FIXTURE_ROOT@` replaced by that directory — the `.split('@FIXTURE_ROOT@').join(dir)` form `cli/test/run-analytics.test.mjs` already uses — and passes the copies' paths to the functions. State this in the header, beside the rule above, and say why it differs from `cli/test/sandbox-probe-judge.test.mjs`, whose fixtures are passed unsubstituted: Task 4's `sp__td2_tmpdir` returns status 1 when the printed TMPDIR is not an absolute path, and `@FIXTURE_ROOT@/…` is not one. Task 4's absolute-path rule stays as Task 4 states it; this suite never loosens it.
- [ ] **T2's cases.** The test writes `sbx_probe_t2.verdict` and `.log` in the case directory, and each case gives the exact fixture command.
  - **`pass` verdict:** a log carrying one `<sandbox_violations>api.anthropic.com:443 refused: host is not on the allow list</sandbox_violations>` line. Expect `pass`, with the evidence ending in a count of 1 and that line.
  - **`fail <path>` verdict:** a log carrying `mktemp: mkstemp failed on …: Operation not permitted`. Expect `fail`, quoting that line plus the compare clause.
  - **No verdict file:** expect `not run`.
  - **The permission fixture:** expect `not run`, whatever the lane says.
- [ ] **TD2's TMPDIR cases.**
  - `sp__td2_tmpdir <case dir>/td2-tmpdir.jsonl 'printenv TMPDIR'`, on the substituted copy, prints `<case dir>/claude-tmp` (absolute, no trailing slash) and returns status 0.
  - On `ran.jsonl` (no such call) it returns status 1 and prints nothing.
- [ ] **TD2's grading cases.** Each passes the path the TMPDIR case printed, `<case dir>/claude-tmp`, as `<tmpdir>`, against the substituted copies in the same case directory, so the explicit form's command `mktemp <case dir>/claude-tmp/harness-gates.XXXXXX` and its printed path `<case dir>/claude-tmp/harness-gates.AbC123` agree with that `<tmpdir>`.
  - `sp__td2_grade <case dir>/td2-forms.jsonl <case dir>/claude-tmp` → `pass`, with evidence clauses in the order bare, `-d`, `-t`, explicit.
  - `sp__td2_grade <case dir>/td2-control-permission.jsonl <case dir>/claude-tmp` → `not run`, whose evidence names `explicit: refused at the permission layer`. **It is never `fail`.** This case is defect 3's guard.
- [ ] **Fixture hygiene.** Every fixture uses `@FIXTURE_ROOT@` for every path, in the shape of `cli/test/fixtures/sandbox-probe/ran.jsonl` (`system` init, `user` prompt, `assistant` `tool_use`, `user` `tool_result`, `result`). It holds no machine path.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-gates-legs.test.mjs` passes.
- No case starts a session or a gate. The suite sources libraries and reads fixtures only.
