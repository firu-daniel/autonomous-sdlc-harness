### 2. The author's machine name is written into three committed documents, and three modules keep putting it back

**Site.** `evals/docs-retrieval/run.mjs` → `runEval`, the line `host: hostname(),` (four lines below the comment that forbids exactly this); `evals/docs-retrieval/cold-build.mjs` → `measureColdBuild`, `host: hostname(),`; `evals/docs-retrieval/query-log-pass.mjs` → `runQueryLogPass`, `host: hostname(),`; and the eight rendered sites — `docs/retrieval.md` → `## Measured, and how` item (d) (*"host `Daniels-MacBook-Air.local`"*), `docs/retrieval-eval-results.md` at the `- Host …` provenance line and the `"host":` key of both corpus blocks, plus `## Threshold calibration` → *"What it was calibrated on"*, `## Cold build and index size` → *"What these figures do not settle"*, and `## The query-log pass` → *"Provenance"*.

**The problem.** `Daniels-MacBook-Air.local` is the name of the machine the branch was run on, carrying its owner's given name, and this repository publishes to a public `main`. It appears nowhere else in the tree: every other measured fact in the corpus records the platform and the runtime instead — *"macOS, Node v20.19.5"* in `docs/retrieval.md` items (a), (b) and (c), *"macOS, Node v20.19.5, 2026-09-17"* beside the stub cold build — and this branch is the first thing to record a hostname at all.

`evals/docs-retrieval/run.mjs` states the rule against itself four lines earlier, where it makes the query-set path repo-relative:

```js
// Repo-relative, because the rendered provenance is committed and nothing in this tree may
// name a location on the machine that wrote it (`scripts/run-gates.sh` gate 6a).
path: relative(options.repo, options.queries).split(sep).join('/'),
...
host: hostname(),
```

Gate 6a cannot catch it: that gate greps for the expanded `$HOME` (`docs/development.md` → `## 5. Verifying a change` → **Gate 6 — self-containment**), and a hostname is not a path, so the sweep is green while the tree names the machine. The hostname also buys the record nothing the platform would not: none of the three sections draws an inference from *which* laptop it was, and each already carries the Node version and the date.

Left as it is, the three modules reproduce it on every future run, including a run in an adopter's checkout, so the next regeneration re-commits a hostname whoever ran it never chose to publish.

**The fix.**

- [ ] In all three modules, replace `hostname()` with the platform pair the rest of the corpus records. In each file swap the import — `import { platform, release } from 'node:os';` in `run.mjs` and `cold-build.mjs` (both currently import `hostname` alone; `query-log-pass.mjs` imports `hostname, tmpdir`, so keep `tmpdir`) — and set the field to `host: \`${platform()} ${release()}\`,`. Keeping the key name `host` leaves `evals/docs-retrieval/results.mjs` → `provenanceSection` / `machineSection` and `renderQueryLogSection`'s `Host \`${result.host}\`` untouched, so no renderer changes.
- [ ] Hand-edit the eight committed sites to the same value, `darwin 24.6.0` (this host's `os.platform()`/`os.release()`), leaving every other byte alone: the one prose line in `docs/retrieval.md` item (d), the three hand-written sections of `docs/retrieval-eval-results.md`, and the four in-region sites — the `- Host …` line and the `"host":` value of each corpus block.
- [ ] Do **not** fix the in-region sites by re-running with `--out`. The `self-docs` corpus has moved since the region was generated — a run today stamps `{ files: 14, chunks: 194 }` against the recorded `{ files: 13, chunks: 177 }`, because this branch's own two documents joined the corpus — so a regeneration would replace every published figure with numbers taken over a different corpus, which is the one thing the file's own stamp rule forbids reading as a before/after. Editing the single `host` field inside the region is safe on the file's own terms: the region has one writer and the next `--out` run rewrites it wholesale anyway, and after this fix that run writes the platform string.
