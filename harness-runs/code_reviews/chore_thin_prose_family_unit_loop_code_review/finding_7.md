### 7. `.claude/context/conventions.md` cites the committer's **Fixed-form subjects** bullet for a rule that bullet no longer states

**File:** `.claude/context/conventions.md` (`### The order files are created, so a half-built feature is still coherent`), "A literal only one side knows about is a silent contract break (`plugin/agents/committer.md` → the **Fixed-form subjects** bullet)."

**Problem.** The cross-layer conventions document gives `plugin/agents/committer.md` → the **Fixed-form subjects** bullet as its evidence that a literal only one side knows about is a silent contract break.

On `dev` that bullet said so: "**The dispatching flows quote both strings, so an adopter whose `<commit_conventions>` changes either one changes those instruction files in the same edit** — a fixed subject that only one side knows about is a silent contract break." Task 10 cut the bullet to the two strings and "no caller may ask for another", and that sentence went with it. Nothing else in `committer.md` now states the rule (`grep -n "one side\|silent contract\|same edit" plugin/agents/committer.md` returns nothing).

The citation still resolves to a bullet, but the bullet no longer supports what it is cited for. The story index's `## Scope register` row 43 claimed Tasks 10–12 kept "the committer rules it cites (the **Fixed-form subjects** bullet …)", and they did not keep this one.

The same document already states the rule itself: `## Commit-message policy` → **Changing any fixed subject is a multi-file edit.**

**Fix.** In `.claude/context/conventions.md`, under `### The order files are created, so a half-built feature is still coherent`, replace

```markdown
A literal only one side knows about is a silent contract break (`plugin/agents/committer.md` → the **Fixed-form subjects** bullet).
```

with

```markdown
A literal only one side knows about is a silent contract break (`## Commit-message policy` → **Changing any fixed subject is a multi-file edit.** below).
```

Edit nothing else in that document, and do not add the sentence back to `plugin/agents/committer.md`.

The fix runs no test.
