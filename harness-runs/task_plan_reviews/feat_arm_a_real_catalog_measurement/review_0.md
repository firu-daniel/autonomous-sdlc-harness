# Task plan review — iteration 0

## Must Fix

1. **Scope register: derivation entry F reaches sites that are not rows** — story index (`feat_arm_a_real_catalog_measurement_story_plan.md`), `## Scope register`.
   I re-ran derivation entry F verbatim:
   `git grep -nE 'Docs-catalog retrieval|## 6\. The roadmap this tree defers to' -- ':!harness-runs' ':!examples'`.
   It reaches these sites, and none of them is a register row. This breaks the register's own closure invariant (*"every site each derivation entry above reaches appears as a row below"*). This is disposition (i): an entry reaches sites that are not rows. All of them are listed here together.
   - `ARCHITECTURE.md`: six citations of `docs/development.md` → `## 6. The roadmap this tree defers to`.
     - The `**One spelling rule follows, and binds every section.**` paragraph.
     - The paragraph opening *"The first message is not free text with a command embedded in it"*.
     - The **No forge coupling.** bullet.
     - The paragraph opening *"This tree has declared a seam ahead of its implementation three times"*.
     - The **`forge` — the same pattern missing one part.** paragraph.
     - The paragraph opening **"This declaration has the shape the rule above refuses"**.
   - `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`: the comment `# phase. Record: \`docs/development.md\` -> \`## 6. The roadmap this tree defers to\``. These two files are a mirrored template/installed-copy pair, so they need one row per copy with `Copy` naming each one. `—` is wrong for them, and the register's claim that *"no site here has a mirrored counterpart"* is false.
   - `.claude/context/conventions.md` → `## Documents of record`, the bullet *"A deferral cites a numbered roadmap item, and the number owes a row."* This is the rule that Task 20's roadmap item 18 must satisfy.

   **Fix:** In the story index's `## Scope register`, do one of the following:
   - (a) Add one row per site above, with a disposition. They are almost certainly `no-change`: the ARCHITECTURE and watcher citations point at §6 and do not state the retrieval verdict, and the conventions document is never a target. Give the watcher pair one row per copy, with `Copy` set, and correct the closure-invariant sentence about mirrored counterparts.
   - (b) Or replace entry F with a narrower command that still reaches the `ROADMAP.md` row, the §6 heading, and every site that names the *Docs-catalog retrieval* row. Examples are `docs/config.md` §5, `docs/retrieval.md`'s opening and `evals/README.md`. Then add rows for whatever the narrower command still reaches.

   Task 25's re-derivation bullet re-runs F verbatim, so it would report these same sites as outside the register.

2. **Task 23's verification cannot pass with its targets as written, and the prompt's "cite rather than restate" requirement for `docs/retrieval.md` is only half planned** — per-task file `task_23_plan.md`, plus the story index `## Scope register`.
   - The task prompt's `## What to deliver` item 5 requires that `docs/retrieval.md` *"keep citing it rather than restating it"*.
   - Task 23 targets only the `docs/retrieval.md` → **Abstention.** clause (`ABSTAIN_SCORE_THRESHOLD = 0.32`).
   - Task 23's verification reads *"reading each hit of `git grep -n 'ABSTAIN_SCORE_THRESHOLD' -- docs/retrieval.md docs/cli.md` finds a citation, never a value"*.
   - That grep also returns `docs/retrieval.md` → `## Measured, and how` → **(iv) Search.**, whose closing sentence restates the value: *"That is a confirmation and not a re-calibration: `ABSTAIN_SCORE_THRESHOLD` stays at `0.32`."*
   - That site is in no task's `### Targets` and is not a register row. Entry B is file-level (`-l`), so it reaches the file, but only the **Abstention.** clause has a row (row 22).
   - So the Task 23 implementer either fails its own verification or edits a file section outside its targets. If the constant moves, the (iv) sentence is also a second copy of a now-superseded value.

   **Fix:**
   - In `task_23_plan.md`, add `docs/retrieval.md` → **(iv) Search.**, the closing sentence, to `### Targets`. Add a `**Work:**` clause that rewrites it as a record of what gate 10 confirmed, citing `## Threshold calibration`, without restating the numeric value.
   - Add a matching `change` row, owned by Task 23, to the story index's `## Scope register`.
   - Alternatively, if the writer judges (iv) a dated historical record that should keep its value, record that as a `no-change` row with the reason. Then narrow Task 23's verification so it excludes that one sentence by quoted anchor.

## Should Fix

1. **`task_21_plan.md` — a conditional edit is not in `### Targets`.**
   - The second `**Work:**` bullet may *"fix such a label's `ref` alone"* in `evals/docs-retrieval/queries/self-docs.jsonl`.
   - `### Targets` lists only `docs/retrieval-eval-results.md`.
   - None of the current `self-docs` labels points at a heading this branch plans to rename, so the edit is unlikely. Still, list the file as a conditional target, or say that a refusing label is a stop to report rather than an edit.

2. **The generated provenance sentence after Task 23 replaces the censored table** — `evals/docs-retrieval/results.mjs` → `provenanceSection`, which is register row 11 (`no-change`).
   - Every block renders *"The pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold calibration` below, taken at the earlier snapshot that section records"*.
   - Task 23 replaces that quoted censored table with the observed distributions, and may move the value.
   - Confirm the sentence still reads true afterwards. If it does not, give the row an owning task, most naturally Task 23 plus a regeneration, instead of `no-change`.

3. **`task_10_plan.md` — `### The tool set, and the network` is not among the subsections it rewrites.**
   - After Task 9 adds `--strict-mcp-config` and `toolCalls`, that subsection still says the withheld web tools are *"the whole of it on the tool side"*. It also still tells the operator to confirm by eye that no web tool call appears.
   - Consider adding it to Task 10's targets, so the fence description names the MCP exclusion and the `toolCalls` record.

## Nice to Have

1. **Task 18's verification** says *"every changed line lies between `<!-- eval:corpus:gate10-catalog:start -->` and its end marker"*. `rewriteGeneratedRegion` appends a new block after `region.trimEnd()` plus a blank-line separator, so one or two separator lines outside the new markers may change. Loosen the wording to "inside the generated region, and outside the two existing blocks".
