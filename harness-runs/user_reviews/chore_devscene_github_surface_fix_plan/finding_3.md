### 3. The docs still describe both compatibility features and still name the old trigger label

**Files (site anchors):**
- `docs/github-issue-trigger.md`:
  - `**Who reads this:**` paragraph — "the trigger label and the upgrade path for a repository already using `harness`,";
  - step 2 — "Any `init` also replaces a `devscene-control.yml` byte for byte the copy 0.6.1 wrote";
  - the paragraph "**A repository already using `harness`.**" with its two fenced commands and the closing line "`--force` regenerates more than the trigger; what else is listed in";
  - the `## … not verified` table row "| The script accepts the legacy label `harness` only when the workflow passes no label |".
- `docs/remote-execution.md`:
  - the secrets-and-variables table row "| `HARNESS_TRIGGER_LABEL` | variable |" — "`devscene`; `harness` in a workflow written by an earlier release";
  - `### Upgrading` — "**One exception: a `devscene-control.yml` that 0.6.1 wrote.**" through the `npx devscene@<version> init --force` fence that follows it.
- `docs/github-run-control.md` — the indented block "**Coming from 0.6.1.**" under the bullet "Upgrading, with `init --upgrade-workflows` or `init --force`", through its `npx devscene@<version> doctor --check-github` fence.
- `docs/cli.md`:
  - §3's `devscene-control.yml` table row — "One exception: any `init` replaces a copy byte-identical to 0.6.1's";
  - the `remote-execution` / `remote-github` bullet in §7 — "else the fallback the committed `devscene-trigger.yml` carries, else `devscene`: a missing label **warns**, and a fallback that is the earlier release's `harness` is a **note**".
- `docs/development.md`:
  - Gate 14 — "**14b** must refuse `cli/test/fixtures/harness-control-0.6.1.yml`", "and over that fixture, which must report a syntax error", and the fence `node scripts/check-rendered-workflows.mjs --negatives`;
  - Gate 12 Round 5 — "The trigger label `harness` already existed from an earlier probe." and "who applied the label `harness` at 2026-10-01T08:01:39Z";
  - Gate 12 Round 6 — "The legacy label `harness` left by round 5 was deleted and `devscene` created."
  - gate 6f's deliberate-set list — the bullet "- `UNPARSEABLE` and `unparseable` in `cli/src/generators/githubWorkflows.ts` and `cli/src/commands/init.ts`, and `unparseable` in `cli/src/doctor/checks.ts`: each sits inside `UNPARSEABLE_CONTROL_RELEASES`, …"
- `docs/github-integration-research.md` — "the maintainer created issue #3 in the web UI with the label `harness` set at creation", `"label":"harness"`, and "label `harness`)."

**Problem.** The user asked that every document describing either feature lose that description, and that nothing anywhere say a name changed or mention an old name. The anchors above are what the tree still holds after Findings 1 and 2's code removals.
- **The trigger-label fallback** is described in `docs/github-issue-trigger.md`: the reader statement, the whole "A repository already using `harness`" paragraph and the unverified-behaviour row. It also appears in `docs/remote-execution.md`'s `HARNESS_TRIGGER_LABEL` row and in `docs/cli.md`'s description of the `remote-github` doctor check.
- **The 0.6.1 repair** is described in `docs/github-issue-trigger.md` step 2, `docs/remote-execution.md` → `### Upgrading`, `docs/github-run-control.md`'s "Coming from 0.6.1" block, `docs/cli.md`'s re-run-contract row and Gate 14's 14b and 14c in `docs/development.md`.
- **The old trigger label `harness`** survives in dated records. The branch's own policy (story plan, Q1 (b)) respells dated records and research documents to the current names. These lines were left only because `LEGACY_TRIGGER_LABEL` was an out-of-table name, and that reason goes with Finding 1. The affected records are the Gate 12 Round 5 and Round 6 records in `docs/development.md` and the issue #3 observation in `docs/github-integration-research.md`.

**Fix.** Delete the descriptions; do not replace them with a sentence about a rename, a migration or an earlier name. Every remaining sentence must read as if the current names had always been the only ones.
- [ ] `docs/github-issue-trigger.md`:
  - in **Who reads this**, delete ", the trigger label and the upgrade path for a repository already using `harness`" so the list reads "how to turn it on, what happens between a label and a dispatched run, …". Keep the trigger label in the list if the sentence needs it, as "the trigger label,";
  - in step 2, delete the last sentence "Any `init` also replaces a `devscene-control.yml` byte for byte the copy 0.6.1 wrote, which GitHub cannot parse, after a `.bak` (…)";
  - delete the "**A repository already using `harness`.**" paragraph, both fenced blocks under it (`npx devscene init --force`, `gh variable set HARNESS_TRIGGER_LABEL --body harness`), the "or keep the name:" line between them, and the "`--force` regenerates more than the trigger; …" line that closes it;
  - delete the table row "The script accepts the legacy label `harness` only when the workflow passes no label".
- [ ] `docs/remote-execution.md`:
  - in the `HARNESS_TRIGGER_LABEL` row, change the default cell to `` `devscene` ``;
  - in `### Upgrading`, delete the "**One exception: a `devscene-control.yml` that 0.6.1 wrote.**" paragraph, its `git diff --no-index …devscene-control.yml…` fence, the "That `.bak` is not in the managed `.gitignore` block …" paragraph and its `npx devscene@<version> init --force` fence;
  - keep the closing sentence "`doctor --check-github` fails on any harness workflow GitHub lists by its path rather than its name, which is how GitHub lists a file it could not parse." as an indented continuation paragraph of the same "It does not re-render `devscene-trigger.yml` or `devscene-control.yml`." bullet. It describes a doctor check that still exists.
- [ ] `docs/github-run-control.md`: delete the indented "**Coming from 0.6.1.**" block in full: the blank line before it, the paragraph, the `npx devscene@<version> init` fence, the "An unedited copy is replaced …" paragraph, the `init --force` fence, the "Either way, commit the file …" paragraph and the `doctor --check-github` fence. The "Upgrading, with …" bullet is then followed directly by "- Running `doctor`.".
- [ ] `docs/cli.md`:
  - in the `devscene-control.yml` row of §3's table, delete from "One exception: any `init` replaces a copy byte-identical to 0.6.1's" through "([`remote-execution.md`](remote-execution.md) → `### Upgrading`)." The row ends at "… as it is theirs.";
  - in the `remote-execution` / `remote-github` bullet, change "the label being the repository variable `HARNESS_TRIGGER_LABEL`, else the fallback the committed `devscene-trigger.yml` carries, else `devscene`: a missing label **warns**, and a fallback that is the earlier release's `harness` is a **note**, because that workflow still starts runs under it; the note names the forced re-run that re-renders it to `devscene`." to "the label being the repository variable `HARNESS_TRIGGER_LABEL`, else `devscene`: a missing label **warns**.".
- [ ] `docs/development.md`, Gate 14:
  - delete the sentence "**14b** must refuse `cli/test/fixtures/harness-control-0.6.1.yml`, …, through the same parse.";
  - shorten 14c to "**14c** runs `actionlint -shellcheck= -pyflakes=` over the rendered files, which must report nothing.";
  - delete the fenced block `node scripts/check-rendered-workflows.mjs --negatives`;
  - keep the opening history sentence ("Gate 12 round 7's finding 1 was a `devscene-control.yml` that 0.6.1 rendered as invalid YAML, …"). It records why the gate exists, not the removed repair.
- [ ] `docs/development.md`, gate 6f: delete the deliberate-set bullet "- `UNPARSEABLE` and `unparseable` in `cli/src/generators/githubWorkflows.ts` and `cli/src/commands/init.ts`, and `unparseable` in `cli/src/doctor/checks.ts`: each sits inside `UNPARSEABLE_CONTROL_RELEASES`, `UNPARSEABLE_CONTROL_IF_LINE` or `unparseableControlRoute`, exported identifiers other files import by name.", so the list opens with the `ines` bullet. This mirrors Finding 2's edit to `scripts/check-typos.sh`, whose document of record this list is.
- [ ] `docs/development.md`, Gate 12 records. Respell the trigger label under the branch's dated-records rule, changing nothing else:
  - Round 5: "The trigger label `harness` already existed from an earlier probe." becomes "The trigger label `devscene` already existed from an earlier probe.", and in the quoted provenance line, "who applied the label `harness` at 2026-10-01T08:01:39Z" becomes "who applied the label `devscene` at 2026-10-01T08:01:39Z";
  - Round 6: "The legacy label `harness` left by round 5 was deleted and `devscene` created." becomes "The trigger label `devscene` left by round 5 was deleted and created again." That is the faithful respelling of "one label deleted, the next created" when both map to the current name.
- [ ] `docs/github-integration-research.md`: respell the three trigger-label occurrences in the issue #3 observation to `devscene`. They are "with the label `harness` set at creation", the `gh api` event excerpt `"label":"harness"`, and "label `harness`)" in the `gh issue view` excerpt.
- [ ] Closing check: `git grep -n -E "already using .harness|legacy label|LEGACY_TRIGGER|Coming from 0\.6\.1|One exception: a .devscene-control|check-rendered-workflows\.mjs --negatives|harness-control-0\.6\.1|byte-identical to 0\.6\.1|UNPARSEABLE_CONTROL|unparseableControlRoute" -- ':!harness-runs'` returns nothing. The remaining `0.6.1` mentions are the Gate 12 Round 7 record, its finding 1, Gate 14's opening sentence and `docs/github-run-control.md`'s observation of "0.6.1's unparseable copy". Each records a measured defect, not a compatibility feature, and stays.
- [ ] Not touched, deliberately: `docs/development.md`'s "under the former plugin slug `harness`" (the commands-prefix debt paragraph). It records the **plugin slug** an earlier branch renamed, not a GitHub-surface name of this branch, and the story plan keeps earlier product names out of this branch's scope.
