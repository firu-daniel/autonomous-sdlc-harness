## Task 5 closed without a fix: the tool layer refused the fixture write under `.claude/**`
- **category:** tooling-gap
- **evidence:** commit `af4a93cb`, subject `fix: Record disposition of Task 5 — tool-layer guard refused the write to examples/notes-app/.claude/settings.autonomous.json under .claude/**` (the cause recorded on the commit). Diagnosis and the one-paste operator remedy: `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix; `examples/notes-app/.claude/settings.autonomous.json` and `examples/notes-app/README.md` are unchanged and the remedy is owed by the operator.

## The run copy has no local `<default_branch>` ref, so `git log dev..HEAD` fails
- **category:** tooling-gap
- **evidence:** at Phase D this session ran `git log --format='%h %s%n%b' --name-only dev..HEAD` and it exited 128 with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`; re-run against `origin/dev..HEAD` it succeeded. The `branch-reviewer` (Phase B) and `statistics-plan-writer` (Phase D.1) returns each reported the same missing local `dev` and fell back to `origin/dev` on their own.
- **cost this run:** three independent fallbacks to `origin/dev`, each decided per agent rather than by contract.
- **hypothesis:** (guess) every run copy cut from `origin/<default_branch>` lacks the local ref, so any contract naming `<default_branch>..HEAD` hits this.

## The first Run gates round failed on a test already broken on the base commit
- **category:** silent-failure
- **evidence:** `harness-runs/test_fix_plans/fix_run_analytics_jq16_task_round_1.md` → Finding 2: `cli/test/task-offer-fence.test.mjs` "the accepted stricter case: a registered clone with a config.worktree is silent" failed under bash and zsh (`# fail 5` in `harness-runs/test_run_logs/fix_run_analytics_jq16/task_round_1.log`); the writer attributes the cause to the base commit `66e1e6c5` (#224), not this branch. Fixed on this branch by `a3709552`.
- **cost this run:** one of the five gate rounds, about 35 minutes of suite time, plus a test-fix-plan-writer, an architecture gate, two implementer and three committer dispatches.

## An implementer's mutation check edited a shipped template in place
- **category:** agent-contract
- **evidence:** the Task 2 `layer-implementer` return (Phase A) stated: "The mutation check edited the template directly rather than going through a probe file under `harness-runs/scratch/` as the probe route asks, and it is not recorded in the detail file." The edit was reverted before the commit (`30403a0a` lists only `cli/test/jq-floor.test.mjs` and the story index).
- **cost this run:** none landed; the unrecorded in-place edit is visible only in the session transcript.
