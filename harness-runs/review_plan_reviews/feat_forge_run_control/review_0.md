# Review plan meta-review — iteration 0

The seven findings check out. Every cited site and quoted substring resolves on the branch tip. The claims match the code and the research: C2's merge-commit quote and the `ref=refs/pull/2/merge` log, `HARNESS_TRIGGER_LABEL` mapped only in `harness-trigger.yml`, the `Forge-agnostic` string gone from `README.md`, the `secretNames?.has(...) === true` fall-through, the Unicode-arrow setting path in `verb_deliver`, the four-verb `deliver_pr_body` line, and the exit-map line 1. Readiness entries, index pointers and `finding_<N>.md` files correspond 1:1 (7/7/7), and the unsuffixed index matches its unsuffixed folder. No finding asks for a forbidden test run, and none carries an unreachable phase gate. The two Must Fix items below are both gaps in the index, not in any finding.

## Must Fix

1. **The `plugin` layer is touched, but the review shows neither a finding nor a clean-pass rationale for it.** Refers to "Structure". The file is the index, `harness-runs/code_reviews/feat_forge_run_control_code_review.md`.
   The diff touches `plugin/agents/user-review-fix-plan-writer.md`, `plugin/docs/AUTONOMOUS_FLOW.md` and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`. The Context bullet for `plugin` only lists those files. It names nothing checked against `.claude/context/plugin.md`, and no finding cites that document, so the review is silent on a layer the diff touched. The checks that apply to this diff:
   - the new `<scripts_dir>` row's `Class` value (`## The placeholder vocabulary`);
   - the wire strings the new **Pull-request review comment** form quotes from `remote-run.sh`'s `control` paragraph: `## Inline comments`, `(The review carries no summary.)`, `original line <n> (outdated)`, ``Made on commit `<sha>`.`` (`## Wires: dispatch in, return out`; `.claude/context/conventions.md` → `### The order files are created…`, the quoted-literal rule);
   - the rule that no adopter value appears as a literal under `plugin/`, applied to `@sdlc-harness` and `sdlc-harness: <state>` (`## What this layer is`);
   - the out-of-plugin citation form for `<scripts_dir>/remote-run.sh` (`## Citation`).

   This meta-review spot-checked those and found them consistent, so no new finding seems owed. The review itself still has to say so.
   **Fix:** In the index's `## Context`, extend the `**`plugin`:**` bullet with a clean-pass sentence. It names the `.claude/context/plugin.md` checks applied to the three plugin files (the four above, or the ones actually run) and their outcome. If one of them does not hold, add it as a new `finding_8.md`, with its pointer and a readiness entry tagged `_(layer: plugin)_`.

2. **The diff exhibits several lessons-ledger categories, but no finding or clean-pass rationale covers them.** Refers to "Structure". The file is the index, `harness-runs/code_reviews/feat_forge_run_control_code_review.md`.
   `harness-runs/lessons.md` has rules this diff plainly exercises:
   - *Unattended control loops*, the bounded-retry rule: `deliver`'s one retry without `--draft`, and the label-create retry in `report`.
   - *Unattended control loops*, the expiring-store rule: `control`'s `paused:expired` arm for `answer` and `resume`.
   - *Remote and branch-scoped operations*, the single-branch rule: `control` resolves one branch.
   - *Remote and branch-scoped operations*, the temporary-working-copy rule: the `mktemp -d` directories in `report`, `deliver` and `control`, and `review`'s cut copy.
   - *Remote and branch-scoped operations*, the act-where-it-lives rule: the review round is placed on the branch by the job.

   The story index's scope register lists these as constraints the tasks honour (rows 53–57). The review never says whether the code it graded actually honours them, so a reader cannot tell a checked category from a skipped one.
   **Fix:** In the index's `## Context`, add one sentence or short bullet naming each ledger rule the diff exhibits and the site that satisfies it. For example: "`deliver` retries once and then comments; `paused:expired` is refused naming the expiry; every `mktemp` directory is removed on each exit path." If any rule does not hold, record it as a new `finding_<N>.md` with its pointer and readiness entry instead.

## Should Fix

1. **Finding 4's TypeScript snippet does not compile under `strict`.** Refers to review finding #4. The file is `harness-runs/code_reviews/feat_forge_run_control_code_review/finding_4.md`.
   `secretNames` is declared at `cli/src/doctor/checks.ts` as `ghJsonEntries(...)` or `undefined`. The snippet's second arm is `} else if (!allowed && secretNames.has(GIT_TOKEN_SECRET)) {`. The first arm tests `!allowed && secretNames === undefined`. Because that test is a conjunction, its else-branch does not narrow `secretNames`. So `secretNames.has` is a possibly-undefined access that `commands.typecheck` rejects.
   **Fix:** In `finding_4.md`, write the second arm as `} else if (!allowed && secretNames?.has(GIT_TOKEN_SECRET) === true) {`, which keeps the existing condition. Alternatively, restructure the block as `if (!allowed) { if (secretNames === undefined) … else if (secretNames.has(…)) … else … }` so the narrowing holds.
