### 4. Gate 10 measures no real-catalog retrieval cost

**Site anchors.**
- `docs/development.md` → **Gate 10 — docs retrieval with the real models**, its lead paragraph (`Run it against a throwaway git repository **outside this checkout** holding a `docs/` of a few real documents…`) and leg **(iii) Cold build**.
- `docs/retrieval.md` → `**Why `setup-worktree.sh` does not warm the index.**` — the paragraph that cites `967 to 1372 ms`.

**Problem.** The only cold-build figure this branch carries is a **stub** build over the suite's fixture corpus: 3 files, 9 chunks, roughly 500 bytes, timed at 967–1372 ms. That number measures Node process start-up and PGlite start-up and essentially nothing else — no model load, no embedding of any real volume, no index growth. And `docs/retrieval.md` → `**Why `setup-worktree.sh` does not warm the index.**` rests a real decision on it: that warming the index at worktree setup is not worth a model load per worktree, with a stated *"revisit this if the real-model cold build on a real catalog is long enough that a first `search_docs` call risks the agent runner's tool-call timeout."* Nothing in the gate suite ever produces the figure that revisit condition is written against.

Gate 10's leg (iii) does time a real-model `docs index` — but the gate specifies its target repository as "a `docs/` of a few real documents", with no corpus-size floor, so the figure it yields is another small-corpus number. And **no** leg records the on-disk size of `<stateDir>/docs_index/`, which is the other half of what the feature costs an adopter.

**Fix.**

- [ ] **Put a corpus-size floor on the gate's target repository.** Amend Gate 10's lead paragraph: the throwaway repository's `docs/` must hold **at least ~1,500 chunks**. State how the runner confirms it — `docs index`'s own summary line reports `<files> files, <chunks> chunks`, so the chunk count is read off leg (iii)'s output and the run is invalid below the floor. Keep every existing constraint on that repository: real documents, never a fixture, never this repository, at least one commit, outside this checkout.

- [ ] **Amend leg (iii) to record the index size on disk.** Beside the existing `time npx autonomous-sdlc-harness docs index`, add the directory measurement, in the same fenced block, one command per line:

  ```
  time npx autonomous-sdlc-harness docs index
  du -sh <stateDir>/docs_index
  ```

  with `<stateDir>` resolved from the target repository's own `harness.config.json`. Record: the `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d>` line, the wall time, and the `du` figure. Keep leg (iii)'s existing note that `doctor`'s `retrieval-index` builds in memory and writes nothing, so this is still the first on-disk build.

- [ ] **State what the cold-build figure settles.** Add a sentence to leg (iii) naming the decision it feeds: this is the real-model cold-build number `docs/retrieval.md` → `**Why `setup-worktree.sh` does not warm the index.**` compares against its stub figure, and the revisit condition that paragraph states — the first `search_docs` call risking the agent runner's tool-call timeout — is judged against it. Leg (iii) already says the first half of that; the revisit condition is the part to add.

- [ ] **Wire the results into where they land.** Gate 10's `**Where the results go.**` paragraph routes every leg's output to `docs/retrieval.md` → `## Measured, and how`, item (d). No change is needed to that routing, but the `du` figure and the chunk count must be named among what item (d) will carry, so a runner does not drop them. Add them to that paragraph's list.

- [ ] **Keep the precise term.** `docs/development.md` is explicitly exempt from Finding 2's rename — every occurrence of "docs retrieval" / "docs-retrieval" in this file stays as it is.
