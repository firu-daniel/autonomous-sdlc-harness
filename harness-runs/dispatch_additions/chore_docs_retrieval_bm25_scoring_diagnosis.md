# Dispatch additions — chore_docs_retrieval_bm25_scoring_diagnosis

## [A · Task 4 · general · iter 0] → layer-implementer  (#7)
- **added:** `context_notes:` (relayed mid-dispatch by SendMessage, after the user asked whether the agent was stuck)
- **verbatim:** context_notes: harness-runs/scratch/bm25-history/t4-postgres-self-docs.out ends in "RangeError: Maximum call stack size exceeded" at renderBm25States (evals/docs-retrieval/bm25-history.mjs:1015, the lines.push(...scoreLines(...)) spread), raised from runBm25HistoryLauncher (bm25-history.mjs:1116) — no t4-postgres-self-docs.txt capture was written. The PGlite self-docs --repeat 30 run (pid 90320) started 13:23 and is at ~100% CPU, ~9.5 min elapsed, with an empty .out so far. Source: ps output and that .out file.
- **why the agent could not derive it:** the agent was blocked waiting on its own background runs; the crash sat only in a gitignored scratch `.out` file and the process table, neither of which reached it while it waited
