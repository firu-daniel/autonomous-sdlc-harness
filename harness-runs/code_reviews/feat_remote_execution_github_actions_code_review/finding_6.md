### 6. `init`'s printed commit command and `docs/remote-execution.md` step 3 give the adopter two different commit subjects

**File:** `cli/src/commands/init.ts` (`reportGithubSteps`) — "command('git commit -m \"chore: add the harness workflows\"');"

**Problem.** Two places give the adopter the same step with different wording:

- `init`'s closing `remote execution` block prints `git commit -m "chore: add the harness workflows"`.
- `docs/remote-execution.md` → `## 7. Turning it on`, step **3**, gives `git commit -m "Add the harness workflows"`.

The difference decides nothing, but the adopter is handed two spellings of one command, one of them with a prefix.

**Fix.**

- [ ] In `reportGithubSteps`, change the line to:
  ```ts
  command('git commit -m "Add the harness workflows"');
  ```
