### Task 16 — Correct the unlisted-call statements in the generators and the profile suite

**Goal:** Task 15 made `dontAsk` the unattended permission mode. Under it, a call that matches neither `allow` nor `deny`, or that matches an `ask` rule, is **refused at once** rather than stalling the run. Rewrite every comment and message in the profile and config generators, and in the profile suite, that still says such a call stalls, hangs, parks or prompts. Keep the rule each sentence supports: completeness, one string per entry, unquoted paths and the three wrapper forms all still matter, because a refused step is a missing step. These are scope register rows 53, 55, 57, 58, 60, 81, 124 and 172–178.

**Depends on:**

- Task 15 — the mode and its canonical restatement (story `## Context`). This task states the default only and does not repeat the `acceptEdits` override clause.
- Tasks 2, 3 and 23, which edit `cli/src/generators/permissionProfile.ts` and `cli/test/profile.test.mjs` first. This task edits only the sentences named below and nothing those tasks wrote.

**Where this task stops.** `init`, `doctor`, the daemon backend and the `init` suite are **Task 27's**. The shipped templates are **Tasks 15 and 17's**. An un-loaded MCP tool is not a call the mode decides, so every *"an un-loaded tool stalls"* sentence stays (rows 52, 59, and the kept lines of rows 58 and 81).

### Targets

- `cli/src/generators/permissionProfile.ts` — line hints 5–6, 11, 32, 98, 167, 674, 746, 893, 1086, 1708, and the pairing-invariant doc comment above `assertEveryScriptListed`, *"a dropped form is invisible until the run that used that spelling hangs."* (row 172). Keep 67, 1017 and 1048.
- `cli/src/core/templating.ts` — 55.
- `cli/src/generators/harnessConfig.ts` — 31.
- `cli/src/generators/scripts.ts` — 8–9, 32.
- `cli/src/detect/presets.ts` — 10, 877.
- `cli/test/profile.test.mjs` — 5–6, 287, 385, 404, 426, 574, and 727 (*"ends in the same silent stall the line is there to prevent"*, register row 124), and by quoted anchor (rows 174–178):
  - the header's continuation, *"There is no error, no prompt and no log line — the run parks."*;
  - `FILE_RULE_KINDS`' comment, *"a rule that matches nothing stalls exactly like a rule that is missing"*;
  - the helper-line comment, *"and the phase stalls at the first helper"*;
  - the scratch-runner case comment, *"invisible until the run that happened to use that spelling parks"*;
  - the assertion message, *"the only thing standing between an adopter and a stalled phase"*.

  Keep 593, the *"An entry for one of them is not a stall"* comment and the *"read once a run has already parked"* comment (row 179).

**Work:**

- [ ] `permissionProfile.ts`, module header and comments:
  - 5–6, the rule this module exists to enforce: *"that stalls an unattended run.** In print mode a tool call that matches neither `allow` nor `deny` does not prompt and does not fail — it hangs, and the run parks with no diagnostic"* → the rule stays. The consequence is now a refusal of the call under the default `dontAsk` mode. Do not claim the refusal is loud beyond what the mode does: the call is refused, and the run carries on without that step.
  - 11 *"falls through to a prompt and stalls"*.
  - 32 *"matching neither `allow` nor `deny`"*: add the consequence, a refusal.
  - 98 and 1708 *"the allow entries an adopter added to close a stall"* → to close a gap.
  - 167 *"an `ask` there is precisely the stall"*.
  - 674 *"reports a leftover token as the stall it would cause"*.
  - the pairing-invariant doc comment above `assertEveryScriptListed`, *"a dropped form is invisible until the run that used that spelling hangs"* → until the run that used that spelling is refused.
- [ ] `permissionProfile.ts`, the three user-facing messages:
  - 746 *"the shapes that stall an unattended run"*;
  - 893 *"the entry would fall through to a prompt and stall an unattended run"*;
  - 1086 *"which stalls an unattended run rather than failing it"*.

  Each becomes the refusal wording, and stays one sentence with its remedy. `cli/test/profile.test.mjs:287` asserts 893's substring. Change that assertion in the same edit to the new substring, so message and test move together.
- [ ] `templating.ts` 55, `harnessConfig.ts` 31, `scripts.ts` 8–9 and 32, `presets.ts` 10 and 877: rewrite each outcome clause. For `presets.ts` 877, *"a prompt parks an unattended run, a green-but-empty install does not announce itself"* → a refused command shows in the run, a green-but-empty install does not announce itself. Keep the rule each header exists to enforce verbatim.
- [ ] `profile.test.mjs` comments and messages:
  - 5–6, the suite's rule: *"an entry that matches neither `allow` nor `deny` stalls an unattended run, and nothing about a stall is loud"* → is refused. Keep *"There is no error … "* only as far as it stays true.
  - 385 *"which parks an unattended run"*;
  - 404 *"draws a prompt no unattended run answers"*;
  - 426 *"an `ask` entry is a prompt by another name, so it stalls a run"*;
  - 574 *"in print mode parks the run instead of refusing the call"*;
  - 727 *"which ends in the same silent stall the line is there to prevent"* → in the same refusal;
  - the header's continuation *"There is no error, no prompt and no log line — the run parks."* → state what the refusal leaves: the step does not happen, and nothing else in the run announces it. Claim no more than the mode does;
  - `FILE_RULE_KINDS`' *"a rule that matches nothing stalls exactly like a rule that is missing"* → is refused exactly like a rule that is missing;
  - *"and the phase stalls at the first helper"* → and the phase is refused at the first helper;
  - *"invisible until the run that happened to use that spelling parks"* → is refused;
  - the assertion message *"between an adopter and a stalled phase"* → and a phase whose helpers are refused. It is a failure message only, so no other case asserts it.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` passes. Then run `commands.typecheck` as written.
- Re-run derivation entry G's two commands with `-n` in place of `-l` and the six target paths as the pathspec. Every remaining hit must be a line this file lists as kept: un-loaded tools, row 179's *"is not a stall"* comment, and the new wording where it legitimately says *"neither `allow` nor `deny`"*.
- Re-run derivation entry H's first step and read its hits in the six targets. Every remaining one must be a line this file lists as kept, `scripts.ts`'s recursion assertion (row 180), or a park on a question file.
- Every message whose text changed is either asserted by a case edited here or by none. Check with `grep -rn` of each old substring under `cli/test`; it must print nothing.

- **Deviations from plan:**
  - The plan's line hints had shifted (Tasks 2, 3 and 23 landed first): its 746, 893, 1086, 1708, 1017, 1048 are now `permissionsOf`'s throw, `assertRunnable`'s `FORBIDDEN_IN_ENTRY` throw, `assertUsableInEntry`'s throw, `writePermissionProfile`'s doc comment, and the two un-loaded-tool sentences in `assertBrowserWiring`'s doc comment and message. Edited by anchor; the kept un-loaded-tool lines are untouched.
  - `cli/test/profile.test.mjs`'s "287" (`assertEntriesRunnable`) does not assert the generator's message: it is the suite's own parallel failure message. Both were rewritten to the refusal wording in the same edit, so the two still read alike.
  - The module header's rule sentence in `permissionProfile.ts` itself carried the stall word (*"an entry that stalls an unattended run"*), so the rule is kept in substance as *"an entry that costs an unattended run a step"*, followed by the `dontAsk` refusal consequence.
  - One unlisted sentence in a target was corrected with its neighbour: the scratch-runner case's `ask` assertion message, *"which prompts an unattended run"*, now *"which an unattended run refuses"*. It states the same outcome the plan's 426 comment does, and no case asserts it.
