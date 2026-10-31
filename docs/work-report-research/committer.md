# Work report research — committer

## Verdict

**Do not recommend** a work report for the committer itself. Recommend the thinning, and make one required change to how the committer stages *other* agents' reports. The commit the committer makes already records everything it does: the staged set is the commit's file list, the subject and body are the message, and the SHA is the commit. The run's progress line also carries `committed: <sha> <subject>`, plus any `already-[x]` / `staged: index-only` / disposition clause from the return (`plugin/instructions/unit_loop_core.md:80`). In the terms of lead 11, the artifact already written and committed is the commit itself. A ticked checklist would only repeat that, and its post-commit ticks cannot be committed without a second commit. The thinning is worth doing on its own merits: `committer.md` is 8 100 words, and about 44 % of them are REDUNDANT. If the harness adopts work reports for the other agents, the committer becomes the agent that commits them. Its stage-set and subject-reconciliation rules then have to change, or the `staged: index-only` signal silently disappears (see Risks).

## Read tree

Paths are relative to the checkout root (from `git rev-parse --show-toplevel`). Word counts are from `wc -w`.

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/committer.md` | up-front (the agent definition) | 8 100 |
| `.claude/CLAUDE.md` (template: `cli/templates/claude/CLAUDE.md`, 1 320) | up-front (auto-loaded into every agent) | 1 695 |
| `<commit_conventions>` = `.claude/context/conventions.md` → `## Commit-message policy` (lines 155–193) | up-front: "the committer reads exactly one section" (`.claude/CLAUDE.md` → `## Context files`) | 585 (whole file: 5 864) |
| `plan_path`: the readiness index | up-front, but it is run data, not prose | n/a |
| `scripts/commit-on-branch.sh` (header **MESSAGE ARGUMENTS**) | on demand (cited at `committer.md:77`) | 2 272 |
| `scripts/push-branch.sh` (this repo; the adopter copy `cli/templates/scripts/push-branch.sh` is 1 903) | on demand (it is executed, not read) | 1 119 |
| `plugin/instructions/unit_loop_core.md` | on demand (cited at `:180`, `:188`) | 9 143 |
| `plugin/instructions/improvement_observations_instructions.md` → `## Dispositioned units` | on demand (cited at `:188`) | 1 251 (file: 9 044) |
| `plugin/agents/qa-tester.md` | on demand (cited at `:8`) | 7 201 |
| `docs/guard-verification.md` §3.1 | on demand, and only in the harness's own repo (`:80`) | 42 067 |

**Up-front total: 10 380 words.** That is 8 100 + 1 695 + 585, using this repository's own filled policy. The worst case is 15 659 words, if the agent reads the whole conventions file instead of the one section. Nothing in `committer.md` tells it how to read only that section (`committer.md:27`). On lead 13, CLAUDE.md does not widen the set: its routing table sends "implementation, review or planning" to `conventions.md`, which the committer does none of, and it states that the committer reads exactly one section. The larger set, 15 659 words, is the worst case. The one-section reading wins on paper.

## Dispatch sites and phases

All dispatches go through `unit_loop_core.md` → `## The unit loop` step 5 (`:79`), or through `plan_orchestration_instructions_core.md` phases (`committer.md:57-63`).

| Mode | Dispatch site / phase id | Times per branch |
|---|---|---|
| `task` | unit loop row `A` (implementation) | once per task, e.g. 14 on `chore_supply_chain_nightly_audit` |
| `review_item` | rows `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3`, `G.4`, `UR-A` | once per finding fixed |
| `review_plan_file` | core `A1.5.2`, `A2.2`, `B.3`, `C2.3`, `E.2` (round FAIL), `G.3` | once per review phase per round |
| `ui_test_pass` | core `E.1` | once per passing UI test |

- **Flows that dispatch it:** the semi-autonomous forks (`plan_orchestration_instructions_semi_autonomous.md`, `user_review_fixes_instructions_semi_autonomous.md`; no `push`) and the autonomous forks (`plan_orchestration_instructions_autonomous.md:42`, `user_review_fixes_instructions_autonomous.md:40`; `push: true`).
- **Flows that do not:** the supervised flow commits directly (`plan_orchestration_instructions.md` step 6). The docs flow, the ledger, statistics, observations, digest and dispatch-additions commit points use `commit-on-branch.sh` directly and never a committer (`autonomous_pause_and_ledger.md` → `### 1.6`).
- **Volume:** on a typical branch the committer is the most-dispatched agent after the implementer, at roughly 20–40 dispatches.

## Prose classification

All counts are against `plugin/agents/committer.md` (`sed -n 'a,bp' | wc -w`). The other two up-front files are adopter-owned or shared. They are not classified here: they are not the committer's to thin.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter 1–6 | 61 | 0 | 0 | 61 | 0 | `tools: Bash, Read, Edit`, parsed by Claude Code |
| Intro 7–14 | 173 | 60 | 50 | 0 | 63 | restates the `ui_test_pass` split that Process restates again |
| `## Resolved values` preamble 16–20 | 242 | 0 | 42 | 0 | 200 | lists placeholders it does *not* declare, plus the "two absences" rationale |
| Resolved table 21–28 | 354 | 0 | 200 | 0 | 154 | the `<repo_root>` row restates the CLAUDE.md checkout-root rule |
| `## Invocation contract` args/modes 29–45 | 1 051 | 0 | 300 | 450 | 301 | WIRE: arg names, mode names, entry shapes `N. [ ] **Task K** —`; folder derivation repeated in step 3 |
| `commit_prefix` 46–48 | 368 | 0 | 150 | 30 | 188 | WIRE: `none`, the `fix` fallback. Inbound readers: `plan_orchestration_instructions.md:84-86` and `unit_loop_core.md:277` read "`committer.md`'s own contract for the `commit_prefix` argument", so the three-state rule (designated token / `none` / `fix` when the policy is silent) must survive |
| `push` / `disposition` / `already_passing` 49–51 | 300 | 0 | 120 | 40 | 140 | the push semantics are restated in steps 6 and h |
| `### Which caller sends which mode` 53–65 | 313 | 0 | 0 | 0 | 313 | "Restated from the dispatching flows" (`:55`). Two owners: `unit_loop_core.md:196-207` for `task` / `review_item` (rows 1–3), and `plan_orchestration_instructions_core.md:481,509` and phases A1.5.2 / A2.2 / B.3 / C2.3 / E.2 / G.3 for `review_plan_file` / `ui_test_pass` (rows 4–5) |
| Scope note + unreadable path 66–69 | 150 | 55 | 0 | 0 | 95 | the scope note is maintainer classification |
| `## Commit-message policy` intro 71–73 | 82 | 0 | 82 | 0 | 0 | |
| Free-form / fixed-form 74–76 | 214 | 30 | 0 | 60 | 124 | WIRE: `chore: add code review for <branch>` and `chore: Mark UI test K passing for <branch>`, quoted by `plan_orchestration_instructions_core.md:509` and `.claude/context/conventions.md:172-186` |
| Wrapper-safe subjects 77–81 | 465 | 60 | 205 | 0 | 200 | guard-scan nuances (`2>&1`, `/dev/null`) belong to the wrapper header |
| Attribution trailer 82 | 94 | 20 | 0 | 0 | 74 | |
| Subject reconciliation 83–89 | 770 | 120 | 250 | 200 | 200 | WIRE: `record disposition of `, ` — `, `mark <unit> done — `, `mark <unit> already passing — `, parsed by `improvement_observations_instructions.md:72,91-93` |
| Argument guard + routing 91–96 | 152 | 50 | 0 | 15 | 87 | |
| Standard step 1, 97–103 | 232 | 60 | 70 | 0 | 102 | |
| Step 2, 104–109 | 380 | 120 | 120 | 60 | 80 | WIRE: `already-[x]: … — not flipped by this committer`, the no-match error |
| Step 3, 110–114 | 634 | 150 | 250 | 0 | 234 | |
| Step 4, 115–125 | 518 | 80 | 100 | 120 | 218 | WIRE: wrapper call shape, `commit-on-branch.sh: committed <short_sha> on <branch>`, exit 0/3/other |
| Steps 5–6, 126–132 | 185 | 70 | 0 | 20 | 95 | |
| `### ui_test_pass procedure` intro 134–138 | 70 | 0 | 0 | 0 | 70 | |
| ui a–e, 139–149 | 290 | 110 | 0 | 30 | 150 | a near-copy of steps 1–2 |
| ui f, 150–158 | 326 | 40 | 0 | 60 | 226 | the exit map and absolute-path trap are stated a second time |
| ui g–i, 159–164 | 151 | 30 | 0 | 0 | 121 | a copy of steps 5–6 |
| `## Output contract` 166–180 | 157 | 0 | 37 | 120 | 0 | parsed by `unit_loop_core.md:80` |
| `staged: index-only` 181–189 | 205 | 0 | 80 | 40 | 85 | |
| `noop:` / `error:` 190–204 | 163 | 0 | 0 | 100 | 63 | |
| **Total** | **8 100** | **1 055** | **2 056** | **1 406** | **3 583** | |

ACTION prose is only 13 % of the file. Most of the excess is duplication: `ui_test_pass` is written as a second procedure, and the exit map, path rules and push rule are each stated two or three times. Rationale written for maintainers is the other large share.

## Draft work report template

This is drafted for completeness. The verdict is not to use it. If it is used, the choice is **one template for all four modes, with `[n/a]` ticks**. Separate per-mode templates would duplicate C1–C3 and C9–C13. Template size: 376 words, fences included.

```markdown
# Work report — committer — <mode> — <task_heading | plan_path>

Tick each item as you finish it. Mark an item that does not apply to this mode `[n/a]`.

- [ ] C1. **Guard the arguments** — Flipping mode without `task_heading`: return `error: task_heading required for mode <mode>`; stop. (ref: committer.md → ## Process)
- [ ] C2. **Read every cited path** — Read `plan_path` and `<commit_conventions>`; an unreadable one is an `error:` naming it — never substitute another.
- [ ] C3. **Record branch and tree state** — Run `git branch --show-current` and `git status --short`; keep whether the tree was clean.
- [ ] C4. **Refuse a clean review_plan_file** — `review_plan_file` on a clean tree: return `error: nothing to commit`; stop. `[n/a]` for other modes.
- [ ] C5. **Resolve the entry by token K** — Match `**Task|Finding|Test K**` in the readiness list only; no match returns the `matched no readiness entry` error. (ref: committer.md → ## Process → step 2)
- [ ] C6. **Flip or record already-[x]** — `[ ]` → `[x]` on that one line. Already `[x]`: no edit; clean tree → `error: nothing to commit`; `ui_test_pass` → `noop:`.
- [ ] C7. **Compute the explicit stage set** — Repo-relative paths only: index, modified detail file, `git status` work files; review folder(s) for `review_plan_file`. (ref: committer.md → ### Stage set)
- [ ] C8. **Reconcile subject against stage set** — Index-only set → `mark`/`record disposition of`/`already passing` template and the `staged: index-only` line. (ref: committer.md → ## Commit-message policy)
- [ ] C9. **Normalise every message argument** — Strip `$`, backticks, `|`, `<`, `>` from subject and body; keep every word, else name `Task K`/`Finding K`.
- [ ] C10. **Commit through the wrapper once** — `bash <scripts_dir>/commit-on-branch.sh <paths> -- "<subject>" ["<body>"]`; map exit 0/3/other per the output contract.
- [ ] C11. **Verify clean tree and SHA** — `git status --short` clean; `git log -1 --oneline` matches the wrapper's printed SHA.
- [ ] C12. **Push only when asked** — `push: true` and a commit landed: `bash <scripts_dir>/push-branch.sh <repo_root>`; report yes/failed, never revert.
- [ ] C13. **Return the exact contract** — 5 lines, 6 with `staged: index-only`, or one `noop:`/`error:` line. (ref: committer.md → ## Output contract)
```

Notes on the template:

- **Ticks that cannot persist.** C11–C13 happen after the commit, so ticking them dirties a tracked file (see Storage).
- **Same-file refs cost nothing extra.** Every `ref:` points back into `committer.md`, which is already loaded.

## Thinning plan

These cuts apply whether or not the template ships.

| File | Remove | Shorten | Keep verbatim | Today → est. after |
|---|---|---|---|---|
| `plugin/agents/committer.md` | `### Which caller sends which mode` (313), replaced by a 25-word pointer to its two owners (`unit_loop_core.md:196-207` for `task` / `review_item`; `plan_orchestration_instructions_core.md` phases A1.5.2 / A2.2 / B.3 / C2.3 / E.1 / E.2 / G.3 for `review_plan_file` / `ui_test_pass`); the scope note (95); the `## Resolved values` preamble's placeholder list and "two absences" (200); `### ui_test_pass procedure` as a separate procedure (837), folded into steps 1–6 as three conditional sentences (no clean-tree guard, `noop:` on already-`[x]`, stage only `plan_path`); the second and third statements of the exit map, absolute-path trap and push semantics; the maintainer notes ("two-file edit", "adopter whose policy changes…") | Wrapper-safe (465 → ~150, pointing at the wrapper's **MESSAGE ARGUMENTS** header); Subject reconciliation (770 → ~420, keeping every WIRE template and the parse rule in one paragraph); `commit_prefix` (368 → ~200, keeping the three-state rule intact for its readers `plan_orchestration_instructions.md:84-86` and `unit_loop_core.md:277`); step 3 (634 → ~250, with one `### Stage set` sub-heading for C7's ref) | All 1 406 WIRE words: frontmatter, mode/arg names, entry shapes, both fixed-form subjects, the `record disposition of `/` — `/`mark … done — `/`already passing — ` templates, every `error:`/`noop:` string, the `staged: index-only — …` line, the wrapper stdout line and exit codes, the 5-line return. **Heading anchor:** `plan_orchestration_instructions_core.md:509` cites `committer.md` → "### Standard procedure (`task` / `review_plan_file` / `review_item`)" by its literal text. Either keep that heading byte-for-byte, or repoint `core.md:509` to `## Commit-message policy` → **Fixed-form subjects** in the same edit. The anchor is already stale: the fixed subject lives at `committer.md:76`, not in the procedure | 8 100 → **~3 700** (range 2 900–4 000) |
| `.claude/CLAUDE.md` | nothing (shared and auto-loaded; not the committer's) | n/a | everything | 1 695 → 1 695 |
| Commit-policy section | nothing (adopter-owned configuration) | n/a | everything | 585 → 585 |

Per-section estimate for `committer.md` after thinning. Kept = WIRE, plus shortened REFERENCE, plus a residual ACTION sentence where a step needs one:

| Section (lines) | Today | After |
|---|---|---|
| Frontmatter 1–6 | 61 | 61 |
| Intro 7–14 | 173 | 60 |
| `## Resolved values` 16–28 | 596 | 200 |
| Invocation args/modes 29–45 | 1 051 | 650 |
| `commit_prefix` 46–48 | 368 | 200 |
| `push` / `disposition` / `already_passing` 49–51 | 300 | 160 |
| Which caller table 53–65 | 313 | 25 |
| Scope note + unreadable path 66–69 | 150 | 40 |
| `## Commit-message policy` 71–89 | 1 625 | 900 |
| Process: guard, steps 1–6 (91–132) | 2 101 | 900 |
| `ui_test_pass` procedure 134–164 | 837 | 90 |
| `## Output contract` 166–204 | 525 | 400 |
| **Total** | **8 100** | **~3 686** |

**Shared base file: not proposed for the committer.** Two candidate bullets came up. One is "cited path unreadable → `error:`, never a substitute". The other is "wrapper paths are repo-relative; message args carry none of `$(` \` `|` `<` `>`". The first is generic. The second applies to the orchestrator forks' direct commit points, not to any other agent, since no other agent calls `commit-on-branch.sh`. A base file would add a read for two bullets.

## Word-count ledger

| Scope | File | Before | After | Delta |
|---|---|---|---|---|
| Up-front | `committer.md` | 8 100 | ~3 700 (2 900–4 000) | −4 400 |
| Up-front | `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| Up-front | commit-policy section | 585 | 585 | 0 |
| Up-front | work report template | 0 | 376 | +376 |
| **Up-front total** | | **10 380** | **~6 342** (5 556–6 656) | **−4 038** |
| On-demand | `commit-on-branch.sh` (wrapper header) | 2 272 | 2 272 | 0 (now actually cited by ref) |
| On-demand | `unit_loop_core.md` | 9 143 | 9 143 | 0 (takes over the caller table it already has) |
| On-demand | the rest (`improvement_observations` §, `qa-tester.md`, `push-branch.sh`, `guard-verification.md`) | 51 638 | 51 638 | 0 |

**The constraint holds: yes**, even at the pessimistic end: 6 656 is less than 10 380. Any thinning above 376 words would satisfy it. But the whole saving comes from the thinning, and thinning without the template gives about 5 966. For this agent the template is pure cost: +376 words up front and +13 Edits per dispatch.

## Storage and lifecycle

- **Path:** `<state_dir>/work_reports/<branch>/<phase>/committer/report_<index>.md`.
- **`<phase>`:** the dispatching row or phase id (`A`, `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3`, `G.4`, `UR-A`, `A1.5.2`, `A2.2`, `B.3`, `C2.3`, `E.2`, `G.3`, `E.1`).
  - Those ids exist in the semi-autonomous flows as well as the ledger flows. The supervised flow never dispatches a committer, so the "no ledger" case does not arise for this agent.
  - With `UR-A` and multiple rounds, the round has to be added (`UR-A.R3`).
- **`<index>`:** the caller must compute it, as it computes `iteration` today. A bare next-free index does not identify the unit, since phase `A` gets `report_0..13`. Put the unit token in the report header, or key the file as `report_<K>`.
- **Who creates the file: possible for the committer, but clumsy.**
  - `tools: Bash, Read, Edit` (`committer.md:4`). Edit changes only an existing file, and there is no Write tool.
  - `cp` would stall: it is absent from every list in `cli/templates/claude/settings.autonomous.json:20-87`, and an unlisted tool stalls in print mode (`:5`).
  - A redirect under `Bash(cat:*)` (`:36`) probably passes. Per `plugin/hooks/allow-safe-compounds.sh:85-89`, "whatever follows the matched prefix rides along on the allow — a pipe, a redirect", and `Write` is allowed under the repo (`:50-51`). So `cat <template> > <report>` is plausible, but unmeasured. `sed -i` ticks also work (brief lead 1).
  - The verdict does not depend on this, because the blocker is committing the ticks, not creating the file.
- **Committing its own report: not possible cleanly.**
  - Ticks C1–C10 could be staged in the same commit if the report path is added to the stage set.
  - Ticks C11–C13 (verify, push, return) come after the commit. They modify a now-tracked file, so the agent's own step-5 check, "`git status --short` — confirm clean" (`committer.md:127`), fails.
  - They also break the clean-tree invariant: the engine tolerates only *untracked* `<state_dir>/…` artifacts (`plan_orchestration_instructions_autonomous.md:281`).
  - A second commit just for the ticks doubles commits and pushes.
  - Leaving the report untracked does not work either. The next dispatch's `git status --short` reports it as `??`, and step 3 stages "the code files shown by `git status --short`" (`:111`), so the next unit's commit picks it up under the wrong unit.
- **Committing other agents' reports: the committer becomes the funnel, and three modes mishandle it.**
  - `task` / `review_item` take whatever `git status --short` shows. That includes the implementer's and reviewer's untracked reports, and a brand-new directory collapses to one `?? <dir>/` line, which the wrapper then stages wholesale (`git add -- <dir>`).
  - `ui_test_pass` stages **only** `plan_path` (`:150-155`), and step e expects "exactly that one file" (`:148`). The qa-tester's report is left behind and ends up in a later commit.
  - `review_plan_file` stages only the index, the finding folder and `meta_findings_folder` (`:113`). The reviewer's report is left behind the same way.
- **Guard hooks:** every hook in `plugin/hooks/hooks.json` matches `Bash` only. Edit and Write are unguarded, so no hook blocks a tick. The wrapper's path-existence check (`commit-on-branch.sh` **STAGING POLICY**) means a report path must be repo-relative.

## Risks and costs

1. **The index-only signal silently breaks (the biggest risk).**
   - The Subject reconciliation test asks whether the staged set contains any path other than `plan_path` and the detail file (`:83`).
   - Once implementer and reviewer reports are staged with the unit, the answer is always Yes. The `mark <unit> done — ` subject and the `staged: index-only` line then never appear.
   - `unit_loop_core.md:80` and `improvement_observations_instructions.md:72` (row **(d)**) read exactly those to detect an implementer that "returned success having written nothing" (`committer.md:188`). That detection would stop working without any error.
   - **Part of this already happens today.** Per-unit `layer-reviewer` FAIL findings are written untracked into the row's findings folder (`unit_loop_core.md:90-103`), and nothing commits them before step 5. Step 3 then stages them as "files shown by `git status --short`" (`committer.md:111`). So wherever `<per_unit_review>` is `on`, a unit with one FAIL iteration already loses the signal today: the semi-autonomous forks, and the autonomous user-review flow (`user_review_fixes_instructions_autonomous.md:39`). Work reports would extend this from some units to every unit. The pre-existing gap is flagged for the synthesis.
   - **Required change if reports ship:** step 3 stages `<state_dir>/work_reports/<branch>/<phase>/` explicitly in every mode, `ui_test_pass` and `review_plan_file` included. The reconciliation test excludes **all run-artifact paths** that are not work: work reports and per-unit findings folders. A narrower exclusion would leave today's leak in place.
2. **Tool-call cost.** Today a dispatch makes about 8–9 calls (branch, status, two Reads, Edit, wrapper, status, log, push). Thirteen ticks add 13 Edits, about 2.5× the calls. At 30 dispatches per branch that is roughly 390 extra Edit round-trips. Batching the ticks removes the "as you go" property.
3. **Goal a is not achieved.** Nothing checks tick order, so the agent can tick all 13 at the end. The committer's real actions are already fully evidenced, and harder to fake, in `git show --stat <sha>` and the progress line.
4. **Goal b is weak.** The committer's dangerous failures are blanket `git add`, absolute paths, positional selection and unsafe message bytes. The first, third and fourth are already enforced mechanically: the wrapper stages only explicit paths, the `task_heading` guard returns an `error:`, and the script-allowlist guard refuses the bytes. A checklist adds little.
5. **Actions detached from their rationale.** C7 and C8 are the subtle steps: the stage set and the subject depend on each other, and the reconciliation must follow the stage set. Cut down to 25 words, they invite the wrong order. Their `ref:` is mandatory, not optional.
6. **Literals that must not move.** Nothing in `cli/test/` greps `committer.md` prose. `init.test.mjs:5417-5425` keys on the conventions skeleton's commit-policy section, which is not this file. Callers do parse the return lines, the `record disposition of ` / `mark … done — ` substrings and the two fixed-form subjects (`plan_orchestration_instructions_core.md:509`, `.claude/context/conventions.md:172-186`). Callers also cite by heading or contract:
   - `core.md:509` cites the literal heading "### Standard procedure (`task` / `review_plan_file` / `review_item`)". Keep it, or repoint it in the same edit.
   - `plan_orchestration_instructions.md:84-86` and `unit_loop_core.md:277` read the `commit_prefix` contract's three-state rule.

   The thinning above keeps all of these.
7. **Leads 8, 10 and 12.**
   - **Lead 8:** the committer has no PASS/FAIL. Every successful path commits, but `noop:` and `error:` paths commit nothing, so a report on those paths has no commit point.
   - **Lead 10:** the index is collision-safe only if keyed by unit token plus round, not by a next-free integer reset per phase.
   - **Lead 12:** an evidence line carrying the SHA or push output cannot be written before the commit it describes. Push output can carry remote URLs. Both argue against committed evidence lines for this agent.

## Open questions

1. **Gitignore or commit?** Should `work_reports/` be gitignored, which keeps the clean-tree invariant and the index-only signal but forfeits durable evidence? Or committed, which forces the stage-set and reconciliation changes in Risk 1 and a "who commits the last agent's report" rule for every non-committer commit point?
2. **Who copies templates?** Agents without the Write tool can create a report only through a `cat … >` redirect, which is likely allowed but unmeasured (`allow-safe-compounds.sh:85-89`). Should the orchestrator pre-copy templates instead, at the cost of one more Write per dispatch?
3. **What is the index key?** The brief's next-free `<index>` does not identify the unit when one phase dispatches the same agent 14 times. Should the key be the unit token (`Task K` / `Finding K`) instead?
4. **What does `ui_test_pass` stage?** Should it start staging the qa-tester's report? That changes "exactly that one file" (`committer.md:148`) and the mode's single-file contract, which `plan_orchestration_instructions_core.md:481` describes.
5. **Fix the pre-existing leak?** Per-unit findings files already defeat the index-only test when `<per_unit_review>` is `on` (Risk 1). Should that be fixed regardless of the work-report decision?
6. **Ship the thinning anyway?** Should the committer thinning (8 100 → ~3 700) go ahead independently of the work-report decision? It needs no new mechanism.

## Review response

All Must Fix and Should Fix findings and all four Nice to Have findings were applied. None is rebutted.
