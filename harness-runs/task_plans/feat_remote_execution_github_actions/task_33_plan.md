### Task 33 — Update `README.md`, `llms.txt`, `ARCHITECTURE.md` and the roadmap row

**Goal:** Make the project's front-door documents true after this branch — a run may now execute on GitHub Actions — and make the roadmap row say what shipped and what stays open (Acceptance 7).

**Depends on:** Task 28, which wrote `docs/remote-execution.md` (the design and lifecycle), and Task 29, which completed it (setup, runners, costs, billing, security). The shipped facts, restated for the edits: an opt-in key `execution.target` (`local` default | `github-actions`); one workflow for both runner kinds, chosen by the repository variable `HARNESS_RUNNER`; the local watcher dispatches every inbox drop and relays answers, resumes and pauses, and nothing local watches a remote run; runs longer than the hosted job limit chain through the existing pause/resume, resuming from the committed ledger; usage pauses resume through the job or a self-disabling poller; subscription token or API key; `doctor` reports the setup. **Still open:** the trigger half (issues, pull requests, comments, Jira and the like) — `feat_forge_run_triggers` — and draft-pull-request output, which belongs with the forge coupling; a run still ends at a pushed branch. `remote-run.sh` joined the script-allowlist guard's deny list (Task 21).

### Targets

- `README.md` — "**A drop becomes a pushed branch** with no queue server, webhook or scheduler in between." (register row 39), the **Single-machine.** bullet (register row 40), and `## Where to read more` (register row 70).
- `llms.txt` — the `## Where to read more` list (register row 59).
- `ARCHITECTURE.md` — §6's guards paragraph, "`DENY_SCRIPT_BASENAMES` … withholds the deploy wrapper and the three outer-loop scripts" (register row 26).
- `ROADMAP.md` — the `Cloud / CI execution` row's description and status (register row 42).

**Work:**

- [ ] `README.md`: the drop paragraph keeps its local statement and adds, in one sentence, that with `execution.target` set to `github-actions` the watcher dispatches the drop to a GitHub Actions job instead, linking `docs/remote-execution.md`; the **Single-machine.** bullet becomes a statement that a run executes on the local host by default, or opt-in in a GitHub Actions job on a hosted or self-hosted runner, while the daemons and the machine lane stay local; add `docs/remote-execution.md` to `## Where to read more` with a one-line description in the list's form.
- [ ] `llms.txt`: add the `docs/remote-execution.md` link line to `## Where to read more`, in its absolute-URL form (gate 6c checks every link resolves on `main`, so write the URL the file will have there).
- [ ] `ARCHITECTURE.md` §6: the guards paragraph names four outer-loop scripts withheld, adding `remote-run.sh`, with its **[shipped]** marker intact. Then re-run §5's derivation command (`grep -rnE 'HARNESS_AGENT_CLI|AGENT_CLI|ENGINE_COMMAND_|--output-format|--permission-mode|--settings|--add-dir|rate_limit_event|PIPESTATUS' cli/templates/scripts/ cli/src/`) and hold its output to §5's invariant — every site it reaches is a row of §5's table or disposed of by name there; job mode added no launch site, so any new hit is either disposed of in §5 in the same edit or is a defect in the code to report.
- [ ] `ROADMAP.md`: rewrite the `Cloud / CI execution` description to say what shipped — execution on GitHub Actions, hosted or self-hosted, as bounded jobs that chain and resume from the ledger, opt-in, with the docs-retrieval cache restored per job and seeded from the default branch — and what stays open: the trigger half (`feat_forge_run_triggers`) and draft-pull-request output with the forge coupling; drop the claim "Seam declared (`forge`)" only if it is no longer true (it still is: `forge` has no reader). Keep the status `Open`, since half the row is open. Cite the trigger branch by name, never by a roadmap item number.

**Verification:**

- `bash scripts/run-gates.sh` passes gates 6a–6e (self-containment, `llms.txt` links, command spelling).
- Re-run the story index's derivation entries 3 and 4 and confirm each hit in these four files is an edited sentence or a `no-change` row.
- §5's derivation output satisfies its invariant, stated in the commit.

**Deviations from plan:**

- §5's derivation also reaches `cli/src/doctor/checks.ts` (`AGENT_CLI_VARIABLE`, `DEFAULT_AGENT_CLI`), which is already on `main` and was covered by no row and no disposal, so the invariant was broken before this branch. It is disposed of by name in §5's disposition sentence in this same edit, beside this branch's one new file reached, `cli/src/remote/githubActions.ts` (a doc comment). The branch's other new hit, the watcher header's `a job` REPRO line, is the agent stub the first row already covers.
- The §6 guards paragraph names the four withheld outer-loop scripts by basename, not only their count, so the next addition to `DENY_SCRIPT_BASENAMES` changes a list a reader can check.
- Verification evidence: `bash scripts/test.sh` exited 1 with two gates failing, neither caused by this edit. 6a hit `harness-runs/scratch/t3-test.log`, a gitignored scratch log an earlier task left behind whose stack traces contain the absolute checkout path. 11 failed because the retrieval runtime is not installed on this host. 6b–6e passed, 6c (`llms.txt` links) and 6d (command spelling) among them.
