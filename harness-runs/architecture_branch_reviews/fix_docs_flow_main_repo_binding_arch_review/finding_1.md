### 1. Declare `<repo_root>` in `branch-start-docs-autonomous.md`'s `## Resolved values` table

**Severity:** Should Fix. This is a token-declaration gap, not a layer-placement or dependency-direction violation, so it does not block.

**Site:** `plugin/commands/branch-start-docs-autonomous.md`:
- `## Resolved values`, the lead paragraph's closing sentence, *"`$REPO_ROOT` is step 1's runtime anchor, not a config value; a command spells it as `<repo_root>`, the literal path it resolves to."*
- `## Hard boundary`, the sentence *"via `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal"*.

**Problem.** This branch adds the token `<repo_root>` to the docs engine command's body, in the hard boundary's push spelling. The token is runtime-derived, and it is declared only in a prose sentence of the lead paragraph, not as a row of the file's `## Resolved values` table.

`.claude/context/plugin.md` → `## The sections an asset carries` requires every command file to carry a `## Resolved values` table *"declaring each configuration- or runtime-derived token once, ahead of the body that uses it as an ordinary placeholder"*. `## The placeholder vocabulary` adds that a token's `Class` must be stated rather than left to the reader.

The sibling engine commands do not have this gap:
- `plugin/commands/branch-start-plan-autonomous.md` and `plugin/commands/branch-start-user-review-fix-autonomous.md` name `<repo_root>` as a mode-contract binding they supply to their forks.
- The docs fork, `plugin/instructions/docs_orchestration_instructions_autonomous.md`, declares no bindings. It gives `<repo_root>` its own `## Resolved values` row.

So in the docs command `<repo_root>` is neither a table row nor a binding. A reader that resolves tokens from the table finds nothing for it.

**Fix.** Edit `plugin/commands/branch-start-docs-autonomous.md` only:
1. In the `## Resolved values` table, add this row immediately after the `<MAIN_REPO>` row:
   `| <repo_root> | derived at runtime | The absolute root of the checkout this run is executing in — the run copy, or the main repo in the manual entry point — which step 1 derives from a **bare** `git rev-parse --show-toplevel` and writes `$REPO_ROOT`. A command spells it as the literal absolute path it resolves to, never through a substitution or a variable. |`
   In the file, wrap `<repo_root>` and the `git rev-parse` command in backticks to match the other rows.
2. In the lead paragraph:
   - Change *"except `<MAIN_REPO>`, which is derived at runtime"* to *"except `<MAIN_REPO>` and `<repo_root>`, which are derived at runtime"*.
   - Delete the closing sentence *"`$REPO_ROOT` is step 1's runtime anchor, not a config value; a command spells it as `<repo_root>`, the literal path it resolves to."*, because the new row now carries it.
3. Leave the `<MAIN_REPO>` row byte-identical. `cli/test/main-repo-resolution-corpus.test.mjs` uses that whole row as its needle. Do not add a second copy of the resolution clause or of the literal-spelling sentence: the new row's wording above deliberately differs from both, so the suite's per-file counts stay at 1.

**Verification.** Re-read the edited table and confirm that every `<…>` token the body of `plugin/commands/branch-start-docs-autonomous.md` uses is either a table row or one of the path placeholders the lead paragraph lists.
