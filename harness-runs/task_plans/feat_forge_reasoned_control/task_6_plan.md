### Task 6 — Report mentions in `doctor` and `init`, and warn on a control workflow that passes no credential

**Goal:** Make the two CLI surfaces that describe run control say what an adopter can now do. `doctor`'s `forge` pass line and `init`'s closing summary say that a mention of `@sdlc-harness` anywhere in a comment is read by an agent. That agent carries out `answer`, `pause`, `resume` or `status`, and asks to confirm `stop` or `clear`. Add a `forge` warning for a present `harness-control.yml` that passes the agent no credential. That is a copy written before this release, whose mentions are all answered *"not read"* until `init --force` replaces it.

**Depends on:**

- **Task 1.** It exports, from `cli/src/remote/githubActions.ts`, `MENTION_ACT_VERBS` (`['answer', 'pause', 'resume', 'status']`) and `MENTION_CONFIRM_VERBS` (`['stop', 'clear']`), both `readonly CommandVerb[]`. This task names verbs only through them.
- **Task 5.** It makes the shipped `harness-control.yml` carry, on its act step, `IN_OAUTH: ${{ github.event_name == 'issue_comment' && secrets.CLAUDE_CODE_OAUTH_TOKEN || '' }}` and the matching `IN_API` line for `secrets.ANTHROPIC_API_KEY`. It also adds the comment-only `Fetch the pinned plugin` step. A copy carrying neither `secrets.CLAUDE_CODE_OAUTH_TOKEN` nor `secrets.ANTHROPIC_API_KEY` is an older one, and it lacks that step too, so the one predicate below marks it.

**Where this task stops.** `doctor` grades local evidence only (`cli/src/doctor/checks.ts` → `FORGE_CHECK`'s header): it reads the workflow's text and asks GitHub nothing, and the new warning never fails. The prose of record describing the check (`docs/cli.md`) is **Task 11**'s.

### Targets

- `cli/src/remote/githubActions.ts` — a `carriesMentionCredential` predicate beside `carriesRunActors`.
- `cli/src/doctor/checks.ts` — `FORGE_CHECK`'s new warning, its pass text and its header comment.
- `cli/src/commands/init.ts` — the run-control summary line (*"a comment starting ${COMMAND_HANDLE} followed by …"*).
- `cli/test/doctor.test.mjs` and `cli/test/remote-names.test.mjs` — their cases (Task 1 also edits `remote-names.test.mjs`).

**Work:**

- [ ] `githubActions.ts`: add `export function carriesMentionCredential(workflowText: string): boolean`. It is true when the text contains `secrets.${OAUTH_TOKEN_SECRET}` or `secrets.${API_KEY_SECRET}`, built from the existing constants and never retyped. Its doc comment follows `carriesRunActors`'s: `false` marks a `harness-control.yml` written before a mention could be read. It is pure; the caller reads the file.
- [ ] `checks.ts` `FORGE_CHECK`: where `forgeTriggerApplies(ctx.config)` holds and `WORKFLOW_CONTROL_PATH` is present, read it as the `listless` computation does, with a read that throws skipped. When `!carriesMentionCredential(text)`, join one more warning in the same way `listlessWarning` is joined, on every return path that carries it: absent, not carried and present. The warning text:
  - `${WORKFLOW_CONTROL_PATH}` passes the mention agent no credential secret, so a mention of `` `${COMMAND_HANDLE}` `` anywhere in a comment is answered that it was not read;
  - the `` `${COMMAND_HANDLE} <verb>` `` commands still work;
  - `` `${CLI} init --force` `` replaces it, and the scripts, after a .bak (docs/remote-execution.md, section 7, Upgrading).

  The worst grade stays `warn`. Extend the check's header comment, which today enumerates *"A fourth, joined to whichever of those fires"*, with this fifth warning and why it is local evidence.
- [ ] `checks.ts` pass text and `init.ts`'s summary line: keep the existing `` `${COMMAND_HANDLE} <verb>` `` / `nameList([...COMMAND_VERBS])` wording. Add that a mention of `${COMMAND_HANDLE}` anywhere else in a comment is read by an agent, which carries out `nameList([...MENTION_ACT_VERBS])` and asks the commenter to confirm `nameList([...MENTION_CONFIRM_VERBS])`. Every verb comes from the constants (`.claude/context/conventions.md` → `## Configuration is the source of truth…` and the shared-constant owners rule).
- [ ] Tests:
  - `remote-names.test.mjs`: `carriesMentionCredential` is true for a text carrying either `secrets.` reference and false for one carrying neither. It is also true for the shipped template `cli/templates/github/workflows/harness-control.yml`, read from `PACKAGE_ROOT`.
  - `doctor.test.mjs`: grep for the existing `forge` cases (search `listless`, `HARNESS_RUN_ACTORS` and `comments and reviews start nothing`). Add a case where a fixture's `harness-control.yml` has both `secrets.` lines removed: `forge` warns, naming `init --force` and the mention. Assert that a freshly `init`-written fixture's `forge` line carries no such warning. Update any assertion pinned to the old pass text.
  - Grep `cli/test` for the old `init` summary sentence and update any assertion on it; list each file edited in the return.

**Verification:**

- `commands.typecheck` exits 0.
- `npm test --workspace cli -- test/doctor.test.mjs` and `npm test --workspace cli -- test/remote-names.test.mjs` pass, along with any other test file this task edited. Run each on its own as one plain foreground command from the repository root.
- End to end: in a throwaway fixture adopted with `forge` `github` and `execution.target` `github-actions`, run `doctor`, and the `forge` line names mentions with no credential warning. Delete the two `IN_` lines from `.github/workflows/harness-control.yml` and run `doctor` again: the line warns, naming `init --force`, and `doctor` still exits by its own contract for a `warn`.

**Deviations from plan:**

- The end-to-end bullet was carried out by the two new `doctor.test.mjs` cases rather than a separate manual run: each adopts a throwaway fixture with `forge` `github` and remote execution on, runs the compiled `doctor`, and asserts the pass line (no credential warning) and, with both `secrets.` lines deleted, the `warn` line naming the mention and `init --force` with exit status 0.
- `cli/test/trigger-workflow-init.test.mjs` also edited: it holds the assertion on `init`'s run-control summary sentence, and now also asserts the new mention clause.
