### 5. `layer-reviewer` rewrote the site-anchor definition that six other agents carry verbatim

**File:** `plugin/agents/layer-reviewer.md` (`### 3. At least one Must Fix`), "Each finding's location is its site anchor:"

**Problem.** The site-anchor definition is the parenthetical `(the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)`. On `dev` it appeared verbatim in seven agents:
- `architecture-reviewer`
- `branch-reviewer`
- `business-parity-reviewer`
- `layer-reviewer`
- `review-plan-reviewer`
- `skeptic-reviewer`
- `user-review-fix-plan-writer`

On `HEAD`, `layer-reviewer` is missing from that list: Task 7 rewrote its copy as a colon clause ending "and a line number only as a trailing hint". You can confirm with `git grep -l -F "a line number may follow as a navigation hint, and nothing depends on it" dev -- plugin/agents` and the same against `HEAD`.

The rewrite also changed the substance: "nothing depends on it" was dropped. That clause is the half of the definition that stops a reviewer from writing a finding whose location only a line number resolves.

`.claude/context/plugin.md` → `## Writing agent prose` → **Each rule is stated once.** requires one wording "copied byte-for-byte into every copy". The story's D3 split rule missed this copy because the shared text sits inside a longer sentence.

**Fix.** Replace the paragraph that opens `### 3. At least one Must Fix`:

```markdown
Save `<findings_folder>/review_{iteration}.md` in this format. Each finding's location is its site anchor: the repo-relative path plus the symbol, heading or short quoted substring locating the change — a quoted substring beside any symbol whose body spans more than the change, a bare path only when the change is the whole file, and a line number only as a trailing hint.
```

with

```markdown
Save `<findings_folder>/review_{iteration}.md` in this format. Each finding's location is the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it).
```

This adds about 8 words. `layer-reviewer` stays far below its `Before` figure of 3819 in the story index's `## Up-front word counts`. Do not edit the story index.

- [ ] Make the replacement above.
- [ ] Re-run `git grep -l -F "a line number may follow as a navigation hint, and nothing depends on it" -- plugin/agents`. It must list seven files, `layer-reviewer.md` among them.

The fix runs no test.
