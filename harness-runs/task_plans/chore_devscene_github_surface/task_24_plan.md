### Task 24 — Respell the research documents and the sandbox records, and run the closing check

**Goal:** Apply the spelling table to the research documents and the sandbox records, as clarification answer Q1 (b) requires, with the disclosure sentence where it is owed. Then confirm across the whole tree that the task prompt's *Done when* holds.

**Depends on:**
- Tasks 1 and 2: the new names.
- Every earlier task: the closing check reads the whole tree, so it holds only once Tasks 1–23 have landed.

**Where this task stops.** It respells names only. No date, version, run id, count, quotation of an external source or other wording changes. An external source's own text quoted in a research document is not this project's name and stays, if any such quote carries one of the old strings. The closing check reports. It fixes nothing outside this task's targets: a hit it finds elsewhere is a finding against the task that owns that file, per `## Scope register`.

### Targets

- `docs/team-accounts-research.md`
- `docs/github-integration-research.md`
- `docs/copilot-foundry-research.md`
- `docs/rag-extraction-research/01-current-mechanism.md`
- `docs/rag-extraction-research/07-extraction-plan.md`
- `docs/rag-extraction-research/reviews/01-current-mechanism.md`
- `docs/rag-extraction-research/reviews/07-extraction-plan.md`
- `docs/sandbox-record.md`
- `docs/sandbox-verification.md`

**Work:**

- [ ] Disclosure. In each target, apply `## Context`'s rule at the lines this task respells. When any of them carries a `YYYY-MM-DD` date, a `0.x.y` version or a Gate 12 round number, add the disclosure sentence once, byte for byte. Place it as its own paragraph directly after the earlier rename's *"Measurements recorded in this document before the product was renamed DevScene …"* sentence where the file has one: `github-integration-research.md`, the four `rag-extraction-research/` files and `sandbox-verification.md`. Otherwise place it directly under the opening statement.
- [ ] `docs/team-accounts-research.md`: respell every workflow file, label, handle and state label, mostly in `## 3. GitHub's side` and `## 5. Options for the harness` → `### The repository facts the options rest on`. Leave every `HARNESS_*` name, `HARNESS_GIT_TOKEN` included, unchanged.
- [ ] `docs/github-integration-research.md` and `docs/copilot-foundry-research.md`: respell every workflow file name and any label, handle or marker.
- [ ] The four `docs/rag-extraction-research/` files: respell each workflow file name.
- [ ] `docs/sandbox-record.md` (*"one task through `devscene-run.yml`"*) and `docs/sandbox-verification.md`: respell each workflow file name. Leave every `lib/harness-run-lib.sh` path unchanged.

**Verification:**

- `grep -rnE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" docs` prints nothing.
- **Closing check, handle, marker and state labels.** Every hit of `git grep -nE '@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)' -- . ':!harness-runs'` is a comment line of `cli/test/fixtures/harness-control-0.6.1.yml`, the recorded-release exception `## Context` names.
- **Closing check, workflow files and names.** Every hit of `git grep -nE 'harness-(trigger|run|control|resume)\.yml|^name: harness-(trigger|run|control|resume)$' -- . ':!harness-runs'` is in `cli/test/fixtures/harness-control-0.6.1.yml`. `git ls-files cli/templates/github/workflows` lists only the four `devscene-*.yml` files.
- **Closing check, trigger label.** Every hit of `git grep -nE 'sdlc-harness([^/]|$)' -- . ':!harness-runs' ':!examples/notes-app/sdlc-harness'` is one of three things: the `stateDir` default (a `stateDir` value or default, a `--state-dir` argument, an `"$d/sdlc-harness"`-style path), the earlier product name `autonomous-sdlc-harness`, or a line of the fixture. None names an issue label.
- **Closure invariant of `## Scope register`.** Re-run its D1 command. Every file it now lists is a `change` row, or the renamed path of one, whose remaining hits are only the kept forms `## Context` lists: the concurrency group `harness-resume` in `devscene-resume.yml` is one. Re-run its D2 command. Every file it lists is a register row.
