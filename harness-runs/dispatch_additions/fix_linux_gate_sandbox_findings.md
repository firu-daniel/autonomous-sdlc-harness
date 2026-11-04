# Dispatch additions — fix_linux_gate_sandbox_findings

## [C · Item 2 · general · iter 0] → layer-implementer  (#40)
- **added:** `context_notes:`
- **verbatim:** `context_notes: this unit's cli-layer implementer changed no file and returned a blocker that step 1 (the glob in scripts/lib/sandbox-probe/legs-protection.sh) is outside the cli path scope (dispatch #39 return)`
- **why the agent could not derive it:** the cli-layer implementer's return (dispatch #39) exists only in the orchestrator's session; it changed no file, so nothing on disk records it

## [C · Item 2 · cli · iter 0] → layer-implementer  (#41)
- **added:** `context_notes:`
- **verbatim:** `context_notes: step 1 (the glob in scripts/lib/sandbox-probe/legs-protection.sh) is already applied, uncommitted, in the working tree by this unit's general-layer implementer (dispatch #40; see the Deviations note in finding_3.md)`
- **why the agent could not derive it:** which sibling layer of the unit owns the uncommitted edit is not recorded in the committed tree; the general-layer return (dispatch #40) exists only in the orchestrator's session

## [C · Item 3 · general · iter 0] → layer-implementer  (#44)
- **added:** `context_notes:`
- **verbatim:** `context_notes: this unit's cli-layer implementer changed no file and returned a blocker that steps 1–5 (scripts/lib/sandbox-probe/judge.sh and legs-protection.sh) are outside the cli path scope (dispatch #43 return)`
- **why the agent could not derive it:** the cli-layer implementer's return (dispatch #43) exists only in the orchestrator's session; it changed no file, so nothing on disk records it
