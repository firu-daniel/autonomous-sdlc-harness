`feat_arm_a_real_catalog_measurement` runs **arm A** — navigation by an agent, in two variants — against a real
documentation catalog, takes the verdict `docs/retrieval-eval.md` → `## The decision rule` was written to
receive, and **re-calibrates `ABSTAIN_SCORE_THRESHOLD` on an observed score distribution** rather than a censored
one. It follows `feat_docs_retrieval_eval`, which built every arm, scored B–E on two fixture-sized corpora and
left arm A's row reading *awaiting hand run* because no automated route in this repository may start a nested
agent session, and `chore_gate_10_real_catalog_measurement`, which ran gate 10 against the same real catalog this
branch targets.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other
> roadmap items by title only.

> ⚠️ **One measurement this branch cannot take: arm A.** Arm A needs a nested agent subprocess, which is a hand
> run by an operator at a terminal for the reasons `docs/retrieval-eval.md` → `## Running arm A by hand`
> records. Everything else — the plumbing, the query set, arms B–E, the analysis and the write-up — is the run's
> own work. The run **parks** at the two points `## Operator checklist` marks *mid-run*, and resumes on the
> operator's answer. **Never substitute a `fixture-catalog` run for a real-catalog one, never run arm A from
> inside the session, and never publish an arm A figure the operator's transcripts do not carry.**

> ⚠️ **The operator has cleared publication of this catalog's query-level material.** See
> `## Publication clearance` — it replaces the privacy fence an earlier draft of this prompt carried, and it
> still has limits of its own.

---

## Operator checklist

What only the operator can do. *Before start* rows are settled before the run is launched; *mid-run* rows are
the run's two parks, where it stops, says what it needs, and waits. The run reads this table and parks on any
*before start* row still `Open` rather than working around it — except a row marked *optional*, which the run
skips when it is still `Open` and uses when it is `Done`.

| # | Item | When | Status |
|---|---|---|---|
| 1 | **Publication clearance** for the target catalog's query text, labels, per-query records and transcripts — see `## Publication clearance`. | Before start | Done |
| 2 | **Corpus frozen for the run.** `docs/` verified byte-identical between gate 10's commit `010c50e` and the current `57a6c25`; no commit lands in the corpus until this branch merges. | Before start | Done |
| 3 | **The combination rule confirmed** — retrieval is graded against the stronger arm A variant on each bar, with the readings item 3 of `## What to deliver` settles beside it. It is stated before any figure exists or it is not a rule. | Before start | Done |
| 4 | **The session can reach the corpus without the tree recording where it is.** The run is launched headless by the watcher, whose service unit carries only `PATH`, so both are set machine-locally: the corpus's location is exported as **`HARNESS_EVAL_CORPUS_ROOT`** — the corpus's repository root, the value the eval runner's `--repo` takes — in the watcher's machine-local override file, which it sources under `set -a` so every engine it launches inherits it; and read access is granted in the untracked unattended settings profile — the directory in `additionalDirectories`, a `Read` rule over it, and a literal `Bash(printenv HARNESS_EVAL_CORPUS_ROOT)` entry. The run learns the value with `printenv HARNESS_EVAL_CORPUS_ROOT`. A command that expands the variable inline is not reliably auto-allowed in an unattended run, so anything that executes against the corpus (arms B–E, the label pre-flight) goes through a `scratch-run.sh` file that reads `"$HARNESS_EVAL_CORPUS_ROOT"` from the environment rather than carrying the literal path. No committed file — task prompt, plan, clarification answer, scratch file or transcript — carries the path; the variable name is the only thing any of them records. | Before start | Done |
| 5 | **Arm A's model and token budget chosen.** Arm A's latency and cost move with the model, so the operator names it — the harness's configured `agentModel` unless there is a reason otherwise — and the spend ceiling for up to 10 passes of the query set. **Model: the configured `agentModel`, `opus`.** **Ceiling: account usage share, not a token count** — the account is on a subscription, so tokens bill nothing and the binding constraint is the 5-hour window. Arm A's passes never take that window above **~90%**; a pass that would is started after the reset instead, so the ceiling **paces** the ten passes rather than capping them, and hitting it is a pause, not a stop. The 7-day window was at 4% when this row was settled and is recorded, not capped. Row 7's checkpoint reads against this: repetition 1 of each variant, its window-share rise projected ×5, must fit under the 90% with the passes spread across windows as needed; only a single pass that alone would exceed it stops the variant. The run's evidence from comparable unattended runs, for scale: a full feature run on this account used 0.5–2M output tokens and 67–324M cache-read tokens, peaking the 5-hour window at 25–49% when running alone; arm A's ~500 single-query sessions are estimated at roughly one such run in total. **Record per variant**, beside the token totals item 9 asks for: the 5-hour and 7-day window utilisation read before and after each pass. | Before start | Done |
| 6 | **Query set approved.** The run authors the set (`## The query set`) and parks with it; the operator reads it, spot-checks that every grade-3 label really answers its query and that every negative is really uncovered, and approves or returns corrections. Nothing is scored against a set the operator has not approved. | Mid-run | Open |
| 7 | **Arm A run at a terminal**, both variants, per `## The arm A runs`, and the transcripts handed back to the run by path. Repetition 1 of each variant is a cost checkpoint: if it projects past item 5's budget, stop there and tell the run, which records the shortfall rather than a figure. | Mid-run | Open |
| 8 | **Optional — harvest real agent queries.** In the target corpus, which is already initialised with `phases.docs` and `docs.retrieval` on, export `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` to a path outside both trees and run `/autonomous-sdlc-harness:branch-start-plan` on a handful of realistic Expause task prompts (declining to write each plan is fine — the queries are what is kept). Hand the run the log's path and the task prompts. Costs one planning session per prompt. Row 2 still holds: the harvest may leave branches and untracked files in the corpus, but no commit and no change under `docs/`. The log is written by the `search_docs` server alone, so it exists only where retrieval is on — hence this corpus, not the Expause repository, whose retrieval is off. The corpus holds no code, so its planners have nowhere to go but the docs: the harvest shows what agents' queries **look like**, not **how often** they would search. | Before start (optional) | Open |
| 9 | **Teardown of row 4's machine-local setup.** Both files row 4 changed were backed up first, each as `<file>.bak-2026-09-23` in the harness's machine config directory, beside `watcher.env`. Restore the unattended settings profile from its backup, which drops the corpus from `additionalDirectories` and the two allow entries; restore `watcher.env` from its backup, which drops `HARNESS_EVAL_CORPUS_ROOT`; then restart the watcher so it stops exporting the variable (the profile is read fresh per launch, `watcher.env` only at watcher start). Delete both backups once restored. | After the branch | Open |

---

## Why now

`docs/retrieval-eval.md` → `## The decision rule` states the comparison the whole eval exists to make — **arm E,
the shipped `fused-rerank` mode, against arm A, agent navigation** — over the same query set and the same corpus
at one snapshot, and it names three outcomes: retrieval goes on by default, retrieval stays opt-in, or
**retrieval is withdrawn** and the tool and its optional dependencies come out. That rule was deliberately
written before any arm A number existed so it could not be chosen to fit one.

No arm A number exists. Arms B–E have been scored twice, on 41-chunk and 177-chunk corpora, and the standing rule
in the lessons ledger is that a figure measured on a fixture-sized corpus never justifies a design decision on
its own. So the branch that built the eval could only record that the verdict is open. **This branch closes it,
or records precisely why it still cannot be closed.**

Two things about the existing figures make the run worth taking seriously rather than as a formality. On both
committed corpora arm E is the **worst-scoring arm** on every relevance column, at two orders of magnitude more
latency, and the only column it wins is abstention on negative queries. And arm A is the alternative that is
already in every agent's hands at zero marginal cost. An honest run may well return *withdraw*, and the prompt is
written so that outcome is as deliverable as any other.

**The abstention threshold is owed the same real-catalog evidence.** `docs/retrieval-eval-results.md` →
`## Threshold calibration` fixed `0.32` as the midpoint of an interval whose lower end is a **censoring bound**,
not a measurement: every negative query abstained, an abstaining query records `bestScore: null`, and so no
negative score has ever been observed — only that each fell below `0.30`. Gate 10's search leg added one positive
at `1.000` and one negative that abstained, which confirms the value at both ends and observes nothing new.
`### The limit on this calibration` names what would move it: a real-catalog arm E run that **observes** the
negative distribution instead of bounding it. This branch's run over the real catalog is that run, provided the
eval stops discarding the score on abstention.

## The target catalog

**The gate 10 throwaway corpus**, the same private real catalog `chore_gate_10_real_catalog_measurement`
measured — identified in the committed tree by its commit and size, never by a filesystem path; the operator
holds its location. Its `PROVENANCE.md` is the record of what it contains and is read first. In short:

- **Two halves under one `docs.root` of `docs`.** `docs/expause-web/` — the live Expause web documentation
  catalog, 98 files, ~1,358 chunks, built by this harness's docs-catalog flow and therefore carrying that flow's
  **`INDEX.md`** at `docs/expause-web/INDEX.md`. `docs/vite/` — the upstream Vite documentation, 57 files, ~601
  chunks, whose `index.md` files are VitePress landing pages, **not** navigation maps.
- **No `docs/INDEX.md` at the root.** The index an agent is told to read covers the first half only.
- **Snapshots.** Gate 10 stamped commit `010c50e`, 156 files / 1,960 chunks. The corpus has since moved to
  `57a6c25`, a `PROVENANCE.md`-only commit. Establish that `docs/` is byte-identical between the two before
  citing gate 10's figures as the same snapshot, and stamp every figure this branch records with the commit it
  was actually taken at.

That shape is not an obstacle to hide; it is the realistic adopter case — a harness-built catalog with its own
map beside a vendored one without — and it is why arm A runs in two variants.

## What blocks it today, and what this branch has to build

Arm A is currently defined over `fixture-catalog` **alone**, and four specific things stand between it and this
catalog. Each is a deliverable, and none is a flag.

1. **Arm A runs in two variants, because an adopter's agents navigate in two ways.** With `phases.docs` on and
   `docs.retrieval` off — the shipped default, since `docs.retrieval` defaults to `false` — the plan writer and
   the reviewers are told to read the catalog *"index first, then walk each doc's related-docs graph"*
   (`plugin/agents/task-plan-writer.md`). A catalog with no such map leaves the agent to search the tree.
   - **A-index** — the arm as built: told to read the catalog's `INDEX.md` first and follow its links. On this
     corpus that is `docs/expause-web/INDEX.md`, which does not reach `docs/vite/`.
   - **A-search** — no index named: told the catalog is rooted in its working directory and left to find
     sections with its read-only tools.
   Both variants already carry `Read`, `Grep` and `Glob` (`run-arm-a.sh` → `ALLOWED_TOOLS`), so the difference
   between them is the **instruction**, not the tool set. Keep it that way — a variant that differs in two
   things at once measures neither — and say in the results that A-index could grep and whether it did.
2. **`agent-task.md` hardcodes the index path and carries exactly one substitution token, and that count is
   checked.** The file states that `{{query}}` is its only token and the runner substitutes it and nothing else;
   the check is part of the run's own pre-flight. Pointing A-index at an index that sits elsewhere, and giving
   A-search a task text that names no index, means either a second token or a second task file — the file's own
   opening comment, the substitution in `run-arm-a.sh`, and the token-count check all move together, and the
   fixture invocation keeps its current argument shape. Choose one in the plan and say why. Do not smuggle a
   path in by editing the prose around the token.
3. **The eval discards the score it would need to calibrate on.** `evals/docs-retrieval/metrics.mjs` →
   `bestScore(hits)` is the top **returned** hit's score, so an abstaining query carries `null`. Arm E has to
   record the top reranker score **whether or not it abstained**, as a separate field beside the existing one,
   without changing what `hits`, `abstained` or any relevance column means. Where that score comes from — the
   search result, a diagnostic field, or an eval-only path into the reranker — is a plan decision; that the
   shipped `docs search` output and the MCP server's answer do not change is not.
4. **The catalog needs a labelled query set**, authored by the run and approved by the operator
   (`## The query set`). The format is
   `docs/retrieval-eval.md` → `## The query-set format` and it is the only statement of it: one JSON object per
   line, `{id, query, labels[]}`, each label `{ref, grade}` with `ref` spelled exactly as `SearchHit.ref` renders
   it — path relative to the corpus root, GitHub-slug anchor — and `grade` an integer 1–3 where **3 answers the
   query**, 2 is more than related but does not answer, and 1 is related and useful. An empty `labels` array is a
   **negative query**: the corpus does not cover it, the right answer is to find nothing, and it scores
   abstention rather than recall. **A label that resolves to no chunk fails the run by name before any arm runs**,
   which is the property that keeps the set honest.

## The query set

**The run authors the query set; the operator approves it** (`## Operator checklist` row 6). An agent reading
the catalog can compare section titles against section text across 156 files better than a hand pass can, so
authoring it is a task in the story plan, not a pre-step. The format is item 4 of `## What blocks it today`.
Binding properties:

- **Enough positives that one query is not a result.** The committed sets carry 9 and 15 positives; the decision
  rule's own relevance bar is stated as *more than one positive query's worth* of recall@5, which on a 15-query
  set is 6.7 percentage points. Size it so the bar means something — at least 30 positives — and state the size.
- **Positives across both halves, recorded per half.** Queries answered in `docs/expause-web/` and queries
  answered in `docs/vite/`, with the count of each stated, because A-index can reach only the first half by
  its index and a pooled figure would hide that.
- **Enough negatives to observe a distribution, not to confirm one.** The committed sets carry about one in
  four; the calibration needs more than that ratio gives. **At least 20 negatives.**
- **Negatives that are genuinely uncovered, and plausible — near misses above all.** A negative has to be a
  query an agent would plausibly issue from a real situation that the catalog happens not to answer. Gate 10's one negative was a
  cooking question against a software catalog, which any arm declines trivially; the negatives that decide a
  threshold are the ones close to covered material — a feature Expause plausibly has but does not, a Vite option
  that does not exist, a topic adjacent to a documented one. Mark each negative `far` or `near`, with at least
  half `near`, and confirm each is uncovered by reading, not by a search coming back empty.
- **`near` is a judgement about meaning, made before any score exists.** Never run `docs search`, the MCP tool
  or any eval arm while authoring the set, and never keep, drop or reword a query because of how an arm scored
  it. A set tuned to land near `0.32` measures the tuning, not the catalog, and the calibration in item 5 of
  `## What to deliver` would be fitted to its own input.
- **Shaped like the queries the harness's own agents send, because they are the consumers.** `search_docs` is
  called by the plan writer, while it maps a feature's surroundings and ripples before planning, and by the
  reviewers, while they check a plan or a diff against the catalog and the conventions documents. Those calls
  are short, keyword- and identifier-dense phrases taken from the task in hand — *"content reactions like
  optimistic toggle Firestore likes"*, *"sendGift unlockContent payload"*, *"where do DTO remappers live"* —
  not a person's question. Build the set the same way: **for each query, first write the situation that would
  issue it** — one line of a plausible Expause or Vite task prompt, plan step or review finding — **then write
  the query from that situation alone**, then label it by reading the catalog. The situation is committed
  beside the query. Cover the three intents in roughly the proportions a branch would produce them: feature
  surroundings and ripples, convention and placement rules, and backend or contract lookups; state the counts.
- **The query never borrows the answer's wording.** The leak to guard against is not agent-style phrasing but
  a query written while looking at its target: a heading copied into the query hands every lexical arm — BM25
  and a grepping agent alike — its answer. A term the situation would genuinely carry — a feature name, a
  function or collection name the task names — is fair even when the heading shares it; a term only the target
  section uses is not. The author is a model and so is arm A's navigator; record that as a limit on the
  comparison rather than presenting the set as neutral.
- **The committed sets are phrased differently, and that is disclosed rather than harmonised.** `fixture-catalog`
  and `self-docs` carry natural-language questions; the real catalog's set carries agent-shaped queries. The
  results say so wherever a real-catalog figure sits beside a committed-corpus one.
- **Labels written from the catalog, not from a search.** A label set derived by running retrieval and blessing
  what came back measures retrieval against itself. Write the labels by reading, and record how they were
  produced.
- **Grades assigned deliberately.** Both the graded and the strict columns ship, and they are different numbers
  precisely because "any related section" and "the answering section" are different questions.

**When the operator has harvested a query log** (`## Operator checklist` row 8), its queries are the first
source for the set: each logged `query` becomes a candidate, its situation is the task prompt that produced it,
and it is labelled by reading like any other. Harvested queries are recorded as harvested and counted apart from
written ones. The log also carries `bestScore`, `abstained` and `hits` for every call — **those fields are never
read while choosing, keeping or classifying a query**, for the same reason the set is authored without a search:
a set selected on arm E's scores is fitted to arm E. A harvest of fewer queries than the counts above require is
topped up by writing the rest, and the split is stated.

**Before parking for approval**, the set passes the eval's own label-resolution pre-flight against the corpus —
a label that resolves to no chunk fails by name — and the ad-hoc-route comparability check in
`## Establish, do not assume` has passed, so the operator is not asked to spend tokens on a set or a route that
cannot score.

## The arm A runs

**The operator runs both variants at a terminal** (`## Operator checklist` row 7); the run parks, hands the
operator the exact commands — both variants, all repetitions, each to its own output path outside the committed
tree — and resumes when the transcripts are handed back. The procedure is `docs/retrieval-eval.md` →
`## Running arm A by hand`. Before parking, the run itself verifies the agent CLI's print-mode flag spellings
against its own `--help` (a `--help` call spends nothing) and takes the three free pre-checks. The operator's
first spent query confirms the first transcript record carries bare `path#anchor` strings in `refs` and no
code-fence entry, because a fenced answer is scored as references and silently costs every rank.

Then, **for each of A-index and A-search, five repetitions of the whole query set**, repetition 1 of each being
the cost checkpoint row 7 describes. From the transcripts the run records, per variant:

- **Median and p95 across the five**, for latency and for token cost.
- **Per-repetition recall@5 and MRR — five values each, not their mean** — pooled and per half.
- **Every repetition, including the odd one.** A repetition whose refs differ from the others is kept and
  reported. An arm whose answers move between runs is a different proposition from one whose answers do not, and
  discarding the outlier reports the second arm's figures for the first arm's behaviour.
- **Per-query `usage` blocks**, not just the totals — arm A's cost is the column arms B–E cannot have, and a
  total alone cannot say whether one pathological query paid for the arm.
- **The host stamp**, in the same shape every other figure in this tree carries, plus the agent CLI version and
  the model the session ran against — the operator states both with the transcripts. Arm A's latency is agent
  wall time and its cost is billed tokens; both move with the model, so a figure that does not name it is
  unreadable.

**Arms B–E over the same catalog, at the same snapshot** — the run's own work, not the operator's — with the
uncensored score of item 3 of `## What blocks it today` recorded for arm E on every query. The runner already
reaches an adopter's checkout through its ad-hoc corpus route — `--repo`, `--docs-root` and repeatable
`--conventions` — so this needs no new mechanism. **The decision rule requires one snapshot**: if the catalog
changed between the arm A runs and the B–E run, the two are not a comparison and the results say so.

## What to deliver

1. **Arm A reaches a catalog other than `fixture-catalog`, in both variants.** The token or task-file change item
   2 of `## What blocks it today` names, applied together with `agent-task.md`'s opening comment, the
   substitution in `run-arm-a.sh` and the token-count check. The fixture path stays working unchanged; a change
   that makes the fixture run require a new argument is a failed change.

2. **The query set is committed**, under the directory contract `evals/docs-retrieval/queries/README.md` states
   — one set per corpus, named for the corpus. That contract assumes the corpus is in this tree and this one is
   not: settle in the plan how a committed set names a corpus held outside it, and update the README to say so
   rather than leaving it stating a rule the shipped state breaks.

3. **The decision rule is applied, in writing, bar by bar, against each arm A variant.** Not a summary — the
   three bars each answered against the measured figures, with the arithmetic shown:
   - **Relevance.** Arm E's recall@5 *and* MRR against each variant's, and whether the lead exceeds one positive
     query's worth of the set actually used. State `1 / positives` for that set as a number.
   - **Cost.** Arm E's p95 against each variant's per-query wall time, as the ratio the bar states; arm E's zero
     billed tokens against each variant's measured token cost per query. The one-time cold build and the
     on-disk index are the charge against retrieval, and they **already exist for this corpus**:
     `docs/retrieval-eval-results.md` → `## Cold build and index size` →
     `### The real-catalog build — 1,960 chunks, 2026-09-22` records them. Cite that section — do not
     re-measure — and say whether the snapshot is the same one.
   - **Failure.** Arm E's abstention rate on negatives against how reliably each variant answers `none`, split
     `far` / `near`.

   **How two variants combine into one verdict, stated here so it cannot be chosen after the figures:**
   retrieval has to beat **the stronger alternative an agent has**, so each bar is graded against whichever
   variant does better on that bar, and the verdict is the one that comparison produces. Record the verdict
   against each variant separately as well, because an adopter whose catalog has no index is facing A-search
   alone.

   **What the combination leaves open, settled with it** — each of these reads the rule rather than amending
   it, and each is fixed before any figure exists:
   - **"Stronger" is taken per metric, not per variant.** Where a bar carries two figures — relevance's
     recall@5 and MRR — each is graded against whichever variant does better on *that* figure, even when that
     makes the comparison a composite no single variant produced.
   - **A variant's figure is the median of its repetitions.** The per-repetition values are all reported, as
     `## The arm A runs` requires; the median is the one a bar is graded on. Grading against the best
     repetition would reward arm A for its noise.
   - **Pooled figures decide a bar; the splits are reported beside them.** Relevance is graded on the pooled
     set, with the per-half figures shown; failure is graded on all negatives together, with `far` and `near`
     shown.
   - **The cost bar's "a fraction" means any ratio below 1** — arm E's p95 under the stronger variant's
     per-query wall time. Say in the results that both cost figures clear by construction — local milliseconds
     and zero billed tokens against an agent session per lookup — so the cost bar cannot discriminate here and
     the verdict turns on relevance and failure. The one-time cold build and the on-disk index are cited, as
     the Cost bullet above says, and graded against nothing.
   - **Relevance and cost clear, failure does not** — a combination the rule's three outcomes do not name — is
     read as **stays opt-in**, with arm E's abstention rate on negatives recorded as the figure a later change
     has to move. Item 5's re-calibration is the change most likely to move it.
   - **A variant stopped at row 7's cost checkpoint** is graded on the repetition it has, marked partial
     wherever its figures appear, and the stop is recorded as a cost result of its own. It does not turn the
     outcome into *the rule cannot be applied*.

4. **The outcome is recorded as one of the rule's three, and the change it names is made or opened.** *On by
   default* is the four-place configuration contract `.claude/context/conventions.md` → `### The order files are
   created…` describes; *stays opt-in* records the cost figure that failed as the thing a later change must move;
   *withdrawn* takes the tool and its optional dependencies out. **This branch takes the decision and records it;
   whether it also executes a withdrawal or a default flip is a scope call to settle in the plan** — but the
   decision itself is not deferrable, and an outcome of *the rule cannot be applied* must name the missing
   measurement rather than restating that the corpora are small.

5. **`ABSTAIN_SCORE_THRESHOLD` is re-calibrated on the observed distributions** — unless the verdict is
   *withdrawn*, in which case the distributions are recorded and the constant goes with the tool. The method is
   fixed here, before any score is seen:
   - **Separable** — every negative's uncensored score below every positive's best score: the new value is the
     midpoint of the gap between the highest negative and the lowest positive, rounded to two decimals, the same
     rule that produced `0.32`.
   - **Overlapping**: the value is the one that abstains on **every `near` negative that scored below the
     lowest-scoring 3-graded positive's best score**, and the positives it then abstains on are counted and
     published as the price. If no value clears all `near` negatives without abstaining on more than one
     positive query's worth of the set, record that as the finding — a threshold cannot separate this
     catalog — and leave the constant unchanged rather than trading recall silently.

   Pool the real catalog with the two committed corpora's observed scores only after regenerating those with the
   uncensored field, so every point in the pool is observed rather than bounded. `## Threshold calibration`
   stays the one record of the value: its figures, its interval and `### The limit on this calibration` are
   rewritten there, and the constant's doc comment in `cli/src/retrieval/search.ts`, `docs/retrieval.md` and
   `docs/cli.md` §11 keep citing it rather than restating it. If the value moves, the fixture abstention tests
   and gate 11's floor are re-run against it, and `evals/docs-retrieval/floor.json` is regenerated only if the
   move changes a floored figure, with the change and its cause recorded beside it.

6. **`docs/retrieval-eval-results.md` → `## Arm A — awaiting a hand run` is renamed and rewritten.** A section
   still announcing an awaited run above a recorded one is a false record; the heading change is part of the
   work. The spread goes **below the end marker**, which is hand-written territory. Arm A's generated table row
   is filled only by re-running the eval with `--transcript`, never by hand; with both variants the table needs
   a row each, and whether the generator learns a second arm A row is a plan decision.

7. **`## The shipped default against fusion alone` gains the real catalog's D-versus-E row pair**, from the same
   B–E run, and its *"What this does not settle"* paragraph is rewritten to say what the third corpus did to the
   trade. This branch records the measurement; it does not change the default mode (see `## Out of scope`).

8. **The `ROADMAP.md` docs-catalog-retrieval row moves off `Open`, or says what still holds it there.** The
   eval's own acceptance kept it `Open` pending exactly this measurement.

9. **Record what arm A cost to run**, per variant, in tokens and in operator time, beside what it settled. It is
   the only arm that bills, and the next person deciding whether to re-run it on another catalog needs the price.

## Publication clearance

**This repository is public, and the operator has cleared the target catalog's query-level material for it.**
The Expause half is internal product documentation reviewed by the operator as carrying nothing sensitive; the
Vite half is public upstream documentation. What that clearance covers, and what it does not:

- **May be committed:** the query set itself — query text, `ref` labels, grades — per-query records, per-query
  scores, transcripts, and every aggregate. Arm A's generated rows may be filled from a committed transcript.
- **Still may not:** any machine-local filesystem path — the corpus is named by commit and size, as
  `chore_gate_10_real_catalog_measurement` named it — and any credential, token, environment value or account
  identifier a transcript can carry. **Read every transcript before committing it** and strip anything of that
  kind; a transcript records what the agent saw, not only what it answered.
- **Document text beyond what a `ref` and a label need is not quoted wholesale** into this tree. A per-query
  record names sections; it does not republish them.
- The tree already carries a mechanical check for machine paths and a sweep for identifiers belonging to the
  repository the harness grew in. **Establish that both cover what this branch adds** — a committed transcript is
  new material for both — and extend rather than work around them if they do not.

## Establish, do not assume

- **Whether the ad-hoc corpus route reaches arm A at all.** It is built for arms B–E, which drive the library
  directly, while arm A is a shell script taking a corpus root as an argument. Whether the two agree on what the
  root is — and therefore whether a `ref` from arm A is string-comparable to a label and to a B–E hit — is the
  property the entire comparison rests on, and it has never been exercised outside the fixture. **Test it before
  the operator spends tokens**, with the sample transcript and a throwaway public catalog.
- **Whether the arms are comparable when the catalog carries conventions documents.** `--conventions` adds files
  to the corpus that sit outside `docs.root`; neither arm A variant is pointed at them. An arm that cannot reach
  part of the corpus is not being scored on the same corpus, and if that is the case it is a disclosed limit on
  the comparison, not a defect to hide. The same holds for A-index and `docs/vite/`, which its index does not
  link: that is the variant's real behaviour on a mixed catalog, and it is reported per half rather than
  corrected by writing a root index.
- **What arm A does with a catalog large enough to matter.** The fixture is 9 files; this catalog is 156. It may
  not fit an agent's context by following links, and the arm's behaviour at that size — whether it gives up,
  guesses, or navigates well — is a result about the alternative, not an obstacle to the measurement.
- **Whether five repetitions is enough spread** for an arm this non-deterministic, once five real values exist.
  If they disagree widely, say so and say what a defensible number would be; do not average it away.
- **Whether the uncensored score is the score abstention actually tests.** The threshold is applied to the top
  reranker score in `fused-rerank` mode; the field item 3 adds has to be that same number, not a fusion score or
  a post-normalisation one, or the calibration is on the wrong axis.
- **Whether agents would search the docs at all.** Every arm here is handed a query and scored on what it finds;
  none measures how often an agent with the code in front of it asks the docs anything. The operator's
  observation on the Expause repository, whose agents have its docs catalog and no retrieval, is that its agents
  almost never navigate from `INDEX.md` — which the plan writer and reviewers are told is navigation, never
  evidence — and go straight to searching the code. So the realistic alternative to retrieval is often neither
  arm A variant but **not consulting the docs**, and this corpus, which holds no code, cannot measure that.
  Record it as a limit on whatever verdict item 4 of `## What to deliver` reaches, and say what would measure
  it: the query log switched on in a repository with both code and a catalog, over real branches, counting
  `search_docs` calls per planning and review dispatch. This branch does not take that measurement.
- **Whether the decision rule survives contact with its own first application.** It was written before any number
  existed. If a bar turns out to be unmeasurable as stated, or to be ambiguous at the values that came back, that
  is a finding about the rule and is recorded as one — **but the rule is not rewritten to fit the numbers**,
  which is the single property it was written early to preserve. The two-variant combination in item 3 of
  `## What to deliver` applies the rule; it does not amend it.

## Out of scope

- **Re-measuring the cold build or the index size.** `chore_gate_10_real_catalog_measurement` measured both on
  this corpus; the cost bar cites `### The real-catalog build — 1,960 chunks, 2026-09-22`.
- **Warming the index at worktree setup.** Roadmap item 17 is **cancelled**, on coverage rather than on any
  figure — `docs/retrieval.md` records why — and no result of this branch reopens it; only a change to the cost
  side that `## Cold build and index size` names could.
- **Changing the default mode or extending the abstention policy to `fused`.** The recorded finding that arm D
  outscores the shipped arm E is a measurement awaiting a decision; this branch adds the real catalog's evidence
  to it (item 7 of `## What to deliver`) and does not take it.
- **A second regression floor.** `evals/docs-retrieval/floor.json` is graded on `fixture-catalog` alone by design
  and the real catalog does not become a second floor; the floor moves only as item 5 of `## What to deliver`
  allows.
- **Adding an automated route to arm A** — a permission grant for the agent binary, a `scratch-run.sh` route, or
  a dispatched-subagent route. The first two are refused by name in `run-arm-a.sh`'s own header. The third is
  discussed nowhere and is worth one recorded paragraph rejecting it rather than silence: a dispatched subagent
  returns no `usage` block for the cost column, inherits the parent's working directory and context rather than
  starting clean in the corpus, and is fenced by a static agent allowlist rather than per-invocation flags. Write
  that paragraph into `docs/retrieval-eval.md` → `## Running arm A by hand`; build nothing.

## Acceptance

1. A labelled query set exists for the target catalog, to the committed format and committed, with its positive
   count (at least 30, split per half) and negative count (at least 20, split `far` / `near`, at least half
   `near`) recorded, the method by which queries and labels were written stated, no search or eval arm run
   while authoring it, and the operator's approval recorded before anything was scored against it.
2. Both arm A variants ran five repetitions of that set against the target catalog, and all ten are recorded —
   per-repetition recall@5 and MRR pooled and per half, median and p95 latency and token cost, and per-query
   usage figures.
3. Arms B–E ran over the same catalog through the ad-hoc corpus route, at the same snapshot as the arm A runs,
   the recorded figures carry that one stamp, and arm E carries an uncensored top reranker score on every query.
4. The three bars of `## The decision rule` are each answered in writing against each variant's figures, with
   `1 / positives` stated as a number for the set used, and combined into one verdict by the rule in item 3 of
   `## What to deliver`.
5. The outcome is recorded as one of the rule's three named outcomes, or as a stated inability to apply it that
   names the missing measurement.
6. `ABSTAIN_SCORE_THRESHOLD` is re-calibrated by the method in item 5 of `## What to deliver` — or left unchanged
   with the recorded reason that method gives — and `## Threshold calibration` is the only place its evidence is
   written.
7. `docs/retrieval-eval-results.md`'s arm A section is renamed off *awaiting a hand run*, its spread sits below
   the end marker, and `## The shipped default against fusion alone` carries the real catalog's D-versus-E pair.
8. Arm A reaches a non-fixture catalog in both variants, and the `fixture-catalog` invocation is unchanged in its
   argument shape.
9. `agent-task.md`'s token-count check passes against however many tokens it now declares, and the file's opening
   comment describes the tokens it actually carries.
10. No machine-local path, credential, token or environment value appears anywhere in the committed tree, and the
    existing path/identifier checks cover what this branch added, committed transcripts included.
11. The `ROADMAP.md` docs-catalog-retrieval row reflects the outcome, or states what still holds it `Open`.
12. `docs/retrieval-eval.md` → `## Running arm A by hand` carries the recorded rejection of the
    dispatched-subagent route.
13. `bash scripts/run-gates.sh` prints no new failure.
14. The run's closing summary — the *branch ready for review* hand-off — ends with a reminder of
    `## Operator checklist` row 9: restore the unattended settings profile and `watcher.env` from their
    `.bak-2026-09-23` backups and restart the watcher. The run does not do this itself; both files are
    machine-local and outside its reach.
