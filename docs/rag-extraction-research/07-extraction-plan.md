# RAG extraction research — how to start RagScene: the extraction plan

**Who reads this:** the maintainer turning the extraction into a GitHub issue, and whoever runs its steps.

**It owns:**
- what moves, stays or is duplicated;
- what the harness needs before `/devscene:analyze`;
- the private-then-squash route;
- the order against the sandbox series, the rename and the open issues;
- a numbered operation plan.

**It does not own:** the engine, lexical, model or shape decisions (`README.md` → `## 5`, `## 3`), or what RagScene builds later (`README.md` → `## 7`).

## How this was researched

**Date and route.** All sources were read on 2026-10-28, the web sources included:
- this repository at `dev` (`0d02ba3e`) and on this branch, through read-only `git log`, `git grep` and `gitleaks`;
- Expause and straightedge, read-only;
- issues #151–#156, #170, #196, #199–#203 and #205, through `gh issue view`;
- name availability on the registries, through read-only HTTP requests.

**Binding rulings** (`_brief.md` → `## Round 3 rulings`):
- **R3.7:** the sandbox series, then the DevScene rename, then RagScene. Nothing for RagScene, `ragscenedev` included, starts earlier.
- **R3.8:** no git history is kept. The private `ragscenedev` moves to the public `firu-daniel/ragscene` as one initial commit at a stable point.

Because the copy is made after the rename, every name here is the post-rename spelling: `devscene.config.json`, `devscene-docs`, `devscene_docs_retrieval`, `DEVSCENE_*`, `/devscene:analyze` (#155, #156).

**Statement kinds**, as in `docs/copilot-foundry-research.md` → `## How this was researched`:
- **Documented:** a URL, a `path:line`, a heading, a commit, an issue or quoted command output states it. Unlabelled sentences in a cited paragraph count as Documented.
- **Inference:** my own conclusion.
- **Unconfirmed:** no checked source states it.

---

## 1. History: copy the files, check them, know what the squash leaves

**What happened last time (Documented, from git).**
- **Expause.** `git log -- autonomous-sdlc-harness/` gives 64 commits:
  - 63 from `88ea6a948` (#232, 2026-08-09) to `570292c83` (#309, 2026-09-08);
  - the removal, `32ed0bf18` (#311, 2026-09-22). Its message: the folder "was a staging area for a product-agnostic extraction", and "the history stays in this repo".
- **This repository** starts with `2c01123c` (2026-09-09), one commit of 350 files.
- **Authorship.** All 142 commits on `dev` have one author, which settles synthesis §8 #23.

**Copying is enough (R3.8).** The history of the moving paths stays public here, so history tools such as `git filter-repo` and `git subtree split` are not needed. The import commit records provenance by naming the harness commit it copies.

**Copy from a commit, never a working tree (Inference).** Use `git archive <sha> -- <paths> | tar -x`. A working tree also holds gitignored files: `.venv/` and the run logs under `harness-runs/autonomous_logs/`.

**Secrets (Documented).**
- **History.** `gitleaks git` over `dev`'s 142 commits finds one hit, the fixture string `N3_TOKEN = 'sbx_n3_fixture'` in `cli/test/sandbox-probe-remote-legs.test.mjs`. It is at line 29 in `504a4df6` and line 30 at the tip, outside the moving set.
- **Working tree.** `gitleaks dir .` over the main checkout's working tree adds two hits, in the gitignored `harness-runs/autonomous_logs/fix_sandbox_probe_round1_findings.stream.jsonl` (`:2524`, `:2533`).
- **All reachable commits.** A pattern scan finds only a placeholder AWS key in a stash commit (`708a7846`), and quoted `BEGIN … PRIVATE KEY` prose in a run artifact.
- **Inference:** the archived set is clean. Rerun the check on `ragscenedev`'s import and again on `ragscene`'s squashed tree.

**What the squash leaves behind (Inference).** `ragscenedev`'s commits, PRs, reviews, closed issues, Actions logs and run artifacts stay in the archived repository. That is the Expause pattern again, this time by choice.

## 2. What moves, what stays, what is duplicated

This refines the cut in `01-current-mechanism.md` → `## 7`. Paths are given as they will stand **after devscene4 and devscene5**. Each path gets one of four verdicts:
- **Moves:** RagScene takes it, and the harness copy is retired later.
- **Duplicated:** both repositories keep a live copy until the harness consumes RagScene.
- **Replaced:** RagScene writes its own equivalent.
- **Stays:** only the harness keeps it.

| Path in this repository | Verdict | Why |
|---|---|---|
| `docs-retrieval-service/` (50 files: `pyproject.toml`, `uv.lock`, `src/devscene_docs_retrieval/`, `tests/`, `Dockerfile`, `compose.yaml`, `postgres/`) | **Duplicated**, except `tests/test_launcher_e2e.py` | It is the product's Python half (`01 → §5`). The harness's `python` backend launches it until retirement. |
| `docs-retrieval-service/tests/test_launcher_e2e.py` | **Stays** | Its lines 1–7 copy and test the harness launcher from `cli/templates/scripts/`. |
| `cli/src/retrieval/{chunk,corpus,models,queryLog,refresh,search,server,session,store}.ts` | **Duplicated** | This is the TS engine and the harness's default backend (`01 → §1`). RagScene needs it too: seven Python test files plus `ts_bridge.*` run TS (`test_*parity*.py`, `test_refresh_end_state_postgres.py`, `test_store_statements.py`, `test_stubs.py`), and so do the evals. |
| `cli/src/retrieval/runtime.ts` | **Replaced** | `models.ts:26`, `server.ts:31`, `store.ts:40` and `session.ts:17` import its `loadRetrievalModule` and `retrievalModelCacheDir`. `check-floor.mjs:35` and `index-build.mjs:27` import `retrievalModelCacheDir` and `unresolvedRetrievalPeers`. The replacement exports all three names. In RagScene, the optional peers become ordinary `dependencies` in `typescript/package.json`, imported statically, and the model cache path takes a `ragscene` name. |
| `cli/src/commands/docs.ts` (`index`, `search`, `serve`, `fetch-models`) | **Replaced** by a RagScene TS CLI built from it | `cli/test/docs-retrieval.test.mjs` drives these verbs through `runCli`. The evals spawn `cli/dist/cli.js docs serve` (`query-log-pass.mjs:58`, `index-build.mjs:38`). The harness keeps its own copy. |
| `cli/src/retrieval/pythonBackend.ts`: every name the evals import, parser included | **Duplicated** | The evals import `PYTHON_DATABASE_URL_VARIABLE`, `PYTHON_DEFAULT_DATABASE_URL`, `PYTHON_RETRIEVAL_COMMAND`, `PYTHON_SELF_CHECK_SUB_COMMAND`, `PYTHON_SERVE_SUB_COMMAND`, `parseSelfCheck` and `pythonDatabaseUrl` (`python-backend.mjs:43-48`, `mcp-backend-pass.mjs:46`, `vector-agreement.mjs:50`, `bm25-history.mjs:81`). RagScene needs to parse `self-check` output itself. The harness keeps its own copy for `doctor`. |
| Harness modules the engine imports: `config/model`, `core/{errors,paths,repoPaths,report}`, plus `core/mainRepoAnchor` (tests) | **Shimmed** | The nine engine files import these five. `core/json` and `machine/paths` are used only by `runtime.ts`. `docs-retrieval.test.mjs:25` imports `mainRepoAnchor`. |
| `cli/test/docs-retrieval*.test.mjs` (5 suites), `cli/test/fixtures/docs-index-pg-textsearch-1.3.1.*`, and the parts of `cli/test/helpers/fixture.mjs` (710 lines) and `helpers/timing.mjs` those suites use | **Duplicated** | `fixture.mjs` re-exports `dist/config/model.js`, and its `writeRetrievalConfig` writes the harness config file. The RagScene copy writes a RagScene source setting instead. It also drops the `dist/doctor/checks.js` import (`fixture.mjs:69`, `KEEP_AWAKE_LOCK_PROBE_ENV`). |
| `cli/src/retrieval/setup.ts`, doctor's retrieval checks, `cli/test/retrieval-{loading,python-backend}.test.mjs` | **Stays** | Harness provisioning and `doctor` (`01 → §4` #8–#10). |
| `evals/docs-retrieval/` (51 files) and the retrieval half of `evals/README.md` | **Moves**, but stays here until retirement | This is the product's only quality evidence, and gates 10 and 11 run it here (`scripts/run-gates.sh:193`). Its imports of `cli/dist/retrieval/{runtime,pythonBackend}.js`, `config/model.js` and `cli.js` are cut (§3.2). |
| `docs/retrieval-eval.md`, `docs/retrieval-eval-results.md` (1.4 MB), `docs/rag-extraction-research/` | **Moves**; the harness keeps a pointer | The design record. Each moved research file gains a header line saying it cites `autonomous-sdlc-harness@<sha>`, so its `path:line` citations still resolve. |
| `docs/retrieval.md` | **Split** | The design-of-record parts move; the adopter-facing parts stay. |
| `scripts/python-service.sh`, `scripts/check-model-revisions.mjs`, `scripts/check-eval-artifacts.sh` | **Duplicated** | The dev wrapper, the model-pin check and the eval-data leak check (gate 6e). |
| `supply-chain.yml` jobs `uv-audit` and `model-revisions` (`:62`, `:100`) | **Duplicated** into a RagScene workflow | — |
| The launcher (`scripts/` and `cli/templates/scripts/docs-search-server.sh`), `cli/templates/repo/{mcp,gitignore}.retrieval*`, `cli/templates/claude/settings.autonomous.retrieval.json`, the `docs.*` schema keys and their negative fixtures, the 11 agent grants, the optional peers (`cli/package.json:19-32`), the Actions cache wiring | **Stays** | The seam the harness consumes (`01 → §7`). |

**Both backends go across (Inference).** The runtime is undecided (R3.6), and the evals and parity tests tie TS and Python together. The losing engine is deleted in RagScene later.

**Interim (Inference).** The harness keeps its own copy, frozen, so adopters see no change. That lasts until RagScene publishes a stdio MCP command and a `self-check` the harness can pin (`01 → §7` → `### The contract the harness would consume afterwards`).

## 3. The harness in the new repository

### 3.1 What `init` and analyze need

**How the harness reads the tree (Documented).**
- **Detection** is a first-match file-existence table (`docs/cli.md` → `## 4. Stack detection`). Row 4 takes a root Python manifest. The `monorepo` row takes a root `package.json` with `workspaces`, which is how straightedge was detected.
- **Layer lists** come from analyze's `layers` target, which runs first (`plugin/commands/harness-analyze.md` → `## Steps`, step 1, `--apply-layers`).
- **`existing` mode** takes the adopter's written material as sources (step 2). A copied README that still names harness machinery would become evidence, so the cut has to come first.

**Proposed layout and layers (Inference).**

```
python/        ← docs-retrieval-service/ (module renamed: src/ragscene/)
typescript/    ← engine files, the runtime/CLI replacements, shims, tests; package.json, tsconfig
evals/         ← evals/docs-retrieval/
docs/          ← design record, eval record, rag-extraction-research/
scripts/       ← typecheck.sh, test.sh (both runtimes), python.sh, check-*.mjs/.sh
package.json   ← workspaces: ["typescript"]
.github/workflows/
```

**Config.**
- Layers: `python`, `typescript`, `evals` and a catch-all `general` (`.`).
- Commands: `bash scripts/typecheck.sh` and `bash scripts/test.sh`, as straightedge has them.
- Phases: `qa: false`, `parity: false`, `docs: true` (`docs.root: docs`).
- Retrieval: off.

**Branches** (Inference; the project memory says one working copy per branch).
- `defaultBranch: dev`; `protectedBranches: ["main", "dev"]`.
- The import commit lands on `main`, and `dev` branches from it.
- Every later change runs in `git worktree add ../ragscenedev-<branch>` and merges by PR.
- The main checkout's HEAD stays on `dev`.

### 3.2 The minimum "functional" bar, and what to cut first

**What must work before analyze runs (Inference; proposals):**
1. `uv sync` and `pytest` pass in `python/`. The store tests run against the compose Postgres, and the models use the hash stub.
2. `npm run build` and the TS suites pass in `typescript/`.
3. The parity tests pass against `typescript/dist`.
4. `evals/` runs `fixture-catalog` end to end on the stub.
5. Each backend can index a directory that has **no** `devscene.config.json`.
6. In each runtime, `serve` answers one `search_docs` over stdio.
7. The local gates (`scripts/typecheck.sh`, `scripts/test.sh`) pass. CI is its own step (§3.3).
8. `git grep -inE 'devscene|harness|cli/dist|retrievalApplies|docs_index|stateDir' -- python typescript evals scripts` returns nothing. The grep is case-insensitive, so it also catches `HarnessError` and `HarnessConfig`. It does not cover the design record under `docs/`, or the eval label data (`evals/queries/*.jsonl`, `evals/transcripts/`).

**Cut before analyze.** These are the couplings a conventions writer would otherwise write down as rules. Numbering follows `01 → §4`; names are post-rename.

| # | Coupling | The cut |
|---|---|---|
| 1 | The corpus comes from the config file (`CONFIG_FILENAME`: `cli/src/config/model.ts:23`, `service.py:58`). Python keeps its `layers` even when `--docs-root` is given (`service.py:83-101`) | Add a RagScene source setting, and make `--docs-root` work on its own. **Trap:** after `init`, RagScene has its own `devscene.config.json`. Uncut code would quietly read the product's adoption file as its corpus. The eval's `self-docs` corpus reads that file the same way (`evals/docs-retrieval/README.md:52`). Its 20 queries are labelled with harness anchors (`.claude/context/conventions.md#…`, `docs/config.md#…`), so it cannot index RagScene's own tree. Give it an external corpus root pinned to a harness checkout, as `gate10-catalog` already has, or drop it (Open question 5). |
| 2, 3 | The `phases.docs && docs.retrieval` gate (`retrievalApplies`); the index at `<stateDir>/docs_index` | Delete the gate; take an explicit index directory. |
| 4 | Server name `devscene-docs` | `ragscene` as the default. |
| 5 | Harness wording in descriptions and remedies | Neutral text. |
| 6, 7 | **Env names and the cache path after branches 1, 3 and 5.** These are the post-rename forms of `HARNESS_DOCS_RETRIEVAL_{DATABASE_URL,TEST_DATABASE_URL,MODEL_CACHE,PG_PORT}`, `HARNESS_RETRIEVAL_CACHE`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_{STUB,LOG}` and `…/devscene/retrieval/`; take the exact spellings from those branches' final tables. **Two contributor variables keep their old names under #154:** `HARNESS_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT`, both in `evals/docs-retrieval/arm-a/run-arm-a.sh` | `RAGSCENE_*` names, and a `ragscene` cache path (R3.1). |
| 8 | `runtime.ts`'s dynamic loader; the five shimmed modules | Static dependencies and shims (§2). |
| 11, 12 | `ts_bridge` and the evals import `../../cli/dist/…`; two evals spawn `cli/dist/cli.js docs serve` | Point them at `typescript/dist` and the RagScene TS CLI. |
| 13 | Python provisioning clones the harness tag | Delete it. |
| — | Distribution `devscene-docs-retrieval`, module `devscene_docs_retrieval` | Rename to `ragscene` now, so the move renames nothing. |

**Left for harness runs after analyze:** the product work in `README.md` → `## 7`. That is the vectorless store, `tsvector-bm25`, the index/serve split, `serve --http`, and reconnect.

### 3.3 By hand or as harness runs, and CI

**The cut is a supervised session without the harness (Inference).** A harness run before analyze would plan against skeleton conventions. The cut is mostly mechanical, and §3.2's table is its checklist.

**Do not decline analyze (Documented).** straightedge's `.claude/CLAUDE.md` still carries the `harness:setup-pending` block ("the analysis was declined at setup"). Its config has a single `general` layer, while the one-layer-per-package plan exists only in project memory. Its `.extraction-source/` staging route is not needed here, because the source is public.

**CI is new work, not a copy (Documented, with Inference).**
- **What exists:** no test CI. The three workflows here are `publish-main.yml`, `release-npm.yml` and `supply-chain.yml`, and the tests run locally through `scripts/run-gates.sh`.
- **What `ci.yml` needs:**
  - a Postgres 18 image with `pg_textsearch` 1.5.1, cached or pushed to GHCR;
  - a CPU-torch `uv sync`;
  - Node;
  - both suites and the parity tests.
- **Cost (Inference, unmeasured):** about 10 minutes per push. GitHub Free's $12 of compute buys about 2 000 private Linux minutes a month, roughly 200 pushes. Public repositories run free (https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- **So:** build CI in `ragscenedev` or defer it (step 11).

## 4. The private-then-squash route

**The route is sound. These are its costs (Inference unless cited).**

| Cost or risk | What happens | Mitigation |
|---|---|---|
| **Issue and PR links** | PRs, closed issues and reviews stay in `ragscenedev`. GitHub transfers only open issues between repositories of one owner. "A private repository issue cannot be transferred to a public repository". The old URL redirects (https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/transferring-an-issue-to-another-repository). **Unconfirmed, likely a new number:** the page is silent. Secondary reports say transfers renumber (https://bugs.jython.org/msg13090), and issues and PRs share one counter (https://lists.llvm.org/pipermail/cfe-dev/2020-April/065197.html). A bare `#N` links within the current repository (https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls) | Transfer while both repositories are private, then flip `ragscene` public. Review each thread first: its comments, including links to private PRs, become public. Before the squash, rewrite every `#N`: harness issues become `firu-daniel/autonomous-sdlc-harness#N`, transferred issues get their new URL, and the rest go. |
| **Adoption and state directory** | Run artifacts accumulate. `harness-runs/` here holds 2 642 tracked files, and 53 of the 105 files in `624867e7` (#55) are run artifacts. They are not published evidence (project memory). The watcher label and the project-memory folder are keyed on the folder path (#151, step 2) | **Redo the adoption at the move.** Carry over `.claude/CLAUDE.md`, `.claude/context/*.md` and `lessons.md`; `init` keeps an existing `CLAUDE.md` ("a re-run keeps your copy"). Drop the run artifacts. Copy the project memory by hand. |
| **Names** | `ragscene`, `rag-scene`, `ragscenedev` and `ragscene-dev` return 404 on npm, PyPI and GitHub (2026-10-28). A pending PyPI trusted publisher does "**not** … reserve a project's name" (https://docs.pypi.org/trusted-publishers/creating-a-project-through-oidc/). npm trusted publishers are per package, and a new one must publish within 2 days (https://docs.npmjs.com/trusted-publishers) | **Reserve by hand or rule it out** (step 3). A hand-published `0.0.0` ties no repository, but an empty placeholder risks a PEP 541 claim (Inference). Point trusted publishing at `ragscene` only at the first release. Never publish from `ragscenedev`. |
| **Actions minutes** | See §3.3 | Use the local watcher and local gates while the repository is private. |
| **The visibility flip** | Making a repository public exposes its code, Actions history and logs; erases its stars and watchers; and **disables all push rulesets** (https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) | Flip with one commit and no Actions history. Re-check rulesets and branch protection afterwards. |

**Stable-point criteria (Inference; proposals).**

Required:
1. §3.2's bar holds.
2. #200–#203 are fixed, or #201–#203 are closed by design.
3. `README.md` installs and answers a first query on a clean Linux container (R3.2).
4. `LICENSE` and `NOTICE` exist, and `pyproject.toml` has a `license` field (`01 → §7`).
5. No harness, `ragscenedev` or bare `#N` reference remains.
6. `gitleaks dir` is clean.

Recommended:

7. The runtime is picked (R3.6), so the first public commit does not carry two engines with unexplained disagreement (`01 → §5`).
8. The model-free `lexical` default exists (R2.3).
9. The licence policy (`README.md` → `## 7` step 7) is settled before any image carries weights or `pgembed`.

**How the move is done.**
1. Create `firu-daniel/ragscene`, private and empty.
2. In a fresh `~/Work/ragscene`, run `git init` and extract `git archive <ragscenedev-sha>`, minus the state directory's per-run contents.
3. Run the reference sweep and `gitleaks dir`.
4. Run `init` with the current `devscene` release, then `doctor`.
5. Make one initial commit and push it.
6. Transfer and review the open issues.
7. Make the repository public and re-check its rulesets.
8. Stop `ragscenedev`'s watcher. In `~/Work/ragscenedev`, run `npx devscene daemon stop`, then delete its launchd plist under `~/Library/LaunchAgents/`, whose label is keyed on the folder path (#151 step 1 shows the pattern). Then run `npx devscene daemon list --prune`.
9. Run `npx devscene daemon install` in `~/Work/ragscene`.
10. Archive `ragscenedev`. Do not delete it.

The move stays outside any later harness-wide freeze.

## 5. Ordering against the sandbox series, the rename and the open issues

**The order is ruled (R3.7):** the sandbox series (#170), then the rename (#151–#156, full scope), then RagScene.
- #170's steps 3–8 are open.
- Step 2 is done: #196 was closed by PR #197 (`0d02ba3e`), though its box is unticked.
- No RagScene repository exists during the freeze.
- devscene5 renames the harness copy before it is copied, so the cut renames the `devscene` names to `ragscene` (Inference).
- `ragscenedev` is adopted with a released `devscene`, so it owes no re-wire (Inference).

**Two catches to settle before the rename (Documented).**
1. **#156's Done-when grep.** It is `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL'`, run outside `harness-runs/`. Once this branch merges, it would hit about 9 files under `docs/rag-extraction-research/`. Amend #156 to exclude that folder as historical record.
2. **#156's rename table.** I counted each name with `git grep -w` across the whole tree, `cli/templates` included and `harness-runs/` excluded:
   - **Keep `HARNESS_RETRIEVAL_CACHE` (4).** All four are in the adopter-rendered `cli/templates/github/workflows/harness-run.yml`, at `:600`, `:658`, `:938` and `:958`.
   - **Replace `HARNESS_RETRIEVAL_LOG` (0).** It does not exist. In its place, add `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` (8) and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` (25). These two are outside #152's scope, but #156's Done-when regex matches them as substrings, so devscene5 must rename them.
   - **Add `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (7) and `HARNESS_DOCS_RETRIEVAL_PG_PORT` (4)., and `HARNESS_DOCS_RETRIEVAL_REPO` (3, `docs-retrieval-service/compose.yaml` and its README; added after review).**
   - **Fix #154 too.** It cites `HARNESS_RETRIEVAL_STUB`, which does not exist (0).

   Make all of these corrections in the same edit, so devscene5's final table is the one §3.2's cut reads.

**#200, the maintainer's pick.** #151 asks that "the in-flight docs-retrieval work must have merged" before the rename.
- **(a) Before the rename,** as a harness fix after the sandbox series. Adopters are fixed sooner, #200's paths stay valid, and devscene5 renames fixed code. It costs one more branch before the rename.
- **(b) After the rename,** on the `devscene_docs_retrieval` paths, before the copy. It keeps R3.7 literal, but #200 must be respelled and adopters wait.
- **Recommended: (a)** (Inference): it is adopter-facing harness security work, the case #151's in-flight clause names. The maintainer picks.

**#201–#203 (Inference)** are fixed **in RagScene**:
- #201 and #202 concern `serve-http`, which is unshipped and never launched (`01 → §3`);
- #203 is product work (`README.md` → `## 7` step 8).

They are transferred to `ragscenedev` or closed in the harness with a pointer (Open question 2).

**#205 (Inference)** runs after the rename, as a record branch in the harness before the copy, so `pgembed-runtime-probe.md` travels with the research folder. It changes no code and blocks nothing. Its `store.py` path is respelled to `devscene_docs_retrieval/store.py`.

**#199 (Inference)** is product research that needs the web. It runs supervised in `ragscenedev` after adoption.

**Departures from `README.md` → `## 7`, which should be updated:**
- Its step 9 lands #201 and #202 here; this plan lands them in RagScene.
- Its step 10 extracts last; this plan copies first, so steps 1–8 run as RagScene branches.

## 6. Operation plan

**Who does each step:**
- **Hand:** the maintainer.
- **Supervised:** an interactive Claude Code session.
- **Harness run:** a run through the watcher.

**Versions.** `<X.Y.Z>` is the first `devscene` release (#151 → "After branch 5", step 1). Runs load `plugin/` from the harness's main checkout (project memory). Adopt RagScene right after that release, while the two still match. If they have drifted, state the skew in the adoption PR.

| # | Step | Who | Prerequisites | Exit check |
|---|---|---|---|---|
| 1 | Merge `chore_rag_extraction_research`. Amend #156: exclude `docs/rag-extraction-research/` from its Done-when, and correct its variable table (§5) | Hand | — | Merged to `dev`; #156 edited |
| 2 | Record R3.7 on #151 and #170. Pick #200 (a) or (b). Confirm the stable-point criteria. Run the transfer test (Open question 2): move a throwaway issue from a public repository to a private one and record whether it keeps its number | Hand | 1 | Comments on the issues; transfer result recorded |
| 3 | Reserve `ragscene` on PyPI and npm with a hand-published `0.0.0`, or rule it out. This is a registry action, not repository work; if the maintainer counts it under R3.7, it moves after step 6 | Hand | 2 | Both names held, or a recorded "no" |
| 4 | Finish the sandbox series (#170 steps 3–8) | Harness runs and hand | 1 | Every #170 box ticked |
| 5 | Under (a): fix #200 | Harness run | 4 | Merged; symlink tests per backend; parity holds |
| 6 | The rename: devscene1–5 at full scope, with #151's hand steps. Release `devscene@<X.Y.Z>`. Re-wire scenewise, expause and straightedge | Harness runs and hand | 4, 5 | #151 complete |
| 7 | Under (b): fix #200 on the renamed paths. Then run the #205 probe as a record branch in the harness | Harness run (#200); supervised or hand (#205) | 6 | #200 merged; `pgembed-runtime-probe.md` merged |
| 8 | `gh repo create firu-daniel/ragscenedev --private`; clone it to `~/Work/ragscenedev` | Hand | 7 | Empty clone |
| 9 | Extract with `git archive <dev-sha> -- <§2 paths> \| tar -x` into a staging folder. Lay it out as in §3.1 and add the provenance headers. Run `gitleaks dir`. Commit "import from autonomous-sdlc-harness@<sha>" on `main`; create `dev` | Hand | 8 | Pushed; gitleaks clean |
| 10 | The cut (§3.2 table), on `chore_ragscene_cut` in its own worktree | Supervised, no harness | 9 | Bar items 1–8 hold; PR merged into `dev` |
| 11 | CI: `ci.yml` (Postgres image, both suites, parity) plus `uv-audit` and `model-revisions`. Or defer CI to the public repository and keep the local gates | Supervised | 10 | Named workflow and job green, or a recorded deferral |
| 12 | On `chore_adopt_devscene` in its own worktree: `npx devscene@<X.Y.Z> init`; set the four layers, `defaultBranch: dev` and `protectedBranches`; run `/devscene:analyze`; review the conventions. After the merge, refresh the main checkout's machine-local profile and run `daemon install` | Hand plus supervised | 10 (and 11 if built) | `doctor` passes; no `setup-pending` block; the grep below returns nothing |
| 13 | Transfer #199 and #201–#203 if step 2's test passed; otherwise close them in the harness with pointers and re-file them. File `README.md` → `## 7` steps 1–3 and 5–8 as issues | Hand | 12 | Issues open in `ragscenedev` |
| 14 | Product branches: #201–#203, the lexical build (step 1), steps 2–3, then the rest in order. #199 runs supervised | Harness runs (#199 supervised) | 13 | Per issue |
| 15 | Review against §4's stable-point criteria; pick the runtime if that criterion is required | Hand | 14 | Criteria ticked on an issue |
| 16 | The move (§4 → "How the move is done") | Hand | 15 | One commit; CI or gates green; `doctor` passes; issues transferred and reviewed; repository public; rulesets re-checked; `launchctl list \| grep ragscenedev` empty; `daemon list` shows `ragscene` and not `ragscenedev`; `ragscenedev` archived |
| 17 | The harness keeps its frozen copy until RagScene publishes a pinnable stdio MCP command and `self-check`. Then one harness branch flips the launcher and deletes the engine files, `docs-retrieval-service/`, gates 6e, 11 and 13 from `run-gates.sh`, gate 10's record (it is a hand gate), `uv-audit` and `model-revisions`, and the duplicated tests and evals | Harness run, later | 16 and a RagScene release | **Plan end:** RagScene adopted, analyzed and building; the harness on its own copy |

**Step 12's grep.** It checks only what analyze writes, never what `init` writes for itself; straightedge's adopted `.claude/` names its harness in 8 files. It runs on the analyze-filled prose:

```
git grep -nE 'devscene_docs_retrieval|DEVSCENE_DOCS_RETRIEVAL|DEVSCENE_RETRIEVAL|devscene-docs|cli/dist|docs_index|retrievalApplies|Harness[A-Z]' -- .claude/context
```

The filled sections of `.claude/CLAUDE.md` are checked for the same names by eye.

## Open questions

1. **The stable-point criteria (§4):** are items 7–9 required before the public commit, or only items 1–6? For the maintainer.
2. **Issue transfers:** does a transferred issue keep its number, and is a public-to-private transfer allowed (#201–#203 into `ragscenedev`)? Test both with one throwaway issue in step 2. If they fail, close the issues with a pointer instead.
3. **Registry names (step 3):** reserve them early or not, and does reserving count as RagScene work under R3.7? For the maintainer.
4. **Detection on the proposed layout:** does `init` pick `monorepo` from the root `workspaces` key, and does `python/` get a command family? Test with a scratch `init` in step 12's worktree before the real one.
5. **`gate10-catalog` and `self-docs`:** both are labelled against corpora that live outside RagScene. The first labels private Expause doc paths, which are already public here; the second labels this harness's own docs. For each, keep it with an external pinned corpus root, keep it local-only, or drop it? For the maintainer.
6. **CI before the move, or local gates only (step 11)?** For the maintainer, once the minutes estimate is measured.

## Fork verdict

Start RagScene by copying files from a recorded harness commit with `git archive`, not by history surgery. The moving paths have one author and stay public here, and R3.8 drops history. Copy both backends, with stand-ins for `runtime.ts` and the `docs` CLI: the evals and the parity tests tie TS and Python together, and the runtime is still open. The harness keeps a frozen duplicate until RagScene ships something it can pin. Whether analyze writes correct conventions depends on the supervised cut before `init`. The sharpest trap there is the corpus reader, which would otherwise read RagScene's own `devscene.config.json`. The order follows R3.7: the sandbox series; the rename at full scope, with #200 fixed before it (recommended); #205; then `ragscenedev` adopted on a pinned `devscene`, and a squashed move to the public `ragscene` at a stable point. Confidence is high on the inventory and the order, moderate on the CI cost, and low on issue-transfer numbering until it is tested.

## Review response

**First review** (FAIL: 4 MF, 12 SF, 4 NtH). Everything was applied, with R3.7 and R3.8:
- **MF1–2:** the inventory was completed.
- **MF3:** step 12's grep was scoped.
- **MF4:** the order was rewritten to R3.7.
- **SF5–16, NtH17–20:** applied as that review lists them. NtH17's release-secrets note was later cut under R8.

**Re-review** (FAIL: 1 MF, 4 SF, 3 NtH). Everything was applied:
- **R1:** the #156 amendment was re-derived with whole-tree `git grep -w` counts.
- **R2:** the `pythonBackend` and `runtime` rows now name every export the evals import.
- **R3:** `self-docs` gets an external root or is dropped. The contributor variables are in cut row 6/7. Label data is exempt from bar item 8.
- **R4:** the watcher steps and their exit checks were added.
- **R5:** the transfer test moved to step 2.
- **R6–R8:** the `checks.js` import is dropped; gate 6e and gate 10 are named in step 17; about 600 words were cut.
