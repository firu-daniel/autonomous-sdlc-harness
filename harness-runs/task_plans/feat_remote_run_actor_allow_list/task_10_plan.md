### Task 10 — Describe the allow-list in `docs/github-issue-trigger.md` and `docs/github-run-control.md`

**Goal:** The two GitHub-coupling documents say who may act now: a person with `write` or `admin` **whom `HARNESS_RUN_ACTORS` admits**, or a listed bot. Each states the list's default and `*`. Every passage that still says *"anyone with write access"* is corrected.

**Depends on:** Tasks 2, 3 and 5. This task describes behaviour they ship, so it must not describe anything else:
- **The grammar** (story index `## Context`):
  - the value is comma-separated, trimmed, empty entries dropped, compared case-insensitively;
  - `*` admits every writer;
  - unset admits the repository owner alone in a user-owned repository, and nobody in an organisation-owned one.
- **The order:** shape, then the bot list, then the permission call, then the list. A non-writer's refusal still names write access, and the list refusal names `HARNESS_RUN_ACTORS`.
- **A `repository_dispatch`** whose sender is a `User` must be on the list. With the list not `*`, a missing sender is refused; a bot sender is unchanged.
- **A close** by an unlisted writer is ignored. A branch deletion still screens bots only.
- **The trigger and control workflows** pass the variable through `env:`.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read `.claude/context/conventions.md` (`general`'s own rules). Read `.claude/context/cli.md` too, because the behaviour described is that layer's. Apply the lessons ledger's adopter-facing-documentation rules:
- every command an adopter runs sits in its own fenced block, one command per line;
- the prose says *allow-list*, the term adopters arrive with, while `HARNESS_RUN_ACTORS` stays the wire name.

### Targets

- `docs/github-issue-trigger.md`: `## Turning it on, in short` steps 5 and 6, `## 1. What happens when an issue is labelled` (the refusal list), `## 3. Who can start a run`, and `## 5. Working the run` (the *"**Without one**"* paragraph).
- `docs/github-run-control.md`: `## The GitHub entry point` (the opening paragraph, setup step 8, and *"2. What a team member with write access then does"*), `## 1. Commands in a comment` → *"Who and where."*, `## 4. The draft pull request` (the two *"with write access can … request changes"* lines), `## 6. Who can act, and pull requests from forks`, and `## 7. Working a run from both sides` (*"**The Run workflow form stays the fallback.**"*).

**Work:**

- [ ] **`docs/github-issue-trigger.md`, §1 and §3.**
  - **§1, the refusal list.** Add the list refusal after item 6, as item 7: *"the labeller is a `User` with write access whom `HARNESS_RUN_ACTORS` does not admit (§3)"*.
  - **§3.** Rewrite its bold opening sentence and bullets so a person needs `admin` or `write` **and** admission by the list. Then add a paragraph on the list:
    - what it is;
    - its default, with the organisation case and how to set it;
    - `*`;
    - why the permission check comes first.
  - **§3's `repository_dispatch` line** (*"the holder of the token that sent it is the authority"*): state the new `User`-sender check.
- [ ] **`docs/github-issue-trigger.md`, `## Turning it on, in short` and §5.**
  - **§5, the *"**Without one**"* paragraph.** It says the **Run workflow** form is still available. Add that a `run` dispatched from the form, by `gh workflow run` or as a re-run launches nothing for a person the allow-list does not admit (§3), because `harness-run.yml`'s run job checks `github.triggering_actor` first.
  - **`## Turning it on, in short`.** Add the allow-list to step 5, which becomes *"Optionally, rename the label, admit bots, or name who may act"*, with these fenced blocks:
  ```
  gh variable set HARNESS_RUN_ACTORS --body <login>,<login>
  ```
  ```
  gh variable set HARNESS_RUN_ACTORS --body '*'
  ```
  Say that an organisation-owned repository must set it, because unset admits nobody there. In step 6, add that `--check-github` names the effective list. Point at `docs/remote-execution.md` → `## 9. Credentials and billing` for which value fits which credential.
- [ ] **`docs/github-run-control.md`, `## The GitHub entry point` and §1.**
  - Replace *"anyone with write access can start and work runs from GitHub"* with the people the allow-list admits, defaulting to the owner.
  - Make setup step 8 *"Set a credential secret, and name who may spend it"*, linking `remote-execution.md` → `## 7.` step 4.
  - Retitle *"2. What a team member with write access then does"* to name a member the list admits.
  - In §1 *"Who and where."*, add the list to the check, still citing the trigger's §3 as its owner.
- [ ] **`docs/github-run-control.md`, §4, §6 and §7.**
  - **§4.** A round starts only for a reviewer the list admits, so the two *"with write access can … request changes"* lines say so. Note the solo-maintainer consequence: a reviewer other than the pull request's author must also be on the list.
  - **§6, *One check, shared with the trigger*.** Add the list bullet, its default and `*`.
  - **§6, *Closing and deleting*.** A close by a writer the list does not admit is ignored. A deletion still screens bots only, with the reason: deletion already needs write access, and a stop spends no credential.
  - **§6.** Add one sentence on what the list does not close: a writer can still read the secret through an edited workflow. Link `remote-execution.md` → `## 9.`
  - **§7, *"The Run workflow form stays the fallback."*** Replace *"A maintainer with no local setup can still work any remote run"* with a person the allow-list admits, and say that the run job refuses a `run` dispatched or re-run by anyone else (§6).

**Verification:**

- Re-run the scope register's derivation entry 1 (story index `## Scope register`), the widened command with the `Run workflow` and `team member` patterns. Every hit in these two files is either a row this task changed (rows 1–4, 6–10, 29 and 32) or a row the register marks `no-change` with its reason (rows 5, 27, 28, 30 and 31). No hit in these two files falls outside the register.
- Each new `gh variable set` command stands alone in its own fenced block.
- Every cross-document anchor this task adds resolves to a heading that exists, by `grep -n '^## '` on the target file: `remote-execution.md` → `## 9. Credentials and billing` and `## 7. Turning it on`.
