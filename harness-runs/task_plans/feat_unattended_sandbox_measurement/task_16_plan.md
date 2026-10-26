### Task 16 — Add the probe's new rows to `docs/sandbox-verification.md`, re-target C2, K2 and CW4, and name the probe in §0

**Goal:** Define, in the evidence record, every row id the probe's legs name that the file does not yet carry, each with its check and its expected result and marked *not yet measured*; re-target the worktree rows C2, K2 and CW4 at the clone; and name the probe where §0 and §3 need it. This branch writes no measured result.

**Depends on:** Tasks 1 and 5–12, which fix the leg → row mapping this task records. The row text describes the check each leg makes, so the plan's leg definitions are the source. This task edits only `docs/sandbox-verification.md`.

### Targets

- `docs/sandbox-verification.md` — new rows and re-targeted rows only; no Observed cell is filled.

**Work:**

- [ ] **The new rows, each with a Check and an Expected cell and `not yet measured — taken by the probe` in Observed and `not run — owed` in Verdict**, following the existing owed-row style (CS1's, W6's):
  - **§3, beside P1a:** **P1b** (`GIT_SSH_COMMAND=<probe> bash <main>/scripts/push-branch.sh <clone>` — either stays sandboxed or is neutralised, the probe says which) and **P1c** (`bash <main>/scripts/push-branch.sh <clone>; git status` — stays sandboxed). Remove these two from the §3 *Owed a re-run.* paragraph's "owed new rows beside P1a" sentence, since they now exist.
  - **§4:** **SR1** (`scripts/scratch-run.sh` runs a probe file sandboxed), **SR2** (a write outside the allowed roots from inside that file is refused), **MC1** (the `harness-docs` MCP server answers a `search_docs` call; it runs outside the sandbox by design), **N3** (a loopback-only host refused), **N4** (a link-local-only host refused), **N5** (a sandboxed call carrying `allowed_domains` is refused or reaches the host — the leg that matters most; if it reaches the host, a finding with its own follow-up), **RT1** (`dangerouslyDisableSandbox: true` does not run unsandboxed under `allowUnsandboxedCommands: false`), **S4** (the token variables the profile unsets are absent), **S5** (`ssh-add -l` records whether the agent socket is reachable), **RS1** (a planted `<clone>/.claude/settings.local.json` loosening changes none of the legs), **HP1** (headless parity: the network, retry and write-protection legs re-run in an interactive session).
  - **§2, in the clone-layout table (`### The clone layout (owed)`):**
    - **CS12** (planted `objects/info/http-alternates` refused), **CS13** (planted `commondir` refused), **CS14** (planted `config.worktree` refused), each where CL5 measured new files writable. Expected: `commit-on-branch.sh: refusing to commit: '<clone>' is a clone, but <clone>/.git/<name> exists, and a clone the harness made has none`, `refs/heads/<branch>` unchanged.
    - **CS15** (a key outside the clone allow-list). Check: the key `sbx.cs15` planted from a terminal in `<clone>/.git/config` with `git config --file <clone>/.git/config sbx.cs15 true`; then, from a sandboxed session with cwd = `<clone>`, `bash <main>/scripts/push-branch.sh <clone>` and `bash <main>/scripts/commit-on-branch.sh --repo <clone> <file> -- "<subject>"`. Expected: each refused before any git call, with a line ending `<clone>/.git/config sets sbx.cs15, which the clone allow-list does not hold, so this clone's configuration is not trusted` (`hr_clone_config_check_var`); `ls-remote` tip and `refs/heads/<branch>` unchanged. A wrapper that proceeds is a `fail`: the allow-list did not hold.
- [ ] **Re-target C2, K2, CW4** (§3). Change each row's Check to name the probe clone's `.git/config` rather than a worktree's `config.worktree`, and add one sentence to each saying it is now measured against the clone, as the prompt directs ("Re-target the worktree rows C2, K2 and CW4 at the clone, and say so in their rows"). Keep each row's 2026-10-14 worktree result intact as the prior record; the re-target changes the Check and Expected, not the history.
- [ ] **Name the probe in §0.** Add a short paragraph under `## 0. Method` naming `scripts/sandbox-probe.sh`: that it cuts a throwaway clone through `create-worktree.sh`, renders the per-run profile with the watcher's own functions, launches on the watcher's launch line, prints one result line per leg, and that a person starts it by hand, because auto mode refuses a `claude -p` carrying `--allowedTools`. The paragraph carries **no inline invocation**: it points to a fenced block directly below it holding the two commands, one per line, and the prose names which line is for a terminal and which for a session (`harness-runs/lessons.md` → `## Adopter-facing documentation`, the fenced-block lesson):

  ```
  bash scripts/sandbox-probe.sh run
  ! bash scripts/sandbox-probe.sh run
  ```

  The same paragraph says that CS1's probe set includes the installed plugin root, resolved from the plugin install record, and that CS1's evidence records whether the per-run profile lists it or only the runtime's write roots refused it (Task 10), so the prompt's *"That includes the plugin root"* is visibly measured rather than assumed. CS1's own row text is not edited.
- [ ] **Update the §3 *Owed a re-run.* paragraph and the opening *Who reads this* paragraph** so each names the probe as the tool that takes the owed rows, without asserting any result. The §3 paragraph already lists the clone-layout answers (OR1–OR3); add that P1b, P1c and the planted/refresh rows are the probe's to take.
- [ ] **A measured fact states the command and the exact message** (`.claude/context/conventions.md` → `## Documents of record`): every new row's Expected cell names the command and the message it will be judged by, so a later measurement is checkable.

**Verification:**

- Each new row id (P1b, P1c, SR1, SR2, MC1, N3, N4, N5, RT1, S4, S5, RS1, HP1, CS12, CS13, CS14, CS15) appears exactly once, with an Expected cell and `not yet measured` / `not run — owed`.
- `git grep -n 'not yet measured — taken by the probe' docs/sandbox-verification.md` lists exactly the new rows this task added.
- No Observed cell carries a result this branch invented; C2, K2 and CW4 keep their prior Observed text and gain a re-target sentence.
- Every new row id matches the leg table `bash scripts/sandbox-probe.sh --list` prints.
- No probe invocation appears inline in the new §0 prose: `bash scripts/sandbox-probe.sh run` and `! bash scripts/sandbox-probe.sh run` each appear only as a line of the fenced block below the paragraph.
- The §0 paragraph names the plugin root as a CS1 target and says CS1's evidence records which layer refused it.
