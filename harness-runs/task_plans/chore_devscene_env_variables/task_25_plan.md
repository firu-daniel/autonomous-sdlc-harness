### Task 25 — Rename the variables in the research documents and reword the stale keep-forecast

**Goal:** The research documents name the agent seam `DEVSCENE_AGENT_CLI`, the token secret `DEVSCENE_GIT_TOKEN` and the bot list `DEVSCENE_TRIGGER_ALLOWED_BOTS`. The extraction plan no longer forecasts that `HARNESS_AGENT_CLI` keeps its name, because this branch renames it.

**Depends on:** Task 2 (`GIT_TOKEN_SECRET`, `TRIGGER_ALLOWED_BOTS_VARIABLE`) and Task 3 (the watcher's `${DEVSCENE_AGENT_CLI:-claude}`). Also Task 17, after which `evals/docs-retrieval/arm-a/run-arm-a.sh` reads `DEVSCENE_AGENT_CLI` and still reads `HARNESS_EVAL_CORPUS_ROOT`.

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change. In the extraction plan and its review, every `HARNESS_DOCS_RETRIEVAL_*`, `HARNESS_RETRIEVAL_*` and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_*` spelling is excluded and stays, and so does `HARNESS_EVAL_CORPUS_ROOT`.

### Targets

- `docs/github-integration-research.md`, `docs/team-accounts-research.md`
- `docs/copilot-foundry-research.md`, `docs/retrieval-eval.md`
- `docs/rag-extraction-research/07-extraction-plan.md`
- `docs/rag-extraction-research/reviews/07-extraction-plan.md`

**Work:**

- [ ] `github-integration-research.md`: `HARNESS_GIT_TOKEN` (5). `team-accounts-research.md`: `HARNESS_GIT_TOKEN` (4) and `HARNESS_TRIGGER_ALLOWED_BOTS` (3). Its `HARNESS_HOSTED_JOB_LIMIT_MINUTES` and `HARNESS_SELF_HOSTED_JOB_LIMIT_MINUTES` stay.
- [ ] `copilot-foundry-research.md` (1) and `retrieval-eval.md` (3): `HARNESS_AGENT_CLI`.
- [ ] `07-extraction-plan.md`, the row-6/7 cell beginning *"**Env names and the cache path after branches 1, 3 and 5.**"*. Its sentence *"**Two contributor variables keep their old names under #154:** `HARNESS_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT`, both in `evals/docs-retrieval/arm-a/run-arm-a.sh`"* is now false. Replace it with exactly: *"**Contributor variables in `evals/docs-retrieval/arm-a/run-arm-a.sh`:** `DEVSCENE_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT`; #154 keeps the second under its name"*. Leave the rest of the row unchanged.
- [ ] `reviews/07-extraction-plan.md`: change the line-206 bullet's parenthesis to *"(8 lines: `DEVSCENE_AGENT_CLI` and `HARNESS_EVAL_CORPUS_ROOT`, the contributor variables the script reads)"*. In the line-209 bullet, respell `HARNESS_AGENT_CLI` to `DEVSCENE_AGENT_CLI`.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs` prints nothing. Tasks 20–24 cleared the other documents.
- `git grep -n 'keep their old names' -- docs/rag-extraction-research` prints nothing.
- `git grep -cE 'HARNESS_DOCS_RETRIEVAL_|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_' -- docs/rag-extraction-research/07-extraction-plan.md` is non-zero: the excluded names are untouched.

- **Deviations from plan:** Respelling the `### G9.` heading in `docs/team-accounts-research.md` changes its generated anchor, so the G9 row of that file's own summary table linked to `#g9-harness_git_token-…`, which no longer resolved. Its fragment was updated to `#g9-devscene_git_token-per-member-fine-grained-tokens-or-a-github-app-installation-token`. `git grep -n 'harness_git_token'` found no other link to that anchor.
