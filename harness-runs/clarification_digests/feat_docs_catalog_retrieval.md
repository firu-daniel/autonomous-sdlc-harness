# Clarification digest — feat_docs_catalog_retrieval

## question_1 — Who registers the `search_docs` MCP server: the plugin or `init`?
- **raised by:** `task-plan-writer` (planning, iteration 0, before any plan was written)
- **asked:** the task prompt §4 says the plugin declares the server and that with `docs.retrieval` off it is not registered; `.claude/context/conventions.md` → `## The layers` forbids either shipped half reaching into the other at run time, and a plugin-declared server is registered wherever the plugin is installed whatever `harness.config.json` says. Options: **(a)** keep the prompt's design — the plugin declares the server, which runs a new CLI verb, and with retrieval off the server still starts and exposes no tools; this requires hand-editing the `## The layers` bullet before answering. **(b)** `init` writes the server into the adopter's `.mcp.json`, and only when retrieval is on, as it already does for the Playwright servers from `cli/templates/repo/mcp.json`; the cost is that §4's "the plugin declares the server" no longer holds. The writer leaned (b).
- **answered:** "b — `init` writes the server into the adopter's `.mcp.json`, only when `docs.retrieval` is on, following the existing Playwright servers written from `cli/templates/repo/mcp.json`. The plugin carries only the agents' contract text and allowlist grants. §4's "the plugin declares the server" is superseded by this answer.

  One constraint: an unattended run must be able to start the project `.mcp.json` server without an approval prompt. Establish how the existing Playwright servers are approved for unattended runs, and do the same for the retrieval server."
- **carries beyond this branch:** the layer rule stands unamended — `cli/` writes what an adopting repository gets, and `plugin/` carries contract text and allowlist grants only; a server this project authors is registered by `init`, never declared by the plugin. The standing constraint that an unattended run must reach a project `.mcp.json` server without an approval prompt outlives this branch.

## question_2 — Should the agent `tools:` allowlists always name the retrieval tool?
- **raised by:** `task-plan-writer` (planning, iteration 0), asked together with question 1
- **asked:** the task prompt's Acceptance 5 reads "With retrieval on, the generated unattended permission profile allows the tool, and the granted agents' allowlists name it. With retrieval off, neither does." An agent definition is a static file in `plugin/`, so it cannot vary with an adopter's `docs.retrieval` setting — the decision needed was whether the allowlists name the tool unconditionally.
- **answered:** "agree — always name the tool in the granted agents' `tools:` allowlists, and their contract text says to ignore it when `docs.retrieval` is off. "With retrieval off, neither does" in Acceptance 5 applies to the generated permission profile only."
- **carries beyond this branch:** a `plugin/` agent's `tools:` allowlist is static and names a tool unconditionally; configuration-dependence lives in the generated permission profile and in the agent's own contract text, never in the allowlist.

## question_3 — Should `ui-tests-plan-reviewer` get the retrieval tool?
- **raised by:** `task-plan-writer` (planning, iteration 0), asked together with question 1
- **asked:** the task prompt §4 grants the tool to "the plan writer and … every reviewer that reads `<docs_root>` today", re-derived by grep, and puts implementers, the committer and the interactive-test agents out of scope — leaving it undecided whether the UI-test plan reviewer belongs to the granted set.
- **answered:** "include, and widen the set. Every plan writer, every plan reviewer and every end-of-branch reviewer gets the tool. `ui-tests-plan-writer` is included too: it is very relevant there, since it searches the docs for how to construct the UI tests. The per-unit `layer-reviewer` does not get it, and neither do the implementers, the committer or `qa-tester`.

  The granted set is exactly these ten agents, and it replaces the "every reviewer that reads `<docs_root>` today" rule in §4 of the task prompt:

  - `architecture-reviewer.md`
  - `branch-reviewer.md`
  - `business-parity-reviewer.md`
  - `review-plan-reviewer.md`
  - `skeptic-reviewer.md`
  - `task-plan-writer.md`
  - `task-plan-reviewer.md`
  - `ui-tests-plan-reviewer.md`
  - `ui-tests-plan-writer.md`
  - `user-review-fix-plan-writer.md`"
- **carries beyond this branch:** the granted set is that enumerated roster of ten — every plan writer, plan reviewer and end-of-branch reviewer — and the excluded set is the per-unit `layer-reviewer`, the implementers, the committer and `qa-tester`. It replaces §4's grep-derived rule, and `plugin/agents/README.txt` now records it.

## question_4 — The plan loop hit its 5-revision cap with the architecture gate still open
- **raised by:** the planning orchestrator (`/branch-start-plan-autonomous`, planning loop), after `architecture-reviewer` in plan-review mode returned `verdict: FAIL` on the fifth writer revision
- **asked:** the planning core stops the loop at 5 writer revisions and escalates rather than continuing past an open gate. Run state at the park: story index of 24 tasks / 333 points written but uncommitted, `P1` and `P3` still `[ ]`, `P2` `[-]`. Options: **(a)** resume with a fresh 5-revision cap, the writer revising per `review_3.md`; **(b)** accept `review_3.md`'s Must Fix as rejected or deferred, recording a `## Rejected findings` entry, and continue to the task-plan-reviewer gate; **(c)** stop and fix the plan by hand or cut scope. The run leaned (a).
- **answered:** "a — resume with a fresh cap. Apply `review_3.md`'s Must Fix. The Should Fix and Nice to Have items stay under the normal gate rule: only a Must Fix fails a plan gate, so the writer applies them at its own discretion and they are not a condition for convergence. The implementation and branch review phases can still raise them."
- **carries beyond this branch:** a standing reading of the plan gates — only a Must Fix fails one; Should Fix and Nice to Have items are the writer's discretion and are never a condition for convergence.

## question_5 — The plan loop hit its fresh 5-revision cap with the task-plan-review gate still open
- **raised by:** the planning orchestrator (`/branch-start-plan-autonomous`, planning loop), after `task-plan-reviewer` returned `verdict: FAIL` (1 Must Fix) on the fifth writer revision of the fresh budget question 4 granted
- **asked:** per-gate totals at the park — architecture 5 findings files, task-plan-reviewer 5, business parity 0 (`phases.parity` false); the Must Fix count fell 3 → 2 → 1 and then stayed at 1, each round a different narrow consistency item. Options: **(a)** another fresh cap; **(b)** accept `review_4.md`'s Must Fix as deferred, apply it in one last writer revision, then run either no further gate or only the architecture gate (saying which), and treat planning as converged; **(c)** accept it as rejected, giving the `## Rejected findings` text; **(d)** stop and fix the plan by hand. The run leaned (b).
- **answered:** "b — apply `review_4.md`'s Must Fix in one final writer revision, then run no further gate. Treat planning as converged and continue into implementation. The branch review and skeptic review phases catch whatever is left."
- **carries beyond this branch:** nothing beyond this branch — the ruling is a convergence decision for this plan loop, not a standing rule.
