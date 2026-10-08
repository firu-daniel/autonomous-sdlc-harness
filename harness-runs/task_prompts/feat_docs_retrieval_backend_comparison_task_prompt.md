`feat_docs_retrieval_backend_comparison` measures the Python docs-retrieval backend against the TypeScript one, with
the same corpora, the same queries and the same runner, and writes the comparison up. **The comparison is the
deliverable.** The port exists to be measured, and a port that quietly reports different relevance and calls it a
pass is worse than no port.

This is the third of three branches that together deliver the second backend:

1. `feat_docs_retrieval_python_backend`: the Python package, the parity core, the container and the gates;
2. `feat_docs_retrieval_backend_selection`: the config key, launcher routing, doctor checks and the documentation;
3. **this branch**: the measurement and the write-up.

**Do not start it before both earlier branches have landed**, and not on a machine without Docker and both weight
caches: the Xenova ONNX exports `init` installs, and the PyTorch weights the Python package's README says how to
provision. If either cache is missing, **stop and say so rather than improvising an install**. Every number this
branch exists to produce needs the real models. This is the one branch of the three that cannot run unattended on a
bare machine, and it is better run supervised: the work is judgment more than implementation.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other roadmap
> items by title only.

---

## What to deliver

1. **A backend hook in the eval runner.** The runner under `evals/docs-retrieval/` imports the compiled TypeScript
   modules under `cli/dist/retrieval/` directly (`index-build.mjs`, `arms.mjs` and others), so today it can only
   measure the TypeScript backend. Give it a way to drive the Python backend over the same corpora, query sets and
   arms, through the Python package's HTTP app or entry point. Do not reimplement the scoring, so that recall, MRR and
   abstention are computed by the same code for both backends. `docs/retrieval-eval.md` gains how to run it.
   The TypeScript path through the runner must produce the same results it did before this branch.

2. **The parity comparison.** Run the runner over the Python backend on **both committed corpora and the same query
   sets**, arms B–E, real models. Report recall@k, MRR and p50/p95 latency **side by side with the TypeScript
   numbers**, against the floor `feat_docs_retrieval_eval` recorded in `docs/retrieval-eval-results.md`. Re-run the
   TypeScript side on the same machine in the same session rather than citing its recorded figures for latency, since
   latency from another host or day is not comparable. Then state plainly which of three cases you are in:
   - the backends agree within noise;
   - they disagree, and the reason is identified;
   - they disagree, and the reason is not yet identified.

   **The third case is an acceptable result for this branch and must not be papered over.**

3. **Divergence sources, checked in this order.** Each is a variable the two stacks do not share, and each is checked
   before anything is called noise:
   - **Quantization.** The TypeScript side runs **q8-quantized** exports (`Xenova/bge-small-en-v1.5:q8:cls:384:v1`,
     `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1`), and the Python package records which precision it runs. If they
     differ, this is the likeliest single cause of a relevance gap, and of a latency gap too.
   - **ONNX-exported weights against their PyTorch originals**, at matched precision where that can be arranged.
   - **BM25 tokenization** reaching the same `pg_textsearch` extension through a different client and a different
     engine build. Arm B (`lexical`) has no model in it, so a difference there is the store's alone.

   Measure vector agreement directly (for example, the cosine between the two embedders' vectors for the same chunks).
   That number decides whether the embedder `id` the first branch namespaced may ever be shared. Record the decision;
   keep the id namespaced unless the number supports sharing.

4. **Abstention, query by query.** At the calibrated threshold (`ABSTAIN_SCORE_THRESHOLD`, recorded in
   `docs/retrieval-eval-results.md` → `## Threshold calibration`), the set of queries the Python backend abstains on
   either matches the TypeScript set or the mismatch is enumerated query by query with a stated cause. **Do not
   retune around it.** The threshold belongs to the eval branch, and a mismatch is a finding.

5. **Cost and latency, honestly scoped.**
   - Report the MCP round trip and the library-level call separately, as the eval branch does. The Python package
     times the library-level call inside its own process; use that rather than timing across the HTTP hop.
   - Report **cold start**: process and model load, plus the container where it is part of the path. Model load into
     a warm process is not the number an agent waits for on the first query of a session.
   - Report the Python service's resident memory, and the Postgres container's separately, next to the roughly 300 MB
     the TypeScript runtime costs per machine (`docs/retrieval.md` → `## What it costs`).

   A second backend that is better on relevance or warm latency and much worse on footprint or cold start is a real
   trade-off, and the write-up is where it gets stated.

6. **One real agent session through `.mcp.json`.** With the key `feat_docs_retrieval_backend_selection` added set to
   the Python backend, start an agent session at the checkout root of a fixture repository and confirm it reaches
   `search_docs` through the Python service and gets a response whose shape matches the TypeScript one. Record what
   was run and what came back.

7. **The results and the write-up.**
   - A results record in the eval's own format, saying which config the numbers were taken through, on which host,
     and with which model ids on each side.
   - `docs/retrieval.md` → `## What it costs`: fill in the Python figures `feat_docs_retrieval_backend_selection`
     left pending, citing the results record rather than restating it.
   - A comparison write-up (same corpus, same queries, two implementations, two stacks), written as the publishable
     artifact it is.

---

## Settled before this branch was queued

- **Relevance parity is a hypothesis, not a requirement.** The branch passes by *measuring and reporting* the
  difference, not by making it zero. A tuned Python backend that beats the recorded floor is not a better outcome than
  an untuned one that matches it and explains where it does not. The second is the honest port, and the first invites
  the question of what else was tuned. **No change to the Python backend's search behaviour lands on this branch.** A
  defect found here is recorded and goes to its own branch.
- **The TypeScript implementation stays the default whatever the numbers say.** A result that favours the Python
  backend is input to a later decision, not this branch's to act on.
- **Leave this repository's `harness.config.json` alone.** It has `phases.docs: false`. The runner and the service own
  their config.
- **Do not change the corpus.** No docs-catalog run and no new committed documents: either would move the floor the
  comparison is measured against.

---

## Acceptance

1. Both backends answer the same query sets over both committed corpora, and the results report recall@k, MRR,
   p50/p95 and cost per arm for each, side by side, against the eval branch's recorded floor.
2. The write-up names which of the three cases the comparison is in, and every identified cause is backed by a
   measurement (quantization, ONNX against PyTorch, BM25 tokenization, or something else).
3. The abstention set matches between backends at the calibrated threshold, or the mismatch is enumerated query by
   query with a stated cause.
4. Cold start and resident memory are reported for the Python service and its container, next to the TypeScript
   figures.
5. A real agent session reached `search_docs` through the Python service, and that is recorded.
6. The runner's TypeScript path reproduces its previous results, and `scripts/run-gates.sh` still passes on a machine
   with no Docker and no Python weights.
7. No file under `plugin/` is modified, and the Python backend's search behaviour is unchanged.

---

## Out of scope

- **Tuning either backend**, re-deriving the threshold, or changing the default backend or the default search mode.
- **The LangGraph port.** It reuses the first branch's packaging and this branch's numbers; nothing here builds it.
- **A Streamlit or any other front end** over the comparison. The results and the write-up are the artifacts.
- **Measuring the real catalog's arm A again.** The agent-navigation comparison is the eval branch's and stands as
  recorded.
