### Task 27 — Correct the unlisted-call statements in `init`, `doctor`, the daemon backend and the `init` suite

**Goal:** Under the `dontAsk` mode Task 15 made the default, a call that matches neither `allow` nor `deny`, or that matches an `ask` rule, is **refused at once** rather than stalling the run. Rewrite every comment and user-facing message in `init`, `doctor`, the daemon backend and the git module's header that still says such a call stalls, hangs or parks with no error. Update the `init` suite's assertions on that text in the same edit. These are scope register rows 51, 54, 56, 80, 125, 129 and 167–171.

**Depends on:** Task 15 — the mode and the story's canonical restatement. This task states the default only and does not repeat the `acceptEdits` override clause. Tasks 6 and 7 add checks to `cli/src/doctor/checks.ts` first; this task edits none of their lines.

**Where this task stops.** The generators and the profile suite are **Task 16's**. `checks.ts` 4980 and 5048 describe an un-loaded MCP tool and stay (row 56).

### Targets

- `cli/src/commands/init.ts` — line hints 44, 1100, 1108, 3035, 3117.
- `cli/src/doctor/checks.ts` — 3328, 3439, 4655, 4812 (row 56), and, by quoted anchor (rows 167–171):
  - the `profile-paths` doc comment, *"a command matching neither `allow` nor / `deny` does not prompt in print mode, it hangs."*;
  - the `plugin-permissions` doc comment, *"which turns that stall into a copy-paste"*;
  - the **Under `--remote-job`** paragraph, *"so a gap is a launch that parks rather than an operator's paste"* and *"a missing shell grant has not been observed to stall a run"*;
  - the comment *"complete that is one unreadable file away from a stall"*;
  - the user-facing `jobClause` message, *"so a gap here is a launch that parks rather than an operator's paste"*.
- `cli/src/core/git.ts` — the module header's invariant 2, *"is a different string and stalls on a / prompt (`docs/config.md` §1)"* (row 129).
- `cli/src/daemon/backend.ts` — 15.
- `cli/test/init.test.mjs` — 39–40, 6080, 6095.
- `cli/test/doctor.test.mjs` — the `plugin-permissions` suite's doc comment, *"costs a silent stall"* (line hint 4745; register row 125).

**Work:**

- [ ] `init.ts`:
  - 44 *"which in an unattended run is a stall rather than a refusal"* → is a refusal;
  - 1100 *"an unattended run that stalls on every wrapper"*, and the 1108 message *"so an unattended run would stall on every wrapper"* → would be refused at every wrapper;
  - 3035, the doc comment *"a missing permission entry is a silent stall on the first unattended run"* → a refusal at the first helper the run reaches. The point that an adopter must act **before** that run stays.
  - 3117, the printed closing step *"parks at the first helper script it reaches, with no error"* → is refused at the first helper script it reaches.
- [ ] `checks.ts`:
  - 3328 *"a wrapper entry that moved into it is the stall rather than the grant"* → the refusal rather than the grant;
  - 3439, the `doctor` message *"matches neither allow nor deny and an unattended run hangs there with no diagnostic rather than failing"* → is refused there;
  - 4655 *"**silent stall** — a run that reaches one of these helpers with nothing matching parks with no …"*;
  - the 4812 symptom string `'parks with no error at the first helper script it reaches'` → `'is refused at the first helper script it reaches'`.
- [ ] `checks.ts`, the further sites (rows 167–171):
  - the `profile-paths` doc comment's *"does not prompt in print mode, it hangs"* → is refused in an unattended run;
  - the `plugin-permissions` doc comment's *"which turns that stall into a copy-paste"* → which turns that refusal into a copy-paste;
  - the **Under `--remote-job`** paragraph: *"a launch that parks rather than an operator's paste"* → a launch whose helper calls are refused rather than an operator's paste. *"a missing shell grant has not been observed to stall a run on a person's machine"* is an observation; restate it as not observed to stop a run, and claim nothing further;
  - the comment *"one unreadable file away from a stall"* → one unreadable file away from a refused helper;
  - the `jobClause` string: replace *"a launch that parks rather than an operator's paste"* with the same words as the doc comment above. Before editing, `grep -rn "launch that parks" cli/test` and confirm it prints nothing; it printed nothing while planning, so no case moves with it.
- [ ] `backend.ts` 15 *"and which stalls rather than failing"* → and which an unattended run refuses. `git.ts` invariant 2 *"is a different string and stalls on a / prompt"* → is a different string, which an unattended run refuses. Keep the `docs/config.md` §1 citation.
- [ ] `init.test.mjs`:
  - 39–40 header *"which in an unattended run is a stall"*;
  - 6080 *"has parked with no error"*;
  - 6095, the assertion `assert.match(step, /no error/, 'the permissions half does not say the run stalls silently…')`. Re-key it to the new consequence word in the 3117 message (`/refused/`), and reword its failure message to match.

  - `doctor.test.mjs` 4745 *"an entry whose form drifted by one character matches nothing at run time and costs a silent stall"* → costs a refusal at run time. No case in `cli/test` asserts the old 3439, 4655 or 4812 text; this was checked while planning.

**Verification:**

- `npm test --workspace cli -- test/init.test.mjs` and `npm test --workspace cli -- test/doctor.test.mjs` pass. Both are edited by this task. Then run `commands.typecheck` as written.
- `grep -rn -E 'hangs there|parks with no error|parks at the first helper|launch that parks|it hangs\.' cli` prints nothing.
- Re-run derivation entry G's two commands with `-n` in place of `-l` and the six target paths as the pathspec. Every remaining hit must be a line a `no-change` row keeps for these files: `checks.ts` 4980 and 5048 (row 56) and its evaluation-order sentences (row 132), `git.ts`'s unanswerable-probe comment (row 130), `init.test.mjs`'s un-loaded-tool comment (row 137), or init.ts's interactive-prompt sentences that state no unattended outcome.
- Re-run derivation entry H's first step and read its `checks.ts`, `init.test.mjs` and `doctor.test.mjs` hits: every remaining one is a park on a question file (rows 181, 182) or the CLI's own interactive prompt.
- The 3117 closing step is exercised end to end by the `init.test.mjs` case at 6095, which drives the compiled `init` and reads its printed step.
