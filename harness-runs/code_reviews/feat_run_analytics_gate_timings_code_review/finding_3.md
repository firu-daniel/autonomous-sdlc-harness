### 3. The two comments explaining why `run-analytics.sh` has no deny-list entry still say it "only appends sessions"

> **Self-contained per-finding file** for the `feat_run_analytics_gate_timings` code-review index (`harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md`). The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**
- `cli/src/generators/outerLoopScripts.ts` (`OUTER_LOOP_SCRIPTS`): the comment above the `run-analytics.sh` row, "can only append sessions to `<state_dir>/run_analytics/<branch>/` for the branch and checkout it"
- `plugin/hooks/autonomous-script-allowlist-guard.sh`: the `LEFT ALLOWED, DELIBERATELY:` header paragraph, "`run-analytics.sh` only appends sessions to `<state_dir>/run_analytics/<branch>/`"

**Problem.** Both comments justify leaving `run-analytics.sh` agent-reachable, with no `DENY_SCRIPT_BASENAMES` entry, by stating everything it writes. After this branch the script also reads `<state_dir>/test_run_logs/<branch>/`. From there it appends a finished Run gates round's gate and test-file rows to the same document, as a schema-2 `rounds` array. The append-only argument still holds: a recorded round is never rewritten (`run-analytics.sh` → `THE MERGE`). So the decision does not change, but both comments now understate what an agent invoking the script can cause to be committed. The story plan's scope register built its derivation from `*.md` / `*.txt` greps, so it never reached these two non-Markdown comments.

**Fix.** Comment text only, in both files. No executable line changes, so no guard decision or per-call cost changes.

1. In `cli/src/generators/outerLoopScripts.ts`, change the comment above `Object.freeze({ file: 'run-analytics.sh', …` to:
   ```ts
   // Run by the watcher after each session. An agent reaching it through the script-allowlist guard
   // can only append sessions, and the finished Run gates rounds it reads from the branch's
   // `<state_dir>/test_run_logs/` lane, to `<state_dir>/run_analytics/<branch>/` for the branch and
   // checkout it names, and never rewrites a recorded one, so `false` is a calling convention and it
   // carries no `DENY_SCRIPT_BASENAMES` entry.
   ```
2. In `plugin/hooks/autonomous-script-allowlist-guard.sh`, change the two lines
   ```
   # `run-analytics.sh` only appends sessions to `<state_dir>/run_analytics/<branch>/`
   # for the branch and checkout it is given, and never rewrites a recorded one.
   ```
   to
   ```
   # `run-analytics.sh` only appends sessions, and the finished Run gates rounds it
   # reads from the branch's `<state_dir>/test_run_logs/` lane, to
   # `<state_dir>/run_analytics/<branch>/` for the branch and checkout it is given,
   # and never rewrites a recorded one.
   ```

Neither file is a test file this fix creates or edits, so the fix runs no test.
