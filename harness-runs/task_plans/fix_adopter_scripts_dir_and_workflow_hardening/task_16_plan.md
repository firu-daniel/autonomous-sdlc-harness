### Task 16 — Update `docs/remote-execution.md` and `docs/retrieval.md` for `harness-scripts` and the hardened workflows

**Goal:** The remote-execution guide's script commands name the directory a fresh `init` writes. Its upgrade section says which workflows `--upgrade-workflows` delivers new action pins to. Its security section states the hardening: SHA pins, per-job permissions, unpersisted credentials where a job needs none, and the residual `zizmor` findings with their reasons. The retrieval guide's `.mcp.json` example names `harness-scripts`.

**Depends on:**
- **Task 1** — a fresh `init` writes `"scriptsDir": "harness-scripts"`; an absent key still means `scripts`.
- **Tasks 7–9**, whose template headers this restates rather than re-derives:
  - **Pins.** Every `uses:` is pinned to a commit SHA in its current major, with the version on the line above. The pins are `actions/checkout` v5.1.0, `actions/setup-node` v5.0.0, `actions/cache` / `cache/restore` v5.1.0 and `actions/upload-artifact` v6.0.0.
  - **Permissions.** Workflow-level `permissions: {}`, with per-job grants as each file's `# THE PERMISSIONS.` block states; `harness-run.yml`'s `wrong-ref` gets none.
  - **Credentials.** `persist-credentials: false` on the `warm` checkout only. The `run`, `collect`, `trigger` and `control` checkouts keep their credential because those jobs push through `push-branch.sh`; `harness-run.yml`'s only artifact upload sits under `runner.temp`, and the other two files upload nothing. The `poll` checkout keeps its credential because the poller's `remote_branch_exists` runs `git ls-remote … origin` through it, which a private repository refuses without it; its `harness-poll-state` upload is `<stateDir>/autonomous_logs/poll_state/current`, which does not contain `.git/`.
  - **The residual `zizmor` findings.** `artipacked` ×5 on those five checkouts, and `adhoc-packages` ×2 on the `claude` CLI install in `harness-run.yml` and `harness-control.yml`. The latest CLI is kept because `harness-control.yml` is never re-rendered by pin.
  - **Delivery.** `init --upgrade-workflows` re-renders `harness-run.yml` and `harness-resume.yml`. `harness-trigger.yml` and `harness-control.yml` take new pins only through `init --force` (`cli/src/generators/githubWorkflows.ts` → choices 4 and 5).

**Where this task stops.** These two files only. The gate record and the audit figures are Task 17's, and the Gate 12 hand-run is a manual step in the story index.

### Targets

- `docs/remote-execution.md`
- `docs/retrieval.md`

**Work:**

- [ ] **`docs/remote-execution.md` → the two script commands** (story index → `## Scope register`, rows 2, 3, 9 and 13). "To stop a run, with the default `scriptsDir` of `scripts`:" and step 7's "With the default `scriptsDir` of `scripts`" become "with `scriptsDir` `harness-scripts` — what a fresh `init` writes; substitute yours". Their fenced commands become:

  ```
  bash harness-scripts/remote-run.sh stop <branch>
  ```

  ```
  bash harness-scripts/remote-run.sh warm
  ```

  Each stays one command in its own fenced block (`harness-runs/lessons.md` → `## Adopter-facing documentation`).
- [ ] **`docs/remote-execution.md` → `### Upgrading`.** Add what reaches an already-wired repository in 0.6.6:
  - `--upgrade-workflows` re-renders `harness-run.yml` and `harness-resume.yml` at the new pins, after a `.bak`;
  - `harness-trigger.yml` and `harness-control.yml` take them only from `init --force`, which regenerates every generated file after a `.bak`, as the section already says.

  Give each command in its own fenced block.
- [ ] **`docs/remote-execution.md` → `## 11. Security`.** Add a paragraph, or a short list, on the workflow hardening, citing the headers rather than restating each grant:
  - why a SHA rather than a tag;
  - least-privilege grants per job;
  - which checkouts persist a credential and why;
  - the residual findings an adopter's `zizmor --offline --no-config` will report, with the one-line reason each stands.

  State plainly that the templates carry no `zizmor` ignore comment, because an adopter runs the audit with `--no-config`.
- [ ] **`docs/retrieval.md`.** Change the `.mcp.json` example's `"args": ["scripts/docs-search-server.sh"]` to `"args": ["harness-scripts/docs-search-server.sh"]` (row 14). The sentence after it, "`command`, `args` and `type` are `init`'s and already correct for your configured `scriptsDir`", stays.
- [ ] **Leave the recorded measurements alone.** Rows 10–12, 15 and 16 of the register are this repository's own scripts or recorded Gate 10 measurements, and stay byte-identical: the `scripts/probe-plugin-cli.sh` citations, the `scripts/tag-release.sh` sentence, "Two environment faults the run hit" and the `## Still open` item.

**Verification:**

- **The stale prose is gone.** Re-run the story index's derivations **D1** and **D2**. In these two files, every remaining hit is a row the register marks `no-change`.
- **Fenced blocks.** `grep -n 'harness-scripts/' docs/remote-execution.md docs/retrieval.md` shows each new command in a fenced block of its own.
- **Facts match the headers.** Read the §11 text against the four template headers Tasks 7–9 wrote. Every grant, credential and residual it names appears there in the same terms.
