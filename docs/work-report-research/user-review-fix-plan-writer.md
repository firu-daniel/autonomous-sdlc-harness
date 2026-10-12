# Work report research — user-review-fix-plan-writer

## Verdict

**Recommend with changes.** The definition is 4 095 words. 1 062 of them are measured as redundant, mostly restatement: :69–71 against :82–84, the quality checks against step 4, and the `<repo_root>` row against `CLAUDE.md`.

The mechanism costs +985 (a 735-word template and a 250-word base). It is paid for by thinning and, above all, by moving the samples (1 959 words) to on-demand.

Up-front on an initial write: 9 102 → 6 405 at the targets. The conservative case is 9 025 (−77): only redundancy cut and the samples kept up-front.

Changes required:

1. Key reports by `round_<N>` from the `<fix_plan_path>` suffix. Do not use ledger `R1`, which is re-seeded every round.
2. Keep the report outside `user_reviews/`.
3. Defer the `Write` until after the stop checks, and report inline on the `## Questions` and `blocker:` paths.
4. Add the report folder and `lessons.md` to Override 3's list.
5. Make the samples `ref:` only.

## Read tree

The basis is this repository: `stateDir: harness-runs`, three layers, and `phases.parity/docs/qa` all `false`.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/user-review-fix-plan-writer.md` | up-front | 4 095 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 (notes-app 1 676) |
| `harness.config.json` (`## Resolved values`, :12–26) | up-front | 154 |
| User-review file (step 1, :79) | up-front | variable; excluded |
| `<state_dir>/lessons.md` ("always, before step 6", :72; step 6 runs on initial write only, :120) | up-front (write) | 1 199 (notes-app 442) |
| `sample_user_review_fix_plan.md` + `finding_{1,2,3}.md` (step 4 "Reference", :97; an unreadable sample is a `blocker:`, :75) | up-front in practice (write) | 985 + 974 = 1 959 |
| **Up-front, initial write** | | **9 102** |
| **Up-front, revision** (no lessons, no samples) | | **5 944** |
| `.claude/context/conventions.md` (`CLAUDE.md:40`: "Any implementation, review or planning") | conflict (lead 13) | 5 864 |
| Layer conventions for the touched layer only (:68): `cli.md` / `plugin.md` | on demand | 2 647 / 4 174 |
| Story index + task files, code-review index + finding, prior fix plan + finding (:69–71, :82–84) | on demand, by citation type | variable |
| `unit_loop_core.md` → `## The test-run rule` (:108, :118) | on demand | 732 |
| `remote-run.sh` header `deliver` paragraph (:443–460; "shape owned by", :105, :108, :117) | on demand | 189 |
| `branch-reviewer.md` / `layer-reviewer.md` (:10, :104) | cited, never read | 6 175 / 3 997 |
| `mcp__harness-docs__search_docs` (:73) | on demand when `phases.docs` and `docs.retrieval` are on | n/a here |

**Read-list conflict (lead 13).** `CLAUDE.md:40` binds "planning", while the definition says "Never read all of them up front" (:68).

- If `CLAUDE.md` wins, every figure rises by 5 864: initial write 14 966 → 12 269, revision 11 808 → 11 070. The deltas are unchanged.
- The definition should win, being narrower. Add one sentence to it saying so.

## Dispatch sites and phases

| Site (`user_review_fix_plan_writing_instructions_core.md`) | Flows | Prompt | Per round |
|---|---|---|---|
| step 5, :83–87 | supervised (`/branch-start-user-review-fix-plan`) and autonomous (`/branch-start-user-review-fix-autonomous`) | `Write the user-review fix plan. …` | 1, plus one per answered `## Questions` (:89, "answers appended") |
| step 7, :111–117 (only when `phases.parity` is on) | both | `Revise … per business-parity findings: …` | 0–5 |
| step 8, :137–143 | both | `Revise … per architecture findings: …` | 0–5 |
| step 11, :147–153 | supervised: on rejection-with-feedback (`…_instructions.md:44`), no cap; autonomous: only on an Override 2 (a) resume | `Revise … per user feedback: …` | 0–n |

- **Rounds.** There is one flow per round (core :58–73).
- **What the agent sees.** The round (the `_<N>` suffix of `<fix_plan_path>`) and the mode (the prompt verb). It never sees the ledger id or the counters.
- **Ledger ids.** Every dispatch is under `R1` (`autonomous_pause_and_ledger.md:102`), re-seeded per round (`…_autonomous.md:128–133`).

## Prose classification

These are agent-definition sections, measured with `sed -n 'a,bp' | wc -w`. Each row's A/R/W/X split is a hand classification that sums to the row's total.

| Lines | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| 1–6 | 78 | | | 78 | |  |
| 7–11 | 86 | | 30 | | 56 | dup of description |
| 12–15 | 139 | | 20 | | 119 | lists what it does not list |
| 16–27 | 572 | 30 | 290 | 40 | 212 | `<repo_root>` row restates `CLAUDE.md`; `<app_dir>` unused (:19) |
| 28–41 | 84 | 10 | 20 | 54 | | prompt quoted at core :86 |
| 42–59 | 73 | | 15 | 58 | | core :114, :140, :150 |
| 60 | 30 | | | | 30 | dup of :145 |
| 61–63 | 61 | | 25 | | 36 | dup of output contract |
| 64–68 | 163 | 40 | 100 | | 23 | template residue "replace with your project's triggers" |
| 69–71 | 191 | | 40 | 60 | 91 | dup of :82–84 |
| 72 | 30 | 15 | | | 15 | dup of step 6 |
| 73–74 | 139 | 15 | 100 | | 24 | in 10 agents |
| 75–76 | 72 | 20 | 30 | 22 | |  |
| 77–80 | 119 | 30 | 50 | 39 | | PR-round shapes parsed by `remote-run.sh control` |
| 81–86 | 266 | 80 | 60 | 30 | 96 | repeats :69–71 |
| 87 | 250 | 60 | 140 | 50 | | grading standard; keep whole |
| 88–89 | 17 | 17 | | | |  |
| 90–96 | 210 | 40 | 130 | 20 | 20 | severity = gate grading standard |
| 97–98 | 66 | 25 | 25 | 16 | |  |
| 99–102 | 54 | 10 | 14 | 30 | |  |
| 103 | 225 | 40 | 60 | 95 | 30 | `[x] **Finding <K>**` read by `deliver` (`remote-run.sh:455`) |
| 104 | 79 | 10 | 20 | 39 | 10 |  |
| 105 | 86 | 10 | 26 | 50 | | suffix parsed by `deliver` (:443–452) |
| 106–107 | 36 | 10 | 16 | 10 | |  |
| 108–109 | 198 | 30 | 70 | 70 | 28 | site anchor, `**Review comments:**` are wire |
| 110–119 | 239 | 60 | | 30 | 149 | restates step 4; :113, :117, :118 add detail (W3, C3, W4) |
| 120–123 | 201 | 50 | 40 | 25 | 86 | lesson line is wire |
| 124–142 | 125 | 10 | 20 | 80 | 15 |  |
| 143–146 | 82 | 30 | 30 | | 22 |  |
| 147 | 124 | 20 | 30 | 74 | | formats in 4 agents, `call stands` in 8 |
| **Total** | **4 095** | **662** | **1 401** | **970** | **1 062** | Column sums of the rows above |

**Other up-front files.**

- **The samples (1 959)** show headings and fields that step 4 (:99–108) already specifies verbatim. Their remaining value is the worked example, which makes them `ref:` material.
- **`lessons.md` and `CLAUDE.md`** are adopter-owned and shared with other agents, so they are not thinned here.

## Draft work report template

**Shape.** There is one template for every mode: 25 items, 735 words (`wc -w`). Items for the other mode are ticked `[-]`.

**When the file is written.** S3 holds the report in memory, and the first `Write` comes only after the three stop checks:

- B1 (blocker);
- R5 (questions on a write);
- V0 (questions on a revision).

**The no-write paths.** On `## Questions` and `blocker:` no file is written. O2 instead appends one `<ID> ✓ <evidence>` line per ticked item after the reply's last line. Those lines carry no headings and no contract field names, so a caller parsing `fix_plan_file:` or a `## Questions` section (core :89, :165–169) cannot misread them.

**Tools (lead 1).** The agent has `Write` and `Edit` (:4), so it ticks by `Edit`, once per section.

```markdown
# Work report — user-review-fix-plan-writer — <branch> — round <N> — <mode: write | write+answers | revise-parity | revise-arch | revise-feedback>
Tick `[x]` done, `[-]` n/a; an empty `→` is an unticked item. Repo-relative paths only; no timestamps, no env output.

## Setup
- [ ] S1. **Resolve root and config** — bare `git rev-parse --show-toplevel`; read `stateDir`, `layers[]`, `phases.*`, `scriptsDir`. (ref: user-review-fix-plan-writer.md → ## Resolved values)
- [ ] S2. **Name mode and round** — mode from the prompt verb and `per … findings`; round from the `<fix_plan_path>` suffix (none = 1). → `mode=…; round=…`
- [ ] S3. **Hold this report in memory** — first `Write` only after B1, R5 and V0 pass: `<state_dir>/work_reports/<branch>/user-review-fix-plan-writer/round_<N>/report_<i>.md`, `i` next free from 0.
- [ ] B1. **Stop on an unreadable cited path** — return the blocker line, write no file, report inline. (ref: → ## Read on demand)

## Read and verify (write modes)
- [ ] R1. **Read the user-review file whole** — count observations; PR round: one per `## Review by` with a summary, one per inline comment. → `observations=…; comment ids=… | none`
- [ ] R2. **Resolve each observation's reference** — task, code-review finding, prior-round finding, SHA, file:line, PR comment, freeform. (ref: → ## Process step 2) → `obs → type → path read`
- [ ] R3. **Read only touched layers' conventions** — one document per layer an observation reaches; never all up front. → `read: … | none`
- [ ] R4. **Verify against today's tree, classify** — Must / Should / Nice / Invalid / Question. (ref: → ## Process step 3) → `obs → class → evidence path:line`
- [ ] R5. **Stop on any ambiguity** — write no plan file; return the questions as the output contract states; report inline.

## Write (write modes)
- [ ] W1. **Write the index** — title, context, readiness list, Must/Should/Nice pointers, out-of-scope, source observations verbatim. (ref: → ## Process step 4; plugin/samples/sample_user_review_fix_plan.md)
- [ ] W2. **Write readiness entries at `[ ]`** — blast-radius order; layer tag from fix-target paths, configured order, catch-all last; never edit a readiness section you did not author.
- [ ] W3. **Write one file per valid finding** — grep-verified site anchor, review-comment line when from inline comments, problem, fix. (ref: → ## Process step 4, per-finding files)
- [ ] W4. **Keep fixes free of forbidden test runs** — no configured test command, gate, or untouched test file. (ref: unit_loop_core.md → ## The test-run rule)
- [ ] W5. **Mirror the round suffix** — the per-finding folder matches the index name. → `index=…; folder=…`

## Check (write modes)
- [ ] C1. **Check one-to-one correspondence** — each valid observation once in readiness, once as a pointer, once as a file. → `readiness=…; pointers=…; files=…`
- [ ] C2. **Check layer tags against paths** — every tag matches the finding's fix-target paths under `layers[].path`.
- [ ] C3. **Check comment ids placed once (PR round)** — every marker id in exactly one finding line or out-of-scope suffix, unless held as a question. → `marker=…; placed=…`
- [ ] C4. **Check source numbering matches** — source-observation numbering equals the user-review file's.

## Lessons (initial write only)
- [ ] L1. **Append net-new, generalizable lessons** — grep the ledger first; one line in the ledger's format, or extend `taught by`; 0–3 is normal. (ref: → ## Process step 6) → `appended: … | extended: … | none`

## Revise (revise modes)
- [ ] V0. **Stop on a new ambiguity** — as R5; the caller re-enters its questions check after every revision.
- [ ] V1. **Read only what the revision names** — the existing index, the findings or feedback, and the files they name; re-verify nothing unreopened. → `findings: …`
- [ ] V2. **Apply or record each finding** — a rejection goes to the index's rejected-findings section; never close a Must Fix; never reject user feedback. (ref: → ## Revision mode) → `applied: …; rejected: …`
- [ ] V3. **Re-run C1–C4 on touched entries** — the correspondence still holds after the edit.

## Return
- [ ] O1. **Return the contract block** — counts equal the index sections; no plan content pasted. → `must=…; should=…; nice=…; invalid=…`
- [ ] O2. **Close this report** — on file: final `Edit`. No-write path: one `<ID> ✓ <evidence>` line each, after the reply's last line, no headings.
```

## Thinning plan

**The after figures are targets, not counts from a draft.** Each row's cut is attributed to three sources:

- **RED** — redundancy removed (measured);
- **→T** — ACTION prose that moves into template items;
- **short** — REFERENCE that is shortened or moved into the shared base.

WIRE literals stay verbatim.

| Lines | Today | RED | →T | short | Target | What stays verbatim / notes |
|---|---|---|---|---|---|---|
| 1–6 | 78 | | | | 78 | frontmatter |
| 7–11 | 86 | 56 | | | 30 | one-sentence role |
| 12–27 | 711 | 331 | 30 | 50 | 300 | The intro, the `<app_dir>` half of the `<repo_root>` row and the checkout-root prose go (they point to `CLAUDE.md`). Keep `<layer_names>` routing and the "never dot-named" rule |
| 28–63 | 248 | 66 | 10 | | 172 | all four prompt blocks, byte for byte (core :86, :114, :140, :150) |
| 64–76 | 595 | 153 | 70 | 100 | 272 | Merge :69–71 into the step-2 table. The docs-search paragraph moves to the base. Keep the `blocker:` rule (:75) |
| 77–89 | 652 | 96 | 106 | | 450 | the PR-round shape (:79) and the PR-comment rule (:87), whole: wire, and the grading standard |
| 90–96 | 210 | 20 | 40 | | 150 | the five class definitions (R4's `ref:`) |
| 97–109 | 744 | 68 | 100 | | 576 | Heading literals, readiness grammar, author-never-flips, out-of-scope suffix, site-anchor definition, `**Review comments:**` line |
| 110–119 | 239 | 149 | 60 | | 30 | a pointer, plus the C3 id rule |
| 120–123 | 201 | 86 | 50 | | 65 | the lesson line format, initial-write-only |
| 124–142 | 125 | 15 | 10 | −15 | 115 | The contract block and `(pending — questions for user)`. Add one sentence on the trailing evidence lines |
| 143–147 | 206 | 22 | 50 | | 134 | `## Rejected findings` formats, `call stands` |
| **Total** | **4 095** | **1 062** | **526** | **135** | **2 372** | |
| Samples (4 files) | 1 959 up-front | | | | 0 up-front | The files are unchanged; they become W1/W3 `ref:` targets |

**Shared base (≈ 250 words).**

- **Contents:** the checkout-root pointer, `blocker:`, docs search as navigation, the rejected-findings formats, and the filing rules.
- **Sharers:** the docs-search paragraph is in 10 agents and the rejected-findings formats in 4 (`grep -l "rejected round"`); `call stands` is in 8.
- **Cost to this agent:** it adds 250 and removes ≈ 100 from :73. Without the base, the target totals drop by 150.

## Word-count ledger

**Up-front words, by scenario**

| Scenario (this repo) | Before | After | Delta |
|---|---|---|---|
| Initial write, targets (definition 2 372, template 735, base 250, `CLAUDE.md` 1 695, config 154, lessons 1 199, samples 0) | 9 102 | 6 405 | −2 697 |
| Initial write, targets, samples kept up-front | 9 102 | 8 364 | −738 |
| **Conservative:** only measured REDUNDANT removed (definition 3 033), samples kept | 9 102 | 9 025 | **−77** |
| Revision, targets | 5 944 | 5 206 | −738 |
| Revision, conservative | 5 944 | 5 867 | −77 |
| Any row above with `CLAUDE.md` winning (+5 864 to both columns) | | | unchanged |

**Where the saving comes from.** The mechanism costs +985. Against it: the samples move (−1 959) and thinning (−1 062 measured to −1 723 at the targets).

**On-demand words**

| File | Before | After |
|---|---|---|
| Samples | — | 1 959 |
| Test-run rule | 732 | 732 |
| `deliver` paragraph | 189 | 189 |
| Layer conventions | 2 647–5 864 each | unchanged |

**Constraint holds: yes**, in every scenario. The conservative margin, though, is 0.8 %. Dropping the base widens it to −327.

## Storage and lifecycle

- **Key (lead 4).** `<state_dir>/work_reports/<branch>/user-review-fix-plan-writer/round_<N>/report_<i>.md`.
  - `<N>` is the `<fix_plan_path>` suffix (core :68–71). It is in every prompt and needs no ledger.
  - The mode goes in the report title.
- **Index (lead 10).** The agent globs its round folder and takes the next free integer from 0. That is collision-safe: one writer at a time, and a fresh folder per round.
  - Do not borrow the gate counters. They reset to 0 on every gate entry (core :97, :123) over flat `<branch>/` folders (core :103, :129), and the reviewer writes `review_{iteration}.md` (`architecture-reviewer.md:83–84`). Round 2 therefore overwrites round 1's `review_0.md`.
  - On disk, `harness-runs/architecture_user_review_reviews/*/` holds only `review_0.md` and `review_1.md`.
  - This makes `…_autonomous.md:93`'s "appends findings" claim false. In the supervised fork round 1's copy is never committed (`…_autonomous.md:73`), so it is lost outright. This is an existing bug.
- **Embedding the report (lead 11), rejected.**
  - **In the index:** `## Rejected findings` must be last (:147), the gates review the index, and `deliver` parses its `**Review comments:**` bullets (`remote-run.sh:443–452`).
  - **In the per-finding folder:** Override 3 stages it whole (`…_autonomous.md:87`), but the gates read it as `task_files_dir` (core :101, :127).
- **No-write paths (leads 2 and 8).** `## Questions` (:139) and `blocker:` (:75) forbid plan files, and an autonomous park ends the session (`…_autonomous.md:44`). Hence the deferred `Write` and the inline lines.
  - **Keeper (goal a).** The autonomous fork should copy those lines into the `question_<n>.md` it already writes (`…_autonomous.md:44`), a one-sentence change.
  - **Supervised:** the orchestrator relays only the questions (core :89), so goal (a) is **nil** there.
- **Commit (leads 3 and 8).**
  - **Autonomous.** Add the round folder to Override 3's explicit list (`…_autonomous.md:84–91`). The wrapper warns and skips a missing path (:87, :93, :100). Every writer dispatch of a round precedes Override 3, Override 2 (a) resumes included, so no report reaches Phase A.
  - **`lessons.md`, both forks.** No instruction commits it: `grep -rn lessons plugin/instructions plugin/commands plugin/agents/committer.md` finds only the `run_mode_instructions.md:39` citation. Phase A's first `review_item` committer sweeps it in as a `git status --short` "code file" (`committer.md:111–112`). That flips reconciliation to **Yes** (`committer.md:83`) and suppresses `staged: index-only`. **Fix:** add `<state_dir>/lessons.md` to Override 3's list.
  - **Supervised.** Reports, the per-finding folder and `lessons.md` are all swept into the first `review_item` commit, because the fork leaves them uncommitted (`…_autonomous.md:73`). The report widens an existing leak, and one committer exclusion would fix all three.
- **Leakage (lead 12).**
  - The writer builds absolute paths (:97, :120), hence the template's rule: repo-relative paths only, no timestamps, no env output.
  - Byte-stable reports also keep Override 3's exit-3 idempotency (`…_autonomous.md:95`).
- **Tools and hooks (lead 1).** The agent `Write`s from the embedded template, so it needs no `cp`. The only `PreToolUse` matcher is `Bash` (`plugin/hooks/hooks.json:5`), and `Write(/{{repoRoot}}/**)` and `Write(/{{worktreeGlob}}/**)` are allowed (`cli/templates/claude/settings.autonomous.json:50–51`).
- **Reviewers (leads 5 and 9).**
  - No plan gate reads the report.
  - `branch-reviewer` and `skeptic-reviewer` need a `work_reports/` exclusion for later diffs.
  - `review-plan-reviewer` never sees this plan.

## Risks and costs

1. **Calls.** Per-section ticks: ≈ 5 `Edit` calls per write and 3 per revision, so ≤ 35 per round (per-item: ≈ 25 per write).
2. **Goal (a) needs evidence and a reader (lead 6).** Tick timing cannot be verified. The R4 table and the C1/C3 counts are the evidence, and nobody reads them. Having the architecture gate cross-check C1 against the returned counts would be cheap, but it is new scope.
3. **Goal (b).**
   - The rules at :117 and :118, buried in a restating list, become C3 and W4.
   - L1 records "no lesson" explicitly. Keep "net-new, generalizable" in its wording.
4. **Misapplication and ref-starvation (lead 7).**
   - R4 without the severity definitions (:91–95) misgrades exactly what the gates grade, so keep the `ref:`.
   - :87 stays whole: re-locate by hunk, never by line, and never treat a whole-file comment as out of scope.
   - V1 "re-verify nothing unreopened" must not block re-checking a site a gate finding moved.
   - Moving the samples risks heading drift, but step 4 keeps every literal up-front.
5. **Wire that must not move.**
   - The four prompt blocks.
   - The six-line return and `(pending — questions for user)`.
   - The readiness grammar (committer; `deliver`'s `[x] **Finding <K>**`, `remote-run.sh:455`).
   - Both `**Review comments:**` forms (`remote-run.sh:443–452`, `cli/test/remote-deliver-threads.test.mjs:11, :126–128`).
   - `## Rejected findings` and `call stands`.
   - The lesson line.
   - **Tests.** No test asserts the prose.

## Open questions

1. Should `round_<N>` become the generic key for per-round agents: the gate reviewers in user-review mode, the fixes-flow units, and the QA.0 augment?
2. Plan-gate counters reset per round over flat folders, so `review_0.md` is overwritten each round, and in supervised runs lost. Should this be fixed separately?
3. Both forks leak `lessons.md` into the first `review_item` commit, and the supervised fork also leaks the plan family. Should the fix be one committer exclusion (`<state_dir>/work_reports/`, `lessons.md`), or Override 3 additions plus a supervised planning commit?
4. Should the samples move to `ref:` for every writer? That is the cheapest saving across agents.
5. Should the template be embedded in the definition (counted up-front, as here) or kept as a separate file that is read and then written?

## Review response

All findings were applied and each changed figure was re-measured; none was rebutted.

- **Must Fix 1, clarification.** Most of the gap between the 1 723-word cut and the 1 062 measured REDUNDANT is ACTION prose moving into template items (526). The thinning table now attributes every word cut.
