### Task 1 — Declare the sandbox prerequisite table in `cli/src/doctor/sandboxPrerequisites.ts`

**Goal:** Give the CLI one owner for what the unattended sandbox needs from a host. The module holds the platform table, the binaries and their packages, the install commands, the AppArmor rule, the WSL1 detection and the ordered missing-piece ids. Its logic is a pure function of host facts handed to it, so it touches no host and can be tested over every row.

**Where this module stops.** It reads nothing. It takes no `process`, no `node:fs` and no `node:os`, and it imports nothing from `cli/src/doctor/checks.ts`. **Task 2** writes the live probe that gathers the facts, in `checks.ts` beside `locateOnPath` / `resolvesOnPath` and `AGENT_CLI_VARIABLE` / `DEFAULT_AGENT_CLI`, so there is no import cycle and no second `PATH` walker. **Task 3** writes the shell mirror and **Task 5** the workflow mirror. This task only declares, in this module's header, that both mirrors exist and what they are named.

### Targets

- `cli/src/doctor/sandboxPrerequisites.ts` (new): the table, the pure assessment and the detail sentences.
- `cli/test/sandbox-prerequisites.test.mjs` (new): the matrix over the compiled module.

**Work:**

- [ ] **Module header.** Open with what the module owns and *"The rule this module exists to enforce: the sandbox's host prerequisites are declared once, here, and every other copy is a declared mirror held equal by a test."* Then add a **DECLARED MIRRORS** paragraph, in which a rename on either side is an edit to both:
  - `cli/templates/scripts/lib/harness-run-lib.sh`, whose `hr_sandbox_prereq_judge_var` mirrors `sandboxHostKind`, `SANDBOX_HOST_BINARIES` and the missing-piece order, and codes `SANDBOX_INSTALLERS` (each family's command, as `installCommands(missing)` renders it) and `WSL1_AGENT_MESSAGE` into its `HR_SANDBOX_REFUSAL` sentence. `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` holds it equal (Task 3). The library's other function, `hr_sandbox_prereq_probe_var`, is **not** a mirror of this module: it mirrors the live probe, whose owner is `cli/src/doctor/checks.ts` → `probeSandboxHost` (Task 2), and that owner's doc comment declares it. Say so in one clause, so a reader of this header knows where the probe half is declared.
  - `cli/templates/github/workflows/harness-run.yml`, whose step `Install the sandbox prerequisites` mirrors `SANDBOX_INSTALLERS`' installer families in the owner's order (`apt-get`, then `dnf`; the step's flags, `-y -qq` and `sudo -n`, legitimately differ from the owner's adopter-facing commands), `SANDBOX_HOST_BINARIES`' packages, `APPARMOR_USERNS_SYSCTL_PATH`, `BWRAP_APPARMOR_PROFILE_PATH`, `bwrapAppArmorProfile()` and `APPARMOR_RELOAD_COMMAND`. `cli/test/workflow-sandbox-install.test.mjs` holds it equal (Task 5).

  State the AppArmor choice and its reason: a profile may sit under any filename, so the absence of `/etc/apparmor.d/bwrap` is not proof that `userns` is blocked. That makes `1` without that profile `uncertain`, never a missing piece. Cite the source the task prompt gives (`https://code.claude.com/docs/en/sandboxing`, "Set up Linux and WSL2" and the "Ubuntu 24.04 and later" accordion, checked 2026-10-12) as text.
- [ ] **The exported constants and types**, each with a one-line doc comment:
  - `SANDBOX_HOST_BINARIES: readonly SandboxBinary[]` = `[{ binary: 'bwrap', package: 'bubblewrap', purpose: 'filesystem isolation' }, { binary: 'socat', package: 'socat', purpose: 'relays network traffic to the sandbox proxy' }]`, in that order.
  - `SANDBOX_INSTALLERS` = `[{ family: 'Ubuntu/Debian', command: 'sudo apt-get install' }, { family: 'Fedora', command: 'sudo dnf install' }]`.
  - `APPARMOR_USERNS_SYSCTL = 'kernel.apparmor_restrict_unprivileged_userns'` and `APPARMOR_USERNS_SYSCTL_PATH = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns'`.
  - `BWRAP_APPARMOR_PROFILE_PATH = '/etc/apparmor.d/bwrap'` and `BWRAP_INSTALLED_PATH = '/usr/bin/bwrap'`.
  - `APPARMOR_RELOAD_COMMAND = 'sudo systemctl reload apparmor'`.
  - `WSL1_AGENT_MESSAGE = 'Sandboxing requires WSL2'`.
  - `type SandboxHostKind = 'macos' | 'linux' | 'wsl2' | 'wsl1' | 'unsupported'`.
  - `type SandboxPiece = 'bwrap' | 'socat' | 'wsl1' | 'unsupported-platform'`.
  - `type AppArmorAnswer = 'not-applicable' | 'clear' | 'allowed' | 'uncertain'`.
  - `type FileRead = { state: 'absent' } | { state: 'unreadable' } | { state: 'read'; text: string }`.
  - `interface SandboxHostFacts { platform: string; kernelRelease: string; resolvedBinaries: ReadonlySet<string>; appArmorRestrict: FileRead; bwrapProfile: FileRead }`.
  - `interface SandboxPrerequisites { host: SandboxHostKind; missing: readonly SandboxPiece[]; appArmor: AppArmorAnswer }`.
  - `bwrapAppArmorProfile(): string` returns exactly this text, with a trailing newline, which is a profile granting `userns` to `/usr/bin/bwrap`:

    ```
    abi <abi/4.0>,
    include <tunables/global>

    profile bwrap /usr/bin/bwrap flags=(unconfined) {
      userns,

      include if exists <local/bwrap>
    }
    ```

    Build it from `BWRAP_INSTALLED_PATH` rather than retyping the path.
- [ ] **The pure functions:**
  - `sandboxHostKind(platform, kernelRelease)`: `darwin` is `macos`. A `platform` other than `darwin` or `linux` is `unsupported`. On `linux`, a release matching `/microsoft/i` is `wsl2` when it also matches `/microsoft-standard|wsl2/i`, else `wsl1`. Any other `linux` release is `linux`.
  - `assessSandboxHost(facts)`: `missing` is `['unsupported-platform']` for `unsupported` and `['wsl1']` for `wsl1`. For `linux`/`wsl2` it is each `SANDBOX_HOST_BINARIES` binary absent from `resolvedBinaries`, in table order, and `[]` for `macos`. `appArmor` is `not-applicable` off `linux`/`wsl2`. On those hosts, an `absent` sysctl or one that trims to `'0'` is `clear`. One that trims to `'1'` is `allowed` when `bwrapProfile` is `read`, has a line matching `/^\s*userns\s*,/m` and contains `BWRAP_INSTALLED_PATH`. Everything else is `uncertain`. An `uncertain` answer never adds to `missing`.
  - `installCommands(missing)`: one string per `SANDBOX_INSTALLERS` entry, `<command> <packages of the missing binaries, in table order>`, for example `sudo apt-get install bubblewrap socat`. It returns `[]` when no binary is missing.
  - `describeMissingPieces(missing, kernelRelease, platform)` and `describeAppArmor(answer)` return the one-line sentences Task 2's check prints. A binary sentence names each binary, its package and its purpose, then the `installCommands` with their families. The `wsl1` sentence quotes `WSL1_AGENT_MESSAGE` and the kernel release, and names running under WSL2 as the fix. The `unsupported-platform` sentence names the platform. The `uncertain` sentence names `APPARMOR_USERNS_SYSCTL`, `BWRAP_APPARMOR_PROFILE_PATH`, `APPARMOR_RELOAD_COMMAND` and the reason the answer cannot be certain. **No sentence names `sandbox.optOut`**: the opt-out is never offered as a fix.
- [ ] **`cli/test/sandbox-prerequisites.test.mjs`.** Its header states the rule above. It imports the module from `../dist/doctor/sandboxPrerequisites.js`, and its cases cover:
  - the host kinds: `darwin` with any release; `linux` with `6.8.0-45-generic`; `4.4.0-19041-Microsoft`; `5.15.153.1-microsoft-standard-WSL2`; `4.19.104-microsoft-standard`; `MICROSOFT-STANDARD-wsl2`; `win32` and `freebsd`;
  - the missing order, with both binaries, either one and neither;
  - that `wsl1` and `unsupported` hosts report one id and no binary ids;
  - the AppArmor states: absent; `'0\n'`; `'1\n'` with the profile; `'1\n'` with a profile lacking `userns`; `'1\n'` with the profile absent; `'1\n'` with it unreadable; an unreadable sysctl; `'2'`. Assert that every `uncertain` leaves `missing` unchanged;
  - `installCommands` for each missing subset;
  - that no description string contains `optOut`;
  - that `bwrapAppArmorProfile()` contains `userns,` and `BWRAP_INSTALLED_PATH`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-prerequisites.test.mjs` passes. It is this task's own new test file.
- `bash scripts/typecheck.sh` reports no error in `cli/src/doctor/sandboxPrerequisites.ts`. `noUnusedLocals` holds: every export is consumed by the test now and by Tasks 2, 3 and 5 later (Task 5's suite consumes `SANDBOX_INSTALLERS` for the installer order).
- Grep the module for `node:fs`, `node:os`, `process.` and `./checks.js` and find none: the module is pure, and `checks.ts` imports it, never the reverse.
