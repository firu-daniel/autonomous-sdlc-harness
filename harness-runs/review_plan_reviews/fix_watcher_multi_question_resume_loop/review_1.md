# Review plan meta-review — iteration 1

## Must Fix
1. **Finding 4's fix adds a new false list and leaves three sentences with the same false claim unfixed** — refers to review finding #4. Change `harness-runs/code_reviews/fix_watcher_multi_question_resume_loop_code_review/finding_4.md`. If the title changes, also update the index `harness-runs/code_reviews/fix_watcher_multi_question_resume_loop_code_review.md` (readiness entry 3 and the `### 4.` pointer).

   The defect the finding reports is real. On `dev`, no shipped file outside `plugin/` cited the clarification-channel anchor. On this branch, `docs/watcher.md` → `## 4. Pausing, parking and the usage gate` cites it by file **and** heading. The fix as written has two problems.

   - **The added sentence gives a list that is incomplete.** It says there is "One out-of-scope document that does not ship". The fix also rewrites the relocation paragraph to "…apart from the one `docs/watcher.md` citation named above". There is a second non-shipped citer, and it predates the branch: `.claude/context/plugin.md` → `## The placeholder vocabulary` names `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`. `git grep -ln "Clarification channel" dev -- . ':!plugin' ':!harness-runs'` already returns it on `dev`. So applying the fix as written puts a new false list into a shipped contract. The paragraph being edited says of this same set that "no list of it here is closed: re-derive it from a repo-wide grep at move time".
   - **Three more sentences make the claim the finding calls false, and the fix leaves all three alone:**
     - `plugin/instructions/mode_contract.md` → the bold Class (i-b) title: "**Class (i-b) — fork-owned sections every autonomous flow cites that *can* reach a family-neutral core without stranding anything out of scope: the one out-of-scope file that mentions them, `autonomous-watcher.sh`, mentions them only in forms a move leaves true.**"
     - the same file, same paragraph as the fix's third bullet: "What makes this the cheapest of the anchor follow-ups is that the whole repoint set is in scope, **not** that it is short."
     - `plugin/instructions/task_plan_writing_instructions_autonomous.md` → the **What `<scripts_dir>/autonomous-watcher.sh` resolves — and what it does not.** paragraph: "and every citer a **rename** would strand is in scope". A rename of `## Clarification channel — file format (canonical, single source of truth)` would strand the new `docs/watcher.md` citation.

   The fix loop would mark Finding 4 `[x]` while the corpus still states the false claim in three places. After the fix, it would also contradict itself: the Reason paragraph would carve out an exception that the class title, the "cheapest" sentence and the owning fork still deny.

   **Fix:** In `finding_4.md`, rewrite the **Fix** so every site is corrected the same way and nothing lists the citers as a closed set:
   (a) Keep the "shipped" qualifier edits to the Reason sentence.
   (b) Replace the sentence that names only `docs/watcher.md` with one that says non-shipped documents in the harness repository also cite the channel anchor by file and heading. Give `docs/watcher.md` and `.claude/context/plugin.md` only as examples ("for example"). Say those citers are found by the same repo-wide grep, and do not claim a count.
   (c) Change the relocation-paragraph edit so it drops "the one `docs/watcher.md` citation" and refers to those non-shipped citers generally.
   (d) Add sub-steps with exact before/after text for the Class (i-b) bold title, for the "whole repoint set is in scope" sentence, and for the fork's "every citer a **rename** would strand is in scope" sentence.
   (e) Add a verification sub-step that runs `git grep -in "clarification channel" -- . ':!plugin' ':!harness-runs'`. It must confirm that every hit is either `autonomous-watcher.sh` (shipped, prose-only) or a non-shipped document the amended text covers.

   The severity can stay `## Should Fix`.
