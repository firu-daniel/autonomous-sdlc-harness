# Task plan review — iteration 0

## Must Fix

1. **Scope register: the derivation misses the "every other `.bak` is left visible" statements** — story index (`fix_self_adopt_regeneration_friction_story_plan.md`), `## Scope register`.
   Both derivation entries were re-run verbatim, and every hit is a row (rows 1–11). The register's own scope covers the durable text stating *"the state-dir README re-run row"*, and goal 3 is about `.bak` files that `git status` never shows. No entry reaches two durable-corpus sites that state the opposite of what this branch documents. A third site is created by Task 5:
   - `docs/cli.md` → `## 3. The re-run contract`, the row "`.gitignore`'s `.bak` lines for the two workflows and the permission profile", which ends *"Every other `.bak` a forced run takes is deliberately left visible."* After Task 6, row 1 of that same table says that a `.bak` taken inside a contents-ignored directory is named in the notes *"because `git status` never shows it"*. The two rows of one table would then contradict each other.
   - `cli/templates/repo/gitignore`, the `{{harnessBackups}}` comment, which ends *"Every other .bak a forced run writes is left visible on purpose."* This is an adopter-facing template, and the writer contract counts that as durable corpus. It is not application source.
   - The repository-root `.gitignore` managed block. Task 5's third Work bullet copies that same template comment into it (*"add the template's `# The copies \`init --upgrade-workflows\` and \`init --force\` take …` comment"*), so this branch writes the false sentence into this repository too.
   - The wider command below also reaches `docs/cli.md` → `## 3`, the `.github/workflows/harness-control.yml` row (*"That `.bak` is left visible rather than ignored"*). It needs a row, most likely `no-change`.

   A corrected derivation entry, strictly wider than entry A. It is read-only, and it was run on this tree:
   ```
   git grep -nE 'HARNESS_SELF_ADOPT|HARNESS_CLI([^_]|$)|per-directory READMEs|README\.md\.bak|left visible' -- '*.md' 'cli/templates/repo/gitignore' '.gitignore' ':!harness-runs/**'
   ```
   **Fix:** In the story index, replace entry A with the command above, or add it as a third entry. Add one register row per site it newly reaches: `docs/cli.md:184`'s row, `docs/cli.md:200`'s row, the `cli/templates/repo/gitignore` comment, and the root `.gitignore` copy. Give each a `Disposition`.
   - A `change` on the template comment is a `cli`-layer edit. It needs a `cli` task, or an extension of one within its budget, ordered before Task 5. Task 5 then copies the corrected line.
   - The `docs/cli.md:200` row is Task 6's. Its `### Targets` and `**Work:**` gain it.
   - A `no-change` needs a reason that survives Task 6's new row-1 wording sitting beside it.

   Re-run the closure test after the change.

2. **The carried-row wording is false on an unforced self-adopt run** — `task_3_plan.md`.
   Work bullet 1 passes `carryOnDiskCommandLines: selfAdopt` whether or not `--force` is given. Task 1's arm applies whenever the option is on, so `written[].carried` is also true on a plain `HARNESS_SELF_ADOPT=1 … init` re-run. On that run `create-if-absent` keeps the wrapper untouched (`cli/src/core/writer.ts` → `resolve`, `create-if-absent`: `if (!replace) return { request, effect: 'kept' }`). Work bullet 2 still prescribes the carried row *"… kept by this self-adopt run and re-rendered into the current template"* for every `wrapper.carried`. Nothing is re-rendered on that run, so the report states something that did not happen.
   - `cli/src/commands/init.ts` → `keptWrapperBody` returns the on-disk body when `force` is false. The plan never says which of the two rows wins when both apply.
   - Neither new suite has an unforced self-adopt arm, so no test catches this.

   **Fix:** In `task_3_plan.md`, choose one of these and state it:
   - (a) pass the option only on a forced self-adopt run (`selfAdopt && ctx.flags.force`), and say so in `SELF_ADOPT_ENV`'s doc comment; or
   - (b) make the carried row's wording depend on `force`, with the "re-rendered into the current template" clause printed only when the file is in fact replaced.

   Add a case to `cli/test/self-adopt-force.test.mjs` that runs `init` with the variable and without `--force` over the hand-set wrappers. Assert that the files are byte-identical and that the row printed makes no re-render claim.

## Should Fix

1. **Name where `displayPath` lives** — `task_3_plan.md`, Work bullet 3. It says *"made repo-relative with the existing `displayPath`"*, but that function is exported from `cli/src/core/writer.ts` and is not in `init.ts` today. Cite it as `cli/src/core/writer.ts` → `displayPath` so the implementer imports it instead of writing a second copy (`.claude/context/conventions.md` → *"Before adding a copy of anything, grep for it"*).

2. **Make the adopter perturbation one input apart** — `task_3_plan.md`, Work bullet 4. The ordinary-fixture arm says *"no harness identity, so the variable is inert"* but never says the variable is set. State that the arm runs with `HARNESS_SELF_ADOPT=1`, as the story index's `Top risks:` describes. Without it, the pair differs in two inputs (identity and variable), and the arm does not show that the variable is inert outside this repository.
