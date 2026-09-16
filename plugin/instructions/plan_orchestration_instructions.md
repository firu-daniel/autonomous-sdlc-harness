> **This is the supervised, one-item-per-session loop — NOT the shared core.** The mode-free core for the orchestration family is `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`; its forks are `…_semi_autonomous.md` and `…_autonomous.md`.

> **What this file is — read this before "fixing" it.** It is the harness's third drive mode: a supervised, human-gated **item loop** (trivial-inline option, no phases, no safety contract, no reviewer agents), **not** a mode fork over the planning core — which is why it declares **no binding table**, must not be given one, and must not be dissolved into that core.

---

## Resolved values

The tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<K>`, which this file's own text resolves): they resolve from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<layer_names>` | config value | `layers[].name`. **No substitution of the names themselves** — the configured names travel through this file unchanged, because step 1's routing table passes the layer as a dispatch argument rather than selecting an agent filename by it. `general` is one of the `layers[]` rows a generated config emits (`{ "name": "general", "path": ".", "conventions": … }`), not an entry beside the array. |
| `<layer_path_map>` | config value | `layers[].path` together with `layers[].conventions` — the scope step 1's routing table routes by, and the rules document step 2 passes to the specialist alongside the layer name. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`. |

---

Work through items in the order recorded in the **index file**'s `## Phase 2 Readiness — Ordered Fix List` section. The index is the thin file that carries `## Context` + the readiness list: for task plans the **story index** at `<state_dir>/story_plans/<branch>_story_plan.md`; for code reviews the code-review index at `<state_dir>/code_reviews/<branch>_code_review.md`. **This section is the single source of truth for the iteration loop** and is positioned near the top of the index (immediately after `## Context`; the story index has **no** `## Tasks` section). Walk the entries inside that section top-to-bottom: the **first `[ ]` entry** is the next unit of work. Resolve its `**Task K**` / `**Finding K**` reference to the matching **self-contained per-item detail file** — `<state_dir>/task_plans/<branch>/task_<K>_plan.md` for task plans (its `### Task K — …` heading), `<state_dir>/code_reviews/<branch>_code_review/finding_<K>.md` for review files (its `### K. <title>` heading) — and read **only that one file** for the body. Do not read the whole set of per-item files.

**Strictly ignore `[ ]` markers anywhere else.** Implementer agents may tick `- [ ]` sub-step bullets inside individual per-item files to track their own progress — those are informational only. Never use them to decide what to do next, and never flip them yourself.

If every `[ ]` inside the index's readiness section is already `[x]`, say so and stop — do not invent new work.

**Steps:**

1. **Determine approach.** Pick one of:

   - **Trivial inline** (typos, redundant returns, `let`→`const`, single-line constant change, l10n string-only edit): edit directly. No agent overhead for two-token edits.

   - **Single-layer** substantive change: spawn the matching layer specialist once. Pick by file path:

     | Layer | Path / concern | Specialist |
     |---|---|---|
     | any one of `<layer_names>` — **one row per `layers[]` entry** in `harness.config.json`, and no other value routes | that entry's `layers[].path`, read from `<layer_path_map>`, with its `layers[].conventions` as the rules document | `layer-implementer`, with the layer name passed as a dispatch argument alongside that entry's `path` and `conventions` |

     **The table is generic because the layer set is adopter-configured**: `layers[]` is an arbitrary list, so an agent-per-layer scheme cannot be generated for it — the layer travels as a dispatch argument to one agent instead of selecting one of a fixed set of agent filenames. `layer-implementer`'s reviewer counterpart, `layer-reviewer`, is **not** dispatched by this flow: step 3 below is this loop's review and you perform it in-session.

     **Catch-all.** Work that lands in none of the other layers' paths — workflow artifacts, scripts, infra/CI configs, agent/command/instruction edits — routes to **the layer whose `path` is `"."`**, the row every `init`-generated config supplies as `general`. If a hand-written `layers[]` carries no such row, that is a **configuration gap**: report it to the user and stop; never invent a layer name, widen another layer's `path`, or edit the config.

   - **Cross-layer** finding/test entry (a `**Finding K**` / `**Test K**` whose `_(layer: …)_` tag is a comma-joined fix-target path spanning more than one layer): dispatch sequentially in **bottom-up order** — one `layer-implementer` per layer, in the order the tag lists, which is already bottom-up. See step 2 for the chaining pattern. A story-plan `**Task K**` entry is always single-layer and routes through the **Single-layer** row above — it never takes this cross-layer path.

2. **Implement the task.**

   - **Inline:** edit directly.
   - **Single-layer:** spawn the specialist once. Its system prompt covers conventions, parity rules, and output contract — your prompt to it must include file paths, the exact problem, the relevant source anchors of the reference implementation (`<parity_vocabulary>`, at `<reference_impl>`) the per-item detail file referenced, and any constraints (see "Sub-agent prompts" below). *The reference-implementation anchors apply only when `phases.parity` is `true` in `harness.config.json`.* Pass the per-item detail file path (`task_<K>_plan.md` / `finding_<K>.md`) to the specialist; also pass the index path for shared `## Context` it may need.
   - **Cross-layer:** dispatch sequentially. After each specialist returns, **briefly verify its output before the next dispatch** — bottom-layer mistakes propagate up and are expensive to unwind. The next specialist's prompt must reference what the previous one built (e.g., "the type `ItemSummary` was added under the data layer's configured `path`, at `summaries/itemSummary`, with fields `ownerId, itemId, tags` — wire your service to it"), and the prompt after that names the domain counterpart its caller binds to (e.g., "`ItemSummary` is remapped to `Item` under the domain layer's configured `path` — consume `Item` in the caller you are wiring, not the transport type"). One commit at the end of the chain covering all layers.

3. **Always review the result** — read the modified file(s) and verify:
   - The change matches the intent of the plan task
   - The specialist's output contract was satisfied (e.g., a data-layer dispatch reported its serialized-field correspondences; a domain-layer dispatch reported the test path)
   - No regressions or new issues introduced
   - Code style is consistent with the rest of the file

4. **If review passes:** notify the user with:
   - What changed and where (file + line reference)
   - What to test (and how, if non-obvious)
   - Then pause and wait for their go-ahead. The user reviews and tests before the next step — this is the contract.

5. **If review fails:** stop the chain immediately, explain the issue clearly, and ask the user how to proceed. Do NOT move to the next item.

6. **On user approval / go-ahead:** first **flip the matching `[ ]` to `[x]` inside the index file's `## Phase 2 Readiness — Ordered Fix List` section** (the story index for task plans, the code-review index for review items; do not touch any other line — `[ ]` markers elsewhere are informational), then create a dedicated git commit that includes **the code change(s), the updated index file, and the per-item detail file if the specialist appended `**Deviations from plan:**` notes to it**. Then stop — the next task waits for the next command invocation in a fresh conversation.

---

## Sub-agent prompts

The agent does not see this conversation. Make every prompt self-contained:

- State the **file path(s)** to read and modify.
- Describe the **exact problem** (anchor it by symbol, heading or quoted substring; a line number only as a hint beside the anchor).
- Give **precise instructions** for what to change.
- Include the **relevant source anchors of the reference implementation** (`<parity_vocabulary>`, at `<reference_impl>`) referenced in the per-item detail file for any business-logic decision (remote-call name, threshold value, stored-document field name with its serialization annotation, gating condition, side-effect order). Without these the agent cannot verify parity. *Applies only when `phases.parity` is `true` in `harness.config.json`.*
- For cross-layer chains: explicitly tell each agent what the previous agent built — file path(s), key type names, key function names — so it can bind to real symbols instead of guessing.
- State **constraints** (what NOT to touch, style rules to follow, patterns to match).

The agent's system prompt covers conventions and parity *rules*; your prompt provides the task-specific *facts*.

---

## Commit conventions

Each item gets its own commit, and its subject prefix comes from a stated source rather than from your reading of the item. Read `committer.md`'s own contract for the `commit_prefix` argument — the same source the dispatching flows' `commit_prefix rule` cells read — and use the prefix it, or the policy it names, designates for the class of commit you are making: a fix to existing work, or new work. Resolve that class from the item you are committing rather than from the kind of file it happens to touch — where the designation distinguishes a code commit from a flow-artifact one, an item off this readiness list is the code one, the flow's own artifact commits being made elsewhere; and never from a category of your own invention, and never a token outside that designation.

Where that designation says such a commit carries no prefix, the subject is the description alone — no prefix and no `: ` separator. Where the policy that contract reads answers neither question, use the value that contract names for that case; it names one for every state the policy can be in, so this rule always resolves and never leaves you inventing a category.

```
<the designated prefix>: <short description of what the item changed>
```

---

## Notes

- **Sub-agents run in isolated context** — they do not see this conversation. Their output is the only thing that lands back here.
- **A change to a deployed backend surface cannot be exercised locally** — always flag these explicitly so the user knows a deploy or a test is required.
- **Never batch commits** — one item fixed/implemented, one commit. This keeps the git history clean and makes it easy to revert individual fixes.
- **If a single plan task spans more layers than expected** (e.g., the plan said "presentation only" but you find yourself needing a new use case), stop and tell the user — the plan likely needs splitting into per-layer tasks rather than silently growing the scope of one task.
