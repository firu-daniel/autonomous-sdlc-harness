# Story: `remote-run.sh save` never uploads a file through a symbolic link, and reads the trusted `stateDir`

## Context

The `run` job's post-session step `Save the state bundle` runs `remote-run.sh save` unsandboxed, in the checkout the session just wrote. `save` assembles the bundle through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_write`, and the next step uploads it as the Actions artifact `harness-state`. Anyone who can read the repository's Actions runs can read that artifact, which on a public repository is everyone. Every `[ -f ]` / `[ -d ]` test and every `cp` / `cp -R` in that function follows a symbolic link. A session can therefore replace a bundle source with a link to a file its own sandbox will not let it read, and `save` publishes the target. The next job's `restore` then hands the target to that job's session. `save` also takes the state directory from the checkout's own `harness.config.json`, which the session can rewrite. This branch closes both gaps:

- **Linked sources are skipped, one stderr line each.** A bundle source that is a symbolic link, or that sits under a directory that is one, is skipped. The bundle is still written from every other source.
- **No link inside a directory source is copied or followed.** Directory sources are copied without following any link, at any depth.
- **`save` and `restore` take `stateDir` from the trusted copy.** That copy is the `harness.config.json` at `HARNESS_GITHUB_DEFAULT_COMMIT`, the commit the workflow's `Record the default branch's commit` step writes to the job's environment before any session.

An honest run's bundle stays byte-for-byte what it is today: the same sources, the same layout, `status.json` unchanged and schema `1`. No existing refusal gets weaker: not `save`'s handling of a previous job's `status.json`, not its no-bundle rule, and not `restore`'s lineage bound. `restore`'s own writes through unchecked paths stay out of scope (`docs/cli.md` §6 residual 1, the `hr_remote_bundle_restore` item). This branch changes only where `restore` reads `stateDir` from.

Everything executable lands in `cli/templates/scripts/`, so it reaches an adopter (and this repository's own self-adopted `scripts/`) only through `init`. **The root `scripts/` copies are deliberately not edited**: their re-render is deferred to the end of the sandbox series. Scripts stay bash 3.2-compatible. Every `cp` / `find` flag used must behave the same under BSD and GNU coreutils, because the runner is Ubuntu and the development machine is macOS. The work is cut bottom-up:

- **Task 1** — the library. Three new primitives and the rewritten `hr_remote_bundle_write`; `hr_remote_bundle_restore` and `hr_remote_move_aside` resolve `stateDir` through the shared helper.
- **Task 2** — `remote-run.sh`. The `save` and `restore` verbs, including `save`'s own pre-write reads of `remote_status.json` and `registry.json`.
- **Task 3** — the planted-link test suite and its recorded red-once mutations.
- **Task 4** — the catch-all documentation corrections and the post-release checks file.

**Top risks:**

1. **Breaking an honest run's bundle.** Replacing `cp -R` with a link-skipping copy could drop an empty directory or a dot-file, and the next job would then lose its pause state or planning drafts. Task 1 copies every directory and regular file a plain `cp -R` copies. Task 3 asserts the honest sources' exact bytes and layout beside every planted link.
2. **The trusted-`stateDir` helper disturbing shared globals.** `hr_remote_move_aside` is also called by the watcher's job mode, which holds `HR_RUN_*` state, and the library's configuration cache is shared. Task 1 requires the helper to leave every `HR_RUN_*` global as it found it and to end with the cache keyed on `<root>`.
3. **Silent dependence on unmeasured runner behaviour.** The task prompt forbids assuming what GNU `cp -R` and `actions/upload-artifact` do with a link. Task 1 records the measured answer in the function's header, and Task 4 sends whatever could not be measured locally to the post-release checks file.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and each one is flipped to `[x]` as that task's commit lands. **Only the committing role flips a marker.** In every flow that dispatches one, that is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers for the implementer. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_remote_bundle_save_symlinks/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Skip linked bundle sources and resolve the trusted `stateDir` in `harness-run-lib.sh` _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Make `remote-run.sh save` and `restore` read the trusted `stateDir` and skip a linked status or registry file _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — Add the planted-link suite `cli/test/remote-save-links.test.mjs` with its red-once record _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Narrow the bundle-save residual in `docs/` and write the post-release checks file _(layer: general)_ _(points: 15)_

## Scope register

Task 4's targets are durable corpus text under `docs/`, so this plan owes a register over them. Tasks 1–3 target application source and tests, and are outside it. The checks file Task 4 writes sits outside this repository and is no project file.

**Scope predicate**, quoted verbatim from the task prompt (goal 5): *"Close the bundle-save item of `docs/cli.md` §6 residual 1, or narrow it to exactly what remains, with the reason. Correct `docs/remote-execution.md` §11 → **The post-session steps on a job that passed.** Update `docs/watcher.md`'s summary of residual 1's items to match."*

**Derivation entry 1 — corpus files that state what `save` does (command).** Re-run verbatim from the checkout root:
`git grep -nE 'hr_remote_bundle_write|remote-run\.sh save|Save the state bundle|bundle save|follows a symbolic link' -- docs '*.md' plugin 'cli/templates/*.md' ':!harness-runs' ':!examples'`

**Derivation entry 2 — corpus that states where `save` / `restore` read `stateDir` from, or what the recorded default-branch commit feeds (command).** Re-run verbatim:
`git grep -nE 'state directory is read from|HARNESS_GITHUB_DEFAULT_COMMIT' -- docs '*.md' plugin 'cli/templates/github' ':!harness-runs' ':!examples'`

**Derivation entry 3 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the lessons ledger, the one standing tracked artifact under `<state_dir>` whose rows could govern these documents. No standing check matrix under `harness-runs/` covers `docs/`. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it states something about the state bundle, `remote-run.sh save` / `restore`, symbolic links or where `stateDir` is read from. Walked for this draft: no rule is reached, so the entry contributes no row.

**Closure invariant:** every site any derivation entry above reaches appears as a row below.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/cli.md` → `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1, item 5 ("`hr_remote_bundle_write` reads a run's state directory through paths it does not test for a symbolic link") | — | entry 1, `hr_remote_bundle_write` | `change` | Task 4 |
| 2 | `docs/cli.md` → same list, residual 1, item 4 ("in both the state directory is read from that checkout's own `harness.config.json`") | — | entry 1, `follows a symbolic link`; entry 2, `state directory is read from` | `change` | Task 4 — the `stateDir` sentence alone; the item's subject, `restore`'s unchecked writes, stays out of scope |
| 3 | `docs/remote-execution.md` → `## 11. Security` → **The post-session steps on a job that passed.** ("`save` does too, but it reads each bundle file with a `cp` that follows a symbolic link") | — | entry 1, `Save the state bundle` / `follows a symbolic link` | `change` | Task 4 |
| 4 | `docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`, closing paragraph ("the bundle save's reads") | — | entry 1, `bundle save` | `change` | Task 4 |
| 5 | `docs/remote-execution.md` → `## 1.`'s lifecycle list, item 6 **The end of the job.** ("then `remote-run.sh save` and the upload of the bundle") | — | entry 1, `remote-run.sh save` | `no-change` | states the step order, which this branch does not change; it says nothing about links or where `stateDir` comes from |
| 6 | `docs/development.md` → Gate 12 → **Round 3 — 2026-09-29, CLI 0.4.2.** ("its `Save the state bundle` and `Upload the state bundle` steps `success`") | — | entry 1, `Save the state bundle` | `no-change` | a dated record of a measured round; editing it would falsify the record |
| 7 | `docs/development.md` → Gate 12 → **Round 7 — 2026-10-05, CLI 0.6.1.**, the paragraph opening "Leg (e) **passed**" ("with its bundle saved and uploaded") | — | entry 1, `bundle save` (inside "bundle saved") | `no-change` | a dated record of a measured round |
| 8 | `docs/remote-execution.md` → `## 11. Security` → **The branch's own files are checked before the job trusts them.** → **The step.** ("as `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`") | — | entry 2, `HARNESS_GITHUB_DEFAULT_COMMIT` | `no-change` | its subject is the refusal step and the watchdog's check. Row 3's bullet, two bullets below in the same list, is where Task 4 states that `save` takes `stateDir` from the same recorded commit |
| 9 | `cli/templates/github/workflows/harness-run.yml` → header `THE JOB'S OWN FILES` → the `Record the default branch's commit` bullet ("the watcher's job-mode watchdog takes its check's configuration from that id") | — | entry 2, `HARNESS_GITHUB_DEFAULT_COMMIT` | `no-change` | still true. The step and its variable are unchanged, and `save` / `restore` read the variable the step already writes. Naming more consumers in a workflow comment would make every adopter re-render their workflows for a comment. `remote-run.sh`'s header (Task 2) and row 3 name the new consumers |
| 10 | `cli/templates/github/workflows/harness-run.yml` → step `Record the default branch's commit` (`echo "HARNESS_GITHUB_DEFAULT_COMMIT=$sha" >> "$GITHUB_ENV"`) | — | entry 2, `HARNESS_GITHUB_DEFAULT_COMMIT` | `no-change` | the producer of the value is unchanged; `save` and `restore` only read it |
