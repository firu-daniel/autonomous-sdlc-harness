### Task 9 — Give arm A its two variants: the `{{index}}` token, `agent-task-search.md`, and a runner that records tool calls

**Goal:** Make arm A reach a catalog other than `fixture-catalog` in both variants — **A-index**, pointed at an index that may sit anywhere in the catalog, and **A-search**, given a task text that names no index — with the task text files, the substitution in `run-arm-a.sh` and the token-count check moving together, the `fixture-catalog` invocation keeping its three-argument shape byte for byte, and each transcript record carrying enough to say afterwards whether A-index grepped and whether any session used a tool outside the fence.

**The choice, and why (task prompt `## What blocks it today` item 2 asks for it to be argued).** The two needs differ in kind, so each gets the mechanism that fits it. **Where the index is** is a per-catalog *value* — `docs/INDEX.md` in the fixture, `docs/expause-web/INDEX.md` in the real catalog — so it becomes a **second token**, `{{index}}`, in `agent-task.md`, substituted from a runner argument that defaults to `docs/INDEX.md`. **Whether an index is named at all** is a different *instruction*, so A-search gets a **second task file**, `agent-task-search.md`, byte-identical to `agent-task.md` except for its opening comment and the one navigation paragraph — which keeps every word each variant's agent reads reviewable as committed text, and keeps the runner from composing prose. No path is smuggled in by editing the prose around a token.

**Where this task stops.** It changes the mechanism and its own header; the operator-facing procedure in `docs/retrieval-eval.md` → `## Running arm A by hand` is **Task 10's**, and the flag spellings are verified against the agent CLI's own `--help` by **Task 16**, before the operator spends anything. This task runs no agent.

### Targets

- `evals/docs-retrieval/arm-a/agent-task.md` — the `{{index}}` token and its opening comment.
- `evals/docs-retrieval/arm-a/agent-task-search.md` (new).
- `evals/docs-retrieval/arm-a/run-arm-a.sh` — options, the in-script token check, the event-stream parse, and its header and `REPRO` block.
- `evals/docs-retrieval/README.md` — the `arm-a/agent-task.md` and `arm-a/run-arm-a.sh` rows, and a row for `arm-a/agent-task-search.md`.

**The runner contract this task produces, which Tasks 10, 16 and 17 rely on:**

```
run-arm-a.sh [--variant index|search] [--index <path>] [--model <name>] <corpus-root> <query-set.jsonl> <out.jsonl>
```

- No option → `--variant index --index docs/INDEX.md` and no `--model` passed to the agent: **the fixture invocation of today, unchanged**. `--index` is refused with `--variant search`. Unknown option → the usage line and exit 64.
- Pre-flight, before any agent call: the selected task file holds exactly one `{{query}}`; `agent-task.md` holds exactly one `{{index}}` and `agent-task-search.md` none — otherwise exit 65 naming the file and the count; with `--variant index`, `<corpus-root>/<index>` must exist — otherwise exit 66.
- Substitution: `{{index}}` first, then `{{query}}` last, each with bash's own `${var//pattern/replacement}` as today, so a query containing a literal doubled-brace word is never read as a token.
- The agent is invoked with `--output-format stream-json --verbose`, the unchanged `--allowed-tools "$ALLOWED_TOOLS"` / `--disallowed-tools "$DISALLOWED_TOOLS"` pair, **`--strict-mcp-config`** (so no MCP server — in particular a corpus's own docs-search server — loads in the session), and `--model <name>` when given. `ALLOWED_TOOLS` and `DISALLOWED_TOOLS` stay identical for both variants.
- Each record appended is `{ id, query, refs, durationMs, usage, variant, toolCalls }`: `refs`, `durationMs` and `usage` exactly as today but taken from the stream's final `type == "result"` event (`.result`, `.usage`); `variant` the option's value; `toolCalls` an object counting `tool_use` content blocks by `name` across the stream's `type == "assistant"` events (`{}` when none). Nothing else from the stream is kept — in particular no tool input, which carries absolute paths.

**Work:**

- [ ] `agent-task.md`: replace the one hard-coded `docs/INDEX.md` in *"Read `docs/INDEX.md` first."* with the `{{index}}` token; rewrite the opening comment's token paragraph to say the file carries **two** tokens — the one below *"The question:"* and the one naming the index — each checked to occur exactly once, still without writing a doubled brace in the comment itself. Nothing else in the file changes.
- [ ] `agent-task-search.md`: a copy of `agent-task.md` whose navigation paragraph instead says the catalog is the set of Markdown documents under the working directory, that no index is given, and that the agent finds the sections that answer the question with its read-only tools; its opening comment states it is the A-search task text, why it is not named `prompt.md` (the same reason `agent-task.md` gives, cited rather than restated), and that it carries exactly one token. Every other line is byte-identical to `agent-task.md`.
- [ ] `run-arm-a.sh`: the options, pre-flight, substitution, invocation and record shape above, within the `bash` 3.2 floor and `jq` 1.5. Rewrite the header's **HAND-RUN ONLY, AND NOT RUN ON THE BRANCH THAT ADDED IT** paragraph to keep the prohibition (no agent grant, no `scratch-run.sh` route) while no longer claiming the script has never run, and state why `--strict-mcp-config` and `toolCalls` exist.
- [ ] `run-arm-a.sh` `REPRO` block: the token checks for both files (`grep -c` for each token in each file, with the expected counts), the index check for the index variant, the unchanged fixture command, and one real-catalog command per variant written with `"$HARNESS_EVAL_CORPUS_ROOT"` as the corpus root — never a literal path.
- [ ] `evals/docs-retrieval/README.md`: edit the two existing `arm-a/` rows to name the variants and add the `agent-task-search.md` row; no other row.

**Verification:**

- `diff evals/docs-retrieval/arm-a/agent-task.md evals/docs-retrieval/arm-a/agent-task-search.md` shows only the opening comment and the navigation paragraph.
- `grep -c '{{query}}'` is `1` on both files; `grep -c '{{index}}'` is `1` on `agent-task.md` and `0` on `agent-task-search.md`.
- Every `REPRO` check that invokes no agent runs as documented. The script's argument parsing and pre-flight are exercised **without an agent** by pointing `HARNESS_AGENT_CLI` at a scratch stand-in under `harness-runs/scratch/` that prints a fixed two-event stream (one `assistant` event with a `Grep` and a `Read` `tool_use`, one `result` event) through `bash scripts/scratch-run.sh` on a scratch driver `harness-runs/scratch/<driver>.mjs` — a `.mjs` (or another extension in `scratch-run.sh`'s `SCRATCH_INTERPRETERS` table, which refuses `.sh` by name) that spawns `bash evals/docs-retrieval/arm-a/run-arm-a.sh …` with a fixed argument vector per case and `HARNESS_AGENT_CLI` set to the stand-in's path in the child's environment; the stand-in itself is executed by `run-arm-a.sh`, not by `scratch-run.sh`, so it may be a shell script: the three-argument fixture form writes a record with `variant: "index"` and `toolCalls: { "Grep": 1, "Read": 1 }`; `--variant search --index x` exits 64; a scratch task file with two `{{query}}` tokens exits 65. The stand-in never invokes the real agent CLI, and the driver sets `HARNESS_AGENT_CLI` to the stand-in's path itself, so no agent binary is reachable from it: this exercises the script's plumbing, not the arm, and is not the `scratch-run.sh` route to a session the header refuses.
- `score-transcript.mjs` scores a record carrying `variant` and `toolCalls` exactly as one without them (it reads `id`, `refs`, `durationMs`, `usage`).
