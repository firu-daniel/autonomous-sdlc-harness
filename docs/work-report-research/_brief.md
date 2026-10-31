# Work-report research — shared brief

Research only. **Nothing under `plugin/`, `cli/`, `schemas/` or anywhere else changes.** Each research agent writes exactly one file: `docs/work-report-research/<agent-name>.md`.

## The idea under study

Every dispatched agent copies a **work report template** (one per agent) into a per-run location and **ticks each item as it performs the step**, not at the end. Goals:

- **a. Evidence of work** — a durable record of which steps an agent actually took.
- **b. Fewer ignored/missed rules** — an action phrased as a checklist item is harder to skip than a rule buried in prose.
- **c. Thinner conventions** — prose that reads as an *action* moves into the template as a short item; what stays in the agent definition / instruction files is reference only (explanations, edge cases, wire contracts), linked from items that need it.

Item format: `- [ ] <ID>. **<title, ≤ 8 words>** — <description, ≤ 25 words, imperative> (ref: <file> → ## <heading>, only if the title + description are not enough)`.

**Hard constraint:** after the split, the total words an agent loads on a dispatch (agent definition + every file it is told to read up front + its work report template) must be **lower** than today. The new mechanism must not land as another 1 000 words of prose explaining itself. Files read only on demand (via a `ref:`) are counted separately.

Proposed storage (to be evaluated, not assumed): `<state_dir>/work_reports/<branch>/<phase>/<agent>/report_<index>.md`, where `<state_dir>` defaults to `sdlc-harness/`, `<index>` is the next free integer starting at 0 (the same rule findings files use today), and `<phase>` is a ledger-phase id or another key that disambiguates one agent running in several phases (e.g. `layer-implementer` in implementation `A`, code-review fixes `C`, user-review fixes `R3`). See `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates` for the ledger ids. Supervised and semi-autonomous flows have no ledger — the key must still work there.

## Method — what each research file must do

1. **Read tree.** Starting from `plugin/agents/<agent>.md`, list every file the agent is told to read (instructions, samples, conventions templates under `cli/templates/`, `CLAUDE.md`, the lessons ledger, sibling agent files it cites…), recursively, and mark each **up-front** (read on every dispatch) or **on demand**. Measure each with `wc -w`. Give a total. Also note which orchestrator-side instruction files dispatch this agent and in which phases (grep `plugin/instructions` and `plugin/commands`).
2. **Classify the prose.** Walk the agent definition and every up-front file section by section into:
   - **ACTION** — something the agent does → becomes a work-report item.
   - **REFERENCE** — explanation, rationale, edge case → stays, possibly shortened, linked by `ref:`.
   - **WIRE CONTRACT** — literal strings, return formats, file templates, verdict lines a caller or script parses; cross-file quoted literals (e.g. `Reviewer finding not applied — `). These **cannot** move or be paraphrased; say where they stay.
   - **REDUNDANT** — restated elsewhere, or rationale an agent does not need to act → cut.
   Give per-section word counts per class, not just a narrative.
3. **Draft the work report template** for this agent, in the item format above. Keep it short — an item per real step, not per sentence. If the agent has modes/branches (PASS vs FAIL, first write vs revision, phase X vs Y), show how the template handles them (conditional items, `n/a` ticks, or separate templates) and pick one.
4. **Draft the thinned files.** Not full rewrites — for each file in the up-front tree, state what is removed, what is shortened, what stays verbatim, and estimate the resulting word count. If a shared "base" file (read by several agents) would help, propose its contents as a bullet list of direct instructions, and say which other agents would share it.
5. **Word-count ledger.** Table: file | today | after | delta, for up-front and on-demand separately, and the total including the template. State plainly whether the hard constraint holds.
6. **Storage and lifecycle.** For this agent specifically: which phases/flows dispatch it, how many times per branch, how the index is chosen (who computes it — the agent or the caller, as `iteration` is today), whether the report is committed (autonomous runs keep a **clean-tree invariant** — `autonomous_pause_and_ledger.md` → `## 3`; the committer commits the working tree), whether the agent has the tools to write it (check its `tools:` frontmatter — e.g. `committer` has no `Write`; read-only reviewers have `Write` for findings only, and some must not touch disk on PASS), and whether any guard hook in `plugin/hooks/` would block the write.
7. **Risks and costs.** Extra tool calls per tick (an `Edit` per item × items × dispatches), latency/token cost, whether tick-as-you-go is verifiable at all or the agent can just tick everything at the end (be honest about goal a), whether pulling actions out of their rationale makes them easier to misapply, and whether any caller, test (`cli/test/`), script or hook keys on the prose being moved.
8. **Verdict.** One of: **Recommend**, **Recommend with changes** (state them), **Do not recommend** (state why). If the idea makes this agent worse, say so — a no-go is a valid, useful outcome.

## Output structure (fixed — use these headings)

```
# Work report research — <agent-name>
## Verdict            (2–5 sentences, the verdict word bolded first)
## Read tree          (table: file | up-front/on-demand | words)
## Dispatch sites and phases
## Prose classification  (per file/section table: section | ACTION | REFERENCE | WIRE | REDUNDANT words, + notes)
## Draft work report template  (fenced markdown)
## Thinning plan      (per file: remove / shorten / keep verbatim / est. after)
## Word-count ledger  (before | after | delta; constraint holds: yes/no)
## Storage and lifecycle
## Risks and costs
## Open questions     (for the cross-agent synthesis)
```

Cite every claim about existing text as `path:line` or `path → ## heading`. Do not invent counts — run `wc -w` (and `sed -n 'a,bp' file | wc -w` for sections).

## Cross-cutting leads from batch 1 (verify for your agent; do not assume)

Batch 1 (task-plan-writer, task-plan-reviewer, layer-implementer, layer-reviewer, committer) raised these. Check each against your agent and say whether it applies:

1. **Tools.** Several reviewers have `Write` but no `Edit`, so tick-as-you-go means rewriting the whole file; `cp` is not on the unattended allow list, so "copy a template file" may stall an autonomous run. Proposed alternatives: embed the template in the agent definition, write once before returning, or tick per section/checkpoint. **Correction (verified at `cli/templates/claude/settings.autonomous.json:36–51`):** `cp` is indeed not allowed, but `Bash(sed:*)`, `Bash(cat:*)` and `Bash(mkdir -p:*)` are, and `Write`/`Edit` are allowed under the repo/worktree — so the absence of the `Edit` *tool* in an agent's frontmatter does not make in-place ticking impossible (`sed -i` works); single end-`Write` is a design choice (fewer calls, keeps read-only reviewers from editing in place), not a forced one. Say which you choose and why.
2. **PASS writes nothing.** Some reviewers are contractually barred from touching disk on PASS; a report on every dispatch changes that wire contract (and the caller's matching text).
3. **Committer staging.** A separate untracked report file makes the committer's subject-reconciliation test always see "other paths staged", hiding the `staged: index-only` / disposition signals `unit_loop_core.md` reads; fixed-path commits (planning commit, `ui_test_pass`, review-plan commits) would leave reports out. Alternatives: embed the report in an artifact the flow already commits (e.g. a section of the unit's detail file or of the findings file), or stage a work-report prefix explicitly and exclude it from reconciliation.
4. **Storage key.** Ledger ids (`P1`, `A`, `R3`) exist only in autonomous runs and the agent often cannot see them; candidates are the flow-walker node name, or the caller's existing `findings_folder`/`iteration`. Say what works for your agent.
5. **Reviewers reviewing reports.** Diff/working-tree reviewers may grade other agents' reports as part of the change set.
6. **Goal (a) is weak without evidence lines.** Tick timing is unverifiable; items that demand pasted evidence (verdict line, command output, file:line) carry the evidence value.
7. **Ref-starvation.** For reviewers, "reference" prose is often the grading standard; moving it behind `ref:` risks it being under-read (works against goal b). Keep refs on conditional items only.

### Added after batch 2 (branch/review-plan/skeptic/architecture/business-parity reviewers)

8. **PASS has no commit point.** Several PASS paths commit nothing, so a PASS report either sits untracked or is swept into an unrelated later commit. Alternatives raised: return the report inline in the agent's reply on PASS; only file it on FAIL inside the already-committed findings folder; or add an explicit commit point.
9. **Orphan checks.** `review-plan-reviewer` treats a stray file in a findings folder as a Must Fix orphan — a `work_report_*.md` placed there needs an exemption.
10. **Index collisions already exist.** `iteration`-style indices reset across layers/rounds in places (e.g. per-round `review_0.md` overwrite); a report index must not inherit that. Say whether your agent's index is collision-safe.

### Added after batches 3–4

11. **Embed in an artifact already written and committed** (a trailing `## Work report` section of the findings/statistics file, or a file inside a folder a commit already stages whole) solved storage, commit and orphan problems for several agents — check whether your agent has such an artifact, and whether a consumer of that artifact (e.g. a writer applying "Must Fix items") would misread the section.
12. **Evidence lines must not leak.** Committed reports must not carry absolute paths, home dirs, timestamps (breaks no-op re-commits) or env output.
13. **Read-list conflicts.** `CLAUDE.md` may tell an agent to read more than its definition does; count the larger set and say which wins.

## Rules for research agents

- Write only your own `docs/work-report-research/<agent-name>.md`. Do not edit any other file, do not commit.
- Take paths relative to the checkout root from `git rev-parse --show-toplevel`.
- Concise. Tables over prose. Target 1 500–3 000 words for the report.
