### 2. Adopter-facing surfaces say "docs retrieval" where adopters know "RAG"

**Site anchors.** Six surfaces, each verified present in the tree:

| Surface | Anchor |
|---|---|
| `README.md` | the `docs/retrieval.md` pointer line — `docs retrieval: opt-in, local, not yet measured` |
| `plugin/README.md` | the opening paragraph — `the opt-in docs-retrieval verb `docs`` |
| `docs/retrieval.md` | the `# Docs retrieval` title and the `**Who reads this:**` opening paragraph |
| `cli/src/commands/init.ts` | `askRetrieval` → the `question:` string (`'Turn on docs retrieval? It adds a local search tool…'`), and the `docsRetrieval` option row's `summary:` (`'Turn docs retrieval on: a local search tool over the docs and conventions (with --docs)'`) |
| `cli/src/doctor/checks.ts` | the three `title:` strings — `"docs retrieval's libraries resolve"`, `"docs retrieval's models are cached"`, `'the docs-retrieval index builds'` |
| `cli/src/commands/init.ts` | `DOCS_RETRIEVAL_FLAG = '--docs-retrieval'`, the `InitOption` union and the `docsRetrieval` row of `INIT_OPTIONS`, for the `--rag` alias |
| `docs/cli.md` | §7's per-check table — the `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index` rows (the last reads `the docs-retrieval index builds`, the `title:` string verbatim) and the per-check prose paragraphs below it |
| `cli/src/commands/init.ts` | `parseInitFlags` → the refusal whose message reads `needs --docs: retrieval searches the documentation corpus…` (line 839 today, a navigation hint only) |

**Problem.** "Docs retrieval" is this project's own vocabulary, inherited from the docs catalog the feature indexes. The thing it names is a RAG index, and that is the word an adopter arrives with. Every surface a user meets — the README, the plugin README, the design document's opening, the `init` prompt that asks them to spend 300 MB and two model downloads, and the three `doctor` lines that tell them it is broken — asks them to recognise a term they have never seen instead of the one they already know.

**Fix — what to rename.** On each surface above: **"RAG (docs retrieval)" on first mention within that surface, "RAG" afterwards.** A surface is a file for a document, and a single message or prompt string for a CLI string — a `doctor` check title is short enough that "RAG" alone is right once the report's first retrieval line has expanded it, so expand it in the **first** of the three check titles in registration order (`retrieval-dependencies`) and use "RAG" in the other two.

- [ ] `README.md` — the `docs/retrieval.md` pointer line.
- [ ] `plugin/README.md` — the opening paragraph's `opt-in docs-retrieval verb` clause. Keep the verb name `docs` untouched.
- [ ] `docs/retrieval.md` — the `# Docs retrieval` title and the opening `**Who reads this:**` paragraph. The rest of that document is precise-term prose about the implementation and stays as it is.
- [ ] `cli/src/commands/init.ts` — `askRetrieval`'s `question:` string, and the `docsRetrieval` option row's `summary:`.
- [ ] `cli/src/doctor/checks.ts` — the three retrieval check `title:` strings, and any user-facing pass/fail message on those three checks that carries the phrase (e.g. the `RETRIEVAL_OFF` sentence and the `the docs-retrieval index did not build in memory:` messages). Where a message quotes a configuration key it keeps the key verbatim: `docs.retrieval is off (it needs phases.docs and docs.retrieval both true)` is a key sentence and the key spellings in it do not move.
- [ ] `docs/cli.md` §7's **per-check table** — the prose mirror of those same three titles, which this sub-step's rename otherwise leaves on the old wording. The `retrieval-index` row carries the `title:` string verbatim (`the docs-retrieval index builds`); the `retrieval-dependencies` and `retrieval-model-cache` rows paraphrase it (`the docs-retrieval launcher`, `every model file docs retrieval loads offline`). Bring all three rows along with the titles, and bring the same term in that section's per-check prose paragraphs below the table with them. Check ids stay exactly as they are (see *what must NOT be renamed*).

**Fix — the `--rag` alias.**

- [ ] **The spelling is a named constant, not a literal.** Add a module-level constant beside `DOCS_RETRIEVAL_FLAG` in `cli/src/commands/init.ts` — `DOCS_RETRIEVAL_ALIAS_FLAG = '--rag'` — and read the alias through it everywhere: the `INIT_OPTIONS` row, the parser lookup and the refusal message. **No literal `'--rag'` anywhere in `cli/src`.** This is the same rule that already gives `DOCS_RETRIEVAL_FLAG`, `GIT_INIT_FLAG` and `QA_DRIVER_FLAG` owners in that module: a shared value is imported from its owner rather than retyped, *including in the message that names it to a reader*. The `docs/cli.md` §3 row is prose and is unaffected.

- [ ] **The alias lives on the `INIT_OPTIONS` row — it is not a second accepted-token list.** `INIT_OPTIONS`, frozen by `initOptions()` with its compile-time exhaustiveness check, is the single declaration of the accepted-flag set, and three consumers read it. Carry the alias as a field on the `docsRetrieval` row — add `readonly aliases?: readonly string[]` to **both arms** of the `InitOption` union — and teach each of those three consumers to read it from that same row:
  - `parseInitFlags`'s lookup — today `INIT_OPTIONS.find((candidate) => candidate.flag === name)`; it must match the row's `aliases` as well as its `flag`.
  - the `Options:` row renderer (*"derived from {@link INIT_OPTIONS}"*) — so `--rag` appears in `--help`.
  - the discarded-flag / re-invocation derivation (*"Derived from {@link INIT_OPTIONS} … rather than from a list of its own"*) — so a re-invocation line carries the alias.

  **No accepted flag token is matched anywhere outside `INIT_OPTIONS`.** Adding `--rag` at the parse site alone would be a second list beside the registry: the flag would parse but appear in no `--help` row and no re-invocation line, and the type-level completeness check that makes the table an enforced table rather than a convention would not see it.

- [ ] `DOCS_RETRIEVAL_FLAG` stays `'--docs-retrieval'` as the canonical spelling; the alias is an additional accepted token setting the same `docsRetrieval` key. Both spellings must satisfy the existing refusal in `parseInitFlags` (the `needs --docs` message) — a run passing `--rag` without `--docs` is refused with the same message, and that message names the flag the operator actually typed rather than always the canonical one, so a reader is not told about a flag they did not use.
- [ ] Document the alias in `docs/cli.md` §3's flag table, on the existing `--docs-retrieval` row.
- [ ] Cover it in the CLI test suite alongside the existing `--docs-retrieval` cases.

**Fix — `config`'s help text (decision recorded).** `config --help` carries **no** occurrence of "docs retrieval" or "retrieval" at all — verified by grep over `cli/src/commands/config.ts` → `CONFIG_USAGE`, which names example keys (`defaultBranch`, `commands.test`, `phases.qa`, `qa.portSeed`, `layers`) and never this one. So there is no string on that surface to rename. Treat the observation's "`config`'s help text" as the adopter-facing prose describing the configuration key:

- [ ] `docs/config.md` §5 — the `docs.retrieval` table row, which opens `Turns on docs-catalog retrieval: a local search tool over…`. Rename the prose to "RAG (docs retrieval)" on first mention. **The key name `docs.retrieval` in the row's key column and everywhere it is quoted stays exactly as it is.**

If the user meant something else by "`config`'s help text", this is the one sub-step to redirect.

**Fix — what must NOT be renamed.** No identifier moves. Specifically, leave untouched: the `docs.retrieval` configuration key (schema, `cli/src/config/model.ts`, `cli/src/config/check.ts`, every message that quotes it); the `docs` verb and its subcommands (`docs serve`, `docs index`, `docs search`, `docs fetch-models`); `DOCS_SERVER_NAME = 'harness-docs'`, `SEARCH_TOOL_NAME = 'search_docs'` and `SEARCH_TOOL_PERMISSION = 'mcp__harness-docs__search_docs'`; the check ids `retrieval-dependencies`, `retrieval-model-cache`, `retrieval-index`; `RETRIEVAL_STUB_ENV` and its variable name; the cache path segments `retrieval/runtime` and `retrieval/models`; the script name `docs-search-server.sh`; the index path `<stateDir>/docs_index/`; and every symbol, file and directory name under `cli/src/retrieval/`. Ten agent files under `plugin/` and the two `cli/templates/repo/mcp*.json` templates quote that wire and the code review verified it by re-derivation grep — a rename there breaks the wiring silently.

**Fix — what stays on the precise term.** `ARCHITECTURE.md` and `docs/development.md` keep "docs retrieval" / "docs-retrieval" throughout, unchanged. These are maintainer documents where the precise term is the point.

**Check before finishing.** Re-run the wire grep the code review used: confirm that `docs.retrieval`, `harness-docs`, `search_docs` and `mcp__harness-docs__search_docs` have the same occurrence counts before and after the change, and that `ARCHITECTURE.md` and `docs/development.md` are untouched by this finding's diff.
