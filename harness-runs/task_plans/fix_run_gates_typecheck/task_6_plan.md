### Task 6 — The implementer contract and the test-run rule say what a failing whole-tree type check means

**Goal:** State, in `unit_loop_core.md` → `## The test-run rule` and in `layer-implementer.md`, what a unit does when its whole-tree `<typecheck_cmd>` fails for a cause outside its own change, and make "deferred to the Run gates phase" name only something Phase G actually runs. The scenewise records mixed the Verification-deferral rule with the evidence-downgrade rule and called a never-run check "deferred". After this task neither file allows that.

**The decision (restated in the story index's `## Context`).**

- A unit still runs `<typecheck_cmd>` **as written, with no path argument**: the whole tree.
- If that run fails, and **every** failure it reports lies outside the unit's change, the unit records an **evidence downgrade** and does not block. Outside the change means the failure names no file this unit created or edited and no symbol it defined or changed. The downgrade names the command as run, its verdict line, each failing check and file, why each lies outside the change, and that the Run gates phase's whole-tree `<typecheck_cmd>` run is what verifies it.
- A failure the unit's change caused is the unit's to fix. One it cannot fix stays a **transient blocker** (`blocker: <one-line cause>`).
- A path-narrowed `<typecheck_cmd>` run, where the wrapper's line accepts paths, is **supplementary** evidence. It is labelled as narrowed and never reported as the whole-tree result.
- "Deferred to the Run gates phase" may name only `<test_cmd>`, the whole-tree `<typecheck_cmd>`, or a test file the suite runs. A gate script that neither configured command runs is recorded as *not run, and no phase of this flow runs it*.

**Depends on:** Task 4, which makes `plan_orchestration_instructions_core.md` → `## Phase G — Run gates` run the whole-tree `<typecheck_cmd>` and `<test_cmd>` through one wrapper call per round, and which this task cites. Task 7 then restates the result in the autonomous fork's "the Run gates phase is the verification gate" sentence by pointer to point 2 below.

### Targets

- `plugin/instructions/unit_loop_core.md`: `## The test-run rule` points 1 and 2 only.
- `plugin/agents/layer-implementer.md`: **What you run, in every mode.**; **The row-`G.4` check, before any edit.** (the fix-site fallback bullet); **An evidence downgrade is recorded, in every mode.**; **Standing-prohibition disposition.**; `## Output contract` item 5.

**Work:**

- [ ] `unit_loop_core.md` → `## The test-run rule`:
  - Point 1: change "The full suite runs once per Run gates phase" to say that the full suite and the whole-tree `<typecheck_cmd>` run once per Run gates round, through its wrapper, at the cited `## Phase G — Run gates`.
  - Point 2: expand "**A unit runs `<typecheck_cmd>`.**" with the decision above: whole tree, no path argument. A failure wholly outside the unit's change is an evidence downgrade that Phase G verifies, a failure the change caused is the unit's to fix or a blocker, and a narrowed run is supplementary and labelled. `layer-implementer.md` owns how the downgrade is recorded.
  - Keep the heading byte-identical and leave the roster untouched (no new citer is added).
- [ ] `layer-implementer.md` → **What you run, in every mode.**: narrow "*deferred to the Run gates phase*" so it is written only for `<test_cmd>`, the whole-tree `<typecheck_cmd>`, or a test file the suite runs. Any other gate script is recorded as *not run, and no phase of this flow runs it*.
- [ ] `layer-implementer.md` → **An evidence downgrade is recorded, in every mode.**: add the whole-tree-typecheck case to the list of claims set out to execute and could not, with the required content above. State that this downgrade is **not** a blocker, and that writing "deferred" with no failing-check list is the false report this paragraph's closing test already names.
- [ ] `layer-implementer.md` → **Standing-prohibition disposition.**: in the transient list, change "a failing `<typecheck_cmd>`" to "a failing `<typecheck_cmd>` whose failure this unit's change caused", and point to the downgrade paragraph for the outside-the-change case. In **The row-`G.4` check** → **Fix-site fallback**, add that for a `none — typecheck …` finding the unit's own whole-tree `<typecheck_cmd>` run is the after-result to report.
- [ ] `layer-implementer.md` → `## Output contract` item 5, first sub-bullet: add a fourth wording beside the existing three, **failed outside this unit's change — evidence downgrade recorded; verified by the Run gates phase**, and say that a narrowed run's result is reported as narrowed, never as the whole-tree result.

**Verification:**

- `grep -n 'deferred to the Run gates phase' plugin/agents/layer-implementer.md` prints only lines that limit it to `<test_cmd>`, the whole-tree `<typecheck_cmd>` or a test file the suite runs.
- `grep -n "a failing \`<typecheck_cmd>\`" plugin/agents/layer-implementer.md` prints only the caused-by-this-change wording.
- `grep -n '^## The test-run rule' plugin/instructions/unit_loop_core.md` still prints the heading. The roster lines under **Who may cite this.** are unchanged (`git diff -U0 -- plugin/instructions/unit_loop_core.md` touches no `- \`${CLAUDE_PLUGIN_ROOT}/` roster line).
- Walk the scenewise case against the new text. A whole-tree typecheck failing on `ruff format` over a run artifact the unit never touched now yields a downgrade naming that check and file, and Phase G's whole-tree run catches it. A unit that broke a signature used by an untouched file still blocks or fixes, because the failure names a symbol the unit changed.
