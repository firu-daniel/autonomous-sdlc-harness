### Task 3 — Mirror the prerequisite table and `sandboxOptedOut` in the run library

**Goal:** Give the shell side the answers the watcher's refusal needs. It needs whether this host has a definite missing piece, named by the same ids and in the same order as the TypeScript owner. It also needs whether the main checkout's configuration takes the opt-out, by exactly `sandboxOptedOut`'s rule. Both mirrors are declared in both headers, and a test holds them equal to their owners.

**Depends on:** Task 1 and Task 2. Task 1 owns the table in `cli/src/doctor/sandboxPrerequisites.ts` and names `hr_sandbox_prereq_judge_var` in its header's DECLARED MIRRORS paragraph. Task 2 owns the live probe, `cli/src/doctor/checks.ts` → `probeSandboxHost(): SandboxHostFacts` (platform from `process.platform`, kernel release from `os.release()`, each `SANDBOX_HOST_BINARIES[].binary` resolved against `PATH`), and its doc comment names `hr_sandbox_prereq_probe_var` as that probe's shell mirror. Both names are a wire: spell them exactly so. The exports this task mirrors from Task 1 are:

- `sandboxHostKind(platform, kernelRelease)`, which returns `darwin` → `macos`; non-`darwin`/`linux` → `unsupported`; on `linux`, `/microsoft/i` with `/microsoft-standard|wsl2/i` → `wsl2`, `/microsoft/i` alone → `wsl1`, else `linux`;
- `SANDBOX_HOST_BINARIES`, which is `bwrap` from package `bubblewrap`, then `socat` from package `socat`;
- the missing-piece ids, in order: `bwrap`, `socat`, `wsl1`, `unsupported-platform`;
- `SANDBOX_INSTALLERS`, which is `{ family: 'Ubuntu/Debian', command: 'sudo apt-get install' }` then `{ family: 'Fedora', command: 'sudo dnf install' }`, rendered by `installCommands(missing)` as `<command> <packages of the missing binaries, in table order>` (for example `sudo apt-get install bubblewrap socat`);
- `WSL1_AGENT_MESSAGE`, which is `Sandboxing requires WSL2`.

The suite also calls, as the owner's reference answer, without mirroring it:

- the facts type, exactly as Task 1 declares it: `SandboxHostFacts { platform: string; kernelRelease: string; resolvedBinaries: ReadonlySet<string>; appArmorRestrict: FileRead; bwrapProfile: FileRead }`, where `FileRead` is `{ state: 'absent' } | { state: 'unreadable' } | { state: 'read'; text: string }`;
- `assessSandboxHost(facts)`, which returns `{ host, missing, appArmor }`; `missing` is the ordered id array the judge's `HR_SANDBOX_MISSING` mirrors.

The `installCommands` / `WSL1_AGENT_MESSAGE` pair are mirrored into `HR_SANDBOX_REFUSAL` only; Task 1's DECLARED MIRRORS paragraph names them for this library too.

AppArmor is **not** mirrored here. No shell decision reads it, because an AppArmor answer never refuses a launch. Say so in the mirror block.

**Where this task stops.** The library answers and the watcher decides. **Task 4** calls these functions from `autonomous-watcher.sh` and owns the refusal. This task edits no watcher line, and none of this repository's root `scripts/` copies.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the opt-out reader, the judge, the probe and three header MIRROR blocks.
- `cli/src/config/model.ts`: `sandboxOptedOut`'s doc comment names its shell mirror.
- `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` (new): the parity suite.

**Work:**

- [ ] **The opt-out reader.**
  - In `hr_config_load`'s single `jq` program, emit one more scalar: `s("sandbox.optedOut"; try (.sandbox.optOut.reason | if type == "string" and (gsub("[<ws>]"; "") != "") then "true" else null end) catch null)`.
  - `<ws>` is JavaScript `trim`'s whitespace set written as jq string escapes: `\t`, `\n`, `\u000b`, `\f`, `\r`, space, ` `, ` `, ` - `, ` `, ` `, ` `, ` `, `　` and `﻿`. Removing every such character leaves something exactly when `trim()` leaves something.
  - A computed flag is used rather than the raw `reason`, because `s()` drops a `"null"` or `""` value, and the string `"null"` is a taken opt-out in `sandboxOptedOut`.
  - Add `hr_sandbox_opted_out <root>`. It returns 0 when that flag is `true`. It returns 1 otherwise, which covers every `hr_config_load` failure: an absent, unparseable or multi-document file, and a missing `defaultBranch`. Its comment states that the caller passes the **main checkout**, never a run copy, and that every non-0 answer means *not opted out*, so the refusal stands.
- [ ] **The judge and the probe.**
  - `hr_sandbox_prereq_judge_var <uname_s> <uname_r> <bwrap 0|1> <socat 0|1>` is pure and bash-3.2-safe; each binary argument is `1` when that binary resolves and `0` when it does not. It uses `case` with explicit character classes for case-insensitive matching, and no `${v,,}`. It sets `HR_SANDBOX_HOST` (the host kind) and `HR_SANDBOX_MISSING` (the space-separated ids, in owner order). `Darwin` maps to `macos`, `Linux` goes to the release test, and any other `uname -s` maps to `unsupported`.
  - It also sets `HR_SANDBOX_REFUSAL`, a one-line sentence naming each missing binary with its package, then each `SANDBOX_INSTALLERS` entry's command exactly as `installCommands(missing)` renders it, followed by its family: `sudo apt-get install <packages>` (Ubuntu/Debian) / `sudo dnf install <packages>` (Fedora), where `<packages>` is the missing binaries' packages, space-separated, in table order. For `wsl1` it quotes `WSL1_AGENT_MESSAGE` (`Sandboxing requires WSL2`) verbatim and the release. For `unsupported-platform` it names the `uname -s` value. It never names the opt-out.
  - The judge returns 0 when `HR_SANDBOX_MISSING` is empty and 1 otherwise.
  - `hr_sandbox_prereq_probe_var` reads `uname -s`, `uname -r` and `command -v bwrap` / `command -v socat` against the caller's `PATH`, then returns the judge's status. A `uname` that fails is not a definite answer: it clears the three variables and returns 0, which leaves the run to `failIfUnavailable`.
  - Both functions only read. Add neither to the write exceptions.
- [ ] **The header blocks.** Next to the existing `MIRROR OF` paragraphs, add:
  - *"MIRROR OF `cli/src/doctor/sandboxPrerequisites.ts` → `sandboxHostKind`, `SANDBOX_HOST_BINARIES`, the missing-piece order, `SANDBOX_INSTALLERS` and `WSL1_AGENT_MESSAGE`; `hr_sandbox_prereq_judge_var` codes them, the last two into `HR_SANDBOX_REFUSAL`. AppArmor is not mirrored: no shell decision reads it."*
  - *"MIRROR OF `cli/src/doctor/checks.ts` → `probeSandboxHost`; `hr_sandbox_prereq_probe_var` mirrors its platform, kernel-release and `PATH` reads (`uname -s`, `uname -r`, `command -v`). A change to the probe is an edit here."*
  - *"MIRROR OF `cli/src/config/model.ts` → `sandboxOptedOut`; `hr_sandbox_opted_out` and the `sandbox.optedOut` flag `hr_config_load` computes. A change to either owner is an edit here."*

  Name both functions in the header's opening sentence of what the library answers.
- [ ] **`cli/src/config/model.ts`.** Extend `sandboxOptedOut`'s doc comment: its shell mirror is `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_opted_out`, held equal by `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`. Change no code.
- [ ] **`cli/test/sandbox-prerequisites-shell-mirror.test.mjs` (new).** Its header states that each shell mirror answers as its owner does over the same inputs. It imports `../dist/doctor/sandboxPrerequisites.js` and `../dist/config/model.js`, and sources `templates/scripts/lib/harness-run-lib.sh` under `PACKAGE_ROOT` through `runBash`, one `bash` process per case because `hr_config_load` memoises per `$$`.
  - **The host matrix.** Platform pairs `darwin`/`Darwin`, `linux`/`Linux`, `win32`/`MINGW64_NT-10.0` and `freebsd`/`FreeBSD`, crossed with the kernel releases of Task 1's suite and the four binary-presence combinations. Assert that the judge's `HR_SANDBOX_HOST` and `HR_SANDBOX_MISSING` equal `sandboxHostKind(platform, kernelRelease)` and `assessSandboxHost(facts).missing.join(' ')`. Each case builds its facts as `{ platform, kernelRelease, resolvedBinaries: new Set(<the binaries the case marks present, from 'bwrap' / 'socat'>), appArmorRestrict: { state: 'absent' }, bwrapProfile: { state: 'absent' } }`, and passes the judge `<uname_s> <uname_r>` plus `1` for each binary in `resolvedBinaries` and `0` for each one absent. Also assert that `HR_SANDBOX_REFUSAL` names each missing package and never `optOut`; that, for every case with a missing binary, it contains each string `installCommands(missing)` returns; and that, for every `wsl1` case, it contains `WSL1_AGENT_MESSAGE`. Both `installCommands` and `WSL1_AGENT_MESSAGE` are imported from `../dist/doctor/sandboxPrerequisites.js`, never retyped in the test.
  - **The opt-out matrix.** Each case writes `harness.config.json` with `defaultBranch` into a temp directory under `os.tmpdir()` and compares `hr_sandbox_opted_out`'s status with `sandboxOptedOut(config)`. The cases: no `sandbox`; `sandbox: "x"`; `optOut: true`; `optOut: {}`; `reason: ""`; `"   "`; `" "`; `"﻿"`; `" "`; `"\t\n"`; `"x"`; `" x "`; `"null"`; `5`; `null`.
  - Then three file states, each expected to be not opted out: absent; unparseable; two documents.
  - Skip, naming why, when `jq` does not resolve.

**Verification:**

- `npm test --workspace cli -- test/sandbox-prerequisites-shell-mirror.test.mjs` passes. It is this task's own new test file.
- `bash scripts/typecheck.sh` reports no error in `cli/src/config/model.ts`. The edit there is a comment only.
- `grep -n "set -[euo]" cli/templates/scripts/lib/harness-run-lib.sh` shows nothing new, so the library still sets no shell option.
- `git diff --name-only` for this task names no file under the repository-root `scripts/`.
