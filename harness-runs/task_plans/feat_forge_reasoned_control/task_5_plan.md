### Task 5 — Give `harness-control.yml`'s comment path the credential, the agent CLI and the pinned plugin

**Goal:** Let the control job run the mention agent. Three things reach the act step on an `issue_comment` event, and on no other event:

- **The credential.** Pass `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` to the act step as `IN_OAUTH` and `IN_API`, each through an expression that is the empty string unless the event is `issue_comment`. The review, close and deletion paths therefore never receive a credential.
- **The agent CLI.** Install the `claude` CLI on comment jobs when the runner lacks it.
- **The pinned plugin.** Fetch the harness plugin at the release the repository's `harness-run.yml` is pinned to, mirroring that workflow's `Install the pinned plugin` step and its pin, and hand its directory to the act step as `HARNESS_MENTION_PLUGIN_DIR`.

The job, its concurrency groups, its `if:` prefilter and the act step's command are otherwise unchanged.

**Depends on:** **Task 2.** `remote-run.sh control` reads three env names on the mention path only:

- `IN_OAUTH` and `IN_API`. It copies each into a non-exported local, `unset`s both at once, and hands them to the agent child alone as `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY`, each exported only when non-empty. When both are empty it posts the no-credential reply and exits 2. `harness-run.yml`'s `Run the harness` step uses the same two names.
- `HARNESS_MENTION_PLUGIN_DIR`, a directory that must hold `commands/harness-read-mention.md`. The script passes it to `claude --plugin-dir`, passes its `instructions/` subdirectory to `--add-dir`, and runs `-p /autonomous-sdlc-harness:harness-read-mention`; when the directory is unset or lacks that file it posts the no-plugin reply and exits 3.

The agent binary is `${HARNESS_AGENT_CLI:-claude}`, resolved with `command -v`; an unresolved binary is a reply and exit 3. Those three env names are the interface this file produces.

**Where this task stops.**

- It edits only the workflow template and its test.
- The account of record for the credential decision is **Task 10**'s, in `docs/github-run-control.md` → `## 6.`: its exposure, the merge-commit caveat and why hostile text cannot leave the closed set. This file's header states the shape and points there.
- The command and instruction file the fetched plugin must carry are **Task 8**'s and **Task 7**'s. A pinned release older than this branch has no `commands/harness-read-mention.md`, and the script's no-plugin reply covers it. The route for that case is in `docs/remote-execution.md` → `### Upgrading`, which is **Task 11**'s.
- The file still carries **no pin of its own**. `cli/src/generators/githubWorkflows.ts` → choice 5 copies it verbatim and never re-renders it by pin, and that stays true. It reads `harness-run.yml`'s pin at run time instead, which `init --upgrade-workflows` keeps current. So the plugin a mention runs under is always the release the run job installs.

### Targets

- `cli/templates/github/workflows/harness-control.yml` — two step `env:` lines, three new steps, and the header.
- `cli/test/workflow-templates.test.mjs` — the control workflow's assertions and its header.

**Work:**

- [ ] **The act step.** On `Act on the comment, review, close or deletion`, add a step-level `env:` with exactly:
  - `IN_OAUTH: ${{ github.event_name == 'issue_comment' && secrets.CLAUDE_CODE_OAUTH_TOKEN || '' }}`
  - `IN_API: ${{ github.event_name == 'issue_comment' && secrets.ANTHROPIC_API_KEY || '' }}`

  Keep a space after every opening `${{`: the header's *THREE RULES* state the renderer reads a letter straight after the braces as a token. No `secrets.` expression may appear inside any `run:` block, and nothing goes at job level.
- [ ] **Two install steps**, before the act step, each `if: github.event_name == 'issue_comment'` and `continue-on-error: true`. A failed install must not block the exact-form commands; the script then finds no agent binary and answers a mention with its exit-3 reply.
  - `Set up Node`: `actions/setup-node@v5`, `node-version: '22'`, `package-manager-cache: false`, each spelled as `harness-run.yml`'s step is.
  - `Install the claude CLI when absent`: the same `run:` body as `harness-run.yml`'s step of that name, `npm install -g @anthropic-ai/claude-code` when `command -v claude` fails, then `claude --version`. Each comment job's log then records the version a mention ran under, which `docs/github-run-control.md` → `## 8.` (Task 10) leans on.
- [ ] **`Fetch the pinned plugin`**, after those two and before the act step, with the same `if:` and `continue-on-error: true`. Its `run:` body mirrors `harness-run.yml`'s `Install the pinned plugin` step:
  - **The pin.** Read the first `HARNESS_CLI_VERSION:` value from `.github/workflows/harness-run.yml` in the checkout, quotes stripped. That is the line `cli/src/remote/githubActions.ts` → `renderedCliVersions` reads (`CLI_VERSION_VARIABLE`).
  - **The source.** The source repository is `.claude/settings.json`'s `extraKnownMarketplaces["autonomous-sdlc-harness"].source.repo`, read with `jq` as that step reads it.
  - **The clone.** Clone the tag `autonomous-sdlc-harness--v<pin>` with `git -c advice.detachedHead=false clone --quiet --depth 1 --branch` into `$RUNNER_TEMP/harness-marketplace`, outside the checkout.
  - **The plugin directory.** Take the plugin's directory from the clone's `.claude-plugin/marketplace.json` entry named `autonomous-sdlc-harness` (its `source`), rather than a hard-coded `plugin`.
  - **The version check.** Check that the directory's `.claude-plugin/plugin.json` `.version` equals the pin: harness-run.yml's guard, read from the manifest rather than from `claude plugin list --json`.
  - **The hand-off.** Only then append `HARNESS_MENTION_PLUGIN_DIR=<that directory>` to `"$GITHUB_ENV"`.

  Each failure prints one `::warning::` naming its cause and the pin, and exits non-zero: no pin, no marketplace source, no tag, an unreadable marketplace entry, or a version mismatch. Every event value reaches the shell through `env:` only.

  It runs no `claude plugin install`. The act step's session runs under `--restricted`, which ignores the user settings in which an install records the plugin, so the script loads the clone with `--plugin-dir` for that one session. The clone at the release tag is the pin, exactly as in `harness-run.yml`.
- [ ] **The header.**
  - **`WHAT IT DOES`:** add that a mention of the handle anywhere in a comment is read by one read-only session running the plugin's mention-reading slash command, which `remote-run.sh control` launches, and that every decision still lives in that script.
  - **`THE PERMISSIONS`:** replace *"The job reads no repository secret: it needs only its own token, so the credential secrets never reach the job that reads untrusted comment text."* with the new shape:
    - only an `issue_comment` event's act step receives `IN_OAUTH` / `IN_API`, through the expression above;
    - a `pull_request_review`, `issues`, `pull_request` or `delete` event gets empty strings;
    - a `pull_request_review` job runs the pull request's merge-commit copy of this file, which a same-repository head can edit. That writer could already read the secret through any workflow of their own (`docs/remote-execution.md` → `## 9. Credentials and billing`), and a fork's review job gets no secret (C2);
    - point at `docs/github-run-control.md` → `## 6.` for the decision of record.
  - **New `THE PLUGIN` paragraph:** this file carries no pin of its own. A comment job fetches the plugin at `harness-run.yml`'s pin, so the plugin a mention runs under is the release the run job installs. A pinned release older than mentions gets the no-plugin reply, and its route is `init --upgrade-workflows`.
  - **`ACTION PINS`:** add `actions/setup-node@v5` under the same reasoning paragraph, as `harness-run.yml`'s header does.
  - **`DECLARED MIRRORS`:**
    - under `cli/src/remote/githubActions.ts`: the two secret names, `OAUTH_TOKEN_SECRET` (`CLAUDE_CODE_OAUTH_TOKEN`) and `API_KEY_SECRET` (`ANTHROPIC_API_KEY`), and `HARNESS_CLI_VERSION` as read from `harness-run.yml`;
    - under `cli/src/generators/projectSettings.ts`: the marketplace name `autonomous-sdlc-harness`;
    - the release-tag shape `autonomous-sdlc-harness--v<version>`, as a mirror of `harness-run.yml`'s step;
    - `IN_OAUTH`, `IN_API` and `HARNESS_MENTION_PLUGIN_DIR` as the env interface `remote-run.sh control` reads (its `MENTION` paragraph).
- [ ] **`cli/test/workflow-templates.test.mjs`.** Rewrite `control references no secret, and serializes review jobs per head branch but never comment jobs`. Keep its concurrency assertions unchanged, and assert that:
  - `secrets.` appears in exactly two lines;
  - those two lines are the act step's `IN_OAUTH` and `IN_API`, each matching the exact expression above, with the `github.event_name == 'issue_comment' &&` guard;
  - neither is at job level;
  - the three new steps carry `if: github.event_name == 'issue_comment'` and `continue-on-error: true`, and come before the act step;
  - `Fetch the pinned plugin` reads `HARNESS_CLI_VERSION` from `.github/workflows/harness-run.yml`, clones `autonomous-sdlc-harness--v`, and writes `HARNESS_MENTION_PLUGIN_DIR` to `$GITHUB_ENV`. Assert also that the release-tag prefix it clones equals the one in `harness-run.yml`'s `Install the pinned plugin` step, read from both templates.

  Extend the existing *no input or secret expression reaches a run block* coverage to `harness-control.yml`, if it does not already read this file. Update that test file's header sentence about `harness-control.yml` (*"no `secrets.` reference"*) to the new rule. Grep the file for other cases that enumerate the control job's step names or pins and update them.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs` passes. This is the one test file this task edits; run it as one plain foreground command from the repository root.
- `commands.typecheck` exits 0.
- Read the rendered file: the job's `if:` prefilter, its `concurrency:` expression, its `permissions:` block and the act step's `run:` line are byte-identical to before. Phase G's gate 14 parses and lints the rendered workflows, so no gate is run here.
- End to end with Task 2, from a throwaway fixture: run `remote-run.sh control` with `GITHUB_EVENT_NAME=issue_comment`, `IN_OAUTH` set and `HARNESS_MENTION_PLUGIN_DIR` pointing at a directory holding `commands/harness-read-mention.md`, as these steps would. The agent stub is called with `--plugin-dir` naming that directory. With `GITHUB_EVENT_NAME=pull_request_review`, the env this file passes is empty by construction, which the test above asserts on the expression.
