### 4. The path-placeholder sentence that 22 agents carry verbatim was forked in `layer-implementer` and `layer-reviewer`

**Files:**
- `plugin/agents/layer-implementer.md` (`## Resolved values`, preamble), "Ordinary **path placeholders** are deliberately not listed: `<layer>`"
- `plugin/agents/layer-reviewer.md` (`## Resolved values`, preamble), "are deliberately not listed — the body resolves each where it appears:"

**Problem.** On `dev`, the clause `deliberately not listed — the body's own text resolves each where it appears` appeared verbatim in 22 agent definitions, these two among them. On `HEAD` it appears in 20 (verified with `git grep -l -F "deliberately not listed — the body's own text resolves each where it appears" dev -- plugin/agents` and the same against `HEAD`). `committer.md` kept it; the two family files forked it:
- `layer-implementer` dropped the clause and replaced the dash with a colon.
- `layer-reviewer` reworded it to "the body resolves each".

Two rules forbid that drift:
- `.claude/context/plugin.md` → `## Writing agent prose` → **Each rule is stated once.**: "A block several agents carry is one wording, copied byte-for-byte into every copy".
- The story index's own `## Scope register`: row 80 (`layer-reviewer`) and row 89 (`layer-implementer`) mark the sentence "kept byte-for-byte (cross-family)" and allow shortening "only the enumeration after the colon". The changed text sits before the colon.

A later thinning pass or sweep that greps for the shared clause will now miss these two copies.

**Fix.** Restore the shared clause in each file and keep each file's shortened enumeration.

`plugin/agents/layer-implementer.md`: replace

```markdown
Ordinary **path placeholders** are deliberately not listed: `<layer>`, `<heading>`, `<detail_file>`, `<findings_file>`, `<filename>`, `<old>` / `<new>`.
```

with

```markdown
Ordinary **path placeholders** are deliberately not listed — the body's own text resolves each where it appears: `<layer>`, `<heading>`, `<detail_file>`, `<findings_file>`, `<filename>`, `<old>` / `<new>`.
```

`plugin/agents/layer-reviewer.md`: replace `are deliberately not listed — the body resolves each where it appears:` with `are deliberately not listed — the body's own text resolves each where it appears:`. Leave the rest of the sentence and its enumeration unchanged.

This adds 9 words to `layer-implementer` and 2 to `layer-reviewer`. Both stay far below their `Before` figures in the story index's `## Up-front word counts` (6246 and 3819), which is the measure this branch applies `.claude/context/plugin.md`'s word-count rule against. Do not edit the story index.

- [ ] Make both replacements above.
- [ ] Re-run `git grep -l -F "deliberately not listed — the body's own text resolves each where it appears" -- plugin/agents`. It must list 22 files, `layer-implementer.md` and `layer-reviewer.md` among them.

The fix runs no test.
