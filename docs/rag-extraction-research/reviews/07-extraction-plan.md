# Review — 07-extraction-plan.md
verdict: FAIL

Revised after ruling R3.7 (sandbox series, then the DevScene rename, then RagScene); finding 4 covers it.

Checked on 2026-10-28 against `dev` at `0d02ba3e`, Expause and straightedge (read-only), `gh issue view` #151, #156, #170, #196, #199–#203 and #205, and the GitHub, PyPI and npm docs. Most of the history, the authorship, the citations and the GitHub web claims hold. What fails is the §2 inventory, which leaves out three files the moving code needs, and two exit checks in the plan that cannot pass as written.

Confirmed:
- **Expause history.** The plan's commits are right (#228 `df1e96650` on 2026-08-07, #232 `88ea6a948`, #309 `570292c83`), and so is the #311 message.
- **This repository.** `2c01123c` is a single commit of 350 files, none of them retrieval files. `e43781aa` and `cba2ac24` are dated 2026-09-16. `dev` has 142 commits, all by one author, and no `Co-Authored-By` trailer on the moving paths.
- **The moving paths.** They have 25 commits on `dev`. `docs-retrieval-service/` has 50 tracked files, `evals/docs-retrieval/` has 51, and `docs/retrieval-eval-results.md` is 1.4 MB.
- **Citations into this repository.** `supply-chain.yml:62` and `:100` are right, as are `run-gates.sh:193` and `cli/package.json:19-32`.
- **The corpus-reader trap.** `service.py:83-101` reads `<cwd>/harness.config.json` and keeps its `layers` even when `--docs-root` is given, and `evals/docs-retrieval/README.md:52` says the same of `self-docs`.
- **State-directory counts.** `harness-runs/` has 2 642 tracked files, and #55 (`624867e7`) has 53 run artifacts among its 105 files.
- **straightedge.** It has 8 commits and a single `general` layer, carries the `setup-pending` "declined" block and has the `.extraction-source/` comment; `06595cc` says "Nothing is published yet".
- **Detection rows.** Rows 1 and 4 are as `docs/cli.md` § 4 states them.
- **`git-filter-repo` quotes.** Both are verbatim, at lines 103 and 134 of the manual.
- **Name availability.** `ragscene`, `rag-scene`, `ragscenedev` and `ragscene-dev` all return 404 on npm and PyPI, and `firu-daniel/ragscene` and `firu-daniel/ragscenedev` return 404 on GitHub.
- **GitHub web claims.** Transfer: only between repositories of the same owner, private to public refused, the original URL redirects. Visibility: when a private repository goes public, stars and watchers are erased and the Actions logs become public. Rename: Actions references are not redirected, and Pages project URLs are the one thing not redirected. Billing: GitHub Free includes $12 of Actions compute, and standard runners on public repositories are free.

## Must Fix

1. **§2 marks `cli/src/retrieval/runtime.ts` as "Stay", but four of the nine engine files import it.**
   - Evidence:
     - `models.ts:26` imports `loadRetrievalModule` and `retrievalModelCacheDir`.
     - `server.ts:31` and `store.ts:40` import `loadRetrievalModule`.
     - `session.ts:17` imports `retrievalModelCacheDir`.
     - `grep "from '\./runtime" cli/src/retrieval/*.ts` finds all four.
   - The "seven" harness modules in the §2 row are not the engine's either. `core/json` and `machine/paths` are imported only by `runtime.ts:38-40`. The nine engine files import five: `config/model`, `core/errors`, `core/paths`, `core/repoPaths` and `core/report`.
   - **Change:**
     - Add a row: `runtime.ts`'s loader and model-cache path are **replaced** in RagScene. Its peers become ordinary `dependencies` in `typescript/package.json`, imported statically, and the cache path takes a `ragscene` name.
     - Correct the shim row to the five modules, and say the seven-module grep took in `runtime.ts`.
     - Add this coupling to §3.2's cut table.

2. **§2 leaves the TS half with no CLI, and its tests and evals depend on files marked "Stay". §3.2 bar items 1, 2 and 4 therefore cannot pass with the inventory as listed.**
   - **No CLI.** `cli/src/commands/docs.ts`, which holds the `index`, `search`, `serve` and `fetch-models` verbs, is "Stay", and nothing in the moving set replaces it.
   - **Tests.** `cli/test/docs-retrieval.test.mjs`, a "Duplicated" suite, drives `docs index/search/serve` through `runCli` and `CLI_ENTRY`. It also imports `../dist/core/mainRepoAnchor.js` (line 25).
   - **Test helper.** `runCli` and `CLI_ENTRY` come from `cli/test/helpers/fixture.mjs`, which is not in the inventory. It has 710 lines, re-exports `dist/config/model.js`, and its `writeRetrievalConfig` writes a `harness.config.json`. `docs-retrieval-refresh-end-state.test.mjs` uses it too.
   - **Evals.**
     - `query-log-pass.mjs:58` and `index-build.mjs:38` spawn `cli/dist/cli.js docs serve`.
     - `python-backend.mjs:48`, `vector-agreement.mjs:50`, `mcp-backend-pass.mjs:46`, `bm25-history.mjs:81` and `bm25-refresh-rule.mjs:45` import `pythonBackend.js`, which is "Stay".
     - `check-floor.mjs:35`, `index-build.mjs:27` and `bm25-history.mjs:82` import `runtime.js`, which is "Stay".
     - `corpora.mjs:32` and `mirror-fixture.mjs:21` import `config/model.js`.
   - **Python tests.** `docs-retrieval-service/tests/test_launcher_e2e.py` tests the harness launcher, which it copies out of `cli/templates/scripts/` (lines 1-7). That launcher is "Stay", so this test is a harness test and does not belong in "Duplicated".
   - **Change:**
     - Add rows: a RagScene TS CLI (`index`/`search`/`serve`/`fetch-models`), built from `commands/docs.ts`; the `pythonBackend.ts` constants and self-check parser the evals use, which are "Duplicated" or move to the Python side; `cli/test/helpers/fixture.mjs`, "Duplicated" in the subset those suites use; and `mainRepoAnchor` among the shims.
     - Mark `test_launcher_e2e.py` "Stay".
     - Add "the evals' `cli/dist/cli.js` spawns" to cut row 11/12.

3. **Step 8's exit check, "a grep of `.claude/` for the §3.2 names is empty", cannot pass.**
   - Adoption itself writes those names. In straightedge, `git grep -lE "harness.config|autonomous-sdlc-harness|HARNESS_" main -- .claude` matches 8 files: `CLAUDE.md`, `settings.json`, `settings.autonomous.json`, `harness-task-offer.md`, `context/conventions.md` and others.
   - **Change:**
     - Scope the check to the analyze-written prose: `.claude/context/*.md` and the filled sections of `CLAUDE.md`.
     - Grep there only for the product-code names a cut should have removed: `harness_docs_retrieval`, `HARNESS_DOCS_RETRIEVAL`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL`, `harness-docs`, `cli/dist`, `docs_index` and `retrievalApplies`.

4. **§5, §6 steps 2–12, Open question 1 and the Fork verdict contradict ruling R3.7.**
   - R3.7, the maintainer's ruling: finish the sandbox series (#170), then the DevScene rename (#151–#156), and only then RagScene. No RagScene work runs before the rename is done, `ragscenedev` included.
   - The plan instead recommends option A. It copies, cuts, adopts and runs product branches in `ragscenedev` "before the sandbox series ends" (§5 order step 3, §6 steps 5–10), narrows devscene5, and parks or re-wires `ragscenedev` (§6 steps 11–12).
   - **Change**, all of it owed before the GitHub issue is written:
     - **§5.** Replace the options table and F1–F5 with option C as ruled. Delete "devscene5 under option A", and F1–F5 with it.
       - F2 (park) has no subject.
       - F3: devscene5 keeps its full scope.
       - F4: no `ragscenedev` in #151's re-wire list.
       - F5: the move after the freeze is now simply the order.
       - Open question 1 goes.
       - The earlier draft of this review raised one more freeze gap: #151's "After branch 1" step 1 would not stop a live `ragscenedev` watcher. R3.7 makes it moot, because no such watcher exists during the rename.
     - **devscene5 (#156) at full scope.** The harness copy is renamed before it is copied.
       - devscene5 renames `harness-docs` → `devscene-docs`, `harness_docs_retrieval` → `devscene_docs_retrieval`, and `HARNESS_DOCS_RETRIEVAL_*`/`HARNESS_RETRIEVAL_*` → `DEVSCENE_*`.
       - devscene4 renames `harness.config.json` → `devscene.config.json`. The `CONFIG_FILENAME` constants are at `cli/src/config/model.ts:23` and `service.py:58`.
       - Branches 1 and 3 rename the package-prefixed variables and the cache path.
       - So §3.2's cut table (rows 1, 4, 6, 7 and the module row), bar item 6's grep, §2's paths (`src/harness_docs_retrieval/`) and finding 3's grep must name the **post-rename** spellings. Take them from #156's table and from the final rename tables of branches 3 and 4.
       - The corpus trap becomes "RagScene's own `devscene.config.json`".
     - **devscene5's Done-when collides with the research docs.**
       - #156's Done-when is `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL'` outside `harness-runs/`, returning nothing. Once step 1 merges this folder, that grep hits 9 files in `docs/rag-extraction-research/`: 01 (10 matches), 07 (6), reviews/01 (4), and others.
       - Add a step before the rename: amend #156 to exclude `docs/rag-extraction-research/`, which is the historical record, or have devscene5 leave it alone. Without that, devscene5 either fails its check or rewrites the research's quoted names.
     - **`ragscenedev` is born with DevScene.**
       - Step 8 runs `npx devscene@<released> init`, released after #151's branch 5.
       - Step 12, the re-wire, is deleted.
       - Step 14's "redo the adoption at the move" stays only for its other reasons: the per-run artifacts, and the folder-keyed watcher label and project memory.
     - **#200.** #151 requires that "the in-flight docs-retrieval work must have merged" before the rename. #200 is harness retrieval work, so it lands either:
       - (a) before the rename, as a small harness fix alongside or right after the sandbox series, if the maintainer counts it as harness work rather than RagScene work; or
       - (b) after the rename, in the harness, on the renamed `devscene_docs_retrieval` paths. It stays a prerequisite of the copy (step 6), so both copies carry the fix.
       - The plan must pick one. Its body cites `harness_docs_retrieval/corpus.py`, which (b) would have to respell.
     - **#205.**
       - #205 is RagScene work by its own name (`chore_ragscene_pgembed_runtime_probe`), so under R3.7 it runs after the rename.
       - It changes no code and does not block the copy (both backends go across).
       - Run it after the rename, either as a record branch in the harness before step 6, so it travels with the research folder, or as `ragscenedev`'s first record branch after step 6.
       - Respell its `store.py` path to the post-rename module.
     - **The new order of §5 and §6:**
       1. Merge this research, with #156's Done-when amended.
       2. Run the sandbox series (#170).
       3. Run the rename (#151–#156, full scope), with #200 landing per (a) or (b).
       4. #205.
       5. Create `ragscenedev`, copy, cut, `devscene init`, analyze.
       6. Product branches.
       7. Stable point, then the move.
     - **Step 2** records R3.7 on #151 and #170, not F1–F5 on #156. The Fork verdict's order sentences and the "moderate on the order" confidence change accordingly.

## Should Fix

5. **§1, "64 commits … The last is `570292c83` (#309)", is off by one.** `git log --oneline -- autonomous-sdlc-harness/` gives 64 commits, but the newest is `32ed0bf18` (#311), the removal. The range #232–#309 is 63 commits. **Change:** "63 commits from #232 to #309, plus the #311 removal (64 in all)".

6. **§1 gitleaks:**
   - **The line number.** `gitleaks git` reports line 29 in commit `504a4df6`, but at `dev`'s tip the string is on line 30 (`grep -n "N3_TOKEN =" …` → `30:`).
   - **The working-tree scan.** `gitleaks dir .` over the **main checkout** finds 3 leaks, not 1. The extra two are in the gitignored `harness-runs/autonomous_logs/fix_sandbox_probe_round1_findings.stream.jsonl:2524` and `:2533`.
   - **Change:** state which tree was scanned. In step 6, copy from the recorded commit (`git archive <sha> -- <paths> | tar -x`) and never from a working tree, which carries gitignored logs and `docs-retrieval-service/.venv/`.

7. **§5, "#170 still has steps 2 (#196) through 7 open", is stale.** #196 was closed on 2026-10-28, fixed by PR #197, merged as `0d02ba3e`: the very commit this file says it read. **Change:** "steps 3–8 are open; the #196 checkbox is unticked but merged".

8. **§4 issue numbers and what becomes public.**
   - **Numbers.** The transfer page is silent on them. It documents only that "the original URL redirects to the new issue's URL". Migration reports, secondary sources, say transferred issues get a new number (https://bugs.jython.org/msg13090) and that issues and PRs share one counter (https://lists.llvm.org/pipermail/cfe-dev/2020-April/065197.html). Mark it "Unconfirmed, likely a new number; the redirect is Documented".
   - **What the flip exposes.** Transferred issues keep their comments, so the flip publishes every comment on them, including links to private `ragscenedev` PRs and commits. Add "review transferred issues' threads" to step 14.
   - **Rulesets.** The visibility page also states that making a repository public disables all push rulesets. Add "re-check rulesets after the flip".

9. **The Names row and Open question 4: "a placeholder publish ties trusted publishing to whichever repository does it" is wrong.**
   - A hand publish with a token from no repository ties nothing.
   - On PyPI, trusted publishers are configured separately, and a "pending" publisher "does **not** … reserve a project's name **until** it is actually used to publish" (https://docs.pypi.org/trusted-publishers/creating-a-project-through-oidc/).
   - On npm, a trusted publisher is per-package configuration (owner, repository, workflow, optional environment), and a new one "must complete its first successful publish within 2 days" (https://docs.npmjs.com/trusted-publishers).
   - **Change:**
     - Add a hand step after step 2: reserve `ragscene` on PyPI and npm with a hand-published `0.0.0`, or rule it out explicitly.
     - Note the PEP 541 risk for an empty placeholder (Inference).
     - Point the trusted publisher at `firu-daniel/ragscene` only at the first real release.

10. **"CI" is new work, not "recreated".**
    - This repository has no test CI. `.github/workflows/` holds only `publish-main.yml`, `release-npm.yml` and `supply-chain.yml`, and the tests run locally through `scripts/run-gates.sh`.
    - Bar item 1 needs Postgres 18 with `pg_textsearch` 1.5.1 built from `docs-retrieval-service/postgres/Dockerfile`, plus a CPU-torch `uv sync`. On a private repository each push draws on the $12/month allowance.
    - **Change:** make the CI job its own row in step 7 (image build or cache, Postgres service, both suites, parity), with a rough minutes-per-push estimate. Or let bar item 5 be the local gates until the repository goes public.

11. **The branch model and working copies are unstated, against memory-recorded practice.**
    - Steps 5–8 clone into `~/Work/ragscenedev` and then cut and adopt there, but the plan never says on which branch.
    - The plan never sets RagScene's `defaultBranch` or `protectedBranches`; this repository uses `dev` and `main`/`dev`/`publish`.
    - The project memory requires a separate working copy for each branch, and never switching the main checkout.
    - **Change:**
      - The import commit goes on `main`, and `dev` is created from it.
      - The step 7 cut and the step 8 adoption each run on a branch in `git worktree add ../ragscenedev-<branch>`, merged by PR.
      - Step 8 sets the protected branches.
      - The `~/Work/ragscenedev` HEAD is never switched.

12. **The CLI version has to be pinned at adoption (reframed by R3.7).** Step 8 should name the exact released `devscene` version and use it with the main checkout's `plugin/`. Runs load `plugin/` in place from the main checkout (project memory), so the plugin and the CLI should come from the same release, or the skew should be stated.

13. **What the stable-point criteria assume about the move.** With R3.7, step 14 always runs after the rename, so its "and the freeze over" prerequisite is redundant. Keep the move outside any later harness-wide freeze, and say so once rather than as F5.

14. **The "functional" bar has gaps that let couplings through to `harness-analyze`.**
    - Item 6's grep is case-sensitive on `HARNESS_`, so shimmed `HarnessError`, `HarnessConfig` and `retrievalApplies` survive, and a conventions writer would encode them as rules.
    - **Change:**
      - Add `Harness[A-Z]`, `retrievalApplies`, `docs_index` and `stateDir` to the grep.
      - Add two testable items: "each backend indexes a directory that has no `harness.config.json`", and "`serve` answers one `search_docs` over stdio in each runtime".
      - Make "CI green" name the workflow and the job.

15. **§5 and §6 contradict the synthesis without saying so.**
    - `README.md` → `## 7`:
      - step 9 says "#200–#202, landable here now", where this file puts #201 and #202 in RagScene;
      - step 10 makes extraction the **last** step, where this file copies before step 1 (the lexical build).
    - **Change:** state that this file supersedes `## 7` on both points, so the README is updated, or reconcile.

16. **Brief compliance.**
    - `## Fork verdict` has about 13 sentences; the brief allows 3–8.
    - The body is 4 482 words, above the brief's 4 000 but near the requested ~4 500.
    - **Change:** cut the verdict to 8 sentences.

## Nice to Have

17. **Secrets.** State that none are needed before release: the stubs need no model token, and the local watcher pushes over SSH. Name the release-time ones: npm and PyPI trusted publishing, and `CLAUDE_CODE_OAUTH_TOKEN` only if the remote workflows are turned on.
18. **Public-to-private transfer (§5, OQ3).** The docs do not cover it, so the "Inference" label is right. Fold it into OQ3's throwaway test, together with the numbering.
19. **Moved research docs.** Their `path:line` citations point into the harness tree. Add a one-line header saying they cite `autonomous-sdlc-harness@<sha>`, so they stay resolvable rather than dangling.
20. **Step 15** could name the harness-side deletions it implies: the frozen engine files, the `docs-retrieval-service/` copy, gate 10 and gate 11, and the `uv-audit` and `model-revisions` jobs. The issue can then size that branch.

## Re-review

verdict: FAIL (1 Must Fix)

Checked against the revised file (5 109 words, 17 steps, `## Review response`), `dev` at `0d02ba3e`, and `gh issue view` #152–#156.

**Resolved.**
- **MF1–MF4.** `runtime.ts` is Replaced, the shims and `mainRepoAnchor` are in, the TS CLI from `commands/docs.ts` is in, `fixture.mjs` and `timing.mjs` are in, and `test_launcher_e2e.py` Stays. Step 12's grep is scoped. The order follows R3.7, with devscene5 at full scope and `ragscenedev` born on `devscene`.
- **SF5–SF16** and **NtH17–20**. The Fork verdict is now 8 sentences.

### Must Fix

R1. **§5's catch 2 is partly wrong, and step 1 would amend #156 from it.**
- `HARNESS_RETRIEVAL_CACHE` **does exist** on `dev`, four times in the adopter-rendered `cli/templates/github/workflows/harness-run.yml` (`:600`, `:658`, `:938`, `:958`). Dropping it from #156's table would leave it unrenamed.
- `HARNESS_RETRIEVAL_LOG` does not exist. The log variable is `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` (`queryLog.ts:53`).
- The table also omits four names:
  - `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (`models.py:85`, `Dockerfile:35`, `compose.yaml:36`);
  - `HARNESS_DOCS_RETRIEVAL_PG_PORT` (`compose.yaml:17`, `scripts/python-service.sh:138`);
  - `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` (`models.ts:187`, `stubs.py:21`, `compose.yaml:32`);
  - `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG`.
- The two `AUTONOMOUS_SDLC_HARNESS_*` names are not in #152's scope either. #156's Done-when regex `HARNESS_(DOCS_)?RETRIEVAL` matches them as a substring, so devscene5 has to rename them anyway.
- Separately, #154 cites a `HARNESS_RETRIEVAL_STUB` that does not exist.
- **Change:** catch 2 should say "keep `HARNESS_RETRIEVAL_CACHE`; replace `HARNESS_RETRIEVAL_LOG` with the `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_{LOG,STUB}` pair; add `HARNESS_DOCS_RETRIEVAL_{MODEL_CACHE,PG_PORT}`".

### Should Fix

R2. **The `pythonBackend.ts` row is still too narrow, so the evals' Python path will not load.**
- The row duplicates two constants and keeps the parser with `doctor`. The evals import more:
  - `python-backend.mjs:43-48` imports `PYTHON_RETRIEVAL_COMMAND`, `PYTHON_SELF_CHECK_SUB_COMMAND`, `parseSelfCheck` and `pythonDatabaseUrl`;
  - `mcp-backend-pass.mjs:46` imports `PYTHON_SERVE_SUB_COMMAND` and `pythonDatabaseUrl`;
  - `vector-agreement.mjs:50` imports `pythonDatabaseUrl`.
- The `runtime.ts` replacement must also export what `check-floor.mjs:35` and `index-build.mjs:27` import: `retrievalModelCacheDir` and `unresolvedRetrievalPeers`.
- **Change:** duplicate every name the evals import, the parser included; RagScene needs `self-check` parsing anyway. Name the two runtime exports in the Replaced row.

R3. **The `self-docs` eval cannot be "repointed at an explicit path list" inside RagScene.**
- All 20 queries in `queries/self-docs.jsonl` are labelled with harness anchors, such as `.claude/context/conventions.md#…` and `docs/config.md#5-key-reference`. Those files do not exist in RagScene. After step 12, RagScene's own `.claude/context/conventions.md` exists with different anchors.
- The bar-8 grep also hits eval material:
  - `self-docs.jsonl` (`stateDir`);
  - `arm-a/run-arm-a.sh` (8 lines: `HARNESS_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT`, contributor variables #154 keeps under their old names).
- **Change:**
  - Give `self-docs` an external corpus root, pinned to a harness checkout as `gate10-catalog` already is, or drop it. Fold this into Open question 5.
  - Add `HARNESS_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT` to cut row 6/7.
  - Exempt label data (`queries/*.jsonl`, `transcripts/`) from bar item 8.

R4. **The move's steps leave out the watcher.**
- §4's "How the move is done" and step 16 never stop `ragscenedev`'s watcher before archiving it. That takes `daemon stop` in `~/Work/ragscenedev`, removing its launchd plist, and `daemon list --prune`, the way #151 does it.
- `daemon install` in `~/Work/ragscene` is in §4's table but not in the 8 numbered steps.
- **Change:** add both to the numbered steps and to step 16's exit check.

R5. **Step 13 transfers issues from public to private before the throwaway test of Open question 2 has run.** **Change:** run that test in step 2 or at the start of step 13, with "or close with a pointer" as the fallback.

### Nice to Have

R6. `helpers/fixture.mjs:69` also imports `dist/doctor/checks.js` (`KEEP_AWAKE_LOCK_PROBE_ENV`). The subset copy should drop that import.

R7. Step 17's deletion list should name gate 6e (`check-eval-artifacts.sh`). Gate 10 is a hand gate that `run-gates.sh` does not run, so delete its record rather than a script block.

R8. **Length (5 109 words; soft).** Content that can be cut, or kept out of the GitHub issue:
- `## Review response`, about 250 words;
- §1 "Secrets RagScene needs", which belongs in the issue's release step;
- §4 "Why not rename", which R3.8 already settles;
- §3.3's straightedge bullets, which could be one sentence;
- §2's legend.

Together these come to about 500–600 words.

**Order check.** Steps 1–17 are ordered correctly against R3.7. The (a)/(b) branches of #200 (steps 5 and 7) have consistent prerequisites, #205 precedes the copy, and every exit check is testable, apart from R2–R4 above.
