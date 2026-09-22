`feat_docs_retrieval_eval` builds the measurement half of the `ROADMAP.md` item **Docs-catalog retrieval**: the
relevance eval that decides the retrieval tool against the index-first navigation agents use today, instead of
assuming retrieval wins. It follows `feat_docs_catalog_retrieval`, which shipped the tool off by default.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other
> roadmap items by title only.

---

## Why now

Retrieval is built and opt-in. Its abstention threshold is still provisional, and nothing says whether an agent
finds the right doc sections more often, faster or more cheaply with it than by reading `INDEX.md` and following
links. Until that is measured, the docs can only call retrieval "not yet measured".

## What to deliver

1. **A runner** that takes `--repo <path>` and a query-set file. Each query maps to one or more expected
   `path#heading` labels.
2. **Five arms, on the same queries:**
   - (A) index-first navigation, as a headless agent limited to reading files under the docs root, returning the
     sections it would use — **build the harness for it; do not run it.** Arm A is a hand-run step, for the
     reason given under "Arm A is a hand-run step, and the permission profile is why" below.
   - (B) lexical only
   - (C) vector only
   - (D) fused
   - (E) fused plus rerank

   Arms B–E use the retrieval code's own interfaces, not a copy of them, and run on the **real models, not the
   stub** — `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` unset for every recorded number. Arm E's reranker,
   `Xenova/ms-marco-MiniLM-L-6-v2`, **has now been loaded and run outside the stub** by the provisioning pre-step below,
   so `docs/retrieval.md` → `## Still open` no longer describes it correctly: still say in the results file that it loaded
   and ran, and **this branch owns retiring that entry.**
3. **Metrics for each arm:** recall@k, MRR, p50/p95 latency, and token cost where an agent or model is involved.
   The output is a results file readable by a person and by a script. Arm A's row exists with its columns empty
   and marked as awaiting the hand run — an absent row would read as an arm nobody thought of, which is the one
   thing the results file must not say.
4. **Label hygiene.** The runner fails loudly, naming the label, when a label no longer resolves to a real
   heading.
5. **Threshold calibration.** Use the results to choose the abstention threshold, replace the provisional value,
   and record how it was chosen.
6. **A regression check.** Arms B–E are deterministic and cheap enough to run where this repository's other gates
   live (`scripts/run-gates.sh`), against a recorded floor. Arm A spends tokens, is never wired into a gate, and
   is reached only by the hand-run procedure deliverable 8 documents.

   `scripts/run-gates.sh` is not incidental placement — it is the only route that works unattended. `commands.test`
   points at it and the allow-listed `bash scripts/test.sh` wraps it, and commands inside that script run as a bash
   subprocess with no per-command permission check, which is how it already runs `npm run build`, `node cli/dist/cli.js`
   and `claude plugin validate`. A runner invoked as a bare `node …` from a tool call matches no entry in
   `.claude/settings.autonomous.json`, and in print mode that **stalls the run rather than failing it**. So the runner
   is reached through the gates script or through `scripts/scratch-run.sh`, never as a bare interpreter invocation.
   `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` is set nowhere on that path, so a gate added there runs the real models by
   default, which is what deliverable 2 requires.
7. **Two committed corpora with query sets:** a small made-up docs catalog fixture, and this repository's own
   `docs/` plus its conventions documents. The fixture carries its **own `INDEX.md`**, because arm A navigates from
   one and this repository's `docs/` has none — it is a hand-written developer corpus, not a generated catalog.
   That is also why acceptance 2 asks for arm A on the fixture only.
8. **Documentation.** How to run the eval against any adopter's checkout, what each metric means, and a decision
   rule, written before any real-catalog numbers exist, for when retrieval counts as better than index-first
   navigation. Plus **the arm A hand-run procedure**, written to be followed by an operator at a terminal: the exact
   command, the read-only tool set it runs under, how it is kept off the network, how its token cost is read out of
   the run's output, and how many repetitions to take for the spread. This branch writes that procedure and does not
   execute it.
9. **A store case for the lexical arm.** `DocStore.lexicalSearch` filters to matching rows under a BM25 index scan
   and not under a sequential scan, so a small corpus returns non-matching rows at score `0`
   (`docs/retrieval.md` → `## Measured, and how`, item (b)). Assert that it returns **no** non-matching chunk on the
   corpus sizes deliverable 7's two committed corpora reach, and remove that entry from `## Still open` once it holds.
   If it does not hold at those sizes, record the size at which it starts holding and leave the entry, reworded.
   **Expect that second branch.** Item (b) already records `Seq Scan` at 3 rows and the BM25 index chosen unforced at
   2,003; corpus 2 is roughly 165 chunks, so the crossover is very likely above it. Find the size with **synthetic
   rows, not more committed documents** — a store-level case that inserts N generated chunks and bisects for the N at
   which the planner stops choosing a sequential scan. A row count is the answer here; a real catalog is not needed to
   get one, and committing more documents to move the number would change the corpus the other deliverables measure.
10. **Cold-build cost, and the pre-warm decision.** Measure the **real-model cold build wall time** for a fresh
   checkout and the resulting `<stateDir>/docs_index/` **size on disk** on the larger of deliverable 7's two
   corpora, and report both **per chunk** as well as in total, so the numbers extrapolate. Neither committed
   corpus is large: this repository's own `docs/` plus its conventions documents come to roughly 165 chunks,
   against roughly 1,500 for a mature catalog. So state the extrapolation to ~1,500 chunks explicitly, and carry
   this **standing decision rule** into `docs/retrieval.md`: **if the cold build exceeds 60 seconds, the build
   moves into `setup-worktree.sh`.** Apply it to the extrapolation here; Gate 10's hand run against a real
   catalog is what settles it on a measured number rather than an extrapolated one. The agent runner's MCP
   tool-call timeout defaults to 60 s and an adopter may lower the Bash timeouts further, which is why 60 s is
   the line. Whichever way the number falls, rewrite the argument in `docs/retrieval.md` →
   `## Why setup-worktree.sh does not warm the index`: it currently rests on "branches that never query", which is
   close to an empty category — every branch runs planning and every plan agent holds the grant — so the honest
   statement is "agents that do not query".

   **Take both figures through `scripts/scratch-run.sh`.** Clearing `<stateDir>/docs_index/` to get a cold build needs
   `rm -rf`, which is a **`deny` floor** entry in `.claude/settings.autonomous.json` — evaluated before `allow` and not
   overridable by one, so no grant can be added to reach it. Measuring the size on disk wants `du`, which has no entry
   at all and therefore **stalls** an unattended run rather than failing it. Both are reached by writing the measurement
   into the run-artifact tree's `scratch/` directory and running it with `bash scripts/scratch-run.sh`, the allow-listed
   route that executes a *file* rather than a command string. Do not try to widen the profile for either.
11. **Exercise the query log against the real models.** The opt-in logging **has landed** — not in the user-review fix
   round this prompt was written expecting, but in `feat_docs_catalog_retrieval` itself (`cli/src/retrieval/queryLog.ts`,
   wired at `cli/src/retrieval/server.ts`). Its two assertions already exist verbatim in `cli/test/docs-retrieval.test.mjs`
   as `serve (h)` (one `search_docs` call appends one JSONL record carrying every field) and `serve (i)` (variable unset,
   nothing written anywhere), with `serve (j)` covering an unwritable path. **Do not re-implement them, and do not take the
   "say so and skip" route** — both are spent. What is net-new is that those cases run under
   `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` like the rest of the suite, and this branch is the first thing to make real-model
   calls. **Exercise it as its own pass, not as a by-product of the arm runs.** `logQuery` is called from
   `cli/src/retrieval/server.ts` alone, so a runner that drives `searchDocs` directly — which is what deliverable 2 asks of
   arms B–E — writes **no records at all**; and the server hardcodes `mode: 'fused-rerank'` and accepts only `query` and
   `k`, so every record it can ever write is an arm E record. The pass is therefore: start the stdio server on the larger
   corpus with the log variable naming a file, issue the query set over MCP, assert one record per call carrying the fields
   `queryLog.ts` declares, then repeat with the variable unset and assert nothing is created anywhere. Report that pass's
   latency **separately from library-level arm E**: it is the only number that includes the per-call incremental refresh
   and the MCP round trip, which is what an agent actually waits for, and the gap between the two is worth a line in the
   results file.

## Settled before this branch was queued

Read these as findings, not as questions to re-open.

- **Arm A is a hand-run step, and the permission profile is why.** Arm A needs a nested headless agent — a
  `claude -p` subprocess — and `.claude/settings.autonomous.json` carries no `Bash(claude:*)` entry. Per that
  profile's own `_README`, a tool call matching neither `allow` nor `deny` **stalls in print mode rather than
  prompting**, so an unattended attempt at arm A hangs the run instead of reporting a refusal. It is technically
  reachable through `scripts/scratch-run.sh`, and that route is **declined on purpose**: it would put an unsupervised
  nested agent session with its own auth and no token cap inside an unattended run, to take a measurement. So this
  branch **builds arm A's harness and the fixture it navigates, writes the procedure for running it, and stops there.**
  Do not add a `claude` grant to the profile, do not route arm A through `scratch-run.sh`, and do not silently drop
  the arm — the results file and the Done summary both name it as awaiting a hand run. The comparison the roadmap item
  wants is closed by that hand run together with the private-catalog numbers, not by this branch.

- **`retrievalApplies` gates on the docs phase, and this branch does not flip it.**
  `cli/src/config/model.ts` → `retrievalApplies` is `config.phases?.docs === true && config.docs?.retrieval === true`,
  and this repository's `harness.config.json` today has `phases.docs: false` and no `docs` key at all — so `corpusFiles`
  would warn `docs.root is not set` and index the three conventions documents alone. **The runner owns its own config**
  rather than the repository's: `cli/src/retrieval/corpus.ts` states in its own header that the gate "is its callers' to
  check, not this module's", so the runner composes a `HarnessConfig` carrying `docs.root` and the `layers[]` list and
  drives `corpusFiles` → `refreshIndex` → `searchDocs` directly. `scripts/run-gates.sh` runs that runner. **Leave
  `harness.config.json` alone** — turning `phases.docs` on would make every later branch in this repository run the
  post-implementation docs phase, a recurring cost this branch has no business imposing to take a measurement. Say in the
  results file that the numbers were taken through a runner-owned config, and what that config was.

- **No docs-catalog run happens here.** `/autonomous-sdlc-harness:branch-start-docs-autonomous` is **not** a prerequisite.
  The corpus is every `*.md` under `docs.root` plus the conventions documents, which exists today; arm A needs an index
  and gets the fixture's; and the docs phase degrades gracefully without one anyway
  (`plugin/instructions/docs_phase_instructions.md`: *"If no INDEX exists yet (catalog not run), skip — the catalog run
  will build it."*). A catalog run would also **change the corpus mid-branch**, so the roughly 165 chunks deliverable 10
  rests on, and any floor deliverable 6 records, would drift the next time it regenerated.

- **The real models are provisioned already — do not install anything, and do not let an unattended run download.**
  `cli/src/commands/init.ts` gates `setUpRetrieval` on `retrievalApplies`, so the runner-owned-config decision above means
  `init` in this repository installs neither the runtime nor the weights, ever. Both were therefore installed by hand as a
  pre-step, into the **machine-shared** cache every worktree sees:
  `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/runtime` (534 MB,
  `retrievalRuntimeState()` → `installed: true`, version `0.1.0`, `missing: []`) and `…/retrieval/models` (57 MB,
  `modelFilesPresent()` → `present: true`, `missing: []`, both `Xenova/bge-small-en-v1.5` and
  `Xenova/ms-marco-MiniLM-L-6-v2`). Verify with those two predicates rather than by listing files, and if either comes back
  false **stop and say so rather than improvising an install**: `cli/src/retrieval/setup.ts` puts every download where "an
  operator is present, because an unattended run has no network to count on", and this branch does not get to reverse that.

- **The shipped provisioning route could not have done it, and this branch does not fix that.** `setUpRetrieval` installs
  `autonomous-sdlc-harness@<own manifest version>` **from the registry**. The local version is `0.1.0` and the published
  `0.1.0` was published 2026-09-09: it carries no `dist/retrieval` and not one occurrence of `fetch-models`, because
  retrieval landed in `0f25bec` without a version bump. The pre-step worked around it with a local `npm pack` — same
  runtime directory, same peer set, same `node_modules/autonomous-sdlc-harness/dist/cli.js` entry. The consequence to
  respect: **the adopter-facing provisioning path cannot be exercised here until a version carrying retrieval is
  published**, so do not write a test or a gate that depends on it, and do not "fix" it by bumping a version — publishing
  is its own decision, on its own branch.

- **`commands.typecheck` depends on the optional peers being installed.** `npm run build` is what `scripts/typecheck.sh`
  runs, and with the retrieval peers absent from `node_modules` it fails with four `TS7006`/`TS2322` errors in
  `cli/src/retrieval/store.ts` — the PGlite types are unresolvable, so the callbacks are implicitly `any`. They are `cli`
  devDependencies, so `npm ci` installs them; the checkout simply had a stale tree from before `0f25bec`. If the typecheck
  gate fails that way, run `npm ci` before reading it as a defect in the code.

- **`.claude/context/docs-catalog.md` is not needed.** `cli/src/generators/claudeContext.ts` lists it among the skeletons
  "reachable only by hand"; nothing requires it when the docs phase is on.

## Establish, do not assume

- **How arm A would run headless without web access,** with a read-only tool set, and how its token cost is read
  from the run's output. Settle this on paper, as deliverable 8's procedure — it is what the operator follows — and
  do not execute it here.
- **How many repetitions the spread needs,** and how the procedure says to record it. The number is the operator's
  to produce; the shape of the record is this branch's.
- **The query-set format,** including whether one query can carry graded relevance or only binary labels.

## Out of scope

- Running the eval on a private catalog and publishing those numbers. That is a hand-run step after this branch
  merges, and it is what closes the roadmap item.
- **Executing arm A.** Its harness, its fixture and its written procedure are in scope; running it is not, for the
  reason under "Arm A is a hand-run step, and the permission profile is why". No arm A number is recorded here.
- **Widening `.claude/settings.autonomous.json`.** No entry is added to it on this branch — not for `claude`, not
  for `du`, not for a bare `node`. Where a measurement needs more than the profile grants, it goes through
  `scripts/scratch-run.sh` or it goes in the hand-run procedure.
- Changing the retrieval pipeline beyond the threshold, except for defects the eval exposes, which are recorded
  and fixed in their own tasks.
- LLM-as-judge relevance labelling.
- Turning this repository's own docs phase on, running its docs-catalog flow, or adopting the harness in another
  repository to obtain a larger corpus. The corpora are deliverable 7's two, and the size question deliverable 9 raises is
  answered with synthetic rows.
- Running the eval on a Linux host. `docs/retrieval.md` → `## Still open` keeps that item: settling it needs
  manual host setup this branch does not own.

## The pre-step's own numbers — a prior, not an answer

The provisioning pre-step ran the real models end to end for the first time on this machine, through exactly the
runner-owned config described above (`docs.root: docs` plus the three `layers[]` conventions documents), on
2026-09-21, macOS, Node v22.23.2:

```
corpus: 12 files, no warnings
models loaded         1126 ms   bge-small-en-v1.5:q8:cls:384  +  ms-marco-MiniLM-L-6-v2:q8:sigmoid
store opened           742 ms
cold build            9747 ms   166 chunks embedded  =>  58.7 ms/chunk
lexical 9 ms · vector 5 ms · fused 4 ms · fused-rerank 733 ms   (k=3, one query)
```

What to take from it, and what not to:

- **166 chunks** confirms deliverable 10's "roughly 165" for corpus 2.
- **It does not discharge deliverable 10.** That build used an **in-memory** store and a **warm** model cache, and measured
  no size on disk. Deliverable 10 wants a persisted `<stateDir>/docs_index/`, a cold checkout, and both figures per chunk
  and in total. Re-measure; do not quote these.
- **Plan for the 60-second rule tripping.** At 58.7 ms/chunk the extrapolation to ~1,500 chunks is about **88 s**, crossing
  60 s at roughly **1,020 chunks**. If a proper measurement agrees, deliverable 10's answer is that the build **moves into
  `setup-worktree.sh`**, and the rewrite of `## Why setup-worktree.sh does not warm the index` is a rewrite of its
  conclusion and not only of its "branches that never query" premise. Do not plan on the rule not tripping.
- **The threshold has real signal to separate.** On that one query the reranker reordered the fused arm — top fused hit
  `docs/cli.md#docs-search` at `0.0164` dropped to second at `0.1919` behind `docs/cli.md#11-docs` at `0.8269`, with the
  third hit at `0.0015`. Deliverable 5 is calibrating against a score distribution that is genuinely bimodal here, not a
  flat one.
- **The rank-derived arms' scores are tiny and uncalibrated** (`0.004`–`0.033` across lexical, vector and fused), as
  `docs/retrieval.md` says. Do not let the results file present them alongside arm E's `[0, 1]` reranker scores as though
  the columns were comparable.

**This branch owns writing these into `docs/retrieval.md`:** item (d)'s "Gate 10 has not been run" becomes a partial
result, and the `## Still open` entry calling the reranker's real-model load unverified is retired.

## Acceptance

1. The runner reports recall@k, MRR and latency for arms B–E on both committed corpora.
2. Arm A's harness runs against the fixture and its `INDEX.md`, its written hand-run procedure is in the
   documentation, and both the results file and the Done summary name arm A as awaiting that hand run. No arm A
   number is recorded, and the run made no `claude -p` call.
3. A planted label pointing at a missing heading makes the runner fail with that label named.
4. The abstention threshold is the calibrated value, and the provisional marker is gone.
5. The regression check fails when the fused-plus-rerank arm's recall drops below the recorded floor (plant a
   drop, record the output, remove it).
6. The `ROADMAP.md` row keeps status `Open`.
7. Arm E's results were produced with the real reranker loaded, and the results file says so.
8. The lexical-arm store case passes on both committed corpora, or the row count at which it starts passing is recorded,
   found by the synthetic bisect rather than by growing a committed corpus.
9. The real-model cold build time and the index size on disk are recorded for the larger corpus, both per chunk
   and in total, with the extrapolation to ~1,500 chunks stated and the 60-second rule applied to it — both figures
   taken through `scripts/scratch-run.sh`, with no entry added to `.claude/settings.autonomous.json`.
10. A real-model arm run with the log variable set wrote one record per query, and the runner read its per-query figures
   back out of that JSONL.
11. `docs/retrieval.md` records the real-model load: item (d) is no longer "Gate 10 has not been run", and the
   `## Still open` entry calling the reranker unverified outside the stub is gone.
12. `bash scripts/run-gates.sh` prints no new failure.
