# Architecture review — iteration 1

Plan-review mode, sub-case (b): the drafted user-review fix plan
`harness-runs/user_reviews/feat_docs_catalog_retrieval_fix_plan.md` plus all six
`finding_<N>.md` files, judged against `.claude/context/conventions.md`,
`.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`.

**Iteration 0's four Must Fix items are all addressed in the artifacts and none is re-raised:**
the `--rag` alias now sits on the `docsRetrieval` row of `INIT_OPTIONS` with all three consumers
named (`finding_2.md`, second alias bullet); the spelling is a named constant
`DOCS_RETRIEVAL_ALIAS_FLAG` with no literal anywhere in `cli/src` (first alias bullet); the query-log
seam is its own module `cli/src/retrieval/queryLog.ts` with `server.ts` holding no logging logic,
no field list and no `fs` call (`finding_3.md`, first bullet); and `docs/cli.md`'s
*"Nothing is written outside the repository"* enumeration is joined in the same change
(`finding_3.md`, the **Join the write-surface enumeration** bullet). Iteration 0's Should Fix
(the prescribed `Trade-offs` grep) and Nice to Have (the bare line-839 anchor) are both applied.

Layer tags on the Phase 2 Readiness list were re-checked against `harness.config.json` → `layers`
and remain correct in every row. No dependency-direction violation is planned: nothing makes `cli/`
and `plugin/` reach into each other (`.claude/context/conventions.md` → `## The layers`). The
`## Out of scope / verified-OK` section records no rejected finding, so there was none to test.

One Must Fix remains, uncovered by reading the monopoly's own owner module rather than the plan.

## Must Fix

1. **Finding 3 adds a second module that writes into an adopting repository outside the write engine, and amends the prose enumeration but not the code one** — offending file: `harness-runs/user_reviews/feat_docs_catalog_retrieval_fix_plan/finding_3.md`, the **The seam is its own module** bullet together with the **Join the write-surface enumeration in `docs/cli.md`** bullet. Cites `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"`cli/src/core/writer.ts` is the only module that writes into an adopting repository … A generator enqueues a `WriteRequest` and picks a policy from that module's table; it never calls `fs` itself and never invents a policy"*) and `.claude/context/cli.md` → `## What "done" means here` (*"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit"*).

   The log path is whatever path the operator puts in the environment variable. Nothing in the plan constrains it to sit outside the target repository, so the new `appendFile` in `queryLog.ts` is a write into an adopting repository made outside `cli/src/core/writer.ts` — the third such exception this feature has needed. That monopoly's exceptions are **enumerated in the owning module's own header**, not only in `docs/cli.md`: `cli/src/core/writer.ts`'s header carries a paragraph headed *"Two writes are deliberately outside this engine"*, names the registry and the retrieval runtime/model cache, and then states the in-repository exception in closed terms — *"`cli/src/retrieval/store.ts` is the **one** module that makes that write and `<stateDir>/docs_index/` the **one** path"* — and closes by recording that `.claude/context/conventions.md` → `### Where a new responsibility goes` *"does not yet record the exception; it is raised for a supervised amendment."*

   Finding 3 adds a second such module and a second such path and leaves that paragraph saying there is one of each. The plan's `docs/cli.md` sub-step fixes the **adopter-facing** enumeration only; the **code-side** enumeration, which is the one a `cli` implementer and a `cli` reviewer read before touching a write, is left false. Under the cli-layer rule above, a change that breaks a header's stated guarantee either satisfies it or amends it in the same edit — and here the guarantee is the monopoly itself, so the amendment is not optional tidying.

   **Fix:** Add a sub-step to `finding_3.md` requiring `cli/src/core/writer.ts`'s header to be amended **in the same change**, beside the `docs/cli.md` sub-step it already carries. The amendment states: that the query log is a third write outside this engine; that its path is the operator's own by the environment variable rather than this CLI's choice, so it may land inside or outside the repository and no policy in the table applies to it; that `cli/src/retrieval/queryLog.ts` is the one module that makes the write; that nothing is created when the variable is unset; and that it is no `init` artifact. Re-word the existing *"the **one** module … the **one** path"* sentence so it stays true rather than leaving a second claim beside it. Keep the finding's own statement that the module raises a `stale-rule`-class amendment to `.claude/context/conventions.md` → `### Where a new responsibility goes` on the same terms the existing exception already does. The finding's `_(layer: cli, general)_` tag already covers this edit and does not change.

## Should Fix

1. **Finding 3's record type is enumerated as eight fields, and a later sub-step requires a ninth that the enumeration does not carry.** The **What one line carries** bullet says *"the record type's fields, owned by `queryLog.ts`"* and lists eight; the **Where the call sites are in `answer`** bullet then requires *"the outcome field naming the failure, so a consumer parses one shape"* — a field introduced with a definite article and declared nowhere. The finding itself raises the field list to a cross-branch contract (*"the JSONL field list is the input contract the `feat_docs_retrieval_eval` branch will read"*), so the owner file's enumeration is the contract and an incomplete one invites the field to be shaped at the call site. Non-blocking because the only place the type lives is `queryLog.ts`, so the field will most plausibly land there anyway. Stating it would make the contract complete: add the outcome field to the **What one line carries** list, say that its values are a closed set declared as a union in `queryLog.ts` rather than a free string, and name the three values (answered, refresh failure, search failure).

2. **Finding 2 renames the three `doctor` check titles and does not name the document that copies them.** `docs/cli.md` carries a per-check table whose `retrieval-index` row reads `the docs-retrieval index builds` — the `title:` string verbatim, one of the three the finding renames. The finding's documentation sub-steps reach `docs/cli.md` §3 (the `init` flag table) and `docs/config.md` §5 only, so the check-title table is left holding the old wording. Non-blocking — it is a prose mirror rather than a second source the code reads, and no conventions document states an accompanying-set row for a `doctor` check title — but the rename sub-step is where it is cheapest to catch. Add the `docs/cli.md` check-title table to the `cli/src/doctor/checks.ts` sub-step's site list.

## Nice to Have

1. `finding_3.md`'s **Establish how the variable reaches the server process** bullet leaves route (a) versus route (b) for the implementer to settle by running it, and route (b) would put the environment variable's name into an adopter's own `.mcp.json`. The finding already forbids `init` generating the key and keeps the template's `"env": {}` empty, so no mirror is created — worth one clause saying so explicitly, because `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` (row *A persisted machine-state key*) makes a shipped-template mirror of a constant something the owning module's header must declare, and the reader of that bullet is standing exactly where such a mirror would otherwise be born.
