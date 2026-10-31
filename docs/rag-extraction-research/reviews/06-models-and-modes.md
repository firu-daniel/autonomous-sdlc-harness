# Review — 06-models-and-modes.md
verdict: FAIL

Checked on 2026-10-28. Line numbers are the reviewed file's.

- **Repository.** 19 citations checked against the source: `refresh.ts`, `search.ts`, `models.ts`, `session.ts`, `store.ts`, the Python `refresh.py`, `store.py` and `service.py`, `docs/retrieval.md` and `docs/retrieval-eval-results.md`.
- **Web.** 31 claims checked. Routes: `curl` on the Hugging Face model API and raw model cards; `curl` on arXiv HTML and abstracts; WebFetch on Cohere, Elastic, OpenMDW and a GitHub issue; WebSearch.

All of these were checked and hold:
- BEIR, Thakur et al. 2021, Table 2 and §4: +11 %, FiQA 0.236→0.347, NFCorpus 0.325→0.350, TREC-COVID 0.656→0.757, and the cross-encoder "trained on MS MARCO using a knowledge distillation setup".
- Azure Table 1 (40.6 / 48.4 / 60.1, and BEIR 40.6 / 48.4 / 50.0) and Table 2 (keyword queries 79.2 / 11.7 / 61.0 / 66.9; low overlap 23.0 → 49.1).
- EnterpriseRAG-Bench: about 500,000 documents across 9 source types; recall 77.7 / 43.2 for BM25 against 48.6 / 24.8 for vectors; the "explicitly designed to favor embedding-based retrieval" quote.
- The four MS MARCO terms quotes, on both microsoft.github.io/msmarco and the GitHub README.
- IBM R1 (2502.20204): "designed for research purposes only rather than commercial use". IBM R2 (2508.21085): "non-commercial licenses", and "Zhang et al. (2024) incorporates MS MARCO".
- NV-Embed-v2 is `cc-by-nc-4.0` (HF API), and the NV-Embed paper lists MSMARCO among its training sets.
- MS MARCO is in the training data of e5 (2212.03533), nomic (2402.01613, Table 3, 484,864), GTE (2308.03281), mGTE (2407.19669), jina v2 (2310.19923, §5 training data), Qwen3 (2506.05176, Table 6 SFT) and BGE-M3 (2402.03216).
- 2502.19712: "The BGE model's training data is not clearly mentioned".
- jina-embeddings-v3 and jina-reranker-v2-base-multilingual are `cc-by-nc-4.0` (HF API).
- `granite-embedding-small-english-r2`: Apache-2.0, 47.66M parameters, 384 dimensions, 8192 tokens. Its card says "we _do not use_ the popular MS-MARCO retrieval dataset". IBM's repo has no ONNX file, and `onnx-community/…-ONNX` is tagged `transformers.js`. MTEB-v2 retrieval is 53.9 for both it and bge-small.
- `granite-embedding-97m-multilingual-r2`: official `onnx/model.onnx` and `onnx/model_quint8_avx2.onnx`; 384 dimensions, 32,768 tokens; 60.3 / 50.1.
- `granite-embedding-reranker-english-r2` exists under that name. It is Apache-2.0, has 149.6M parameters and no ONNX in IBM's repo, and its card carries the same MS MARCO exclusion. `jrc2139/…-ONNX` files are 151,329,477 bytes (int8) and 598,996,305 bytes (fp32).
- Cohere's rerank models v3.5, v4.0 and v5.0, with 32k context for v4 and v5.
- Drowning in Documents, 2504.01101 and WixQA quotes.

The Granite recommendation holds for English (see the closing note). The failure comes from one missed clean model, which changes the multilingual-rerank sub-verdict.

## Must Fix

1. **The claim that there is "no clean multilingual local reranker" is wrong, and "Only IBM Granite meets both" is too narrow.** The file says this at l.102, l.140 ("the only clean reranker found"), l.144 and in the verdict ("Cohere or Voyage … for … multilingual rerank").
   - **Evidence.** The `nvidia/llama-nemotron-rerank-1b-v2` card, `## Training Dataset`, says: "one popular dataset named MSMARCO restricts commercial licensing … To address this, NVIDIA created its own training dataset blend based on public QA datasets, which each have a license for commercial applications."
   - The model is licensed `openmdw-1.1` (HF API `license:other`, `license_name: openmdw-1.1`). OpenMDW-1.1 grants rights "to deal in the Model Materials without restriction", with notice preservation only (https://openmdw.ai/license/1-1/).
   - It is multilingual and cross-lingual, takes up to 8192 tokens, has 1,235,816,448 parameters, and is "ready for commercial use".
   - Caveats: the card adds "Llama 3.2 Community Model License Agreement … Built with Llama". It ships custom code (`llama_bidirectional_model.py`) and no ONNX.
   - The same family's embedder, `nvidia/llama-nemotron-embed-1b-v2`, is under the NVIDIA Open Model License and "ready for commercial use". Its card's MS MARCO statement was not found.
   - **Change.**
     - Add NVIDIA as the second publisher that excludes MS MARCO explicitly, in the §3.1 reranker table and the "Clean" sentence (l.102).
     - Replace l.144 with: a clean multilingual local reranker exists, but it is 1.2B parameters, PyTorch-only with remote code, and carries the Llama 3.2 licence. Measure it on CPU or keep hosted as the practical default.
     - Amend the verdict sentence and Open question 5. Whether the Llama 3.2 Community License's terms (the 700M-MAU clause, the AUP, "Built with Llama") are acceptable is a maintainer question.

## Should Fix

1. **The lexical-only index claim is right but under-cited, and the `search.ts` citation does not support it** (l.185).
   - `search.ts:127` skips the embedder in `lexical` (`if (mode !== 'lexical')`). So `search.ts:115-127` shows only that the signature takes an embedder; it does not show a cost.
   - The real blockers are three:
     - `store.ts:80`, `embedding vector(${dimensions}) NOT NULL`: no row can exist without a vector;
     - `refresh.ts:58-63` (signature), `:75-79` (embedder id in meta) and `:97` (`embedDocuments`);
     - `session.ts:51`, `resolveModels`, which loads both the embedder and the reranker before any mode is known, and refuses at `:47` if either is missing.
   - Python is the same:
     - `refresh.py:49-50` requires `embedder`, `:70-75` writes its id and `:94` embeds;
     - `store.py:124` has the same `NOT NULL`;
     - `service.py:172-173` resolves both models and sizes the store from `embedder.dimensions`.
   - **Change.** Cite these lines. State that both runtimes need a nullable or separate vector column, a store opened without a dimension, and a session that loads models lazily by mode.

2. **The Python saving is overstated** (l.175-176, l.183, verdict "over 1 GB").
   - 929M is the venv *with the `models` extra* (`docs/retrieval-eval-results.md` → `### Footprint`). The venv without that extra was never measured, so 929M + 225M ≈ 1.15 GB is an upper bound, not a saving.
   - The same section also says the Python disk cost "comes on top of the TypeScript one, because `init` still installs the TypeScript runtime".
   - **Change.** Say "up to ~1.15 GB (venv without the `models` extra unmeasured)" and label it **Inference**. The TS figure (~290 MB `onnxruntime-node` + 56M weights ≈ 346 MB) holds.

3. **The abstention section cites a non-primary paper and misses the closest literature** (l.163-164).
   - 2305.10923 is a reproducibility study of QPP in *conversational* search, not a source for WIG/NQC. Cite Zhou & Croft 2007 (WIG) and Shtok et al. 2012 (NQC) directly, or call 2305.10923 a survey-style secondary source.
   - "No paper found testing [IDF coverage]" skips pre-retrieval QPP. IDF-based predictors such as avgIDF, maxIDF and simplified clarity (He & Ounis 2004; Hauff et al. 2008) are the nearest studied relatives of an IDF-coverage signal, and that literature generally reports them as weak predictors.
   - **Change.** Add them, and keep the "no calibrated abstention claim for `lexical`" recommendation. The citations support it: 2504.01101's "do not generalise" (verified) is about NQC-style post-retrieval predictors on BM25, and pre-retrieval IDF predictors are weaker still.
   - The `near`-negative argument (l.167) is sound **Inference**.
   - Also note that today's `lexical` hit score is RRF rank-derived (`search.ts:48-49` comment, `addRrf`), not BM25. An IDF-coverage figure needs a new store read in both runtimes.

4. **The Anthropic row presents contextualised retrieval as plain hybrid** (l.27).
   - The page says 5.7 % → 2.9 % is "Combining Contextual Embeddings and Contextual BM25", and 1.9 % is "Reranked Contextual Embedding and Contextual BM25". Both arms include LLM-generated chunk context, so the row does not isolate hybrid or rerank.
   - **Change.** Rename the columns to "contextual hybrid" and "contextual hybrid + rerank", or drop the row from the hybrid-against-BM25 evidence.

5. **Azure's customer-data figures are LLM-judged, and the file does not say so** (l.25, l.36, l.46).
   - The post's §6 says the queries "are a mixture of provided and GPT-generated queries". It also says: "For customer datasets, we use a GPT prompt that was vetted against … human ground-truth labels."
   - **Change.** Add this to the vendor caveat. It weakens the "moderate" rating in §1.3 item 2, which leans on the low-overlap row.

6. **EnterpriseRAG-Bench is vendor-authored** (l.29 "Preprint").
   - Six of seven authors are at Onyx (`@onyx.app`, "Affiliation: Onyx"), an enterprise-search vendor.
   - Its questions are LLM-generated from the corpus, which may favour lexical overlap (**Inference**).
   - On "every question type" (l.38): BM25 recall is higher on all 8 types that have recall, but correctness ties on Constrained (76.7 each) and vectors lead on High Level (60.0 against 50.0).
   - **Change.** Mark it **Vendor preprint** and qualify "every question type" as "on recall".

7. **The legal-analysis bullet is unsourced and misattributes its point** (l.72).
   - Data Provenance (Longpre et al., https://arxiv.org/abs/2310.16787) makes the "contract, not a license … disputed for third parties" point about the **OpenAI Terms of Use**, not MS MARCO. The file gives no URL and admits a secondary search.
   - **Change.**
     - Cite 2310.16787 and say the argument is by analogy (**Inference**).
     - Add the MS MARCO GitHub README's own wording: "By using any of these datasets you are automatically agreeing to these terms". It supports the contract framing and shows that the trainer, not the weights user, is the party who agreed.

8. **Arctic-embed-xs is not "silent" on MS MARCO lineage** (l.90, l.102, l.111, Open question 5).
   - The `snowflake-arctic-embed-xs` card says it is "Based on the all-MiniLM-L6-v2 model". The file's own row (l.89) marks that model as MS MARCO-trained.
   - Arctic-s and Arctic-m start from `e5-small-unsupervised` and `e5-base-unsupervised`. The e5 *unsupervised* stage is CCPairs, so that start is not MS MARCO by itself (**Inference**, from 2212.03533).
   - The xs model's HF API tags carry no licence (`[]`); the card says Apache-2.
   - **Change.** Mark xs as "base model MS MARCO-trained" and exclude it. Keep s as undisclosed.

9. **97m-multilingual's exclusion is implied, not stated** (l.110).
   - Its card says only "All training data uses permissive, enterprise-friendly licenses"; it does not name MS MARCO. The explicit "do not use … MS-MARCO" sentence is on the English R2 cards and in 2508.21085, which covers the English models.
   - **Change.** Mark the exclusion **Inference** from the licence statement. Under the l.102 definition of "clean", that makes the multilingual embedder "permissive-data statement only".

10. **The Granite reranker score is the paper's, not the card's** (l.122).
    - 2508.21085's table gives 54.4 BEIR / 44.9 MLDR / 53.7 Miracl on the granite-small top-20.
    - The current HF card's `## Evaluation Results` gives **55.0** / 44.9 / 54.2. That puts it just above gte-reranker's 54.8 there, rather than below it.
    - **Change.** Cite the source the figure comes from and note that the two disagree.

11. **"Replicated by later work, and every vendor that publishes agrees"** (l.45) has no citation for the replication.
    - **Change.** Cite one independent replication, or cut the clause to "BEIR's own result (+11 %) is peer-reviewed; the vendor posts above agree."

12. **The cold-path figure is attributed to the wrong line** (l.175).
    - `docs/retrieval.md:122` is the `(c)` paragraph, which states "`onnxruntime-node` is about 290 MB installed". The "~300 MB of runtime" figure is `docs/retrieval.md` → `## What it costs`.
    - **Change.** Cite both.

## Nice to Have

1. **Qwen3 row** (l.88): add https://github.com/QwenLM/Qwen3-Embedding/issues/166. It was opened 2025-11-16 and asks whether MS MARCO fine-tuning restricts the Apache-2.0 weights. It is still open, with no maintainer reply, which mirrors the Microsoft HF thread.

2. **bge-small row** (l.81): C-Pack (https://arxiv.org/abs/2309.07597) lists mMARCO-Zh, a translation of MS MARCO, in the Chinese labelled set, and says the English models used "the same recipe". This makes MS MARCO in bge-small-en likely, but it stays **Unconfirmed**.

3. **mxbai-rerank v1** (l.123, l.145): Mixedbread's docs say it was trained on "real-life search queries and the top-10 results from search engines", ranked by an LLM. That is a scraped-SERP and LLM-output provenance question in its own right, so it is more than "undisclosed".

4. **Elastic row** (l.28): ELSER is a learned sparse model, and the RRF gain is "1.4% over Elastic Learned Sparse Encoder alone". Say so, because this is not dense hybrid.

5. **Elastic min-score** (l.161): the post (Brunnert, 2026-02-20) recommends normalising *semantic* scores and warns that minmax is "less suitable for keyword search". For BM25 it recommends `AND` / `minimum_should_match`. Tighten the wording to that.

6. **Brief compliance.**
   - The file is 4,287 words (`wc -w`), slightly over the 2,000–4,000 range.
   - The fork verdict runs to 10 sentences against the brief's 3–8. Merge the two licence sentences.

7. **Fit to R2.3 and R2.4.** The file meets R2.3: the model-free default, the licence risk removed from the default, and fused and rerank kept as options. It does not design #199's eval. Two places stay inside "hypotheses":
   - §4.3's `compare-modes` command is a product feature, not an eval design;
   - Open questions 1, 3 and 4 state what to measure, not how.

   No change needed.

**On the Granite recommendation.** It holds for the English default:
- both models exist under the stated names;
- both are Apache-2.0;
- both cards state that MS MARCO is excluded;
- the embedder keeps 384 dimensions and 8192 tokens, and has a transformers.js-tagged community ONNX;
- the reranker's ONNX is third-party only, as stated.

What changes is the "only clean reranker" framing. NVIDIA's 1.2B multilingual reranker is a second clean option (Must Fix 1). It is too large to replace Granite as the English default, but it removes "hosted only" as the multilingual answer.

## Re-review
verdict: PASS

Re-checked on 2026-10-28 against the revised file and its `## Review response`. The Must Fix and all 12 Should Fix findings are resolved. I re-read each changed passage against its source:
- the NVIDIA rows and the "clean" definition at l.102, l.127, l.137, l.154 and l.184;
- the lexical-only blockers at l.228-241, which match `store.ts:80`, `refresh.ts:58-63/75-79/97`, `session.ts:45-51`, `store.py:124`, `refresh.py:49-50/70-75/94` and `service.py:172-173`;
- the Python upper bound at l.226;
- the Anthropic, Azure and EnterpriseRAG-Bench caveats at l.42-49 and l.62-75;
- the legal analogy at l.105;
- Arctic-xs at l.122, 97m-multilingual at l.137, and the reranker score at l.153.

Each of the four abstention DOIs resolves to the work the file names (doi.org CSL metadata):
- `10.1145/1277741.1277835`: Zhou & Croft, "Query performance prediction in web search environments", SIGIR 2007.
- `10.1145/2180868.2180873`: Shtok, Kurland, Carmel & Raiber, "Predicting Query Performance by Query-Drift Estimation", TOIS 2012.
- `10.1007/978-3-540-30213-1_5`: He & Ounis, "Inferring Query Performance Using Pre-retrieval Predictors", LNCS (SPIRE) 2004.
- `10.1145/1458082.1458311`: Hauff, Hiemstra & de Jong, "A survey of pre-retrieval query performance predictors", CIKM 2008.

The NVIDIA text is accurate: OpenMDW-1.1 plus the Llama 3.2 reference, the custom `llama_bidirectional_model.py`, no ONNX, 1,235,816,448 parameters, 8192 tokens, and 15 MIRACL languages plus 11 translated (26 in all). The body is 3,928 words before `## Review response`, inside the range.

### Should Fix

1. **"Hosted as the practical multilingual default until measured" (l.184, verdict) overreaches the "local by default" ruling.**
   - The brief says local models are the default "wherever possible", and the file now shows a clean local multilingual reranker exists.
   - The file's own config sketch (l.269) ships `egress: deny`, so a hosted reranker cannot be a default without the user opting in.
   - **Change.** Reword to: "multilingual rerank is available hosted by configuration (Cohere or Voyage, `egress: allow`) while the local Nemotron reranker is measured on CPU. If it passes, it becomes the local multilingual default." Make the same change in the verdict sentence.

### Nice to Have

1. **mxbai source** (l.124). The page resolves, so the Unconfirmed mark can go. Every Mixedbread docs path I tried redirects to https://www.mixedbread.com/blog/mxbai-rerank-v1:
   - `/docs/models/reranking/mxbai-rerank-xsmall-v1`
   - `/docs/reranking/models/mxbai-rerank-xsmall-v1`
   - `/docs/reranking/mxbai-rerank-base-v1`

   That page says: "The models were trained using a large collection of real-life search queries and the top-10 results from search engines for these queries. A large language model ranks the results according to their relevance to the query." Cite that URL and drop the mark.

2. **Verdict sentence count.** The fork verdict has 8 sentences, not the 7 that `## Review response` claims. That is still inside 3–8, so only the response line needs correcting.
