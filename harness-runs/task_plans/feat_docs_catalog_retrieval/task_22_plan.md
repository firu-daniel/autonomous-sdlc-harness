### Task 22 — Add hand-run Gate 10 for the real-model smoke check, and list it in `scripts/run-gates.sh`

**Goal:** Document the one real-model smoke check where this repository's other hand-run checks are documented, as a new Gate 10 in `docs/development.md` §5. `scripts/run-gates.sh` then prints it among the gates it cannot run. The gate also settles the three open questions that only a real install can answer: whether the reranker runs, whether `.mcp.json`'s relative launcher path resolves from the session's working directory, and whether an unattended session starts the server without a prompt.

**Depends on:**

- **Task 21:** `docs/retrieval.md` → `## Still open` names those questions and points at this gate, and `## Measured, and how` item (d) holds a placeholder for its results.
- The commands the gate runs, all landed:
  - `npx autonomous-sdlc-harness init --docs --docs-retrieval` (Tasks 11–12), which installs the runtime into `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/runtime` and runs `docs fetch-models`;
  - `docs index` (Task 6), printing `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d>`;
  - `docs search <query>` (Task 7), printing `N. <path>#<anchor> (score 0.000)` lines or `no confident match`;
  - `.mcp.json`'s `harness-docs` server launched as `bash <scriptsDir>/docs-search-server.sh` (Tasks 9–10), and the profile's `enabledMcpjsonServers: ["harness-docs"]` with allow entry `mcp__harness-docs__search_docs` (Task 10);
  - `doctor`'s `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index` (Task 13).

### Targets

- `docs/development.md` — §5's opening count sentences and a new **Gate 10**.
- `scripts/run-gates.sh` — its header comment and the `== gates this script cannot run` list, plus the closing summary line.

**Work:**

- [ ] `docs/development.md` §5: change *"Nine gates."* to *"Ten gates."* and *"Five of the nine run unattended"* to *"Five of the ten"*, and, in the same paragraph, *"prints the remaining four rather than passing over them"* to *"prints the remaining five rather than passing over them"*. Name gate 10 among those `scripts/run-gates.sh` prints rather than runs. Append **Gate 10 — docs retrieval with the real models**, in the existing gates' register: hand-run, against a throwaway repository **outside this checkout**, never a fixture and never this repository, each command run **without a pipe**, needing network access for its first leg only.
- [ ] Gate 10's legs, each command in its own fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*):
  - **(i) Setup.** Run `init --docs --docs-retrieval` in a repository with a `docs/` of a few real documents. Record the elapsed time and the size of the runtime and model directories.
  - **(ii) `doctor`.** All three retrieval checks pass. Then move the model directory aside and `doctor` reports `retrieval-model-cache` and `retrieval-index` failing. Move it back.
  - **(iii) Cold build.** Run `docs index` and record its line and wall time, which is the real-model cold build `docs/retrieval.md` compares against the stub's.
  - **(iv) Search.** Run one query whose answer is a known section and record its first result and score, then one query about nothing in the corpus and record whether it abstains. This is where the reranker is shown to run, and where the provisional threshold's real-model scores come from.
  - **(v) Unattended.** From the repository root, run one headless session under the generated profile with a prompt asking it to call `search_docs`, and record whether the tool was available with no approval prompt and whether the call returned results. That records whether the relative launcher path resolved.
  - **(vi) Platform.** Record the OS, the Node version, and the `claude` version used in leg (v).
- [ ] Gate 10's closing paragraph: where each leg's output is recorded (`docs/retrieval.md` → `## Measured, and how`, item (d)), and that a run which could not execute it says so in its Done summary rather than leaving the placeholder unexplained.
- [ ] `scripts/run-gates.sh`: change the header's *"defines nine gates … reports the four it cannot"* to ten gates and five, and the header sentence three lines below it, *"reading four gates' worth of silence as a pass"*, to *"reading five gates' worth of silence as a pass"*. Add `echo "  10 docs retrieval with the real models, which downloads them and needs a network"` to the hand-run list, and change the closing line to *"gates 5, 7, 8, 9 and 10 remain hand-run"*. Change nothing about which gates run.

**Verification:**

- `bash scripts/run-gates.sh` exits zero with the same automatable checks passing as before, its hand-run list shows gate 10, and its last line names gates 5, 7, 8, 9 and 10.
- `grep -n "^\*\*Gate 10" docs/development.md` returns one line, and every command inside Gate 10 sits in a fenced block.
- `grep -n -E "Nine gates|nine gates|of the nine|remaining four|four gates|the four it cannot|7, 8 and 9 remain" docs/development.md scripts/run-gates.sh` is empty — it catches every stale count this task edits, in §5's paragraph and in the script's header and closing line alike.
- **Record in the Done summary** whether this run executed Gate 10, and its output if it did. An unattended run with no web access cannot run leg (i), and says so.
