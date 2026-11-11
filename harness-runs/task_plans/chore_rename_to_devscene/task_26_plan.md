### Task 26 — Respell the retrieval documents and the research directories

**Goal:** The docs-retrieval documents and the research records under `docs/` name the product `devscene` / DevScene. Each one that respells a measured or quoted record says so once. Apply the spelling table and the measured-records rule in the story index's `## Context`.

**Depends on:** these tasks, whose values these documents name:

- Task 1: the retrieval cache `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval` and the runtime entry `node_modules/devscene/dist/cli.js`.
- Task 2: `npx devscene docs …` / `npx devscene init`.
- Task 11: the plugin and agent qualifier `devscene:`.
- Task 14: `firu-daniel/devscene`.

**Where this task stops.** `docs.retrieval`, `harness-docs`, `search_docs` and `harness-docs-retrieval` are wire names this branch leaves alone. The research directories record what was read and decided on stated dates. A quotation of a file as it stood, or a measured result, follows the measured-records rule. A plain prose mention of the product is simply respelled. No heading changes.

### Targets

- `docs/retrieval.md`, `docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`
- `docs/rag-extraction-research/README.md`, `01-current-mechanism.md`, `07-extraction-plan.md`, `reviews/01-current-mechanism.md`, `reviews/07-extraction-plan.md` (all under `docs/rag-extraction-research/`)
- `docs/work-report-research/README.md`, `branch-reviewer.md`, `conventions-reviewer.md`, `qa-tester.md`, `skeptic-reviewer.md`, `statistics-plan-writer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`, `reviews/qa-tester.md`, `reviews/skeptic-reviewer.md`, `reviews/task-plan-reviewer.md` (all under `docs/work-report-research/`)
- `docs/copilot-foundry-research.md`, `docs/github-integration-research.md`

**Work:**

- [ ] `docs/retrieval.md`, `retrieval-eval.md`, `retrieval-eval-results.md`: respell the cache and runtime paths, the `npx devscene …` commands and the repository URL. `retrieval-eval-results.md` records measured runs, so it gains the disclosure sentence.
- [ ] `docs/rag-extraction-research/**`: respell each hit, including the five `firu-daniel/devscene` URLs in its README. Each file whose hit sits in a quoted or measured record gains the disclosure sentence once.
- [ ] `docs/work-report-research/**`: respell each `/devscene:<command>`, `devscene:<agent>` and `npx devscene …`. Apply the same disclosure rule per file.
- [ ] `docs/copilot-foundry-research.md` and `docs/github-integration-research.md`: the one hit each, with the same disclosure rule.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- docs` prints nothing (Tasks 22–25 have cleared their files).
- `git diff -U0 -- docs/retrieval.md docs/retrieval-eval.md docs/retrieval-eval-results.md docs/rag-extraction-research docs/work-report-research docs/copilot-foundry-research.md docs/github-integration-research.md` shows no changed line starting with `#`.
- **Deviations from plan:** The Work list names only `retrieval-eval-results.md` for the disclosure sentence among the three retrieval documents. The story index's measured-records rule also applies to `docs/retrieval.md`: its host paragraph (`package under test …@0.2.0`), its environment-faults paragraph (the quoted `npx` refusal and the `node "$cache/…/dist/cli.js"` route), legs (i) and (vi) all respell measured commands and output. So it gains the sentence too. Disclosure applied by the rule per file. It was added to `docs/retrieval.md`, `docs/retrieval-eval-results.md`, `docs/rag-extraction-research/01-current-mechanism.md` (code quoted as it stood at `2ace325d`), `07-extraction-plan.md` (the measured Expause `git log -- …/` count), `reviews/01-current-mechanism.md` (the quoted `exec node …/dist/cli.js`), `reviews/07-extraction-plan.md` (the measured straightedge `git grep` and Expause `git log`) and `docs/github-integration-research.md` (the maintainer's 2026-09-30 Codespaces observation). It was not added where every hit is plain prose or a link: `docs/retrieval-eval.md` (a run procedure, not a result), `docs/rag-extraction-research/README.md` (five issue URLs), all of `docs/work-report-research/**` (command and agent references in analysis prose) and `docs/copilot-foundry-research.md` (an inference).
  - Each sentence is one inserted paragraph under the opening statement, so later lines in those files move down by two. The research records under `docs/rag-extraction-research/` cite `docs/retrieval.md:<n>` and `docs/retrieval-eval-results.md:<n>` as of the commits they name (`2ace325d`, `0d02ba3e`). Those are point-in-time citations pinned to a stated commit, so they were left unchanged.
  - `docs/rag-extraction-research/01-current-mechanism.md` still names the env-var prefix `AUTONOMOUS_SDLC_HARNESS_*`. The spelling table does not cover it, it sits outside the verification grep, and `cli/src` still carries that prefix (`cli/src/doctor/checks.ts`, `cli/src/retrieval/models.ts`, `cli/src/retrieval/queryLog.ts`). So it was left unchanged.
