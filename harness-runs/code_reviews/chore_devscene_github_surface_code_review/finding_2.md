### 2. `LEGACY_TRIGGER_LABEL` is still described as "the previous release's" default, which this branch made false

**Files:**
- `cli/src/remote/githubActions.ts` (`LEGACY_TRIGGER_LABEL`, its doc comment) — "The previous release's {@link DEFAULT_TRIGGER_LABEL}."
- `cli/templates/scripts/remote-run.sh` (the `# THE LEGACY LABEL.` header paragraph) — "only the previous release's workflow, which"
- `scripts/remote-run.sh`, the self-adopted copy of the template above, at the same paragraph and the same quoted substring.

Before this branch, `DEFAULT_TRIGGER_LABEL` was `sdlc-harness` and `LEGACY_TRIGGER_LABEL` (`harness`) was the default of a release before that. This branch moves the default to `devscene`. Once it ships, "the previous release" is the one whose default was `sdlc-harness`, and that release's trigger workflow passes a non-empty `HARNESS_TRIGGER_LABEL` (`vars.HARNESS_TRIGGER_LABEL || 'sdlc-harness'`). Both comments now say two false things:
- that `harness` was the immediately preceding default;
- that the immediately preceding release's workflow is the one that passes an empty label.

The TypeScript doc comment is one this branch edited: it reworded the sentence that follows it, "only that release's trigger workflow", and kept the stale opener. `.claude/context/cli.md` → `## What "done" means here` holds a change to the header it touches. The shell paragraph is unedited, but this branch's change to `DEFAULT_TRIGGER_LABEL` is what made it false. `remote-run.sh` declares the mirror itself (its header's `LEGACY_TRIGGER_LABEL         mirrors  LEGACY_TRIGGER_LABEL` line), and its paragraph is where a reader learns which workflow takes the empty-label path.

**Fix:**

1. In `cli/src/remote/githubActions.ts`, in the doc comment above `export const LEGACY_TRIGGER_LABEL = 'harness';`, replace

   ```ts
    * The previous release's {@link DEFAULT_TRIGGER_LABEL}. The trigger still accepts it when its
   ```

   with

   ```ts
    * An earlier release's {@link DEFAULT_TRIGGER_LABEL}. The trigger still accepts it when its
   ```

   Change nothing else in the comment or the constant.

2. In `cli/templates/scripts/remote-run.sh`, in the `# THE LEGACY LABEL.` paragraph, replace

   ```bash
   # `HARNESS_TRIGGER_LABEL`; only the previous release's workflow, which
   ```

   with

   ```bash
   # `HARNESS_TRIGGER_LABEL`; only an earlier release's workflow, which
   ```

3. Make the identical one-line change in `scripts/remote-run.sh`, so that its content stays byte-identical to the template. `git ls-files -s` must show the same blob id for the pair, with the copy keeping its `100755` mode. Copy the template's content over the copy, or edit the copy the same way. Change no file mode.

No test file is edited by this fix, and no literal value changes. The unit loop runs any tree guard whose `treeGuards` glob covers `cli/src/remote/githubActions.ts`, `cli/templates/scripts/remote-run.sh` or `scripts/remote-run.sh`, and the full suite runs in the Run gates phase.
