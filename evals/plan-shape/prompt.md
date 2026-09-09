/autonomous-sdlc-harness:branch-start-plan-semi-autonomous

<!-- SEED MARKER — every line below this one is the task prompt `scaffold.sh` seeds into the tree; the line above is how each arm is driven, and `case.yaml` states what each arm does with it. -->

# Task

The notes application in this repository has an add-note form with a title field and a body field.
Add a character-count indicator to the body field: while someone types, the form shows how many
characters the body currently holds, and the number updates as they type. Emptying the form
returns the indicator to zero.

Plan that change and nothing else. Do not implement it, and do not widen it — no maximum length,
no warning state, no indicator on the title field, no change to what makes a note valid and no
change to how notes are stored or read back.
