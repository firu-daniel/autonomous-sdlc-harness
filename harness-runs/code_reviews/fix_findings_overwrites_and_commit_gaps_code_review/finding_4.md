### 4. `Override L` cites `## Override D` and `## Override E`, but both are level-3 headings

**File:** `plugin/instructions/user_review_fixes_instructions_autonomous.md` (`## Override L — commit the QA.0 UI-test plan augment (autonomous fork only)`, the paragraph after the fenced command) — "(`## Override D` → **Exact staging + commit.**)"

The new `Override L` paragraph cites three anchors in its own file: `## Override D` → **Exact staging + commit.**, `## Override E`, and `## Override D` → **Wrapper exit status (surface the error).** In this file both sections sit under `## Per-run statistics / Done summary` as **level-3** headings: `### Override D — commit the post-user-review statistics file in Phase D (autonomous fork only)` and `### Override E — push after the Override D direct-`git` commit (autonomous user-review-fix fork only)`. No `## Override D` or `## Override E` heading exists, so a reader searching for the cited heading text finds nothing. The bold labels themselves do resolve under `### Override D`. `.claude/context/plugin.md` → `## Citation` treats a cited heading as a wire, so the citation should carry the heading's real level.

**Fix:** in that one paragraph, change the heading level of the three citations and nothing else:

- `` (`## Override D` → **Exact staging + commit.**) `` → `` (`### Override D` → **Exact staging + commit.**) ``
- `` as in `## Override E`. `` → `` as in `### Override E`. ``
- `` as in `## Override D` → **Wrapper exit status (surface the error).** `` → `` as in `### Override D` → **Wrapper exit status (surface the error).** ``

No test file is involved, so this fix runs no test.
