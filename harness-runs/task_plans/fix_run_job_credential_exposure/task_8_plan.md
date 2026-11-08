### Task 8 — Describe the session's environment and the push scan in `watcher.md`, `sandbox-record.md` and `ARCHITECTURE.md`

**Goal:** Bring three documents in line with what Tasks 3 and 4 changed: what reaches the launched session's environment, and the new step in `push-branch.sh`'s check order (goals 1, 4, 5 and 6). `docs/watcher.md` gains the section that owns the session's environment for readers. Everything else cites it.

**Depends on:**

- **Task 4** (`autonomous-watcher.sh` → `spawn_engine` and `check_push_refusals`).
  - **The strip set**, both modes: every `sandbox.credentials.envVars[].name` of the `--settings` file passed, except `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`, plus `SESSION_ENV_STRIP_EXTRA` (`HARNESS_PUSH_URL`, `HARNESS_GIT_TOKEN`). It is unset inside the launch group, so the watcher's own passes keep everything.
  - **The local allow-list:** `SESSION_ENV_BASE` plus `sandbox.passEnv` from the main checkout's config, applied before the strip, so the strip wins.
  - **What is still set:** `HARNESS_MAIN_REPO` and `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, after the scrub.
  - **Refusals:** an unreadable profile `envVars` or configuration refuses the launch before the agent starts. Both are read in `spawn_engine`'s own shell, so the run goes `failed` with a `not launched: <reason>` notification.
  - **The agent CLI's routing names in the base set:** `ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL`, non-secret, so a gateway URL or a pinned model still reaches a local session. A gateway's own credential (`ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_CUSTOM_HEADERS`) and a Bedrock/Vertex setup (`CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` and their cloud credentials) are not in it and need `sandbox.passEnv`.
  - **The HTTPS push names in the base set:** `DBUS_SESSION_BUS_ADDRESS`, `GH_CONFIG_DIR`, `GIT_ASKPASS` and every `GCM_` name, so an in-session `push-branch.sh`'s credential helper still finds a stored credential. `GH_TOKEN` and `GITHUB_TOKEN` stay stripped whatever `sandbox.passEnv` says.
  - **Push refusals, at two call sites.** Whatever the record's reason, the outcome is the same: the run is `failed` with `push refused: <reason>`, one `failed` notification carries that reason (which carries its own way on), the record moves to `handled/`, and in a job the watcher prints `::error title=Push refused::…` and ends with decision `stop`.
    - **The tick pass, `check_push_refusals`**, runs beside `check_stalled_runs` in both modes. For a `running` run with a record, it raises the registry marker `push_refusing` first, as the stall watchdog raises `stall_killing`, then stops the session through the kill tier's teardown. It is the only site that tears a session down.
    - **`classify_run_exit`** returns at once while `push_refusing` is set, as it does for `stall_killing`. Otherwise, before it classifies, it checks its **own branch only** and tears nothing down, because the engine has already exited. This is how a refusal wins over `completed` when the agent exits 0 after a refused push. One branch's exit never reads or acts on another branch's record. **The watcher writes no job-summary line.** The summary row is `remote-run.sh save`'s `### harness run <branch>` row, which carries the watcher's `failed` status, `stop` decision and `push refused: <reason>` detail.
- **Task 3** (`push-branch.sh`). After the remote checks and the deleted-on-its-remote check, and before the clone's verify and the push, it scans the commits to send for every credential it can find. Then, only when the main checkout carries the job push-credential marker (`harness.pushCredential job-token`, set by `remote-run.sh push-credential store` in a GitHub job), it refuses commits that change a file under `.github/workflows/`, because the job's token cannot push them. On a hit of either, or a failed scan, it prints `refusing to push: …`, writes a record under `<main>/.git/harness-push-refusals/`, and exits 0.

**Where this task stops.** The job's credential design — the `open` and `deliver` jobs, the stored push credential, why not the other candidates — is stated in `docs/remote-execution.md` by **Task 11**. Do not restate it here. The `sandbox.passEnv` row of `docs/config.md` is **Task 9's**, and it points at this task's new section.

### Targets

- `docs/watcher.md` — §1 step 6, a new `### The session's environment` under `## 2. The scripts`, §1 step 7's or §4's statement of the `failed` reasons, and §4's `watcher.env` paragraph.
- `docs/sandbox-record.md` — `## 2.` → **The checks each git wrapper runs, in order.**
- `ARCHITECTURE.md` — `## 5.`'s launch-path row for `autonomous-watcher.sh` → `spawn_engine`.

**Work:**

- [ ] **`docs/watcher.md` → `### The session's environment`** (new, under `## 2. The scripts`, beside `### The main-checkout anchor`). Open it with its reader. It states:
  - the strip set and its owner: the profile's `sandbox.credentials.envVars`, minus the agent's credential, plus the two watcher-owned names, each with why;
  - the local allow-list, listing `SESSION_ENV_BASE` (this section is where a reader finds the base set), `sandbox.passEnv` and that the strip wins;
  - that job mode applies the strip only, and why;
  - that `HARNESS_MAIN_REPO` and `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` are still set;
  - what breaks under the allow-list and how to restore a variable — commands in fenced blocks, one per line. Name, beside a gate's variable, a Bedrock/Vertex setup **and an API gateway**: `ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL` are kept, so a gateway that takes `ANTHROPIC_API_KEY` keeps working, but one that needs `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_CUSTOM_HEADERS` fails to reach the API until `sandbox.passEnv` lists that name;
  - **what breaks for a local HTTPS push:** one that authenticates through `GH_TOKEN` or `GITHUB_TOKEN` in the operator's shell stops working, because the strip wins over `sandbox.passEnv`. `push-branch.sh` still exits 0, so the only sign is its `push failed for` line, and commits stop reaching the remote. Give the way on, one command per line in fenced blocks. Either store a credential outside the environment:
    ```
    gh auth login
    gh auth setup-git
    ```
    or push over SSH:
    ```
    git remote set-url origin git@github.com:<owner>/<repo>.git
    ```
    Say that the sandboxed agent cannot read either credential, because `~/.config/gh` and `~/.ssh` are in the profile's `sandbox.credentials.files`, while the unsandboxed `push-branch.sh` can;
  - that a `watcher.env` value now reaches the watcher but not the session unless listed;
  - the measured scope: hygiene that blocks casual reads, a boundary only beside the sandbox's PID namespace and no-new-privileges, `pass` on the GitHub-hosted `ubuntu-26.04` image `20261101.186.1` only (`docs/sandbox-record.md` → `## 5. The Linux runner's PID namespace and no-new-privileges`), unverified elsewhere.

  Name the trade the allow-list made over a deny-list of secret patterns: a deny-list leaks any secret whose name matches no pattern, and an allow-list drops a needed variable until it is listed.
- [ ] **`docs/watcher.md`, the other sites.**
  - §1 step 6: one clause that the session's environment is scrubbed and stripped, citing the new section.
  - The `failed` reasons: wherever §1 step 7 or §4 enumerates what makes a run `failed`, add the refused push and the `check_push_refusals` pass, for both reasons: a credential in the commits to send, and, in a GitHub job, a change to a file under `.github/workflows/`. Cite `push-branch.sh`'s two header paragraphs by name for what is checked, and `docs/remote-execution.md` for why a job cannot push a workflow file. In a job, say that the refusal reaches the job summary through `remote-run.sh save`'s row, not through the watcher.
  - §4's **Changing one is an operator action, not a file edit.** paragraph: after *"Credentials do not belong in it"*, say its values reach the watcher, not the session, unless `sandbox.passEnv` lists them.
- [ ] **`docs/sandbox-record.md` → `## 2.` → The checks each git wrapper runs, in order.** The list ends at step 7 (*The branch is read once from the main checkout*), and the sentence *"`push-branch.sh` and `refresh-branch.sh` run the same calls in the same order"* follows it.
  - Keep the seven steps, and add after the list that `push-branch.sh` adds two steps `refresh-branch.sh` does not, both after its remote checks and before the push: the credential scan, and, only where the job push-credential marker is set, the workflow-file refusal. Mark both *derived from the code*, citing the script's two header paragraphs by name. Phrase the first-seven sentence so it stays true.
  - This file states no result stronger than a row it cites, and no row measures either step. So mark them *derived from the code*, and add one §7 bullet proposing probe rows for them, in that section's proposal form, citing roadmap item 21 as §7's other owed-measurement bullets do.
- [ ] **`ARCHITECTURE.md` → `## 5.`**, the `spawn_engine` row's second column: replace *"The session is launched with two environment variables"* with the scrubbed environment. The two set variables stay, the strip set is named by its owner (the profile's `envVars`), and the local allow-list is cited as `docs/watcher.md` → `### The session's environment`. Add to the row's last column what an equivalent engine would need: a way to launch with a scrubbed environment. Keep the row's other cells.

**Verification:**

- The new `docs/watcher.md` section is the only place this task lists the base set's names. The other two files cite it.
- Every added statement about the GitHub job's credential design is a citation of `docs/remote-execution.md`, not a restatement.
- `### The session's environment` names the API-gateway case beside Bedrock/Vertex: which routing names the base set keeps, and that a gateway's own credential needs `sandbox.passEnv`.
- `### The session's environment` states that a local HTTPS push through `GH_TOKEN` / `GITHUB_TOKEN` stops working, and gives both ways on as fenced commands, one per line.
- `docs/sandbox-record.md`'s new sentence carries *derived from the code* and cites no evidence row for the scan or the workflow-file refusal.
- No added sentence says the watcher writes the job summary: the summary is named as `remote-run.sh save`'s row.
