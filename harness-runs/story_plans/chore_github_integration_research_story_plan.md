# Story: GitHub integration research — one document answering the open questions of three later branches

## Context

This branch writes one research document, `docs/github-integration-research.md`, and changes nothing else in the tree. It answers the questions `harness-runs/task_prompts/chore_github_integration_research_task_prompt.md` lists — S1–S6, T1–T6, C1–C4, A1–A12 — for three later branches whose prompts are not in this tree: `feat_forge_run_triggers`, `feat_forge_run_control` and `feat_github_native_adoption`. The document is the whole deliverable: no code, template, workflow, command, agent or config file changes.

**`feat_github_native_adoption` was dropped by the maintainer on 2026-09-30, during this planning, on these findings:** no GitHub-only route covers the supervised analysis or a subscription credential without a GitHub Codespace, and a codespace setup costs more of the adopter's actions than the local install. The A-questions are therefore recorded briefly (Tasks 4 and 5): each keeps its verdict, a short answer and at least one source, so the acceptance list still holds, and the consequence lines point at the two branches that remain. Consequence lines in sections 1–3 that name `feat_github_native_adoption` stay as written, as a record.

**All research is already done, and it lives in the per-task files.** It was done in the supervised planning session on 2026-09-30: live documentation fetches, a measurement set against the standing Gate 12 repository `firu-daniel/harness-gate12`, a Claude Code measurement in a scratch repository, and a GitHub Codespaces session and a browser check the maintainer ran by hand. The implementer has no web tools and must not need them. Each per-task file carries, per question, the verdict, the answer, every piece of evidence (URL, retrieval date and verbatim quote for a document; command, place, time, version and printed output for a measurement) and the consequence for the three prompts. **Transfer, do not re-derive.** Copy each quote exactly as the per-task file gives it, including its punctuation. A claim that no per-task file carries does not go into the document, and a question a per-task file marks `unverified` stays `unverified`. Nothing is inferred to fill a gap.

**The document's outline is fixed here so every task writes into the same shape.** Headings, in this order:

1. `# GitHub integration research` followed by the who-reads paragraph (Task 1).
2. `## How this was researched` (Task 1).
3. `## Summary` — the table of every ID (Task 6, inserted directly after `## How this was researched`).
4. `## 1. Shared: GitHub Actions and tokens` — S1–S6 (Task 1).
5. `## 2. Triggers — feat_forge_run_triggers` — T1–T6 (Task 2).
6. `## 3. Control — feat_forge_run_control` — C1–C4 (Task 3).
7. `## 4. Adoption — feat_github_native_adoption (dropped)` — brief entries A1–A12 (Task 4).
8. `## 5. Adoption routes compared` — one table with a count per route (Task 5).
9. `## 6. Leads this research refutes` (Task 6).

**Every question entry has one shape**, so the summary table and the refuted-leads list can be built mechanically:

```
### <ID>. <the question, shortened to one line>

**Verdict:** `verified` | `refuted` | `partly true` | `unverified`

**Answer:** <a few sentences>

**Evidence:**
- <document: URL — retrieved 2026-09-30 — section heading — "verbatim quote">
- <measurement: what was run, where, when, on which version — output as printed, in a code block when it is multi-line>

**Consequence:** <which of the three prompts it changes, and how>
```

A verdict grades the question's lead where the question carries one (the belief the task prompt or the later prompts state), and otherwise grades the answer given. Where an answer has a verified part and an unverified part, the verdict is `partly true` and the Answer names which part is which.

**Where each file of evidence sits.** Measured facts rest on the measurement log reproduced inside the per-task files, not on any file in this tree. The document names the Gate 12 run IDs and issue/PR numbers the per-task files carry. Those runs and objects will not exist after Gate 12 is reset to its seed, so the document must say that once, in `## How this was researched`, and must not present them as links a reader can follow. Paths on the maintainer's machine never go into the document (the self-containment gate): the scratch repository is described as "a scratch git repository", not by its path.

**Top risks:** the first is a quote altered in transfer — a docs sentence paraphrased inside quote marks makes the entry false evidence, so every task's verification re-compares each quote against its per-task file character for character. The second is a verdict drifting from its evidence when the summary and the refuted-leads sections restate it — Task 6 builds both from the entries' own `**Verdict:**` lines and the per-task file's lead list, never from memory. The third is scope creep into the three branches' design: the document states options and facts and leaves every choice to those branches, which the task prompt requires (*"Do not design the three branches' features"*).

**Manual setup required:** none for the implementation. The maintainer resets `firu-daniel/harness-gate12` to its seed `2fb082a` after planning (the planning session's cleanup), independent of this branch.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that task's commit lands. `[ ]` markers anywhere else (e.g. sub-step bullets inside per-task files) are informational only.

Each entry resolves 1:1 to a self-contained `harness-runs/task_plans/chore_github_integration_research/task_<K>_plan.md` file. All tasks are in the catch-all layer, because the only file this branch touches is under `docs/`.

1. [x] **Task 1** — Create `docs/github-integration-research.md` with its header, method section and the shared entries S1–S6 _(layer: general)_ _(points: 13)_
2. [x] **Task 2** — Write the trigger entries T1–T6 _(layer: general)_ _(points: 10)_
3. [x] **Task 3** — Write the control entries C1–C4 _(layer: general)_ _(points: 8)_
4. [x] **Task 4** — Record the adoption entries A1–A12 briefly _(layer: general)_ _(points: 8)_
5. [ ] **Task 5** — Record the adoption routes and their action counts briefly _(layer: general)_ _(points: 3)_
6. [ ] **Task 6** — Add the summary table and the refuted-leads section, and check the document against the acceptance list _(layer: general)_ _(points: 8)_
