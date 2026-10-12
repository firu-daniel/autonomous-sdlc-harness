### Task 14 — Document the `sandbox` keys in `docs/config.md` and the sandbox object in `ARCHITECTURE.md`

**Goal:** Complete the configuration key's four-place contract with its `docs/config.md` §5 rows. Correct `ARCHITECTURE.md`'s permission-model row, which calls `permissions` and `enabledMcpjsonServers` *"the whole grant surface of an unattended run"*. Once this branch lands, that surface also includes the `sandbox` object.

**Depends on:**

- Task 1 — the keys, as `cli/src/config/model.ts` declares them:
  - `sandbox.allowedDomains`: an array of `{ domain, reason }`. Default none. `domain` is a bare hostname or IPv4 literal, with no scheme, port, path or wildcard.
  - `sandbox.optOut`: `{ reason }`. Never a default.
- Task 12 — the schema property those rows describe.
- Task 15 — the unattended permission mode is `dontAsk`, under which a call matching neither `allow` nor `deny`, or matching an `ask` rule, is refused at once rather than stalling the run. `acceptEdits` is an operator override, whose clause `docs/cli.md` §6 (Task 13) and `docs/watcher.md` §4 (Task 25) state.
- Task 2 — what the profile does with them:
  - each domain lands in `sandbox.network.allowedDomains`, with its reason in `_README`;
  - the opt-out sets `sandbox.enabled: false` and writes a `_README` line starting with *"THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE"*;
  - a profile is `create-if-absent`, so a change reaches it only through `init --force`.

### Targets

- `docs/config.md` — `## 5. Key reference`, two rows (scope register row 43).
- `ARCHITECTURE.md` — the permission-model row (scope register row 37), the two unlisted-call sentences of row 49, and the **[shipped]** paragraph *"Two flags in the invocation row name more than a value."*, which quotes the watcher's `PERMISSION_MODE` line (row 126).
- `docs/config.md` — the unlisted-call sentence of row 84.
- `ROADMAP.md` — the **Release tags in the protected set** row, *"`git tag` and `git push` are on the autonomous profile's ask list, which no one answers there"* (row 191).

**Work:**

- [ ] `docs/config.md` §5: add `sandbox.allowedDomains` and `sandbox.optOut` rows in the table's place for optional sections, after `execution.progressComments`, in the table's four-column form.
  - The `allowedDomains` Meaning cell says:
    - what the list is for: the hosts the adopter's own gate commands must reach from inside the sandbox;
    - that each entry's `reason` is rendered into the profile;
    - that an entry with no port allows every port;
    - that a broad domain is an exfiltration path, because the proxy decides on the client-supplied hostname. This is the task prompt's verified fact, stated no more firmly than there.
  - The `optOut` Meaning cell says:
    - who it is for, for example a platform with no supported sandbox such as WSL1;
    - what it turns off;
    - that the profile shows it;
    - that `doctor`'s `profile-sandbox` check reports it.
  - Both cells say a change reaches an existing profile only through `init --force`, which writes a `.bak` first.
- [ ] `ARCHITECTURE.md`, the permission-model row: extend *"a `permissions` object with `allow`, `deny`, `ask`, `defaultMode` and `additionalDirectories`; `enabledMcpjsonServers`; …"* with the `sandbox` object, which carries strict mode, `excludedCommands`, `filesystem.allowWrite` / `denyWrite`, `network` and `credentials`. Name its generator modules, `cli/src/generators/sandboxProfile.ts` and `cli/src/generators/writeProtection.ts`, beside `permissionProfile.ts`. Keep the row's **Coupling** and **What an adapter would need** cells' claims, and add the sandbox to the latter as one more host-specific format an adapter would have to carry.

- [ ] Unlisted-call sentences (register rows 49 and 84). Rewrite each to the story's canonical restatement: under the default `dontAsk` mode such a call is **refused at once**. Keep the rule it supports, and do not add the override clause.
  - `ARCHITECTURE.md` (line hint 122): the quoted `_README` sentence becomes the new wording Task 15 gives the `COMPLETENESS IS LOAD-BEARING` line, quoted byte for byte from the template. Then:
    - *"A gap therefore surfaces as a hang rather than an error"*;
    - *"A runtime that prompts on an unlisted tool can carry a smaller profile and pays a different failure; one that stalls, as this one does, cannot."* Rewrite it so a runtime that refuses an unlisted call is the one this profile now runs under; the argument for completeness still holds, because a refused step is a missing step.
  - `ARCHITECTURE.md` (line hint 280): *"so a test reaching for it stalls until an adopter adds the entry"* → refused until an adopter adds the entry.
  - `docs/config.md` (line hint 11): *"is a different string and stalls on a prompt"* → is a different string and is refused.
- [ ] `ARCHITECTURE.md`, the **[shipped]** paragraph *"Two flags in the invocation row name more than a value."* (register row 126). Its sentence *"`--permission-mode` names a **mode**: `PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"`, whose comment records that a permission-bypass mode is deliberately never used …"* quotes a shipped line Task 15 changes. Replace the quotation with the new line, quoted byte for byte from `cli/templates/scripts/autonomous-watcher.sh`:

  ```
  PERMISSION_MODE="${PERMISSION_MODE:-dontAsk}"
  ```

  Keep the paragraph's argument whole: the comment still records that a permission-bypass mode is never used, because the generated profile's deny floor is what keeps an unattended run in its lane. Keep the **[shipped]** / **[designed]** markers as they are. Do not add the `acceptEdits` override clause here; `docs/watcher.md` §4 and `docs/cli.md` §6 own it. Leave the `.claude/` namespace row's *"a sensitive path `--permission-mode acceptEdits` does not cover"* as it is (row 127): it is a measured fact.

- [ ] `ROADMAP.md`, the **Release tags in the protected set** row (register row 191): *"which no one answers there"* → *"which an unattended run's default `dontAsk` mode refuses"*. Keep the row's point that unattended runs are covered and a supervised session has only its prompt.

**Verification:**

- `grep -n 'sandbox\.' docs/config.md` hits both new rows.
- `grep -n 'which no one answers there' ROADMAP.md` prints nothing.
- Re-run scope-register derivation entry C:

  ```
  git grep -n -E 'profile-deny-floor|grades the permission profile as a remote job|whole grant surface' -- docs ARCHITECTURE.md README.md
  ```

  Its `ARCHITECTURE.md` hit is row 37, and the row now names the `sandbox` object.
- Re-run derivation entry G's two commands with `-n` in place of `-l` and the pathspec `ARCHITECTURE.md docs/config.md`. Every remaining hit must be a line a `no-change` row keeps for these two files (rows 127, 128 and 145); rows 49, 84 and 126 keep none.
- The `PERMISSION_MODE` line `ARCHITECTURE.md` quotes matches the watcher template byte for byte. Run each, and both must print a hit:

  ```
  grep -n -F 'PERMISSION_MODE="${PERMISSION_MODE:-dontAsk}"' ARCHITECTURE.md
  grep -n -F 'PERMISSION_MODE="${PERMISSION_MODE:-dontAsk}"' cli/templates/scripts/autonomous-watcher.sh
  ```
- The sentence `ARCHITECTURE.md` quotes from the `_README` matches `cli/templates/claude/settings.autonomous.json` byte for byte (`grep -F` the quoted text in both files).
- Neither file carries a command an adopter must run outside a fenced block. If a row names `init --force`, it does so as a pointer to `docs/cli.md`, which holds the fenced form (Task 13).

**Deviations from plan:**

- Entry G's second command, re-run with `-n` over `ARCHITECTURE.md docs/config.md`, still hits `ARCHITECTURE.md` line 122 (the row-49 site) on `neither allowed nor denied`. That hit is the corrected quotation itself: the plan requires the `_README` sentence quoted byte for byte, and the template's new `COMPLETENESS IS LOAD-BEARING` sentence says such a call *"is refused at once"*, so it states no stall and is not `change` under entry G's decision rule. Every other hit of both commands is on rows 127 (line 118), 128 (lines 80, 88, 164) and 145 (`docs/config.md` line 43).
- `ARCHITECTURE.md` line 122: *"A gap therefore surfaces as a hang rather than an error"* became *"A gap therefore surfaces as a refused step"*, dropping the contrast, because a refusal is an error and no truthful contrast replaces it.
