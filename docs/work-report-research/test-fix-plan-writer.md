# Work report research — test-fix-plan-writer

## Verdict
**Recommend with changes.** This agent fits the idea better than most. It already ends in a seven-bullet `## Quality checks before returning` checklist (`plugin/agents/test-fix-plan-writer.md:92–100`), it has both `Write` and `Edit`, and it writes into a folder that G.3's committer already stages whole (lead 11).

The up-front load drops from 6 105 to about 4 664 words, the 590-word template included (−24 %). If `CLAUDE.md`'s routing table also loads `context/conventions.md` and the lessons ledger (lead 13, the worst case), it drops from 13 168 to 11 727 (−11 %). The constraint holds either way. On lead 13 the agent definition should win, but neither file says so today (see `## Open questions` 1).

The changes required:

1. Store the report **inside the round's per-finding folder**, as `work_report.md`, with one `## Dispatch <d>` section per dispatch. Do not use the proposed `work_reports/` tree.
2. Make **every read that can produce a `blocker:` happen before the first disk write**, and create the report only once the index is written. That way the `## Questions` and `blocker:` paths still write nothing.
3. Tick at checkpoints (one `Write` and up to two `Edit`s per dispatch), not per item.
4. Make the user-review sample on-demand.
5. Keep `## Process` step 5's bold title and every template literal verbatim in the definition.

Goal (b) gains little here, because the rules most likely to be missed are already checklist items.

## Read tree

The basis is this repository (`harness.config.json`: layers `cli`, `plugin` and `general`; `phases` qa, docs and parity all `false`). The agent's own heading says "no auto-loaded context" (:46), but that is inaccurate: `CLAUDE.md` is auto-loaded regardless.

**Lead 13: which read list wins.** The agent should win: its :51 is the specific instruction, saying to read only the fix layer's document and "Never read all of them up front". `CLAUDE.md`'s rows are generic routing for undirected work. But no file states that precedence, and `CLAUDE.md` says to "read the relevant file before starting work in that area", so a model may follow both. That is why the worst case is counted.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/test-fix-plan-writer.md` | up-front | 2 411 |
| `.claude/CLAUDE.md` (auto-loaded; notes-app 1 676) | up-front | 1 695 |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (:140–176), "before writing any finding" (:52, :98) | up-front | 732 |
| `plugin/samples/sample_user_review_fix_plan.md` (:79, the split-format reference) | up-front | 985 |
| `plugin/samples/sample_user_review_fix_plan/finding_<N>.md` (:79; one file assumed: finding_1 282, _2 375, _3 317) | up-front | 282 |
| **Up-front fixed total** | | **6 105** |
| `.claude/context/conventions.md`: `CLAUDE.md` row "**Any** implementation, review or planning" (`.claude/CLAUDE.md` → `## Context files`; generated for every adopter by `cli/src/generators/claudeContext.ts:470`) | up-front **only if `CLAUDE.md` wins** (lead 13) | 5 864 |
| `harness-runs/lessons.md`: `CLAUDE.md` row "Planning or reviewing at branch level" (`.claude/CLAUDE.md:43`). The agent mentions the ledger only to ban appending (:105) | up-front **only if `CLAUDE.md` wins** and a gate-round plan counts as "branch level" | 1 199 |
| **Up-front worst case (lead 13)** | | **13 168** |
| The log at `<log_path>`, in full (:48) | up-front, variable | n/a (unchanged) |
| Earlier-round logs (:49) | on demand (rounds 2–4) | variable |
| Failing test/gate source and the code it exercises (:50) | on demand | variable |
| The fix layer's conventions document (:51): `context/cli.md` 2 647, `plugin.md` 4 174, `conventions.md` 5 864 (notes-app 2 304–5 125) | on demand (in practice one or more per dispatch) | 2 647–5 864 each |
| `<docs_root>` / `mcp__harness-docs__search_docs` (:53) | on demand, only with `phases.docs` and `docs.retrieval` | n/a here |
| The architecture findings file (revision prompt, :41) | up-front on revision | variable |

## Dispatch sites and phases

| Site | Flow / mode | Prompt | Key available | Times |
|---|---|---|---|---|
| `plan_orchestration_instructions_core.md` → `### G.2` (:573–611) | task flow, semi-autonomous (`branch-implement-plan-semi-autonomous.md:31`) and autonomous | `Write the test fix plan. …` (:584), then `Revise … per architecture findings: <findings_file>.` (:611) | `<gate_key>` = `task` (:84), `<gate_round>` from G.0; ledger `G` (`autonomous_pause_and_ledger.md:86`, autonomous only) | 1 write + up to 4 revisions per round (`iteration >= 5` escalates, :611), and up to 4 fix rounds (`MAX_GATE_ROUNDS = 5`, G.5) |
| `user_review_fixes_instructions_core.md` → `## Phase G` (:180–182), citing the core above by reference | user-review fix, semi-autonomous and autonomous | same | `<gate_key>` = `review_<n>` (:73); ledger `RG` (`autonomous_pause_and_ledger.md:107`) | same, per user-review round |
| Supervised flows | — | — | — | never: no supervised file runs Phase G |

There is no flow-walker node: `cli/templates/scripts/flows/` holds only `task_plan_writing.graph.json`. The pair `<branch>_<gate_key>_round_<gate_round>` is already a unique, tree-derived key (G.0, :537–546), it works without a ledger, and it is carried in both prompts' output path. The theoretical ceiling is 20 dispatches per gate key.

## Prose classification

These are agent-definition sections, measured with `sed -n 'a,bp' | wc -w`. The split into classes is by hand, and each row sums to its measured total.

| Lines: section | Total | ACTION | REF | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| 1–6 frontmatter | 110 | | | 110 | | `tools:` and `description` |
| 7–9 intro | 42 | 10 | 20 | | 12 | "never reproduce it" restates :104 |
| 10–13 `## Resolved values` lead | 144 | | 24 | | 120 | :12 (141 words) lists the placeholders it does *not* declare |
| 14–22 token table | 347 | | 175 | | 172 | The `<repo_root>` row (:17, 87) restates `CLAUDE.md`'s checkout-root block. The `<docs_retrieval>` row (:21, 56) repeats :53 |
| 26–37 invocation and initial prompt | 92 | 20 | 12 | 60 | | The fixed text is quoted at core :584, but the placeholders differ (`<log>` against `<log_path>`). "Use the path as given" is an action |
| 38–43 revision prompt | 17 | | | 17 | | Quoted at core :611 |
| 44–45 "How the caller consumes" | 67 | | 25 | | 42 | Restates `## Output contract` and core :589–592 |
| 46–54 `## Read on demand` | 187 | 80 | 50 | | 57 | Each bullet is a read *action*. The docs-search boilerplate (:53, 74) is shared with other agents |
| 55–56 unreadable path → `blocker:` | 60 | 20 | 25 | 15 | | `blocker:` is parsed at core :590 |
| 57–69 step 1 and the marker block | 140 | 25 | 55 | 60 | | Markers are byte-exact, mirrored in `scripts/run-test-suite.sh:18–22` and `cli/test/run-test-suite.test.mjs:83–85` |
| 71–72 step 2 (new / persisting) | 47 | 30 | 17 | | | |
| 73–74 step 3 (diagnose) | 28 | 28 | | | | |
| 75–76 step 4 (fixable / not) | 46 | 25 | 21 | | | |
| 77–78 step 5 (machine paths) | 85 | 45 | 30 | 10 | | **Cited by heading**: `architecture-reviewer.md:121` names `## Process` → **Rewrite machine paths before quoting.** It stays verbatim |
| 79–80 step 6 lead | 60 | 30 | 20 | 10 | | "Heading text must match exactly — the caller keys off it" |
| 81–88 index template | 297 | 60 | 67 | 170 | | Headings and the `N. [ ] **Finding K** —` entry are parsed by G.0 (:542), the committer and D.2 |
| 90–91 per-finding template | 224 | 70 | 74 | 80 | | `**Failing test:**` and `**Suspected shared cause:**` are quoted by `layer-implementer.md:156,161` |
| 92–101 quality checks | 139 | 110 | | | 29 | Already a checklist. Three bullets restate step 6 |
| 102–106 must not | 46 | 20 | 10 | | 16 | The first bullet restates the test-run rule |
| 107–118 output contract | 79 | 19 | | 60 | | Parsed at core :589–592 and :712–713 |
| 120–124 revision mode | 153 | 50 | 53 | 50 | | The `## Rejected findings` line forms are wire, named by core :611 and :714 |
| **Total** | **2 410** | **642** | **678** | **642** | **448** | |

**Other up-front files:**

- **`## The test-run rule` (732 words).** The agent needs only point 4 (90 words). Points 1–3, 5 and 6 and the roster (about 640 words) govern implementers. The section's own rule is that "a citer points and never restates" (:174), so the agent can neither inline point 4 nor trim the shared section. It stays up-front at 732.
- **The sample (985 + 282 words).** About 60 % of it is user-review-only: the `## Should Fix`, `## Nice to Have` and `## Out of scope / verified-OK` sections, `## Source observations`, and the `**Review comments:**` note, which :79 tells the agent to ignore. Every structural fact the agent uses is already spelled out in :81–90. Classed REFERENCE that duplicates the inline templates.

## Draft work report template
This is a single template, with the mode handled by `n/a` ticks. Each dispatch appends a `## Dispatch <d>` section: `<d>` is the next free integer, counted from the sections already in the file. Measured at 590 words. Every title is 8 words or fewer, and every description 25 or fewer.

**Write timing (fixes the review's Must Fix).** Every input that can yield a `blocker:` is read in Checkpoint 1:

- the log and the earlier logs (:55);
- the fix layer's conventions documents;
- `unit_loop_core.md`;
- on a revision, the findings file.

Checkpoint 1 is held in memory and reaches disk only in the same `Write` that follows P1 (the index). A blocker therefore leaves no file. A `## Questions` return comes out of diagnosis (W3–W4), also before any write.

The one remaining window is a question that surfaces mid-P3, after the index is on disk. It already exists today for the index itself (:118 requires writing nothing, but the index is already written). The report adds no new case, and it is listed under Risks.

```markdown
# Work report — test-fix-plan-writer — <branch> <gate_key> round <gate_round>

## Dispatch <d> — <write | revise: findings file basename>

Hold Checkpoint 1 in memory; first write this section after P1. Write no report on questions or a blocker. Evidence after `→`; rewrite paths per W5 first.

### Checkpoint 1 — reads (any unreadable path → `blocker:`, nothing written)
- [ ] W1. **Read the whole log** — List every gate section and its exit line; never re-run it. `n/a` on revise. → `typecheck=exited N|not run; test=exited N`
- [ ] W2. **Class against earlier logs** — Mark each failure new-this-round or persisting; `n/a` when the prompt names none, or on revise. → `new=N, persisting=N`
- [ ] W3. **Diagnose in the current tree** — Open each failing test or gate and the code it exercises; find the cause. → `diagnosed=N`
- [ ] W4. **Split fixable from environmental** — Call a failure not fixable only when its cause lies outside the tree; no baseline excuses it. → `fixable=N, not_fixable=N`
- [ ] W5. **Rewrite machine paths** — Make repo-root paths repo-relative, other home paths `<home>/…`, in every quoted line. (ref: this agent → ## Process → **Rewrite machine paths before quoting.**)
- [ ] R1. **Read the fix layers' conventions** — Read the document of each layer a fix lands in. → `read=<doc basenames>`
- [ ] R2. **Read the test-run rule** — Read it before writing any finding. (ref: unit_loop_core.md → ## The test-run rule, point 4)
- [ ] R3. **Read the findings and plan** — On revise, read the findings file, the index and the files it names; `n/a` on write.

### Checkpoint 2 — plan written (on revise, tick only files changed, else `n/a`)
- [ ] P1. **Write the index** — Use Write at an absolute path; copy the index template's headings exactly; write no review-comments line or suffix. (ref: this agent → index template)
- [ ] P2. **Order and tag readiness entries** — Put lowest blast radius first and dependencies ahead; leave every entry `[ ]` with a layer tag.
- [ ] P3. **Write one finding file per fix** — Follow the per-finding template; grep-verify each site anchor. → `finding_files=N`

### Checkpoint 3 — revision (`n/a` on write)
- [ ] V1. **Apply only flagged changes** — Preserve everything unflagged; re-diagnose nothing the findings do not reopen.
- [ ] V2. **Record every rejected finding** — Add it to `## Rejected findings`, or update its existing line on a re-raise; give a Must Fix no `call stands`. → `rejected=N`

### Checkpoint 4 — before returning
- [ ] Q1. **List each source failure once** — Map each under `## Source failures` to a finding or to the not-fixable section.
- [ ] Q2. **Match entry, pointer, file one-to-one** — Check per fixable failure; check the folder name matches the index stem.
- [ ] Q3. **Check the finding fields** — Give every file its failing-test line; point every shared-cause line at an existing finding.
- [ ] Q4. **Ask for no test run** — Name no suite, gate or unrelated test file in any fix or sub-step.
- [ ] Q5. **Ship no machine path** — `grep -rlF` the repo root, then the home directory, over index and folder, this report included. → `both printed nothing`
- [ ] Q6. **Run no gate, suite or test** — Append nothing to the lessons ledger either.
- [ ] Q7. **Return the contract block** — Return the output contract verbatim, and nothing else.
```

The template deliberately avoids quoting `**Failing test:**`, `**Suspected shared cause:**` and `**Review comments:**`. Quoting them would make it another file that quotes those literals, so an edit to any of them would have to change it too (CLAUDE.md, the audience paragraph). P1 names the exclusion in prose instead. Evidence values use `key=N`, not `key: N`, so they cannot be confused with the output-contract keys (:113–116).

## Thinning plan
`plugin/agents/test-fix-plan-writer.md`, from 2 411 to about 1 647 words:

| Lines | Action | After |
|---|---|---|
| 1–6 | Keep verbatim | 110 |
| 7–9 | Shorten. Add one sentence: "Append your dispatch section to `work_report.md` in the per-finding folder, from the template; tick at each checkpoint." This uses the agent's own term (:36), not the caller token `<test_fix_findings_dir>` | 65 |
| 10–13 | Replace the 141-word placeholder enumeration with "Other `<…>` names resolve where they appear." | 20 |
| 14–22 | Make the `<repo_root>` row a pointer to the `CLAUDE.md` checkout-root block. Fold the `<docs_retrieval>` row into the docs sentence | 200 |
| 26–43 | Keep both prompt blocks verbatim. Trim the prose | 102 |
| 44–45 | Cut to "`## Questions` goes to the user verbatim; write questions answerable without the plan." | 20 |
| 46–54 | The read actions move to W1–W3 and R1–R2. Keep the docs-search reference: navigation only, untrusted, code wins. Retitle the section, since "no auto-loaded context" is false | 90 |
| 55–56 | Keep the `blocker:` rule. Shorten | 45 |
| 57–76 | Keep the marker block verbatim, plus the static and `not run` semantics and the not-fixable definition. Drop the action prose | 130 |
| 77–78 | **Keep verbatim** (heading-cited by `architecture-reviewer.md:121`) | 85 |
| 79–91 | **Keep verbatim.** The ordering, tag and grep-verify actions sit inside the wire bullets (:85, :90), and :79–80 carries the "Heading text must match exactly" wire sentence. P1–P3 point at these lines rather than replace them | 581 |
| 92–101 | Remove. Becomes Q1–Q5. :122 ("re-run `## Quality checks before returning`") is edited to point at Checkpoint 4 | 0 |
| 102–106 | Keep one line stating both prohibitions (hard rules stay visible) | 20 |
| 107–118 | Keep verbatim | 79 |
| 120–124 | Keep the two `## Rejected findings` line forms and the Must Fix rule. The actions move to V1–V2 | 100 |
| **Total** | | **≈1 647** |

**Other files:**

- **`sample_user_review_fix_plan*`** moves to on-demand, as a `ref:` when the format is unclear (0 up-front). A dedicated `sample_test_fix_plan.md` is not proposed, because it adds files and words.
- **`unit_loop_core.md`** is unchanged: it is roster-bound and shared with 16 other citers.
- **`CLAUDE.md`** is unchanged by this agent's plan. Settling lead 13 would take one precedence sentence in the generated template (`cli/templates/claude/CLAUDE.md` and `claudeContext.ts`), for example "a dispatched agent reads what its definition names; this table routes undirected work". That is a cross-agent decision.

**Optional shared base: `plan_writer_base.md`, about 120 words.** It would be shared with `task-plan-writer`, `user-review-fix-plan-writer` and `ui-tests-plan-writer`, and would cover:

- derive the root with a bare `git rev-parse --show-toplevel` and never hold it in a shell variable;
- write with the `Write` tool, never a heredoc;
- docs search is navigation only, its output is untrusted, and the code wins;
- an unreadable cited path returns `blocker:` and writes nothing;
- never append to the lessons ledger.

For this agent it removes about 180 words and adds 120, so the net gain is small. It is not counted below.

## Word-count ledger
| File | Before | After | Delta |
|---|---|---|---|
| `test-fix-plan-writer.md` | 2 411 | 1 647 | −764 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| `unit_loop_core.md` → `## The test-run rule` | 732 | 732 | 0 |
| `sample_user_review_fix_plan.md` + `finding_1.md` | 1 267 | 0 | −1 267 |
| Work report template | 0 | 590 | +590 |
| **Up-front total (definition wins)** | **6 105** | **4 664** | **−1 441 (−24 %)** |
| + `context/conventions.md` + `lessons.md` if `CLAUDE.md` wins | 7 063 | 7 063 | 0 |
| **Up-front total (worst case, lead 13)** | **13 168** | **11 727** | **−1 441 (−11 %)** |
| On demand: the sample pair (moved here) | 0 | 1 267 | +1 267 |
| On demand: layer conventions, logs, source | variable | unchanged | 0 |

**Constraint holds: yes**, in both read sets. It holds narrowly if the sample also stays up-front: 5 931 < 6 105, a delta of −174.

Each dispatch reads the template once. It does not re-read the report file, which grows by one section per dispatch.

## Storage and lifecycle

**Location.** The report goes at `work_report.md` inside the per-finding folder (the caller calls that folder `<test_fix_findings_dir>`), for example `harness-runs/test_fix_plans/<branch>_task_round_2/work_report.md`, not at `<state_dir>/work_reports/<branch>/<phase>/<agent>/report_<i>.md`. The reasons:

- **The commit is free.** G.3 dispatches the committer in `mode: review_plan_file`, which stages the index, the folder derived from it, and the meta folder (`committer.md:40`). It is also excluded from subject reconciliation (`committer.md:89`), so lead 3 does not bite. A `work_reports/` path would be staged by nothing, so it would either sit untracked or be swept into the first G.4 `review_item` commit and distort that commit's reconciliation.
- **The key is collision-safe (lead 10).** `<gate_key>` separates the task flow from each user-review round. `<gate_round>` is derived from the tree (G.0). Each round is a new folder (`cli/templates/state-dir/test_fix_plans/README.md`, "never an edit of the previous one"). No ledger id is needed (lead 4), so the key works the same in semi-autonomous runs.
- **The agent computes the index.** `<d>` = the count of `## Dispatch` headings already in the file. An **initial-write** prompt starts the file fresh with `Write`, because G.0 makes G.2 rewrite an untracked draft on resume. A revision appends with `Edit`, after R3's reads succeed. The caller changes nothing.
- **Tools (lead 1, corrected).** The first section is created with `Write`, and later checkpoints are added with `Edit`. Both are allowed under the repo and worktree (`cli/templates/claude/settings.autonomous.json:48–51`). No `cp` and no `sed -i` are needed.

**Paths that write nothing (leads 2 and 8):**

- `## Questions` and `blocker:` write nothing today (:118, :55). The report keeps that, because the first write follows every blocker-capable read and all of diagnosis (see the template's write timing). The return line is the evidence. A leftover untracked draft is already tolerated (`autonomous_pause_and_ledger.md` → `## 3`: "clean-of-tracked-changes"). `rm` is not on the unattended allow list (`settings.autonomous.json:36–51`), so nothing could clean one up anyway.
- `fixable: 0` still writes and commits an index (core :591, G.3). The report would create a folder holding only `work_report.md`. The committer stages a present folder, and that is harmless.

**Hooks.** The agent has `Write` and `Edit` (:4). Every hook in `plugin/hooks/hooks.json` matches `Bash` only, so `Write` and `Edit` are not intercepted.

**Readers of the folder (leads 5 and 9).** The `architecture-reviewer` reads "**every** `finding_<N>.md`" (`architecture-reviewer.md:76,131`), so `work_report.md` falls outside its pattern, and that file has no orphan rule. `review-plan-reviewer` never sees test fix plans. Later diff reviewers exclude `<state_dir>/*<branch>*` (`architecture-reviewer.md:132`). G.4 implementers read only `finding_<K>.md`.

**Documentation cost.** The test-fix-plans README template (`cli/templates/state-dir/test_fix_plans/README.md`) and this repo's adopted copy would need one sentence each.

## Risks and costs

- **Tool calls.** Ticking one item at a time costs about 20 calls per dispatch, about 400 over the 20-dispatch ceiling per gate key. The checkpoint scheme costs one `Write` after P1, one `Edit` at Checkpoint 3 on revise and one at Checkpoint 4: 2–3 calls per dispatch, at most about 60 per key. Holding Checkpoint 1 in memory makes goal (a) weaker still for those items, which is the price of keeping the write-nothing paths.
- **Goal (a) is weak (lead 6).** Tick timing is unverifiable, and the agent can fill everything at Checkpoint 4. What carries evidence value is the evidence lines: the exit statuses, the counts and the empty grep. Those can be cross-checked mechanically against the index (`fixable: N` against the readiness entries, `## Source failures` against the count of log failures).
- **A new leak surface.** The report is committed, so evidence lines are subject to the self-containment gate (gate 6a, `docs/development.md:330–334`). An agent pasting `git rev-parse` or `printenv HOME` output as evidence would ship the home directory. That is why W5 sits ahead of every evidence item, the dispatch heading takes the findings file's **basename** only, evidence values are counts and basenames with no timestamps (lead 12), and Q5 names the report explicitly. The `architecture-reviewer`'s machine-path check is scoped to "the test fix plan index or any `finding_<N>.md`" (`architecture-reviewer.md:131`), so it does not cover `work_report.md`.

Gate 6a is this repository's own gate (`scripts/run-gates.sh`) and does not ship to adopters. In an adopter, Q5 is therefore the **only** guard. Either accept that, or widen :131 to "every file in `task_files_dir`". Widening it is a plugin edit, and it also puts the report into what the reviewer reads (lead 5).
- **Goal (b) gains little.** The skippable rules (path rewrite, test-run, one-to-one mapping) are already a checklist (:92–100). The template mainly re-homes them, saving about 450 words of prose rather than adding enforcement.
- **Ref-starvation (lead 7).** The index and per-finding templates are what the architecture gate and the G.4 implementers consume. They must stay inline in the definition, never behind a `ref:`. The plan above keeps them. Only the sample moves behind a `ref:`.
- **Separating actions from rationale.** Step 4's "there is no baseline to blame it on" (:76) is what stops a writer dumping real failures into not-fixable. If W4's description lost that, environmental misclassification would rise, and `fixable: 0` escalates the run (core :591). W4 keeps it ("no baseline excuses it").
- **Mid-write question.** If a question surfaces while P3 is writing finding files, the index is already on disk, contradicting :118's "write nothing". That window predates this proposal. The report adds no new one, because it is written in the same step as the index.
- **Keyed prose.**
  - The marker lines are keyed by `cli/test/run-test-suite.test.mjs:83–85` (through the script) and stay verbatim.
  - The step-5 bold title is heading-cited by `architecture-reviewer.md:121` and stays verbatim.
  - Removing `## Quality checks before returning` requires editing :122, which re-runs it in revision mode.
  - No `cli/test` file reads the agent definition.

## Open questions

1. **Lead 13.** `CLAUDE.md`'s generated routing table (`claudeContext.ts:470`) sends "**Any** implementation, review or planning" to the shared conventions document (5 864 words here), and "branch level" planning to the lessons ledger (1 199). The agent says to read only the fix layer's document (:51). This report holds that the definition wins, being specific and dispatched. The worst case is counted anyway (13 168 → 11 727). A one-sentence precedence rule in the generated `CLAUDE.md` would settle it for every agent and is worth far more than this agent's whole work-report saving.
2. **The agent's own read list is internally loose.** :22 (`<impl_stack>`) says to read the stack's names "off the conventions documents `<layer_path_map>` names", while :51 says "only that one". Read literally, :22 sends the agent to every layer document, so it is either a bug or loose wording. For that reason R1 avoids "none other". :22 should say "the fix layer's conventions document".
3. Should a cross-agent rule allow `ref:` to a **numbered point** inside a roster-bound section (here, point 4 of `## The test-run rule`)? Or does "points and never restates" also forbid narrowing the pointer?
4. Is "store the report inside a folder the flow already commits" acceptable as the general pattern for writers, or must every agent use one `work_reports/` tree for discoverability? A uniform tree needs an explicit staging rule in every committer mode.
5. Should the self-containment rewrite (step 5) become a shared base item for every agent whose report quotes command output?

## Review response

Every Must Fix, every Should Fix and every Nice to Have from `reviews/test-fix-plan-writer.md` was applied, so nothing is rebutted. As a result the template grew from 535 to 590 words, the definition's after-estimate rose from 1 536 to 1 647, and the up-front after-total from 4 498 to 4 664. The lead-13 worst case (13 168 → 11 727) was added.
