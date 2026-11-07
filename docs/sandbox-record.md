# The unattended sandbox: the document of record

**Who reads this:** a maintainer changing the unattended profile's `sandbox` block, the scripts it excludes, or the write protection; and sandbox4 (`fix_run_job_credential_exposure`), for §5. **Which file owns what.** [`sandbox-verification.md`](sandbox-verification.md) is the evidence record: one row per check, with its procedure, expectation, observed quote and verdict. This file owns the model and the residuals. It cites evidence rows by id, states no result stronger than the row it cites, and quotes no observed output. `docs/sandbox.md`, the adopter-facing explainer `chore_unattended_sandbox_doc` will write, will explain this file and link to it; it does not exist yet. How each check works is owned by [`cli.md`](cli.md) §6 and by the wrapper headers, which this file links rather than restates.

Every result below is a verdict and the row id it rests on, a dated documentation citation, or a statement *derived from the code*. A bare row id is a row of `sandbox-verification.md`; `(Linux)` and `(runner)` name its §8 and §9 rows.

## 1. What the sandbox contains, and what it does not

**Inside:** every Bash command and every process it starts. The profile's own settings for that sandbox are [`cli.md`](cli.md) → `### The sandbox block and the permission mode`, not restated here.

**Outside, with the user's full access:** the file tools (`Edit`, `Write`, `Read` and the rest), which follow the profile's permission rules and not the sandbox; hooks; local MCP servers; plugin monitors; LSP servers; the status line; and `apiKeyHelper`. **Subagents** share the parent's sandbox. Both statements are the documentation's, not a measurement: Claude Code's sandboxing page, `https://code.claude.com/docs/en/sandboxing` → "What runs outside the sandbox", checked 2026-10-24.

**Measured readings:**

- **The file tools are held by the permission rules.** `Edit` and `Write` on the protected set are refused by the `Edit` deny rules: W5 and W6, **pass**. `Read` of a credential file is refused by its `Read` deny rule: S2, **pass**.
- **On Linux an `Edit` deny rule is also enforced inside the sandbox**, mounting a placeholder at an absent path inside a write root: §5, session 2's AP7, **recorded** (not graded), 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0.
- **The retrieval MCP server answering outside the sandbox is not measured:** MC1 and MC1 (Linux), **not run**, because no `.mcp.json` in this repository wires the server.
- **A sandboxed call cannot ask its way out.** The `dangerouslyDisableSandbox` parameter does not run a call unsandboxed: RT1, **pass**. A planted repository settings file that turns the sandbox off changes nothing: RS1, **pass**. An interactive session matches a headless one on RT1's call: HP1, **pass**.
- **An excluded command runs outside the sandbox:** P2, R0 and CW1, **pass**. On Linux, §5 F9 records an excluded command sharing the plain shell's mount namespace (a reading in the failure table, which grades nothing).

## 2. What runs outside the sandbox, and why

**The four excluded scripts.** They are the rows of `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` marked `runsUnsandboxed`. Each is excluded in one spelling only, the main checkout's own copy:

```
bash <repoRoot>/<scriptsDir>/commit-on-branch.sh:*
bash <repoRoot>/<scriptsDir>/push-branch.sh:*
bash <repoRoot>/<scriptsDir>/refresh-branch.sh:*
bash <repoRoot>/<scriptsDir>/launch-sandboxed-gates.sh:*
```

All four entries are written on every host. Off a bubblewrap host the launcher answers `in-session` and starts nothing (derived from the code: `cli/src/generators/sandboxProfile.ts` → `expectedSandbox`; `cli/templates/scripts/launch-sandboxed-gates.sh` → THE CHECKS, check 4). The entry form is the bare command pattern ending `:*`: the `Bash(…)` rule form is inert there (P1a, **settled**), and the corrected form runs the call outside the sandbox (P2, **pass**).

**Why each.**

- **`commit-on-branch.sh`.** A sandboxed git works in a clone (CL4, **pass**) but cannot write the main checkout's `.git`, where a run's branch lives (CS2, **pass**). A sandboxed git cannot write a hand-made linked worktree's record (G1, **fail**, F1), and no profile entry opens it (G2, **settled**).
- **`push-branch.sh` and `refresh-branch.sh`.** On macOS a sandboxed SSH push or fetch fails (P1, **fail**, F3), and a run copy's own `push-branch.sh` stays sandboxed (P3, **pass**). The excluded copies land (P2 and R0–R3, **pass**).
- **`launch-sandboxed-gates.sh`.** On Linux a process a sandboxed call detaches did not outlive the call (§5 F10, from BG9, **fail**, three runs, and LB5, **not run**). A gate run the excluded launcher starts did outlive it and reached a verdict (T3, **pass**, 2026-11-04). The launcher runs the target's own gate run inside a `bwrap` sandbox of its own (derived from the code: `cli/templates/scripts/launch-sandboxed-gates.sh` → THE BWRAP VECTOR).

**The checks each git wrapper runs, in order.** The `:*` accepts any argument, so each wrapper checks its target before any git call. Each item is owned by [`cli.md`](cli.md) §6 → the paragraph **The excluded rule's `:*` accepts any argument…** and by the header paragraph of `cli/templates/scripts/commit-on-branch.sh` named beside it. `push-branch.sh` and `refresh-branch.sh` run the same calls in the same order.

1. The inherited git environment is dropped, `hr_git_env_drop`: THE INHERITED GIT ENVIRONMENT IS DROPPED.
2. The main checkout is placed from the script's own location, `hr_wrapper_main_of`: THE TARGET IS NOT TRUSTED.
3. The main checkout's `harness.config.json` is read, and an unreadable one is a refusal: THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER.
4. The target check, `hr_wrapper_target_check_var`: the main checkout, else the clone arm for a real `.git` directory, else the worktree arm: THE TARGET IS NOT TRUSTED, and A CLONE IS A TARGET TOO.
5. The per-working-copy configuration check, `hr_worktree_config_check_var`, skipped on the clone arm: THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.
6. The hooks pin, `hr_pinned_hooks_path`: THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.
7. The branch is read once from the main checkout, `hr_wrapper_branch_var`: GIT NEVER RE-READS THE TARGET'S RECORDS.

The launcher's own order is `cli/templates/scripts/launch-sandboxed-gates.sh` → THE CHECKS. It runs no git in its target, so it calls neither `hr_pinned_hooks_path` nor `hr_worktree_config_check_var` (→ WHY IT MAY BE EXCLUDED).

**The watcher family's own git calls in a run's copy** run unsandboxed, under the pins [`watcher.md`](watcher.md) → `### Where the family runs git in a run's copy, and under what pins` states.

**The configured bootstrap commands**, `commands.depInstall` and `commands.build`, run unsandboxed against a run's own manifest: §6, residual 1, item 1.

**The scripts the watcher, the remote job or a person run outside any session** are the outer-loop scripts [`cli.md`](cli.md) §5 → **Two families land in `scriptsDir`** names.

## 3. The domain list, and what an entry still permits

**What the list is.** `sandbox.allowedDomains` in `harness.config.json`, empty by default. Each entry carries a `reason` the profile's `_README` repeats. The one shipped entry is `127.0.0.1`, added only where the interactive-test browser wiring applies (derived from the code: `cli/src/generators/sandboxProfile.ts` → `expectedSandbox`, `LOOPBACK_ALLOWED_HOST`). The key's row is [`config.md`](config.md) §5, `sandbox.allowedDomains`.

**What an entry still permits.** The proxy decides on the hostname the client supplies and does not inspect TLS, so a broad entry such as `github.com` is an exfiltration path, domain fronting included ([`cli.md`](cli.md) §6 → **The domain list ships empty but for one conditional entry.**; not measured by any row).

**Loopback needs no entry on macOS.** A sandboxed command reached a loopback listener there (N3, **fail**, F8). On Linux it did not (N3 (Linux), **pass**).

**`strictAllowlist` is honoured from `--settings`:** a host outside the list is refused under `dontAsk` (N1, **pass**) and under `acceptEdits` (N2, **pass**), on Linux too (N1 (Linux), N2 (Linux), **pass**).

**The network-client `deny` rules** (`Bash(curl:*)`, `Bash(wget:*)`, `Bash(ssh:*)` and the rest) are prefix matches on the command string, so without the sandbox they are cosmetic (derived from the code: `cli/templates/claude/settings.autonomous.json` → `permissions.deny`).

**The Bash tool's per-call `allowed_domains` parameter does not widen a sandboxed call.** A call asking for its own grant was refused on the parameter itself, before it reached the host:

| Platform | Row | Verdict | Date | Claude Code |
|---|---|---|---|---|
| macOS (Seatbelt), arm64 | N5 | **pass** (run 2; run 1 by reading) | 2026-10-27 | 2.1.311 |
| Linux, Debian 12 container, bubblewrap 0.8.0 | N5 (Linux) | **pass** | 2026-10-29 | 2.1.312 |
| GitHub-hosted runner, Ubuntu 26.04, bubblewrap 0.11.1 | N5 (runner) | **pass** (rounds 14 and 15) | 2026-11-05 | 2.1.318 |
| WSL2 | — | *not yet measured* | — | — |

## 4. The measured results, per leg

One row per leg of [`development.md`](development.md) → **Gate 15**'s leg table and job-mode table, plus Gate 12's full-run leg, on each platform that leg runs on. A Linux-only leg has no macOS row, and only the job-mode legs have runner rows. Each date and Claude Code version is the latest probe run or Gate 12 round that printed the row's verdict, read off that run's stamp in `sandbox-verification.md` §0, §8, §9 or §10. A row with no run sentence of its own printed the verdict it already records (§0 *The probe's third Linux run*; §8's stamps). The platforms:

- **macOS:** Seatbelt, arm64, the probe's clone layout. The one exception is `job-layout`, which runs only in job mode (`run --job`).
- **Linux container:** Debian 12 in Gate 15's container on colima, bubblewrap 0.8.0.
- **Runner:** a GitHub-hosted runner in job mode, `ubuntu-26.04` `20261101.186.1`, bubblewrap 0.11.1, Gate 12 rounds 14 and 15 (§9). The one addition is round 16 on `ubuntu-24.04` `20261101.360.1`, bubblewrap 0.9.0, where a row records it.
- **Real job:** one task through `harness-run.yml`, end to end, on the runner image above, Gate 12 round 15 (§10).

| Leg | Platform | Date | Claude Code | Rows | Verdict |
|---|---|---|---|---|---|
| `gates` | macOS | 2026-11-04 (fifth run) | 2.1.318 | T2, W7 | **pass** (T2, W7) |
| `gates` | Linux container | 2026-11-04 (Linux run 4) | 2.1.318 | T3, W7 (Linux) | **pass** (T3, W7 (Linux)) |
| `mktemp` | macOS | 2026-10-27 (run 2) | 2.1.311 | TD2 | **pass** |
| `mktemp` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | TD4 | **pass** |
| `scratch` | macOS | 2026-10-27 (runs 1 and 2) | 2.1.311 | SR1, SR2 | **pass** (SR1, SR2) |
| `scratch` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | SR1 (Linux), SR2 (Linux) | **pass** (SR1, SR2) |
| `retrieval` | macOS | 2026-10-27 (runs 1 and 2) | 2.1.311 | MC1 | `not run` |
| `retrieval` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | MC1 (Linux) | `not run` |
| `wrappers` | macOS | 2026-10-28 (run 3) | 2.1.312 | CS4, P3, CW2, P1c, CW5, P1b, CW6 | **pass** (all seven); CW2 also by hand on a worktree, 2026-11-07 |
| `wrappers` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | CS4, P3, CW2, P1c, CW5, P1b, CW6, each (Linux) | **pass** (all seven) |
| `wrappers` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | P1c, CW5, P1b, CW6, each (runner) | **pass** (all four) |
| `wrappers-refresh` | macOS | 2026-10-27 (runs 1 and 2) | 2.1.311 | R0, R1, R2, R3, R4 | **pass** (R0–R4) |
| `wrappers-refresh` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | R0–R4 (Linux) | **pass** (R0–R4) |
| `planted-config` | macOS | 2026-10-27 (run 1) | 2.1.311 | C1, CW3, C2, K2, CW4, CS15 | **pass** (all six); C2, K2 and CW4 also by hand, 2026-11-07 |
| `planted-config` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | C1, CW3, C2, K2, CW4, CS15, each (Linux) | **pass** (all six) |
| `planted-files` | macOS | 2026-10-27 (run 1); L1 2026-11-02 (job mode) | 2.1.311; L1 2.1.316 | CS12, CS13, CS14, L1, L2 | **pass** (CS12, CS13, CS14, L2); L1 **pass** in job mode, `not run` on the clone layout |
| `planted-files` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | CS12, CS13, CS14, L1, L2, each (Linux) | **pass** (CS12, CS13, CS14, L2); `not run` (L1) |
| `planted-files` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | L1 (runner) | **pass** |
| `write-protection` | macOS | 2026-10-28 (run 3); W8 2026-10-27 (run 2) | 2.1.312; W8 2.1.311 | CS1, CS2, CS7, W6, W8 | **pass** (CS1, CS2, CS7, W6, W8); W8 `not run` in run 3 |
| `write-protection` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | CS1, CS2, CS7, W6, W8, each (Linux) | **pass** (all five) |
| `write-protection` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | W6 (runner), W8 (runner) | **pass** (W6, W8) |
| `git` | macOS | 2026-11-04 (fifth run) | 2.1.318 | CS3, CL5 | **pass** (CS3, CL5) |
| `git` | Linux container | 2026-11-04 (Linux run 4) | 2.1.318 | CS3 (Linux), CL5 (Linux) | **pass** (CS3, CL5) |
| `network` | macOS | 2026-10-28 (run 3) | 2.1.312 | N1, N2, N3, N4, N5 | **pass** (N1, N2, N4, N5); **fail** (N3, F8) |
| `network` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | N1–N5 (Linux) | **pass** (N1, N2, N3, N5); `not run` (N4) |
| `network` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | N1–N5 (runner) | **pass** (N1–N5) |
| `retry` | macOS | 2026-10-27 (runs 1 and 2) | 2.1.311 | RT1 | **pass** |
| `retry` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | RT1 (Linux) | **pass** |
| `repo-settings` | macOS | 2026-10-27 (runs 1 and 2) | 2.1.311 | RS1 | **pass** |
| `repo-settings` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | RS1 (Linux) | **pass** |
| `credentials` | macOS | 2026-10-27 (run 2) | 2.1.311 | S1, S2, S4, S5 | **pass** (S1, S2, S4, S5); S5 recorded, not graded |
| `credentials` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | S1, S2, S4, S5, each (Linux) | **pass** (S1, S2, S4, S5); S5 recorded |
| `credentials` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | S1, S2, S4, S5, each (runner) | **pass** (all four) |
| `invalid-profile` | macOS | 2026-10-28 (run 3) | 2.1.312 | CS8 | (a) recorded: the marker written, F7; (b) **pass** |
| `invalid-profile` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | CS8 (Linux) | (a) recorded: the marker written, F7; (b) **pass** |
| `glob-deny` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | GW1, GW2 | recorded: written (GW1); **pass** (GW2) |
| `registry` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | RG1, RG2, RG3, each (Linux) | **pass** (RG1–RG3) |
| `detached` | Linux container | 2026-11-03 (Linux runs 1–3) | 2.1.317 | BG9 | **fail**, F10 |
| `detached` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | BG9 (runner) | **fail**, F10 |
| `gate-sandbox` | Linux container | 2026-11-04 (Linux run 4) | 2.1.318 | GS1, GS2, GS3, GS4, WF5 | **pass** (all five) |
| `gate-sandbox` | Runner | 2026-11-05 (round 15) | 2.1.318 | GS1–GS4 (runner), WF5 (runner) | **pass** (all five) |
| `loopback` | Linux container | 2026-11-03 (Linux run 3) | 2.1.317 | LB1, LB2, LB3, LB4, LB5 | recorded: unreachable (LB1–LB4); `not run`, F10 (LB5) |
| `loopback` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | LB1–LB5 (runner) | **pass** (LB1–LB4); `not run`, F10 (LB5) |
| `job-layout` | macOS | 2026-11-02 (job mode) | 2.1.316 | CS6 | **pass** |
| `job-layout` | Runner | 2026-11-05 (rounds 14 and 15) | 2.1.318 | CS6 (runner) | **pass**; **fail** in round 13 |
| `runner-install` | Runner | 2026-11-05 (rounds 14 and 15); 2026-11-06 (round 16, `ubuntu-24.04`) | 2.1.318 | IS1, IS2, IS3, IS4 | **pass** (IS1–IS4), on both images |
| `runner-pid` | Runner | 2026-11-05 (round 15) | 2.1.318 | PN1, PN2, PN3 | **pass** (PN1–PN3); §5 below |
| `runner-privs` | Runner | 2026-11-05 (NN1 rounds 14 and 15; NN2 round 15) | 2.1.318 | NN1, NN2 | **pass** (NN1, NN2); §5 below |
| `headless-parity` | macOS | 2026-10-28 (by hand) | 2.1.312 | HP1 | **pass** |
| `headless-parity` | Linux container | 2026-11-02 (by hand, Linux run 2) | 2.1.316 | HP1 (Linux) | **pass** |
| `refusal` | Linux container | 2026-11-07 (Linux run 5) | 2.1.319 | RF1, RF2, RF3 | **pass** (RF1, RF2); recorded: ignored, F7 (RF3) |
| full-run leg | Real job | 2026-11-05 (round 15) | 2.1.318 | FR1–FR7 | **pass** (FR1–FR7); FR3 **fail** in round 13 |

The macOS job-mode results for the other job-mode legs are §9's *macOS baseline* column, and are not repeated here.

## 5. The Linux runner's PID namespace and no-new-privileges

**Who reads this:** sandbox4, to decide what an in-job route may assume about which processes a sandboxed call on the hosted runner can see and whether it can raise its privileges. Every row is `sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`. The `runner-pid` leg takes PN1–PN3 and the `runner-privs` leg takes NN1–NN2.

| Row | What it measures | Verdict | Round | Run date | Runner image | CLI | Claude Code |
|---|---|---|---|---|---|---|---|
| PN1 | the canary in the environ of the agent CLI that launched the call | **pass** | 15, run `42078018752` | 2026-11-05 | `ubuntu26` `20261101.186.1` | 0.6.10 | 2.1.318 |
| PN2 | the canary in the environ of the probe's own process, outside the call's tree | **pass** | 15, run `42078018752` | 2026-11-05 | `ubuntu26` `20261101.186.1` | 0.6.10 | 2.1.318 |
| PN3 | whether `ls /proc` in the call lists either process | **pass** | 15, run `42078018752` | 2026-11-05 | `ubuntu26` `20261101.186.1` | 0.6.10 | 2.1.318 |
| NN1 | a sandboxed `sudo -n true`, against the workflow's unsandboxed control | **pass** | 14, run `42030719431`, and 15, run `42078018752` | 2026-11-05 | `ubuntu26` `20261101.186.1` | 0.6.9 and 0.6.10 | 2.1.318 |
| NN2 | `NoNewPrivs` read from `/proc/self/status` in the call | **pass** | 15, run `42078018752` | 2026-11-05 | `ubuntu26` `20261101.186.1` | 0.6.10 | 2.1.318 |

The image is read from §9 → *Taken*, whose round 14 entry gives the same image as round 15.

**What the rows were graded against.** PN1–PN3 were graded against the sandbox-runtime README's *"its own PID namespace and a fresh `/proc`"*, checked 2026-10-24. That quotation is the expectation, not the result. NN1's control is GitHub's documented passwordless `sudo` (*GitHub-hosted runners reference*, checked 2026-11-01), and NN2 expects `NoNewPrivs: 1`. No documentation these rows cite says the sandbox sets no-new-privileges, so NN1 and NN2 rest on measurement alone.

**Earlier rounds.**

- **Round 14** (2026-11-05, CLI 0.6.9) measured NN1 first, **pass**. PN1, PN2, PN3 and NN2 printed `not run` in that round, for the reason §5 PD31 records: the permission layer refused every call naming a `/proc` path, so none of those reads reached the sandbox.
- **Round 15** measured PN1–PN3 and NN2 for the first time, after PD31's fix moved each read into a probe-written script.
- **Round 13's** probe run reached no sandboxed command on Ubuntu 26.04 (§9 *Round 13*), and none of these five rows records a result from it.
- **Round 16** ran on `ubuntu-24.04`, and none of these five rows records a result from it either (§7).

**What these results do not cover:** they hold for the GitHub-hosted `ubuntu-26.04` image `20261101.186.1` only. No row measures a self-hosted runner, Ubuntu 24.04 or any other image.

## 6. The residuals

This section holds the numbered residual list moved from [`cli.md`](cli.md) §6, numbers kept, with the new residuals appended; Task 5 of `chore_unattended_sandbox_record` fills it.

## 7. Follow-ups this record names

Each bullet is a mismatch found while writing this record, stated as a proposal, never as pending work.

- **Rows the prose still calls owed are graded.** [`cli.md`](cli.md) §6 calls CS2 owed (**Four scripts run outside the sandbox, each in one spelling.**), RG1–RG3 owed (**Everything that runs outside the sandbox is write-protected on both sides**) and CS6 owed (**A remote job passes the base profile, checked…**), and `cli/templates/scripts/commit-on-branch.sh` → WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX calls CS2 owed. Each row is **pass**. Proposal: cite each verdict instead. Roadmap item <pending>.
- **`cli.md` §6 calls two recorded results unrecorded.** It calls `git-trust-file-guard.sh`'s refusal of the trio *derived from the code until AP9 is taken*, while §5's second-round AP9 is **pass**, refused by the hook. It twice says the control is *to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6*, while §5 records it as session 2, AP7. Proposal: cite those rows. Roadmap item <pending>.
- **Row ids repeat in `sandbox-verification.md`.** AP1–AP9 recur across four §5 tables, and §7's table for the answered `fixable: 0` park reuses AP1–AP8 for unrelated checks, so a bare AP id names no single row. Proposal: a per-table suffix, as `(Linux)` and `(runner)` already do. Roadmap item <pending>.
- **`cli.md` §6 reads the launcher's exclusion as host-conditional.** *"On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth"* reads as an entry written only there. The code writes it on every host, and the launcher only answers `in-session` off one (§2 above). Proposal: reword that sentence. Roadmap item <pending>.
- **Measurements still owed.** No row reads a hook, plugin monitor, LSP server, the status line or `apiKeyHelper` running outside the sandbox: §1 rests on documentation for them. MC1 has not run on any platform. N5 has no WSL2 row. The launcher's own excluded spelling under an assignment prefix is not measured (`cli/templates/scripts/launch-sandboxed-gates.sh` → NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET). Roadmap item 21.
- **§9 records round 16 per row for IS1–IS4 only.** `sandbox-verification.md` → §9 *Taken* gives round 16 on `ubuntu-24.04` the same totals as round 15. No other §9 row records a round-16 verdict, PN1–PN3 and NN1–NN2 included, so §4 and §5 above give the 24.04 image for `runner-install` only. Proposal: record round 16 in each row it took. Roadmap item <pending>.
- **§9's and §10's `Stamp.` paragraphs are still the fill-in template.** Each still reads *To be filled by the person who takes the rows*, while the *Taken* block under it carries each round's stamp. §5 above reads the runner image from §9 → *Taken* for that reason. Proposal: replace each template with the stamps, or with a pointer to *Taken*. Roadmap item <pending>.
- **The evidence record calls measured sections owed.** `sandbox-verification.md` → *Since then* says §8's and §9's rows are all owed and §10's are all *not yet measured*. §8's heading still ends `(owed)`. §4 above cites graded rows from all three sections. Proposal: reword the summary and the heading. Roadmap item <pending>.
- **§8 has no stamp for Linux run 4.** Its stamp lines cover runs 1, 2, 3 and 5 and the Ubuntu 26.04 host. The §8 rows graded in run 4 (W7 (Linux), CS3 (Linux), CL5 (Linux), GS1–GS4) take that run's date and version from §0 *The probe's fourth Linux run*. Proposal: add a *Stamp, Linux run 4* line. Roadmap item <pending>.
- **N5's and W6's macOS verdicts name run 2.** §0 *The probe's third run* records both passing again on 2026-10-28 on Claude Code 2.1.312. Each row's verdict cell still names run 2, and §3's N5 table follows it (2026-10-27, 2.1.311), while §4 above dates the `network` and `write-protection` legs by run 3. Proposal: name run 3 in both verdict cells. Roadmap item <pending>.
- **Gate 15's *What a Linux run expects* table predates the Linux runs.** [`development.md`](development.md) → **Gate 15** says no row in it has a Linux result yet, while §8 records five Linux runs. Its *macOS baseline (latest)* column gives T2 and CS3 at 2026-10-27 and CL5 at run 1, although the fifth run re-passed all three on 2026-11-04. Proposal: point the table at §8 and §4 above. Roadmap item <pending>.
- **Measurements §4 and §5 leave owed.** N4 (Linux) prints `not run`. LB5 prints `not run` (F10) in the container and on the runner. The `runner-pid` and `runner-privs` legs have no result on a self-hosted runner or on any image but `ubuntu-26.04` `20261101.186.1`. Roadmap item 21.
