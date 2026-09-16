### Task 4 — Stop `review-plan-reviewer` from blocking a finding on a line number

**Goal:** Close the two routes by which the code-review and skeptic-review meta-reviewer can return `verdict: FAIL` over a line coordinate — its per-finding check, which makes an omitted *"file-and-line reference"* a Must Fix, and its `lessons.md` missed-check trigger — while keeping an omitted anchor and a readiness entry with no `finding_<K>.md` as Must Fix. This task adds no new Must Fix trigger: a dead path or a dead symbol in a finding stays Must Fix in `branch-reviewer`, `skeptic-reviewer` and `layer-reviewer` (Tasks 2, 3, 10), not here.

**Route analysis — what C3 does in this file.** `review-plan-reviewer.md` has no pointer-resolution rule for finding anchors and no not-downgradable guard, and its `### False positives (Must Fix)` bullet reserves Must Fix for business-logic divergence, broken architecture and hard convention violations. So C3's first half (*"Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve"*) has nothing to modify here and **adds no trigger**; it is carried byte-identical only so the carrier set stays one text. Only its second half — *"a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry"* — does work in this file: it closes the `### Missed checks` route by which a citation lesson could make a review that did not flag a coordinate a Must Fix. The implementer must not read C3 as creating an anchor-resolution Must Fix in this meta-reviewer — that would break the prompt's `## Out of scope` (*"Close the coordinate routes and nothing else"*).

**Depends on:** Task 3, which rewrites the per-finding contracts of `branch-reviewer.md` and `skeptic-reviewer.md` — the two agents whose output this reviewer grades — to require C5 instead of `[<file>:<line>](<file>#L<line>)`. This reviewer's per-finding check must demand exactly what those contracts now require, so it carries C5 byte-identical. C3 is Task 2's text, also carried by Tasks 3 and 6. Task 8 rewrites `plugin/samples/sample_code_review/finding_<N>.md`, whose header notes this file's `## Read first` exception currently points at; this task removes that pointer's example and does not edit the samples.

C5:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

C3:

```text
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

### Targets

- `plugin/agents/review-plan-reviewer.md` — `## Resolved values` intro; `## Read first` first bullet; `## Process` step 3; `## What to check` → `**Per-finding files …**`; `### Missed checks`; `### Reference-implementation parity spot-check`; `## Output contract` Must Fix template.

**Work:**

- [ ] `**Per-finding files …**` first bullet: replace it with *"Each is self-contained: a `### N. Title` heading,"* then C5, then *", the full description of the problem, and a concrete fix suggestion (the exact snippet or the precise rename). A consumer must be able to implement the fix from this one file alone — a finding file that only restates the title or omits the site anchor or the fix is a Must Fix, and a missing or stale line number never is."* This is the clause that stops a missing coordinate reaching Must Fix; the omitted-anchor Must Fix is what keeps the fix loop's self-containment.
- [ ] `### Missed checks`: add C3 as its own paragraph directly after the stack-neutral trigger list (after the `<state_dir>/lessons.md` category bullet), so a ledger entry about citations cannot turn a review that did not flag a coordinate into a Must Fix. Add nothing else: no anchor-resolution trigger, no guard (see the route analysis above).
- [ ] `## Read first` first bullet: delete the parenthetical *"(the fixtures' `**File:**` lines are plain repo-relative paths; a real review carries the markdown link form)"*, keeping the header-note exception it illustrated. `## Resolved values` intro: replace *"`<file>` / `<line>` in the diff command and in the finding's file-and-line reference form"* with *"`<file>` in the diff command"*. `## Process` step 3: replace *"or the cited line ranges — not entire files"* with *"or the cited sites — not entire files"*.
- [ ] `### Reference-implementation parity spot-check`: replace *"re-open the cited `<reference_impl>` source line and confirm it still says what the reviewer claims"* with *"re-open the cited `<reference_impl>` source at its anchor and confirm it still says what the reviewer claims"*. Must Fix template `**Fix:**` line: replace *"add a missed check at a named file and line as a new finding file"* with *"add a missed check at a named site anchor as a new finding file"*.

**Verification:**

- Grep the target for `file-and-line`, `<file>:<line>`, `#L<line>`, `<line>`, `line ranges`, `source line` and `file and line`: no hit.
- With the Grep tool in fixed-string mode, search the target for C5 and for C3 exactly as fenced above: one hit each.
- The dead-pointer example this file owns still grades Must Fix against the edited file: a `**Finding 4**` readiness entry with no `finding_4.md` still fails `**Index ↔ finding correspondence (Must Fix):**` — *"A pointer with no matching file is a Must Fix."* — which this task does not edit. The dead-path and dead-symbol cases are graded in `branch-reviewer.md`, `skeptic-reviewer.md` (Task 3) and `layer-reviewer.md` (Task 2), and the routing-row case in `layer-reviewer.md` (Task 2); none is checked here. A finding anchored correctly but with a stale line hint fails nothing here.
- Read the edited `### Missed checks` and `### False positives (Must Fix)` sections: no sentence other than the per-finding check's omitted-anchor clause and the unedited index-correspondence rule makes a finding's anchor a Must Fix condition — C3 is present as the only addition to `### Missed checks`.
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.
