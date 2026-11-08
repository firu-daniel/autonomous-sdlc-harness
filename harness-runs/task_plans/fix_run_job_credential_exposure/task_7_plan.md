### Task 7 — Rewrite the whiteboard's containment paragraph for the session's environment and the push credential

**Goal:** `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the paragraph **The prompt is data, not instruction.** lists the containment underneath a run: the OS-level sandbox, the deny floor, the protected-branch backstop, the script allowlist, no deploy and no bare push. Add the two containments this branch ships, in the whiteboard's narrative voice (goal 6):

- the session is launched without the GitHub tokens, the push credential or the webhook in its environment, and locally under an allow-list;
- a push whose commits carry a credential is refused and stops the run.

The paragraph says plainly that the first is hygiene, not a boundary, outside the sandbox's measured PID namespace and no-new-privileges.

**Depends on:**

- **Task 4** — the watcher strips every `sandbox.credentials.envVars` name of the session's profile except `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`, plus `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN`, from the agent's environment in both modes. Locally it keeps only a base set plus `sandbox.passEnv`. It stops a run whose push `push-branch.sh` refused for a credential.
- **Task 6** — the `run` job references no `HARNESS_GIT_TOKEN` and keeps no credential in its checkout.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — the one paragraph above.

**Work:**

- [ ] Extend the paragraph's list of containments with the two items above, in one or two sentences, and keep the paragraph's closing claim: the containment is what makes a prompt that tries to be an instruction harmless even if the delimiting failed.
  - Say where the measured boundary holds — sandboxed Bash on the GitHub-hosted `ubuntu-26.04` image, PID namespace and no-new-privileges — and that elsewhere the environment strip is hygiene.
  - Cite the owning documents by repo-relative path rather than restating them: the harness repository's `docs/watcher.md` for the session's environment, `docs/remote-execution.md` for the job's credential design, and `docs/sandbox-record.md` §5 for the measurement. An installed plugin's runtime root holds only `plugin/` (`.claude/context/plugin.md` → `## Citation`).
  - Name no adopter's value and no literal path of this repository.

**Verification:**

- The paragraph still opens with **The prompt is data, not instruction.**, the heading other files cite, byte-identical.
- The added sentences state each design fact once and cite its owner: grep the whiteboard for `GH_TOKEN` and `persist-credentials` and find no restated mechanism.
- The file carries no frontmatter fence, as before (`.claude/context/plugin.md` → `## Frontmatter`).
