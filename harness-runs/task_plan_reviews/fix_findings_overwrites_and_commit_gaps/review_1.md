# Task plan review — iteration 1

Both Must Fix findings from iteration 0 are resolved:
- Tasks 3, 5 and 7 now rename the agent-side quoted blocks, and rows 26, 30, 39 and 40 are widened.
- Task 17 now uses the unsuffixed-index rule.

I re-ran every derivation entry (E1, E1b, E1m, E2, E3, E4, E5) and re-walked E6. Every site each entry reaches appears as a row, so closure holds for the entries as written. The findings below are new.

## Must Fix

1. **Tasks 5 and 7 verify "byte-identical" quoted blocks that their own scope cannot make identical** — files: `task_5_plan.md`, `task_7_plan.md`.
   Both tasks limit the agent-side edit to the `iteration:` line:
   - Task 5 → Targets: "sub-case **(c) Insertion point 4** fenced block, its `iteration:` line only";
   - Task 7 → Work: "change the quoted fenced block's `iteration: <iteration>` to `iteration: <review_index>`".

   Yet both verifications assert that the whole quoted block is byte-identical to the caller's block:
   - Task 5: "Each quoted block is byte-identical to its caller block";
   - Task 7: "the quoted fenced block in `plugin/agents/layer-reviewer.md`, which is byte-identical to the caller's block".

   The blocks already differ on other lines, so changing only the `iteration:` line cannot meet that check:
   - **G.2 vs insertion point 4.** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan` passes `prompt_path: <log>`. `plugin/agents/architecture-reviewer.md` → sub-case (c) quotes `prompt_path: <test log path>`.
   - **Unit loop vs layer-reviewer.** The caller's block in `plugin/instructions/unit_loop_core.md` → `### Per-unit review step` is `<the row's `Review prompt first line`>` / `task_file: <the row's `Detail file`>` / `task_heading: <the row's `Heading source`>` / `findings_folder: <the row's `Per-item findings folder`>` / `iteration:` / `context_notes: …`.
     `plugin/agents/layer-reviewer.md` → `## Invocation contract` quotes `<the flow's review prompt first line>` / `task_file: <task_file>` / `task_heading: <task_heading>` / `findings_folder: <findings_folder>` / `iteration:`, with no `context_notes:` line. So the agent block is a schema with its own placeholder names, not a verbatim quote.

   The implementer then has two choices: fail the verification, or edit lines outside the task's stated scope. The plan must not leave that open.

   **Fix:**
   - In `task_5_plan.md`, do one of these:
     - add `prompt_path: <test log path>` → `prompt_path: <log>` in the sub-case (c) block to Targets and Work, so the byte-identical check can pass; or
     - narrow the verification to "the `iteration:` line of each quoted block matches its caller's `iteration:` line" for the insertion-point-4 block.

     The B.2 / C2.2 blocks in `review-plan-reviewer.md` do match their callers line for line, apart from indentation, so the byte-identical claim can stay for them.
   - In `task_7_plan.md`, replace "byte-identical to the caller's block" with "its `iteration:` line reads `iteration: <review_index>`, matching the caller's `iteration:` line". The two blocks use different value placeholders by design.

2. **Task 7 leaves `layer-reviewer.md`'s `## Resolved values` declaration stale, and its own verification forbids the fix** — files: `task_7_plan.md`, and the story index (`fix_findings_overwrites_and_commit_gaps_story_plan.md`) → `## Scope register` row 30.
   The lead sentence of `plugin/agents/layer-reviewer.md` → `## Resolved values` lists the placeholders that the fenced block declares: "`<task_file>` / `<task_heading>` / `<findings_folder>` / `<iteration>` (the fenced dispatch block in that same section)".

   After Task 7 renames that block's `iteration: <iteration>` to `iteration: <review_index>`, two things break:
   - the sentence still says `<iteration>` resolves from a block that no longer carries it;
   - `<review_index>` is declared nowhere in the agent.

   `.claude/context/plugin.md` → `## The placeholder vocabulary` says a placeholder's spelling is its identity, and `## The sections an asset carries` says how `## Resolved values` declares path placeholders. Both are broken here. This is the same class of stale quoting site that iteration 0's Must Fix 1 raised.

   Task 7's verification makes it worse. It says "`git grep -n '<review_index>' -- plugin cli/templates docs` shows the binding and its uses in `unit_loop_core.md` plus **exactly one other site**". So an implementer who correctly adds `<review_index>` to the lead sentence fails the check.

   Row 30 lists `description:`, the `iteration` row and the quoted block, but not the `## Resolved values` lead sentence.

   **Fix:**
   - In `task_7_plan.md`, add a Work clause to the existing `layer-reviewer.md` bullet. Keep the bullet count at 5. The clause changes `<iteration>` to `<review_index>` in the `## Resolved values` lead sentence's list of fenced-block placeholders. Leave the `review_{iteration}.md` / `iteration {iteration}` template tokens alone.
   - Widen the `<review_index>` verification grep so it expects that second `layer-reviewer.md` hit.
   - In the story index, add `## Resolved values` lead sentence to row 30's site cell, owned by Task 7.

3. **The scope register's derivation is under-inclusive: `cli/templates/state-dir/qa_reviews/README.md` is a verified missing site** — files: the story index (`fix_findings_overwrites_and_commit_gaps_story_plan.md`) → `## Scope register` entry E3 and its rows, plus the cli-layer task that takes the row (`task_1_plan.md` or `task_2_plan.md`).
   No derivation entry reaches this README. Its text describes the outcome Tasks 11–14 redefine:
   - "recording each test as **passed, failed or blocked**";
   - "A test the environment prevented driving — no credentials for an auth-gated surface, an account another session holds, a backend failure that cannot be induced without request mocking — is recorded `blocked`";
   - "An index appears only on a round with something to report".

   After this branch:
   - a blocked test writes no file (`error: blocked — test <T>: …`, Task 11 shape 2);
   - a round of passes plus blocked tests is a Round PASS that writes no index (Task 12);
   - blocked tests are recorded only in a FAIL round's merged-index Context roll-up and in D.2.

   The register already admits this class of site. Row 52, `cli/templates/claude/qa_test_scenarios.md`, which also describes the `blocked` outcome, is in the register because E3 matches "report .?blocked". The qa_reviews README says "recorded `blocked`" and "failed or blocked" instead, which E3's patterns miss.

   A wider E3 reaches exactly one new site, this README. All other hits are unchanged:
   `git grep -l -E -e 'record a finding' -e 'documented assumption' -e 'report .?blocked' -e 'Round PASS' -e 'per-test .?error:' -e 'QA passed \(' -e 'recorded .?blocked' -e 'failed or .?blocked' -e 'pass/fail/blocked' -e 'as .?blocked' -- plugin cli/templates`

   (Iteration 0 graded this a Should Fix. It is re-graded here because a verified missing site is always the single under-inclusive-derivation finding.)

   **Fix:**
   - In the story index, replace E3 with the wider command above.
   - Add a row for `cli/templates/state-dir/qa_reviews/README.md` ("recorded `blocked`"), evidence E3, with one of these dispositions:
     - `change`, owned by a cli-layer task. Task 1 is the natural home: add a Work bullet stating where a blocked test is now recorded, namely the FAIL round's merged-index Context roll-up and the Done summary, with no per-test file and no index on a blocked-plus-pass round. Watch Task 1's 5-bullet and 20-point ceilings;
     - `no-change`, with a reason that holds against the text quoted above.
   - If no self-adoption copy `harness-runs/qa_reviews/README.md` exists, no E1m row is owed. If one exists, add its mirror row.

## Should Fix

1. **Task 12 does not narrow E.1's early-exit parenthetical, which Task 13 does for the supervised flow** — file: `task_12_plan.md`.
   `### E.1` ends with "do not branch the **round** verdict until you have looped every still-`[ ]` test in the index (except on an `error:` — see E.2)". A blocked return begins with `error:`, so a literal reader exits the loop on the first blocked test. That is the hazard Task 13 names explicitly for `qa_test_instructions.md` → `### 3.` ("Without this edit step 3 exits the loop on the first blocked test"). Task 12's E.1 bullet only adds the blocked line to the "Collect…" list of return shapes. Add the same narrowing to E.1: "except on an unmarked `error:`, one not beginning with `error: blocked — `".

2. **Task 12's first verification still expects D.2 to carry the wire literal** — file: `task_12_plan.md`. This was iteration 0's Should Fix 3 and is still open. The D.2 clause is `; N test(s) blocked — Test <T> — <cause>[, …]`, which never contains `error: blocked — `. Drop D.2 from that grep's expected hits, or check D.2 with its own grep.

3. **Task 4's "exactly" grep count may contradict its own entry 13** — file: `task_4_plan.md`. This was iteration 0's Should Fix 4 and is still open. Say whether entry 13 quotes the subject `chore: Record lessons for <branch>`. If it does, allow that hit in the `Record lessons for` grep.

4. **Task 6 cites `## Final entry — INDEX`; the heading is ``## Final entry — `INDEX` ``** — file: `task_6_plan.md`. This was iteration 0's Should Fix 2 and is still open. Quote the heading with its backticks, because Task 6's own verification checks pointers byte for byte.

5. **Task 2's verification grep misses two files' numbering wording** — file: `task_2_plan.md`. `task_plan_point_reviews/README.md` and `test_fix_point_reviews/README.md` say "`<i>` starts at `review_0.md` and increments once per failed review", not "numbered from `review_0.md`". The Work bullet covers them ("or the equivalent" is implied by "Rewrite it"), but the verification grep (`numbered from .?review_0`) cannot see them. Add `-e 'starts at .?review_0'`.

6. **Task 4's entry 13 does not extend the `**Post-commit push.**` paragraph** — file: `task_4_plan.md`. Task 16 extends that paragraph's list of direct-`git` pushes for its entry 14, but Task 4 does not do the same for Override 5's `push-branch.sh` call. Entry 6's push is already missing from that list, so this is not a new break. Still, either add the Override 5 push in Task 4, or say why the list is not exhaustive.

## Nice to Have

1. **Task 11 promotes a missing identity attribute to a QA FAIL, and Task 12 does not name the consequence** — files: `task_11_plan.md`, `task_12_plan.md`. A shape-1 FAIL with `must_fix_count: 0` makes E.2 a Round FAIL. That opens an E.3 fix loop for a Should Fix, and the loop counts toward `MAX_QA_ROUNDS`. The design is defensible. One sentence in Task 12's E.2 bullet would stop an implementer from treating it as an unintended regression: Round FAIL fires on any FAIL, including a Should-Fix-only one.
