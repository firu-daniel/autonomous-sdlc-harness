### Task 5 — Record the adoption routes and their action counts briefly

**Goal:** Append `## 5. Adoption routes compared` to `docs/github-integration-research.md`. It holds the counting rule in two sentences, one table of every route evaluated with its action count, and one sentence recording the drop. That meets the task prompt's acceptance criterion 3 (*"The adoption options comparison counts the adopter's actions for every route evaluated"*) without the per-route walkthroughs, which the drop of `feat_github_native_adoption` makes unnecessary.

**Depends on:** Task 4, which appends `## 4. Adoption — feat_github_native_adoption (dropped)` with A1–A12. The table cites those entries by ID and quotes nothing new.

**How this task's implementer reads the conventions.** Catch-all layer: `.claude/context/conventions.md` → `## Documents of record`.

### Targets

- `docs/github-integration-research.md` — append section 5.

**Work:**

- [ ] Append `## 5. Adoption routes compared` after section 4, with the *Counting rule* paragraph below.
- [ ] Add the *Routes table* below, then the closing sentence under it.
- [ ] Check each count against the route's action list in the table's *Actions, in order* column, and each cited ID against section 4.

### Counting rule

The count uses the unit `feat_github_native_adoption` set, from a repository with no harness file to a first run started by labelling an issue. One action is each click-through the adopter must choose, each paste or typed command, each commit, each secret, each setting and each merge. Navigating a form already counted is not counted again, and optional steps are left out. Counts are for an adopter with an Anthropic Console API key. A subscription token adds a codespace detour on every GitHub-side route (A11): create the codespace, install, `claude setup-token`, paste the URL, paste the code, then delete it. That is 5 more actions, or 2 on R2, where the codespace is already open.

### Routes table

| Route | Actions, in order | Count | Hosts anything? | Rests on |
|---|---|---|---|---|
| R1 Local install (today) | plugin marketplace add, plugin install, `init`, `config set execution.target`, `git add`, commit, `gh auth refresh -s workflow`, push, API key, secret, label an issue | 11 | no | `README.md`; `docs/remote-execution.md` § 7 |
| R2 Codespace setup | create codespace, install Claude Code, plugin commands, sign-in URL, sign-in code, `init` + `config set`, commit, push, open PR, merge, API key, secret, delete codespace, label an issue | 14 | no | A9, S2 |
| R3 Prefilled thin callers + setup job | open link 1, commit, open link 2 (the poller needs its own file, A3), commit, API key, secret, PR setting (S4), **Run workflow** on setup, merge its PR, label an issue | 10 | no | A1, A3, A4, S1, S4 |
| R4 Workflow-scoped PAT + setup job | open link, commit, create fine-grained PAT, `HARNESS_GIT_TOKEN` secret, API key, secret, **Run workflow** on setup, merge its PR, label an issue | 9 | no | S1, S2, A4 |
| R5 Harness-hosted GitHub App | open install link, install, merge the app's setup PR, API key, secret, label an issue | 6 | yes: a server and a private key for every installation | A6 |
| R6 Adopter-registered GitHub App | register app, generate key, install, key secret, client-ID variable, open link, commit, API key, secret, **Run workflow** on setup, merge, label an issue | 12 | no | A6 |
| R7 Claude GitHub App | not applicable: installs `claude.yml`, not the harness | — | — | A8 |
| R8 Marketplace listing | not a route: a listing installs nothing; as R3 or R4 | — | — | A2 |
| R9 Workflow templates / template repository | not applicable to an existing repository of another owner | — | — | A5 |
| R10 Copilot agents; Claude Code on the web | not evaluated further: vendor agents (A7); dropped by decision (A10) | — | — | A7, A10 |

Closing sentence: no GitHub-only route covers the supervised analysis (A12) or a subscription credential (A11) without a codespace, and a codespace setup (R2) costs more actions than the local install (R1). That is the finding `feat_github_native_adoption` was dropped on.

**Verification:**

- Section 5 follows section 4 and holds the rule, the table and the closing sentence.
- Each count equals the number of actions in its row: R1 11, R2 14, R3 10, R4 9, R5 6, R6 12.
- Every cited ID exists in sections 1–4.
