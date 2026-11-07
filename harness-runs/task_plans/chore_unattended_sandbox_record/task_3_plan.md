### Task 3 — Create `docs/sandbox-record.md`: opening, §1 contents, §2 what runs outside, §3 the domain list

**Goal:** Create the unattended sandbox's document of record. This task writes the whole heading skeleton and fills four parts: the opening, §1 (what the sandbox contains and what it does not), §2 (every command that runs outside it, with its reason), and §3 (the domain list and what an entry still permits, including the measured answer on the Bash tool's per-call `allowed_domains`). Every result is a verdict plus the evidence row id it rests on, and is no stronger than that row.

**Depends on:** Task 2, by ship order. No file is shared. This task creates `docs/sandbox-record.md` and **owns its skeleton**. Task 4 then fills §§4–5, Task 5 fills §6, and Task 7 resolves the `<pending>` tokens in §7. None of them renames a heading this task writes.

**How this task reads the conventions.** This is the catch-all layer, so read all three conventions documents. The ones that bind here:

- `.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured, the command and the exact message. A deferral cites a numbered roadmap row.
- The same document's `## What accompanies a new unit of each kind`, last row: a prose document under `docs/` states who reads it and what it owns.
- `docs/development.md` → `## 6. The roadmap this tree defers to`: item 21 is the sandbox-measurement item.

### Targets

- `docs/sandbox-record.md` (new).

**Work:**

- [ ] **Skeleton and opening.** Create the file with exactly these headings, in this order:
  - `# The unattended sandbox: the document of record`
  - `## 1. What the sandbox contains, and what it does not`
  - `## 2. What runs outside the sandbox, and why`
  - `## 3. The domain list, and what an entry still permits`
  - `## 4. The measured results, per leg`
  - `## 5. The Linux runner's PID namespace and no-new-privileges`
  - `## 6. The residuals`
  - `## 7. Follow-ups this record names`

  Under §§4–6, write one sentence each stating what the section holds and which branch task fills it. Task 4 and Task 5 replace those sentences.

  The opening paragraph states:
  - **Who reads this:** a maintainer changing the sandbox block, the excluded scripts or the write protection, and sandbox4 for §5.
  - **Which of three files owns what.** [`sandbox-verification.md`](sandbox-verification.md) is the evidence record: one row per check, with its procedure, expectation, observed quote and verdict. This file owns the model and the residuals. It cites evidence rows by id, stays no stronger than the row cited, and carries no observed quote. `docs/sandbox.md`, the adopter-facing explainer `chore_unattended_sandbox_doc` writes later, will explain and link to this file. Name it as a file that does not yet exist, not as a link, so no link dangles.
  - **Who owns how each check works.** `docs/cli.md` §6 and the wrapper headers own that, and this file links them.
- [ ] **§1.**
  - **Inside the sandbox:** Bash and every process it starts.
  - **Outside it, with the user's full access:** the file tools, which follow the profile's permission rules (`Edit`, `Read` and the rest) and not the sandbox; hooks; local MCP servers; plugin monitors; LSP servers; the status line; and `apiKeyHelper`. Cite these as the documentation's statement rather than a measurement: Claude Code's sandboxing page, `https://code.claude.com/docs/en/sandboxing` → "What runs outside the sandbox", checked 2026-10-24.
  - **Subagents** share the parent's sandbox.
  - **Measured readings.** Wherever `docs/sandbox-verification.md` has a row that reads one of these on a real session, give its verdict with its row id. For example, the retrieval MCP server answering outside the sandbox is MC1, and an `Edit` deny rule enforced inside the sandbox on Linux is AP7. Read each row's verdict before citing it.
  - **Link** to `docs/cli.md` → `### The sandbox block and the permission mode` for the profile's own settings, and do not restate them.
- [ ] **§2.** One short entry per command that runs outside the sandbox, kept as short as the code allows.
  - **The four excluded scripts.** These are the rows `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` marks `runsUnsandboxed`: `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`, and on a bubblewrap host `launch-sandboxed-gates.sh`. Each is spelled only as the main checkout's copy, `bash <repoRoot>/<scriptsDir>/<name>.sh:*`.
  - **The reason for each.** Give the reason with its rows: a sandboxed git cannot move the main checkout's branch or write a hand-made worktree's record (CL4, G1, G2, F1), and on Linux a process a sandboxed call detaches did not outlive the call (F10, from BG9, LB5, T3). Give the excluded-entry form with P1a and P2. The prompt names three wrappers, and the code wins with four.
  - **The checks each runs, in order, as a numbered list.** The configuration read, `hr_wrapper_target_check_var` (target, then clone arm), the per-working-copy configuration check, the hooks pin and the environment drop. Each item is one line linking `docs/cli.md` → the paragraph **The excluded rule's `:*` accepts any argument…** and the wrapper header that owns it, such as `cli/templates/scripts/commit-on-branch.sh` → WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX. Read the order off those owners rather than off this plan.
  - **The watcher family's own git calls.** Link to [`watcher.md`](watcher.md) → `### Where the family runs git in a run's copy, and under what pins`.
  - **The configured bootstrap commands**, with one line and a forward pointer to §6 residual 1, item 1.
  - **The scripts the watcher, the remote job or a person run outside any session.** One line, linking `docs/cli.md` §5 → **Two families land in `scriptsDir`**.
- [ ] **§3.**
  - **What the list is.** `sandbox.allowedDomains` in `harness.config.json`, empty by default, each entry carrying a `reason` the profile's `_README` repeats. The one conditional shipped entry is `127.0.0.1`, under the interactive-test wiring. Link `docs/config.md` §5's row.
  - **What an entry still permits.** The proxy decides on the hostname the client supplies and does not inspect TLS, so a broad entry such as `github.com` is an exfiltration path, domain fronting included.
  - **`strictAllowlist`** is honoured from `--settings`: N1, N2.
  - **The network-client `deny` rules** are prefix matches, cosmetic without the sandbox.
  - **The measured answer on the Bash tool's per-call `allowed_domains` parameter** is row N5's verdict, quoted as a verdict with its date, platform and Claude Code version, never as the observed text. If N5 was not run on a platform, write *not yet measured* for that platform.
- [ ] **§7.** Write one lead sentence: each bullet below is a mismatch found while writing this record, stated as a proposal, never as pending work. A bullet whose remedy is a measurement still owed cites roadmap item 21. Any other bullet carries the literal token `roadmap item <pending>`, which Task 7 replaces with the row it adds to `docs/development.md` §6. Add a bullet for every mismatch this task finds between code and docs, or between `docs/cli.md` and `docs/sandbox-verification.md`. Fix none of them.

**Verification:**

- `grep -n "^#" docs/sandbox-record.md` prints the eight headings above, exactly as spelled.
- Every row id the file names exists in `docs/sandbox-verification.md`: `grep -oE "\b[A-Z]{1,3}[0-9]+[a-z]?\b"` over the new file, then each id checked in the evidence record's tables. For each, the verdict this file states is the row's verdict or weaker.
- Read every blockquote and fenced block in the new file: none is observed output quoted from a row. Commands shown as configuration, such as the excluded-entry form, are allowed.
- No sentence states a result without a row id, a dated documentation citation, or the words *derived from the code*.

**Deviations from plan:**

- **§2 check order.** The plan listed the configuration read, the target check, the per-working-copy check, the hooks pin and then the environment drop. The owners give a different order: `cli/templates/scripts/commit-on-branch.sh` drops the environment first (`hr_git_env_drop`, the first statement after sourcing the library), then `hr_wrapper_main_of`, the configuration read, `hr_wrapper_target_check_var`, `hr_worktree_config_check_var`, `hr_pinned_hooks_path` and `hr_wrapper_branch_var`. `push-branch.sh` and `refresh-branch.sh` call them in the same order, read off their call sites. Implemented in the owners' order, with the branch read added as item 7.
- **The launcher's entry is not host-conditional.** The plan wrote "on a bubblewrap host `launch-sandboxed-gates.sh`". `cli/src/generators/sandboxProfile.ts` → `expectedSandbox` writes one entry per `runsUnsandboxed` row on every host, and off a bubblewrap host the launcher answers `in-session`. Implemented as four entries on every host. `docs/cli.md` §6's wording is a §7 bullet.
- **The plan's two example readings are cited at their real verdicts.** The plan's AP7 example (an `Edit` deny rule enforced inside the sandbox on Linux) is §5 session 2's AP7, verdict **recorded**, not graded, so it is cited as recorded. MC1 is **not run** on macOS and Linux, so the retrieval server running outside the sandbox is stated as not measured. That AP ids repeat across tables is a §7 bullet.
- **Rows added beyond the plan's list:** CS2 (the main checkout's whole `.git` refused, which is why a sandboxed commit in a clone cannot move the run's branch) beside CL4, and P3 (a run copy's own `push-branch.sh` stays sandboxed) beside P1 and P2. P3 is not cited as an excluded copy landing.
- **§7's mismatches**, each found while writing: `docs/cli.md` §6 and `commit-on-branch.sh`'s header call graded rows (CS2, RG1–RG3, CS6) owed; `docs/cli.md` §6 calls AP9 and the session-2 control unrecorded; AP ids repeat in `docs/sandbox-verification.md`; `docs/cli.md` §6 reads the launcher's exclusion as host-conditional. Measurements still owed go under roadmap item 21.
- **Evidence the verdicts rest on.** Each row id was checked against `docs/sandbox-verification.md` by reading the row's own verdict cell (or, for the failure-table entries F1, F3, F8, F9 and F10, its text, which grades nothing). The sandboxing-page citation (`https://code.claude.com/docs/en/sandboxing`, checked 2026-10-24) is carried from this plan. It was not re-fetched in this session.
