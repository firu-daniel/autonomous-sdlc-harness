### 1. Bare plugin command spellings in `docs/work-report-research/` fail gate 6d

**Site anchor:** `docs/work-report-research/` — every line below carries a backtick-quoted bare command spelling such as "`/branch-review`" or "`/branch-qa-test`" (verified with `git grep` in the current tree; line numbers are navigation hints only).

**Failing test:** none — test (gate 6d of `scripts/run-gates.sh`, "plugin command spellings carry the prefix", which runs `scripts/check-command-spelling.sh`)

**Failure, as the log reports it** (25 finding lines; the first and last shown, all 25 are listed in the table below):

```
  FAIL  6d plugin command spellings carry the prefix (exit 1)
        check-command-spelling: docs/work-report-research/branch-reviewer.md:47 — bare command spelling; write /autonomous-sdlc-harness:<name>
        ...
        check-command-spelling: docs/work-report-research/user-review-fix-plan-writer.md:50 — bare command spelling; write /autonomous-sdlc-harness:<name>
```

**Class:** first round, no earlier log — not a regression from an earlier fix.

**Diagnosis.** `scripts/check-command-spelling.sh` fails whenever a plugin command (`/branch-…` or `/harness-analyze`) is written with a bare slash instead of `/autonomous-sdlc-harness:<name>`, outside its `EXEMPTIONS` list. The research reports under `docs/work-report-research/` arrived on this branch from `dev` at the merge base `802fe43d` ("docs: work report research (#98)") with bare spellings in prose and tables. They are not exempt, and a citation-only exemption would be wrong because they are ordinary prose. `dev` fixed exactly these lines afterwards in `e5a80daa` ("fix: findings overwrites and commit gaps (#99)"). Apart from the prefix, `dev`'s copies of all 12 files match this branch's byte for byte. So the fix is a prefix-only edit.

**The log is truncated.** `scripts/run-gates.sh`'s `gate()` prints only `tail -25` of a failing gate's output, and the check found 26 lines. The line it dropped is the first one in `git grep` order, `docs/work-report-research/README.md:122`. It is included below. Leave it out and gate 6d fails again next round.

**Fix.** On each line below, put `autonomous-sdlc-harness:` after the leading slash of each listed bare spelling. Example: "`/branch-review`" becomes "`/autonomous-sdlc-harness:branch-review`". Change nothing else on the line. In particular, leave path citations alone: `plugin/commands/branch-start-plan.md`, `commands/branch-…` and `<state_dir>/…/branch-reviewer/…` (e.g. `branch-reviewer.md:163`) stay as they are. The check does not flag them, and `dev` did not change them. Do not add `EXEMPTIONS` entries to `scripts/check-command-spelling.sh`.

| File | Line | Bare spelling(s) to qualify |
|---|---|---|
| `docs/work-report-research/README.md` | 122 | `/branch-status` |
| `docs/work-report-research/branch-reviewer.md` | 47 | `/branch-review` |
| `docs/work-report-research/branch-reviewer.md` | 167 | `/branch-review` |
| `docs/work-report-research/branch-reviewer.md` | 207 | `/branch-review` |
| `docs/work-report-research/qa-tester.md` | 36 | `/branch-qa-test` |
| `docs/work-report-research/qa-tester.md` | 144 | `/branch-qa-test` |
| `docs/work-report-research/qa-tester.md` | 145 | `/branch-qa-test` |
| `docs/work-report-research/qa-tester.md` | 151 | `/branch-qa-test` |
| `docs/work-report-research/reviews/qa-tester.md` | 50 | `/branch-qa-test` |
| `docs/work-report-research/reviews/skeptic-reviewer.md` | 52 | `/branch-status` |
| `docs/work-report-research/reviews/task-plan-reviewer.md` | 10 | `/branch-start-plan` |
| `docs/work-report-research/skeptic-reviewer.md` | 51 | `/branch-status` |
| `docs/work-report-research/skeptic-reviewer.md` | 178 | `/branch-status` |
| `docs/work-report-research/statistics-plan-writer.md` | 42 | `/branch-review` |
| `docs/work-report-research/statistics-plan-writer.md` | 43 | `/branch-implement-review` |
| `docs/work-report-research/statistics-plan-writer.md` | 46 | `/branch-implement-user-review` |
| `docs/work-report-research/statistics-plan-writer.md` | 153 | `/branch-review`, `/branch-implement-review`, `/branch-implement-user-review` |
| `docs/work-report-research/task-plan-reviewer.md` | 46 | `/branch-start-plan` |
| `docs/work-report-research/task-plan-writer.md` | 37 | `/branch-start-plan-autonomous` |
| `docs/work-report-research/task-plan-writer.md` | 38 | `/branch-start-plan-semi-autonomous` |
| `docs/work-report-research/task-plan-writer.md` | 39 | `/branch-start-plan` (the backticked command only, not the `plugin/commands/branch-start-plan.md` path on the same line) |
| `docs/work-report-research/task-plan-writer.md` | 40 | `/branch-answer` |
| `docs/work-report-research/task-plan-writer.md` | 196 | `/branch-start-plan` |
| `docs/work-report-research/ui-tests-plan-writer.md` | 46 | `/branch-qa-test` |
| `docs/work-report-research/ui-tests-plan-writer.md` | 48 | `/branch-start-plan` (the backticked command only, not the `plugin/commands/branch-start-plan.md:46` path on the same line) |
| `docs/work-report-research/user-review-fix-plan-writer.md` | 50 | `/branch-start-user-review-fix-plan`, `/branch-start-user-review-fix-autonomous` |

- [ ] Qualify the 30 bare spellings on the 26 lines above.
- [ ] Optional cross-check, read-only: `git diff dev -- docs/work-report-research` should then print nothing. `dev`'s `e5a80daa` made the same prefix-only edits.
- [ ] Optional cross-check, read-only: `git grep -nE` with the `PATTERN` copied from `scripts/check-command-spelling.sh` over `docs/work-report-research` should print nothing. This is a plain search, not a gate run. Phase G re-runs gate 6d itself.
