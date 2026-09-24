### Task 4 — List the decision record in `README.md`'s reference documents and in `llms.txt`

**Goal:** The two lists that enumerate every document under `docs/` also list the new decision record. Without it, a reader of either list would never find the reasoning behind the withdrawn roadmap row.

**Depends on:** Task 1, which creates **and commits** `docs/second-runtime-port-decision.md`. The commit matters here. `scripts/check-llms-txt.sh` (gate 6c) accepts an `llms.txt` target only when the path is **tracked**, meaning it is in the index, so this task can ship only after Task 1's commit. Both lists link to that exact path.

### Targets

- `README.md`: the reference-documents bullet list, the one containing the `docs/typecheck-key-decision.md` bullet.
- `llms.txt` → `## Where to read more`: the list containing the `docs/typecheck-key-decision.md` line.

**Work:**

- [ ] `README.md`: add one bullet directly after the `docs/typecheck-key-decision.md` bullet, in the list's existing shape, `` - [`docs/<file>`](docs/<file>) — <what it owns> ``. For example: *"[`docs/second-runtime-port-decision.md`](docs/second-runtime-port-decision.md) — why the second-runtime reference port was withdrawn: the planning loop as a graph the orchestrator already walks, the frameworks considered, the checkpointer and cost reasoning, and the maintainer's arguments."* Leave the **Claude-bound today** bullet unchanged, because it still reads true.
- [ ] `llms.txt`: add one line directly after the `docs/typecheck-key-decision.md` line, in that list's shape, `- [docs/<file>](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/<file>): <what it owns>.`. The target must be exactly `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/second-runtime-port-decision.md`, with no `#` and no `?`, as `scripts/check-llms-txt.sh` → `THE CONTRACT` points 3–4 require. Use a one-clause description parallel to the `README.md` bullet.

**Verification:**

- `bash scripts/check-llms-txt.sh` exits 0.
- `git grep -ln "docs/second-runtime-port-decision.md" -- README.md llms.txt` prints both files.
- The acceptance grep from the task prompt, run verbatim from the checkout root: `grep -rn -i "second-runtime\|reference port\|langgraph\|langchain" --exclude-dir=node_modules --exclude-dir=harness-runs --exclude-dir=.git .`. Every hit is a site in the story index's `## Scope register`, and no hit describes the item as planned. The new `README.md` and `llms.txt` lines are expected to match through the filename. They describe the record, not a planned item.
- `bash scripts/run-gates.sh`, run without a pipe, is the branch's closing check (acceptance 4). Each `FAIL` line must be a gate whose printed output names no file this branch changed. Gate 6a is red by design in a self-adopted checkout, and gate 1 is `BLOCKED` when `claude` is not on `PATH`. Gate 6c must be `ok`.
