### Task 3 — Test the run library's keep-awake primitives and hold the extracted host classifier to `sandboxHostKind`

**Goal:** A new suite drives every keep-awake primitive Task 2 added to the shipped run library, sourced from the package's template tree with stubbed `uname`, `caffeinate`, `systemd-inhibit` and power-supply directory. The existing shell-mirror suite gains `hr_host_kind_var` in its classification matrix.

**Depends on:** Task 2, which defines, in `cli/templates/scripts/lib/harness-run-lib.sh`:

- `hr_keep_awake <root>` → status `0` true/absent, `1` false, `2` unresolvable or not a boolean.
- `hr_host_kind_var <uname_s> <uname_r>` → `HR_HOST_KIND`.
- `hr_keep_awake_probe_var` → `HR_KEEP_AWAKE_HOST`, `HR_KEEP_AWAKE_TOOL`.
- `hr_keep_awake_mode_var <root> <job_mode>` → `HR_KEEP_AWAKE_MODE`, `HR_KEEP_AWAKE_REASON`, `HR_KEEP_AWAKE_QUIET`, decided in the order and with the exact reason strings that file's third Work bullet fixes.
- `hr_on_mains_power` → status `0`/`1`, walking `${HR_POWER_SUPPLY_DIR:-/sys/class/power_supply}/*/`. An entry is counted only when its `type` is `Mains` or `USB` / `USB_*`, its `scope` is absent or not `Device`, and it has an `online` file; an entry with no `type` file is skipped. Any counted entry with `online` = `1` → 0. Counted entries, none online → 1. No counted entry → 0.
- `hr_keep_awake_hold_var <mode> <pid> <branch>` → `HR_KEEP_AWAKE_STATE` (`held`/`battery`/`refused`/`failed`), `HR_KEEP_AWAKE_PID`, `HR_KEEP_AWAKE_DETAIL`. The caffeinate argv is `-s -i -w <pid>`. The logind probe argv is `--what=sleep:handle-lid-switch --mode=block --who=autonomous-sdlc-harness --why=run <branch> true`, and the holder's is the same four flags followed by `sh -c '…' keep-awake-wait <pid>`.

**Where this task stops.** This task changes test files only, and edits nothing under `cli/src/` or `cli/templates/`. The watcher's own use of these functions is **Task 5**'s suite. The TS constants these mirror are **Task 7**'s.

### Targets

- `cli/test/keep-awake-lib.test.mjs` (new) — the primitives' suite.
- `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` — `hr_host_kind_var` joins the classification matrix.

**Work:**

- [ ] **Header and harness.** Open the new file with its rule, in the conventions' form: *"each keep-awake primitive answers as its contract states over stubbed host facts, and no hold outlives the pid it was started for."* Source the library from `join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh')`, one `bash` process per case, as `sandbox-prerequisites-shell-mirror.test.mjs` does, because `hr_config_load` memoises per `$$`. Pass every case an environment with `GITHUB_ACTIONS` set to the empty string, or a CI run would take arm 2 of the mode decision for every case. Build stubs and fixtures under `mkdtempSync(join(tmpdir(), …))`, remove them in process, and never touch this checkout or the host's real power supply. State in the header that no case starts a real `caffeinate` or `systemd-inhibit`.
- [ ] **Reader and mode cases.** `hr_keep_awake` over a temp root whose `harness.config.json` carries a minimal valid document (`defaultBranch` set) with `execution.keepAwake` absent, `true`, `false`, `"true"`, and no file at all, expecting `0 0 1 2 2`. For `hr_keep_awake_mode_var`, override `hr_keep_awake_probe_var` in the sourced shell, and assert mode, reason and quiet byte for byte for every arm: job mode `1` (which also wins over `GITHUB_ACTIONS=true`), `GITHUB_ACTIONS=true`, the key `false`, the key `"yes"`, `macos`+`caffeinate`, `macos`+no tool, `linux`+`systemd-inhibit`, `linux`+no tool, `wsl2`, `wsl1` and `unsupported`.
- [ ] **Probe and power cases.** `hr_keep_awake_probe_var` with a stub `uname` first on `PATH` (answering `-s` and `-r` from env), and stub `caffeinate` / `systemd-inhibit` present or absent in that stub directory. Use a `PATH` reduced to the stub directory plus the directories holding `bash`, `sh`, `jq` and coreutils, so the host's own `/usr/bin/caffeinate` cannot resolve. Cover four cases: Darwin with and without caffeinate, Linux with and without systemd-inhibit, a WSL2 release (no tool whatever is on `PATH`), and a failing `uname` (host `unsupported`). Then `hr_on_mains_power` over a temp `HR_POWER_SUPPLY_DIR`, restating the contract above, in these shapes: `AC/{online=1,type=Mains}` → 0; `AC/{online=0,type=Mains}` plus `BAT0/{type=Battery}` with no `online` → 1; `AC/{online=0,type=Mains}` plus `usb/{online=1,type=USB}` → 0; `hidpp_battery_0/{online=1,scope=Device,type=Battery}` beside `AC/{online=0,type=Mains}` → 1, because the peripheral is skipped; a `type`-less `x/{online=1}` beside `AC/{online=0,type=Mains}` → 1, because the `type`-less entry is ignored; an empty directory → 0; and a directory whose only entry is `BAT0/status` → 0.
- [ ] **Hold cases.** The `caffeinate` stub records `"$@"` to a file and then polls `kill -0` on the pid after `-w` every 0.1 s, exiting when the pid has gone. The `systemd-inhibit` stub records its argv. When its last argument is `true` it exits with the status in a control file (`0` or `1`), and otherwise it runs the remaining argv after the four flags. Start a `sleep 2` as the target pid and assert three things. First, `hr_keep_awake_hold_var caffeinate <pid> feat_x` → `held`, the recorded argv `-s -i -w <pid>`, and the holder pid alive before the target exits and gone within a bounded wait after. Second, `logind` on mains with the probe answering `0` → `held`, the probe argv and the holder argv as Task 2 fixes them, and the holder gone after the target exits. Third, `logind` with the probe answering `1` → `refused` with detail starting `systemd-inhibit exited 1`. Also assert `logind` on battery → `battery` with no stub invocation recorded, and an empty pid → `failed`.
- [ ] **Mirror matrix.** In `sandbox-prerequisites-shell-mirror.test.mjs`, add a test that runs `hr_host_kind_var` over the existing `PLATFORMS` × `RELEASES` matrix and asserts `HR_HOST_KIND` equals `sandboxHostKind(platform, release)` for each pair. Extend the file header's first sentence to name `hr_host_kind_var` among the mirrors it holds.

**Verification:**

- `npm test --workspace cli -- test/keep-awake-lib.test.mjs` passes.
- `npm test --workspace cli -- test/sandbox-prerequisites-shell-mirror.test.mjs` passes, the new matrix test included.
- Neither suite leaves a `caffeinate`, `systemd-inhibit`, `sleep` or `keep-awake-wait` process behind. Each hold case waits for its holder to exit before it ends, so the suite's own completion shows it.
