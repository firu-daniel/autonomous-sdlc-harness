# Grader — plan shape

**PROVISIONAL.** The rubric below is runner-independent and survives a gate lift unchanged; only
the way `case.yaml` names this file is a guess.

Grade the arm's **produced artifacts**, read off the working directory the arm left behind. Do not
grade its transcript, its reasoning or its prose quality: the case measures whether the arm emits
the harness's plan shape, and only the files show that.

## What to read

`harness.config.json` at the working directory's root supplies two values every invariant below is
read against — `stateDir` and the `layers[].name` list. Read them from that file rather than
assuming a default; an arm that changed either is still graded against its own configuration. Under
`<stateDir>` the story index is `story_plans/<branch>_story_plan.md` and the per-task files are
`task_plans/<branch>/task_<N>_plan.md`, for whatever branch name the arm used.

## Invariants

Each holds or does not. Report them one by one, with the file and the offending line for each that
does not hold.

1. **A story index exists** under `<stateDir>/story_plans/`.
2. **It carries the heading `## Phase 2 Readiness — Ordered Fix List` byte-identically** — same
   words, same em dash, same case. A paraphrase, a different dash or a different heading level
   fails this invariant, because the orchestrator and the committer key off the exact string.
3. **Every readiness entry resolves to a per-task file that exists**, and every per-task file is
   named by an entry. The mapping is 1:1 in both directions; a dangling entry and an orphan file
   each fail it.
4. **Every readiness entry carries exactly one `_(layer: …)_` value**, and that value is one of the
   working tree's own `layers[].name` values. A missing tag, a comma-joined tag and a value that
   names no configured layer each fail it.
5. **Every readiness entry carries a `_(points: N)_` tag whose `N` is at most 20.**
6. **Every per-task file states a goal, a list of work and a list of verification steps** — three
   distinct sections, however they are headed. A file that says what to do but never says how the
   result is checked fails this invariant.

## What is not graded

Not the number of tasks, not the points total, not how many files the plan spans. One task is a
correct answer for a change this small, and grading a count would reward padding and punish the
right answer. The invariants are properties every entry must have, whatever the entry set is.

Not the plan's *content*, either: whether the indicator belongs in the composer or beside it is a
judgement this case does not measure.

## The discriminator

Both arms get the same prompt and the same scaffolded tree; the treatment arm has the plugin
installed and resolves the prompt's first line into the plan flow, the baseline arm has neither and
reads that line as the literal text it is (`../case.yaml`, "How each arm is driven").

**Invariants 2 and 4–6 are the discriminating ones.** The readiness heading byte-for-byte, the
`_(layer: …)_` tag, the `_(points: N)_` cap and the goal / work / verification body are named
nowhere in the prompt and appear nowhere in the tree, so a baseline arm has no way to guess them. A
baseline arm that satisfies any of those four is the finding, not a rounding error: either the
scaffolded tree is leaking the answer or the prompt has stopped being neutral, and both are defects
in this case rather than results.

**Invariant 1 is not evidence on its own.** The tree names `stateDir` in `harness.config.json` and
carries a seeded `<stateDir>/task_prompts/<branch>_task_prompt.md`, so a baseline arm can reasonably
infer that a plan belongs under `<stateDir>` and write one there. Score it as it falls and do not
read it as a leak. Invariant 3 sits between the two: a 1:1 index-to-per-task mapping is a plausible
independent invention, so it is scored but says nothing by itself.
