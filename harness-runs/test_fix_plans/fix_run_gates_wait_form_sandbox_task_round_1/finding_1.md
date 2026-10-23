### 1. Respell `unparseable` in the `hr_sandbox_opted_out` doc comment

**Site:**
- `cli/templates/scripts/lib/harness-run-lib.sh` — the doc comment directly above `hr_sandbox_opted_out() {`, the line reading `# including every \`hr_config_load\` failure — an absent, unparseable or` (near line 2007).
- `scripts/lib/harness-run-lib.sh` — the same comment line above the same function (near line 2007). This is the repository's self-adopted rendering of the template, and the two files are currently byte-identical.

**Failing test:** `scripts/run-gates.sh` (via `scripts/check-typos.sh`) — `6f shipped files pass typos`

**Failure (from the log):**

```
  FAIL  6f shipped files pass typos (exit 1)
        check-typos: cli/templates/scripts/lib/harness-run-lib.sh — unparseable
```

**Diagnosis:** this is the first round, with no earlier logs to compare against. Gate 6f runs `typos 1.51.1` over `cli/templates`, `plugin`, `schemas` and `cli/src`, and fails on any hit that is not in the deliberate set hard-coded in `scripts/check-typos.sh`, which is keyed on file and word. `typos` flags `unparseable` and suggests `unparsable`. The deliberate set allows `unparseable` only in `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts`. It allows it there because the word is part of exported identifiers (`UNPARSEABLE_CONTROL_RELEASES`, `unparseableControlRoute`) that cannot be renamed locally.

The hit in `cli/templates/scripts/lib/harness-run-lib.sh` is plain comment prose in the `hr_sandbox_opted_out` doc comment, not an identifier. Nothing imports or matches the word there, so it does not qualify for the allowlist. The same file already uses the accepted spelling elsewhere (`# unparsable \`usage-state.json\` reads as …`). The line came in from the base branch, but it is still this branch's to fix. `scripts/lib/harness-run-lib.sh` is outside the trees gate 6f scans, but it carries the same line and must stay in step with its template.

**Concrete fix:**
- [ ] In `cli/templates/scripts/lib/harness-run-lib.sh`, in the comment above `hr_sandbox_opted_out() {`, change `an absent, unparseable or` to `an absent, unparsable or`. Change no other text.
- [ ] Make the identical one-word edit on the same line of `scripts/lib/harness-run-lib.sh`, so that the self-adopted copy stays byte-identical to the template.
- [ ] Do **not** add a `cli/templates/scripts/lib/harness-run-lib.sh|unparseable` entry to the `case` in `scripts/check-typos.sh`. The deliberate set is reserved for words a file cannot respell, and the comment in `scripts/check-typos.sh` documents that rule.
- [ ] Afterwards, `grep -n "unparseable" cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` should print nothing.
