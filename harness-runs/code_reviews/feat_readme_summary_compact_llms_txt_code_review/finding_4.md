### 4. The README's *git only* bullet now says `init` "refuses" outside a repository, dropping "offering to create one"

**File:** `README.md`, `## Scope and limits` → `### The shape of the system`, the bullet opening "**git only.**", at "`init` refuses outside a repository"

On `dev` this bullet said `init` "refuses to run outside a repository, offering to create one". The compacted bullet keeps only "`init` refuses outside a repository". That now reads as an unconditional refusal.

The linked destination says otherwise. `docs/cli.md` §2's bullet "**Not inside a git repository, and the run was not told to create one.**" describes three outcomes:

- `--git-init` creates the repository and the run continues.
- On a terminal without that flag, `init` asks first.
- Only a run that cannot be asked refuses.

A reader who stops at the README would conclude they must `git init` by hand before adopting. That is not true, and the pre-compaction text did not say it.

**Fix.** In `README.md`, in the *git only* bullet, replace

"No SVN, no Mercurial; `init` refuses outside a repository; a `jj` repository adopts in both shapes."

with

"No SVN, no Mercurial. Outside a repository, `init` offers to create one, and refuses when it cannot ask. A `jj` repository adopts in both shapes."

Leave the rest of the bullet and its bold lead words, **git only.**, unchanged.
