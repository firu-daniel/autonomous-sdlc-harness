### Task 2 — Run the probe, then start the worker without `nohup` and capture its start-up stderr in `<label>.start`

**Goal:** Make the run form's detached worker start inside an unattended macOS session's sandbox again, and keep it sandboxed. Also make a worker that dies before claiming `.running` leave its own stderr in the lane directory. The fix is applied only after this task's own probe run has confirmed the cause.

**Depends on:** Task 1, which ships `scripts/gate-worker-start-probe.sh`. Invoked as `bash scripts/gate-worker-start-probe.sh` from the checkout root, it prints one `gwsp: <leg>: <verdict> — <evidence>` line per leg, each after a `== gwsp: <leg> ==` block of full readings. The legs this task reads:

- `sandbox` — `sandboxed` | `unsandboxed` | `not run`.
- `nohup` — `nohup true` run in the call against `( trap '' HUP; exec true )`. `fail` means `nohup` alone exited non-zero.
- `detach` — a detached `nohup bash -c …` arm against a detached `( trap '' HUP; exec bash -c … )` arm, graded on disk. `fail` means the `nohup` arm did not start and the trap arm did.
- `launch-line` — this script's pre-fix launch line, verbatim, with stderr captured. `fail` means no verdict reached the disk.

**Where this layer stops.** This task edits the shipped template only. This checkout's own `scripts/run-test-suite.sh` is Task 5's copy. The suite cases and the lane README template are Task 3's. The record in `docs/` is Task 6's, and it adds §5 F17 and rows WS1–WS5 to `docs/sandbox-verification.md`, which this task's header cites by those ids. `cli/templates/scripts/launch-sandboxed-gates.sh` is not touched. Its `nohup` runs outside the sandbox, as an excluded command, and only on a bubblewrap host. No profile, `excludedCommands` entry or permission rule changes.

### Targets

- `cli/templates/scripts/run-test-suite.sh` — the launch line, the `<label>.start` lifecycle, and the header.

**Work:**

- [ ] **The gate, before any edit.** Run `bash scripts/gate-worker-start-probe.sh` once, and keep its output for this task's header and return. Go on only when the summary lines read `sandbox: sandboxed`, `detach: fail` and `launch-line: fail`. Read the `nohup` leg as supporting evidence, quoted, not as the condition. On any other reading, edit nothing and return `blocker: the probe does not show nohup as what stops the worker — ` followed by the `sandbox`, `nohup`, `detach` and `launch-line` summary lines verbatim. Never guess a second cause.
- [ ] **The launch line.** Replace `RUN_TEST_SUITE_WORKER="$label" nohup bash "$script_dir/$(basename "${BASH_SOURCE[0]}")" "$label" </dev/null >/dev/null 2>&1 &` with a subshell that runs `trap '' HUP`, exports `RUN_TEST_SUITE_WORKER="$label"` with `export` (not an assignment prefix on `exec`), and `exec`s `bash "$script_dir/…" "$label"`. Its stdin and stdout are `/dev/null` and its stderr is appended to `$start_file`. Keep `worker_pid=$!` and `disown`. `exec` keeps the subshell's PID, so `.running`'s `$$` still equals `$!`, and the worker enters with HUP ignored, as `nohup` left it. Replace the comment *"`nohup` by name on PATH: the suite shadows it…"* with: `bash` is resolved by name on `PATH` inside the subshell, and the suite shadows it to exercise the refusal. Task 3's fake `bash` relies on exactly that.
- [ ] **`<label>.start`, the run form's side.** Set `start_file="$log_dir/$label.start"` beside the other lane paths. On the path that starts a run (not the reuse path), add `"$start_file"` to the `rm -f` beside `.verdict` and `.commit`. Then create it empty with `: > "$start_file"`. If that creation fails, launch with stderr to `/dev/null` as today, so a lane that cannot take the file never changes the refusal's bytes. When the start-up window closes with neither `.running` nor `.verdict`, append exactly one line to the file before refusing: `== run-test-suite.sh: worker <worker_pid> of <label> neither claimed .running nor wrote .verdict within <STALE_SECONDS>s ==`. Then call `refuse "the detached run of $label did not start"` unchanged. The `--no-detach` form adds `"$start_file"` to its own `rm -f` line and detaches nothing.
- [ ] **`<label>.start`, the worker's side.** Directly after `printf '%s\n' "$$" > "$running_file"`, the worker sends its own stderr to `/dev/null` (`exec 2>/dev/null`) and removes `"$start_file"`. A started run therefore leaves no `.start`, and a late claim after the refusal removes it too.
- [ ] **The header.** Rewrite the parts the change falsifies, and nothing else:
  - `THE WAIT FORM` — the parenthesis naming `nohup`.
  - `ONE RUN PER LABEL` — "removes `.verdict` and `.commit`" gains `.start`.
  - The `START-UP` sentences — what the file holds on a refusal.
  - `BESIDE THE LOG` — a `<label>.start` row: the worker's stderr until it claims `.running`, then removed, with the run form's marker line appended on the start-up refusal.
  - "A refusal writes none of these files, and no log" — it now excepts that one file on that one refusal.
  - The exit map's start-up refusal clause — it now names `<label>.start`.

  Add one paragraph, `WHY NOT NOHUP`. It quotes this task's `detach`, `launch-line` and `nohup` readings whole, together with the probe's `env` stamp (Claude Code version, macOS version), and cites `docs/sandbox-verification.md` §5 F17 (rows WS1–WS3). It also states that HUP is still ignored on the worker's entry, so the `SIGNALS` paragraph's HUP row holds.

**Verification:**

- Run `bash scripts/gate-worker-start-probe.sh` again after the edit. The `run-form` leg, which copies this template into its fixture, reads `pass`: `pending`, then `pass`. The lane listing it prints holds no `gwsp_run.start`. This is the in-session check that the worker now starts sandboxed. It is a probe run, not a test run.
- `bash -n cli/templates/scripts/run-test-suite.sh` exits 0. A `git diff` of the template shows `nohup` gone from the launch line, and shows no change to any `echo`/`printf` of `pending`, `pass` or `fail …`, to any `refuse` string, or to any `exit` status.
- Grep the template for `2>&1 &` on the launch line, and for any `nohup` left outside the header's history paragraphs and `WHY NOT NOHUP`. Neither is found.
