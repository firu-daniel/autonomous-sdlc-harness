### Task 6 — Thin the `<parity_vocabulary>` / `<reference_impl>`, `<default_branch>` and `<scripts_dir>` rows, identically in every copy

**Goal:** Shorten three `## Resolved values` rows whose text repeats across families — the parity row's two shared sentences (nine agents), the `<default_branch>` row (five agents, identical) and the `<scripts_dir>` row (two agents, identical) — writing one result per sentence into every copy.

**Depends on:** Task 5, which edits the `<repo_root>` row of all these files. This task changes only the three rows named here.

**Where this task stops.** Kept byte-for-byte: `parity.referenceName`, `parity.referenceImplPath`, `phases.parity`, `defaultBranch`, `scriptsDir`, `scripts/`, the placeholders, and the sentence "Never a remembered branch name.". Only the shared sentences change; each agent's own sentences in the parity row — `business-parity-reviewer.md`'s "State every finding in `<parity_vocabulary>` terms…" and its phase-off sentence, `architecture-reviewer.md`'s "Used **only** in `## Scope boundary`…" — stay. The single-token parity rows (`conventions-writer.md`, `conventions-reviewer.md`, `user-review-fix-plan-writer.md`) share neither sentence and are not touched; nor is `statistics-plan-writer.md`'s `<default_branch>` row, which says something else, nor any other `<scripts_dir>` row.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- Parity row, first shared sentence — `plugin/agents/architecture-reviewer.md`, `plugin/agents/branch-reviewer.md`, `plugin/agents/business-parity-reviewer.md`, `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/review-plan-reviewer.md`, `plugin/agents/skeptic-reviewer.md`, `plugin/agents/task-plan-reviewer.md`, `plugin/agents/task-plan-writer.md`.
- Parity row, phase-off sentence — the five of those files whose row is the identical cross-family form (`branch-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`) and the unit-loop pair's one-word variant (`layer-implementer.md`, `layer-reviewer.md`).
- `<default_branch>` row — `architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`.
- `<scripts_dir>` row — `layer-reviewer.md`, `task-plan-writer.md`.

**Work:**

- [ ] **Parity row, first shared sentence**, in its nine files. Old fragment → new:

```markdown
the name of the reference implementation this project is kept in parity with, and the path to it.
```

```markdown
the name and path of the reference implementation this project is kept in parity with.
```

- [ ] **Parity row, phase-off sentence.** In the five identical-form files, old fragment → new:

```markdown
; when it is `false` every parity clause in this file is inert and neither token is dereferenced.
```

```markdown
; otherwise every parity clause in this file is inert.
```

  In `layer-implementer.md` and `layer-reviewer.md`, whose wording differs, keep that difference. Old fragment → new:

```markdown
; when it is `false` no parity clause in this file applies and neither token is dereferenced.
```

```markdown
; otherwise no parity clause in this file applies.
```

- [ ] **`<default_branch>` row**, in its five files. Old:

```markdown
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into, and therefore the diff base every `git diff` in this file computes against. Never a remembered branch name. |
```

  New:

```markdown
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges into, so the diff base of every `git diff` in this file. Never a remembered branch name. |
```

- [ ] **`<scripts_dir>` row**, in its two files. Old:

```markdown
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory the generated wrapper and outer-loop scripts live in. A configuration that omits the key means `scripts/`; `init` writes `harness-scripts/` into one it generates. |
```

  New:

```markdown
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory of the generated wrapper and outer-loop scripts; `scripts/` when the key is absent. |
```

  The dropped clause — what `init` writes into a generated configuration — is a fact about another tool's output; this agent reads the configured value, which carries it.

- [ ] Before saving each file, read its edited rows once: the parity row still gates every parity clause on `phases.parity`; the default-branch row still names the diff base and forbids a remembered name; the scripts row still states the absent-key default.

**Verification:**

- The copies match: `git grep -l -F -e 'the name and path of the reference implementation this project is kept in parity with.' -- plugin/agents` lists exactly the nine parity files; `git grep -l -F -e '; otherwise every parity clause in this file is inert.' -- plugin/agents` lists the five identical-form files and `git grep -l -F -e '; otherwise no parity clause in this file applies.' -- plugin/agents` the unit-loop pair; `git grep -l -F -e 'the branch work starts from and merges into, so the diff base' -- plugin/agents` lists the five default-branch files; and `git grep -l -F -e 'when the key is absent.' -- plugin/agents` lists the two scripts-row files.
- The old text is gone: `git grep -l -F -e 'and the path to it.' -e 'neither token is dereferenced' -e 'and therefore the diff base' -e 'harness-scripts/' -- plugin/agents` lists only `business-parity-reviewer.md`, whose own phase-off sentence ("with the phase off this agent does not review at all, so neither token is dereferenced") is not a shared copy and stays.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
