### Task 16 — Park for the arm A hand run: verify the CLI flags, take the free pre-checks, hand over the commands, and record the run

**Goal:** Hand the operator (task prompt `## Operator checklist` row 7) the exact commands for **both** arm A variants, **five repetitions each**, against the `gate10-catalog` set — after verifying the agent CLI's flag spellings against its own `--help` and taking every check that costs nothing — then park; and on the answer, rename `## Arm A — awaiting a hand run` and record how the run was actually taken.

**Depends on:** Task 15 (the set is approved and the approval is committed), Task 9 (the runner below), and Task 10 (`docs/retrieval-eval.md` → `## Running arm A by hand` documents this procedure). The runner contract, from Task 9:

```
run-arm-a.sh [--variant index|search] [--index <path>] [--model <name>] <corpus-root> <query-set.jsonl> <out.jsonl>
```

— exit 65 on a wrong token count, 66 on a missing index; invokes the agent with `-p`, `--output-format stream-json --verbose`, `--allowed-tools`, `--disallowed-tools`, `--strict-mcp-config` and `--model`; appends `{ id, query, refs, durationMs, usage, variant, toolCalls }` per query.

### Targets

- `docs/retrieval-eval-results.md` → `## Arm A — awaiting a hand run`, renamed **`## Arm A — the real-catalog hand run`**, its body replaced by the run record (Task 19 adds the figures below it).
- `docs/retrieval-eval.md` — the **two** citations of the old heading (in `## Running arm A by hand`'s opening, and in `**The spread is hand-written**`), re-pointed at the new one. No other byte of that file.
- `evals/docs-retrieval/arm-a/run-arm-a.sh` — **only** if `--help` shows a flag spelled differently from the script; then the spelling is corrected and nothing else.

### Operator answer

*(Filled in by the task-plan writer when the run resumes from this task's park, from the operator's `answer_<n>.md`, with no machine path.)*

**Recorded on resume from park 3** (`question_3.md` / `answer_3.md` in this branch's clarifications directory). **Q1: option (a), ran it. Q2: option (a), accept and record.** This is the **answer path**: take the last two `**Work:**` bullets and **do not park again**. The operator's answer, verbatim:

> Q1: (a) Ran it. Both variants, five repetitions each, all ten passes done, none stopped; outputs under harness-runs/scratch/arm-a/gate10-catalog/ (index-rep1…5.jsonl, search-rep1…5.jsonl), each with 69 records, one per query id of the set, same id order; 690 agent sessions in total. Each repetition ran as one pair, index then search back to back, so the usage window was read before and after each pair, not each variant.
>
> | Rep | index (local time) | search (local time) | 5h window before → after | 7-day window before → after | Operator time |
> |---|---|---|---|---|---|
> | 1 | 18:24:30–18:36:15 | 18:36:27–18:49:15 | 4% → 19% | 8% → 9% | 2 min |
> | 2 | 18:58:07–19:10:08 | 19:10:22–19:22:48 | 19% → 25% | 9% → 10% | 2 min |
> | 3 | 19:32:05–19:43:52 | 19:44:03–19:56:17 | 25% → 31% | 10% → 11% | 1–2 min |
> | 4 | 20:13:39–20:25:31 | 20:25:45–20:37:57 | 31% → 37% | 11% → 12% | 2 min |
> | 5 | 20:40:41–20:52:33 | 20:52:46–21:04:44 | 37% → 43% | 12% → 12% | 2 min |
>
> All on 2026-09-23. The cost checkpoint after rep 1 passed: +15 points on the 5-hour window for the pair, estimated from token usage (weighted by relative price) as ~63% index / ~37% search; ×5 stays under 90% for each variant. Reps 2–5 cost +6 each (prompt cache warm between passes; per-session cache writes fell from 3.20 M / 1.70 M tokens in rep 1 to ~1.1–1.4 M / ~0.35 M). The runs were strictly sequential, one session at a time, so durationMs is uncontended wall time.
>
> Once: agent CLI 2.1.280 (Claude Code); model claude-opus-5-5 (--model opus; every assistant turn of all 690 sessions reports claude-opus-5-5); host darwin 24.6.0, Mac16,12 (arm64). Catalog at 57a6c25 with docs/ unchanged, checked after every pass. The first record of every file has bare path#anchor refs or the bare none token, and no file has a code-fence entry. Tool calls: only Read, Grep and Glob in every file.
>
> Three records carry a prose sentence beside none in refs, left verbatim, not edited: index-rep2 q-g10-vite-health-middleware, index-rep5 q-g10-vite-mock-updated-event, search-rep5 q-g10-neg-android-keystore. Per score-transcript.mjs a none among other refs scores as an answered miss, not an abstention; the last is a far negative, so it costs A-search one abstention on that repetition. Record this in the write-up.
>
> Q2: (a) Accept and record it: arm A sessions ran with the catalog's autonomous-sdlc-harness plugin enabled and its .claude/CLAUDE.md loaded, which is the realistic setup for an agent navigating a harness-adopted repository. Correct the park's description when recording it: the plugin's only hook is a PreToolUse hook matching Bash, which the runner disallows, so no hook fired; the plugin declares no MCP server; the catalog's own harness-docs server in its .mcp.json was kept out by --strict-mcp-config. What the plugin added is its agent, command and skill listings in the system prompt. The plugin is also enabled in the operator's user-level settings, so disabling it in the catalog alone would not have removed it.

**Checked by the writer on resume, as a cross-check only:** the ten files `index-rep1.jsonl` … `index-rep5.jsonl` and `search-rep1.jsonl` … `search-rep5.jsonl` are under `harness-runs/scratch/arm-a/gate10-catalog/`, 69 lines each, 690 in total. The implementer still takes the tree checks in the fourth `**Work:**` bullet — one record per query id — and launcher (e) again.

**How the answer changes the record, where the plan assumed otherwise:**

1. **Window readings are per pair, not per pass.** The operator read the 5-hour and 7-day windows before and after each **repetition pair** (index then search, back to back), not each variant. So the record gives **one row per repetition**: both variants' start–end times, the two window readings for the pair, and the operator time. It never divides a pair's rise between the variants as if it had been measured. The operator's **~63% index / ~37% search** split of rep 1's +15 points is recorded as **the operator's estimate from token usage weighted by relative price**, not as a measured window reading. Record the cache-write figures (3.20 M / 1.70 M in rep 1, ~1.1–1.4 M / ~0.35 M after) the same way, as the operator's observation. The committed transcripts' `usage` blocks are the measured record, and Task 19 computes from them.
2. **The cost checkpoint passed.** Rep 1 rose +15 points on the 5-hour window, and ×5 projected under ~90% for each variant. Reps 2–5 rose +6 each, with the prompt cache warm. There was no stop and no variant is partial: all ten passes are complete. Record that the runs were **strictly sequential, one session at a time**, so `durationMs` is uncontended wall time.
3. **The stamp, once.** Agent CLI `2.1.280` (Claude Code). Model `claude-opus-5-5`, requested as `--model opus`, with every assistant turn of all 690 sessions reporting `claude-opus-5-5`. Host `darwin 24.6.0`, `Mac16,12` (arm64). Date 2026-09-23. The operator checked after every pass that the catalog stayed at `57a6c25` with `docs/` unchanged. The first-record check passed in every file: bare `path#anchor` refs or the bare `none` token, and no code-fence entry. The operator saw only `Read`, `Grep` and `Glob` tool calls. Task 17 still checks every record itself.
4. **What each session loaded (Q2, accepted and recorded, with the operator's correction).** Replace the park's description, which said the plugin's `PreToolUse` hooks were in context. The record states:
   - every arm A session ran with the catalog's `autonomous-sdlc-harness` plugin enabled and its `.claude/CLAUDE.md` loaded, the realistic setup for an agent navigating a harness-adopted repository;
   - the plugin's only hook is a `PreToolUse` hook matching `Bash`, which the runner disallows, so **no hook fired**;
   - the plugin declares **no MCP server**, and `--strict-mcp-config` kept out the catalog's own docs-search server in its `.mcp.json`;
   - what the plugin added to each session was its **agent, command and skill listings in the system prompt**;
   - the plugin is also enabled in the operator's **user-level** settings, so disabling it in the catalog alone would not have removed it.

   The record describes the user-level setting in words and names no path.
5. **Three records with a prose sentence beside `none`** were left verbatim by the operator and must stay verbatim (Task 17 redacts only machine-local paths and identifiers, and repairs nothing):
   - `index-rep2` → `q-g10-vite-health-middleware`
   - `index-rep5` → `q-g10-vite-mock-updated-event`
   - `search-rep5` → `q-g10-neg-android-keystore`

   The run record lists them. Under `score-transcript.mjs`, a `none` among other refs scores as an **answered miss, not an abstention**. The last record is a `far` negative, so it costs A-search one abstention on repetition 5. The first two are positives scored as misses. Take the scoring reading from `score-transcript.mjs` itself, not from this note. If the scorer reads the records differently, record what it does and say that it differs from the operator's reading. Task 19 carries the effect into its figures.

**The hand-off, which the park carries.** From the root of this branch's worktree, the operator creates nothing — the output directory is created by this task — and runs, **repetition 1 of each variant first** (the cost checkpoint):

```
bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant index --index docs/expause-web/INDEX.md --model opus "$HARNESS_EVAL_CORPUS_ROOT" evals/docs-retrieval/queries/gate10-catalog.jsonl harness-runs/scratch/arm-a/gate10-catalog/index-rep1.jsonl
```

```
bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant search --model opus "$HARNESS_EVAL_CORPUS_ROOT" evals/docs-retrieval/queries/gate10-catalog.jsonl harness-runs/scratch/arm-a/gate10-catalog/search-rep1.jsonl
```

then the same two commands with `rep2` … `rep5` in the output name, one output path per repetition. `HARNESS_EVAL_CORPUS_ROOT` must be exported in the operator's own shell. The operator stops after repetition 1 of a variant if its 5-hour-window rise, projected ×5 and spread across windows, cannot stay under ~90% (row 5) — a pause for the reset is not a stop; only a single pass that alone would exceed it is — and reports, per pass: done or stopped; the 5-hour and 7-day window utilisation before and after; the operator time spent; after the first spent query, that the first record's `refs` are bare `path#anchor` strings with no code-fence entry; and once, the output of the agent CLI's `--version`, the model the sessions ran against, and the host (`uname -sr`, the machine).

**Work:**

- [ ] **Find the answer** exactly as Task 15 does: `### Operator answer` above, else an `answer_<n>.md` beside a `question_<n>.md` naming **Task 16** under `harness-runs/clarifications/feat_arm_a_real_catalog_measurement/` or its `answered/`. None → the next two bullets; one → the last two.
- [ ] **Before parking — everything that costs nothing.** (a) The flag spellings: a launcher `harness-runs/scratch/agent-cli-help.mjs`, run with `bash scripts/scratch-run.sh harness-runs/scratch/agent-cli-help.mjs` (a `.mjs`, because `scratch-run.sh`'s `SCRATCH_INTERPRETERS` table omits `.sh` on purpose and refuses a shell probe by name), that calls `execFileSync(process.env.HARNESS_AGENT_CLI ?? 'claude', ['--help'])` with that fixed argument vector — `--help` **and nothing else**, the same fixed-argv pattern (e) uses for `git` — and prints its output; `--help` starts no session and bills nothing, and this is the only agent-CLI invocation the run makes; confirm `-p`, `--output-format` accepting `stream-json`, `--verbose`, `--allowed-tools`, `--disallowed-tools`, `--strict-mcp-config` and `--model`, and correct `run-arm-a.sh` if one differs. (b) The token checks from `run-arm-a.sh`'s `REPRO` block on both task files. (c) The set's ids parse (`loadQueries`). (d) Under `printenv HARNESS_EVAL_CORPUS_ROOT`, with `Read` / `Glob`: `docs/expause-web/INDEX.md` exists; and whether the catalog root carries `CLAUDE.md`, `.claude/`, `.mcp.json` or `.claude/settings*.json` — record which, since a session started there loads its `CLAUDE.md` and `--strict-mcp-config` is what keeps its MCP server out. (e) A launcher that runs `git` in the catalog with a fixed argument vector (`execFileSync('git', ['-C', root, …])`, the root read from `process.env`) printing `rev-parse --short HEAD` and the exit status of `diff --quiet 57a6c25 -- docs` — record the commit and that `docs/` is unchanged. Create `harness-runs/scratch/arm-a/gate10-catalog/` (gitignored by its contents).
- [ ] **Park.** Change no tracked file and return one line: `blocker: operator hand run of arm A owed — task prompt ## Operator checklist row 7 is a mandated mid-run park; run both variants, five repetitions each, per the hand-off in harness-runs/task_plans/feat_arm_a_real_catalog_measurement/task_16_plan.md (also docs/retrieval-eval.md → ## Running arm A by hand), repetition 1 of each first as the cost checkpoint, outputs under harness-runs/scratch/arm-a/gate10-catalog/; report per pass the 5-hour and 7-day window before and after, operator time, and once the CLI version, model and host; flags verified against --help, catalog at <commit>`. It is operator-only and high-stakes (spend), so the orchestrator parks.
- [ ] **On the answer: check it against the tree.** Every transcript the answer reports exists under `harness-runs/scratch/arm-a/gate10-catalog/` with one record per query id of the set (a stopped variant has fewer repetitions — accepted, recorded as partial); the catalog's commit is still the one recorded before the park and `docs/` still matches `57a6c25` (launcher (e) again) — if either moved, stop and return a blocker naming it, because the B–E run must be at the arm A snapshot.
- [ ] **On the answer: record the run.** Rename the heading to `## Arm A — the real-catalog hand run` and replace its body with: what arm A measures (kept from the old text, reworded for two variants); the catalog by commit and size; the date; the host stamp in this tree's shape (`darwin <release>` plus the machine), the agent CLI version and the model; per variant and per pass, done or stopped; the 5-hour and 7-day window utilisation before and after **at the granularity the operator read it** — per repetition pair, per `### Operator answer` item 1 — and the operator time; the cost checkpoint's outcome, **recorded as a cost result** (passed here, per item 2); the flags verified; the catalog-root files found in (d) with what each session loaded, per item 4 (which replaces the park's hook description); the three prose-beside-`none` records, per item 5; and that the figures follow in the next section. Re-point the two citations in `docs/retrieval-eval.md`.

**Verification:**

- Before the park: no tracked file changed (`git status --short` shows nothing outside `harness-runs/scratch/`), and the `--help` script's output was read but not committed.
- After the answer: `git grep -n 'Arm A — awaiting'` returns nothing — the citation in `**The spread is hand-written**` is wrapped across two lines (`## Arm A — awaiting` / `a hand run`), so a one-line grep for the whole heading misses it; search for the wrapped half too. The renamed section and the two re-pointed citations carry the same heading text.
- `bash scripts/check-eval-artifacts.sh` prints nothing, and the renamed section names no path outside this tree and no value of `HARNESS_EVAL_CORPUS_ROOT`.
- The run record states no per-variant window rise as measured. The only per-variant split it carries is rep 1's ~63% / ~37%, labelled as the operator's token-weighted estimate. It names the three prose-beside-`none` record ids, and its account of what each session loaded matches `### Operator answer` item 4 (no hook fired, no plugin MCP server, the catalog's `.mcp.json` server kept out by `--strict-mcp-config`).
