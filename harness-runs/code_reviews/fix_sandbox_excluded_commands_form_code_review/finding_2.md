### 2. `push-branch.sh`'s header ships a pending-work note to every adopter

**File:** `cli/templates/scripts/push-branch.sh`, the `THE INHERITED GIT ENVIRONMENT IS DROPPED` header paragraph: "a re-confirmation on a"

**Severity:** Should Fix.

`cli/templates/scripts/push-branch.sh` is copied byte for byte into every adopting repository's `scriptsDir`. The branch's new sentence cites its evidence as:

```
# script exists to make outside the sandbox. Measured on Claude Code 2.1.299,
# macOS, headless (docs/sandbox-verification.md -> P1a; a re-confirmation on a
# regenerated profile lands in that file too): a sandboxed command carries
```

The clause "a re-confirmation on a regenerated profile lands in that file too" is this repository's own pending manual step, Manual setup step 3 of the story plan. It is written into durable text that ships to adopters.

- **Who reads it wrong:** a reader of the header, adopter or maintainer, who looks in `docs/sandbox-verification.md` for that re-confirmation row. Until the manual step runs, they find no such row.
- **What happens after the row exists:** the future tense is stale, and nothing on this branch schedules removing it.

The evidence the claim actually rests on is P1a, which the sentence already cites.

**Fix:** drop the clause and keep the citation. Replace the second and third lines above with:

```
# macOS, headless (docs/sandbox-verification.md -> P1a): a sandboxed command carries
```

The rest of the paragraph stays byte-identical. That includes the following line, which begins `` # `GIT_SSH_COMMAND=ssh ... ``, and the in-code marker `# THE INHERITED GIT ENVIRONMENT IS DROPPED (header). GIT_SSH_COMMAND is kept.` This is comment text only, so no executable line changes and no test file is edited. The suite runs in the Run gates phase.
