# Review — business-parity-reviewer
verdict: FAIL

## Must Fix

1. **The thinning-plan rows do not sum to the ledger's "after" figure.**
   - Evidence: the `Est. after` column of `## Thinning plan` (report lines 129–144) is 90+160+430+90+260+150+300+170+150+610+70+390+80+296+790+0 = **4 036**, not ~3 785. The ledger (`:163`) uses ~3 785 and the header (`:125`) says "about **4 210**". Adding the template and the rule sentence (372 + 40) gives **4 448**, not ~4 210. The gap is 251 words, 6.6 % of the claimed figure.
   - Change: either correct the per-row estimates or carry 4 036 / 4 448 through `:125`, `:163`, `:167`, `:171–172` and `:179`. The corrected deltas are agent-owned −2 442 (with the test-run move) and −1 710 (without it). The constraint still holds in both cases, so the conclusion stands but the numbers must be fixed.

2. **"No caller edit needed" is wrong: the trip-wire diff lists the same folders.**
   - Evidence: `plan_orchestration_instructions_autonomous.md:236` names the business-parity plan-review folder (`business_parity_reviews/<branch>/`) as a trip-wire root. It is treated as "their own consecutive `review_<i>.md` series, indexed per findings folder". `improvement_observations_instructions.md:74` says the listing is authoritative and to "sort each root's own artifacts and index that sorted list from 0".
   - `user_review_fixes_instructions_autonomous.md:198` does the same for `business_parity_user_review_reviews/<branch>/`.
   - A `work_report_<iteration>.md` placed beside `review_<iteration>.md` (report `:145`, `:183`) enters that listing. It doubles the round count and corrupts the net-new/re-raised diff.
   - Change: add this consumer to `## Storage and lifecycle` and `## Risks and costs`, and drop "No caller edit needed" (`:186`). Then pick one fix: an exemption line in the trip-wire module (lead 9 analogue), a subfolder (`<findings_folder>/work_reports/`), or embedding the report as a trailing section of `review_<i>.md` (lead 11). For the embed option, check that the plan writer re-dispatched on FAIL ignores the section.

## Should Fix

1. **Some reasoning still rests on the wrong lead-1 premise.**
   - `:14` justifies "write once" with "The agent has `Write` but no `Edit`". `:196` says "no `Edit` … So: one `Write` at the end; never tick-as-you-go". `:202` costs tick-as-you-go as "about 12 full rewrites per dispatch".
   - Per the brief's correction, `Bash(sed:*)` is allowed (`cli/templates/claude/settings.autonomous.json:39`), so a per-item `sed -i` tick is possible. Its cost is 12 Bash calls, not 12 rewrites.
   - The defensible reason is the agent's own doctrine at `business-parity-reviewer.md:12`: "Do not treat it as an oversight to work around". Using `sed -i` would be exactly that workaround, plus the call cost.
   - Change: restate change 1 as a design choice grounded in `:12` and cost, and fix the `:202` cost figure.

2. **The template header leaks an absolute path and restates the return wire.**
   - `findings_file: <path>` in the template header (`:105`) copies the return line. That line is `<full_path>` (`business-parity-reviewer.md:231`, `:235`), and the agent writes "with absolute paths" (`:213`). A committed report would carry the home directory or worktree path (lead 12).
   - The header also re-formats the 3-line return onto one line, which is a paraphrase of a wire literal.
   - Change: drop `findings_file:` or require a repo-relative path. Drop or relabel the `verdict:` token so that a `verdict:` grep cannot match it.

3. **The lessons ledger is dismissed without applying lead 13.**
   - `:35` says "not read … this agent never cites it". But `.claude/CLAUDE.md` (the "Planning or reviewing at branch level" row) routes branch-level reviewers to `harness-runs/lessons.md`, which is **1 199** words (`wc -w`). Insertion point 2 is a branch-diff review.
   - Change: list it as conditional up-front for diff mode in this repo (not present in `cli/templates/claude/CLAUDE.md`, which has no lessons row), and state which read list wins. This does not affect the delta.

4. **Two citations are off by one.**
   - "creates … only when it has findings" is at `user_review_fix_plan_writing_instructions_core.md:107`, not `:108`, and at `task_plan_writing_instructions_core.md:186`, not `:185` (report `:195`).
   - `task_plan_writing_instructions_core.md:188` (report `:91`) is "Pass its verdict back as step 5 states", not a parse site.
   - Change: correct all three.

5. **The template misses or blurs these steps:**
   - Diff-mode `plan_path` read for intent only (`business-parity-reviewer.md:121`). Fold it into BP5.
   - The blocker rule covers an unreadable `<reference_impl>` source too (`:113`), not only conventions documents. Extend BP6.
   - The dead-code carve-out for check (j) (`:152`). Add it to BP7's ref or BP8's description.
   - The docs / `search_docs` navigation-only rule when `phases.docs` (`:109–110`) has no conditional item, although the thinning plan shortens it. Add an `n/a`-able item, or state that the rule stays in prose.

6. **The "after" estimates are guesses, not drafts.** No thinned draft was written and counted. The per-section rows are not traceable to the REDUNDANT column either: for example, `## Resolved values` is marked 353 REDUNDANT but its estimate is 430 of 733.
   - Change: show the subtraction per row (today − removed − shortened = after), or label the estimates as unmeasured.

## Nice to Have

1. BP7's ref names `## What to check`, but the real heading is `## What to check (the parity checks)` (`business-parity-reviewer.md:126`). Use the exact heading.
2. Length is about 3 250 words without the template (3 625 total by `wc -w`). Trim to about 3 000.
3. Strengthen bug claim 1 with the two contradicting sentences below (`…_autonomous.md:93`, `user_review_fixes_instructions_autonomous.md:198`).

## Bug claims

- **Insertion-point-3 round collision: CONFIRMED.** The evidence:
  - `user_review_fix_plan_writing_instructions_core.md:97` says "Set `parity_iteration = 0`" unconditionally at every entry to step 7. No next-free resolution exists anywhere for this gate: grep for `parity_iteration` shows only `:95`, `:97`, `:104`, `:111`, `:117`.
  - The `findings_folder` is the flat `<state_dir>/business_parity_user_review_reviews/<branch>/` (`:103`).
  - `user_review_fix_plan_writing_instructions_autonomous.md:93` says "Neither gate folder is round-suffixed".
  - The agent writes `<findings_folder>/review_{iteration}.md` (`business-parity-reviewer.md:74`, `:194`) and is told not to re-derive `iteration` (`:75`). Its "next free index … at the gates that resolve it that way" clause does not apply here.
  - So a round-2 FAIL at iteration 0 overwrites round 1's committed `review_0.md`.

  It also contradicts two sentences in the same corpus:
  - `…_autonomous.md:93` says "a later round appends findings into the same folder".
  - `user_review_fixes_instructions_autonomous.md:198` says round-2+ folders "also carry earlier rounds' `review_<i>.md` files". Under the reset they are partly overwritten instead.

  The same pattern applies to `arch_iteration` (step 8, `:133` folder). A park-and-resume within one round (Override 2(a) → step 11 → step 6 → step 7) also re-executes "Set `parity_iteration = 0`". That is a second, intra-round collision source; it is UNCLEAR whether the resumed step 7 is meant to re-initialise the counter.
