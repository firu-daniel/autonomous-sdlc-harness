# Architecture review — feat_harness_init_notification_topic_prompt

## Context

Branch `feat_harness_init_notification_topic_prompt`, reviewed 2026-09-25 against `dev...HEAD`. The reviewed diff is 11 files: `cli/src/commands/init.ts`, `cli/src/core/prompt.ts`, `cli/src/doctor/checks.ts`, `cli/src/generators/notifications.ts`, `cli/templates/claude/push-notify.env.example`, three `cli/test/` suites and three `docs/` files. They are judged against `.claude/context/cli.md`, `.claude/context/conventions.md` and `harness-runs/lessons.md`. 8 run-artifact files excluded from the reviewed diff.

Headline: the layering holds. The destination grammar (`resolvePushDestination`) and its wording (`PUSH_DESTINATION_FORMS`, `PUSH_DESTINATION_PLACEHOLDER`) have one owner, the notifications generator. `init` and `doctor` import them along the existing command/doctor → generator edge. The generator still only plans (enqueues into the `WritePlan`) and never writes itself. `core/prompt.ts` gains no upward import. The new re-ask in `init` loops over `askLine`, whose own doc comment gives validation to the caller. The template change stays under `cli/templates/claude/`, and the docs edits stay in `general`. Nothing crosses into `plugin/`. There is one Must Fix: the terminal re-ask line in `init.ts` re-words the accepted destination forms instead of taking them from the generator that owns that wording. That is a second home for a responsibility whose owning module's header claims it alone.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — The terminal re-ask line re-words the accepted destination forms outside their owning module _(layer: cli)_
2. [x] **Finding 2** — `GUIDED_ENDPOINT_EXAMPLE` stays exported with no importer, and its doc comment claims one _(layer: cli)_

## Must Fix

### 1. The terminal re-ask line re-words the accepted destination forms outside their owning module
→ [finding_1.md](feat_harness_init_notification_topic_prompt_arch_review/finding_1.md)

## Should Fix

_None._

## Nice to Have

### 2. `GUIDED_ENDPOINT_EXAMPLE` stays exported with no importer, and its doc comment claims one
→ [finding_2.md](feat_harness_init_notification_topic_prompt_arch_review/finding_2.md)
