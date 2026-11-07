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

This section holds each gate leg's measured verdict per platform, with its row id; Task 4 of `chore_unattended_sandbox_record` fills it.

## 5. The Linux runner's PID namespace and no-new-privileges

This section holds the GitHub-hosted runner's PID-namespace and no-new-privileges results from `sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`; Task 4 of `chore_unattended_sandbox_record` fills it.

## 6. The residuals

This section holds the numbered residual list moved from [`cli.md`](cli.md) §6, numbers kept, with the new residuals appended; Task 5 of `chore_unattended_sandbox_record` fills it.

## 7. Follow-ups this record names

Each bullet is a mismatch found while writing this record, stated as a proposal, never as pending work.

- **Rows the prose still calls owed are graded.** [`cli.md`](cli.md) §6 calls CS2 owed (**Four scripts run outside the sandbox, each in one spelling.**), RG1–RG3 owed (**Everything that runs outside the sandbox is write-protected on both sides**) and CS6 owed (**A remote job passes the base profile, checked…**), and `cli/templates/scripts/commit-on-branch.sh` → WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX calls CS2 owed. Each row is **pass**. Proposal: cite each verdict instead. Roadmap item <pending>.
- **`cli.md` §6 calls two recorded results unrecorded.** It calls `git-trust-file-guard.sh`'s refusal of the trio *derived from the code until AP9 is taken*, while §5's second-round AP9 is **pass**, refused by the hook. It twice says the control is *to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6*, while §5 records it as session 2, AP7. Proposal: cite those rows. Roadmap item <pending>.
- **Row ids repeat in `sandbox-verification.md`.** AP1–AP9 recur across four §5 tables, and §7's table for the answered `fixable: 0` park reuses AP1–AP8 for unrelated checks, so a bare AP id names no single row. Proposal: a per-table suffix, as `(Linux)` and `(runner)` already do. Roadmap item <pending>.
- **`cli.md` §6 reads the launcher's exclusion as host-conditional.** *"On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth"* reads as an entry written only there. The code writes it on every host, and the launcher only answers `in-session` off one (§2 above). Proposal: reword that sentence. Roadmap item <pending>.
- **Measurements still owed.** No row reads a hook, plugin monitor, LSP server, the status line or `apiKeyHelper` running outside the sandbox: §1 rests on documentation for them. MC1 has not run on any platform. N5 has no WSL2 row. The launcher's own excluded spelling under an assignment prefix is not measured (`cli/templates/scripts/launch-sandboxed-gates.sh` → NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET). Roadmap item 21.
