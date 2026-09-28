### Task 26 — Document `execution.target` and where remote settings live in `docs/config.md` and `schemas/README.md`

**Goal:** Give the new key its row of record and state the configuration boundary remote execution adds: one committed key decides *whether* a run goes remote; everything about *how* — the runner, the credentials, the tunables — lives on GitHub, as repository variables and secrets, because it varies per repository owner and some of it is secret.

**Depends on:** Task 25, which added the schema clause: `execution` (object, no other key) with `target`, `"local"` | `"github-actions"`, default `"local"`. The key's readers, for the row: `init` writes the two workflows when it is `github-actions` (Task 17); the run watcher dispatches inbox drops to the workflow instead of launching them (Task 11); `doctor` reports it (`remote-execution`, and `remote-github` under `--check-github`, Tasks 18–19). The GitHub-side names are Task 2's: variables `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES`, `HARNESS_STEP_TIMEOUT_MINUTES` and the watcher tunables the workflow maps (Task 15); secrets `CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_API_KEY`, `HARNESS_PUSH_URL`, `HARNESS_GIT_TOKEN`.

### Targets

- `docs/config.md` — §5 (a row for `execution.target`) and §2 (the boundary paragraph) (register row 51).
- `schemas/README.md` — the configuration-boundary statement (register row 50).

**Work:**

- [ ] `docs/config.md` §5: a row `execution.target` | `"local"` \| `"github-actions"` | `local` | where an unattended run executes; with `github-actions`, `init` writes the two workflows, the run watcher dispatches every inbox drop to GitHub Actions instead of launching it, and `doctor` reports the remote setup; an absent key is local and changes nothing. Name `docs/remote-execution.md` for the rest. Place it where the schema places the property.
- [ ] `docs/config.md` §2: one paragraph after the variance paragraph — remote execution's settings split along the same line: the committed key says whether a run goes remote; the runner label, the credentials, the push target and the remote tunables are **GitHub repository variables and secrets**, because they belong to whoever owns the GitHub repository and some are secret; name `docs/remote-execution.md` as the list of record, and say none of them is a `harness.config.json` key.
- [ ] `schemas/README.md`: where it states what belongs in the committed configuration file and what belongs in machine-local state, add the third home — GitHub repository settings — in one sentence, pointing at `docs/config.md` §2.

**Verification:**

- Every key or value named exists in the schema or in Task 2's constants, spelled identically (read both against the edited text).
- No command is written inline where an adopter is meant to run it; any command sits in a fenced block, one per line (`harness-runs/lessons.md`).
