### Task 3 — Amend `ARCHITECTURE.md` → `### Why no candidate is named here` for the record's named frameworks

**Goal:** Keep `ARCHITECTURE.md` true once the decision record exists. Its §9 sentence *"no file in it names a candidate"* becomes false when `docs/second-runtime-port-decision.md` names LangGraph and six other agent frameworks as the ones considered for the withdrawn port. Amend that sentence, and change nothing else in the file.

**Depends on:** Task 1, which creates `docs/second-runtime-port-decision.md`. That record names LangGraph (with LangChain's `create_agent` built on it), the Claude Agent SDK, Pydantic AI, the OpenAI Agents SDK, CrewAI, Google ADK, Microsoft Agent Framework and Mastra. Each is described from its published documentation and third-party comparisons retrieved 2026-09-24, and no framework's source is audited. The record selects none of them as a backend and withdraws the port. This task links to the record by that path and restates none of its content.

**What was decided, and why only this sentence.** The task prompt's `## Establish, do not assume` asks whether the record changes what §7 or §9 states. §7's closing *"The first real adapter is what would tell the two apart"* stays true. The port was never built, so the contract is still a hypothesis until a first adapter exists, and the engine seam is not withdrawn. §9 → `### Why no candidate is named here` opens with a **[shipped]** sentence claiming *"no file in it names a candidate"*, where "it" means this tree. After Task 1 that claim is false. The four reasons that follow the sentence are about **this** document naming a backend candidate, and they still hold, so they stay unchanged. §1's document list is not a full index of `docs/` and is left alone.

### Targets

- `ARCHITECTURE.md` → `## 9. The open-weight backend path` → `### Why no candidate is named here`: its opening **[shipped]** paragraph only.

**Work:**

- [ ] Rewrite the opening sentence *"No audit of any candidate runtime's source exists in this tree or behind this document, and no file in it names a candidate."* so it stays true.
  - The claim of no source audit stands.
  - The tree now names agent frameworks, but only in the decision record, as the frameworks considered for the withdrawn port of one flow stage. None of them is selected there or judged against the requirement set in `### What a backend must offer`.
  - Link the record as [`docs/second-runtime-port-decision.md`](docs/second-runtime-port-decision.md).
- [ ] Follow §2's marker rule sentence by sentence. Every new or changed sentence about the system opens with `**[shipped]**`, `**[designed]**` or `**[external]**`, and an unmarked declarative sentence is a defect in this file. A sentence about what the record states is `**[shipped]**`, because it can be checked in the tree. §2 states external sources by class rather than by path, so name no framework's URL here. One possible shape: *"**[shipped]** No audit of any candidate runtime's source exists in this tree or behind this document. **[shipped]** One file names agent frameworks — [`docs/second-runtime-port-decision.md`](docs/second-runtime-port-decision.md), as the ones considered for a withdrawn port of one flow stage — and it selects none of them and judges none against the requirement set above."* Keep the paragraph's closing *"Four reasons hold that position, and it is a decision rather than an omission."*
- [ ] Leave these unchanged: §7, §1, the four bullets below the amended paragraph, the closing *"What the naming will require"* paragraph, and the rest of the file. The story index's `## Scope register` records the same disposition for the sentences of those bullets and that paragraph that state what the tree names: row 51 (the first bullet's *"Nothing of that note is in this tree"*), row 52 (the fourth bullet, *"The place where a candidate is named is a funding application's milestone wording"*) and row 53 (the closing *"What the naming will require when it happens is the source audit itself"*), each `no-change` because the record selects no candidate and audits no source. Add no sentence that withdraws or weakens the engine seam.

**Verification:**

- `git diff ARCHITECTURE.md` shows one changed paragraph, inside `### Why no candidate is named here`.
- Every sentence in the changed paragraph opens with one of the three §2 markers. Read the diff sentence by sentence.
- `grep -n "no file in it names a candidate" ARCHITECTURE.md` prints nothing, and `grep -n "second-runtime-port-decision.md" ARCHITECTURE.md` prints the new link.
- The link resolves from the checkout root: `ls docs/second-runtime-port-decision.md`.
- `grep -n "The first real adapter is what would tell the two apart" ARCHITECTURE.md` still prints its §7 sentence unchanged.
- `bash scripts/run-gates.sh`, run without a pipe. Each `FAIL` line must be a gate whose printed output names no file this task changed.
