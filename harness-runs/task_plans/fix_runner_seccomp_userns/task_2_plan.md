### Task 2 — Declare the stock-profile remedy, the load command and the nested user-namespace check in `sandboxPrerequisites.ts`, and assess them

**Goal:** Make `cli/src/doctor/sandboxPrerequisites.ts` the one owner of every new value this branch needs, and of the pure assessment of the nested user-namespace check, so the install step (Task 3), `doctor` (Task 4) and the watcher's shell mirror (Task 5) read one declaration. The module stays pure. It reads nothing and spawns nothing, and every host fact reaches `assessSandboxHost` as an argument. That argument is the injectable host-facts seam every verdict is tested through, so no test needs a real `bwrap`.

**Where this module stops.** It declares, assesses and words; it never probes.

- **Not here:** spawning the nested check and reading `/etc/apparmor.d/bwrap-userns-restrict` belong to **Task 4** (`cli/src/doctor/checks.ts` → `probeSandboxHost`).
- **Not here:** grading an answer as pass, warn or fail belongs to **Task 4** (`SANDBOX_PREREQUISITES_CHECK`).
- **Not here:** the step's commands belong to **Task 3**, and the shell mirror to **Task 5**.

### Targets

- `cli/src/doctor/sandboxPrerequisites.ts`
- `cli/test/sandbox-prerequisites.test.mjs`. This is the owner's own suite, and the accompanying test this module's header requires.

**Work:**

- [ ] **Declare the new values**, each exported and each with a one-line doc comment:
  - `BWRAP_USERNS_RESTRICT_PROFILE_PATH = '/etc/apparmor.d/bwrap-userns-restrict'`
  - `APPARMOR_DISABLE_DIR = '/etc/apparmor.d/disable'`
  - `APPARMOR_LOAD_COMMAND`, which is `` `sudo apparmor_parser -r ${BWRAP_APPARMOR_PROFILE_PATH}` ``. It **replaces** `APPARMOR_RELOAD_COMMAND`, which is removed: the prompt measured that `systemctl reload apparmor` lets the stock profile win.
  - `bwrapUsernsRestrictRemedy(): readonly string[]`, returning the task prompt's four commands in order, each built from the constants above: `sudo mkdir -p <disable dir>`; `sudo ln -sf <stock path> <disable dir>/bwrap-userns-restrict`; `sudo apparmor_parser -R <stock path>`; `APPARMOR_LOAD_COMMAND`.
  - `NESTED_USERNS_PROBE: readonly string[]`, the argument vector `['bwrap', '--unshare-user', '--dev-bind', '/', '/', '--', 'unshare', '-U', '-r', 'true']`.
  - `NESTED_USERNS_HELPER = 'unshare'`, the second binary the check needs on `PATH`. `NESTED_USERNS_PROBE` carries it at the position after `--`.
- [ ] **Extend the facts and the assessment.**
  - New type `NestedUsernsProbe = { state: 'not-run' } | { state: 'passed' } | { state: 'failed'; detail: string }`.
  - `SandboxHostFacts` gains two **optional** fields: `nestedUserns?: NestedUsernsProbe`, where absent means not run, and `stockRestrictProfile?: boolean`, where absent means not present. They are optional so that every existing caller that builds facts without them keeps compiling and keeps its answer.
  - New type `NestedUsernsAnswer = 'not-applicable' | 'not-run' | 'passed' | 'failed' | 'failed-stock-restrict'`, and `SandboxPrerequisites` gains `nestedUserns: NestedUsernsAnswer`.
  - In `assessSandboxHost`, `macos`, `wsl1` and `unsupported` hosts answer `not-applicable`. A `linux` or `wsl2` host answers from `facts.nestedUserns`: absent or `not-run` gives `not-run`, and `passed` gives `passed`. `failed` gives `failed-stock-restrict` when `facts.stockRestrictProfile` is `true`, and `failed` otherwise.
  - `missing` and `appArmor` are computed exactly as today. The nested answer never adds a piece to `missing`.
- [ ] **Word the answers.** Add `describeNestedUserns(answer: NestedUsernsAnswer, detail: string, remoteJob: boolean): string`. None of its sentences offers the opt-out.
  - **`failed-stock-restrict`:**
    - States that bwrap's child could not create a user namespace (quote `NESTED_USERNS_PROBE` joined by spaces, and `detail`), so every sandboxed command would fail.
    - Names `BWRAP_USERNS_RESTRICT_PROFILE_PATH` as the cause: it confines bwrap's children under `unpriv_bwrap`, which denies every capability.
    - Gives `bwrapUsernsRestrictRemedy()` as the remedy, with the profile `bwrapAppArmorProfile()` describes at `BWRAP_APPARMOR_PROFILE_PATH` before the last command.
    - When `remoteJob` is `false`, also says that `doctor` changes nothing, that disabling Ubuntu's restriction weakens a desktop's hardening of unprivileged user namespaces, and that the trade-off is the user's.
    - When `remoteJob` is `true`, says instead that the job's `Install the sandbox prerequisites` step applies this remedy, so a failure here means that step did not.
  - **`failed`:** states the same failure, says that no `BWRAP_USERNS_RESTRICT_PROFILE_PATH` is present, and points at the profile at `BWRAP_APPARMOR_PROFILE_PATH` and `APPARMOR_LOAD_COMMAND`.
  - **`passed`:** one sentence saying that bwrap's child created a nested user namespace.
  - **`not-run` and `not-applicable`:** `''`.
- [ ] **Correct the module's own claims.**
  - **The header:**
    - Rewrite *"The AppArmor choice"* so it no longer implies a profile at `/etc/apparmor.d/bwrap` is what is needed. On Ubuntu 26.04, `bwrap-userns-restrict` confines bwrap's children whatever that profile says, so the file reading can show neither a block nor its absence, and the nested check is the verdict where it runs. Cite the task prompt's measurement (round 13, 2026-11-05, runs `41980588326` and `41985478942`) by run id, not by line.
    - Update the **DECLARED MIRRORS** list:
      - The step mirror now covers `BWRAP_USERNS_RESTRICT_PROFILE_PATH`, `APPARMOR_DISABLE_DIR`, `bwrapUsernsRestrictRemedy()`, `APPARMOR_LOAD_COMMAND`, `NESTED_USERNS_PROBE` and `NESTED_USERNS_HELPER` (the step's `command -v unshare` gate before the verification), in place of `APPARMOR_RELOAD_COMMAND`, still held by `cli/test/workflow-sandbox-install.test.mjs`.
      - The shell judge mirrors `NestedUsernsAnswer` and the stock-profile half of the refusal, held by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`.
      - **The shell probe becomes a declared mirror.** Delete the header's sentence *"That library's `hr_sandbox_prereq_probe_var` is not a mirror of this module: it mirrors the live probe"*. After Task 5 it is false, because the probe carries three of this module's literals. In its place, add this mirror entry: `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var` mirrors `NESTED_USERNS_PROBE` (the nested check's argument vector), `NESTED_USERNS_HELPER` (the `command -v unshare` read that gates it) and `BWRAP_USERNS_RESTRICT_PROFILE_PATH` (the `[ -e … ]` presence test). It is held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`, which Task 5 extends to assert all three against this module's exports. The entry also says the probe still mirrors `probeSandboxHost` for its platform, kernel-release and `PATH` reads, as `cli/src/doctor/checks.ts` declares.
  - **`describeAppArmor`:**
    - `allowed` no longer reads as sufficient. It reports what the file grants and nothing more.
    - `uncertain` drops *"if it is, write that profile and run …reload…"* in favour of naming the profile and `APPARMOR_LOAD_COMMAND`, and adds that on Ubuntu 26.04 `BWRAP_USERNS_RESTRICT_PROFILE_PATH` can confine bwrap's children whatever that profile grants.
    - Its signature is unchanged.
- [ ] **`cli/test/sandbox-prerequisites.test.mjs`:**
  - Replace the `APPARMOR_RELOAD_COMMAND` import and its use in the `uncertain` sentence case with `APPARMOR_LOAD_COMMAND`.
  - Add cases, every expected value read from the module's exports:
    - **(a)** `bwrapUsernsRestrictRemedy()` is the four commands in order, built from the three path constants and ending with `APPARMOR_LOAD_COMMAND`.
    - **(b)** `assessSandboxHost`'s `nestedUserns` covers each verdict the prompt asks for: probe passes → `passed`; probe fails with `stockRestrictProfile: true` → `failed-stock-restrict`; probe fails without it → `failed`; `bwrap` not resolved and no probe → `not-run`, with `missing` naming `bwrap` as today.
    - **(c)** facts without the two new fields answer exactly as today, with `nestedUserns: 'not-run'`.
    - **(d)** `macos`, `wsl1` and `unsupported` hosts answer `not-applicable`.
    - **(e)** `describeNestedUserns('failed-stock-restrict', …, false)` names the stock path, carries each remedy command and the hardening trade-off, and `…, true)` names `Install the sandbox prerequisites` and not the trade-off.
    - **(f)** `describeNestedUserns('failed', …)` names `APPARMOR_LOAD_COMMAND` and not the remedy's `apparmor_parser -R`.
  - Extend the existing *"never offer the opt-out"* sweep over every `describeNestedUserns` answer, in both modes.
  - Keep the header's rule, and add the nested answers to the list of rows it holds the owner to.

**Verification:**

- `npm test --workspace cli -- test/sandbox-prerequisites.test.mjs` passes, including the four verdict cases (probe passes, fails with the stock file, fails without it, no bwrap).
- `bash scripts/typecheck.sh` reports no error naming `cli/src/doctor/sandboxPrerequisites.ts`. `cli/src/doctor/checks.ts` imports none of the removed names, so the whole tree still compiles.
- A grep of `cli/src` for `APPARMOR_RELOAD_COMMAND` and `systemctl reload apparmor` finds nothing.
- Expected and stated in the story index's `## Context`: `cli/test/workflow-sandbox-install.test.mjs` still imports `APPARMOR_RELOAD_COMMAND`, until Task 3, which owns that file, replaces the import. This task does not edit that file.
