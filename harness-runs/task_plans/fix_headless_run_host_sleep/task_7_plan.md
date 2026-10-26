### Task 7 — The pure keep-awake host assessment module `cli/src/doctor/keepAwake.ts`, and its suite

**Goal:** One module declares what a host needs to hold a sleep assertion for a run, and judges a host's facts against it with no I/O. It answers whether the hold is `off`, `not-applicable`, `can-hold` or `cannot-hold`, with the one-line sentence `doctor` prints, remedy included. It reuses `sandboxHostKind` for its WSL detection rather than adding a second one.

**Depends on:** Task 2, whose `cli/templates/scripts/lib/harness-run-lib.sh` assigns `HR_KEEP_AWAKE_WHO='autonomous-sdlc-harness'` and `HR_KEEP_AWAKE_WHAT='sleep:handle-lid-switch'` at source time, and starts `caffeinate -s -i -w <pid>`. This module's constants are the TS owners those shell values mirror, and this task's suite holds them equal. Task 2 also adds `hr_host_kind_var`, the shell mirror of `sandboxHostKind`, which this task records in `sandboxPrerequisites.ts`'s mirror list.

**Where this task stops.** This module reads nothing and spawns nothing. **Task 8** gathers the facts in `cli/src/doctor/checks.ts` and turns the assessment into a `CheckOutcome`. It calls exactly the exports below:

```ts
export const KEEP_AWAKE_WHO = 'autonomous-sdlc-harness';
export const KEEP_AWAKE_WHAT = 'sleep:handle-lid-switch';
export const CAFFEINATE_ARGS: readonly string[];            // ['-s', '-i', '-w']
export const LOGIND_POLKIT_ACTIONS: readonly string[];      // ['org.freedesktop.login1.inhibit-block-sleep', 'org.freedesktop.login1.inhibit-handle-lid-switch']
export type KeepAwakeLockContext = 'user-manager' | 'this-shell';
export interface KeepAwakeLockProbe { readonly taken: boolean; readonly context: KeepAwakeLockContext; readonly detail: string }
export interface KeepAwakeHostFacts {
  platform: string; kernelRelease: string;
  enabled: boolean;               // keepAwakeEnabled(config), true when no config
  githubActions: boolean;         // GITHUB_ACTIONS === 'true' or doctor --remote-job
  caffeinatePath?: string;        // where `caffeinate` resolved, absent when it did not
  systemdInhibitPath?: string;    // where `systemd-inhibit` resolved
  lock?: KeepAwakeLockProbe;      // present exactly when needsLockProbe said so and the probe ran
}
export type KeepAwakeAnswer = 'off' | 'not-applicable' | 'can-hold' | 'cannot-hold';
export interface KeepAwakeAssessment { readonly answer: KeepAwakeAnswer; readonly host: SandboxHostKind; readonly sentence: string }
export function needsLockProbe(facts: KeepAwakeHostFacts): boolean;
export function assessKeepAwake(facts: KeepAwakeHostFacts): KeepAwakeAssessment;
```

### Targets

- `cli/src/doctor/keepAwake.ts` (new) — the declarations and the pure assessment.
- `cli/src/doctor/sandboxPrerequisites.ts` — header only: `hr_host_kind_var` joins the DECLARED MIRRORS list, and `keepAwake.ts` is named as a reader of `sandboxHostKind`.
- `cli/test/keep-awake.test.mjs` (new) — the assessment's rows and the shell-constant mirror.

**Work:**

- [ ] **The module header.** It states what the module owns. Then the rule, in the conventions' words: *"The rule this module exists to enforce: what a host needs to hold a sleep assertion for a run is declared once, here, and the run library's copies are declared mirrors held equal by a test."* It lists the DECLARED MIRRORS: `HR_KEEP_AWAKE_WHO`, `HR_KEEP_AWAKE_WHAT` and the `caffeinate -s -i -w` argv in `cli/templates/scripts/lib/harness-run-lib.sh`, held equal by `cli/test/keep-awake.test.mjs`. Then the three choices: AC-only on both platforms and why (`man caffeinate` for `-s`; logind locks hold on battery, so the library checks mains power first), why both logind lock kinds (`LidSwitchIgnoreInhibited=yes`, `man logind.conf`), and why WSL2 cannot hold (the WSL VM freezes with Windows, and the lid follows the Windows power plan).
- [ ] **`needsLockProbe`** is true exactly when `enabled` holds, `githubActions` does not, `sandboxHostKind(platform, kernelRelease)` is `linux`, and `systemdInhibitPath` is defined.
- [ ] **`assessKeepAwake`**, first match wins. Every `cannot-hold` sentence names its remedy:
  - `!enabled` → `off`: `` off: `execution.keepAwake` is false, so a run holds nothing and a closed lid or idle sleep suspends it until wake ``.
  - `githubActions` → `not-applicable`: a GitHub Actions runner does not sleep and job mode holds nothing.
  - `macos` with `caffeinatePath` → `can-hold`. The sentence names the path, says a run holds `PreventSystemSleep` for its engine's life with `caffeinate -s -i -w` on **AC power only**, that on battery a closed lid still sleeps the Mac and the run resumes on wake, and that `execution.keepAwake: false` turns the hold off.
  - `macos` without it → `cannot-hold`: `caffeinate` ships with macOS at `/usr/bin/caffeinate`; put `/usr/bin` on the `PATH` the daemon runs with.
  - `linux` without `systemdInhibitPath` → `cannot-hold`: `systemd-inhibit` (systemd) is not on `PATH`, so a run holds nothing; the run still launches, unheld.
  - `linux` with `lock.taken` → `can-hold`, naming the context (`in the user manager the watcher's service runs under` for `user-manager`, `from this shell, not the watcher's service — the watcher's launch line is the authority there` for `this-shell`), and that the hold is taken only on mains power.
  - `linux` with a lock not taken → `cannot-hold`, quoting `lock.detail`. The remedy: logind refused or did not answer, polkit allows the lock to an active local session, and a lingering user service with no session needs a polkit rule granting `LOGIND_POLKIT_ACTIONS` to this user. A run still launches, unheld, and logs one line.
  - `wsl2` → `cannot-hold`: inside WSL2 nothing can keep Windows awake. Set the Windows power plan's "When I close the lid" action to "Do nothing" for "Plugged in". The Windows setup is the branch `feat_wsl2_support`'s (#160).
  - `wsl1` and `unsupported` → `cannot-hold`: no sleep hold on this platform.

  Every sentence is one line with no newline (`CheckOutcome.detail`), and plain ASCII apart from the em dash the other checks already use.
- [ ] **`sandboxPrerequisites.ts` header.** In DECLARED MIRRORS, extend the shell-mirror bullet: `hr_host_kind_var`, extracted from `hr_sandbox_prereq_judge_var`, now carries the `sandboxHostKind` mirror, and the judge calls it. Add one sentence naming `cli/src/doctor/keepAwake.ts` as the second reader of `sandboxHostKind`. Change no code.
- [ ] **`cli/test/keep-awake.test.mjs`.** The header states the rule, and that the module is imported compiled from `../dist/doctor/keepAwake.js` and that no case touches the host. Table-driven cases cover every arm above, asserting `answer`, `host` and the remedy-bearing fragment of each sentence, plus `needsLockProbe` across `enabled` × `githubActions` × host × tool. One case asserts no sentence contains `\n`. The mirror case sources `join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh')` through `runBash` with `printf '%s\n%s\n' "$HR_KEEP_AWAKE_WHO" "$HR_KEEP_AWAKE_WHAT"`, and asserts the two equal `KEEP_AWAKE_WHO` and `KEEP_AWAKE_WHAT`. It also reads that file's text and asserts it contains `caffeinate ${CAFFEINATE_ARGS.join(' ')} "$pid"`.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `npm test --workspace cli -- test/keep-awake.test.mjs` passes.
- `grep -nE "from 'node:(fs|child_process)'" cli/src/doctor/keepAwake.ts` has no hit, which shows the module reads and spawns nothing.
- `git diff cli/src/doctor/sandboxPrerequisites.ts` changes comment lines only.
