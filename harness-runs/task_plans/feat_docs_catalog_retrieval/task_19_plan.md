### Task 19 — Document the key and the token in `docs/config.md`, and retrieval in `docs/cli.md`'s `init` sections

**Goal:** Document the new key and the new plugin token in `docs/config.md`, and in `docs/cli.md`'s `init` sections, the new flag, the question, the setup step and what a re-run does to each retrieval artifact.

**Depends on:**

- **Task 18:** the schema's `docs.retrieval` (boolean, default `false`, legal only while `phases.docs` is `true`), whose description this row condenses.
- **Task 11:** `init --docs-retrieval`. It is a switch, refused without `--docs` with `init: --docs-retrieval needs --docs: …`. The prompt is asked only when the docs phase is on in a generated config, the flag was absent and both descriptors are a TTY, and its default is no. On yes it writes `docs.retrieval: true`, and an unasked run notes `docs retrieval stays off: this run could not ask`.
- **Task 12:** after the plan is applied, when retrieval is on, `init` installs `autonomous-sdlc-harness@<own version>` plus the optional peers with `npm install --prefix <runtime>`. The runtime is `<machineCacheDir>/retrieval/runtime`, where `machineCacheDir` is `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness`. It then runs `docs fetch-models` into `<machineCacheDir>/retrieval/models`. Each step is skipped when already satisfied, and is a note only under `--dry-run`. A failure is a warning, and the adoption still completes.
- **Task 10:** the wiring written under `retrievalApplies`. `.mcp.json` gains `harness-docs` (`merge-json`), and is now written when `browserWiringApplies` **or** `retrievalApplies` holds, so a mobile-driver adopter with retrieval on gets a `.mcp.json` holding only `harness-docs`. The permission profile merges `settings.autonomous.retrieval.json`, whose `enabledMcpjsonServers` holds `harness-docs` and whose allow entry is `mcp__harness-docs__search_docs` (`create-if-absent`, so turning retrieval on later needs `init --force`). The managed ignore block gains `<stateDir>/docs_index/`.
- **Tasks 15–16:** the plugin token `<docs_retrieval>`, a config value read from `docs.retrieval` only when `phases.docs` is true.

**This task owns `docs/cli.md` for this branch.** Task 20 adds the `docs` verb section and the `doctor` rows after it, and depends on this task.

### Targets

- `docs/config.md` — §4 (a `<docs_retrieval>` row) and §5 (a `docs.retrieval` row).
- `docs/cli.md` — §2 (the flag table, `### The interaction rule`, `### Generator order, and why it is load-bearing`), §3 (the re-run contract, including the existing `.mcp.json` row's condition; story index `## Scope register` row 69) and §6 (the paragraph opening *"Both conditions are the gate, and the repository's `.mcp.json` (§3) is gated on the same one, in the same run"*; row 70).

**Work:**

- [ ] `docs/config.md` §4: add `` | `<docs_retrieval>` | config value | `docs.retrieval` (read only when `phases.docs` is true) | `` directly after the `<docs_root>` row.
- [ ] `docs/config.md` §5: add a `docs.retrieval` row after `docs.root`, with type `boolean` and default `false`. Its Meaning cell says four things. What it turns on: the local search tool over `docs.root` and the conventions documents, served over MCP to the ten plan-writer and reviewer agents. That it is legal only with `phases.docs` true, and that the schema, `config set` and `doctor` all refuse it otherwise. That it is off by default and opt-in, and **not yet measured** against index-first navigation, the eval being the follow-up branch `feat_docs_retrieval_eval`. And that turning it on after adoption needs a configuration change and a forced re-run, because the permission profile is create-if-absent, with a pointer to the fenced block in [`cli.md`](cli.md) §2 `### The interaction rule` that holds the two commands. **The cell names no command inline**: a table cell cannot hold a fenced block, and `harness-runs/lessons.md` → *Adopter-facing documentation* forbids an inline command or two joined with prose. Point to `retrieval.md` for the design. Cite the roadmap row by its title, *Docs-catalog retrieval*, never by an item number.
- [ ] `docs/cli.md` §2: add the `--docs-retrieval` flag row, in the table's existing shape and in the `--help` order (after `--docs-root`). In `### The interaction rule`, add the retrieval question to the enumerated questions with its flag, its default (off) and its gate (docs phase on, generated config). Directly after it, add one sentence saying how to turn retrieval on after adoption (a configuration change, then a forced re-run, because the permission profile is create-if-absent) followed by this fenced block, one command per line, which `docs/config.md` §5's `docs.retrieval` cell points to:

  ```bash
  npx autonomous-sdlc-harness config set docs.retrieval true
  npx autonomous-sdlc-harness init --force
  ```

  In `### Generator order, and why it is load-bearing`, add the post-plan retrieval setup step and why it follows the plan and precedes the adoption commit. Write the commands an adopter runs in fenced blocks, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*).
- [ ] `docs/cli.md` §3 and §6.
  - §3: **correct the existing `.mcp.json` row's condition** rather than adding a second `.mcp.json` row beside it. Today it reads *"written when the QA phase is on **and** its `qa.driver` is `web-playwright`, and never for a mobile driver — §6"*, which Task 10 makes false: with a mobile driver and retrieval on, the file is written. The condition names both halves: the browser servers when the QA phase is on with `web-playwright`, and `harness-docs` when `phases.docs` and `docs.retrieval` are both true; with neither, no file. Then add the other retrieval artifacts to the re-run contract: the profile's retrieval half (`create-if-absent`, with `--force` after a `.bak`) and the ignore rule (`merge-lines`).
  - §6: restate the paragraph opening *"Both conditions are the gate, and the repository's `.mcp.json` (§3) is gated on the same one, in the same run"* for both halves. The browser half keeps its gate and its mobile-driver reasoning, but the sentence no longer says `.mcp.json` is not written for a mobile driver: it says no **browser** block is. Add the retrieval half in the same register: `retrievalApplies` gates both the `harness-docs` entry in `.mcp.json` and the retrieval profile fragment (`settings.autonomous.retrieval.json`), in the same run, and gating one side alone is the same un-loaded-tool stall, so the two move together; turning retrieval on later is the configuration change plus `init --force` shown in §2's fenced block (link to it, never inline). Leave the rest of the paragraph (the `phases.qa` / `qa.driver` asymmetry, the `.bak` sentence) unchanged.
  - §3, after those artifacts: add a sentence that the runtime directory and model cache are **machine state outside the write engine**, written by `npm` and the model library at setup time and skipped when already satisfied, and that the per-checkout index is a derived, uncommitted cache that no `init` run writes.

**Verification:**

- `grep -n "docs.retrieval" docs/config.md docs/cli.md` shows the §5 row, the §2 flag row, the §3 re-run entries and the §6 paragraph, and `grep -n "docs_retrieval" docs/config.md` shows the §4 row.
- `grep -rn -E "items? [0-9]+" docs/config.md docs/cli.md` reports no line this task added (`docs/development.md` → `## 6. The roadmap this tree defers to`).
- `git diff -U0 docs/config.md | grep -E "^\+.*(config set|init --force)"` is empty: no command is inline in the new `docs/config.md` text. The two commands appear only inside the fenced block in `docs/cli.md` §2, each on its own line, and the §5 cell links to it.
- Every flag spelled in the new text matches `node cli/dist/cli.js init --help` byte for byte.
- Re-run the story index's widened derivation entry 7 against this file: `git grep -n -i -E "no MCP server|authors? no MCP|publishes none|consumption surface|carries an .mcp__. name|declared in one template|never for a mobile driver|gated on the same one|\.mcp\.json.{0,80}(written when|gated on|only when)" -- docs/cli.md`. Every hit is a line whose text names the retrieval half alongside the browser half (the §3 row, the §6 paragraph), or the §7 *"No MCP server is started"* line (register row 67); no hit still says `.mcp.json` is never written for a mobile driver.
