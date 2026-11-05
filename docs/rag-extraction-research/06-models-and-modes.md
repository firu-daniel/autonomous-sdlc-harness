# RAG extraction research — models and modes: a model-free default, licence-clean models, and the case for hybrid + rerank

**Who reads this:** the maintainer settling ruling R2.3 (`_brief.md` → `## Round 2 rulings`), and whoever writes the round 2 synthesis. **It owns:**
- what the literature and vendors say about hybrid retrieval and reranking against BM25 on large or business corpora;
- the MS MARCO licence question;
- licence-clean local embedders and rerankers;
- what a model-free `lexical` default costs and saves;
- how a `models:` setting maps onto `mode:`.

**It does not own:** the measurement on a business corpus (issue #199, `rag chore_business_corpus_research`, which this file does not design); the lexical engine (`05-managed-postgres-lexical.md`); the runtime split (`04-engine-architecture.md`).

## How this was researched

**Date and route.** Every web source was retrieved on **2026-10-28**, with these routes:
- WebSearch and WebFetch;
- `curl` on the Hugging Face model API (`https://huggingface.co/api/models/<id>`: licence tag, file list, parameter count) and on raw model cards;
- `curl` on arXiv HTML full text, searched for "MS MARCO" and for training-data sections.

This repository was read at the working copy's `dev` base. No model was run and nothing was measured.

**Sources.** Primary sources come first: papers, model cards, vendor documentation and Microsoft's MS MARCO pages. **Vendor** marks a benchmark or preprint by a company with a product in this field: it is self-reported, often on data nobody else can see. **Secondary** marks blogs, forums and search-tool summaries.

**Three kinds of statement**, as in `docs/copilot-foundry-research.md` → `## How this was researched`:
- **Documented**: a source states it, cited by URL, `path:line` or `path → ## heading`;
- **Inference**: this fork's own conclusion;
- **Unconfirmed**: no source checked states it, or the sources disagree.

Unlabelled sentences in a paragraph that cites a source are Documented.

---

## 1. Hybrid + rerank against BM25: what the evidence says

### 1.1 The evidence

| Source | Kind | Corpus | BM25 | Hybrid | + rerank |
|---|---|---|---|---|---|
| BEIR, Thakur et al. 2021, Table 2 (https://arxiv.org/abs/2104.08663) | Peer-reviewed | 18 public sets, zero-shot | baseline | — | BM25 + CE: **+11 %** average nDCG@10 |
| same: FiQA-2018 (finance Q&A) / NFCorpus (consumer medical) / TREC-COVID | Peer-reviewed | 57k / 3.6k / 171k docs | 0.236 / 0.325 / 0.656 | — | 0.347 / 0.350 / 0.757 |
| Azure AI Search, Tables 1–2 (https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-ai-search-outperforming-vector-search-with-hybrid-retrieval-and-reranking/3929167) | **Vendor** | 4 customer datasets (pptx/pdf/html) | 40.6 nDCG@3 | 48.4 | **60.1** |
| same, BEIR | **Vendor** | BEIR | 40.6 nDCG@10 | 48.4 | 50.0 |
| Anthropic, Contextual Retrieval (https://www.anthropic.com/news/contextual-retrieval) | **Vendor** | codebases, fiction, arXiv, science | not reported | *contextual* hybrid: failure@20 2.9 % (embeddings only: 5.7 %) | *contextual* hybrid + Cohere rerank: 1.9 % |
| Elastic (https://www.elastic.co/search-labs/blog/improving-information-retrieval-elastic-stack-hybrid) | **Vendor** | BEIR | baseline | RRF of BM25 + ELSER (learned *sparse*): ~18 % over BM25, 1.4 % over ELSER alone | — |
| EnterpriseRAG-Bench (https://arxiv.org/abs/2605.05253) | **Vendor preprint** (Onyx) | ~500k *synthetic* enterprise docs | recall 77.7 basic, 43.2 semantic | not run | not run; vectors alone (text-embedding-3-large): 48.6, 24.8 |
| WixQA (https://arxiv.org/abs/2505.08643) | **Vendor preprint** (Wix) | 6,221 support articles | context recall 0.73 | not run | e5-large-v2 dense: 0.81 |

Three caveats on the vendor rows:
- **Anthropic.** Both of its arms add LLM-written chunk context, so the row does not isolate hybrid or rerank.
- **Azure.** The customer queries are "a mixture of provided and GPT-generated queries", and the relevance labels come from "a GPT prompt that was vetted against … human ground-truth labels" (§6).
- **EnterpriseRAG-Bench.** Its questions are LLM-generated from the corpus, which may favour lexical overlap (**Inference**).

**Modern embedders on the same BEIR sets.** Arctic-embed's fine-tuned baseline reaches FiQA 40.44, NFCorpus 34.63 and TREC-COVID 79.98 (https://arxiv.org/abs/2405.05374, Table 9). One caveat: GTE and Arctic train on FEVER "and other BEIR datasets", and BGE's data "is not clearly mentioned" (https://arxiv.org/abs/2502.19712). So recent BEIR and MTEB scores are partly in-domain. MMTEB widens coverage (https://arxiv.org/abs/2502.13595) but does not remove that.

### 1.2 Evidence the other way

- **Keyword queries favour BM25, even over hybrid + rerank.** Azure's Table 2 (vendor) gives keyword queries 79.2 nDCG@3 for BM25, 11.7 for vectors, 61.0 for hybrid and 66.9 for hybrid + rerank. It gives low query/doc term overlap 23.0 for BM25 against 49.1 for hybrid + rerank.
- **Rerankers can degrade as they score more documents.** See "Drowning in Documents" (https://arxiv.org/abs/2411.11767).
- **Embeddings alone can lose on company-style data.** On EnterpriseRAG-Bench, BM25 has higher recall than vectors on all 8 question types that have recall. That includes the type "explicitly designed to favor embedding-based retrieval". On correctness the two tie on one type, and vectors lead on another.
- **This repository.** On the real 1,960-chunk technical catalog:
  - `lexical` scored recall@5 0.909 and MRR 0.753, and `fused-rerank` 0.795 and 0.677 (`docs/retrieval-eval-results.md` → `### Findings about the rule, recorded and not acted on`);
  - `fused-rerank` trails `fused` on every primary column on all three corpora (`## The shipped default against fusion alone`);
  - the measured case is "the case where grep is strongest" (`### The maintainer's decision`).

### 1.3 How strong the case is

**Inference.**
1. **Hybrid + rerank beats BM25 on average over public benchmarks: strong.** BEIR's own result (+11 %) is peer-reviewed, and the vendor posts above agree.
2. **It beats BM25 where the vocabulary does not match: moderate at best.** The support is:
   - Azure's low-overlap row, from a vendor, with LLM-judged labels and partly generated queries;
   - BEIR's FiQA and TREC-COVID gains;
   - WixQA's dense-over-BM25 recall.
   
   EnterpriseRAG-Bench points the other way for vectors alone. No independent study was found of hybrid + rerank against BM25 on real business documentation; whether one exists is **Unconfirmed**.
3. **It holds for every query shape: contradicted.** Azure's keyword row and this repository's catalog both show lexical winning on identifier-style queries.

This repository's result is Azure's keyword row, measured again; it does not contradict the literature. The maintainer's lean holds for vocabulary-mismatch corpora only, and at moderate strength. So the default should be `lexical`, with hybrid and rerank offered for business corpora, and #199 setting how strongly to recommend them.

BEIR's +11 % used an MS MARCO MiniLM cross-encoder, the same family this repository ships (§4 of the paper). IBM also shows `ms-marco-MiniLM-L12-v2` lifting BEIR from 50.9 to 52.0 (https://arxiv.org/abs/2508.21085, Table 5, vendor). A MiniLM reranker *hurting* fusion is therefore not the published norm (**Inference**). Two local causes are candidates, both **Unconfirmed** until #199:
- identifier-heavy queries;
- the 512-token window against long sections, which `### The maintainer's decision` names as open work.

---

## 2. The MS MARCO licence question

### 2.1 The terms

Microsoft's page (https://microsoft.github.io/msmarco/) and README (https://github.com/microsoft/msmarco) state:
- "The MS MARCO and ORCAS datasets are intended for non-commercial research purposes only";
- the data comes "without extending any license or other intellectual property rights";
- "we may not own the underlying rights in the documents";
- "By using any of these datasets you are automatically agreeing to these terms";
- "If you have questions about use of the dataset or any research outputs in your products or services, we encourage you to undertake your own independent legal review."

Microsoft names "research outputs in your products" as a case it leaves to legal review.

### 2.2 Whether trained models inherit it

- **Publishers diverge.**
  - `cross-encoder/ms-marco-MiniLM-L6-v2` tags its weights `apache-2.0` and lists `sentence-transformers/msmarco` as its training data.
  - IBM declines to train on MS MARCO "given it is designed for research purposes only rather than commercial use" (https://arxiv.org/abs/2502.20204).
  - NVIDIA's `llama-nemotron-rerank-1b-v2` card says MS MARCO "restricts commercial licensing", and NVIDIA built its own blend instead (§3.1).
  - NVIDIA licenses NV-Embed-v2, trained with MS MARCO, as `cc-by-nc-4.0`. An NVIDIA representative's comment tying that to "non-commercial datasets" is quoted in https://arxiv.org/abs/2608.16096 (**secondary**).
- **Microsoft** has made no statement on weights beyond the legal-review sentence. Its Hugging Face licence thread has no Microsoft reply (https://huggingface.co/datasets/microsoft/ms_marco/discussions/6). The Qwen3 issue asking the same question of Apache-2.0 weights is open with no maintainer reply (https://github.com/QwenLM/Qwen3-Embedding/issues/166).
- **Legal analysis.** Data Provenance (Longpre et al., https://arxiv.org/abs/2310.16787) argues that terms of use are a contract, not a licence, and that their reach to third parties is disputed. It argues this about OpenAI's terms, not MS MARCO. Applying it here is by analogy (**Inference**): the party who agreed to MS MARCO's terms is the trainer ("by using … you are automatically agreeing"), not whoever later uses the weights. No court ruling was found. **Unsettled.**

**Inference.** The legal question is open, but practice is not neutral. IBM and NVIDIA act on the restriction, and Microsoft defers commercial use to lawyers. For a product sold to companies, "Apache-2.0 on the weights" is unlikely to satisfy a procurement review on its own. R2.3's "not accepted" is the prudent reading.

### 2.3 Which models list MS MARCO

| Model | MS MARCO in training? | Source |
|---|---|---|
| `ms-marco-MiniLM-L6-v2` (today's reranker, `cli/src/retrieval/models.ts:64`) | **Yes** | Card; BEIR §4 |
| `bge-small-en-v1.5` (today's embedder, `models.ts:47`) | **Unconfirmed, likely.** The card names no data. C-Pack's Chinese labelled set includes mMARCO-Zh, a translation of MS MARCO, and the English models follow "the same recipe" (https://arxiv.org/abs/2309.07597). Sibling BGE-M3 lists MS MARCO (https://arxiv.org/abs/2402.03216) | Card; papers |
| `bge-m3`, `bge-reranker-v2-m3` | bge-m3 **yes**; the reranker builds on it | 2402.03216 |
| e5 and multilingual-e5 | **Yes** | https://arxiv.org/abs/2212.03533 |
| nomic-embed-text v1 / v1.5 | **Yes** (484,864 samples) | https://arxiv.org/abs/2402.01613, Table 3 |
| gte, gte-modernbert, gte-reranker-modernbert, gte-multilingual | **Yes** | https://arxiv.org/abs/2308.03281, https://arxiv.org/abs/2407.19669, 2508.21085 |
| jina-embeddings-v2 | **Yes** | https://arxiv.org/abs/2310.19923 |
| jina-embeddings-v3, jina-reranker-v2-multilingual | Licence itself **CC-BY-NC-4.0** | HF API |
| Qwen3-Embedding / Reranker | **Yes** at the supervised stage; the reranker's own data is **Unconfirmed** | https://arxiv.org/abs/2506.05176, Table 6 |
| all-MiniLM-L6-v2; arctic-embed-xs ("Based on the all-MiniLM-L6-v2 model") | **Yes**, xs through its base model | HF API; xs card |
| arctic-embed-s / m (v1) | Not listed. They start from e5 *unsupervised* (CCPairs), and fine-tune on web search, HotpotQA, NQ, FEVER and StackExchange | 2405.05374 |
| mxbai-rerank v1 | Not MS MARCO; trained on "real-life search queries and the top-10 results from search engines", ranked by an LLM: a scraped-results provenance question of its own | https://www.mixedbread.com/blog/mxbai-rerank-v1 |
| mxbai-embed, jina-reranker-v1-turbo | **Undisclosed** | Cards |
| IBM Granite English R1/R2 and reranker R2 | **No, explicitly excluded** | Cards; 2502.20204; 2508.21085 |
| NVIDIA llama-nemotron-rerank-1b-v2 | **No, explicitly excluded** | Card, `## Training Dataset` |

**Inference.** Today's embedder is probably not clean either. The risk sits on `fused` and `vector` as well as `fused-rerank`.

---

## 3. Licence-clean alternatives

### 3.1 Candidates

Here "clean" means a permissive licence **and** a publisher's statement that MS MARCO was excluded. Two publishers make that statement explicitly: IBM (Granite English models) and NVIDIA (the Nemotron reranker). Granite's multilingual card says only "All training data uses permissive, enterprise-friendly licenses", so its exclusion is **Inference**. Arctic-s is undisclosed rather than clean. Scores are the publishers' own (**vendor**). Facts come from the HF API, the cards and the papers in §2.3.

**Embedders**

| Model | Licence | MS MARCO | Params | Dim / ctx | ONNX (TS) | sentence-transformers (Py) | Languages | Score |
|---|---|---|---|---|---|---|---|---|
| **granite-embedding-small-english-r2** | Apache-2.0 | Excluded (card) | 47M | 384 / 8192 | `onnx-community/…-ONNX` (transformers.js tag); none in IBM's repo | Yes | English | BEIR(15) 50.9; MTEB-v2 retrieval 53.9, equal to bge-small in the same table |
| granite-embedding-30m-english (R1) | Apache-2.0 | Excluded | 30M | 384 / 512 | Official | Yes | English | BEIR 49.1 |
| **granite-embedding-97m-multilingual-r2** | Apache-2.0 | Permissive-data statement only | 97M | 384 / 32,768 | Official (`onnx/model.onnx`, `quint8_avx2`) | Yes | 52 enhanced, 200+ base | ML retrieval 60.3; English 50.1 |
| snowflake-arctic-embed-s | Apache-2.0 | Not listed | 33M | 384 / 512 | Official | Yes | English | MTEB retrieval 51.98 |
| bge-small-en-v1.5 (today) | MIT | Likely (§2.3) | 33M | 384 / 512 | Xenova port | Yes | English | MTEB-v2 retrieval 53.9 |

**Rerankers**

| Model | Licence | MS MARCO | Params | ONNX (TS) | `CrossEncoder` (Py) | Languages | Score |
|---|---|---|---|---|---|---|---|
| **granite-embedding-reranker-english-r2** | Apache-2.0 | Excluded | 149M | **Third-party only** (`jrc2139/…-ONNX`: int8 151 MB, fp32 599 MB) | Yes | English | BEIR on the granite-small top-20: **55.0** on the current card, 54.4 in 2508.21085 (gte-reranker 54.8 there); the two sources disagree |
| **nvidia/llama-nemotron-rerank-1b-v2** | OpenMDW-1.1, plus "Llama 3.2 Community Model License Agreement … Built with Llama" | Excluded (card) | 1.24B | None; custom code (`llama_bidirectional_model.py`) | Remote code | Multilingual and cross-lingual (26 evaluated), 8192 ctx | Recall@5 on BEIR subsets + TechQA (card) |
| mxbai-rerank-xsmall-v1 | Apache-2.0 | Search-engine results ranked by an LLM | 71M | Official (87 MB quantised) | Yes | English | BEIR-11 43.9 against Lucene 38.0 |
| jina-reranker-v1-turbo-en | Apache-2.0 | Undisclosed | 38M | Official | Yes | English | — |
| ms-marco-MiniLM-L6-v2 (today) | Apache-2.0 | **Yes** | 23M | Xenova q8, 23 MB | Yes | English | — |

OpenMDW-1.1 grants rights "to deal in the Model Materials without restriction", subject to keeping notices (https://openmdw.ai/license/1-1/). How it interacts with the Llama 3.2 Community License's terms (a 700M monthly-active-user clause, an acceptable-use policy, "Built with Llama" attribution) is a maintainer question (**Unconfirmed**).

**Hosted, by configuration:**
- Cohere Rerank: `rerank-v3.5`, `v4.0-pro/fast` and `v5.0-pro/fast`. v4 and v5 take 32k tokens and are multilingual. Deployment is by API, Azure, SageMaker, or private VPC and on-premises (https://docs.cohere.com/docs/rerank).
- Voyage: `rerank-3` and `rerank-3-lite`, 32k tokens (https://docs.voyageai.com/docs/reranker).
- Embedding APIs from Cohere, Voyage, OpenAI and Google.

These services are commercial products under their own terms. Their cost is egress and data residency (`README.md` → `## 4. Setup inputs: source, store, models, TLS`).

### 3.2 Recommendation

**Inference, moderate confidence.**

- **Embedder for `fused`: `granite-embedding-small-english-r2`.**
  - It states the MS MARCO exclusion explicitly.
  - It keeps 384 dimensions, so the vector column keeps its shape.
  - It equals bge-small on MTEB-v2 retrieval.
  - Its 8192-token window addresses the long-section gap.
  
  Pin a revision of the community ONNX, or publish the product's own export.
- **Multilingual embedder, by configuration: `granite-embedding-97m-multilingual-r2`.** It is 384-d and has an official ONNX. Its MS MARCO exclusion is inferred from IBM's licence statement, so ask IBM to confirm.
- **Reranker for `fused-rerank`: `granite-embedding-reranker-english-r2`.** Three costs:
  1. It has about 6.5 times today's parameters, and today's `fused-rerank` p50 is already 1,099.7 ms on the real catalog. Its CPU latency at `RERANK_CANDIDATES = 20` (`cli/src/retrieval/search.ts:27`) is **Unconfirmed**.
  2. Its ONNX exists only as third-party exports, so the product must export and host its own.
  3. `ABSTAIN_SCORE_THRESHOLD = 0.32` (`search.ts:51`) is calibrated on MiniLM and does not carry over.
- **Multilingual rerank.** A clean local model exists: NVIDIA's Nemotron reranker. It has 1.2B parameters, runs only on PyTorch with remote code, and carries the Llama 3.2 licence reference. Measure it on CPU. If it passes, it becomes the local multilingual default, in keeping with "local by default" and `egress: deny`. Until then, hosted rerank (Cohere or Voyage) is available by configuration.

**Still Unconfirmed:**
- the Granite reranker's CPU latency and RSS;
- whether Transformers.js runs ModernBERT ONNX exports in this runtime;
- the licences of IBM's internal and synthetic data, which the product takes on IBM's word.

IBM's distillation teacher is its own Mistral-7B, trained on the same data (2508.21085, §3.3).

---

## 4. The model-free default

### 4.1 Abstention without a reranker

Today, abstention is `best < 0.32` on the reranker's score, in `fused-rerank` only (`search.ts:51`; `docs/retrieval-eval-results.md` → `## Threshold calibration`). On the real catalog it abstained on 19 of 25 negatives, but only 9 of the 15 `near` ones, and it also abstained on 6 positives. The re-calibration returned `cannot-separate`.

`lexical`'s score today is rank-derived RRF, not BM25 (`search.ts:48-49`, `addRrf`). Any score-based signal therefore needs a new store read in both runtimes.

| Option | Evidence | Verdict (Inference) |
|---|---|---|
| Raw BM25 floor | Elastic staff: scores are relative to their own query (forum, **secondary**). Elastic recommends `AND` / `minimum_should_match` for BM25 precision, and says minmax is "less suitable for keyword search" (https://www.elastic.co/search-labs/blog/semantic-precision-minimum-score, **vendor**) | Fragile: it moves with query length and every refresh |
| Per-query min-max | — | Useless: the top hit is always 1 |
| Post-retrieval predictors (score gap, WIG, NQC) | WIG: Zhou & Croft, SIGIR 2007 (https://doi.org/10.1145/1277741.1277835). NQC: Shtok et al., TOIS 2012 (https://doi.org/10.1145/2180868.2180873). A 2025 evaluation finds they "do not generalise" across collections and give "only marginal gains" (https://arxiv.org/abs/2504.01101) | Weak; per-corpus at best |
| IDF coverage of the query by the top hit | Nearest studied relatives are pre-retrieval IDF predictors: avgIDF, maxIDF and simplified clarity (He & Ounis, SPIRE 2004, https://doi.org/10.1007/978-3-540-30213-1_5; Hauff et al., CIKM 2008, https://doi.org/10.1145/1458082.1458311). They are generally reported as weaker than post-retrieval ones | Bounded and cheap, but **Unconfirmed** as a separator |
| None | — | Honest; loses a differentiator (`README.md` → `## 6. Risks`) |

**Recommendation (Inference).** Ship `lexical` with **no calibrated abstention claim**. Expose an IDF-coverage figure as a signal only, and let #199's negatives show whether it can gate. Keep abstention a property of `fused-rerank`, recalibrated per reranker. A `near` negative shares query words by construction, so no lexical signal is likely to separate it.

### 4.2 What a model-free default saves

Figures from `docs/retrieval-eval-results.md` → `### Footprint` and `### Cold start`, and `docs/retrieval.md` → `## What it costs` and `:122`:

| Item | Today, TS | Today, Python | Model-free |
|---|---|---|---|
| Runtime on disk | ~300 MB (`## What it costs`), of which `onnxruntime-node` ~290 MB (`:122`) | 929M venv *with* the `models` extra (venv without it unmeasured) | No ONNX runtime or `torch` |
| Weights | 56M q8 | 225M fp32 | 0 |
| Download step | `docs fetch-models` | same | none |
| First call, warm caches | 1,169.9 ms, includes model load | 6,864.1 ms | **unmeasured** |
| Cold build, 1,960 chunks | 111–128 s at ~4.5 cores, "dominated by embedding throughput" (`retrieval.md:88`) | 21.5 s for 331 chunks | **unmeasured**; expected seconds (**Inference**) |
| Server RSS | 2.0 GB | 1.1 GB | lower; split **Unconfirmed** |

**Inference.** The saving is about 346 MB on TS (290 MB + 56 MB). On Python it is **up to** about 1.15 GB, an upper bound because the venv without the extra was never measured. Today, Python's cost also comes on top of TS's, because `init` installs the TS runtime too (`### Footprint`).

**What blocks a lexical-only index today, in both runtimes:**
- **Store.**
  - TS: `cli/src/retrieval/store.ts:80` declares `embedding vector(${dimensions}) NOT NULL`.
  - Python: `docs-retrieval-service/src/harness_docs_retrieval/store.py:124` declares the same.
  - No row can exist without a vector.
- **Refresh.**
  - TS: `refresh.ts:58-63` requires an `embedder`, `:75-79` stores its id, and `:97` embeds every changed chunk.
  - Python: `refresh.py:49-50` requires an `embedder`, `:70-75` stores its id, and `:94` embeds.
- **Session.**
  - TS: `session.ts:51` loads both the embedder and the reranker before any mode is known, and `:45-49` refuses if either is missing from the cache.
  - Python: `service.py:172-173` resolves both models and sizes the store from `embedder.dimensions`.
  - `search.ts:127` does skip the embedder in `lexical`, but by then the models have already been loaded.

**Inference.** The product needs three changes in both runtimes: a nullable or separate vector column, a store opened without a dimension, and models loaded lazily by mode. Switching a mode on then costs an embed-only pass, not a rebuild.

### 4.3 What to tell users

**Inference, grounded in §1.**
- **Start with `lexical`.** It is fastest, downloads nothing and sends nothing anywhere. It wins when questions use the documents' own words: names, codes, error messages, product terms.
- **Turn on `fused` when** people ask in words the documents do not use. That covers policy, HR, support and other docs for non-specialists, synonyms, misspellings, and other languages (with the multilingual embedder).
- **Turn on `fused-rerank` when** the top three results matter more than speed, and you can afford roughly a second per query and a ~150 MB model. It is also the only mode that can say "no confident match".
- **Check on your own questions.** Ship the eval runner's ad-hoc route (`--docs-root`, `--queries`) as a `compare-modes` command. Every published figure above comes from someone else's corpus.

### 4.4 `models:` and `mode:`

**Inference.** A sketch, consistent with round 1's file (`README.md` → `## 4`):

```yaml
search:
  mode: lexical                 # lexical | fused | fused-rerank   (vector stays an eval arm)
models:                         # read only when mode needs it
  embedder:
    provider: local             # local | cohere | voyage | openai | google
    id: ibm-granite/granite-embedding-small-english-r2
    revision: <pinned sha>
  reranker:
    provider: local
    id: ibm-granite/granite-embedding-reranker-english-r2
    revision: <pinned sha>
    abstain_below: auto         # the shipped calibration for this id; else a number
  # reranker: { provider: cohere, id: rerank-v3.5, key_env: COHERE_API_KEY }
egress: deny                    # a hosted provider requires egress: allow
```

The rules:
1. `lexical` never reads `models:` and never downloads.
2. `fused` needs an embedder, and `fused-rerank` needs both models.
3. A missing local model is fetched on first need, with its size stated, or refused offline with the `fetch-models` remedy.
4. An embedder change re-embeds, as today.
5. `auto` resolves only for reranker ids the product has calibrated. For any other id, abstention is off, and the user is told so.
6. The MCP tool takes `mode` per call, capped at the configured mode.
7. The shipped allow-list of local ids carries a licence-provenance field. A user-supplied id is accepted with a warning.

---

## Open questions

1. Does hybrid + rerank beat `lexical` on a business corpus? This is #199's question. This file's hypothesis is that low-overlap queries favour `fused` and identifier queries favour `lexical`.
2. What are the Granite reranker's CPU p50 and RSS at 20 and 10 candidates? Does Transformers.js run a ModernBERT ONNX export? The same questions apply to the Nemotron reranker on PyTorch.
3. Does Granite's 8192-token window fix the long-section misses? Re-run the three committed corpora with it.
4. What `abstain_below` value suits Granite? Can IDF coverage separate negatives in `lexical`?
5. Legal policy. Is "avoid MS MARCO-trained weights" the rule? Does it extend to models with undisclosed data (mxbai, jina v1 turbo, Arctic-s) or scraped search results (mxbai-rerank)? Are the Llama 3.2 licence terms on NVIDIA's reranker acceptable?
6. Which hosted providers come first? Cohere's private VPC option may matter for residency.
7. How long does a lexical-only build take at 10⁵ chunks?

## Fork verdict

A model-free `lexical` default is well supported. It matches this repository's real measurement and Azure's keyword row. It also removes about 346 MB (TS) to at most about 1.15 GB (Python), the model download and every licence question from the default path. It does need a vectorless store, refresh and session in both runtimes. The case for hybrid + rerank on business corpora is real but moderate at best: BEIR and vendor figures favour it on average and on low-overlap queries, while the evidence closest to enterprise data is LLM-judged or synthetic. MS MARCO inheritance is legally unsettled, but IBM and NVIDIA act on it and Microsoft defers to legal review, and today's embedder is probably affected too. The clean English pair is `granite-embedding-small-english-r2` with `granite-embedding-reranker-english-r2`, and NVIDIA's 1.2B Nemotron reranker is a clean but heavy multilingual option. It becomes the local multilingual default if it passes a CPU measurement, with hosted rerank available by configuration meanwhile. Confidence is high on the default and the licence facts, and moderate on Granite until its CPU latency, ONNX path and calibration are measured.

## Review response

Review: `reviews/06-models-and-modes.md`, FAIL (1 MF, 12 SF, 7 NtH). All applied except where noted.

- **MF 1, NVIDIA reranker.** Applied. Verified on the card and the HF API: OpenMDW-1.1, the Llama 3.2 reference, `llama_bidirectional_model.py`, no ONNX, 1,235,816,448 parameters, MS MARCO excluded. Added to §2.2, §2.3 and §3.1. The "clean" definition now names two publishers, and the multilingual recommendation, Open question 5 and the verdict are amended.
- **SF 1, lexical-only blockers.** Applied. §4.2 now cites `store.ts:80`, `refresh.ts:58-63/75-79/97`, `session.ts:45-51`, `store.py:124`, `refresh.py:49-50/70-75/94` and `service.py:172-173`. It notes that `search.ts:127` skips the embedder, and states the three changes needed.
- **SF 2, Python saving.** Applied: stated as an upper bound, plus the "on top of TS" note.
- **SF 3, abstention sources.** Applied. Cited Zhou & Croft 2007 and Shtok et al. 2012 directly, added the pre-retrieval IDF predictors (He & Ounis 2004, Hauff et al. 2008), noted the RRF score and the new store read, and dropped 2305.10923.
- **SF 4, Anthropic.** Applied: the row is relabelled "contextual", with a caveat.
- **SF 5, Azure.** Applied: generated queries and GPT labels added to the caveat and to §1.3 item 2.
- **SF 6, EnterpriseRAG-Bench.** Applied: marked vendor preprint; "every question type" became "recall on all 8 types". WixQA is also marked vendor (Wix).
- **SF 7, legal analysis.** Applied: cited 2310.16787 as an analogy, and added the "automatically agreeing" quote.
- **SF 8, Arctic-xs.** Applied: xs marked as MS MARCO-trained through its base model and excluded. Arctic-s is kept as "not listed".
- **SF 9, 97m-multilingual.** Applied: "permissive-data statement only"; the exclusion is Inference.
- **SF 10, reranker score.** Applied: 55.0 from the card beside 54.4 from the paper, with the disagreement stated.
- **SF 11, replication clause.** Applied: cut to the reviewer's wording.
- **SF 12, cost citation.** Applied: `## What it costs` for ~300 MB, `:122` for 290 MB.
- **NtH 1, Qwen3 issue.** Applied in §2.2.
- **NtH 2, C-Pack mMARCO-Zh.** Applied; still Unconfirmed.
- **NtH 3, mxbai provenance.** Applied. It is now cited to https://www.mixedbread.com/blog/mxbai-rerank-v1 (re-review).
- **NtH 4, ELSER.** Applied.
- **NtH 5, min-score wording.** Applied.
- **NtH 6, length and verdict.** Applied: under 4,000 words, verdict cut to 8 sentences.
- **NtH 7.** No change, as the reviewer advised.
