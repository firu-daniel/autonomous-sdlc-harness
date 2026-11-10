# Write a per-run summary file

At the end of a run, write a short summary of the phases it walked to `harness-runs/run_summaries/<branch>.md`, beside the flow-progress ledger at `harness-runs/flow_progress/<branch>.md`.

- Read the phases from the ledger; do not re-derive them.
- Create `harness-runs/run_summaries/` if it does not exist.
- Add a case to the ledger tests that checks the file is written for a fixture branch.
