### Task 3 — Add a `corpus-at` bridge sub-command and a symlink corpus parity case

**Goal:** Prove the two backends agree on the symlink routes. Compare Python's `corpus_files` against the **running** TypeScript `corpusFiles` over one fixture that exercises every route both Task 1 and Task 2 changed. The comparison goes through the suite's one bridge, never through a copy of the TypeScript logic. The existing eval-corpus parity cases must still agree.

**Depends on:** Tasks 1 and 2.

- **Task 1** produces `corpusFiles(repoRoot: string, config: HarnessConfig): CorpusFiles`, compiled to `cli/dist/retrieval/corpus.js` and returning `{ files, warnings }`. `files` is repo-relative lexical paths, and `warnings` is in the order the story index's `## Context` fixes: `docs.root` warnings, then the sorted `docs.root file <rel> resolves outside the repository and was skipped` lines, then conventions warnings in layer order.
- **Task 2** produces `corpus_files(repo_root: str, config: Mapping[str, Any]) -> CorpusFiles`, with `.files` / `.warnings` tuples in that same order.

This task adds no corpus logic on either side and edits neither module. It only asks both and compares.

**Conventions to hold the bridge to.** `docs-retrieval-service/tests/ts_bridge.mjs`'s header rule: *"it answers from the running TypeScript code and never from a copy of it"*, with exactly one JSON document on stdout and a failure on stderr with a non-zero exit. `docs-retrieval-service/tests/ts_bridge.py`'s header rule: a missing build fails the case rather than skipping it.

### Targets

- `docs-retrieval-service/tests/ts_bridge.mjs`: the `corpus-at` sub-command.
- `docs-retrieval-service/tests/test_chunk_parity.py`: the symlink corpus parity case.

**Work:**

- [ ] **`corpus-at`** (`ts_bridge.mjs`). Add a sub-command `corpus-at <repoRoot> (stdin)`. It reads one JSON config from stdin through the existing `readStdinJson`, calls the already-imported `corpusFiles(repoRoot, config)` with `repoRoot` **exactly as given**, with no `resolve` and no `realpath`, so an alias spelling reaches the TypeScript unchanged, and returns `{ files, warnings }`. A missing `<repoRoot>` throws `corpus-at needs <repoRoot>`. Add its line to the header's sub-command list, its `case` to `answer`, and its name to the `default` branch's `expected …` list.
- [ ] **The parity case** (`test_chunk_parity.py`). Add a case, for example `test_symlinked_corpus_matches_typescript(tmp_path)`. It builds one repository under `tmp_path` holding: a plain `docs/real.md`; `docs/inside.md` linked to an in-repository file; `docs/B.md` and `docs/z.md` linked to files outside the repository; a dangling `docs/dangling.md`; a symlinked directory under `docs/`; one conventions document linked outside; and one linked inside. It also builds an alias symlink to the repository directory. For **both** spellings of the root, the real path and the alias, it calls `run_bridge("corpus-at", root, stdin=config)` and `corpus_files(root, config)`, then asserts `list(py.files) == answer["files"]` and `list(py.warnings) == answer["warnings"]`. It also asserts that the TypeScript answer carries at least one `docs.root file` warning and one conventions `resolves outside` warning. Without that, a fixture that silently stopped exercising the routes would pass as two empty lists agreeing.
- [ ] **The file's header** (`test_chunk_parity.py`). Extend the opening rule to say it also covers a symlinked fixture corpus built under the system temp directory, never inside this checkout, on which both backends must enumerate the same files with the same warnings in the same order. Leave the eval-corpus case `test_chunks_match_typescript` and its `CORPORA` unchanged.

**Verification:**

- Build first with `npm run build` (the configured `commands.build`), because the bridge reads `cli/dist` and Task 1's change must be compiled into it. Then `tests/test_chunk_parity.py` passes, run through `bash scripts/python-service.sh test tests/test_chunk_parity.py` as one plain foreground command from the repository root. Both the existing eval-corpus cases and the new symlink case pass in that one run.
- `node docs-retrieval-service/tests/ts_bridge.mjs corpus-at` with no root writes `ts_bridge: corpus-at needs <repoRoot>` to stderr and exits non-zero.
- The new case contains no expected warning text of its own beyond the two route-presence checks. The equality is with the TypeScript answer, so a wording change on one side fails the case.
- **Deviations from plan:** The `tests/test_chunk_parity.py` run was not executed. `bash scripts/python-service.sh test tests/test_chunk_parity.py` exited 3 with `python-service: not provisioned: no synced environment at /Users/daniel/.cache/harness-docs-retrieval/venvs/227539081; run bash scripts/python-service.sh sync`. Provisioning was not attempted: `sync` installs packages over the network into `~/.cache`, which is outside this run's write allowlist. A fallback probe, `bash scripts/scratch-run.sh harness-runs/scratch/task3_symlink_parity_probe.py`, rebuilt the same fixture and compared `corpus_files` with `corpus-at`. It failed before comparing anything because the scratch runner's `python3` is older than 3.10: `jscompat.py` `utf16_slice` raised `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`. So the claim that the new case and the existing eval-corpus cases pass rests only on reading the code. It needs a provisioned `python-service.sh` run, either the Run gates phase's or a hand run after `sync`. These verifications were executed: `npm run build` (exit 0); `bash scripts/typecheck.sh` (`PASS: typecheck`); and `node docs-retrieval-service/tests/ts_bridge.mjs corpus-at` with no root, which printed `ts_bridge: corpus-at needs <repoRoot>` and exited 1.
