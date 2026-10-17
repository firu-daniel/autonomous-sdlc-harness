# Work report research — business-parity-reviewer

## Verdict

**Recommend with changes.** This agent's most-skipped duties are evidence-shaped, which makes them a good fit for checklist items:
- read every detail file, not a sample;
- read each reference method **whole**, not just the grepped line;
- open every cited exclusion basis;
- run the Leg 2 precedent grep.

Items that demand the method list and the grep line give goal a real evidence. The definition is the heaviest plan-tier reviewer file (6 158 words), and a quarter of it is restatement, so the hard constraint holds.

Changes required:
1. Embed the template in the agent file and **fill it in one write at the end**. This is a design choice, not a tool limit (see Storage).
2. Write the report **only on FAIL**, as the **last section of the findings file the agent already writes**. A sibling file would corrupt the improvement-observations round count.
3. Leave the PASS and disabled-phase branches **disk-free**. Three callers, the `A1.5g` ledger arm and the zero-finding rule all key on "PASS wrote no file".

The cost of change 3 is that a PASS, the case where skipped full-method reads do the most harm, leaves no report.

## Read tree

This repository has `phases.parity: false` (`harness.config.json`), so the agent is never dispatched here. The counts describe a hypothetical dispatch with parity on against this repo's three layers. A default `init` adopter is shown for contrast.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/business-parity-reviewer.md` | up-front | 6 158 |
| `.claude/CLAUDE.md` (auto-loaded; template `cli/templates/claude/CLAUDE.md`) | up-front | 1 695 (template 1 320) |
| **Every** `layers[].conventions` (`business-parity-reviewer.md:107`, "Read **all** of them"): `cli.md` + `plugin.md` + `conventions.md` | up-front | 2 647 + 4 174 + 5 864 = 12 685 (default adopter: `cli/templates/claude/context/conventions.md` 974) |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (`:111`, "in both modes"; lines 140–177) | up-front | 732 |
| `harness-runs/lessons.md`, sent by the `.claude/CLAUDE.md:43` row "Planning or reviewing at branch level" | up-front in **diff mode, this repo only**. The shipped template has no lessons row (`grep -c lessons cli/templates/claude/CLAUDE.md` = 1, the checkout-root note only) | 1 199 |
| Plan inputs: story or fix-plan index + **every** detail file + `prompt_path` (plan mode) | up-front, variable | n/a |
| Branch diff hunks (`git diff -U15`) + `plan_path` for intent (diff mode) | up-front, variable | n/a |
| `<reference_impl>` sources, one whole method per decision (`:108`, `:122`) | on demand | n/a |
| `<docs_root>` and `mcp__harness-docs__search_docs`, only when `phases.docs` (`:109–110`) | on demand, navigation only | n/a |
| `architecture-reviewer.md`, `layer-reviewer.md`, `branch-reviewer.md` (`:158–159`) | named for scope only, never read | — |

**Read-list conflict (lead 13).** The agent definition never mentions the lessons ledger, but CLAUDE.md routes branch-level reviewers to it. The larger set wins, because CLAUDE.md is auto-loaded and its table says "read the relevant file". So the ledger is counted for diff mode.

**Up-front total per dispatch, excluding inputs:**

| Dispatch | Calculation | Words |
|---|---|---|
| This repo, plan mode | 6 158 + 1 695 + 12 685 + 732 | **21 270** |
| This repo, diff mode | adds the lessons ledger | **22 469** |
| Default adopter | 6 158 + 1 320 + 974 + 732 | **9 184** |

The agent-owned share this research can change is **6 890**: the definition plus the test-run section.

## Dispatch sites and phases

| Insertion point | Mode | Caller | Ledger id | Flows | Dispatches / branch |
|---|---|---|---|---|---|
| 1 — task plan | plan (a) | `task_plan_writing_instructions_core.md` → `### 2. Business-parity review (plan-review mode)` (`:172–188`); walker node `business_parity_review` (`scripts/flows/task_plan_writing.graph.json:28–42`) | `P1` (`autonomous_pause_and_ledger.md:69`) | semi-autonomous + autonomous planning | 1–5 (walker `iteration`, cap 5) |
| 2 — branch diff | diff | `plan_orchestration_instructions_core.md` → `### A1.5.1` (`:171–193`) | `A1.5g` / `A1.5f` (`autonomous_pause_and_ledger.md:75–76`) | semi-autonomous + autonomous implementation | exactly 1 (`iteration: 0`; a FAIL goes to the fix loop) |
| 3 — user-review fix plan | plan (b) | `user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 7 (`:93–117`) | `R1` (`autonomous_pause_and_ledger.md:102`) | supervised, semi-autonomous and autonomous fix-plan flows | 1–5 per round (`parity_iteration` reset to 0, `:97`) |

Where each caller parses the return:
- `plan_orchestration_instructions_core.md:192–195`;
- `user_review_fix_plan_writing_instructions_core.md:110–117`;
- insertion 1 defers to its step 5 (`task_plan_writing_instructions_core.md:188`, "Pass its verdict back as step 5 states").

Gates and listings:
- Every site is gated on `phases.parity` and on the run-mode `parity` id (`plan_orchestration_instructions_core.md:167`, `user_review_fix_plan_writing_instructions_core.md:95`).
- On the receiving-side roster (`dispatch_discipline_instructions.md:68`) and the test-run citer roster (`unit_loop_core.md:160`).

## Prose classification

Totals are measured with `sed -n 'a,bp' | wc -w`. The four-way split is my estimate against each measured total.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 90 | 0 | 0 | 90 | 0 | Read by Claude Code |
| Intro (8) | 120 | 0 | 70 | 0 | 50 | Restates the `description` |
| Phase-off no-op (10) | 91 | 25 | 30 | 20 | 16 | WIRE: `verdict: PASS` + reason line, no file |
| Read-only (12) | 71 | 0 | 25 | 0 | 46 | |
| `## Resolved values` (14–29) | 733 | 0 | 380 | 0 | 353 | Preamble `:16` (104). `:24` (153) restates CLAUDE.md's checkout-root rule and binds `<app_dir>`, "no step in this file consumes" |
| `## Invocation contract` preamble (33–39) | 195 | 10 | 110 | 0 | 75 | `:37` (49) duplicates `:185` |
| Plan-review mode (41–77) | 401 | 40 | 120 | 120 | 121 | WIRE: both fenced blocks (quoted from callers). `:67` and the key table restate them |
| Implemented-solution mode (79–103) | 332 | 60 | 40 | 110 | 122 | WIRE: dispatch block; `"N run-artifact files excluded from the reviewed diff."`. `:100` (125) ≈ Process step 2 `:121` (89) |
| `## Read first` (105–113) | 514 | 60 | 300 | 0 | 154 | Docs and search bullets apply only under `phases.docs` |
| `## Process` 1–3 (115–122) | 353 | 180 | 120 | 0 | 53 | Step 3 (171) carries the full-method discipline |
| Rejected findings (124) | 189 | 40 | 149 | 0 | 0 | Grading standard; same paragraph in three other reviewers |
| What-to-check intro + checks (a)–(j) (126–141) | 817 | 0 | 600 | 0 | 217 | Five `*Replace with your project's parity surface*` slots (91 words) and `(Source: …)` parentheticals (104 words) |
| Verify exclusion basis (142) | 159 | 40 | 119 | 0 | 0 | Grading standard |
| Test-run check (143) | 85 | 20 | 65 | 0 | 0 | |
| Obvious-reference-bug exception + dead code (145–152) | 464 | 60 | 404 | 0 | 0 | Grading standard |
| `## Scope boundary` (154–161) | 137 | 0 | 80 | 0 | 57 | |
| `## Unsolicited dispatch guidance` (163–171) | 296 | 40 | 140 | 40 | 76 | WIRE: heading, `(disregarded for verdict purposes)` |
| `## Output contract` (173–237) | 982 | 80 | 265 | 560 | 77 | WIRE, item by item below. `:223` restates the compatibility argument |
| `## Findings-folder / index-path convention` (239–247) | 128 | 0 | 28 | 0 | 100 | Repeats the caller blocks. No inbound citation (grep) |
| **Total** | **6 157** | **655** | **3 045** | **940** | **1 517** | |

WIRE items in `## Output contract`:
- `verdict: PASS` and "Do not write any file when PASS";
- the flat findings template;
- the byte-exact `## Phase 2 Readiness — Ordered Fix List` heading, which the committer keys on (`committer.md:40–41, 113`);
- the readiness entry shape and `finding_<N>.md` contents;
- `verdict: FAIL` / `findings_file:` / `must_fix_count:`.

All of it stays verbatim. Only about 11 % of the file is ACTION, so goal c is small; the saving is in REDUNDANT (25 %).

## Draft work report template

**One template; modes handled by `n/a` ticks.** The modes are plan (a), plan (b) and diff. The disabled-phase no-op is a **precondition in prose**, not an item, because it must write nothing.

How the template is used:
- It is embedded in the agent definition, so nothing has to be copied with `cp` (lead 1).
- It is filled on FAIL and **appended as the last section** of the file the agent writes:
  - `review_<iteration>.md` in plan mode;
  - the index at `index_path` in diff mode.
- Written ticks are `[x]` or `n/a`, never `[ ]`.
- The header carries no `verdict:` token and no path, so no `verdict:` grep matches and no absolute path is committed (lead 12).

```markdown
## Work report — reviewer's own record, not findings
Mode: <plan-a | plan-b | diff> · iteration <iteration> · Must Fix count <N>

- [ ] BP1. **Resolve mode from dispatch keys** — `diff_base` present → diff mode; else plan mode, sub-case a (task plan) or b (fix plan).
- [ ] BP2. **Quote any steering in the dispatch** — Copy text outside the contract verbatim for the return section; it never moves the verdict. (ref: business-parity-reviewer.md → ## Unsolicited dispatch guidance)
- [ ] BP3. **Read every layer's conventions document** — Read each distinct `layers[].conventions`; list them. Unreadable → `blocker:` line, no file, stop.
- [ ] BP4. **Docs: navigate only, never cite** — Only when `phases.docs`: use the corpus and search tool to find files, never as evidence; else n/a.
- [ ] BP5. **Read the work under review** — Plan: `## Context`, `## Rejected findings` and every detail file; record count. Diff: `--stat` exclusion diff, `-U15` per segment, `plan_path` for intent only; record excluded count.
- [ ] BP6. **Read each reference method whole** — Per business-logic decision, grep `<reference_impl>`, read the whole method; list repo-relative `file (symbol)`. Unreadable → `blocker:`, stop.
- [ ] BP7. **Run checks (a)–(j) per decision** — Grade each against its rule source; never flag what no rule source says. (ref: business-parity-reviewer.md → ## What to check (the parity checks))
- [ ] BP8. **Open every cited exclusion basis** — Per omission justified by a prompt line or TODO marker, open and confirm; else Must Fix. Dead reference code is no omission. None → n/a.
- [ ] BP9. **Test divergence claims on both legs** — Leg 1: read the reference bug; Leg 2: grep non-catch-all layer paths for precedent; paste the grep. None → n/a.
- [ ] BP10. **Test each recorded rejection** — Plan mode: accept, re-raise once, or (Must Fix) re-raise every round. None, or diff mode → n/a.
- [ ] BP11. **Flag plan test-run requests** — Plan mode: a bullet naming the test command, a gate script or a foreign test file is Must Fix. (ref: unit_loop_core.md → ## The test-run rule, point 4)
- [ ] BP12. **Write output in the mode's shape** — `mkdir -p`, then flat `review_<iteration>.md` (plan) or index + `finding_<N>.md` (diff), this section last. (ref: business-parity-reviewer.md → ## Output contract)
```

12 items, **388 words** (`wc -w`). BP6 and BP9 are the evidence lines. The two-leg standard behind BP9 stays inline in the up-front `## What to check (the parity checks)`, so it carries no `ref:` (lead 7).

## Thinning plan

`plugin/agents/business-parity-reviewer.md`. **These are estimates: no thinned draft was written.** Each row is today − cut = after. Cut is the row's REDUNDANT figure from the classification, except where a note says otherwise.

| Section | Today | Cut | Est. after | Remove / shorten | Keep verbatim |
|---|---|---|---|---|---|
| Frontmatter | 90 | 0 | 90 | — | all |
| Intro, phase-off, read-only | 282 | 112 | 170 | Restated description; "tool-level" rationale | Phase-off return shape |
| `## Resolved values` | 733 | 353 | 380 | Preamble `:16`; `<app_dir>`; checkout-root restatement → pointer to CLAUDE.md | `<state_dir>` trailing-slash pathspec note |
| Invocation preamble | 195 | 75 | 120 | `:37` | Verdict-exactness sentence |
| Plan-review mode | 401 | 121 | 280 | `:67`; key table merged | Both fenced blocks |
| Implemented-solution mode | 332 | 122 | 210 | `:100` (Process step 2 stays the one copy) | Dispatch block, `--shortstat` command, exclusion-count sentence |
| `## Read first` | 514 | 154 | 360 | Topic list in the conventions bullet; docs bullets compressed; test-run line → BP11 `ref:` | Blocker rule `:113` |
| `## Process` | 353 | 183 | 170 | REDUNDANT 53 + step 1–2 mechanics moved to BP3/BP5 (≈130) | Step 3's *why* (sibling branches a grep misses) |
| Rejected findings | 189 | 0 | 189 | — | whole |
| What-to-check intro + (a)–(j) | 817 | 217 | 600 | Five slots → one line; `(Source: …)` → one statement | Check texts |
| Verify exclusion basis | 159 | 0 | 159 | — | whole |
| Test-run check | 85 | 15 | 70 | To the plan-mode Must Fix sentence | — |
| Obvious-bug exception + dead code | 464 | 0 | 464 | — | Leg 1, Leg 2, outcome matrix `:150`, carve-out |
| `## Scope boundary` | 137 | 57 | 80 | Sibling path citations | "Only parity + test-run requests are Must Fix" |
| `## Unsolicited dispatch guidance` | 296 | 0 | 296 | — (roster rule; left to synthesis) | whole |
| `## Output contract` | 982 | 77 | 905 | `:223` | Every return block, both templates, readiness heading and entry shape |
| `## Findings-folder / index-path convention` | 128 | 128 | 0 | Whole section | — |
| **Subtotal** | **6 157** | **1 614** | **4 543** | | |
| *New:* rule sentence | 0 | — | 40 | "On FAIL, fill the template below and append it as the last section of the file you write; PASS and the disabled-phase no-op write nothing" | — |
| *New:* embedded template | 0 | — | 388 | | |
| **Agent file after** | **6 158** | | **~4 971** | | |

**`unit_loop_core.md` → `## The test-run rule`** becomes on demand for this agent, because only point 4 applies. That means editing `:111` here ("in both modes"); the section itself does not change.

**Shared base (for synthesis).** `architecture-reviewer.md` (5 139 words) has the same skeleton heading for heading. A shared plan/diff reviewer base would remove duplication across the corpus. It would not lower per-dispatch load, because the base would be read up front. It also conflicts with `dispatch_discipline_instructions.md:72` for the guidance body.

## Word-count ledger

| Up-front, agent-owned | Today | After | Delta |
|---|---|---|---|
| `business-parity-reviewer.md` incl. rule sentence + template | 6 158 | ~4 971 | −1 187 |
| `unit_loop_core.md` → `## The test-run rule` | 732 | 0 (on demand) | −732 |
| **Subtotal** | **6 890** | **~4 971** | **−1 919** |

| Up-front, full dispatch | Today | After | Delta |
|---|---|---|---|
| This repo, plan mode | 21 270 | ~19 351 | −1 919 |
| This repo, diff mode (+ lessons 1 199) | 22 469 | ~20 550 | −1 919 |
| Default `init` adopter | 9 184 | ~7 265 | −1 919 |

| On demand | Today | After |
|---|---|---|
| Test-run rule | 0 | 732 (only point 4, ~70, is needed) |
| `<reference_impl>`, docs corpus | variable | unchanged |

**Constraint holds: yes**, even without the test-run move (6 158 → ~4 971, −1 187). The template plus its rule sentence is net **+428**; the saving comes from thinning. The figures are estimates (see the thinning note), but they leave a margin of about 1 200 words.

## Storage and lifecycle

- **Location.** The report is embedded in the artifact already written:
  - plan mode: appended to `<findings_folder>/review_<iteration>.md`;
  - diff mode: appended to the index at `index_path`.

  It is not a sibling file, and not a `<state_dir>/work_reports/` tree. The reason is the improvement-observations trip-wire: it lists the plan-review findings folders and treats each as "their own consecutive `review_<i>.md` series" (`plan_orchestration_instructions_autonomous.md:237`; same for the fix-plan gates at `user_review_fixes_instructions_autonomous.md:198`). Its listing "is authoritative" and it will "Sort each root's own artifacts and index that sorted list from 0" (`improvement_observations_instructions.md:74`). A `work_report_<i>.md` beside each review would double the round count and corrupt the net-new/re-raised diff. Embedding also avoids `review-plan-reviewer`'s orphan rule (lead 9). The alternatives, an exemption line in the trip-wire module or a `work_reports/` subfolder, each need a caller edit.
- **Key and index (lead 4).** The key is the caller's `findings_folder` + `iteration`, already on every dispatch, so the agent never has to work out its own index (`:75`). Ledger ids are not visible to the agent.
- **Collision (lead 10).** The scheme is collision-safe at insertion points 1 and 2. **It is not safe at insertion point 3**, where the report inherits a confirmed pre-existing bug:
  - `parity_iteration` is reset to 0 unconditionally (`user_review_fix_plan_writing_instructions_core.md:97`);
  - the folder is flat (`:103`) and deliberately not round-suffixed (`user_review_fix_plan_writing_instructions_autonomous.md:93`);
  - so round 2's `review_0.md` overwrites round 1's.

  That contradicts `:93` itself ("a later round appends findings into the same folder") and `user_review_fixes_instructions_autonomous.md:198` (round-2+ folders "also carry earlier rounds' `review_<i>.md` files"). See Open questions.
- **Commit, FAIL path (lead 3).** Because the report rides inside an already-committed file, the existing commit steps pick it up with no staging change:
  - insertion 1 (autonomous): Override 4 stages `<state_dir>/business_parity_reviews/<branch>/` whole (`task_plan_writing_instructions_autonomous.md:139, 152`);
  - insertion 3 (autonomous): the R1 commit stages `<state_dir>/business_parity_user_review_reviews/<branch>/` (`user_review_fix_plan_writing_instructions_autonomous.md:88`);
  - insertion 2: the committer's `review_plan_file` stages the index and `${plan_path%.md}/` (`committer.md:113`).

  No unit-mode reconciliation is involved. The only wire change is the addition of a trailing section to the two FAIL file formats in this agent's own `## Output contract`.
- **Consumers of the extended files (lead 11).**
  - The re-dispatched `task-plan-writer` applies "only the Must Fix items" (`task-plan-writer.md:52`).
  - `user-review-fix-plan-writer` applies "only the requested changes" (`user-review-fix-plan-writer.md:145`). Its imperative-looking items could be misread as requested changes. That is why the heading reads "reviewer's own record, not findings" and ticks are past state (`[x]`/`n/a`).
  - The committer flips only inside the readiness section (`committer.md:41`), so a trailing section in the diff-mode index is inert.
- **PASS path: why it stays disk-free (leads 2, 8).**
  - Insertion 2 PASS has no artifact commit: `A1.5g` flips "with no artifact commit behind it" (`plan_orchestration_instructions_autonomous.md:180`).
  - The zero-finding rule quotes "Do not write any file when PASS" (`:193`).
  - Three callers say the reviewer "creates … itself only when it has findings":
    - `task_plan_writing_instructions_core.md:186`;
    - `plan_orchestration_instructions_core.md:190`;
    - `user_review_fix_plan_writing_instructions_core.md:107`.
- **Tools and tick timing (lead 1, corrected).**
  - The allowlist is `Read, Glob, Grep, Bash, Write, mcp__harness-docs__search_docs` (`:4`).
  - `Bash(sed:*)` is allowed (`cli/templates/claude/settings.autonomous.json:39`), so ticking each item with `sed -i` is *possible*.
  - The single end-of-run write is chosen for two reasons:
    - `:12` makes the missing `Edit` a deliberate read-only guarantee ("Do not treat it as an oversight to work around"), and a `sed -i` on its own output is exactly that workaround;
    - 12 Bash calls per dispatch buy no verifiable ordering (see Risks).
- **Hooks.** Every `plugin/hooks/hooks.json` matcher is `Bash`, so `Write` is unhooked. `mkdir -p` is allow-listed (`settings.autonomous.json:45`).
- **Other reviewers (lead 5).** Every path contains `<branch>`, so the `':(top,exclude)<state_dir>/*<branch>*'` diff exclusion (`:100`) keeps reports out of the branch, skeptic and own-diff reviews.

## Risks and costs

- **Calls.** One `Write` per FAIL dispatch, which the agent makes anyway, plus about 400 output tokens. Per-item `sed -i` ticking would cost 12 extra Bash calls per dispatch, up to about 22 dispatches per branch.
- **Goal a is attestation except on BP5, BP6 and BP9.** Tick timing is unverifiable. The `file (symbol)` list, the pasted grep and the detail-file and excluded counts can be checked against the tree, so the template asks for values, not ticks (lead 6).
- **No report on PASS.** A PASS that skipped BP6 leaves no trace, and that is what `skeptic-reviewer` exists to catch (`skeptic-reviewer.md:3`). Covering it needs the 5-site PASS wire change plus an `A1.5g` staging line.
- **Trip-wire content diff.** The embedded section repeats every round. The net-new/re-raised diff must compare findings sections only. Today that is implicit; one clarifying line in `improvement_observations_instructions.md` would make it explicit.
- **Ref-starvation (lead 7).** The grading standard stays inline. Only the test-run rule and the `phases.docs`-conditional rules move behind a `ref:`.
- **Action/rationale split.** BP6 without step 3's *why* invites "read around the grepped line". The thinned step 3 keeps the sibling-branch examples.
- **Tests and citations.** No test greps this agent's prose. Tests key on the heartbeat and node names (`cli/test/flow-walker.test.mjs:42, 77–78`). The removed section has no inbound citation. Its twin, `architecture-reviewer.md:242`, should go in the same step.

## Open questions

1. **PASS reports at the plan gates.** Their folders are already staged unconditionally. Is goal a on PASS worth the 5-site wire edit? If so, apply it to `architecture-reviewer` too.
2. **Insertion-point-3 collision (confirmed).** Should step 7 resolve `parity_iteration` as next-free in the folder, or round-suffix the filename? The same applies to `arch_iteration` (step 8). It is also unclear whether a park-and-resume in a single round (step 11 → 6 → 7) is meant to reset the counter.
3. **Shared plan/diff reviewer base** with `architecture-reviewer`. Is a corpus-level saving worth an extra activating document?
4. **Every conventions document** (12 685 words here) is the largest lever on this agent's load. Could a parity dispatch read only the documents that state a parity surface?

## Review response

Every Must Fix and Should Fix is applied, and so are Nice to Have 1 and 3. Nice to Have 2 (length) is partly applied: the prose is shorter, but the added storage evidence keeps the report at 3 742 words (`wc -w`), over the 3 000 target. Nothing is rebutted.

Changes and the evidence behind each:
- **Trip-wire root.** It is at `plan_orchestration_instructions_autonomous.md:237`, not `:236`; verified with `sed -n`.
- **Thinning arithmetic.** Rows now sum (6 157 − 1 614 = 4 543). The previous table omitted the verify-exclusion row (159) and under-counted the output contract, which explains the 251-word gap the review found.
