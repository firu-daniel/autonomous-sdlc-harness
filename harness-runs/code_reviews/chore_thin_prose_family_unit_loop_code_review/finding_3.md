### 3. `layer-reviewer`'s intro says `Write` is "no licence to change the tree" while its contract requires a findings-file `Write`

**File:** `plugin/agents/layer-reviewer.md` (intro, the `**You report findings. You do not implement fixes.**` paragraph), "are no licence to change the tree"

**Problem.** Task 6 thinned the paragraph to: "The missing `Edit` closes only that tool: `Write` and the probe route in `## Process` are no licence to change the tree."

Read literally, that conflicts with two writes this same file requires:
- `## Output contract` branches 2 and 3 `Write` `<findings_folder>/review_{iteration}.md`, which sits in the checkout's tree under `<state_dir>`.
- `**Run the probe that would settle it.**` has the reviewer write its probe as a file under `<state_dir>/scratch/`.

The `dev` wording ("You do not implement fixes", with the allowlist explanation) barred fixing, not writing. The paragraph's bold lead still says what is barred: fixes. The sentence after the colon should say the same.

**Fix.** Replace `are no licence to change the tree.` with `are no licence to fix anything.`. The resulting paragraph:

```markdown
**You report findings. You do not implement fixes.** The missing `Edit` closes only that tool: `Write` and the probe route in `## Process` are no licence to fix anything. This is **a rule you keep, not a boundary the tool layer enforces**.
```

The bold lead `**You report findings. You do not implement fixes.**` is a cross-family copy (story index `## Scope register` row 112). Leave it byte-for-byte; edit only the text after it. The edit lowers `wc -w` by 1.

The fix runs no test.
