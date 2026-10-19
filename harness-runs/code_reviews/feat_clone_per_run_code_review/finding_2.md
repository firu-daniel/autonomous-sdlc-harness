### 2. The registry is protected by its exact path, but a sandboxed rename of its directory, `autonomous_logs`, is neither protected nor owed as a measurement

**Files:** `docs/sandbox-verification.md` (§4, the **The run registry.** paragraph and its table rows `RG1` / `RG2`); `docs/cli.md` (§6, the **Everything that runs outside the sandbox is write-protected on both sides** list, the item beginning "the main checkout's run registry, `<stateDir>/autonomous_logs/registry.json`, by its exact path").

**Problem.** Task 12 protects `<main>/<stateDir>/autonomous_logs/registry.json` with a `denyWrite` entry and an `Edit` / `Write` pair, by exact path. The directory that holds the file is not protected. `cli/test/profile.test.mjs` asserts this on purpose (*"The exact path only: the rest of the log directory stays writable"*), and the directory sits inside the state directory, which is the profile's one `allowWrite` grant. The two owed rows cover a write to the file (RG1) and a rename *onto* it (RG2). Neither covers the third route to the same forged file: a sandboxed `mv` of `autonomous_logs` itself aside, then a `mkdir autonomous_logs` and a fresh `registry.json`. Whether the runtime refuses a rename of a protected file's parent directory is unmeasured. Until it is, the protection the clone trust check now relies on (`docs/cli.md`: *"a sandboxed write could aim unsandboxed code at a forged copy"*) has a measurement gap that no owed row records. A maintainer who reads RG1 and RG2 as the complete owed set for the switch branch would take the registry as closed once both pass.

**Fix.**

1. In `docs/sandbox-verification.md`, add this row directly after `RG2`, in the same table:

```markdown
| RG3 | Through `--allowedTools Bash(mv:*)`, `Bash(mkdir:*)` and `Bash(dd:*)`, so each call reaches the sandbox: `mv <main>/harness-runs/autonomous_logs <main>/harness-runs/autonomous_logs.aside`, then `mkdir <main>/harness-runs/autonomous_logs` and `dd if=/dev/null of=<main>/harness-runs/autonomous_logs/registry.json`. | the first `mv` refused with `Operation not permitted`; the registry's `shasum` unchanged | **not run — owed.** Measurement not yet taken. | not run — owed |
```

2. In the same section's **The run registry.** paragraph, wherever it names the owed rows as `RG1` and `RG2`, name `RG1`, `RG2` and `RG3`.

3. In `docs/cli.md`, change the end of the registry item from `whether the sandbox refuses a write and a rename onto it is owed (`docs/sandbox-verification.md`, rows RG1 and RG2);` to `whether the sandbox refuses a write, a rename onto it and a rename of its directory is owed (`docs/sandbox-verification.md`, rows RG1, RG2 and RG3);`.

No code changes and no test runs. Taking the measurement is a hand-run probe, as for RG1 and RG2.

- **Deviations from plan:** Fix step 2 made no edit: the **The run registry.** paragraph in `docs/sandbox-verification.md` names no row by id (it says "Each owed row"), and `grep -rn 'RG1\|RG2'` outside `harness-runs/` found only the two table rows and the `docs/cli.md` registry item, so the paragraph already covers RG3.
