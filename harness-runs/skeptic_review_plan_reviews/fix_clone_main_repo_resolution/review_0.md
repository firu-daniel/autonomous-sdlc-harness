# Review plan meta-review — iteration 0

## Must Fix
1. **The fix's acceptance check can never pass, and its grep proof leaves out a match** — refers to review finding #1. File: `harness-runs/skeptic_reviews/fix_clone_main_repo_resolution_skeptic_review/finding_1.md`.
   The **Fix.** paragraph ends: "Afterwards, `git grep -n 'clone itself' -- docs/watcher.md` must print only the new "never the clone itself" wording." That grep also matches `docs/watcher.md` → **The pins.** paragraph: "…; the clone itself is checked by `hr_wrapper_target_check_var`'s clone arm (…)". That sentence is correct, and it is out of this finding's scope. So after the prescribed replacement, the check still prints two lines.

   The **Why it is a required change** proof block has the same problem. It shows `git grep -n 'clone itself' -- docs plugin cli/src` printing only `docs/watcher.md:183`, but the command really prints line 111 as well.

   An implementer who follows the file alone will do one of two things. They may rewrite a correct sentence in **The pins.** to satisfy the check, which is scope creep that changes how the clone-arm check is described. Or they may report the finding as not closed. Either way the fix loop is stranded.

   **Fix:** In `finding_1.md`, make the acceptance check match only the stale text. For example: "Afterwards, `git grep -n 'in a clone it is the clone itself' -- docs/watcher.md` must print nothing, and **The pins.** paragraph's 'the clone itself is checked by' sentence stays unchanged." Then correct the proof block so it shows the command's real output, both line 111 and line 183. The other option is to narrow the proof's pattern to `'in a clone it is the clone itself'`, and say that line 111's match is a different, correct use of the phrase.

## Nice to Have
1. **Misattributed module step** — refers to review finding #1. File: `finding_1.md`. The text "**never** use `<copy>` in its place" is attributed to F8. In `plugin/instructions/main_repo_resolution.md` that phrase belongs to the **The stop.** paragraph (line 23). F8 is "Every check held: `<MAIN_REPO>` is `<candidate>`." Cite it as `## The fallback` → **The stop.**
