# Code Review: feat_harness_init_notification_topic_prompt

## Context

**Branch:** `feat_harness_init_notification_topic_prompt`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev`, 11 files. Task 1 moved the push-destination grammar (`resolvePushDestination`), its one wording (`PUSH_DESTINATION_FORMS`, `PUSH_DESTINATION_PLACEHOLDER`, `UNRECOGNISED_DESTINATION_NOTE`), the shell-safe `push.env` content and the committed example template into `cli/src/generators/notifications.ts`. Task 2 changed `doctor`'s advice line in `cli/src/doctor/checks.ts`. Task 3 added `init`'s parse-time `--push-url` refusal, the re-asked terminal question and `REPROMPT_LIMIT`'s export from `cli/src/core/prompt.ts`. Task 4 updated `docs/cli.md`, `docs/development.md` and `docs/watcher.md`. The tests in `cli/test/push-destination.test.mjs`, `cli/test/init.test.mjs` and `cli/test/doctor.test.mjs` came with those tasks. 11 run-artifact files excluded from the reviewed diff.

The main things the plan and the task prompt required all hold. There is one grammar, and every entry point calls it: the flag at parse time, the terminal prompt and the generator. The question, the guided note, the no-opt-in note, the unrecognised warning and the parse-time refusal all interpolate the same sentence, and a test asserts that the question and the guided note carry it. No note, warning or refusal repeats the topic or the URL, and the tests check this on the topic, ampersand-URL and refusal paths. The file is still `0600` inside `0700` and `create-if-absent`. The fixture tests show that a hand-written file, a plain re-run and a refused re-run all leave an already-configured machine byte-identical. The single-quoted form sources back byte-identical under `bash`. The *"delivery side needs no change"* finding holds: `autonomous-notify.sh` sources the file under `set -a` and POSTs `"$HARNESS_PUSH_URL"` verbatim, and `doctor`'s `nonEmptyKeys` strips one pair of quotes. The new docs paragraphs put the adopter's command in a fenced block, as the lessons ledger requires. The terminal re-ask cannot be reached through the piped subprocess suite. The suite header says so, and `docs/development.md` §5's hand-run gate covers it instead. `phases.parity` is `false`, so no parity cross-check ran. Pass 0's grep half has no regexes filled in, so it found nothing. Its caller-check half found no un-wired feature; the one export with no importer is Finding 1, a hygiene item. Pass 2 was a no-op: the per-unit findings root holds no review files for this branch. The three findings below are what is left.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only.

1. [x] **Finding 1** — Drop the `export` from `NTFY_TOPIC_PATTERN`, which nothing outside `notifications.ts` imports. _(layer: cli)_
2. [x] **Finding 3** — Name the `http://` / `https://` scheme in the `--push-url` `--help` summary. _(layer: cli)_
3. [x] **Finding 2** — Reword `REPROMPT_LIMIT`'s doc comment so it states each re-ask loop's end state. _(layer: cli)_

---

## Must Fix

No Must Fix findings on this branch.

---

## Should Fix

### 2. `REPROMPT_LIMIT`'s doc comment says a default is taken, which is false for the push-destination re-ask it now also bounds
→ [finding_2.md](feat_harness_init_notification_topic_prompt_code_review/finding_2.md)

---

## Nice to Have

### 1. `NTFY_TOPIC_PATTERN` is exported with no caller outside its defining file
→ [finding_1.md](feat_harness_init_notification_topic_prompt_code_review/finding_1.md)

### 3. The `--push-url` `--help` summary says "the full URL" but leaves out the scheme that the grammar requires
→ [finding_3.md](feat_harness_init_notification_topic_prompt_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no divergence call-outs.
