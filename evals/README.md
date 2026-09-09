# evals/

The harness's evaluation cases, which are **roadmap item 8**. One case is written: `plan-shape/`.

**The runner is still unverified.** It is gated behind early access, so its case format is known
from `--help` output alone and every line of what follows is provisional: cases are discovered at
`evals/**/case.yaml` or `evals/**/prompt.md` alongside `graders/*.md`; per-case fields implied by
the flags include a repeat count, a turn cap, a timeout, a scaffold script and tags; runs include a
no-plugin baseline arm, judging defaults to a small model, and the generated HTML report publishes
publicly unless told otherwise. Treat every one of those as unconfirmed until measured against the
real runner.

**A case is committed anyway, because the guess is only the envelope.** A case has two halves and
they age differently. The envelope — the field names in `case.yaml` and the units of their values —
is the guessed half, and re-shaping a five-field document is cheap. The content — the prompt handed
to the session, the fixture it runs over, and the rubric a grader applies — is runner-independent:
it says nothing about how a runner is invoked, and it survives a gate lift unchanged. Committing
nothing would have withheld the durable half to protect the cheap one, and it would have cost the
fallback below as well, which needs exactly that content and no envelope at all.

**What `plan-shape/` asserts, and what it runs against.** Both arms get `plan-shape/prompt.md`
unchanged — a `/autonomous-sdlc-harness:branch-start-plan-semi-autonomous` line the plugin arm resolves and the
baseline arm reads as literal text, above one small, dull change to plan in the example notes
application — and a working directory `plan-shape/scaffold.sh` builds out of
`../examples/notes-app/`: its source, its toolchain, its generated `harness.config.json`,
`scripts/` and `.claude/` conventions documents, plus the one task prompt every route into the plan
flow halts without, initialised as a git repository with one commit on a feature branch. What the
tree leaves out is what an arm is measured on **producing** — the story index and per-task files
under `stateDir` — together with that fixture's captured run artifacts, which hold exactly those in
the graded shape. `plan-shape/graders/plan-shape.md` then reads what each arm left behind for the
harness's plan shape — the byte-identical `## Phase 2 Readiness — Ordered Fix List` heading, a
per-task file behind every readiness entry, one configured layer name per entry, points at or below
the cap, and a goal / work / verification body in each per-task file. The prompt names none of
those. The assertion is that the plugin arm produces them and the baseline arm produces none of the
four that cannot be guessed from the tree — `plan-shape/graders/plan-shape.md` → `## The
discriminator` says which four those are, and why the remaining two are scored without being
evidence on their own.

**The case is PROVISIONAL, and says so in its own header.** Expect to rename fields in `case.yaml`
when the gate lifts. That is the anticipated cost rather than a defect, and it reaches none of
`prompt.md`, `scaffold.sh` or the grader.

**The fallback, if the gate never lifts.** Drive the same `plan-shape/prompt.md` and
`plan-shape/graders/plan-shape.md` from a short script: run `plan-shape/scaffold.sh` into two
scratch directories, start one session per arm in its own directory — one with the plugin installed,
one without — hand each the contents of `prompt.md` verbatim, whose first line is what enters the
plan flow in the arm that has it, and check the grader's invariants against each resulting tree, by
grep or by handing them to a judging session. Nothing on that path touches the native runner, which is why the content half was the half
worth writing first.

**This directory is a measurement, not a format exemplar.** `plugin/samples/` — reached as
`${CLAUDE_PLUGIN_ROOT}/samples/` once the plugin is installed — remains the only canon for what a
plan, review or statistics artifact looks like. The grader here reads a handful of that format's
invariants in order to score an arm; it is not a second statement of the format, and a case that
started specifying one would be two sources of truth for the same thing.
