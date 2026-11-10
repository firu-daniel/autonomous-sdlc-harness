# Code Review: feat_prompt_injection_reviewer

## Context

**Branch:** `feat_prompt_injection_reviewer`
**Date:** 2026-11-10
**Reviewed:** the whole branch diff against `dev`, taken from `origin/dev` at merge-base `a05560de` because this checkout has no local `dev` ref. That is 63 changed files outside the run-artifact tree, in three segments:

- **`cli`:** `prompt-injection-screen.sh` with its four verbs and its `OUTER_LOOP_SCRIPTS` row; the `hr_ledger_phases` change; the profile template's `_README`; the state-dir and scripts READMEs; the five new `prompt-injection-*` suites; and the edited ledger, init and untrusted-input corpus suites.
- **`plugin`:** the `prompt-injection-reviewer` agent; the `prompt_injection_screen.md` step; the three autonomous engine commands; the ledger, run-mode, untrusted-input, clarification-digest and planning-fork edits; and the flow documents.
- **`general`:** the self-adopted copies, `evals/prompt-injection-reviewer/`, `README.md`, `docs/cli.md`, `docs/watcher.md` and `evals/README.md`.

39 run-artifact files excluded from the reviewed diff.

**Headline.**

- **Structure:** the screen holds together. Each piece sits in its layer. The agent's allowlist is `Read, Grep, Glob` with `model: inherit`. `PI_CHECK_IDS` is held equal to the agent's table by a test. `P0`/`R0` are on the safety floor and in the §1.3 templates. The new commit point is entry 15 of the clean-tree list. The untrusted-input roster, its report table and the corpus test's map all carry the new reader. The counts in the flow documents match the tree: 23 agents, 32 `.md` files in `instructions/`. The self-adopted library and state-dir READMEs are byte-identical to their templates. No new test reads a tree of files: `prompt-injection-verdict.test.mjs` reads two fixed files. So no `treeGuards` entry is owed.
- **Tests:** every unit that changed behaviour ships its own suite. This review ran none of them; the Run gates phase establishes whether they pass.
- **What is wrong:** two behaviours do the wrong thing in a real run.
  - The pre-scan flags the harness's own closing marker line in every review round collected on GitHub, so that route cannot pass the screen (Finding 1).
  - The `SAFE` record matches by path, so an answer is screened again after the watcher archives it, and that second verdict can re-ask an answer the run has already acted on (Finding 2).
- **Smaller items:** the self-adopted script has drifted from its template (Finding 3), and one eval fixture measures a case the pre-scan intercepts (Finding 4).
- **Parity:** `phases.parity` is `false`, so no parity cross-check ran.
- **Pass 2:** the per-unit findings root holds no files, so it had nothing to reconcile.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Copy the template `prompt-injection-screen.sh` over the drifted self-adopted copy _(layer: general)_
2. [ ] **Finding 4** — Move the `hidden-instruction` fixture's instruction out of an HTML comment, and name all five pre-scan classes in the eval README _(layer: general)_
3. [ ] **Finding 2** — Match an answer's `SAFE` record at the top level or under `answered/` _(layer: cli, general)_
4. [ ] **Finding 1** — Exempt the GitHub review-round marker line from `prescan-html-comment` _(layer: cli, plugin, general)_

---

## Must Fix

### 1. Every review round collected on GitHub parks `UNSAFE`: the harness's own round marker trips `prescan-html-comment`
→ [finding_1.md](feat_prompt_injection_reviewer_code_review/finding_1.md)

### 2. A `SAFE` answer is screened a second time once the watcher archives it, and that second verdict can re-ask an answer the run has already used
→ [finding_2.md](feat_prompt_injection_reviewer_code_review/finding_2.md)

---

## Should Fix

### 3. The self-adopted `scripts/prompt-injection-screen.sh` no longer matches its template
→ [finding_3.md](feat_prompt_injection_reviewer_code_review/finding_3.md)

### 4. The `hidden-instruction` hostile fixture hides its instruction in an HTML comment, which the pre-scan catches before the agent would ever see it
→ [finding_4.md](feat_prompt_injection_reviewer_code_review/finding_4.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference implementation to diverge from and is empty.
