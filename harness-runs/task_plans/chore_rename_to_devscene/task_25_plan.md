### Task 25 — Respell the sandbox records and the orchestrator cost measurement

**Goal:** The sandbox documents of record and the orchestrator cost measurement name the product `devscene`, and each says once that its measurements were taken under the earlier name. Apply the spelling table and the measured-records rule in the story index's `## Context`.

**Depends on:** these tasks, whose values these records name:

- Task 1: the machine directories `…/devscene/…` and the run-profile path `${XDG_STATE_HOME:-$HOME/.local/state}/devscene/run-profiles/…`.
- Task 11: the plugin name, so the plugin-cache path is `~/.claude/plugins/cache/devscene/devscene/<version>`.
- Task 14: `firu-daniel/devscene`.

**Where this task stops.** These four files are almost entirely measured records. Respell the name and nothing else: every Claude Code version, date, run id, row id (`CS1`, `W6`, …), count and verbatim message stays byte-identical apart from the name. `docs/sandbox-record.md` is cited by `plugin/instructions/untrusted_input.md` → `## The rule` item 6 as *"the harness repository's `docs/sandbox-record.md`"*. That citation carries no product name and keeps resolving. No heading changes.

### Targets

- `docs/sandbox-verification.md`
- `docs/sandbox-placeholder-upstream-report.md`
- `docs/sandbox-record.md`
- `docs/orchestrator-cost-measurement.md`

**Work:**

- [ ] `docs/sandbox-verification.md`: every plugin-cache path, machine path, `npx` command and repository URL inside the row tables and round records, plus the disclosure sentence under its opening statement.
- [ ] `docs/sandbox-placeholder-upstream-report.md`: its hits, including its repository URL, plus the disclosure sentence. This report is addressed to an upstream reader, so the sentence also tells that reader the repository is now `firu-daniel/devscene`.
- [ ] `docs/sandbox-record.md` and `docs/orchestrator-cost-measurement.md`: the one hit each. Add the disclosure sentence where that hit sits in a measured record; where it is prose, add nothing.
- [ ] Re-read every changed record line against `git show HEAD:<file>`. Each must differ only in the product name.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- docs/sandbox-verification.md docs/sandbox-placeholder-upstream-report.md docs/sandbox-record.md docs/orchestrator-cost-measurement.md` prints nothing.
- `git grep -n -F 'Measurements recorded in this document before the product was renamed DevScene' -- docs/sandbox-verification.md docs/sandbox-placeholder-upstream-report.md` prints one line per file.
- `git diff --word-diff=porcelain -- docs/sandbox-verification.md` shows only removed/added words containing the old or new name, plus the added disclosure sentence.
