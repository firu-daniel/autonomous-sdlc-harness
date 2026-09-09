# Docs phase — keep the "second brain" in sync with a shipped change (post-implementation, mode 2)

**Skip this phase unless `phases.docs` is `true` in `harness.config.json`.**

## Resolved values

The tokens below are neither Mode-contract **bindings** (this file declares none) nor ordinary **path placeholders** (`<branch>`, `<slug>`, `<i>`, `<n>`, `<doc_title>`, which this file's own text resolves): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<docs_root>` | config value | `docs.root` — the repo-relative directory holding the documentation corpus this phase writes into. Read **only** when `phases.docs` is `true`, which is the same gate that decides whether this phase runs at all. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. Inside a git pathspec, substitute it with any trailing slash stripped: `sdlc-harness//*` matches no path, so the doubled separator makes an exclusion pathspec silently inert. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory the generated wrapper scripts live in. This file uses the token **only** in the auto-skip rule's non-product-path list; it never invokes a commit or push wrapper by path — the runnable form lives in `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` and is not restated here. |
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into, and therefore the diff base the auto-skip rule computes the branch's changed files against. |

---

A **terminal, best-effort phase** for the code-implementation flows (the autonomous task flow and the user-review-fix flow). After a branch's work is done — new feature, fix, or both — this phase writes/updates the affected docs under `<docs_root>` **on the same branch**, so documentation ships and is reviewed together with the code. It reuses the `docs-writer` / `docs-reviewer` agents in **mode 2**.

This file is the canonical loop. A flow **activates** it by adding one dispatch point (see "Activation"); this file is otherwise inert.

## Where it runs & the non-blocking rule

- Runs **after** the branch's implementation + reviews are complete, at the **start of Phase D** — before the statistics and improvement-observations writes, so documentation ships on the branch with the code.
- **Best-effort: it must NEVER block "branch ready for review."** Any failure (survey error, writer/reviewer failure, non-convergence) is logged and the flow proceeds to its Done summary. Documentation is not a release gate.
- Docs commit to the **run's own non-protected branch** (like every other commit in the flow) — the protected-branch hard boundary is unchanged.

## Auto-skip

Compute the changed files (`git diff --name-only <default_branch>...HEAD -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`, or the run's known diff). **Skip the whole phase** (log `docs phase: no product-code changes — skipped`) when the diff touches **only** non-product paths — `<state_dir>/`, `.claude/`, `<scripts_dir>/`, `*.test.*`, CI/config, lockfiles. Docs describe product behaviour; infra/workflow changes don't warrant them.

**The content diff, computed here too.** `## Loop` hands `docs-writer` a *content* diff as well as the name list — compute it with the same exclusions: `git diff <default_branch>...HEAD -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`. The two commands in this section are together **the scoped branch diff** every step in `## Loop` refers to, and that scoped diff is what `diff_ref` names in step 2's `docs-reviewer` dispatch. Never recompute either without the exclusion.

## Loop

1. **Survey.** Dispatch `docs-writer` with `mode: survey`, the scoped branch diff from `## Auto-skip` (name list + diff), the current `<docs_root>/INDEX.md` (if present), and the docs tree. It returns a `targets:` list — each `action(new|update) · slug · output_path · reason · entry-hints`, classifying net-new capabilities (`new`), behaviour changes to existing features (`update`), and ripples across shared services, stored-data sets and backend operations. If `targets: none`, log it and end the phase.
   - *Note:* until the catalog (mode 1) has populated `<docs_root>`, most targets will be `new` (there is little to update) — that is correct and graceful, not an error.
2. **Per target** (walk the list; check `<state_dir>/STOP` + `<state_dir>/PAUSE` before each dispatch, same safety contract as the surrounding flow):
   - **Write.** Dispatch `docs-writer` with `mode: update`, the target, the same scoped branch diff, and — for `action: update` — the current content of `output_path`. It creates or revises the one doc (preserving still-true content on an update).
   - **Review.** Dispatch `docs-reviewer` with `mode: update`, `doc_path`, `diff_ref`, the target, `findings_path = <state_dir>/docs_catalog/reviews/<slug>/review_<i>.md`, `iteration=i`. It returns `verdict:` + `findings_file:` + `missed_docs:` + `summary:`.
     - **Resolve `<i>` to the next free index in the slug directory — never assume `0`.** The catalog loop legitimately starts at `i=0` (`${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop (walk `[ ]` entries top-to-bottom)`, step 2 **Review**) because it is the *first* pass over a slug. This phase runs **after** the catalog: a slug that already has a doc normally already has a `review_0.md` (and sometimes `review_1.md`, …) from the catalog run or from an earlier branch's docs phase, and writing to an occupied index **destroys** that review instead of adding this run's iteration — a silent loss the wrapper commits as an ordinary modification. So: `ls <state_dir>/docs_catalog/reviews/<slug>/` first; `<i>` = one past the highest existing `review_<n>.md` (a slug holding `review_0.md` **and** `review_1.md` starts at `i=2`); `<i> = 0` only when the directory is absent or empty. Same rule as the question-file convention in `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)` ("use the next free index — never overwrite"). Open the new findings file with a one-line note naming the branch and the index it follows, so the iteration chain stays readable across runs.
   - **Fix loop (cap 3).** On `FAIL`, re-dispatch the writer with the findings; re-review at `i+1` (counting up from the resolved starting `<i>`, still next-free); at most three times; then commit as-is and append `<slug>` + the open findings to `<state_dir>/docs_catalog/needs_review.md`.
   - **Missed-doc ripple.** If the reviewer returns `missed_docs:`, append those slugs (as `update` targets) to the working target list — the survey can miss a ripple.
   - **Commit + push.** Stage the doc + any accumulator (`needs_review.md`, review findings) via `commit-on-branch.sh` (subject `docs: <new|update> <doc_title>`), then `push-branch.sh` as a separate, **ungated** statement — never gated on the wrapper's exit code; identical mechanics to the docs-catalog engine's per-entry commit.
3. **INDEX.** If `<docs_root>/INDEX.md` exists and any doc was created/updated, dispatch `docs-writer` (`mode: update`, target = the INDEX) to fold the new/updated docs (and any new `parity_gaps.md` / `needs_review.md` entries) into the map; commit it. If no INDEX exists yet (catalog not run), skip — the catalog run will build it.

## Commit mechanics

Identical to the docs-catalog engine (`${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`): the `commit-on-branch.sh` wrapper only (never raw `git add`/`commit`), explicit paths before `--`, then `push-branch.sh` issued unconditionally as a separate statement — **no exit-code gate** (that section says why: the gate stalls a headless run, and an unconditional push is a harmless no-op when no commit landed).

## Activation (wired via Override H — recorded here for reference)

This phase is activated by **Override H** in both autonomous flows, which dispatch it at the
**start of Phase D** (before the D.1 `statistics-plan-writer` dispatch):
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Override H — docs phase (keep the "second brain" in sync) (autonomous fork only)` — task flow.
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → `## Override H — docs phase (keep the "second brain" in sync) (autonomous fork only)` — user-review-fix flow.

It runs best-effort and never blocks "branch ready for review"; the two Override-H sections own the
run-order, ledger, and non-blocking rules. This file remains the canonical *loop*; do not add a
second activation point.
