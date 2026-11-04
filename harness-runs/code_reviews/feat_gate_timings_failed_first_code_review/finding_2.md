### 2. A unit that runs without its gate's first unit prints under the wrong section heading

**Site:** `scripts/run-gates.sh` → `run_unit`. Only the arms for `1`, `2a`, `3a`, `4`, `6a`, `11`, `13a`, `14a` and `16` print an `== gate <n> — …` heading. The arms for `2b`–`2e`, `3b`–`3f`, `6b`–`6f`, `13b`–`13d` and `14b`–`14d` print none.

**Problem.** Before this branch, every gate ran in order, so each heading came before all of its legs. Now `gr_run_round` can run a leg without its gate's first unit:
- In the **full** phase, a unit that passed in the focused phase is skipped (`gr_run_round` → `gr__has "$gr__id" "$gr__focused_ok"`). If `2a` passed in focus, `2b`–`2e` print under the `== gate 1 — manifests` heading. If `6a` passed in focus, `6b`–`6f` print under `== gate 4 — …`.
- In the **focused** phase, the focus set holds only failed ids and their prerequisite. A focus of `4 6c` prints `6c` under `== gate 4 — …`.

The gate lines still carry their ids, so no grading changes. But the log is what `test-fix-plan-writer` and a person read, and a leg filed under another gate's heading misattributes it.

**Fix.** Print the heading from one helper that tracks what it last printed in the current phase, and call it at the top of every arm. In `scripts/run-gates.sh`, before `run_unit`:

```bash
# The heading of the gate a unit belongs to, printed once per phase before the first of its units
# that runs: a phase may start a gate at any of its legs.
header_gate=""
header_phase=""
gate_header() {
  if [ "$1" != "$header_gate" ] || [ "$GR_PHASE" != "$header_phase" ]; then
    echo "== gate $1 — $2"
    header_gate="$1"
    header_phase="$GR_PHASE"
  fi
}
```

Then, in `run_unit`:
- Replace each existing `echo "== gate <n> — <title>"` with `gate_header <n> "<title>"`, using the same title text: `1` "manifests", `2` "CLI build and run", `3` "configuration and flow-graph schemas", `4` "init against a throwaway fixture", `6` "self-containment", `11` "docs-retrieval relevance floor", `13` "Python docs-retrieval service", `14` "rendered workflows parse", `16` "shell scripts parse".
- Add the matching `gate_header` call as the first statement of each arm that has none: `2b`–`2e` → `gate_header 2 "CLI build and run"`; `3b`–`3f` → `gate_header 3 "configuration and flow-graph schemas"`; `6b`–`6f` → `gate_header 6 "self-containment"`; `13b`–`13d` → `gate_header 13 "Python docs-retrieval service"`; `14b`–`14d` → `gate_header 14 "rendered workflows parse"`. A one-line arm such as `2b) gate "2b --version" …` becomes `2b) gate_header 2 "CLI build and run"; gate "2b --version" … ;;`.

A straight full round prints exactly the headings it prints today, in the same places.
