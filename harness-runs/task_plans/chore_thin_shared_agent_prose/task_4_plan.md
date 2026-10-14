### Task 4 — Thin the `<state_dir>` rows, identically in every copy

**Goal:** Shorten the `<state_dir>` `## Resolved values` row in its two cross-family forms — form A, identical in eight agents, and form B, identical in five, which adds the git-pathspec rule — and the closing sentence that five single-agent variants share with them.

**Depends on:** Task 3, which edits the `## Resolved values` tables of thirteen of these files. This task changes only the `<state_dir>` row, never a row Task 3 touched.

**Where this task stops.** `stateDir`, `sdlc-harness/` and `sdlc-harness//*` are kept byte-for-byte. Only the `<state_dir>` row changes in each file. The two conventions-family rows (`conventions-writer.md`, `conventions-reviewer.md`) share no sentence with the others and are left to that family's session. In the five single-agent variants only the shared closing sentence changes; each keeps its own description of what sits under the tree.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- Form A — `plugin/agents/qa-tester.md`, `plugin/agents/statistics-plan-writer.md`, `plugin/agents/task-plan-writer.md`, `plugin/agents/task-plan-reviewer.md`, `plugin/agents/test-fix-plan-writer.md`, `plugin/agents/ui-tests-plan-writer.md`, `plugin/agents/ui-tests-plan-reviewer.md`, `plugin/agents/user-review-fix-plan-writer.md`.
- Form B — `plugin/agents/architecture-reviewer.md`, `plugin/agents/branch-reviewer.md`, `plugin/agents/business-parity-reviewer.md`, `plugin/agents/review-plan-reviewer.md`, `plugin/agents/skeptic-reviewer.md`.
- The shared closing sentence only — `plugin/agents/committer.md`, `plugin/agents/docs-reviewer.md`, `plugin/agents/docs-writer.md`, `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md`.

**Work:**

- [ ] **Form A**, in its eight files. Old:

```markdown
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file sits under. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
```

  New:

```markdown
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file sits under. Default `sdlc-harness/`; no path segment of it begins with a dot. |
```

- [ ] **Form B**, in its five files. Old:

```markdown
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file sits under. Default `sdlc-harness/`. Inside a git pathspec, substitute it with any trailing slash stripped: `sdlc-harness//*` matches no path, so the doubled separator makes an exclusion pathspec silently inert. It is never dot-named: no path segment of it may begin with a dot. |
```

  New:

```markdown
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file sits under. Default `sdlc-harness/`; no path segment of it begins with a dot. In a git pathspec, strip any trailing slash first: `sdlc-harness//*` matches no path, so an exclusion pathspec built on it silently excludes nothing. |
```

- [ ] **The shared closing sentence**, in the five single-agent variants (inside each one's `<state_dir>` row only). Old:

```markdown
Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot.
```

  New:

```markdown
Default `sdlc-harness/`; no path segment of it begins with a dot.
```

  `docs-writer.md`'s row continues after that sentence ("You **read** a findings file there; …"); keep that continuation unchanged.

**Verification:**

- The copies match: `git grep -l -F -e 'no path segment of it begins with a dot.' -- plugin/agents` lists exactly the eighteen files under Targets, and `git grep -l -F -e 'strip any trailing slash first' -- plugin/agents` lists exactly the five form-B files.
- The old text is gone: `git grep -l -F -e 'It is never dot-named: no path segment of it may begin with a dot.' -e 'the doubled separator makes an exclusion pathspec silently inert' -- plugin/agents` lists nothing.
- The pathspec rule is intact where it is used: each form-B file still states it, and `git grep -n -F -e 'sdlc-harness//*' -- plugin/agents` lists exactly the five form-B files.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
