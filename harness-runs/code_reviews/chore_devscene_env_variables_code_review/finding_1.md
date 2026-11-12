### 1. The shared guard library changed and `docs/guard-verification.md` carries no dated entry for it

> **Self-contained per-finding file** for the `chore_devscene_env_variables` code-review index (`harness-runs/code_reviews/chore_devscene_env_variables_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/guard-verification.md` (`### 1.5 Costs measured and not addressed`), immediately after the paragraph that opens "**2026-11-07: the sibling-stem arms granted directories outside the workspace, and the hole is CLOSED.**" and before the `---` rule that precedes `## 2. Standing decision matrices`.

**The problem.** This branch edits `plugin/hooks/lib/harness-config-lib.sh` (commit `7c0c94c5`, Task 14). It changes three lines: the `local root="${1-}" common="" anchor=…` declaration in `hc_main_root_var`, the `1. THE ANCHOR.` arm of that function's header comment, and the `main checkout` line of the header's `REPRO` block. `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts` states that **"A change to any guard or to the library re-measures itself in `docs/guard-verification.md`"**. Every earlier change to this library has a dated entry recording what changed and why no latency row was re-taken: the `2026-10-20` and `2026-10-29` `hc_main_root` entries, and the comment-only `2026-10-30` entry. This branch adds none. Its one edit to `docs/guard-verification.md` respells an existing record. A later reader has no record of this branch's change to the library and no evidence that the per-Bash-call path is unchanged.

The evidence the entry needs has already been taken on this branch. `git log --format='%h %s' 676e81d7..HEAD -- plugin/hooks` lists one commit, `7c0c94c5 chore: Task 14 — Rename anchor and QA keys in the plugin shell library`. `grep -n 'hc_main_root' plugin/hooks/*.sh` prints nothing and exits 1, so no guard calls `hc_main_root` or `hc_main_root_var`.

**Fix.** Run these three bare commands from the repository root:

```sh
git merge-base HEAD origin/dev
git log --format='%h %s' <merge-base>..HEAD -- plugin/hooks
grep -n 'hc_main_root' plugin/hooks/*.sh
```

Take `<merge-base>` from the first command's output. Then insert one paragraph at the site above, with a blank line on each side. Fill it in from the commands' real output:
- `<date>` is today's date in `YYYY-MM-DD` form;
- `<mb>` is the first eight characters of the merge base;
- `<tip>` is the first eight characters of a bare `git rev-parse HEAD`, run before this fix is committed;
- `<commit>` is the abbreviated hash the second command listed.

```markdown
**<date>: `hc_main_root_var`'s anchor read was edited, and no guard calls it.** `chore_devscene_env_variables` edited three lines of `plugin/hooks/lib/harness-config-lib.sh`: the `local` declaration in `hc_main_root_var` that reads the main-checkout anchor, the `1. THE ANCHOR.` arm of that function's header comment, and the `main checkout` line of the header's `REPRO` block. It changed no other file under `plugin/hooks/`. `git log --format='%h %s' <mb>..<tip> -- plugin/hooks`, from the branch's merge base with `origin/dev` to its tip, listed one commit, `<commit>`. `grep -n 'hc_main_root' plugin/hooks/*.sh`, run against `<tip>`, printed nothing and exited 1. The per-Bash-call path the §1.2 composite measures is therefore unchanged, and no latency row is re-taken.
```

If the second command lists more than one commit, or the third prints any line, do not write the paragraph. Report the output as a blocker instead, because the claim would then be false.

The paragraph names no variable and says no name changed (`harness-runs/lessons.md` → *Adopter-facing documentation*, the breaking-rename rule). This fix edits no test file, so it runs no test.
