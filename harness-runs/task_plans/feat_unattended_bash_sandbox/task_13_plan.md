### Task 13 — Document the sandbox block, the permission mode and the two new `doctor` checks in `docs/cli.md`

**Goal:** `docs/cli.md` is the reference for what the CLI writes and what `doctor` grades. Make it describe:

- the generated profile's `sandbox` block, the write protection, the credential denial and the network denies;
- the two unsandboxed wrappers and their target check;
- the `dontAsk` permission mode and its `acceptEdits` override;
- which phases run under the sandbox;
- the two new checks, `profile-sandbox` and `profile-write-protection`, including how `--remote-job` moves them.

Also correct every sentence of this file that says an unlisted or `ask`-matched call stalls an unattended run (scope register row 83).

**Depends on:**

- Task 15 — `permissions.defaultMode` is `"dontAsk"`, and the watcher's `PERMISSION_MODE` defaults to `dontAsk`. `acceptEdits` stays available as an override in `watcher.env`. Under `dontAsk`, a call matching neither `allow` nor `deny`, or matching an `ask` rule, is refused at once.
- Task 2 — the block, its excluded spelling `Bash(bash <repoRoot>/<scriptsDir>/{push,refresh}-branch.sh:*)`, the loopback entry and the opt-out marker.
- Task 23 — `sandbox.credentials` (`files` / `envVars`, `mode: "deny"`) and, per credential file, `permissions.deny` `Read(/<home>/<rest>)` and `Read(/<home>/<rest>/**)`.
- Task 3 — the protected set: the two wrappers and `lib/` in the main checkout; the hooks directory and `.mcp.json` in the main checkout and the worktree glob; `docs-search-server.sh` when retrieval applies; the plugin roots; the main repository's `.git/config` and `.git/config.worktree`.
- Tasks 4 and 24 — the per-working-copy config refusal, the hooks pin, and the target check: the target must be the main checkout or a worktree the main repository lists, with the main checkout taken from the script's own location.
- Tasks 6 and 7 — the two checks, their grades (`warn`, `fail` under `--remote-job`, the taken opt-out staying `warn`) and their place in `CHECKS` after `profile-deny-floor`.

This task describes them and changes none of them. Where this file and a module header would disagree, the header is the owner, and this file cites it.

### Targets

- `docs/cli.md` — `## 6. The failure modes the permission profile encodes`, `## 7. \`doctor\``, and the sentences scope register row 83 lists.

**Work:**

- [ ] §6: add a sub-part on the sandbox block, after the deploy paragraph, covering:
  - strict mode;
  - the permission mode: `dontAsk` is the default and refuses at once a call the profile neither allows nor denies, or that hits an `ask` rule. The override is set in the watcher's `watcher.env` (`docs/watcher.md` §4 owns that file), given in a fenced block:

    ```
    PERMISSION_MODE=acceptEdits
    ```

    Under it such a call prompts, and an unattended run stalls. This is one of the four places the override clause is stated (story `## Context`);
  - the network: `strictAllowlist` and its **unresolved** `--settings` scope, and that under `dontAsk` an unlisted host is refused either way, while under the override it is a prompt;
  - why the shipped domain list is empty but for the conditional loopback entry;
  - the two excluded wrappers, why only the main checkout's spelling, and the target check that refuses a repository a sandboxed command built;
  - the write-protection rule and its set;
  - the credential denial on both sides, and why the `Read` rules exist: `sandbox.credentials` reaches sandboxed Bash commands only.

  Every sandbox fact is phrased no more firmly than the task prompt's `## Verified facts` states it. Mark these as unresolved: the `--settings` scope of `strictAllowlist`, and headless honouring. State that `autoAllowBashIfSandboxed` is set to `false`, so the `allow` list stays the grant surface for Bash and the permission mode decides every call it does not list.
- [ ] §6: the per-phase statement the lessons ledger requires of a new execution environment (*"A new execution environment must state, for every configurable phase, whether that phase runs there"*):
  - **docs:** its writes are in the worktree, and the retrieval server runs outside the sandbox, so it runs.
  - **parity:** the reference toolchain's commands run sandboxed. They can read anywhere and write only to the worktree, the state directory and the temp directory, so a toolchain that writes elsewhere is refused.
  - **qa:** unmeasured. On macOS the dev server binds loopback under `allowLocalBinding`, and the poll reaches it through the loopback entry. On Linux each sandboxed command has a private loopback, so the server and the poll cannot meet.

  Then state residuals 1–3 from the story's context, each in one sentence. Do not list the `.git` pointer / `commondir` case as open; Task 24 covers it.
- [ ] §7:
  - **Table:** add two rows after `profile-deny-floor`, in `CHECKS` order:
    - `profile-sandbox` | the profile's sandbox block is what the configuration asks for
    - `profile-write-protection` | everything that runs outside the sandbox is write-protected on both sides
  - **Severity list:** add a bullet for each check beside the `profile-deny-floor` bullet, stating its grade and why. Name the remedy in a fenced block, one command per line:

    ```
    npx autonomous-sdlc-harness init --force
    ```

  - **`--remote-job` paragraph** (*"**`--remote-job`** grades the permission profile as a remote job needs it and changes no other check: …"*): update it so the checks it names, and the count in *"through those three failures"*, include the two new ones. State the opt-out exception.
  - **Opening paragraph** (register row 33): *"and `--remote-job` can, because it turns three profile warnings into failures"* becomes false once `profile-sandbox` and `profile-write-protection` also fail under the option. Rewrite it to the new set — the warnings of `profile-paths`, `profile-tracked`, `plugin-permissions`, `profile-sandbox` and `profile-write-protection` — and add that a taken sandbox opt-out stays a warning. Use the same count and the same exception as the `--remote-job` paragraph above, so the two cannot disagree.
- [ ] Unlisted-call sentences (register row 83): rewrite each to the story's canonical restatement — under the default `dontAsk` mode the call is **refused at once**. Keep the rule each sentence supports, and do not repeat the override clause outside §6. The sentences, by quoted anchor (line numbers are hints):
  - 71 *"an unattended run would stall on every wrapper"*;
  - 107 *"without which an unattended run parks at the first helper script with no error"* → is refused at the first helper script (register row 192). The same line's other stall-word use stays (row 83);
  - 140 *"a stall, not a refusal (§6)"*;
  - 193 *"an overwrite silently drops the entries added to close a stall"*;
  - 309 *"Drift between them is invisible until an unattended run stalls"*;
  - 312 *"exactly what stalls an unattended run on a permission prompt"*;
  - 329 *"cannot emit an entry that stalls"*;
  - 331 *"falls through to a prompt, and stalls"*;
  - 334 *"an `ask` there *is* the stall"*;
  - 422 *"What that costs is §6's stall rather than a failure"* and *"is the stall rather than the grant"*;
  - 434 *"What a missing entry costs is a **silent stall**"*.

  Leave 338 and 340 (un-loaded tool) and every other use of "stall".

**Verification:**

- Re-run scope-register derivation entry C:

  ```
  git grep -n -E 'profile-deny-floor|grades the permission profile as a remote job|whole grant surface' -- docs ARCHITECTURE.md README.md
  ```

  Its `docs/cli.md` hits must be ⊆ the register's rows 33–36.
- `grep -n 'three profile warnings' docs/cli.md` prints nothing, and the count the opening paragraph states equals the one the `--remote-job` paragraph states.
- Re-run derivation entry G's two commands with `-n` in place of `-l` and the pathspec `docs/cli.md`. Every remaining hit must be one a `no-change` row keeps: row 83's 107 stall-word use (its parks-at-the-first-helper sentence is row 192 and changes), 338, 340 or 406 by its quoted text, or row 144's evaluation-order sentence. The new §6 sentence stating the override is the one permitted new hit.
- `grep -n 'profile-sandbox\|profile-write-protection' docs/cli.md` hits the table, the severity list and the `--remote-job` paragraph.
- The check ids and titles in the table match `cli/src/doctor/checks.ts` byte for byte:

  ```
  grep -n "id: 'profile-" cli/src/doctor/checks.ts
  ```

- Every command an adopter is meant to run sits in a fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`).

- **Deviations from plan:**
  - The `profile-sandbox` table row carries the code's title byte for byte — *"the permission profile's sandbox block is what the configuration asks for"* (`cli/src/doctor/checks.ts` → `PROFILE_SANDBOX_CHECK`) — rather than the plan's *"the profile's sandbox block …"*, because the Verification bullet requires the titles to match `checks.ts` byte for byte.
  - The `profile-sandbox` severity bullet cites its grade's ground as *"the ground the bullet above gives"* rather than naming `profile-deny-floor`, so derivation entry C's `docs/cli.md` hits stay within register rows 33–36 (re-run: hits at the opening paragraph, the table row, the severity bullet and the `--remote-job` paragraph only).
  - The override is stated in one sentence plus the fenced `PERMISSION_MODE=acceptEdits` block the Work list requires, so derivation entry G's first command reaches two new lines (the sentence and the block's line), not one; every other remaining hit is 338, 340 or row 144's evaluation-order sentence.
  - Lines 140 and 329 restate the condition as *"matching no `allow` or `deny` entry"* rather than *"neither `allow` nor `deny`"*, which entry G's second command would otherwise still reach.
