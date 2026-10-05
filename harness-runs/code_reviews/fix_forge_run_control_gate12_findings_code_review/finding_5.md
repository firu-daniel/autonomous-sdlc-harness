### 5. The `actions: write` line of the permissions comment lost its column alignment

**File:** `cli/templates/github/workflows/harness-control.yml` (header, `# THE PERMISSIONS` block) — "#   actions: write        dispatch, pause, stop and cancel runs, and read"

**The problem.** The edit that wrapped the `contents: write` line also removed one space from the `actions: write` line. Its description now starts one column left of the other three entries (`contents`, `issues`, `pull-requests`) and of its own continuation line `#                          runs and their artifacts`. This file is one an adopter receives and is invited to tune, so the comment should read as one aligned table.

**Fix.**

- [ ] Restore the space: the line becomes `#   actions: write         dispatch, pause, stop and cancel runs, and read` (nine spaces between `write` and `dispatch`), so `dispatch` starts in the same column as `push`, `reply` and `read` on the neighbouring lines.
