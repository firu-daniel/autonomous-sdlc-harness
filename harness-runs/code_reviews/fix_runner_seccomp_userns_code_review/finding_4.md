### 4. `SANDBOX_PREREQUISITES_CHECK`'s doc comment points to `gradeSandboxPrerequisites` for the cases, then restates three of them

**Site:** `cli/src/doctor/checks.ts` → the doc comment on `const SANDBOX_PREREQUISITES_CHECK`, the three bullets *"**A failed nested check** is a `fail` in both modes, the AppArmor file reading as context."*, *"**A missing piece** is a `warn`, a `fail` under `--remote-job` ({@link CheckContext.remoteJob})."* and *"**An `uncertain` AppArmor answer** warns only where the nested check did not run."*

**Problem.** The comment says the grade comes from *"{@link gradeSandboxPrerequisites}, whose doc comment lists the cases"*, and then restates three of those cases in its own words. `gradeSandboxPrerequisites`'s doc comment is now the one place the grading rule is written down, and it also governs the pure function the tests hold to the rule. Restating it in the check's comment gives the rule a second owner in the same file. A later change to the grading will update one of the two comments and leave the other stale. The one bullet that belongs on the check is the opt-out, because it is decided in `run` before the grader is reached.

**Fix.**

- [ ] Delete those three bullets from the `SANDBOX_PREREQUISITES_CHECK` doc comment. Keep the opening sentence and the **A taken opt-out** bullet, so the comment reads:

  ```ts
  /**
   * Can this host start the sandbox an unattended run needs? Graded from {@link probeSandboxHost}'s
   * facts by `doctor/sandboxPrerequisites.ts`'s {@link assessSandboxHost}, then by
   * {@link gradeSandboxPrerequisites}, whose doc comment lists the cases; no table value is re-spelled.
   *
   * - **A taken opt-out** ({@link sandboxOptedOut}; a `ctx.config` of `undefined` is not one) is a `pass`
   *   ahead of the probe: the sandbox is not required, and `profile-sandbox` reports the choice.
   */
  ```

This is a comment-only edit, and it needs no test.
