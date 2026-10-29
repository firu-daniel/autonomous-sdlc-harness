### Task 4 — Take TD4 with TD3's expectation and T3 in place of TD2 and T2 on Linux

**Goal:** On Linux the `mktemp` leg prints row **TD4** and the `gates` leg prints row **T3**. On macOS they print TD2 and T2 exactly as today.

TD4 is graded against **TD3's** result, never TD2's (`docs/sandbox-verification.md` → §5 *The temporary directory*, row TD3). TD3 is the unsandboxed GNU coreutils record: bare `mktemp` and `mktemp -d` honour `TMPDIR`, and `mktemp -t harness-gates` exits 1 with `mktemp: too few X's in template 'harness-gates'`. T3 runs as T2 does, through `run-test-suite.sh`, with the Linux refusal strings added to the lines its log search quotes.

**Depends on:**

- **Task 2** (`scripts/lib/sandbox-probe/core.sh`):
  - `mktemp`'s rows are `TD2,TD4` and `gates`' rows are `T2,W7,T3`;
  - `sp_leg_row_for <macOS row> <Linux row>` prints the second argument when `SP_PLATFORM` is `linux`, else the first.
- **Task 3** (`scripts/lib/sandbox-probe/judge.sh`):
  - on Linux, `Read-only file system` is layer `sandbox`;
  - a call expected at `sandbox` or `network` that errors with no known string is layer `unrecognised`, verdict `not run`;
  - the `ran` arm's evidence is `Exit code <n>: <message line>` where a message follows.

**Where this task stops.** It changes the row each leg prints, adds TD4's grading, and adds the Linux strings to T2/T3's log search. W7 is unchanged on both platforms. Task 16 tests this file. Gate 15's account of TD4 and T3 is Task 11's, and the record's is Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-local.sh`

**Work:**

- [ ] **`sp__td4_grade <stream> <tmpdir>`** (new) sets `SP_VERDICT` and `SP_EVIDENCE`. It takes the same four forms, in the same order and spelled the same way, as `sp__td2_grade`: `mktemp`, `mktemp -d`, `mktemp -t harness-gates`, `mktemp <tmpdir>/harness-gates.XXXXXX`. Each is judged with `sp_judge_call <stream> ran <command>`.
  - **What each form expects**, from TD3:
    - `bare`: a result that is not an error, whose first line starts with `<tmpdir>/`;
    - `-d`: the same;
    - `-t`: an error whose text carries `too few X's`;
    - `explicit`: a result that is not an error, whose first line starts with `<tmpdir>/harness-gates.`.
  - **Each form adds one clause** to the evidence, in form order: `<form>: <outcome>`, where the outcome is `written <path>`, `refused (<layer>) <line>` or `<line>`.
  - **The verdict:**
    - `not run` when any form was refused at the permission layer, is absent from the stream, or errored with text that is neither its expected text nor a known refusal. That last case names the text: `no refusal string this judge knows on Linux, so not graded`.
    - otherwise `fail` when any form's outcome differs from its expectation, including a bare or `-d` form refused at the `sandbox` layer. Each differing form's clause ends `— differs from TD3`.
    - otherwise `pass`.
- [ ] **`sp_leg_mktemp`.** The printed row is `$(sp_leg_row_for TD2 TD4)`. On Linux the leg grades with `sp__td4_grade`, and otherwise with `sp__td2_grade`, unchanged.
  - Its two sessions, its `printenv TMPDIR` step and its `Bash(mktemp:*)` departure are the same on both platforms.
  - Its clean-up loop already registers a created file and removes a created empty directory. It now runs on the Linux paths too. Nothing changes there.
- [ ] **`sp_leg_gates`.** The T2 line prints row `$(sp_leg_row_for T2 T3)`, and every `not run` path of that half prints the same row. W7 is unchanged.
- [ ] **`sp__t2_grade`'s `fail` evidence**, the `grep -m 1 -F` over the lane log. When `"${SP_PLATFORM:-}" = linux`, the patterns `Read-only file system` and `failed to create file via template` are added after `mkstemp failed` and `Operation not permitted`. The macOS pattern list and its order are unchanged. The function's grading, from the lane's `.verdict`, is unchanged.
- [ ] **The header.** It names TD4 and T3, TD3 as TD4's expectation, `sp__td4_grade` in `THE GRADING FUNCTIONS` with its signature, and the Linux log strings.

**Verification:**

- The type check passes.
- `grep -n 'sp_leg_row_for' scripts/lib/sandbox-probe/legs-local.sh` shows exactly the two call sites, one for TD2/TD4 and one for T2/T3. No other row literal in the file changed: `git diff -U0 scripts/lib/sandbox-probe/legs-local.sh | grep -E '^[-+].*\b(TD2|T2|W7)\b'` shows only lines this task names.
- `sp__td2_grade`'s body is unchanged: `git diff` shows no hunk inside it.
  - **Deviations from plan:** `sp__t2_grade`'s fallback evidence, used when no log line matches, names the patterns it searched for. On Linux it now lists the two added strings too, so it does not claim a search it did not make. The macOS text is byte-identical. Also checked with a throwaway `.mjs` probe run through `scripts/scratch-run.sh` under `/bin/bash` 3.2: seven synthetic TD4 streams (pass; bare refused at `sandbox`; `-t` written; unknown error on `-d`; explicit refused at `permission`; `-d` absent; bare outside TMPDIR) graded pass / fail / fail / not run / not run / not run / fail, and the T3 log search quoted a `Read-only file system` line on Linux. The probe file is left at `harness-runs/scratch/td4_probe.mjs`, which is ignored, because the `rm` was refused.
</content>
</invoke>
