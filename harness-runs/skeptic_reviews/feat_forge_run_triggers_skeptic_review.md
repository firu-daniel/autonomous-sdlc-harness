# Skeptic Review: feat_forge_run_triggers

## Context

**Branch:** `feat_forge_run_triggers`
**Date:** 2026-09-30
**Reviewed:** the whole branch diff against `dev` (`defaultBranch`): 44 files, +3922/−224. 37 run-artifact files were excluded from the reviewed diff. The review was adversarial and aimed at the trigger path end to end: `harness-trigger.yml` → `remote-run.sh trigger` → `start` → `create-worktree.sh --no-bootstrap` → the library's placement → `dispatch`, then `adopt` and `sync` on the local side, the GitHub route in job-side notifications, the `init` and `doctor` changes, and the turn-on documentation.

**De-duplicated against:** `harness-runs/code_reviews/feat_forge_run_triggers_code_review.md` and its four findings, all applied: the engine in the GitHub route, the adopt bootstrap disclosure, adopt's exit 1, and the watcher's registry field list. No business-parity review exists (`phases.parity` is `false`), no architecture review exists for this branch, and nothing below is a `harness-runs/lessons.md` entry.

**Verified and not raised:**

- **Every new symbol is wired.** `hr_forge`, `hr_derive_branch`, the placement functions, `hr_remote_record_init`, the two GitHub-route producers, `forgeTriggerApplies`, the `forge` check and the trigger reads each have a production caller. `hr_branch_name_taken` is a tested library entry with no caller yet, a seam, not a defect.
- **Every GitHub fact the code and plan cite checks out.** T1, T2, T3, T4, T6 and S1 in `docs/github-integration-research.md`, and the Gate 12 round 2 and 3 rows in `docs/remote-execution.md`, each say what is claimed.
- **The trigger's composed addresses are valid.** These are the permission endpoint, the issue comment and label calls, the run-list fallback URL and the "Posted by" run URL.
- **The watcher refactor keeps the inbox path's behaviour.**
- **The diff honours the `harness-runs/lessons.md` → `## Unattended control loops` rules it exhibits.** Each of these was read first-hand:
  - *The trigger's run lookup is bounded and never fails.* `cli/templates/scripts/remote-run.sh` → `trigger_run_url` breaks out of its `gh run list` loop once `try` reaches `TRIGGER_RUN_LOOKUP_TRIES` (6), sleeping `HARNESS_TRIGGER_LOOKUP_SECS` or `TRIGGER_LOOKUP_SECS_DEFAULT` (5) between tries. With no URL found it prints the branch's filtered run-list URL (`…/actions/workflows/<file>?query=branch%3A<branch>`), and `verb_trigger` posts that in its one `trigger_finish` success comment. The lookup is not a failure path.
  - *The branch-name suffix search is bounded and its exhaustion reaches the issue.* `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_derive_branch` returns 3 once `n` passes `HR_BRANCH_SUFFIX_MAX` (99). `verb_trigger` maps status 3 to `trigger_refuse`, which calls `trigger_finish` once. On the issue source that posts one comment ("every branch name derived from this issue's title, through the suffix `_99`, is already taken.") naming the manual way on ("Retitle the issue, then re-apply the label …"). On the dispatch source it writes the same text to the step summary.
  - *An adopted run whose bundle has expired is reported as expired, not treated as absent.* `adopt_one` writes the record through `hr_remote_record_init`, which sets no `remote_run_id`, then runs `sync`. In `verb_sync` a completed newest run whose id differs from the recorded one reaches case 2, where `bundle_state` reporting `expired` calls `sync_expired`. That writes `status paused`, `pause_reason expired` and the `expired_line` detail, and restores nothing. It is not recorded as a fresh or running run.
- **The `plugin` layer's seven files hold against `.claude/context/plugin.md`.** The files are `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-resume.md`, `branch-status.md`, `branch-user-review.md`, `plugin/docs/AUTONOMOUS_FLOW.md` and `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`. Each check below was run first-hand and holds:
  - *Adopt before sync.* In each of the four syncing commands, the *Runs started on GitHub are adopted first* bullet sits in step 2 above the *Remote records sync first* bullet. `branch-answer.md`, `branch-pause.md` and `branch-resume.md` then state that a prefix naming a branch still unknown after the adopt step stops.
  - *`branch-status` stays never-sync.* It runs only `adopt --list`, and each of its `## Resolved values` row, step 2 and closing read-only fence says so. In `cli/templates/scripts/remote-run.sh` → `verb_adopt`, `--list` only echoes `not adopted: <branch> <url>` per candidate. The registry is tested with `-f` before any read, so the listing writes nothing.
  - *The wire strings and exit maps match the script* (`## Wires: dispatch in, return out`). The commands quote `adopted <branch>`, `not adopted: <branch> <url>` and `nothing to adopt`, and `adopt_one` and `verb_adopt` print exactly those. The exit maps match the script's header exit table too:
    - exit 2 is the `*)` refusal on `execution.target`;
    - exit 3 is a failed listing or `git ls-remote`;
    - exit 4 is `EXIT_PLACEMENT` when any candidate failed, which `--list` cannot produce, so `branch-status` rightly omits it.
  - *Citations resolve* (`## Citation`). `docs/remote-execution.md` → `## 1. The lifecycle of a remote run` and `plugin/docs/AUTONOMOUS_FLOW.md` → `## Out of scope in this release` both exist. The out-of-plugin one is cited repo-relative, not as a `${CLAUDE_PLUGIN_ROOT}` path. `remote-run.sh`'s `trigger` paragraph, which AUTONOMOUS_FLOW cites, exists in the script's header.
  - *No second owner* (`## Cores, forks and the single-owner rule`). The adopt bullet is repeated per command, the same shape as the existing *Remote records sync first* bullet in all four. These are commands, not instruction cores, and the adopt contract itself is owned by the script's header.
  - *No new unit* (`## What accompanies a new unit of each kind`). No command or `plugin/docs/` document is added.
  - *The forge-status text agrees with its sources.* Both flow documents say three things: the trigger ships, gated on `forge` `github` and `execution.target` `github-actions`; no ruleset is provisioned; draft-pull-request output and comment-based clarification remain unimplemented. That matches the `forge` rows of `ARCHITECTURE.md` (*No forge coupling beyond the issue trigger*, and the `forge` paragraph under the declared-seams section) and `forge.description` in `schemas/harness.config.schema.json`.

**Headline:** three net-new Must Fix findings, each of which breaks the path a remote-only or upgrading maintainer actually takes:

- the GitHub route never says to pick the run's branch under *Use workflow from*;
- the turn-on steps leave an existing repository's scripts without the `trigger` verb;
- a run adopted while its job is still running keeps a placeholder engine.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Tell an already-wired repository to bring its scripts current before the trigger can run _(layer: general)_
2. [ ] **Finding 3** — Have `sync` take the engine the downloaded bundle names _(layer: cli)_
3. [ ] **Finding 1** — Name the *Use workflow from* ref in the GitHub route and the trigger's hand-start comment _(layer: cli, general)_

---

## Must Fix

### 1. The GitHub route never names the *Use workflow from* ref, so a run dispatched by following it runs from the default branch, where `sync` and `restore` cannot find it
→ [finding_1.md](feat_forge_run_triggers_skeptic_review/finding_1.md)

### 2. Turning the trigger on in an already-wired repository leaves scripts with no `trigger` verb, so the trigger job fails with no comment on the issue
→ [finding_2.md](feat_forge_run_triggers_skeptic_review/finding_2.md)

### 3. A run adopted while its job is still running keeps the placeholder engine `task` forever, so relays resume a `user_review` or `docs` run as a task run
→ [finding_3.md](feat_forge_run_triggers_skeptic_review/finding_3.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. The plan's declared design choices were re-graded and hold:

- the trigger listens to `labeled` only (T1);
- the workflow has no `concurrency` group, and a race for one name is caught at the prompt push, where `hr_push_landed` fails;
- the watcher's tick never adopts;
- no `.gitignore` rule covers `harness-trigger.yml.bak`.
