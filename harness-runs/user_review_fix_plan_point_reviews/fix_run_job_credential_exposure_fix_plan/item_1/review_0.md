# cli review — ### 1. `push-branch.sh` refuses a workflow-file change only in a GitHub job; a local unattended run still pushes it — iteration 0

## Nice to Have
1. **Library inventory: "and whether this host has…" now hangs off "records"** — `cli/templates/scripts/lib/harness-run-lib.sh` (opening header inventory) — "`hr_push_refusal_handled`), and whether this host has a definite missing sandbox"
   Removing the `answers whether a job's pushes authenticate …` clause left the next clause with no verb of its own. "and whether this host has a definite missing sandbox prerequisite" now continues "records a push refused inside a session (…)", so the sentence says the library *records* whether a sandbox prerequisite is missing. Before the edit, that clause continued "answers". This is a wording slip only: no reader acts on it differently.
   **Fix:** Restore the verb: "`hr_push_refusal_handled`), answers whether this host has a definite missing sandbox prerequisite (…)".
