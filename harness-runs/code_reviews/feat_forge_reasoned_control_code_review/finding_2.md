### 2. The credential-value check ignores the job's own token, and `## 8` overstates what the check contains

**Severity:** Must Fix. **Layers:** cli, general.

**Sites:**
- `cli/templates/scripts/remote-run.sh` → `mention_has_credential`, which compares only `MENTION_OAUTH` and `MENTION_API`.
- `cli/templates/scripts/remote-run.sh` → the header's `MENTION.` paragraph, the sentence *"a `text` or `answer` holding a saved credential value is an `::error::` line that never prints it"*.
- `docs/github-run-control.md` → `## 8. What is not verified here`, the row *"`--restricted` confines `Read`, `Grep` and `Glob` …"*, its **If it is wrong** cell: *"The agent can read files beyond its context and, through them, its own environment. The credential-value check still refuses any decision carrying the secret, and the agent still has no write, shell or network tool"*.
- `docs/github-run-control.md` → `## 6.`, *Why hostile text stays inside the closed set*, point 5: *"A decision whose text or answer carries a credential value is refused, and nothing it wrote is posted."*

**Problem.** The `## 8` row says what a failure of `--restricted` would cost, and the cost it states is too low, for two reasons.

1. **The job token is not checked at all.**
   - `harness-control.yml` checks out the default branch with `actions/checkout@v5` and `token: ${{ github.token }}`. It does not set `persist-credentials: false`, so the checkout's git configuration holds the job token as the `http.https://github.com/.extraheader` value `AUTHORIZATION: basic <base64 of x-access-token:<token>>`. That token carries `contents`, `actions`, `issues` and `pull-requests` write.
   - The token is also `GH_TOKEN` in the environment of every `remote-run.sh` process that is a parent of the agent. `control_mention_session` unsets it only in the agent's own subshell.
   - `mention_has_credential` checks only the two Claude secrets. A reply that quotes the token, raw or as the base64 header, is posted.
2. **The check matches a verbatim copy only.** It is a `case` substring match. An encoded, split or spelled-out copy of either Claude secret passes it. *"refuses any decision carrying the secret"* is true only of a verbatim copy.

The design notes that injected text can reach the agent: `conversation.md` carries the last 30 comments from anyone, and on a public repository that includes people with no access. If confinement fails, then, a maintainer reading this row is told the secret stays protected. In fact the job token is exposed outright, and the Claude credential is exposed to any non-verbatim copy. Whether to turn on mentions for a public repository is a decision made on exactly this row.

**Fix.**

- [ ] In `cli/templates/scripts/remote-run.sh` → `mention_has_credential`, also return 0 when `${GH_TOKEN-}` is non-empty and `$1` contains either:
  - the value of `${GH_TOKEN-}`; or
  - its persisted header form, the output of `printf 'x-access-token:%s' "$GH_TOKEN" | base64 | tr -d '\n'`.

  Compute the second form once, in `verb_control` beside the `MENTION_OAUTH` / `MENTION_API` capture. Store it in a non-exported variable such as `MENTION_JOB_TOKEN_B64`, declared beside `MENTION_OAUTH=""`. Leave `GH_TOKEN` itself exported, because `gh` needs it. Update the comment above `mention_has_credential` so it names the job token too.
- [ ] In the header's `MENTION.` paragraph, change *"a `text` or `answer` holding a saved credential value"* to *"a `text` or `answer` holding a saved credential value, or the job's `GH_TOKEN` raw or in the base64 form `actions/checkout` persists, verbatim"*.
- [ ] In `cli/test/remote-control-mention.test.mjs`, add a case beside *"a credential value in the text posts no text and exits 3"*. The fixture's `GH_TOKEN` is `gh-token-value`. A `reply` whose `text` carries `gh-token-value` must post no comment, exit 3, and leave `gh-token-value` out of stdout and stderr. A second `reply` whose `text` carries the base64 of `x-access-token:gh-token-value` must do the same.
- [ ] In `docs/github-run-control.md` → `## 8`, replace that row's **If it is wrong** cell with: *"The agent can read files beyond its context: the checkout's git configuration, which holds the job's token, and `/proc`, through which it can read its own environment, which holds the Claude credential. The credential-value check refuses a decision that carries either credential, or the job's token in its persisted form, verbatim; it does not catch an encoded or split copy. The agent still has no write, shell or network tool."*
- [ ] In `docs/github-run-control.md` → `## 6.`, point 5, change *"A decision whose text or answer carries a credential value is refused"* to *"A decision whose text or answer carries a credential value, or the job's token, verbatim is refused"*.
