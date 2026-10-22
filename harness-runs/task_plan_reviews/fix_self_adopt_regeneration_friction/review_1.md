# Task plan review — iteration 1

## Must Fix

1. **Scope register: no derivation entry reaches the other "kept by what the run measures" statements** — story index (`fix_self_adopt_regeneration_friction_story_plan.md`), `## Scope register`.
   I re-ran both derivation entries verbatim. Every hit is a row: entry A gives rows 1, 3–12, 14 and 15, and row 13 is the declared future hit. Entry B gives rows 1 and 2. The two round-0 Must Fix items are resolved in the artifact.
   Tasks 2 and 7 add the state-dir READMEs to the set of artifacts `--force` keeps conditionally. Row 2 already turns `docs/cli.md` §3's *"three further artifacts"* into four. No entry reaches two other durable-corpus statements that enumerate that same set:
   - `docs/cli.md:18`, the `--force` row of the global options table: *"Three more things are kept by what the run measures rather than by name (§3 for all three): a conventions document …, `.claude/CLAUDE.md` when regenerating it would write the same bytes, and … every `allow` entry naming a plugin root …"*. After Task 7, §3 lists four and this row still says three. The same document would then disagree with itself.
   - `docs/analyze.md:80`, *"**Two artifacts are kept instead, on what the run measures rather than by name** (`docs/cli.md` §3)"*. This one probably stays `no-change`, because it is scoped to what a forced run costs the analysis and a README is not an analysis artifact. It still needs a row that says so.

   A corrected entry B, strictly wider than the one on the page. It is read-only, and I ran it on this tree. It reaches `docs/analyze.md:80`, `docs/cli.md:18`, `docs/cli.md:186` and `docs/cli.md:206`:
   ```
   git grep -nE 'kept conditionally|three further artifacts|rewritten a contract sentence|what the run measures' -- '*.md' ':!harness-runs/**'
   ```
   **Fix:** In the story index:
   - Replace entry B with the command above.
   - Add a register row for `docs/cli.md` → the `--force` row of the options table (`"Three more things are kept by what the run measures"`), Disposition `change`, owned by Task 7.
   - Add a row for `docs/analyze.md` → *"What a forced setup re-run costs the analysis"*, with a Disposition and a reason.
   - Add the `docs/cli.md` options-table row to `task_7_plan.md`'s `### Targets`, and give it a `**Work:**` clause that names the state-dir README keep beside the other three. That task's Work already holds five bullets, so fold this into the existing `docs/cli.md` §3 bullet rather than adding a sixth. Then run the closure test again.

2. **The planned `REPRO` rows cannot reproduce, because the header's own `run()` helper pins `HARNESS_CLI`** — `task_4_plan.md` (and, downstream, `task_7_plan.md`).
   `cli/templates/scripts/restart-watcher.sh` defines its REPRO helper as `run() { PATH="$w/bin:$PATH" HARNESS_CLI=hcli bash "$d/scripts/restart-watcher.sh" "$@"; echo "exit $?"; }`. In bash, an assignment that prefixes the inner `bash` command overrides any value the caller put in front of `run`. So `HARNESS_CLI='hcli --via' run` still runs the script with `HARNESS_CLI=hcli`. It records `daemon stop` / `daemon install`, not `--via daemon stop` / `--via daemon install`. Likewise `HARNESS_CLI=' ' run` restarts through `hcli` and exits 0, not 1. The existing `no CLI` row (`HARNESS_CLI=definitely-not-installed run`) has the same defect today.
   This hits three places:
   - Task 4's Work bullet 4 adds the `multi-word` and `blank` rows in exactly that form.
   - Task 4's second Verification bullet (*"Each new `REPRO` row reproduces by hand"*) cannot pass.
   - Task 7's §1.5 bullet records exits and calls *"measured by reproducing the script's own `REPRO` rows by hand … as observed"*, so it would write a measured fact into `docs/outer-loop-verification.md` that is false, or one that contradicts Task 4's suite.

   **Fix:** In `task_4_plan.md`, Work bullet 4, also change the REPRO preamble's helper so an outer value wins, for example `HARNESS_CLI="${HARNESS_CLI:-hcli}"` inside `run()`. State that this also makes the existing `no CLI` row reproduce. Then the `multi-word`, `blank` and `no CLI` rows are each one input away from `idle`. In `task_7_plan.md`'s §1.5 bullet, note that the rows are measured with that corrected helper.

## Should Fix

1. **Name the closing count in the `--force` bullet too** — `task_7_plan.md`, the `docs/cli.md` §3 Work bullet. The bullet at `docs/cli.md:206` states the count twice. Once in *"The same property reaches three further artifacts"*, which the plan names. Again in its closing sentence, *"three artifacts are kept against it by what the run measures; and one is replaced without it"*. Name both so the implementer does not correct one and leave the other.

2. **Two doc comments in `scripts.ts` go stale and are not named** — `task_1_plan.md`, Work bullet 4.
   - `WrittenWrapper.command`'s comment says *"whichever of its three precedences won"*, and the new arm makes it four.
   - `wrapperCommandLine`'s comment says *"Its one caller is `doctor`'s `daemon-path` check"*. That is already false, because `init.ts` → `keptWrapperBody` calls it, and it gains `readWrapperBody` as a caller in this task.

   Add both to the doc-comment updates. This follows `.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*, and here it applies to symbol doc comments a reader takes as guarantees.
