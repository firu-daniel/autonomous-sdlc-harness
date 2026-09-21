### 5. `--floor` is documented on the entry point that ignores it

**Site.** `evals/docs-retrieval/args.mjs` → `FLAGS`, the row `['--floor <path>', 'the recorded regression floor to grade this run against']`; and `docs/retrieval-eval.md` → `## How to run it` → the flag table row *"`--floor <path>` | The recorded floor to grade this run against — see `## The regression floor`."*

**The problem.** Both statements describe `--floor` as something that grades *this run*, and the flag table sits under the heading whose every other row describes what the launcher over `run.mjs` does. `run.mjs` → `runEval` never reads `options.floor`: the only reader is `evals/docs-retrieval/check-floor.mjs` → `checkFloor`, which builds its own argument vector (`parseArgs(['--corpus', FLOOR_CORPUS, '--arms', letters.join(''), '--floor', floorPath])`) and is reached as a command inside `scripts/run-gates.sh`, never through the launcher.

So an operator who follows `## How to run it`, sees `--floor` in the table beside `--out` and `--k`, and passes it to the launcher gets no grading and no complaint — the flag parses, the value is resolved to an absolute path, and the run prints a table as if the floor had been met. That is the one failure mode the eval otherwise never has: everything else in this surface refuses by name.

The flag legitimately belongs in the shared argument surface, because `check-floor.mjs` uses the same parser. What is wrong is that neither statement of it says which entry point reads it.

**The fix.** Two clauses, no code change:

- [ ] In `evals/docs-retrieval/args.mjs` → `FLAGS`, change the `--floor` help text to name its reader, in the same shape the `--transcript` row already uses to name its own (*"scored by run.mjs and by nothing in this module"*):

  ```js
  ['--floor <path>', 'the recorded regression floor; read by check-floor.mjs alone, not by a run'],
  ```

- [ ] In `docs/retrieval-eval.md` → `## How to run it`, change that table row's text to say the same: *"The recorded floor `evals/docs-retrieval/check-floor.mjs` grades against — read by that module alone and not by a launcher run; see `## The regression floor`."*
