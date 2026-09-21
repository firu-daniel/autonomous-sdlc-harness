### 3. Two of the three measurement passes ship with no runnable way to re-run them

**Site.** `docs/retrieval-eval-results.md` → `## Cold build and index size` → the **How to reproduce it** paragraph and its fenced command; `docs/retrieval-eval-results.md` → `## The query-log pass` → **Provenance** and its fenced command; `evals/docs-retrieval/query-log-pass.mjs` → `renderQueryLogSection`, the composed line `bash scripts/scratch-run.sh harness-runs/scratch/<launcher>.mjs`; and `docs/retrieval-eval.md` → `## How to run it`, which owns the procedure and covers `run.mjs` alone.

**The problem.** `evals/docs-retrieval/cold-build.mjs` → `measureColdBuild` and `evals/docs-retrieval/query-log-pass.mjs` → `runQueryLogPass` / `renderQueryLogSection` have **no caller anywhere in the tree** — a grep over every `layers[].path` (`cli`, `plugin`, `.`) returns only their own declarations and prose that names them. By design the caller is a disposable launcher under `harness-runs/scratch/`, which is right; what is missing is the launcher's body, which is the whole of what an operator needs.

`docs/retrieval-eval.md` sets the pattern for the third pass and shows exactly why the other two fall short — it gives `run.mjs`'s launcher verbatim:

```
import { main } from '../../evals/docs-retrieval/run.mjs';
await main();
```

Against that, the two passes ship:

- the cold build: a command naming `harness-runs/scratch/cold-build.mjs`, a file that does not exist and whose two lines are written down nowhere. `measureColdBuild` is not `main`-shaped either — it takes `{ repoRoot, corpus, dataDir }` and returns an object, so the launcher has to resolve the repo root and pick the index directory, and the section's own text says which one was used (`harness-runs/scratch/docs_index/`) without saying how to pass it.
- the query-log pass: a command with a literal `<launcher>` placeholder in it, so not a command at all. `runQueryLogPass` takes the parsed argument surface and its output has to be handed to `renderQueryLogSection` to become the section — two facts an operator can only get by reading the module.

Both sections are stated as reproduction instructions (*"committed so it is re-runnable"*, *"driven through a launcher … that calls it with the eval's own parsed arguments"*), and `harness-runs/lessons.md` → `## Adopter-facing documentation` holds the standing rule that every command a reader is meant to run sits in a fenced block, one command per line. A fenced command naming a file that is not in the tree and is described nowhere does not satisfy it. The consequence is concrete: `docs/development.md` §5 gate 10's leg (iii) is the hand run that is supposed to replace the cold-build extrapolation with a measurement, and the operator who runs it has no committed route to the measurement code this branch wrote for exactly that.

**The fix.** Put both launchers where the third one already is — `docs/retrieval-eval.md` → `## How to run it`, as a new subsection after `### Writing the results, and the corpus that grows when you do` — one fenced block per launcher body and one per command, one command per line:

- [ ] **The cold build.** The launcher body, naming the corpus and the index directory the recorded figures were taken with:

  ```
  import { measureColdBuild } from '../../evals/docs-retrieval/cold-build.mjs';
  import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
  const { repo } = parseArgs([]);
  console.log(JSON.stringify(await measureColdBuild({ repoRoot: repo, corpus: 'self-docs', dataDir: `${repo}/harness-runs/scratch/docs_index` }), null, 2));
  ```

  plus its invocation, and the one-process-per-measurement rule the module's header states (a second `resolveModels` in one process times a load that already happened).

- [ ] **The query-log pass.** The launcher body that drives it and renders the section:

  ```
  import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
  import { renderQueryLogSection, runQueryLogPass } from '../../evals/docs-retrieval/query-log-pass.mjs';
  console.log(renderQueryLogSection(await runQueryLogPass(parseArgs(['--corpus', 'self-docs']))));
  ```

  plus its invocation, and the sentence that its output is pasted below the end marker rather than inside the generated region.

- [ ] In `evals/docs-retrieval/query-log-pass.mjs` → `renderQueryLogSection`, replace the `<launcher>.mjs` placeholder with the named path the new subsection uses (`harness-runs/scratch/query-log-pass.mjs`) and add one sentence pointing at `docs/retrieval-eval.md` → the new heading for the launcher's body, so a regenerated section keeps carrying a real command.
- [ ] In `docs/retrieval-eval-results.md`, repoint both reproduction paragraphs at that heading — the cold-build one to the named launcher, the query-log one in place of its placeholder command.
