## [A · Task 10 · implement] dispatch 39/800 → layer-implementer (iter 0)
- **added:** outside the sanctioned form
- **verbatim:** 📌 Operator note: the hand-run measurement session and both agent sessions are complete. Every capture is under harness-runs/scratch/backend-comparison/ (host.txt, results.md with the four blocks, mcp-typescript.txt, mcp-python.txt, footprint.txt, agent-session-python.jsonl, agent-session-typescript.jsonl, agent-session.md, plus agent-session-typescript.failed.jsonl from a first TypeScript attempt whose cause agent-session.md records — that one is Task 11's material, not yours). The optional fp32 ONNX export was NOT placed, so the matched-precision leg reports itself unarranged. Do not commit; the orchestrator dispatches the committer.
- **why the agent could not derive it:** the hand run's completion and the failed first TypeScript session happened at the operator's terminal and are recorded in no committed artifact; the captures live under the gitignored harness-runs/scratch/backend-comparison/. "Task 11's material, not yours" and "Do not commit" are scope instructions, not facts — disclosed here as such.

## [A · Task 11 · implement] dispatch 41/800 → layer-implementer (iter 0)
- **added:** outside the sanctioned form
- **verbatim:** 📌 Operator note: every capture is under harness-runs/scratch/backend-comparison/. The TypeScript agent session ran twice: agent-session-typescript.failed.jsonl is the first attempt (harness-docs `failed`), and agent-session.md records its cause — the machine-wide runtime `init` installed is the published autonomous-sdlc-harness@0.5.0, whose config schema rejects `docs.retrievalBackend` as an unknown key, so after `config set docs.retrievalBackend typescript` the TypeScript server refused to start; the second attempt deleted the key by hand. Record that as observed, from those files; it is not yours to fix. host.txt's uptime line shows a load average of about 1.7–1.9 at the start of the sitting. Do not commit; the orchestrator dispatches the committer.
- **why the agent could not derive it:** the two-attempt history of the TypeScript session is recorded only in the gitignored agent-session.md and the .failed.jsonl stream, whose existence the task file does not name. The load-average sentence restates host.txt, which the agent reads anyway. "Record that as observed …; it is not yours to fix" and "Do not commit" are scope instructions, not facts — disclosed here as such.

## [A · Task 12 · implement] dispatch 43/800 → layer-implementer (iter 0)
- **added:** outside the sanctioned form
- **verbatim:** Do not commit; the orchestrator dispatches the committer.
- **why the agent could not derive it:** n/a — a restatement of the implementer's own contract, which the unit loop already gives it; added without need.

## [A2 · Item 2 · general · iter 0] → layer-implementer  (#49)
- **added:** `context_notes:`
- **verbatim:** context_notes: Finding 3's fix (commit ae39230) left out finding_3.md's conditional clause naming `python-backend.mjs` as the owner of `COMPOSE_DIR`/`POSTGRES_SERVICE`, because Finding 2 had not landed; its implementer reported the clause as still owed once it does (source: ae39230's diff of evals/docs-retrieval/python-backend.mjs against finding_3.md).
- **why the agent could not derive it:** the omission was reported only in the Finding 3 implementer's return to the orchestrator; neither finding_2.md nor the architecture-review index records that a clause of finding_3.md was deferred to Finding 2.
