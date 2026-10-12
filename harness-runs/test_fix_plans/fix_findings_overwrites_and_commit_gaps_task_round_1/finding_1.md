### 1. Bare plugin-command spellings in `docs/work-report-research/` fail gate 6d

**Site:** `docs/work-report-research/` (11 files, listed below). The grep anchor for every site is a backtick-quoted bare spelling such as "`/branch-qa-test`", "`/branch-review`" or "`/branch-start-plan`".

**Failing test:** none — test (gate 6d, `plugin command spellings carry the prefix`, run by `scripts/run-gates.sh` through `scripts/check-command-spelling.sh`)

**Failure, from the log:**

```
  FAIL  6d plugin command spellings carry the prefix (exit 1)
        check-command-spelling: docs/work-report-research/branch-reviewer.md:47 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/branch-reviewer.md:167 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/branch-reviewer.md:207 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/qa-tester.md:36 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/qa-tester.md:144 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/qa-tester.md:145 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/qa-tester.md:151 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/reviews/qa-tester.md:50 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/reviews/skeptic-reviewer.md:52 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/reviews/task-plan-reviewer.md:10 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/skeptic-reviewer.md:51 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/skeptic-reviewer.md:178 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/statistics-plan-writer.md:42 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/statistics-plan-writer.md:43 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/statistics-plan-writer.md:46 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/statistics-plan-writer.md:153 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-reviewer.md:46 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-writer.md:37 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-writer.md:38 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-writer.md:39 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-writer.md:40 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/task-plan-writer.md:196 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/ui-tests-plan-writer.md:46 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/ui-tests-plan-writer.md:48 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/work-report-research/user-review-fix-plan-writer.md:50 — bare command spelling; write /autonomous-sdlc-harness:<name>
```

**Diagnosis.** This failure is new this round. It is the first round, so there is no earlier log. Gate 6d (`scripts/check-command-spelling.sh`) enforces one rule, stated in `docs/development.md` §5 gate 6: every slash spelling of a command this plugin ships must be written `/autonomous-sdlc-harness:<name>`. Concretely, the check `git grep`s every tracked and untracked-unignored file outside its excluded paths for `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. It skips only lines that an entry in its in-script `EXEMPTIONS` table covers.

The research corpus under `docs/work-report-research/` arrived from `main` in `802fe43d docs: work report research (#98)`. It names supervised and autonomous commands bare, for example "(`/branch-qa-test`, supervised)", "supervised `/branch-review`" and "`/branch-status`'s keyword scan". Nothing excludes `docs/` from the scan and no exemption covers these lines, so each one is a finding. None of them is one of the carve-outs `docs/development.md` §5 gate 6 lists: the gate-8 fenced block, a bare spelling quoted as the measured subject of a record, or the watcher's first-message strings. Each one names a command as a referent, which the rule says must be qualified. The cause is in the tree, so the branch can fix it.

**Fix.** At each site, replace every bare spelling `/<name>` with `/autonomous-sdlc-harness:<name>` and leave the text around it unchanged. For example, "`/branch-qa-test`" becomes "`/autonomous-sdlc-harness:branch-qa-test`", and "`/branch-status`'s" becomes "`/autonomous-sdlc-harness:branch-status`'s". Rewrite every bare spelling on a line, not only the first one: some lines carry two.

Leave path citations alone: `plugin/commands/branch-start-plan.md`, `branch-status.md:45`, `commands/branch-start-plan-semi-autonomous.md:21`, and the family noun `branch-*` written without a slash. These do not match the pattern.

Do not add `EXEMPTIONS` entries, and do not edit `scripts/check-command-spelling.sh` or its exclusions. The rule applies to this folder as written.

The bare spellings at each reported line, as they read in the current tree:

- [ ] `docs/work-report-research/branch-reviewer.md` — line 47 "supervised `/branch-review`", line 167 "in supervised `/branch-review`", line 207 "Supervised `/branch-review` never commits the review".
- [ ] `docs/work-report-research/qa-tester.md` — line 36 "(`/branch-qa-test`, supervised)", line 144 "none exists in `/branch-qa-test`", line 145 "A user-initiated `/branch-qa-test` re-run", line 151 "`/branch-qa-test` commits nothing".
- [ ] `docs/work-report-research/reviews/qa-tester.md` — line 50 "Collision claim on `/branch-qa-test` re-dispatch".
- [ ] `docs/work-report-research/reviews/skeptic-reviewer.md` — line 52 "`/branch-status` globs the branch".
- [ ] `docs/work-report-research/reviews/task-plan-reviewer.md` — line 10 "Supervised `/branch-start-plan` drafts the plan inline".
- [ ] `docs/work-report-research/skeptic-reviewer.md` — line 51 "`/branch-status`, which reads", line 178 "`/branch-status`'s keyword scan".
- [ ] `docs/work-report-research/statistics-plan-writer.md` — line 42 "supervised `/branch-review`", line 43 "supervised `/branch-implement-review`", line 46 "supervised `/branch-implement-user-review`", line 153 (three spellings) "supervised `/branch-review` step 6 or `/branch-implement-review` Phase 3" and "supervised `/branch-implement-user-review` Phase 3".
- [ ] `docs/work-report-research/task-plan-reviewer.md` — line 46 "Supervised `/branch-start-plan` drafts inline".
- [ ] `docs/work-report-research/task-plan-writer.md` — line 37 "(from `/branch-start-plan-autonomous`)", line 38 "(from `/branch-start-plan-semi-autonomous`)", line 39 "| `/branch-start-plan` (supervised)", line 40 "| `/branch-answer` |", line 196 "Supervised `/branch-start-plan` never dispatches this agent".
- [ ] `docs/work-report-research/ui-tests-plan-writer.md` — line 46 "from `/branch-qa-test`", line 48 "| `/branch-start-plan` step 9".
- [ ] `docs/work-report-research/user-review-fix-plan-writer.md` — line 50 (two spellings) "supervised (`/branch-start-user-review-fix-plan`) and autonomous (`/branch-start-user-review-fix-autonomous`)".
- [ ] `docs/work-report-research/README.md` — line 122 "`/branch-status`'s keyword scan (it would match "deferred")". The log does not list this line, but it reads the same as `skeptic-reviewer.md:178`, which the log does list, and a `grep -E` of the gate's pattern matches it. Qualify it too, so the folder is consistent and the gate cannot trip on it.

Before finishing, `grep -rnE` the gate's pattern (quoted in the diagnosis) over `docs/work-report-research/`. It should print nothing.
