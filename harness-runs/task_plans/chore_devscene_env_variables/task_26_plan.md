### Task 26 — Rename the example's live dev-server files, record the `.claude/` paste, and run the closing check

**Goal:** The worked example's live dev server reads `DEVSCENE_DEV_SERVER_PORT`. Every `.claude/**` site no task may write has an exact paste for the maintainer, recorded below. The branch's closing check shows the *Done when* holds once that paste is applied.

**Depends on:** Task 5, whose `cli/templates/scripts/start-dev-server.sh` exports `DEVSCENE_DEV_SERVER_PORT`. Task 6, whose `.env.example` templates carry the replacement header lines quoted below. Task 2, whose `MAIN_REPO_ANCHOR_RULE` is `Bash(printenv DEVSCENE_MAIN_REPO)`. And every earlier task, because the closing check reads the whole tree. **This catch-all task ships last for that reason.**

**What this task does not touch.** It writes nothing under `.claude/**` and nothing under `examples/notes-app/.claude/**`: the tool layer refuses those writes and the refusal parks the run (`## Context`). It does not touch `examples/notes-app/.claude/context/conventions.md`, which is frozen capture and the recorded-release exception.

### Targets

- `examples/notes-app/scripts/start-dev-server.sh`
- `examples/notes-app/tools/dev-server.mjs`

**Work:**

- [ ] `examples/notes-app/scripts/start-dev-server.sh`: `HARNESS_DEV_SERVER_PORT` becomes `DEVSCENE_DEV_SERVER_PORT` (the header comment and the `export` line). Keep the file mode (`100755`).
- [ ] `examples/notes-app/tools/dev-server.mjs`: `HARNESS_DEV_SERVER_PORT` becomes `DEVSCENE_DEV_SERVER_PORT` (the comment and `process.env.…`).
- [ ] Run the closing check below and record its output in the return. Every remaining hit must fall in the expected set, and every unexpected hit is this task's to fix if it lies in this task's targets, or is reported as a blocker naming the file and the task that owns it.

**Verification — the closing check, from the checkout root:**

- **Renamed names.** `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- . ':!harness-runs'`. **Invariant:** every hit is in `.claude/push-notify.env.example`, in `examples/notes-app/.claude/{push-notify.env.example, qa-accounts.env.example, settings.autonomous.json}` (the paste sites below), or in `examples/notes-app/.claude/context/conventions.md` (the recorded-release exception). There are no hits anywhere else.
- **No invented names.** `git grep --threads=1 -ohE 'DEVSCENE_[A-Z0-9_]*' -- . ':!harness-runs'`. **Invariant:** every token printed is one of these:
  - a `New token` of `## Context`'s spelling table, with `DEVSCENE_PUSH_` and `DEVSCENE_QA_` as prefixes and `DEVSCENE_QA_<n>_…` forms under the latter;
  - one of the two `DEVSCENE_DOCS_RETRIEVAL` and `DEVSCENE_RETRIEVAL` mentions `docs/rag-extraction-research/07-extraction-plan.md` already carried;
  - the bare prefix mention `DEVSCENE_`, which the story index's *Names kept* → *Bare prefix mentions* entry classifies (`docs/rag-extraction-research/07-extraction-plan.md` and `docs/rag-extraction-research/reviews/07-extraction-plan.md`, both from before this branch).
- **Kept names survived.** `git grep -cE 'HARNESS_(STOPPED|INPUT_BRANCH|JOB_MODE|REMOTE_SLUG|REPO_SLUG|GITHUB_DEFAULT_COMMIT|PR_TOKEN|MENTION_PLUGIN_DIR|STEP_ALLOWANCE_MINUTES|SELF_PAUSE_MARGIN_MINUTES|TRIGGER_LOOKUP_SECS|SELF_ADOPT|EVAL_CORPUS_ROOT|GATES_CONTAINERS)' -- cli scripts docs`. **Invariant:** every one of those names appears in at least one file it lists.
- **Inventory closed.** `git grep --threads=1 -ohE '[A-Z_]*HARNESS_[A-Z0-9_]*' -- . ':!harness-runs'`. This is the story index's derivation entry D2. **Invariant:** every distinct token printed is classified in the story index's `## Context`, either as a spelling-table row or under *Names kept*. The bare prefix mentions `HARNESS_` and `AUTONOMOUS_SDLC_HARNESS_` are classified there under *Bare prefix mentions*, so they are expected hits and not blockers.
- **Why `--threads=1`.** With `-o` and git grep's default threading, both `-o` commands above were observed on this tree to print truncated tokens that exist in no file, such as `HARNESS_INPUT_PARK_LOOP_CLEA`, and to print a different set on each run. Run them exactly as written. If a token appears that no file contains, `git grep -nF '<token>'` finds the line it came from.

## Paste record

The maintainer applies this **before merge** (story index, **Manual setup required**). Each entry names the file, the line as it is at the branch's base, and the line that replaces it. Nothing else in these files changes.

**1. `.claude/push-notify.env.example` (this repository's render).**

- Replace lines 10–13:
  ```
  # Key names are the harness's own and are prefixed `HARNESS_PUSH_`. They were renamed to
  # that prefix when the harness was extracted from the project it grew in, so if you are
  # carrying settings over from an earlier runner, rename the keys — the reader recognises
  # these spellings and no others.
  ```
  with:
  ```
  # Key names are the harness's own and are prefixed `DEVSCENE_PUSH_`; the reader
  # recognises these spellings and no others.
  ```
- Line 21: `# must be single-quoted: HARNESS_PUSH_URL='https://…?a=1&b=2'.` becomes `# must be single-quoted: DEVSCENE_PUSH_URL='https://…?a=1&b=2'.`
- Line 22: `HARNESS_PUSH_URL=` becomes `DEVSCENE_PUSH_URL=`
- Line 26: `HARNESS_PUSH_CMD=` becomes `DEVSCENE_PUSH_CMD=`

**2. `examples/notes-app/.claude/push-notify.env.example`.**

- Replace lines 10–13, the same four lines as entry 1, with the same two lines as entry 1.
- Line 17: `HARNESS_PUSH_URL=` becomes `DEVSCENE_PUSH_URL=`
- Line 21: `HARNESS_PUSH_CMD=` becomes `DEVSCENE_PUSH_CMD=`

**3. `examples/notes-app/.claude/qa-accounts.env.example`.**

- Replace lines 10–12:
  ```
  # Key names are the harness's own and are prefixed `HARNESS_QA_<n>_`. They were renamed to
  # that prefix when the harness was extracted from the project it grew in, so if you are
  # carrying accounts over from an earlier runner, rename the keys rather than the reader.
  ```
  with:
  ```
  # Key names are the harness's own and are prefixed `DEVSCENE_QA_<n>_`; the reader
  # recognises these spellings and no others.
  ```
- Lines 23, 26, 29, 32 and 35–38: each `HARNESS_QA_` becomes `DEVSCENE_QA_` and nothing else changes on the line. The lines are `HARNESS_QA_1_EMAIL=`, `HARNESS_QA_1_PASSWORD=`, `HARNESS_QA_1_USER_ID=`, `HARNESS_QA_1_DISPLAY_NAME=`, `# HARNESS_QA_2_EMAIL=`, `# HARNESS_QA_2_PASSWORD=`, `# HARNESS_QA_2_USER_ID=` and `# HARNESS_QA_2_DISPLAY_NAME=`.

**4. `examples/notes-app/.claude/settings.autonomous.json`.**

- Line 34, the `_README` string *"THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE: …"*: both occurrences of `HARNESS_MAIN_REPO` (in `printenv HARNESS_MAIN_REPO` and in `Bash(printenv HARNESS_MAIN_REPO)`) become `DEVSCENE_MAIN_REPO`. No other byte of the string changes.
- Line 115: `"Bash(printenv HARNESS_MAIN_REPO)"` becomes `"Bash(printenv DEVSCENE_MAIN_REPO)"`, keeping its indentation and any trailing comma. This is the value of `MAIN_REPO_ANCHOR_RULE` after Task 2.
- Line 369, `"name": "HARNESS_PR_TOKEN"`: **unchanged**, because it is a kept name.

**After the paste,** the closing check's first command prints only the `examples/notes-app/.claude/context/conventions.md` line, which is the recorded-release exception.

## Rename report

Copy this into the run's Done summary. The final rename table is the story index's `## Context` spelling table (24 rows: 22 whole names plus the `HARNESS_PUSH_` and `HARNESS_QA_` prefix forms). The names deliberately kept, each with its reason, are that section's *Names kept* list. The docs-retrieval names excluded for `chore_devscene_docs_retrieval` are listed there too. The one renamed token left in the tree on purpose is `HARNESS_DEV_SERVER_PORT` in the frozen capture `examples/notes-app/.claude/context/conventions.md`.
