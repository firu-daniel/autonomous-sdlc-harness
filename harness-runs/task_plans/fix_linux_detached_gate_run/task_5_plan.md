### Task 5 — Declare the `<gate_launcher>` binding and make Phase G issue it before the run form

**Goal:** Phase G gains one mode-contract binding, `<gate_launcher>`. It is either the literal launcher invocation a fork supplies, or `none`. G.1 step 2 issues the launcher first when it is bound, and branches on its one line. The rule is stated once, in G.1, and every other file cites it. This follows the precedent `<park_answer_lookup>` set: a Phase G binding declared in both cores that run Phase G and in the vocabulary. A core may not name `<MAIN_REPO>`, which is a mode-specific literal (`plugin/instructions/mode_contract.md` rule (4)), so the spelling is a fork's to supply.

**Depends on:** Task 2, the launcher's contract. `launch-sandboxed-gates.sh <target> <label>` prints exactly one of three things:

- `in-session`, exit 4: not a bubblewrap host, or the profile's sandbox is opted out. It started nothing.
- `pending`, exit 3: the round's run started under the launcher's own `bwrap` sandbox, or was already in flight.
- A refusal, exit 2: one stderr line `launch-sandboxed-gates.sh: <reason>` and nothing on stdout. Among the reasons are `bwrap` missing and user namespaces refused.

Its run writes the same `.verdict` / `.running` files the run form's worker writes. So G.1 step 3's `--wait` collects it unchanged.

**Where this layer stops.** The four forks' binding values, and the flow document's row, are **Task 6's**. This task binds nothing.

### Targets

- `plugin/instructions/mode_contract.md` → `## Binding vocabulary`: one new row after `<park_answer_lookup>`'s.
- `plugin/instructions/plan_orchestration_instructions_core.md`:
  - the file's opening paragraph: its closing parenthetical, *"… and the Run gates wrapper in Phase G."* (register row 82);
  - `## Mode contract — bindings this file uses`: one new row after `<park_answer_lookup>`'s;
  - `## Phase G — Run gates`: the opening paragraph and the *"Two flow-dependent vocabularies"* note;
  - `### G.1 Run the gates`: step 2, and the **Branch on the verdict line:** list's **No verdict line** bullet (register row 83);
  - `## Stop conditions`: the entry *"**The Run gates wrapper prints no verdict line** (G.1, the run form or its wait form)"* (register row 84).
- `plugin/instructions/user_review_fixes_instructions_core.md`:
  - its opening paragraph's closing parenthetical, *"… and the Run gates wrapper in Phase G."* (register row 85);
  - its binding table: one new row after `<park_answer_lookup>`'s.

**Work:**

- [ ] **`mode_contract.md`.** Add a `<gate_launcher>` row, in the table's three-column form.
  - **What it stands for:** the command G.1 issues before the run form so that the round's gates run where a detached worker survives, or the explicit value `none`. `none` is a value the fork states, never an absence (rule (1)).
  - **Bound by:** every fork over a core that declares it, the cores that run `## Phase G — Run gates` directly or by reference.
  - **Why it exists:** on a bubblewrap host a process a sandboxed call detaches did not outlive the call (`docs/sandbox-verification.md` §5 F10), and the launcher that works around it is the main checkout's copy, which only an autonomous fork can spell, through `<MAIN_REPO>`. Rule (4) bars a core from naming it.
- [ ] **The core's binding row and Phase G's note.**
  - **The binding row.** Add a `<gate_launcher>` row to `plan_orchestration_instructions_core.md`'s table. `Used at`: `## Phase G — Run gates` → `### G.1 Run the gates` (step 2). Meaning: the launcher invocation G.1 issues first, or `none`.
  - **The note.** In Phase G's *"Two flow-dependent vocabularies"* note, add `<gate_launcher>` (read at G.1 step 2) to the bindings it lists, in the form it lists `<park_answer_lookup>`.
  - **The opening paragraph.** *"both through one `run-test-suite.sh` call per round"* becomes *"both through one `run-test-suite.sh` run per round, started by G.1"*. Change nothing else in the paragraph.
  - **The file's opening paragraph.** Its closing parenthetical *"… and the Run gates wrapper in Phase G."* becomes *"… and, in Phase G, the Run gates wrapper and the gate launcher G.1 issues before it."* Spell it in words: the `<gate_launcher>` token stays confined to the three sites the Verification grep allows.
- [ ] **G.1 step 2.** Rewrite it so that it opens on the binding. Keep the existing run-form sentences as the step's second half, byte-identical apart from the connective.
  - **When `<gate_launcher>` is not `none`:** issue it first, as one plain foreground command, with the label resolved. Read its one line:
    - `pending`: the round's gates started, or were already in flight, under the launcher's own sandbox. Issue no run form, and go to step 3.
    - `in-session`: issue the run form below.
    - **A refusal at the permission layer:** the call was refused before it ran, with no output of the launcher's, because the profile predates the launcher. Issue the run form below.
    - **No stdout line:** the launcher refused with one stderr line. Take the no-verdict-line case below. Do not issue the run form, because on a host where the launcher refuses, the run form's worker dies with its call.
  - **When `<gate_launcher>` is `none`:** issue the run form.
  - **Once per label.** Amend *"This session issues the run form once per label"* to *"This session issues the launcher, or the run form, once per label"*.
  - **The no-verdict-line case it routes to, in its two statements.** Step 2's refusal branch now sends a third trigger there, so both statements of that case name it:
    - G.1's **Branch on the verdict line:** list, the **No verdict line** bullet, becomes: *"**No verdict line** — the launcher refused on stderr (step 2), or the wrapper, or its wait form, printed nothing on stdout → `<escalate>`, naming the origin `Phase G gates` and quoting the launcher's or the wrapper's one stderr line."* Name the launcher in words, not by the `<gate_launcher>` token.
    - `## Stop conditions`: *"**The Run gates wrapper prints no verdict line** (G.1, the run form or its wait form) — `<escalate>`, quoting its stderr line."* becomes *"**The Run gates wrapper prints no verdict line, or the gate launcher refuses** (G.1: the launcher, the run form or its wait form) — `<escalate>`, quoting its stderr line."*
- [ ] **`user_review_fixes_instructions_core.md`.** Add a `<gate_launcher>` row after its `<park_answer_lookup>` row, in exactly that row's form: `**Consumed by the cited `## Phase G — Run gates`** → `### G.1 Run the gates` (step 2)`, with the same meaning cell as the orchestration core's. Its opening paragraph's closing parenthetical takes the same edit as the orchestration core's: *"… and the Run gates wrapper in Phase G."* becomes *"… and, in Phase G, the Run gates wrapper and the gate launcher G.1 issues before it."*

**Verification:**

- `git grep -n -F '<gate_launcher>' -- plugin/instructions` lists exactly the four rows and sites this task adds, and in `plan_orchestration_instructions_core.md` only the binding row, the Phase G note and G.1 step 2.
- `git grep -n -F '<MAIN_REPO>' -- plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/user_review_fixes_instructions_core.md` gains no hit from this task. Rule (4) holds.
- G.1 step 3, and every line of Phase G other than its opening paragraph, its *"Two flow-dependent vocabularies"* note, G.1 step 2 and the **Branch on the verdict line:** list's **No verdict line** bullet, are byte-identical to `HEAD`; the list's other three bullets included. Outside Phase G, the only lines of `plan_orchestration_instructions_core.md` that differ from `HEAD` are the opening paragraph's parenthetical, the new binding row and the `## Stop conditions` entry for the no-verdict-line case; in `user_review_fixes_instructions_core.md`, only the opening paragraph's parenthetical and the new binding row. Read the diff.
- `git grep -n -i -e 'no verdict line' -e 'Run gates wrapper' -- plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/user_review_fixes_instructions_core.md` — every hit that states the no-verdict-line case or the processes run directly names the launcher beside the wrapper.
- `claude plugin validate --strict plugin` passes (`docs/development.md` → `## 5. Verifying a change`, the **Gate 1 — manifests.** paragraph).
