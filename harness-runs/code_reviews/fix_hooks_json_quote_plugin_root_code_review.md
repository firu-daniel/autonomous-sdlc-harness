# Code Review: fix_hooks_json_quote_plugin_root

## Context

**Branch:** `fix_hooks_json_quote_plugin_root`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev`: the six `PreToolUse` `command` strings in `plugin/hooks/hooks.json` (Task 1), the quoting rule added to `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings` (Task 1), and the measured manifest fact plus the Gate 1 sentence added to `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover` and `## 5. Verifying a change` (Task 2). 7 run-artifact files excluded from the reviewed diff.

`jq` parses `plugin/hooks/hooks.json`. Each of the six entries now reads `bash "${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh"`, with the basenames, the entry order, the `matcher`, the `type` and the `{"hooks": { … }}` wrapper unchanged. The quoted form is the same in all three files. The story's scope-register derivations were run again, and every hit falls on a register row: nothing under `cli/`, `cli/templates/` or `schemas/` reads these strings as data, and no citer quotes the old unquoted hook command. The validator could not be run from this review because the permission profile refuses a bare `claude …` command. Acceptance items 1–3 therefore rest on the output Task 2 recorded in §3: the unquoted form gives six warnings and exit 1, the quoted form gives `✔ Validation passed`, and a copy loaded from a spaced path still returns the `deny`, with the control run supporting the attribution. The self-containment placeholders (`<tmp>`, `<checkout>`, `<fixture>`) are in place. `phases.parity` is `false`, so no parity review ran. Pass 2 found no per-unit review folder under the supplied root, so it made no changes. The two findings below are both Nice to Have wording or structure fixes. One question that is outside this branch's scope is returned to the caller, not filed.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Limit the hooks README's "Every occurrence of the token" sentence to this manifest's `command` strings _(layer: plugin)_
2. [ ] **Finding 2** — Give the quoting fact its own bullet in both copies and correct the two count sentences _(layer: plugin, general)_

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

### 1. The hooks README states the quoting rule for "every occurrence of the token", which is wider than the manifest it governs
→ [finding_1.md](fix_hooks_json_quote_plugin_root_code_review/finding_1.md)

### 2. The quoting fact sits inside a bullet about hook composition, so the "Two facts" and "Five measured behaviours" counts no longer match what they introduce
→ [finding_2.md](fix_hooks_json_quote_plugin_root_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
