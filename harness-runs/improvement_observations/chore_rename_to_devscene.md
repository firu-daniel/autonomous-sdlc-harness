## The unattended profile write-denies `examples/notes-app/.mcp.json`, so a one-string Must Fix parked the run for a hand edit
- **category:** tooling-gap
- **evidence:** `harness-runs/clarifications/chore_rename_to_devscene/question_3.md` (Phase C, code-review Finding 1) records every agent `Edit` of `examples/notes-app/.mcp.json` refused with "Permission to use Edit has been denied because Claude Code is running in don't ask mode" — twice during Task 27 and three times during the Finding 1 fix — and states the repository's own `.claude/settings.json` carries no rule for that path. The run parked; the operator made the line-2 `_comment` edit by hand (answer 3, option (a)); the resumed session's `layer-implementer` only verified it and commit `44423076` landed it.
- **cost this run:** one park and one resume for a two-substring JSON-comment edit; the Must Fix shipped only through an operator hand edit.
- **hypothesis:** (guess) the profile's deny for `examples/notes-app/.claude/**` or `.mcp.json` patterns reaches this example file too.

## Corpus staleness raised by the plan: two `stale-rule` entries
- **category:** tooling-gap
- **evidence:** `harness-runs/story_plans/chore_rename_to_devscene_story_plan.md` → `## Corpus staleness` carries two `stale-rule` entries: `.claude/context/conventions.md` → `## The layers`, the `cli` row, which names the npm package `autonomous-sdlc-harness` that Task 1 renamed to `devscene`; and `.claude/context/cli.md`'s opening `**Read this when:**` line, which names the same package. (The planning half ran in an earlier session of this run; the entries are taken from the committed story index, not from the writer's return.)
- **cost this run:** each owes a follow-up restatement — a maintainer hand edit with the exact whole-line replacement the story index quotes, before merge; until then the done-when search still lists both lines.

## The plan needed 6 review rounds across its two plan-review roots
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/chore_rename_to_devscene/` holds `review_0.md`–`review_2.md` and `harness-runs/architecture_reviews/chore_rename_to_devscene/` holds `review_0.md`–`review_2.md` (business-parity root not run, `phases.parity` false) — 6 rounds in total. Per round, by finding title against the same root's predecessor: task-plan round 0 — 5 findings; round 1 — 3 net-new, 0 re-raised; round 2 — 1 net-new, 2 re-raised (its Should Fix re-raises round 1's unapplied Task 14 Should Fix; its Nice to Have re-raises round 1's `## Corpus staleness` line-coordinate note). Architecture round 0 — 3 findings; round 1 — 0 net-new, 2 re-raised (both round-0 Should Fixes "neither applied nor recorded"); round 2 — 1 net-new, 0 re-raised.
- **cost this run:** 6 plan-review dispatches plus their writer revisions; 4 of the 9 later-round findings were re-raised because the prior round's fix had not landed or been recorded.

## One unit commit staged only the readiness index and its own detail file
- **category:** optimization
- **evidence:** commit `b2dc56d7` — `chore: Mark Task 28 done — task plan notes appended` — staged `harness-runs/story_plans/chore_rename_to_devscene_story_plan.md` and `harness-runs/task_plans/chore_rename_to_devscene/task_28_plan.md` only (Task 28's deliverable is a `## Paste record` for maintainer-owned `.claude/**` files).
- **cost this run:** Task 28 landed no work file; its deliverable is a manual paste the maintainer owes before merge.
