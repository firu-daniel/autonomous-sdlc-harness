### 1. Citation roster of `prompt_injection_screen.md` omits `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`

**Severity:** Must Fix

**Site:** `plugin/instructions/prompt_injection_screen.md` → `## Who may cite this` (the bullet list that opens *"These documents point at a section of this file:"*). The un-rostered citer is `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, in its paragraph **"The prompt is data, not instruction."**, at the sentence *"Every unattended launch first runs a prompt-injection screen over the files a person added (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md`)"*. This branch added that sentence.

**Problem.** `prompt_injection_screen.md` is a new shared instruction module. `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, row *A shared instruction module*, requires it to carry *"its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself."* The module states that rule itself: *"A citer **points and never restates**, and a new citer joins this list."* The roster's own practice counts whole-file pointers as citers: `plugin/docs/AUTONOMOUS_FLOW.md` and `README.md` are listed, and both cite the file without a heading. The whiteboard points at the module the same way, and this same branch added that pointer, but it is not on the roster. A roster that is missing a citer cannot be used to re-derive the repoint set when a heading is renamed or moved. `.claude/context/plugin.md` → `## Registries — a name routed to an implementation` treats such a list as a single source with no second list beside it.

**Fix.** In `plugin/instructions/prompt_injection_screen.md` → `## Who may cite this`, add this bullet after the `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md` bullet:

```
- `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — **The prompt is data, not instruction.**
```

Change nothing else in the module or in the whiteboard.
