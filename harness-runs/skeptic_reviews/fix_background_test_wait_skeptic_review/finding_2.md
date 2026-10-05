### 2. The template sentence lists three forbidden shapes, then gives its reason for "either shape"

> **Self-contained per-finding file** for the `fix_background_test_wait` skeptic-review index (`harness-runs/skeptic_reviews/fix_background_test_wait_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Severity:** Nice to Have (wording).

**Files:** the same sentence appears in both of these:

- `cli/templates/claude/context/conventions.md`, in the "What belongs here" bullet that begins "Logging, error handling, and the testing bar".
- `cli/templates/claude/context/layer.md`, in the bullet that begins "What \"done\" means here".

The sentence in both is: "never `cd <dir> && …`, never piped, and never with its output redirected to a file — because a unit runs it unattended, where either shape can be refused and nobody can approve it."

**Problem.** Code-review Finding 3 added "never piped", so the sentence now forbids three shapes: a `cd` compound, a pipe and a redirect. Its reason clause still says "either shape", which was written when there were only two. An adopter reading the template, or `/autonomous-sdlc-harness:harness-analyze` filling it in, gets a reason that grammatically covers two of the three shapes. Both files ship to every adopter through `init`.

**Fix.** In **both** template files, replace

> where either shape can be refused and nobody can approve it

with

> where any of those shapes can be refused and nobody can approve it

Change nothing else, and keep the two sentences byte-identical. To verify, run `grep -rn "either shape" cli/templates/claude/context/`, which must return nothing. No test run is involved.
