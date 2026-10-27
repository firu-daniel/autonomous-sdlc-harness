# Task plan review — iteration 0

## Must Fix

1. **Gate 15's "changes nothing outside its own temp area" claim becomes false, and no derivation entry reaches it** — story index (`fix_sandbox_probe_round1_findings_story_plan.md`, `## Scope register`), `task_1_plan.md`, `task_3_plan.md`.
   Scope-register disposition (ii). Task 3 makes teardown create a new `sandbox-probe-evidence.XXXXXX` directory under `TMPDIR`, outside `SP_TMP`, and leave it in place whenever a leg does not pass. Task 1's new paragraph describes that directory as separate from the temp area: *"before teardown removes its temp area, into a new `sandbox-probe-evidence.<suffix>` directory under `TMPDIR`"*. Two places still state the opposite as a guarantee:
   - `docs/development.md` → the `**Gate 15 — the unattended sandbox probe (macOS).**` paragraph, the bold sentence *"**It changes nothing outside its own temp area, the probe clone and the probe branch**"*. This is a corpus site. None of the four derivation entries reaches it, and it is not a register row. Task 1's Verification bullet makes it impossible to fix: *"No sentence in `docs/development.md` other than the eight Expected cells and the new paragraph changed"*.
   - `scripts/sandbox-probe.sh`, header comment: *"It changes nothing outside its own temp area, the probe clone and the probe branch."* Task 3 owns this file and edits its header and `usage()`, but leaves this sentence as it is.

   Newly reached site: `docs/development.md` → the Gate 15 paragraph's sentence *"It changes nothing outside its own temp area, the probe clone and the probe branch"*.
   Corrected derivation entry 3, strictly wider than the one on the page (one alternation added):
   ``git grep -nE 'http://127\.0\.0\.1/|http://169\.254\.169\.254/|harness-gates\.XXXXXX"`|printenv <name>|bash scripts/test.sh` as one exact call|exits 0 or 4|git fetch origin`; `git stash|nothing outside its own temp area' -- docs README.md ARCHITECTURE.md``
   **Fix:**
   - In the story index, replace derivation entry 3 with the command above. Add a register row for the Gate 15 sentence, disposition `change`, owner Task 1.
   - In `task_1_plan.md`, add a `**Work:**` clause that amends that sentence to name the kept evidence directory as the one exception (non-passing legs only, under `TMPDIR`, printed last). Widen the Verification bullet *"No sentence … other than the eight Expected cells and the new paragraph changed"* so it also allows that one sentence.
   - In `task_3_plan.md`, add the same correction to `scripts/sandbox-probe.sh`'s header sentence, beside the header line it already adds.

2. **Derivation entry 4 reaches lessons the register does not list** — story index (`fix_sandbox_probe_round1_findings_story_plan.md`, `## Scope register`).
   Scope-register disposition (i). I ran the entry's first step (`grep -nE '^## |^- ' harness-runs/lessons.md`) and applied its stated decision rule (*"a rule is reached when it names a temporary working copy or process, a bounded retry or wait, a measurement or a document of record, or a command an adopter runs"*). That reaches these rules, none of which is a row:
   - `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…"*. It names a measurement.
   - `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future: record the verdict and the change it names, but never write the change into other documents as pending work…"*. It names a recorded verdict in a document of record.
   - `harness-runs/lessons.md` → *"A process that turns off a shared switch another actor can turn on must check the enabling condition again…"*. It names a process, under the reading "a temporary working copy, or a process" that the decision rule's wording allows.
   **Fix:** add one register row for each rule above, each with its disposition and reason (for example, `no-change`: this branch makes no design decision from a stubbed figure; it writes no decision-rule outcome into another document; it switches off no shared switch). If the third rule is not meant to be reached, narrow the decision rule's wording to *"a temporary working copy or a temporary process"* instead, so the procedure and its rows agree.

## Should Fix

1. **Task 1's evidence paragraph would separate the command block from its lead-in** (`task_1_plan.md`). The `CS1's probe set includes…` paragraph ends *"…holding the clone until Enter:"* and introduces the fenced command block directly below it. Inserting a new paragraph "after" it puts prose between that colon and its block. Place the evidence paragraph after the fenced block, before `**The rows this probe does not take…**`. Update register row 23's "after the leg table" to match.
2. **`td2-forms.jsonl` carries `/var/folders/…` while the same task requires `@FIXTURE_ROOT@` for every path** (`task_13_plan.md`). Either spell the refused forms' paths under `@FIXTURE_ROOT@`, or state in Fixture hygiene that the elided `/var/folders/…` text is a quoted refusal string and names no machine path.

## Nice to Have

1. **The `sp__wp_tracked` case may not reproduce the defect** (`task_14_plan.md`). 5,000 names of the form `f<n>.txt` make roughly 50 KB of `git ls-files` output, which is below a 64 KiB pipe buffer. `README.md` also sorts first, so the old `printf | grep -qxF` may not get `Broken pipe` at all. Size the list above 64 KiB (more files or longer names) so the case fails against the old code.
2. **TD2's amended check could name the `--allowedTools "Bash(printenv TMPDIR)"` departure of the new `mktemp-tmpdir` session** (`task_16_plan.md`), as the other amended rows name theirs.
3. **Small wording clash in `task_5_plan.md`**: *"Task 16 amends no row this task touches"* is followed at once by *"CS3's expected column is Task 16's"*.
