### 4. `## Running arm A by hand` still says the runner "has never been run"

**File:** `docs/retrieval-eval.md` → `## Running arm A by hand`, the paragraph after the `claude --help` block ("The script carries them as the documented surface and **has never been run**, so a renamed flag shows").

**Problem.** The operator has now run `evals/docs-retrieval/arm-a/run-arm-a.sh` for ten passes, 690 sessions. Before that, all seven flags were confirmed against Claude Code `2.1.280`'s `--help`. `docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand run` records both, under **The run.** and **Flags verified before any token was spent.** This branch removed the matching "THE FLAG SPELLINGS HERE HAVE NEVER BEEN EXERCISED" sentence from the script's own header, but left this sentence in the procedure document. That makes the procedure document the one place that still describes the mechanism as untried. The task prompt's `## What to deliver` and the story's Task 25 exist to correct statements the run made false, and scope derivation entry A (`git grep … 'never been run'`) reaches this line.

**Fix.**

- [ ] Replace the sentence `The script carries them as the documented surface and **has never been run**, so a renamed flag shows up as a failed first query rather than as a refusal.` with:

  ```markdown
  The script carries them as the documented surface. They were confirmed against Claude Code `2.1.280`'s own
  `--help` before the real-catalog run (`docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand
  run`), and a flag renamed in a later version still shows up as a failed first query rather than as a
  refusal.
  ```

  Wrap the text to match the surrounding paragraph. Leave the rest of the paragraph ("Then the checks the script's own `REPRO` header…") unchanged.
