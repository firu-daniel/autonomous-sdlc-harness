### Task 1 — Rename `latency_row`'s `$label` parameter and audit both run-analytics `jq` templates against the 1.5 floor

**Goal:** Make both shipped run-analytics programs parse and run on every jq from the declared 1.5 floor up. Start with the measured failure: `run-analytics-report.jq` → `latency_row($label)` is a compile error on jq 1.6 (`syntax error, unexpected label, expecting IDENT`) because `label` is a keyword there.

**Where this task stops.** This task edits only the two templates under `cli/templates/scripts/lib/`.
- The self-adopted copies under `scripts/lib/` are **Task 3's**. Task 3 copies this task's result byte for byte, so finish both templates here.
- The automated guard that keeps these constructs out is **Task 2's**. It scans these files for a keyword used as a `$` binding, a `.` field or an object key, and for an `if` without an `else`, so leave neither class anywhere in either file, comments excepted.

### Targets

- `cli/templates/scripts/lib/run-analytics-report.jq`
- `cli/templates/scripts/lib/run-analytics.jq` (audit. Edit it only where the audit finds a construct newer than 1.5)

**Work:**

- [ ] `run-analytics-report.jq` → `latency_row`: rename the parameter `$label` to `$row_label`, both in the `def` and at its one use inside the body. The two call sites, `latency_row("all")` and `latency_row($x)`, pass by position and need no change.
- [ ] Audit **both** programs end to end for anything newer than jq 1.5, not only the keyword class:
  - **Keywords used as identifiers.** `as`, `def`, `module`, `import`, `include`, `if`, `then`, `elif`, `else`, `end`, `and`, `or`, `reduce`, `foreach`, `try`, `catch`, `label`, used as a `$` binding, a `.` field, or a key in `{…}` object construction. `$__loc__` is 1.5 and is allowed.
  - **Every `if`** has an `else`.
  - **Builtins and syntax the headers already rule out.** No regex (`test`, `match`, `capture`, `sub`, `gsub`, `splits`, `scan`), no `ceil` / `round` / `abs`, no unary minus, no `$__loc__`, no `utf8bytelength`, no `$ARGS.named`. Also none of the later additions: `$ENV`, `walk`, `halt`, `halt_error`, `@base32d`, `pick`, `toarray`, `trim` / `ltrim` / `rtrim` (`ltrimstr` and `rtrimstr` are 1.5 and allowed), `add(f)`, `debug(msg)`, the `?//` destructuring alternative.

  Fix any hit the same way as the rename: same behaviour, a 1.5 spelling. Record each one, with its anchor (function name and quoted substring), in this file's `Deviations from plan`. Record "no other construct found" if that is the result.
- [ ] Extend each program's `# Floor: jq 1.5 —` header line with the two relaxed-syntax rules: *no jq keyword as a `$` variable, `.` field or object key (jq 1.7 accepts one, jq 1.6 does not)*, and *every `if` has an `else`*. Keep each header's existing list.

**Verification:**

- `jq -n --arg mode markdown -f cli/templates/scripts/lib/run-analytics-report.jq` stops with the document check's own error, `input is not a run-analytics document`, and not with a `compile error` or `syntax error`. That shows the program compiles on the host jq.
- `run-analytics.jq` compiles the same way. Pass the `--arg` / `--argjson` values its header's mode lines declare (`--arg mode sessions --argjson idle_threshold_s 60`, plus any other `$` name the program references). Then check that stderr carries no `compile error` or `syntax error` and that jq did not exit with status `3`.
- `grep -nE '[$.](as|def|module|import|include|if|then|elif|else|end|and|or|reduce|foreach|try|catch|label)\b' cli/templates/scripts/lib/run-analytics-report.jq cli/templates/scripts/lib/run-analytics.jq` finds no hit outside a `#` comment line.
- `git diff --stat` lists no file outside `cli/templates/scripts/lib/`.
