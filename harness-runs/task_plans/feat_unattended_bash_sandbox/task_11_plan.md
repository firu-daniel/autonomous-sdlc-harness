### Task 11 — Teach the implementer and the test-fix planner to read a sandbox refusal as the boundary working

**Goal:** When a command, a test or a gate fails because the sandbox refused it, the implementer and the test-fix planner must read that as the boundary doing its job. It is never a defect to code around and never a test to delete or weaken. The signatures are the four the task prompt names:

- `Operation not permitted`
- `Read-only file system`
- a proxy `403`
- `Could not resolve host`

**Depends on:** Task 2 for the vocabulary: `sandbox.network.allowedDomains`, `sandbox.filesystem.allowWrite`, `excludedCommands`, and the adopter keys `sandbox.allowedDomains[].domain` / `.reason` and `sandbox.optOut.reason` that Task 1 declares. Both texts below name those keys as the **operator's** remedies, never as something either agent edits.

**Where this task stops.** The two agent texts only. No instruction core changes: the Run gates phase hands the planner the log it already hands it.

### Targets

- `plugin/agents/layer-implementer.md` — the owner of the rule.
- `plugin/agents/test-fix-plan-writer.md` — the planner's consequence of it, with a pointer to the owner.

**Work:**

- [ ] `layer-implementer.md` → `### Semi-autonomous and autonomous modes`, as a new bold-lead paragraph after **The probe route, in every mode.**, titled **A sandbox refusal is the boundary working, in every mode.** State:
  - the four signatures, quoted;
  - what each usually means — a write outside the worktree, the state directory and the temp directory; a write to a protected path; a host outside the allowlist — hedged as *usually*, because a signature is not proof of its cause;
  - the three prohibitions:
    - never change code or a test to avoid the refused access;
    - never route a command around the refusal, whether through a probe, `dangerouslyDisableSandbox` (which a strict profile ignores) or one of the excluded wrappers;
    - never add or ask for a profile entry;
  - the disposition: a refused verification is an **evidence downgrade**, recorded under `**Deviations from plan:**` on the existing rule's terms with the refusal quoted. A refusal of the unit's own required work is a transient `blocker:` that names the refused access and the operator's remedy: an `allowedDomains` entry with its reason, or the named opt-out in `harness.config.json` followed by `init --force`.

  The paragraph is not the standing-prohibition route: an operator *can* lift a sandbox refusal through configuration, so it fails that route's first test. Say so in one clause, so the two paragraphs cannot be confused.
- [ ] `test-fix-plan-writer.md` → `## Process` step 4: add one sentence. A failure whose log carries one of the sandbox-refusal signatures goes under `## Not fixable on this branch`. Quote the log line, rewritten per step 5, and name the operator's remedy as above. Cite the owner rather than restating the signature list: `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**
- [ ] `test-fix-plan-writer.md` → `## What you must not do`: add a bullet. Never plan a finding that deletes, skips or weakens a test, or changes code, to avoid a sandbox refusal.

**Verification:**

- Run:

  ```
  grep -n 'Operation not permitted' plugin/agents/layer-implementer.md plugin/agents/test-fix-plan-writer.md
  ```

  It must hit the implementer only. The planner cites the paragraph and does not restate it.
- The cited paragraph title appears byte-identical in both files:

  ```
  grep -rn -F 'A sandbox refusal is the boundary working' plugin
  ```

  Each hit must be one of the two targets.
- Neither file's frontmatter or `tools:` allowlist changes, and no sentence states a sandbox fact more firmly than the task prompt's `## Verified facts`: *usually*, never *always*.
