### 1. `docs/retrieval.md` restates the `search_docs` grant roster that `plugin/agents/README.txt` owns

**Site.** `docs/retrieval.md` → `## Retrieval` → **Why `setup-worktree.sh` does not warm the index.** → the paragraph beginning *"**What the move would have cost, and what it would have wasted.**"*, specifically the sentence starting *"Ten agent definitions under `plugin/agents/` carry `mcp__harness-docs__search_docs` in their `tools:` allowlist:"* and the ten names that follow it. Added by this branch (Task 2). Around line 106 of the added text; the quoted substring locates it.

**The rule it violates.**

- `.claude/context/conventions.md` → `## Registries and dispatch tables`: *"its analogue is the set of tables that route a name to an implementation, and **each is a single source with no second list beside it**."*
- `.claude/context/conventions.md` → `## The layers` → `### Where a new responsibility goes`: *"**A responsibility that already has a home does not get a second one.**"*
- `.claude/context/plugin.md` → `## Registries — a name routed to an implementation`: *"Each of these is a single list with no second list beside it, and a new member is added to the list rather than announced somewhere else."*

**The problem.** The roster of record already exists, in the `plugin` layer, and declares itself as such. `plugin/agents/README.txt` → `The docs-retrieval grant — one roster, one wire` states:

> The docs-retrieval search tool `mcp__harness-docs__search_docs` is granted to exactly these ten agents:

followed by the ten file names, and then by the cost of changing the set:

> Renaming either is an edit to the ten agent files above, that module, and the two CLI templates that carry the server name (`cli/templates/repo/mcp.retrieval.json`, `cli/templates/claude/settings.autonomous.retrieval.json`). Re-derive the roster with
>
>   `grep -rln --include='*.md' "mcp__harness-docs__search_docs" plugin/agents`
>
> whose output must be exactly the ten files listed above

This branch writes a second copy of that list into `docs/retrieval.md`, in the `general` layer, with no citation of the roster of record and no pointer to its re-derivation command. Three consequences, each of which is what the single-list rule exists to prevent:

1. **The enumerated edit set is now wrong.** The owning README names the files a rename or a roster change must reach. `docs/retrieval.md` is not among them, so the next change to the grant set edits every site the README lists and silently leaves this one stale — exactly the failure `.claude/context/conventions.md` → `## Registries and dispatch tables` and `### The order files are created…` (*"a literal only one side knows about is a silent contract break"*) describe.
2. **The `general` layer has become an owner of a `plugin`-layer fact.** `docs/` may cite plugin assets in prose — `.claude/context/conventions.md` → `## The layers` permits exactly that, and the rest of this document does it correctly by citing sections. What it may not do is hold the authoritative enumeration of a plugin registry's membership; that is the plugin layer's, and `.claude/context/plugin.md` states it as a closed list with a single home.
3. **It is not load-bearing.** The paragraph's argument is *"the question is never which agents query but only whether the worktree queries at all"* — a claim the ten names do not support and in fact cut against, since the paragraph's own point is that the identity of the querying agent is irrelevant. The only name the argument needs is `task-plan-writer`, and the only fact it needs about the docs engine is that neither `docs-writer` nor `docs-reviewer` carries the grant.

The copy is **accurate today** — `grep -rl 'mcp__harness-docs__search_docs' plugin/agents/` returns exactly the ten named definitions plus `README.txt` itself, which the `--include='*.md'` form the README prescribes excludes. Accuracy at the moment of writing is not the issue; a second list that is right today and has no owner watching it is the defect.

**The fix.** In `docs/retrieval.md`, delete the ten-name enumeration and replace it with a citation of the roster of record, keeping the argument intact. Concretely, rewrite the sentence

> Ten agent definitions under `plugin/agents/` carry `mcp__harness-docs__search_docs` in their `tools:` allowlist: `task-plan-writer`, `task-plan-reviewer`, `user-review-fix-plan-writer`, `ui-tests-plan-writer`, `ui-tests-plan-reviewer`, `review-plan-reviewer`, `branch-reviewer`, `architecture-reviewer`, `business-parity-reviewer` and `skeptic-reviewer`. The first of those is dispatched by every code flow's planning phase, so a worktree that reaches planning queries.

as something of the shape

> The agents that carry `mcp__harness-docs__search_docs` in their `tools:` allowlist are the roster `plugin/agents/README.txt` → `The docs-retrieval grant — one roster, one wire` holds, which is that set's one home and carries the command to re-derive it. What matters here is that `task-plan-writer` is on it and is dispatched by every code flow's planning phase, so a worktree that reaches planning queries.

Keep the two never-query states that follow — the stalled run, and the docs-catalog engine whose dispatched agents hold no grant — and keep them phrased so that neither restates the roster: name `docs-writer` and `docs-reviewer` as the agents that flow dispatches (a dispatch fact, not a roster entry) and say that neither is on the roster, rather than re-deriving membership here.

Do **not** fix this by adding `docs/retrieval.md` to the README's edit list: that trades one owner for two owners plus a bookkeeping rule, and the cited conventions require a single list, not a maintained pair.
