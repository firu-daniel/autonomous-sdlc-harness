### Task 2 — Render the strict sandbox block, the network denies and the two named unsandboxed wrappers into the unattended profile

**Goal:** Make every profile `init` generates carry four things: a Claude Code `sandbox` block in strict mode; the network-client denies as a second layer; exactly two named, reasoned `excludedCommands` (the main checkout's own `push-branch.sh` and `refresh-branch.sh`); and the adopter's `sandbox.allowedDomains`. A configuration that takes `sandbox.optOut` renders a profile that visibly shows the opt-out.

**Depends on:** Task 15, which changes this same template's `permissions.defaultMode` to `"dontAsk"` and rewrites its existing `_README` lines; this task adds lines after them and edits none. And Task 1, which exports from `cli/src/config/model.ts`:

```ts
sandboxOptedOut(config: HarnessConfig): boolean
sandboxAllowedDomains(config: HarnessConfig): readonly HarnessSandboxDomain[]
// where HarnessSandboxDomain = { domain: string; reason: string }
// and config.sandbox?.optOut?.reason is the opt-out's reason
```

**Where this task stops.**

- The **write protection** is **Task 3's**: the `sandbox.filesystem.denyWrite` entries and the `Edit`/`Write` deny rules. This task leaves `filesystem.denyWrite` an empty list in the template for Task 3 to fill.
- The wrappers' own refusal and hooks pin are **Tasks 4–5's**.
- Moving the plugin corpus's push spelling to the excluded form is **Tasks 8–10's**.
- Grading a profile on disk is **Task 6's**, which reads the exports named under **Exports** below.

### Targets

- `cli/templates/claude/settings.autonomous.json` — the static half of the block, the deny additions and the rationale lines.
- `cli/src/generators/outerLoopScripts.ts` — a `runsUnsandboxed` flag on two rows.
- `cli/src/generators/sandboxProfile.ts` (new) — the dynamic half of the block, and the exports `doctor` reads.
- `cli/src/generators/permissionProfile.ts` — wire the new module into `renderProfile`, and extend `assertRunnable` to the sandbox lists.
- `cli/test/profile.test.mjs` — the accompanying cases.

**Work:**

- [ ] `outerLoopScripts.ts`: add an optional `runsUnsandboxed?: true` field to `OuterLoopScript`, documented as *"the main checkout's copy of this script is a named `sandbox.excludedCommands` entry"*. Set it on the `push-branch.sh` and `refresh-branch.sh` rows only. The table stays the single declaration of which scripts run unsandboxed, so no `.sh` name is spelled in `sandboxProfile.ts` (`.claude/context/cli.md` → *"One string, one producer"*).
- [ ] Template: add a top-level `"sandbox"` object holding the static, adopter-readable settings: `"enabled": true`, `"failIfUnavailable": true`, `"allowUnsandboxedCommands": false`, `"autoAllowBashIfSandboxed": false`, `"excludedCommands": []`, `"filesystem": { "allowWrite": ["{{stateDirAbs}}"], "denyWrite": [] }` and `"network": { "strictAllowlist": true, "allowLocalBinding": true, "allowedDomains": [] }`. `autoAllowBashIfSandboxed` is set to `false` explicitly, so that whether a sandboxed Bash call with no `allow` entry runs never depends on how its default `true` interacts with `dontAsk`, which neither documentation page states: the profile's `allow` list stays the one grant surface for Bash, and the permission mode decides everything else.
  - The `credentials` block and its file-tool `Read` rules are **Task 23's**, which adds them after this task. Leave no placeholder for them.
  - Append to `permissions.deny`: `WebFetch`, `WebSearch`, and `Bash(<client>:*)` for `curl`, `wget`, `nc`, `ncat`, `socat`, `ssh`, `scp`, `sftp`, `ftp`, `telnet` and `rsync`.
- [ ] Template `_README`: append rationale lines in the file's existing upper-case-lead style. **Add lines; edit none of the existing ones** (scope register row 39). Cover:
  - strict mode: a session whose sandbox cannot start exits rather than running unsandboxed; `dangerouslyDisableSandbox` is ignored.
  - `autoAllowBashIfSandboxed: false`: the profile's `allow` list stays the grant surface for Bash, sandboxed or not, and the permission mode decides every call it does not list. Setting it explicitly removes the one point the documentation leaves open about its default under `dontAsk`.
  - why the network list is empty but for the adopter's part: git's network traffic leaves through the excluded wrappers, and the API, `WebFetch`, `WebSearch` and MCP servers run outside the sandbox.
  - `strictAllowlist` and its **unresolved** `--settings` scope, said in exactly those terms. Then what decides an unlisted host when it is not honoured: the permission mode. Under the shipped `dontAsk` mode (Task 15) that host is refused either way. Under the `PERMISSION_MODE=acceptEdits` override it prompts, which an unattended run cannot answer. Point at the mode line Task 15 adds rather than restating the override.
  - that whether a headless `-p` session honours all of this exactly as an interactive one does is **unresolved**.
  - the two excluded commands: why the main checkout's spelling only — the worktree copy is sandbox-writable and Linux skips a globbed `denyWrite` — and that they run with full access.
  - `allowLocalBinding`: a macOS-only key, there so a test suite or dev server can bind loopback.
  - that the deny entries are a prefix match on the command string, so they are cosmetic without the sandbox.
  - residuals 2 and 3 from the story index's `## Context`, and that the two excluded wrappers refuse any target but the main checkout or a worktree it lists (Task 24).

  No line may quote a fact as more certain than the task prompt's `## Verified facts` states it.
- [ ] `sandboxProfile.ts`: open with a module header stating *"The rule this module exists to enforce"*: no command runs outside the sandbox unless this module names it, and it names only a file the sandbox cannot write. Export the following.

  ```ts
  export const SANDBOX_KEY = 'sandbox';
  export const SANDBOX_OPT_OUT_MARKER = 'THE SANDBOX IS OFF BY THIS REPOSITORY\'S OWN CHOICE';
  export const LOOPBACK_ALLOWED_HOST = '127.0.0.1';
  export interface ExpectedSandbox {
    readonly optedOut: boolean;
    readonly optOutReason?: string;
    readonly excludedCommands: readonly string[];
    readonly allowedDomains: readonly string[];
  }
  export function expectedSandbox(input: { readonly repoRoot: string; readonly config: HarnessConfig }): ExpectedSandbox;
  export function shippedSandboxSettings(): readonly { readonly path: string; readonly value: boolean }[];
  export function applySandbox(profile: JsonObject, input: { readonly repoRoot: string; readonly config: HarnessConfig }): void;
  ```

  - `expectedSandbox`:
    - `excludedCommands` is `bashScriptRule(outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(row)))` for every `runsUnsandboxed` row, which gives `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)` and the `refresh-branch.sh` twin. Import `bashScriptRule` from `permissionProfile.ts`, the one producer of the rule form, and `outerLoopScriptPath` / `outerLoopRelativePath` from `outerLoopScripts.ts`, the one producer of where an outer-loop script lands: `outerLoopScriptPath` applies `normalizeRepoDir` and `DEFAULTS.scriptsDir` through `outerLoopScriptsDir`. Never join `repoRoot`, `scriptsDir` and the file name by hand. Task 3 item 1 builds the write-protected path through the same `outerLoopScriptPath` call, so the file that runs unsandboxed and the file that cannot be written are one string from one producer (`.claude/context/cli.md` → `## How a module in this layer is written` → **One string, one producer.**).
    - `allowedDomains` is the configured domains in order, then `LOOPBACK_ALLOWED_HOST` when `browserWiringApplies(config)`, de-duplicated.
  - `shippedSandboxSettings` reads the shipped template's `sandbox` boolean leaves, giving `enabled`, `failIfUnavailable`, `allowUnsandboxedCommands`, `autoAllowBashIfSandboxed` and `network.strictAllowlist` as dotted paths with their values. It reads them the way `doctor` reads the deny floor (`shippedDenyFloor`), so no second copy exists.
  - `applySandbox`:
    - appends `expectedSandbox`'s lists into `sandbox.excludedCommands` and `sandbox.network.allowedDomains`;
    - appends one `_README` line per configured domain: `ALLOWED DOMAIN <domain>: <reason>`;
    - appends one line for the loopback entry, with its reason;
    - when opted out, sets `sandbox.enabled` to `false` and appends `SANDBOX_OPT_OUT_MARKER` + `: ` + the reason, plus the remedy for undoing it. Everything else stays: the network denies and Task 3's file-tool denies still apply.

    Screen every configured domain with `permissionProfile.ts`'s `assertUsableInEntry` first, as an adopter-fixable `HarnessError` naming `sandbox.allowedDomains`. It is module-private today, so export it.

    Watch for an import cycle: `sandboxProfile.ts` imports from `permissionProfile.ts`, which calls `applySandbox`. Keep every imported binding used at call time only, never at module evaluation, and state the cycle in both headers.

  `permissionProfile.ts`:
  - Call `applySandbox` in `renderProfile` after the fragments merge and before `assertRunnable`.
  - Extend `assertRunnable` to scan `sandbox.excludedCommands`, `sandbox.filesystem.allowWrite`, `sandbox.filesystem.denyWrite` and `sandbox.network.allowedDomains` with the same `FORBIDDEN_IN_ENTRY` table and the leftover-token test.
  - Amend the module header with a `## The sandbox block` paragraph pointing at `sandboxProfile.ts`.
- [ ] `profile.test.mjs`: drive `init` against throwaway fixtures, read `.claude/settings.autonomous.json`, and assert:
  - each `shippedSandboxSettings()` leaf holds its template value. Read the template rather than restating the values.
  - `sandbox.excludedCommands` is exactly the two main-checkout forms built from the fixture's root and `scriptsDir`, and neither the repo-relative nor the worktree-glob form of either script appears there.
  - every `sandbox.excludedCommands` entry is also a `permissions.allow` entry — the profile's form (ii), `Bash(bash <scriptsDirAbs>/<outerLoopFile>:*)`, for that script — so the excluded spelling and the allow-listed spelling are shown to be one string.
  - `sandbox.filesystem.allowWrite` names the state directory's absolute path.
  - `permissions.deny` holds `WebFetch` and `WebSearch`.
  - a configured domain lands in `network.allowedDomains`, with its reason in `_README`.
  - with `phases.qa` on and the `web-playwright` driver, `127.0.0.1` is present; with the phase off it is absent.
  - with `sandbox.optOut.reason` set, `sandbox.enabled` is `false` and a `_README` line starts with the marker.
  - a domain carrying a quote is refused with `EXIT.FAILURE` (1), the adopter-fixable code, rather than `EXIT.INTERNAL` (2). Feed it past Task 1's check by writing the fixture's config so that `init` reads it. If the check refuses first, assert that refusal instead and say so in the case.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs` passes. Then run `commands.typecheck` as written.
- The excluded command and the corpus spelling Tasks 8–10 write are the same string. For a fixture at `<root>` with `scriptsDir` `scripts`, `sandbox.excludedCommands` contains `Bash(bash <root>/scripts/push-branch.sh:*)`. `bash <root>/scripts/push-branch.sh "<worktree>"` starts with that prefix, and `bash scripts/push-branch.sh` does not.
- Grep `sandboxProfile.ts` for a `.sh` literal and find none.

**Deviations from plan:**

- `permissionProfile.ts` also exports `appendReadme`, so `sandboxProfile.ts` appends its `_README` lines through the one existing appender rather than a second copy of it.
- `shippedSandboxSettings` grades the five leaves the plan lists, named once in `sandboxProfile.ts` → `GRADED_SETTINGS` with their values read from the template; `network.allowLocalBinding`, also a boolean leaf, is deliberately not graded (a macOS loopback convenience whose removal weakens nothing).
- The quoted-domain case: Task 1's configuration check refuses the domain first (`init` exits 1 naming `sandbox.allowedDomains`, profile not written). The case asserts that refusal end to end, then drives `renderProfile` directly past the check to assert `applySandbox`'s own screen also exits 1 naming the key.
- `applySandbox` is called after the plugin-root carry-forward, immediately before `assertRunnable` — after the fragments merge, as the plan requires.
