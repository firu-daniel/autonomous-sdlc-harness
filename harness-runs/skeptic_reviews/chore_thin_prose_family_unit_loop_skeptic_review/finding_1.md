### 1. `layer-reviewer` forked the `## Resolved values` opening clause that six other agents carry verbatim

**File:** `plugin/agents/layer-reviewer.md` (`## Resolved values`, preamble), "The tokens below resolve from `harness.config.json`, except"

**Problem.** On `dev`, `layer-reviewer`'s preamble opened with the same clause as six other agents' preambles:

> The tokens below resolve from the adopting repository's `harness.config.json`, except `<repo_root>` (derived at runtime) and the last two, which resolve from the

Those six agents are `branch-reviewer`, `business-parity-reviewer`, `docs-writer`, `skeptic-reviewer`, `task-plan-reviewer` and `task-plan-writer`. Its shorter lead, "The tokens below resolve from the adopting repository's `harness.config.json`, except", is carried by nineteen other agents, `committer` and `layer-implementer` among them.

Task 6 rewrote the sentence as:

> The tokens below resolve from `harness.config.json`, except `<repo_root>` (derived at runtime) and the last two (from the dispatched conventions document).

That drops "the adopting repository's" and replaces ", which resolve from the conventions document this dispatch names" with a parenthetical.

**Proof.**
- `git grep -l -F "The tokens below resolve from the adopting repository's \`harness.config.json\`, except \`<repo_root>\` (derived at runtime) and the last two, which resolve from the" dev -- plugin/agents` lists 7 files, `layer-reviewer.md` among them. The same command against `HEAD` lists 6, without it.
- `git grep -l -F "The tokens below resolve from the adopting repository's \`harness.config.json\`, except" -- plugin/agents` lists 19 files. Of the agents with a `## Resolved values` heading, only three are missing from that list: `layer-reviewer.md` and the two mobile `qa-tester` variants, which never carried the clause.

**Why it is wrong.** Two rules forbid the change:
- `.claude/context/plugin.md` → `## Writing agent prose` → **Each rule is stated once.**: "A block several agents carry is one wording, copied byte-for-byte into every copy".
- The story index's `## Context`, point (2): "Every sentence these files share with an agent **outside** this family … thinning one copy alone makes the copies drift."

The story's `## Scope register` row 80 protects only the preamble's second and third sentences. The D3 split rule missed this one because the sentence's own tail ("this dispatch names") differs from its siblings'. The code review's Finding 4 is the same defect class, one sentence later in the same preamble. It does not cover this sentence. A later sweep that greps the shared clause to update every copy will now miss `layer-reviewer`.

**Fix.** In `plugin/agents/layer-reviewer.md`, `## Resolved values` preamble, replace

```markdown
The tokens below resolve from `harness.config.json`, except `<repo_root>` (derived at runtime) and the last two (from the dispatched conventions document).
```

with the `dev` wording:

```markdown
The tokens below resolve from the adopting repository's `harness.config.json`, except `<repo_root>` (derived at runtime) and the last two, which resolve from the conventions document this dispatch names.
```

Leave the rest of the preamble unchanged. The edit adds a few words. `layer-reviewer` stays far below its `Before` figure of 3819 in the story index's `## Up-front word counts`. Do not edit the story index.

- [ ] Make the replacement above.
- [ ] Re-run `git grep -l -F "The tokens below resolve from the adopting repository's \`harness.config.json\`, except \`<repo_root>\` (derived at runtime) and the last two, which resolve from the" -- plugin/agents`. It must list 7 files, `layer-reviewer.md` among them.

The fix runs no test.
