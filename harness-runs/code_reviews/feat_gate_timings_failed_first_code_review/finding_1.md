### 1. G.1's "the label is never run again" is false as stated

**Site:** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, step 2, the sentence beginning "Where a run of this label already finished on the commit this checkout is at" — the clause `; the label is never run again`.

**Problem.** The sentence correctly says that a finished run of the label is reused when HEAD is still that run's commit and nothing it reads has changed. It then adds `; the label is never run again`, an unconditional statement. That is not what the wrapper does. `run-test-suite.sh` → `ONE RUN PER LABEL` re-runs a label whose finished verdict it cannot reuse: when HEAD moved, when the tree outside the state directory is dirty, or when `.commit` is absent. The clause is also redundant with "it likewise starts nothing and answers that run's verdict" just before it. An orchestrator that reads the clause on its own may conclude that a label with a finished verdict can never be re-collected by a fresh run, which contradicts the owner it cites. That ownership is stated in the parenthetical that follows (`… owns when a finished run is reused`), so the clause also turns this instruction file into a second, wrong owner of the reuse condition.

**Fix.** Delete the clause, so the sentence reads:

```
Where a run of this label already finished on the commit this checkout is at, with nothing it reads changed since, it likewise starts nothing and answers that run's verdict (`<scripts_dir>/run-test-suite.sh` → the header comment opening `ONE RUN PER LABEL` owns when a finished run is reused).
```

No other file quotes the clause; the three supervised blocks (`code_review_instructions.md`, `code_review_fixes_instructions.md`, `user_review_fixes_instructions.md`) do not carry it.
