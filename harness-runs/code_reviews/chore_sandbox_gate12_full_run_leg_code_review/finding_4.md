### 4. The new `sandbox1h` §1 paragraph in `docs/cli.md` §5 cuts "That first arm" off from the precedence it refers to

**File:** `docs/cli.md` (`## 5. The wrapper-script contract`): "An adopter's forced run at a published `<version>`, with `HARNESS_SELF_ADOPT` unset, is *not yet measured*".

**The problem.** The branch inserted this paragraph directly after **Where a wrapper's body comes from**, and directly before the paragraph that opens "That first arm is now **reported rather than silently blessed**". "That first arm" refers to the first arm of the precedence in **Where a wrapper's body comes from** ("a **raw** line already in `commands.<key>` wins"). With the new paragraph in between, the nearest antecedent is a paragraph about a forced run's `== commands` rows, which has no arms. The reader is sent to the wrong referent.

**Fix.** Move the whole paragraph, unchanged, so it sits after the paragraph that begins "That first arm is now **reported rather than silently blessed**". That puts it directly before the paragraph that begins "**Two families land in `scriptsDir`, and only one of them is generated.**". Change no wording. This is a documentation edit only, so no test runs for this fix.
