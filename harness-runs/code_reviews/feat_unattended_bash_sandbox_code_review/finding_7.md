### 7. No adopter-facing document states what the sandbox needs on Linux, or that a remote job without it exits at startup

**Files:**
- `docs/cli.md` → `### The sandbox block and the permission mode`, the paragraph starting "**The unattended profile runs every Bash command, and every process it starts, inside Claude Code's OS-level sandbox, in strict mode.**"
- `docs/remote-execution.md` → `## 8. Choosing a runner`, the paragraph starting "**GitHub-hosted runners that work:**"

**The problem.** The branch ships `failIfUnavailable: true` in every generated profile, and `docs/cli.md` says what that does: "a session whose sandbox cannot start exits at startup". It never says what a host needs for the sandbox to start. The task prompt's verified facts state it: "macOS uses Seatbelt and needs nothing installed. Linux and WSL2 need `bubblewrap` and `socat`. WSL1 is unsupported". `git grep -i bubblewrap` outside `harness-runs/` finds the word only in two `ROADMAP.md` rows.

The story index records the consequence for remote execution as accepted interim behaviour: "Until `feat_unattended_sandbox_preflight` lands, `failIfUnavailable` makes a job on a runner without `bubblewrap` and `socat` exit at startup". No document an adopter reads says so. `docs/remote-execution.md` § 8 still lists `ubuntu-latest` under "**GitHub-hosted runners that work:**". A remote job generates its own profile, so once it runs a release carrying this branch, every job on a runner without those packages stops at launch. The adopter has nothing that names the cause. The missing prerequisite check and the launch refusal are roadmap item 20, and so is the install step. The statement of the prerequisite is not, and a reader can act on it today.

**Fix.** Two additions, each stating only what the verified facts state.

- [ ] In `docs/cli.md`, directly after the paragraph starting "**The unattended profile runs every Bash command…**", add:

  > **What a host needs.** macOS uses Seatbelt and needs nothing installed. Linux and WSL2 need `bubblewrap` and `socat` on the host. WSL1 is unsupported, and an adopter there takes the named opt-out, `sandbox.optOut` (`docs/config.md` §5). Native Windows runs unsandboxed. Because `failIfUnavailable` is `true`, a session on a Linux or WSL2 host that lacks either package exits at startup. That includes a remote job on a runner without them ([`remote-execution.md`](remote-execution.md) §8). A prerequisite check and a launch refusal that names what is missing are roadmap item 20.

- [ ] In `docs/remote-execution.md` § 8, at the end of the paragraph starting "**GitHub-hosted runners that work:**", add:

  > A run's Bash sandbox needs `bubblewrap` and `socat` on the runner (`docs/cli.md` §6). The workflows do not install them yet (roadmap item 20). On a runner without both, the run's session exits at startup, because the generated profile sets `failIfUnavailable`. Install them on a self-hosted runner, or take `sandbox.optOut` with its reason (`docs/config.md` §5).
