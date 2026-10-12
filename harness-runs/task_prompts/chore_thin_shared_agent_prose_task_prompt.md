`chore_thin_shared_agent_prose` is the base session of the agent-thinning series. It is follow-up 2 in `docs/work-report-research/README.md` → `## Follow-ups` (branch `research_work_reports`, commit `ab367d40`).

This session thins the prose that agents from more than one family load, so that the eight family sessions after it start from one standard and need not touch each other's files. It runs after `fix_findings_overwrites_and_commit_gaps` has merged, because both edit the same agent and instruction files.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Counts and line numbers were taken at v0.6.7 (`a53b9b16`). They are hints only; measure again before planning.

---

## Why

The work-report research measured every agent's up-front load: the agent definition plus every file it is told to read on each dispatch. In each definition, about 25–35 % of the prose is redundant:
- the same rule restated in several sections;
- rationale the agent never acts on;
- blocks copied word for word across agents;
- whole sibling files read where a few sections are used.

Work reports were dropped (`README.md` → `## User verdict`). The goal that remains is **short, direct rules, each stated once**. An agent reasons for itself, so it needs the instruction and the edge case, not an essay on why.

## What is already established

Re-verify each point.

- **Repeated lines.** Lines over 80 characters that occur in three or more of `plugin/agents/*.md` hold about 8 750 of the 104 550 words in those files.
  - The biggest blocks: `## Unsolicited dispatch guidance`, about 290 words, identical in 10 agents.
  - The `<docs_root>` and `<docs_retrieval>` resolved-value rows, in 11 agents.
  - The `<state_dir>`, `<repo_root>`, `<default_branch>` and `<parity_vocabulary>` rows, in 5–8 agents each.
  - The `mcp__harness-docs__search_docs` tool bullet.
  - The Must Fix / Should Fix / Nice to Have grading lines.
  - The "Prose volume — the receiving side" and "Guard carve-out" paragraphs.
  - The reviewer-finding-judged-wrong rule.

  To list them: `for f in plugin/agents/*.md; do awk 'length>80' "$f" | sort -u; done | sort | uniq -c | awk '$1>=3' | sort -rn`.
- **The copies stay in each definition.** `plugin/instructions/dispatch_discipline_instructions.md` → `## The receiving side — the roster that carries the backstop` says: "The rule body lives in those definitions and not here: an agent loads its own file, never this one". A shared base file read up front would also move words rather than cut them; every report that weighed one reached that conclusion. So the saving comes from **thinning each shared block once and writing the shorter text into every copy**. Create a base file only if it lowers the up-front words of every agent that would read it.
- **Agents cite shared instruction and sample files.** The most cited, by the number of agents citing each:
  - `unit_loop_core.md` (13);
  - `plan_orchestration_instructions_core.md` (9);
  - `task_plan_writing_instructions_core.md` (6);
  - `sample_code_review.md` (4);
  - `sample_story_plan.md`, `sample_task_plan.md`, `sample_user_review_fix_plan.md`, `user_review_fix_plan_writing_instructions_core.md`, `qa_test_instructions.md`, `docs_phase_instructions.md` (3 each).

  Many of these citations name a section to read when needed, not a whole file to read on every dispatch. Settle which.
- **The read lists conflict.** The generated `CLAUDE.md` (`cli/src/generators/claudeContext.ts`, the "**Any implementation, review or planning**" row) sends every agent to the shared conventions document. Some definitions say to read only the layer's document, for example `test-fix-plan-writer.md`: "Never read all of them up front". No file says which instruction wins. The research recommends that the definition wins.
- **Some anchors are quoted by other files and must survive** (`README.md` → `## Edits that cut across agents`). These include:
  - task-plan-writer's `## Revision mode` and `## Rejected findings` (parsed by `flow-walker-gates.sh`);
  - qa-tester's `### 3. Tests blocked`;
  - the mobile stubs' "not implemented in this release" (grepped per `cli/src/config/model.ts`);
  - `Reviewer finding not applied — ` and `(disregarded for verdict purposes)`.

## The goal

1. **Shared blocks, thinned once.** Thin every block that appears in agent definitions from more than one family (list below) once, and write the identical result into every copy.
   - Keep each heading and wire literal byte-for-byte: `## Unsolicited dispatch guidance`, `(disregarded for verdict purposes)`, the placeholder names, and the `review_{iteration}.md` paths.
   - Where agents differ only in a word, keep the difference and thin the rest the same way.
2. **Shared instruction and sample sections, thinned.** For each file above, work out which sections agents from more than one family read, either up front or through a cited anchor, and thin those sections. The orchestrators also read these files, so a thinned section must keep every rule an orchestrator acts on.
   - Sections that only orchestrators read are out of scope.
   - Sections that only one family reads are left to that family's session.
3. **Read-list precedence, where it is needed.** Add one sentence to each agent definition whose read list is narrower than the generated `CLAUDE.md` routing table. The sentence says the definition's list wins over the table's rows.
   - Do not add it to `CLAUDE.md`, its template or `claudeContext.ts`, because not every agent needs it.
   - List the agents that get it, and the reason each one does.
4. **The thinning standard, written down once.** Add it to this repository's plugin-layer conventions document (`.claude/context/plugin.md`; pick the section), so that every family session's implementer and reviewers apply it. Keep it short:
   - rules are direct instruction points;
   - each rule is stated once;
   - drop rationale the agent does not act on;
   - edge cases stay;
   - wire literals and cited anchors are never paraphrased;
   - a change to an agent definition does not raise its up-front word count.
5. **Measured, before and after.** The plan records each agent's up-front words, before and after, in one table.
   - Up-front words are the agent definition plus every plugin file or section it reads on every dispatch.
   - Exclude `CLAUDE.md` and the adopter's conventions documents, which differ per adopter.
   - Every agent's figure goes down or stays the same. None goes up.

## Families (for scoping only; each gets its own later session)

- **Task plan:** task-plan-writer, task-plan-reviewer.
- **Unit loop:** layer-implementer, layer-reviewer, committer.
- **Branch review:** branch-reviewer, skeptic-reviewer, review-plan-reviewer.
- **Plan/diff gates:** architecture-reviewer, business-parity-reviewer.
- **UI tests and QA:** ui-tests-plan-writer, ui-tests-plan-reviewer, qa-tester, qa-tester-mobile-maestro, qa-tester-mobile-mcp.
- **Fix-plan and statistics writers:** user-review-fix-plan-writer, test-fix-plan-writer, statistics-plan-writer.
- **Docs:** docs-writer, docs-reviewer.
- **Conventions:** conventions-writer, conventions-reviewer.

A block shared only within one family, such as the roughly 1 500 identical words between architecture-reviewer and business-parity-reviewer, is that family's job, not this session's.

## Constraints

- **Behaviour does not change.** Every rule an agent or orchestrator follows today still holds after the edit, stated more briefly. If thinning shows that two copies of a rule disagree, record the conflict in the plan and pick one. Don't silently merge them.
- **Grep every literal you touch.** Search `plugin/`, `cli/templates/`, `cli/src/`, `cli/test/`, `scripts/` and `docs/`, and change every quoting site together (`.claude/CLAUDE.md` → "renaming a field or changing a literal in one of them is an edit to every file that quotes it").
- **Keep cited anchors.** A heading that another file cites by `→ ## heading` keeps its exact text.
- **The research is input, not a spec.** Each agent's report in `docs/work-report-research/<agent>.md` has `## Prose classification` and `## Thinning plan` tables you can use. Their `## Draft work report template` and `## Storage and lifecycle` sections no longer apply.

## Done when

- Goals 1–5 hold, and the plan's word-count table shows no agent with a higher figure.
- `cli/test` passes, and `scripts/run-gates.sh` passes.
- The line-repetition command above shows that the repeated blocks still match across their copies and are shorter.

## Out of scope

- Prose specific to one family; the family sessions handle it.
- Orchestrator-only instruction files and sections.
- Work reports.
- `CLAUDE.md` and its generator.
