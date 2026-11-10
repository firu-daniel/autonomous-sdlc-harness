### Task 18 — Add the screen to `README.md` → `## Scope and limits`, `docs/cli.md` and `docs/watcher.md`

**Goal:** Tell an adopter, in the root documents, the three facts about the screen:
- it exists;
- it is a screen and not a boundary;
- the new outer-loop script is one the orchestrating session runs.

This branch starts no `SECURITY.md`, for the reasons the story index's **Decisions** record, so nothing here creates one.

**Depends on:**
- **Task 1's row:** `prompt-injection-screen.sh`, `agentInvocable: true`, no `runsUnsandboxed`, no `DENY_SCRIPT_BASENAMES` entry, run by the orchestrating session as the main checkout's copy, sandboxed. The profile therefore emits its two allow forms.
- **Tasks 2–4:** its verbs. `prescan` prints SHA-256s and pre-scan hits; `plan` classifies the screened set; `park` and `verdict` write a `question_<n>.md` park.
- **Task 10:** the instruction `plugin/instructions/prompt_injection_screen.md`.
- **Task 8:** the agent `plugin/agents/prompt-injection-reviewer.md`.

**How this task's implementer reads the conventions.** This is the catch-all task, the `layers[]` row whose `path` is `"."`. Read every configured layer's conventions document.

### Targets

- `README.md` — `## Scope and limits` → `### The shape of the system`.
- `docs/cli.md` — the paragraph opening **"Two families land in `scriptsDir`, and only one of them is generated."**
- `docs/watcher.md` — the outer-loop script table.

**Work:**

- [ ] **`README.md`.** Add one bullet to `### The shape of the system`. Its bold lead: **A prompt-injection screen runs first, and it is a tripwire, not a boundary.** It says, in two or three sentences:
  - every unattended launch screens the files a person added (the task prompt, review rounds, answers, the docs checklist), with a deterministic pre-scan and then a read-only agent, and parks on `UNSAFE`;
  - an adaptive attacker can get past it;
  - the containment is still the sandbox and profile in the bullet below.

  Link `plugin/instructions/prompt_injection_screen.md` and `docs/sandbox-record.md`. The section's opening sentence, *"This release changes none of it"*, describes the section's existing groups, so leave it as written.
- [ ] **`docs/cli.md`.**
  - Add `prompt-injection-screen.sh` to the paragraph's list of outer-loop scripts.
  - Add it to the agent-invocable set, with one clause: the orchestrating session runs the main checkout's copy at every unattended launch to pre-scan and hash the input files, and to parse the screen agent's verdict. It stays sandboxed and carries no deny-list entry.
- [ ] **`docs/watcher.md`.** Add a table row after `run-test-suite.sh`'s:
  - `` `prompt-injection-screen.sh` ``
  - what it does: the prompt-injection screen's script — pre-scans and hashes the run's input files, classifies them against the ledger record, parses the agent's verdict and writes the `UNSAFE` park; a tripwire, not a boundary
  - who runs it: the orchestrating session, as the main checkout's copy
  - profile allow entry: **yes**

**Verification:**

- `grep -c 'prompt-injection-screen.sh' docs/cli.md docs/watcher.md` reports a non-zero count for each file.
- `grep -n 'tripwire' README.md` hits inside `## Scope and limits`.
- `grep -niE 'guarantee|prevents prompt injection' README.md docs/cli.md docs/watcher.md` finds no sentence about the screen.
- `git ls-files SECURITY.md` prints nothing.
