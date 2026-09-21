# Code Review: fix_watcher_multi_question_resume_loop

## Context

**Branch:** `fix_watcher_multi_question_resume_loop`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev`, 31 files. That covers:
- the watcher's resume-set, archive and park-loop-guard changes, plus the notifier, cleanup and restart vocabulary (Tasks 1–3);
- the two new watcher suites and their shared driver (Tasks 4–5);
- the state-dir READMEs (Task 6);
- the four autonomous forks, the digest and ledger modules, the commands and the flow documents (Tasks 7–11);
- `docs/watcher.md` and `docs/cli.md` (Task 12);
- this repository's mirrored copies (Task 13).

20 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **The fix works.** The watcher now resumes a park only when every top-level question file is answered. It records the whole answered set, names every answer file in the resume prompt, and archives exactly that set on exit. The observed `feat_docs_catalog_retrieval` sequence and the legacy partly-archived layout both resume once.
- **Tests.** `cli/test/watcher-park-resume.test.mjs` and `cli/test/watcher-park-loop.test.mjs` were run against a fresh build: 12 of 12 pass. They cover:
  - the three-question replay;
  - a mid-session answer left unarchived;
  - a late question holding the resume back;
  - the index and window detectors tripping `park_loop`, with one notification and the log lines;
  - the `PARK_LOOP_CLEAR` clear;
  - a real multi-park never being caught;
  - a pause-resume never being counted.

  The full `bash scripts/run-gates.sh` bar was not run by this review.
- **Mirrors.** All six mirrored copies are byte-identical to their templates: the watcher, notifier, cleanup and restart scripts, and both state-dir READMEs.
- **Status readers.** The `park_loop` status is honoured by every registry reader that enumerates statuses: inbox rejection, the cleanup sweep, restart-watcher, `branch-answer` and `branch-status`.
- **Parity.** `phases.parity` is `false`, so no parity cross-check applies.
- **Pass 2.** Two-pass mode was requested, but the per-unit findings root holds no per-task review folders, so reconciliation had nothing to carry over.

The four findings below are all prose or comment accuracy defects the branch introduced; none is a behaviour defect, so none is rated Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Drop the false "quoted by the engine's Override 2(a)" sentence from the watcher's resume-clause comment, in the template and its mirror _(layer: cli, general)_
2. [x] **Finding 3** — Restate the park signal as "a question file left at the top level" in `docs/watcher.md` §4 and the clarifications README pair _(layer: cli, general)_
3. [x] **Finding 4** — Scope the mode contract's Class (i-b) and the owning fork's "nothing out of scope is stranded" claims to shipped files, naming non-shipped citers of the channel anchor only as examples _(layer: plugin)_
4. [x] **Finding 2** — Bring `ARCHITECTURE.md`'s `classify_run_exit` inventory row and paragraph up to the new park signal and the park-loop guard _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The watcher's resume-clause comment claims Override 2(a) quotes the clause, which nothing does, and it puts the `Override 2(a)` label into the watcher
→ [finding_1.md](fix_watcher_multi_question_resume_loop_code_review/finding_1.md)

### 2. `ARCHITECTURE.md`'s `classify_run_exit` inventory still describes the pre-branch branching order and park signal
→ [finding_2.md](fix_watcher_multi_question_resume_loop_code_review/finding_2.md)

### 3. Two documents still say an unanswered question alone makes a run parked, but the watcher now also parks on an answered pair left at the top level
→ [finding_3.md](fix_watcher_multi_question_resume_loop_code_review/finding_3.md)

### 4. The mode contract still says no file outside the plugin names the clarification-channel anchor, but `docs/watcher.md` now names it
→ [finding_4.md](fix_watcher_multi_question_resume_loop_code_review/finding_4.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
