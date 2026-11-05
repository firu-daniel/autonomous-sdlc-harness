# Work report research — architecture-reviewer

## Verdict

**Recommend with changes.** The real win is the thinning. About 1 030 of the definition's 5 139 words are redundant, and the agent reads all 732 words of `## The test-run rule` when it needs only points 3–4 (150 words). With a 769-word template, the up-front load still falls by about 1 900 words. The report itself must change in four ways:

1. **No separate report file (leads 8 and 11).** On FAIL, the report goes in as a trailing `## Work report` section of the findings artifact the flow already commits at every insertion point. On PASS, the report is returned inline above `verdict: PASS`, the same way `## Unsolicited dispatch guidance` already is. This needs no new path, no storage key, no index and no committer change, and it removes the Phase A2 PASS orphan.
2. **Filled once, before returning.** This is a choice, not something the tools force. `sed -i` is allowed unattended (`settings.autonomous.json:39`), but end-filling saves a call per tick and keeps a read-only reviewer from editing files in place. Keep `architecture-reviewer.md:10` verbatim, because with `sed` available it is the only guard on that posture.
3. **Narrow the PASS-return contract.** "Return exactly `verdict: PASS` — Nothing else" (`:181–187`) gains an optional `## Work report` section above the verdict. "Writes no file on PASS" stays true, so none of the 5 caller-side "no file written" texts change.
4. **Evidence that does not leak (lead 12).** Evidence tails carry repo-relative paths, counts and verdict lines only.

If durable PASS evidence becomes a requirement, the fallback is a separate file with an explicit commit point (`## Storage and lifecycle`), and that fallback costs about 10 cross-file edits.

## Read tree

Measured with `wc -w` in this repository (layers `cli`, `plugin`, `general` at `.`; `phases.docs`/`parity` false).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/architecture-reviewer.md` | up-front | 5 139 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 |
| **Every** `layers[].conventions` (`architecture-reviewer.md:116`): `cli.md` 2 647 + `plugin.md` 4 174 + `conventions.md` 5 864 | up-front | 12 685 |
| `<state_dir>/lessons.md` (`:119`) | up-front | 1 199 |
| `unit_loop_core.md` → `## The test-run rule`, "in every mode" (`:120`); whole section incl. 17-entry citer roster | up-front | 732 (point 4 `:150` alone 90; with point 3 `:149`, which point 4 is "conditioned on", 150) |
| `test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.** (`:121`, sub-case (c) only) | up-front in (c) | 85 |
| `<docs_root>` + `mcp__harness-docs__search_docs` (`:117–118`) | on demand, docs on only | n/a here |
| `business-parity-reviewer.md`, `branch-reviewer.md`, `layer-reviewer.md` (`:160–161`, scope pointers only, never told to read) | not read | — |
| Dispatch inputs: plan index + every detail file (plan mode) / diff hunks (diff mode) | up-front, variable | n/a |

**Up-front total:** IP1/IP2/IP3 = 5 139 + 1 695 + 12 685 + 1 199 + 732 = **21 450**. IP4 adds 85 for **21 535**. The agent owns 5 871–5 956 of that: the definition plus the two plugin sections it cites. The rest is adopter content shared with every reviewer.

**Read-list conflicts (lead 13): none that add words.** CLAUDE.md's `## Context files` asks a reviewer to read `conventions.md` and, at branch level, the lessons ledger. The agent's own list already covers both, so the agent's list is the larger set and it is the one counted.

## Dispatch sites and phases

| IP | Mode | Dispatch site | Flows | Ledger id | Dispatches per branch |
|---|---|---|---|---|---|
| 1 | plan (a) | `task_plan_writing_instructions_core.md` → `### 3. Architecture review` (:189–204); walker node `architecture_review` (`scripts/flows/task_plan_writing.graph.json:68–71`) | semi-autonomous, autonomous planning; **not** supervised `branch-start-plan` (no match) | `P1` (shared with 2 other gates) | 1–5 per loop pass (cap `iteration >= 5`), more on re-entry |
| 2 | diff | `plan_orchestration_instructions_core.md` → `### A2.1` (:222–246) | semi-autonomous, autonomous implementation | `A2g` | **exactly 1** (`iteration: 0`, no re-review after the A2.3 fixes) |
| 3 | plan (b) | `user_review_fix_plan_writing_instructions_core.md` step 8 (:119–140) | **supervised** `branch-start-user-review-fix-plan` (`commands/…:24`) and autonomous user-review engine | `R1`, re-seeded per round (`autonomous_pause_and_ledger.md:90–102`) | 1–5 per user-review round, every round |
| 4 | plan (c) | `plan_orchestration_instructions_core.md` → `### G.2` "The architecture gate" (:594–610); the user-review flow runs the same Phase G with `<gate_key>` = `review_<n>` (`user_review_fixes_instructions_core.md:73`) | semi-autonomous, autonomous (task and user-review) | `G` / `RG` (no round in the id) | 0 when gates pass; 1–5 per failing gate round with `fixable > 0` |

IP2 and IP3 are skippable by run mode (core :218, UR core :121). The agent is on the receiving-side roster (`dispatch_discipline_instructions.md:68`).

## Prose classification

The section totals are measured with `sed -n | wc -w`. The split into classes is an estimate made sentence by sentence and sums to each total. A = ACTION, R = REFERENCE, W = WIRE, D = REDUNDANT.

| Section (lines) | Total | A | R | W | D | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 79 | – | – | 79 | – | loader-parsed |
| Intro (7–11) | 163 | 30 | 70 | 63 | – | W: the `Edit`-omission line (`:10`). It is the read-only posture guard now that `sed -i` is allowed unattended (lead 1 correction), so it stays verbatim |
| `## Resolved values` (12–28) | 600 | – | 330 | – | 270 | D: the 100-word preamble; the `<repo_root>` row restates CLAUDE.md `> Checkout root` |
| Invocation preamble (30–37) | 196 | 40 | 40 | 70 | 46 | W: `verdict: PASS` / `verdict: FAIL` exactness. D: the quoted caller text |
| Plan-review mode (38–87) | 507 | 60 | 220 | 150 | 77 | W: the three key blocks, mirrored by the 3 callers |
| Implemented-solution mode (88–113) | 298 | 60 | 48 | 120 | 70 | W: the dispatch block and the literal `"N run-artifact files excluded from the reviewed diff."` D: the `--stat` command is repeated at :132 |
| `## Read first` (114–124) | 439 | 120 | 200 | 30 | 89 | W: the `blocker:` line |
| `## Process` + rejected findings (125–136) | 494 | 250 | 170 | 20 | 54 | W: `## Rejected findings`, `rebutted round <j> — call stands` (quoted by 8 files) |
| `## What to check` (137–153) | 652 | 150 | 420 | – | 82 | R is the **grading standard** (lead 7). D: "replace with your project's rule" ×3, repeated `Source:` phrasing |
| Verify justifications (154–155) | 171 | 30 | 110 | – | 31 | |
| `## Scope boundary` (156–164) | 150 | 20 | 100 | – | 30 | |
| `## Unsolicited dispatch guidance` (165–174) | 296 | 40 | 140 | 30 | 86 | Near-verbatim in 10 roster agents. W: the heading and `(disregarded for verdict purposes)` |
| Clean review (175–188) | 48 | 10 | 8 | 30 | – | |
| Plan-review FAIL (189–213) | 212 | 22 | 70 | 120 | – | W: the flat findings template |
| Implemented FAIL (214–227) | 615 | 40 | 180 | 300 | 95 | W: `## Phase 2 Readiness — Ordered Fix List` (byte-identical; the heading literal is keyed in `cli/test/remote-deliver-threads.test.mjs:124`, a fix-plan fixture), the entry format, `### N. Title`, the pointer line. D: the :226 committer-compatibility rationale |
| Return lines (228–241) | 85 | – | 25 | 60 | – | |
| Findings-folder convention (242–252) | 134 | – | 30 | – | 104 | restates the caller blocks |
| **Total** | **5 139** | **872** | **2 161** | **1 072** | **1 034** | |

`## The test-run rule`: this agent uses point 4 (`unit_loop_core.md:150`, 90 words). Point 4 is "conditioned on (3)", so it also needs point 3 (`:149`, 60 words), 150 words in all. The other 582 words cover implementer behaviour (points 1–2, 5–6) and the citer roster, so for this agent they are D. The roster requires citers to "point and never restate" (`:172`). A pointer to "points 3–4" still targets the rostered heading, so the narrowing complies.

## Draft work report template

There is one template with mode-gated groups. The agent ticks the group that does not apply as `n/a`. Separate PASS/FAIL or plan/diff templates are not needed, because only G1–G5, K12–K13 and O1–O2 differ. The template lives as a fenced block in the agent definition, so there is no extra file to read and no `cp`. It is filled once, before returning: on FAIL it is appended to the findings artifact, and on PASS it is returned above the verdict. Headings are `###` so they nest under `## Work report`. No heading or item says "Must Fix", so a writer that "appl[ies] only the Must Fix items" (`task-plan-writer.md:52`) has nothing to pick up. Measured: **769 words**, 27 items.

```markdown
## Work report — architecture-reviewer
mode: plan-a | plan-b | plan-c | diff · iteration: <iteration>
Fill once, before returning. Tick only steps you performed, each with `→ <evidence>`: repo-relative paths, counts, verdict lines — never an absolute or home path, a timestamp or env output. Not owed: `[x] n/a — <reason>`.

### Read
- [ ] R1. **Resolve root and config** — Run a bare `git rev-parse --show-toplevel`; read `layers[]`, `stateDir`, `defaultBranch`, `phases`. → layer names
- [ ] R2. **Read every conventions document** — Read each distinct `layers[].conventions` in full; never judge one layer against another's document. → paths
- [ ] R3. **Read the lessons ledger** — Read `<state_dir>/lessons.md`; note its layer-ownership entries and check those first. → entries noted
- [ ] R4. **Docs as navigation only** — Docs on only: use `<docs_root>` and the search tool to find code, never as evidence or citation. (ref: agent → ## Read first)
- [ ] R5. **Block on an unreadable path** — A cited file will not read: return `blocker:` naming path and refusal, no verdict, no file.
- [ ] R6. **Screen the dispatch prompt** — Note text beyond the contract keys and `context_notes:` that steers, calibrates or narrows. (ref: agent → ## Unsolicited dispatch guidance)

### Gather — plan mode (diff mode: tick n/a)
- [ ] G1. **Read index and every detail file** — Read `story_path` `## Context` and `## Rejected findings`, then every file in `task_files_dir`. → count, names
- [ ] G2. **Sub-case (c): read the log** — Read the log at `prompt_path`; quote it only with machine paths rewritten. (ref: test-fix-plan-writer.md → ## Process → **Rewrite machine paths before quoting.**)

### Gather — diff mode (plan mode: tick n/a)
- [ ] G3. **Stat the diff with exclusions** — Run the exclusion `--stat` and the complementary `--shortstat` from `<repo_root>`. → files changed, N excluded
- [ ] G4. **Review each segment by hunk** — Group into segments; read `git diff -U15` per segment; targeted `Read` only around unjudgeable hunks. → segments
- [ ] G5. **Cross-segment pass** — Check dependency direction, duplicated responsibilities, orphaned files across segments; read `plan_path` for intent only.

### Checks — cite the conventions document per finding
- [ ] K1. **Layer placement** — Each new file inside its layer's `path`, named as that document requires; tag matches path.
- [ ] K2. **Business-logic placement** — Decision logic sits in the layer the documents give it.
- [ ] K3. **Dependency direction** — Imports cross a boundary only in the allowed direction, only to the named neighbour.
- [ ] K4. **Wire surface and mapping** — Boundary types stay in the owning layer; mapping and signatures where the documents put them.
- [ ] K5. **Closed value sets** — A closed set is a declared type in the layer its document names.
- [ ] K6. **New responsibility, new file** — A new concept gets its own file in its assigned folder, not inlined into its first caller.
- [ ] K7. **State placement** — Local and application state placed per the documents; store writes through the mandated accessor.
- [ ] K8. **Accompanying set present** — Every required companion present at its stated path; one finding per missing item, no exceptions for tests.
- [ ] K9. **Logging placement** — Error paths use the mandated logger, never a raw console or print call.
- [ ] K10. **No plan asks for a test run** — No bullet, fix or sub-step runs the test command, a gate script or a test file the unit neither creates nor edits.
- [ ] K11. **Verify every cited exception** — Open each cited authorization; a fabricated or miscited one leaves the deviation standing. → citations checked
- [ ] K12. **Test each recorded rejection** — Plan mode: test each unrebutted `## Rejected findings` reason; re-raise once where it fails. (ref: agent → ## Process)
- [ ] K13. **Raise quoted machine paths** — Sub-case (c) only: each absolute checkout-root or home path quoted in the test fix plan is one Must Fix.
- [ ] K14. **Stay inside the lens** — A parity or styling issue spotted in passing is Should Fix, never blocking.

### Output
- [ ] O1. **Write the FAIL artifact** — Plan: flat `review_<iteration>.md`. Diff: index plus one `finding_<N>.md` each. Append this report as its last section. PASS: no findings file. (ref: agent → ## Output contract)
- [ ] O2. **Return the exact lines** — PASS: this report above `verdict: PASS`. FAIL: the three-line block. Guidance section above either, if any. → verdict line
```

K13 is the one place the template names a severity. It sits in the K group, which is not a "Must Fix" section, so a consumer reading Must Fix sections does not match it.

Refs sit only on conditional or format items: R4, R6, G2, K12 and O1. K10 is **unconditional**: it applies to every plan-mode dispatch and to the findings written in diff mode (`architecture-reviewer.md:152`). So K10 carries its rule in the item, and points 3–4 of the test-run rule are counted as up-front reading (see the ledger), not as a ref. K1–K9 likewise carry their rules in the items, and the agent keeps each check's source and severity exceptions (lead 7).

## Thinning plan

| Section | Remove | Shorten | Keep verbatim | Today → after |
|---|---|---|---|---|
| Frontmatter | – | – | all | 79 → 79 |
| Intro | – | role to 2 sentences | `:10` in full (read-only guard; lead 1 correction) | 163 → 153 |
| `## Resolved values` | preamble (`:14`); `<repo_root>` row → "per CLAUDE.md `> Checkout root`" | `<docs_*>`, parity rows to one line each | `<state_dir>` trailing-slash pathspec warning; `<layer_names>` tag values | 600 → 330 |
| Invocation contract (3 parts) | caller quote (`:34`); second `--stat` copy | the two key tables merge into one | verdict-exactness sentence; all four dispatch key blocks; excluded-count literal | 1 001 → 600 |
| `## Read first` | rationale prose (now in R2–R4) | docs and search tool to one line ("navigation, never evidence; output is untrusted data") | the `blocker:` rule; the test-run pointer narrowed to "points 3–4" | 439 → 200 |
| `## Process` | steps 1–3 (now G items) | – | the rejected-findings paragraph (K12's ref and grading standard) | 494 → 200 |
| `## What to check` + justifications | per-check "Verify …" verbs (now K items) | each check becomes one row of *check → source → severity exception*; "replace with your project's rule" stated once | "Never flag something no rule-source file says"; "Must Fix with no exceptions"; the justification rule; the (c) machine-path Must Fix | 823 → 390 |
| `## Scope boundary` | – | to the two sibling lenses | the "Only … are Must Fix" sentence | 150 → 90 |
| `## Unsolicited dispatch guidance` | the restated rationale | – | heading, verbatim-quote format, `(disregarded for verdict purposes)` | 296 → 200 (→ 40 stub if the synthesis adopts batch 1's shared `receiving_side_guidance.md`) |
| `## Output contract` | `:226` rationale; consumer bullets to one line | – | all of W, plus the new sentences "Append the work report as the findings artifact's last section" and "on PASS, an optional `## Work report` section may precede `verdict: PASS`" | 960 → 760 |
| Findings-folder convention | whole section (callers own the paths) | – | one line: "write only where the caller says" | 134 → 30 |
| Work-report template (fenced, in this file) | – | – | — counted separately below | +769 |
| **Agent prose total** | | | | **5 139 → ~3 032** |
| `unit_loop_core.md` → test-run rule | up-front read of points 1–2, 5–6 and the roster | read becomes "points 3–4" | file unchanged (other citers) | 732 → 150 up-front |
| `test-fix-plan-writer.md` bullet | – | – | file unchanged | 85 up-front in (c) → 0 up-front / 85 on demand via G2 (conditional) |
| CLAUDE.md, conventions docs, lessons | out of scope (adopter-owned) | – | – | unchanged |

**This estimate is not a draft.** The ~3 032 figure is a sum of per-section estimates, with no drafted text and no sentence-level subtraction behind it. **The constraint does not depend on it.** It holds as long as the definition's prose falls below 5 139 + 732 − 769 − 150 = **4 952** words. That is a cut of **188 words**, less than the 270 redundant words in `## Resolved values` alone. For IP4 the threshold is 5 037, a cut of 103.

**Shared base.** `business-parity-reviewer.md` shares about 1 500 words of identical lines with this file (`grep -Fxf`): the Resolved-values rows, the invocation keys, Output contract scaffolding and the Unsolicited guidance section. Branch, skeptic, layer and task-plan reviewers share 455–576. A shared `plan_mode_reviewer_base.md` would serve the architecture and business-parity reviewers. It would hold the plan-review key table, the flat FAIL template and the return lines. The flat template is W and is needed on every FAIL, so this saving is not counted here.

## Word-count ledger

| Up-front | Today | After | Delta |
|---|---|---|---|
| `architecture-reviewer.md` prose | 5 139 | ~3 032 | −2 107 |
| Work report template (fenced in the definition) | 0 | 769 | +769 |
| test-run rule section | 732 | 150 | −582 |
| test-fix-plan-writer bullet (IP4 only) | 85 | 0 | −85 |
| **Agent-owned subtotal (IP1–3 / IP4)** | **5 871 / 5 956** | **~3 951** | **−1 920 / −2 005** |
| CLAUDE.md + conventions + lessons | 15 579 | 15 579 | 0 |
| **Full per dispatch (IP1–3 / IP4)** | **21 450 / 21 535** | **~19 530** | **−1 920 / −2 005** |

| On demand | Today | After |
|---|---|---|
| machine-path bullet (G2, sub-case (c)) | (up-front in c) | 85 |
| docs corpus / search (R4) | n/a here | unchanged |

**Constraint holds: yes**, with the 188-word margin stated above. In honest terms, the template is +769 net, and the saving comes entirely from thinning, which is worth doing on its own.

## Storage and lifecycle

**Chosen design (leads 8 and 11): embed on FAIL, return inline on PASS.**

| Path | Where the report goes | Already committed by | Consumer misread risk |
|---|---|---|---|
| IP1 FAIL | last section of `architecture_reviews/<branch>/review_<i>.md` | autonomous convergence commit (`task_plan_writing_instructions_autonomous.md:153`); semi-autonomous: user, folder listed at `…_semi_autonomous.md:40` | Low. `task-plan-writer` "appl[ies] only the Must Fix items" (`task-plan-writer.md:52`), and the report has no Must Fix heading |
| IP2 FAIL | last section of the index `<branch>_arch_review.md` | A2.2 `review_plan_file` (`committer.md:113`) | Low. The committer and the fix loop key on `## Phase 2 Readiness — Ordered Fix List` entries `N. [ ]` only, and the report uses `- [x]` bullets outside that section. `review-plan-reviewer` (the orphan check of lead 9) is never dispatched on this index: its `review_path:` is only the code and skeptic indices (`plan_orchestration_instructions_core.md:298`, `:378`) |
| IP3 FAIL | last section of `architecture_user_review_reviews/<branch>/review_<i>.md` | `user_review_fix_plan_writing_instructions_autonomous.md:107`; supervised: user | Low, same as IP1 |
| IP4 FAIL | last section of `<test_fix_review_folder>/review_<i>.md` | G.3 `meta_findings_folder` (`plan_orchestration_instructions_core.md:620`) | Low, same as IP1 |
| Any PASS | `## Work report` section above `verdict: PASS` in the return | not persisted to the repository | None on disk. Callers already accept an optional section above the verdict (`:240`) |

| Question | Answer |
|---|---|
| Storage key / index (lead 4) | **None needed.** FAIL reports inherit the caller's existing `findings_folder` + `iteration` or `index_path`, and PASS reports are not stored. The insertion-point key below applies only to the fallback. |
| Collision safety (lead 10) | Inherits existing behaviour. IP1, IP2 and IP4 are collision-free: IP2 has one per branch, and IP4's folder carries the gate round. **IP3 is not.** The folder has no round, and `arch_iteration = 0` is set every round (UR core `:123`, `:129`), so round 2's first FAIL rewrites round 1's tracked `review_0.md`, report included. Git history keeps round 1's file. The parity gate has the same collision (`parity_iteration = 0`, UR core `:97`). |
| Tools (lead 1, corrected) | `Write` with no `Edit` tool. `sed -i`, `cat` and `mkdir -p` are allowed unattended (`cli/templates/claude/settings.autonomous.json:36–51`), so in-place ticking would work. Filling once is the **choice**: one write, and the read-only posture of `:10` intact. On FAIL, the report is part of the single findings `Write`, so it costs no extra call. On PASS it costs only output tokens. |
| PASS writes nothing (lead 2) | **Preserved on disk.** Only the return contract changes: `:181–187` "Return exactly … Nothing else" gains the optional section. The caller-side "no file written" texts all stay true, at all 5 sites: `plan_orchestration_instructions_autonomous.md:191` and `:193`, `plan_orchestration_instructions_core.md:245`, `autonomous_pause_and_ledger.md:77` (`A2g`), and the four "do NOT `mkdir -p` here" notes. The callers' "`verdict: PASS` →" routing at core `:245`, `:610` and UR core `:136` must tolerate a preceding section, as they already do for the guidance section. |
| Committer (lead 3) | No change. No new path is staged, so subject reconciliation (`committer.md:83`) is untouched. |
| Hooks / gitignore | `hooks.json` matches `Bash` only. All FAIL artifacts are already tracked. |
| Reviewing reports (lead 5) | At IP2 the diff excludes `':(top,exclude)<state_dir>/*<branch>*'` (`:109`), and `*` crosses `/`, so other agents' reports are not graded. |
| Leaks (lead 12) | R1's evidence is the layer names, not the root. The template header forbids absolute or home paths, timestamps and env output, so a FAIL artifact passes gate 6a (`scripts/run-gates.sh:141–143`). |

**Fallback design: a separate file, if PASS evidence must be durable.** Path `<state_dir>/work_reports/<branch>/<key>/architecture-reviewer/report_<index>.md`, with key `plan` / `branch` / `ur<n>_fix_plan` / `<gate_key>_gates_<gate_round>`. Ledger ids would not work: IP1 shares `P1`, IP1 and IP2 run in semi-autonomous flows with no ledger, IP3 runs supervised, and `R1`/`G` carry no round. The caller computes the next free index (`iteration` repeats after a PASS at IP1, and is always 0 at IP2). This costs:

- 4 dispatch blocks;
- 5 PASS-wording sites;
- 3 commit lists plus the committer's staging and exclusion rule;
- a new commit point for IP2 PASS. Without it, the next `task`/`review_item` committer stages the report with "the code files shown by `git status --short`" (`committer.md:111–112`) and breaks reconciliation.

## Risks and costs

- **PASS evidence is not durable (biggest, under the chosen design).** A PASS report lives only in the session's return. In autonomous runs that means the gitignored `autonomous_logs/` stream. A rubber-stamp PASS, which is exactly what goal (a) is meant to expose, leaves no committed trace. Fixing that means taking the fallback design and its IP2 PASS commit point.
- **Goal (a) timing is unverifiable.** The report is filled once, so every tick is self-attested after the fact. Its value comes only from the evidence tails: R2 paths, G1 file count and names, the G3 excluded count (cross-checkable against the index Context line), and K11 citations. No caller reads review content (`task_plan_writing_instructions_core.md:313`, UR core `:182`).
- **Consumer misread.** A writer in revision mode reads the whole findings file. The report avoids any "Must Fix" heading, and K13 is phrased as a check. A writer could still treat an unticked item as an instruction. Low risk, but it should be named in the writers' revision rule ("ignore `## Work report`").
- **Ref-starvation (lead 7).** The unconditional checks carry their rules in the items, and the definition keeps their sources and severity exceptions.
- **Misapplication by detachment.** K8's "one finding per missing item, no exceptions for tests" and K11 lose force if the agent's "no exceptions" wording is cut. Keep those phrases verbatim.
- **Cost.** On FAIL it adds ~800 output tokens inside the existing `Write`. On PASS it adds ~800 output tokens in the return. Against that, about 1 900 input words are saved per dispatch, on 3–16 dispatches per branch.
- **Tests and scripts.** `cli/test/flow-walker*.test.mjs` key on the heartbeat and agent name (`flow-walker.test.mjs:44`, `:89`). `remote-deliver-threads.test.mjs:124` keys on the heading literal (W, kept). No hook or script greps the prose being moved.
- **Cross-file edits (chosen design).**
  - The PASS-return sentence in this definition.
  - Tolerance of a preceding section at 3 caller parse sites.
  - The writers' revision rule (3 writers).
  - The test-run citation narrowed to "points 3–4" (the roster is unchanged).

## Open questions

1. **Report placement across agents.** Should every reviewer use embed-on-FAIL / inline-on-PASS? Or does the synthesis need durable PASS evidence, which forces the separate-file fallback and a commit point on every PASS path?
2. **Writers' revision rule.** Should "ignore a trailing `## Work report` section" live in one shared line that the three plan writers cite?
3. **IP3 round collisions.** Is the collision (`architecture_user_review_reviews/<branch>/review_0.md` and the parity gate's twin at UR core `:97`, both reused every round) worth fixing alongside this change?
4. **Shared plan-mode base.** Should architecture and business-parity reviewers share a plan-mode base (about 1 500 identical words)?
5. **Shared receiving-side file.** Does the synthesis adopt batch 1's shared `receiving_side_guidance.md`? It conflicts with `dispatch_discipline_instructions.md:72`.
6. **Who reads these reports?** Without a consumer, goal (a) gives storage, not assurance.

## Review response

All Must Fix and Should Fix findings are applied, along with Nice to Have 1, 2 and 4. Nice to Have 3 (body length) is partly applied: the template grew and the storage section now covers two designs. Nothing was rebutted. Should Fix 6 changed the design: the separate file is now the fallback, and the verdict's condition 4 is withdrawn.
