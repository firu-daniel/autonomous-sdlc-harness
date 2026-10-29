### Task 16 — Test TD4's grading, the row choice and T3's log strings

**Goal:** Hold Task 4's `legs-local.sh` changes to fixtures in `cli/test/sandbox-probe-gates-legs.test.mjs`:

- TD4 is graded against TD3's result: bare and `-d` written under `TMPDIR`, `-t` failing `too few X's`, explicit written;
- a form refused by the sandbox, or otherwise different, is `fail`, while unrecognised error text and a permission-layer refusal are `not run`;
- T2/T3's log search quotes a Linux refusal line on Linux only.

**Depends on:**

- **Task 4** (`scripts/lib/sandbox-probe/legs-local.sh`):
  - **`sp__td4_grade <stream> <tmpdir>`** sets `SP_VERDICT` and `SP_EVIDENCE`. It judges `mktemp`, `mktemp -d`, `mktemp -t harness-gates` and `mktemp <tmpdir>/harness-gates.XXXXXX` with `sp_judge_call … ran`.
    - Its expectations: bare and `-d` are non-error results whose first line starts `<tmpdir>/`; `-t` is an error carrying `too few X's`; the explicit form is a non-error result starting `<tmpdir>/harness-gates.`.
    - Its evidence is one clause per form, `<form>: <outcome>`, in that order, a differing form's clause ending `— differs from TD3`.
    - Its verdict: `not run` for a permission-layer refusal, an absent form, or an error that is neither expected nor a known refusal (`no refusal string this judge knows on Linux, so not graded`); else `fail` for any difference; else `pass`.
  - **`sp__t2_grade`** adds `Read-only file system` and `failed to create file via template` to its `fail` line search when `SP_PLATFORM=linux`, after the macOS patterns.
- **Task 2** (`core.sh`). `sp_leg_row_for <macOS row> <Linux row>`, which `sp_leg_mktemp` and `sp_leg_gates` call with `TD2 TD4` and `T2 T3`.
- **Task 3** (`judge.sh`). On Linux, `Read-only file system` is layer `sandbox`.

**Where this task stops.** It tests grading functions only. No case launches `claude` or starts a gate.

### Targets

- `cli/test/sandbox-probe-gates-legs.test.mjs`
- `cli/test/fixtures/sandbox-probe/td4-forms.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/td4-refused.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/td4-unrecognised.jsonl` (new)

**Work:**

- [ ] **Three fixtures**, in `td2-forms.jsonl`'s shape. They are **substituted** as the TD2 fixtures are: `@FIXTURE_ROOT@` is replaced by the case directory, and stands in for the session's `TMPDIR`. Each holds the four `mktemp` calls and their results.
  - `td4-forms.jsonl`: bare → `@FIXTURE_ROOT@/tmp.AbC123`, `-d` → `@FIXTURE_ROOT@/tmp.DeF456`, `-t` → error `Exit code 1\nmktemp: too few X's in template 'harness-gates'`, explicit → `@FIXTURE_ROOT@/harness-gates.GhI789`.
  - `td4-refused.jsonl`: as `td4-forms`, but bare → error `Exit code 1\nmktemp: failed to create file via template '@FIXTURE_ROOT@/tmp.XXXXXXXXXX': Read-only file system`.
  - `td4-unrecognised.jsonl`: as `td4-forms`, but `-d` → error `Exit code 1\nmktemp: sbx unknown failure`.
- [ ] **A new `test(...)`, *sp__td4_grade: the four forms against TD3's result*,** sourcing `legs-local.sh` with its libraries as the suite does, plus `platform.sh`, with `SP_PLATFORM=linux`:
  - `td4-forms` → `pass`, with the four clauses in form order;
  - `td4-refused` → `fail`, the bare clause `refused (sandbox) … Read-only file system — differs from TD3`;
  - `td4-unrecognised` → `not run`, naming `mktemp: sbx unknown failure`;
  - the existing `td2-control-permission.jsonl`, run through `sp__td4_grade` → `not run`, never `fail`.
  - The header's rule gains TD4 and T3.
- [ ] **A subtest for `sp_leg_row_for`** with `SP_PLATFORM=linux` and with it empty, for `TD2 TD4` and `T2 T3`, so the rows `sp_leg_mktemp` and `sp_leg_gates` print are held where they are chosen.
- [ ] **A subtest for `sp__t2_grade`** with a `fail <n>` verdict file and a log whose first matching line is `mktemp: failed to create file via template '/tmp/x': Read-only file system`:
  - with `SP_PLATFORM=linux`, the evidence quotes that line;
  - with `SP_PLATFORM` empty, it quotes the `== run-test-suite.sh: gate … exited 1 ==` fallback line the log also carries, as today.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-gates-legs.test.mjs` passes, run from the repository root as one plain foreground command.
</content>
</invoke>
