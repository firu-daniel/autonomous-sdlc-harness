### 4. The sandbox document's headline still counts three defects, though F5 is a fourth that stops a run

**File:** `docs/sandbox-verification.md` (the `**The headline, before the rows.**` paragraph): "Three defects stop an unattended macOS run under this profile as shipped:".

**The problem.** This branch adds F5 to `## 5. Failures and their follow-ups`. Under the sandbox, `run-test-suite.sh --wait` cannot see a live gate run. Per the task prompt, every gate run that outlasts the Bash tool's foreground window then escalates, or leaves the session to improvise. That stops an unattended run at Phase G in the same way F2 stops one at `run-gates.sh`, and F2 has a headline bullet.

The headline still says "Three defects" and "Each one has its own follow-up". A maintainer reading only the headline, which is what it exists for, would conclude that the profile has three run-stopping defects, and would not know that the Run gates wait form is one of them or that WF2–WF4 are owed.

**Fix.** Change "Three defects stop" to "Four defects stop". After the `run-gates.sh` bullet ("**`run-gates.sh` fails every status-graded gate sandboxed.**"), add:

```markdown
- **`run-test-suite.sh --wait` cannot see a live gate run sandboxed**, and neither can the run form's one-run-per-label guard, so every gate run that outlasts the Bash tool's foreground window escalates. See §5 WF1 and F5. `fix_run_gates_wait_form_sandbox` makes the mtime of `<label>.running` the liveness signal; WF2–WF4, the sandboxed re-runs, are owed (§5).
```

This is a documentation-only change, so no test runs for it.
