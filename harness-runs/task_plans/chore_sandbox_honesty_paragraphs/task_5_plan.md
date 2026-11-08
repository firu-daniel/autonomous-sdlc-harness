### Task 5 — Carry Task 1's edits into the self-adopted `scripts/scratch-run.sh`, `scripts/commit-on-branch.sh` and `harness-runs/scratch/README.md`

**Goal:** Each self-adopted copy of a template Task 1 edited is byte-identical to its template again, as the task prompt requires for `scripts/scratch-run.sh` and `scripts/commit-on-branch.sh`, and as `init` would leave the scratch directory's README.

**Depends on:** Task 1, which edited three templates, comments and prose only:

- `cli/templates/scripts/scratch-run.sh` — the `# WHAT THIS DOES NOT CONTAIN.` paragraph;
- `cli/templates/scripts/commit-on-branch.sh` — *"row CS2, owed"* became *"row CS2, pass"* in `# WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX.`;
- `cli/templates/state-dir/scratch/README.md` — the *"Two boundaries an agent does not cross."* paragraph.

Before this task each copy is byte-identical to its template's previous content, so applying Task 1's diff, and nothing else, restores the identity. This task authors no wording.

**This is a catch-all task** (`path` `"."`): its implementer reads every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record`: `scripts/` and `harness-runs/` at this root are `init`'s output in this checkout.

**If an edit is refused.** In a run copy (a clone) none of the three is write-protected: the profile protects the **main** checkout's outer-loop scripts (`cli/src/generators/writeProtection.ts` → `protectedPaths`). In job mode the session's checkout is the main checkout, so `scripts/scratch-run.sh` and `scripts/commit-on-branch.sh` are protected there and an `Edit` is refused at once. On a refusal, quote it, revert any copy already edited so no copy is half-changed, and record the disposition: the story index's **Manual setup required** routes the copies to the post-merge re-render of the self-adopted scripts. Do not route around a refusal with a shell write.

### Targets

- `scripts/scratch-run.sh`
- `scripts/commit-on-branch.sh`
- `harness-runs/scratch/README.md`

**Work:**

- [ ] For each target, apply exactly the change Task 1 made to its template — the same old text replaced by the same new text, read off `git diff --no-index <copy> <template>`, which before this task shows Task 1's edit and, for the two scripts, also an `old mode 100755` / `new mode 100644` pair: the templates are tracked `100644` and the self-adopted copies `100755`. That mode line is expected and is **not** carried over — with the file tool, so each file keeps its mode (`0755` for the two scripts).
- [ ] Change nothing else in any of the three.

**Verification:**

Content is compared with `cmp`, never `git diff --no-index --exit-code`: the latter also compares modes and exits 1 on the two scripts even when their bytes are identical.

- `cmp cli/templates/scripts/scratch-run.sh scripts/scratch-run.sh` exits 0.
- `cmp cli/templates/scripts/commit-on-branch.sh scripts/commit-on-branch.sh` exits 0.
- `cmp cli/templates/state-dir/scratch/README.md harness-runs/scratch/README.md` exits 0.
- `git ls-files -s scripts/scratch-run.sh scripts/commit-on-branch.sh` still shows mode `100755` for both.
