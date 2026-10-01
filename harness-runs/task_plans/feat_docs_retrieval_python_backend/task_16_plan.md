### Task 16 — Wire the Python gates into `scripts/run-gates.sh` and `docs/development.md` §5

**Goal:** Python lint, type-check and tests run where this repository's other gates run, in `scripts/run-gates.sh`, graded by exit status like every other gate there. The container-dependent leg is **opt-in** and **skips loudly** rather than failing when Docker is absent. `docs/development.md` → `## 5. Verifying a change` gains the gate. The result is Acceptance 5: on a machine with no Docker and no Python weights, `scripts/run-gates.sh` passes, and the container leg is reported as skipped rather than silently absent.

**Depends on:** Task 1 and Task 15, for `scripts/python-service.sh` and its exit contract, which this task grades and does not change: `lint`, `typecheck`, `test` and `container-test`, each exiting `0` for pass, `1` when the tool reported failure, `2` for usage, `3` when the toolchain or synced environment is missing, and `4` from `container-test` only when `docker` is not on `PATH`. It also depends on every task that adds a Python test, since gate 13c runs the whole no-container suite, including the bridge cases, which need gate 2a's `cli/dist`.

**The grading, decided.**

| Wrapper status | 13a lint / 13b typecheck / 13c tests | 13d container tests |
|---|---|---|
| `0` | passed | passed |
| `3` | **BLOCKED**, the way gate 11 treats an unprovisioned checkout: printed with its provisioning command, counted in neither array, listed with the gates the script cannot run | BLOCKED, the same |
| `4` | (not produced) | **SKIPPED**, printed loudly with its reason, counted in neither array |
| any other | failed | failed |

13d runs only when the variable `HARNESS_GATES_CONTAINERS=1` is set. Without it, 13d prints `SKIPPED 13d … — opt in with HARNESS_GATES_CONTAINERS=1 on a machine with Docker` and counts in neither array. BLOCKED rather than FAIL for an unprovisioned toolchain follows gate 11's recorded reasoning: provisioning a checkout is not a property of the code. The script's closing line names a blocked gate 13 explicitly, so a green run that ran no Python cannot read as one that did.

**Where this task stops.** It changes no gate other than 13 and adds no exclusion to gate 6a. Task 1's wrapper keeps the Python environment and caches outside the checkout, so the story index's scope register leaves Gate 6's text unchanged. It does not run `scripts/run-gates.sh`, `commands.test` or any wrapper gate sub-command (story index → the test-run note). Phase G runs them.

### Targets

- `scripts/run-gates.sh`
- `docs/development.md` → `## 5. Verifying a change` (scope register rows 1, 2 and 10)

**Work:**

- [ ] `scripts/run-gates.sh`: update the header's gate count and its list of the gates it runs to name gate 13 and its two conditional outcomes. After the gate 11 block, add `echo "== gate 13 — Python docs-retrieval service"`. A small hand-written helper, written beside gate 11's block and in its style because `gate()` grades only two outcomes, runs `bash scripts/python-service.sh lint`, `typecheck` and `test` as `13a`, `13b` and `13c`, grading each per the table and printing the log tail on failure, as `gate()` does. Then `13d` runs `container-test` only under `HARNESS_GATES_CONTAINERS=1`, graded per the table. Every command is run without a pipe, with output to `$log`, as the script's existing rule requires.
- [ ] `scripts/run-gates.sh` closing summary: when any 13x leg was BLOCKED, the `== gates this script cannot run` block and the `hand_run` sentence name it with `bash scripts/python-service.sh sync` as its provisioning step. When 13d was SKIPPED, whether not opted in or with no Docker, they name it with its reason. The exit status still depends only on the `failed` array.
- [ ] `docs/development.md` §5:
  - Change the opening line `Twelve gates.` to count thirteen.
  - Rewrite the **"Six of the twelve run unattended…"** paragraph to name gate 13 among the unattended gates, with its two conditional outcomes stated in the same terms as gate 11's: BLOCKED when `uv` or the synced environment is missing, and SKIPPED for the opt-in container leg.
  - Add a **Gate 13 — the Python docs-retrieval service.** paragraph after gate 12. It covers what each leg runs and through which wrapper sub-command, and that no leg needs model weights or a network, the stub seam being why. It gives the provisioning commands in a fenced block, one per line (`bash scripts/python-service.sh sync`), and states the opt-in variable and Docker requirement for 13d with what it starts and tears down. It records that the Python environment lives outside the checkout, which is why gate 6a needs no exclusion, and that `docker compose up` of the full service stack (the task prompt's Acceptance 3) and any real-model run remain hand-run.
  - State no measured duration.

**Verification:**

- `bash -n scripts/run-gates.sh` is clean. Reading the gate 13 block shows each wrapper status mapped exactly per the table, and that no 13x command is piped.
- The scope register's closure holds. Re-run derivation entry 1 verbatim:
  `git grep -nE -i 'twelve gates|of the twelve|gates 5, 7, 8, 9, 10 and 12|gates 1, 2, 3, 4, 6 and 11|run-gates\.sh' -- docs README.md CONTRIBUTING.md ARCHITECTURE.md ROADMAP.md llms.txt .claude/context`
  Every hit must fall within a site the register lists. The new Gate 13 paragraph is row 10. No hit may remain on rows 1 and 2's old wording.
- `git diff --stat` shows `docs/development.md` changed only inside `## 5. Verifying a change`, and no other file under `docs/`.
