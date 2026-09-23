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

*(Filled in by the task-plan writer when the run resumes from this task's park, from the operator's `answer_<n>.md`, with no machine path. Empty until then.)*

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
- [ ] **On the answer: record the run.** Rename the heading to `## Arm A — the real-catalog hand run` and replace its body with: what arm A measures (kept from the old text, reworded for two variants); the catalog by commit and size; the date; the host stamp in this tree's shape (`darwin <release>` plus the machine), the agent CLI version and the model; per variant and per pass, done or stopped, the 5-hour and 7-day window utilisation before and after, and the operator time; any cost-checkpoint stop, **recorded as a cost result**; the flags verified and the catalog-root files found in (d); and that the figures follow in the next section. Re-point the two citations in `docs/retrieval-eval.md`.

**Verification:**

- Before the park: no tracked file changed (`git status --short` shows nothing outside `harness-runs/scratch/`), and the `--help` script's output was read but not committed.
- After the answer: `git grep -n 'Arm A — awaiting'` returns nothing — the citation in `**The spread is hand-written**` is wrapped across two lines (`## Arm A — awaiting` / `a hand run`), so a one-line grep for the whole heading misses it; search for the wrapped half too. The renamed section and the two re-pointed citations carry the same heading text.
- `bash scripts/check-eval-artifacts.sh` prints nothing, and the renamed section names no path outside this tree and no value of `HARNESS_EVAL_CORPUS_ROOT`.
