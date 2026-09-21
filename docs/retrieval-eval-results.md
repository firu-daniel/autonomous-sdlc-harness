# Docs-retrieval eval results

**Who reads this, and what it owns.** A maintainer deciding whether the docs-retrieval tool earns its
place against the index-first navigation agents use today, and the regression gate that grades a later
run against these numbers. This file is the **record of what was measured** — recall, MRR, latency and
cost per arm, over each committed corpus, with the corpus stamp, the models and the abstention
threshold each figure was taken under. It does not explain how to run the eval or what the metrics
mean: `docs/retrieval-eval.md` owns that, and `docs/retrieval.md` owns how the tool itself works.

> **The region between the two markers below is generated.** `evals/docs-retrieval/run.mjs` rewrites
> it on every run given `--out`, and it is the **only** writer of those bytes. A hand edit inside the
> region is destroyed by the next run; everything outside it, including every section below the end
> marker, is left byte for byte.

<!-- eval:generated:start -->

<!-- eval:corpus:fixture-catalog:start -->
### Corpus `fixture-catalog`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | — | — | — | — | — | — | — | — | awaiting hand run |
| B | `lexical` | 0.444 | 0.889 | 1.000 | 0.657 | 1.000 | 0.606 | 0.4 | 3.3 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.778 | 1.000 | 1.000 | 0.889 | 1.000 | 0.806 | 5.2 | 5.5 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| D | `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 1.000 | 0.685 | 5.4 | 7.1 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 0.667 | 0.556 | 388.0 | 483.7 | local — no billed tokens (12 embed calls, 12 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its row is
filled by re-running the eval with `--transcript` against a hand-run transcript, per the procedure in
`docs/retrieval-eval.md` → `## Running arm A by hand`.

The `cost` column is not a score, and **the arms’ scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `fixture-catalog` — snapshot `{ files: 9, chunks: 41 }`,
  as the index build of this run reported it. A figure over `fixture-catalog` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- `layers[]`: none — this corpus is read as a repository of its own and carries no conventions documents.
- Query set: `evals/docs-retrieval/queries/fixture-catalog.jsonl` — 9 positive, 3 negative.
- `k`: 5; repetitions per query: 1.
- Embedder: `Xenova/bge-small-en-v1.5:q8:cls:384:v1`. Reranker: `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` — loaded and run outside the stub.
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run, which the index build refuses to proceed without.
- Abstention threshold in force: `0.3`, read off the `search.js` this run loaded.
- Host `Daniels-MacBook-Air.local`, Node `v20.19.5`, 2026-09-21T16:46:12.749Z.

```json
{
  "corpus": "fixture-catalog",
  "snapshot": {
    "files": 9,
    "chunks": 41
  },
  "abstainScoreThreshold": 0.3,
  "embedder": "Xenova/bge-small-en-v1.5:q8:cls:384:v1",
  "reranker": "Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1",
  "k": 5,
  "repeat": 1,
  "queries": {
    "path": "evals/docs-retrieval/queries/fixture-catalog.jsonl",
    "positives": 9,
    "negatives": 3
  },
  "generatedAt": "2026-09-21T16:46:12.749Z",
  "host": "Daniels-MacBook-Air.local",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "mode": null,
      "ran": false
    },
    {
      "arm": "B",
      "mode": "lexical",
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.4444444444444444,
          "3": 0.8888888888888888,
          "5": 1
        },
        "mrr": 0.6574074074074074,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 0.7777777777777778,
            "5": 1
          },
          "mrr": 0.6055555555555556
        },
        "latency": {
          "p50": 0.3935830000000351,
          "p95": 3.263749999999618
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.015625
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.263749999999618
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 5
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.5560419999997066
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.40429100000028484
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.4310840000002827
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.015625
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.3975000000000364
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.3653749999998581
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 4
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/tracking.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015625
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.3935830000000351
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#exception-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.38954199999989214
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.38579100000015387
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.41600000000016735
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [],
            "durationMs": [
              0.14704099999971731
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/tracking.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.3845409999998992
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "C",
      "mode": "vector",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.7777777777777778,
          "3": 1,
          "5": 1
        },
        "mrr": 0.8888888888888888,
        "strict": {
          "recall": {
            "1": 0.6666666666666666,
            "3": 0.8888888888888888,
            "5": 1
          },
          "mrr": 0.8055555555555556
        },
        "latency": {
          "p50": 5.225082999999813,
          "p95": 5.513416000000234
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.042875000000095
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.513416000000234
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#status-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.225082999999813
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#exception-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.2794999999996435
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.2961669999999685
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.952291999999943
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.430707999999868
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.396166999999878
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.422667000000274
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.159625000000233
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#bay-numbering",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.088916999999583
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/tracking.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.072415999999976
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "D",
      "mode": "fused",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.5555555555555556,
          "3": 1,
          "5": 1
        },
        "mrr": 0.7592592592592592,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 1,
            "5": 1
          },
          "mrr": 0.6851851851851851
        },
        "latency": {
          "p50": 5.385375000000295,
          "p95": 7.120707999999922
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.03125
              },
              {
                "ref": "docs/labels.md",
                "score": 0.02976190476190476
              }
            ],
            "durationMs": [
              5.242707999999766
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.02976190476190476
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.029083245521601686
              }
            ],
            "durationMs": [
              7.120707999999922
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.03125
              },
              {
                "ref": "docs/labels.md",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              5.621208000000024
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.030621785881252923
              }
            ],
            "durationMs": [
              5.443250000000262
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              6.279457999999977
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/rates.md",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.03125
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.031024531024531024
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              5.12112500000012
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/webhooks.md#subscribing-to-events",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.029850746268656716
              }
            ],
            "durationMs": [
              5.411208999999872
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.02967032967032967
              }
            ],
            "durationMs": [
              5.385375000000295
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.030798389007344232
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.029857397504456328
              }
            ],
            "durationMs": [
              5.266000000000076
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.03076923076923077
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.029437229437229435
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.029411764705882353
              },
              {
                "ref": "docs/tracking.md#estimated-delivery-window",
                "score": 0.029211087420042643
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.029138513513513514
              }
            ],
            "durationMs": [
              5.998042000000169
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03076923076923077
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#bay-numbering",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.32870899999989
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/tracking.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/exceptions.md#returns-to-sender",
                "score": 0.029211087420042643
              }
            ],
            "durationMs": [
              4.780374999999822
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.032266458495966696
          }
        ]
      }
    },
    {
      "arm": "E",
      "mode": "fused-rerank",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 12,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.4444444444444444,
          "3": 0.6666666666666666,
          "5": 0.6666666666666666
        },
        "mrr": 0.5555555555555556,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 0.6666666666666666,
            "5": 0.6666666666666666
          },
          "mrr": 0.5555555555555556
        },
        "latency": {
          "p50": 387.95337500000005,
          "p95": 483.6779580000002
        },
        "samples": 12,
        "abstainedOnNegative": 3,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.9988245368003845
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.997146487236023
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.967546820640564
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.9095854163169861
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.788049042224884
              }
            ],
            "durationMs": [
              450.1607919999997
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9988245368003845,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.9811885952949524
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.7106814980506897
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.3005616068840027
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.109153151512146
              },
              {
                "ref": "docs/exceptions.md#returns-to-sender",
                "score": 0.05581606552004814
              }
            ],
            "durationMs": [
              388.72837500000014
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9811885952949524,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.941379964351654
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.9142329692840576
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.7656862139701843
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.5925036668777466
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.02494685910642147
              }
            ],
            "durationMs": [
              483.6779580000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.941379964351654,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.9988497495651245
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.995164155960083
              },
              {
                "ref": "docs/labels.md",
                "score": 0.9884990453720093
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.9212325215339661
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.8922458291053772
              }
            ],
            "durationMs": [
              381.89074999999957
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9988497495651245,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              389.35262499999953
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              381.2952500000001
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.5472269654273987
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.017705265432596207
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.0010588211007416248
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.0004331582458689809
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.0001967466960195452
              }
            ],
            "durationMs": [
              395.13516699999946
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5472269654273987,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              387.95337500000005
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.983818769454956
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.4273105263710022
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.0005338062765076756
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.00026457515195943415
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.00011346016981406137
              }
            ],
            "durationMs": [
              375.1113750000004
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.983818769454956,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              377.9772499999999
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              395.26166699999976
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              141.1967909999994
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
    }
  ]
}
```
<!-- eval:corpus:fixture-catalog:end -->

<!-- eval:corpus:self-docs:start -->
### Corpus `self-docs`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | — | — | — | — | — | — | — | — | awaiting hand run |
| B | `lexical` | 0.333 | 0.733 | 0.933 | 0.554 | 0.733 | 0.351 | 1.0 | 2.9 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.533 | 0.533 | 0.667 | 0.560 | 0.333 | 0.247 | 3.9 | 5.8 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| D | `fused` | 0.533 | 0.800 | 0.933 | 0.674 | 0.733 | 0.369 | 4.3 | 6.2 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.400 | 0.600 | 0.600 | 0.500 | 0.533 | 0.383 | 600.7 | 748.2 | local — no billed tokens (20 embed calls, 20 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its row is
filled by re-running the eval with `--transcript` against a hand-run transcript, per the procedure in
`docs/retrieval-eval.md` → `## Running arm A by hand`.

The `cost` column is not a score, and **the arms’ scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `self-docs` — snapshot `{ files: 13, chunks: 173 }`,
  as the index build of this run reported it. A figure over `self-docs` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- `layers[]`, read out of the resolved checkout’s `harness.config.json` and never composed here:
  - `cli` (path `cli`) → `.claude/context/cli.md`
  - `plugin` (path `plugin`) → `.claude/context/plugin.md`
  - `general` (path `.`) → `.claude/context/conventions.md`
- Query set: `evals/docs-retrieval/queries/self-docs.jsonl` — 15 positive, 5 negative.
- `k`: 5; repetitions per query: 1.
- Embedder: `Xenova/bge-small-en-v1.5:q8:cls:384:v1`. Reranker: `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` — loaded and run outside the stub.
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run, which the index build refuses to proceed without.
- Abstention threshold in force: `0.3`, read off the `search.js` this run loaded.
- Host `Daniels-MacBook-Air.local`, Node `v20.19.5`, 2026-09-21T16:46:35.978Z.

```json
{
  "corpus": "self-docs",
  "snapshot": {
    "files": 13,
    "chunks": 173
  },
  "abstainScoreThreshold": 0.3,
  "embedder": "Xenova/bge-small-en-v1.5:q8:cls:384:v1",
  "reranker": "Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1",
  "k": 5,
  "repeat": 1,
  "queries": {
    "path": "evals/docs-retrieval/queries/self-docs.jsonl",
    "positives": 15,
    "negatives": 5
  },
  "generatedAt": "2026-09-21T16:46:35.978Z",
  "host": "Daniels-MacBook-Air.local",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "mode": null,
      "ran": false
    },
    {
      "arm": "B",
      "mode": "lexical",
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.3333333333333333,
          "3": 0.7333333333333333,
          "5": 0.9333333333333333
        },
        "mrr": 0.5544444444444444,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.4,
            "5": 0.7333333333333333
          },
          "mrr": 0.3511111111111111
        },
        "latency": {
          "p50": 0.9834159999991243,
          "p95": 2.908167000001413
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#3-can-another-family-reach-this-state",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015625
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.226957999999286
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#output-logging-and-errors",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#3-the-allowdeny-surface",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9529159999983676
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#one-example--the-shape-a-rule-takes-here",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/cli.md#not-determined",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.5437500000007276
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#6-option-c--a-composer-family-fallback",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/conventions.md#the-testing-bar",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9900000000016007
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#7-doctor",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.81683300000077
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#31-narrowed--allow--silent",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#where-a-new-responsibility-goes",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.2168340000025637
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#registries--a-name-routed-to-an-implementation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.0296669999988808
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#wires-dispatch-in-return-out",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.5817080000015267
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/outer-loop-verification.md#17-the-generated-wrappers-arguments-anchor-detached-start",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#5-the-wrapper-script-contract",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8559999999997672
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.1955830000006245
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6698340000002645
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 4
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.5606670000015583
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#the-testing-bar",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#1-the-target-vocabulary",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9819580000003043
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.795957999998791
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 5
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#6-option-c--a-composer-family-fallback",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#7-doctor",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#5-the-wrapper-script-contract",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.908167000001413
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#2-standing-decision-matrices",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#36-fail-closed-conditions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.134249999999156
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9160830000000715
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.0817089999982272
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9834159999991243
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.015625
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.7301670000015292
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "C",
      "mode": "vector",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.5333333333333333,
          "3": 0.5333333333333333,
          "5": 0.6666666666666666
        },
        "mrr": 0.56,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.26666666666666666,
            "5": 0.3333333333333333
          },
          "mrr": 0.24666666666666667
        },
        "latency": {
          "p50": 3.8538750000006985,
          "p95": 5.761374999998225
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#8-config",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.336083000001963
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#33-widened--silent--allow",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#21-helper-call-order-composition",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#22-expansion-bypass-rows",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.7136669999999867
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#registries-and-dispatch-tables",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#what-this-layer-owns-and-what-it-is-not",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/cli.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.40520800000013
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/typecheck-key-decision.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#4-option-a--make-the-key-optional",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#verifying-a-change-in-this-layer",
                "score": 0.015625
              },
              {
                "ref": "docs/typecheck-key-decision.md#2-what-depends-on-the-key-existing",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.89495800000077
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/watcher.md#the-path",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.5180829999990237
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#what-a-later-change-owes-this-section-2",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.6936249999998836
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#12-per-guard-and-composite-latency-ms-per-call",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#0-method",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.6729579999991984
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#verifying-a-change-in-this-layer",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.553834000002098
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#21-exit-classification",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.4534160000002885
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/watcher.md#the-policy-a-coordinating-record-and-an-opt-in-lock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#21-exit-classification",
                "score": 0.015625
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.3919169999971928
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.1144160000003467
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.2111670000012964
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/analyze.md#8-how-this-is-verified",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/analyze.md#2-mode-greenfield-or-existing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/analyze.md#12-the-corpus-passs-own-decisions",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.176665999999386
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015625
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.153167000000394
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.178500000001804
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/config.md#4-token--class--home",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/config.md",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.7262919999993755
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.325167000002693
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.312375000001339
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-fixture-catalog",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.761374999998225
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#the-order-files-are-created-so-a-half-built-feature-is-still-coherent",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.8538750000006985
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "D",
      "mode": "fused",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.5333333333333333,
          "3": 0.8,
          "5": 0.9333333333333333
        },
        "mrr": 0.6744444444444445,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.5333333333333333,
            "5": 0.7333333333333333
          },
          "mrr": 0.3688888888888889
        },
        "latency": {
          "p50": 4.288958000001003,
          "p95": 6.231958000000304
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.030886196246139225
              },
              {
                "ref": "docs/typecheck-key-decision.md#3-can-another-family-reach-this-state",
                "score": 0.03047794966520434
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.030330882352941176
              },
              {
                "ref": "docs/cli.md#8-config",
                "score": 0.0288981288981289
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.02804284323271665
              }
            ],
            "durationMs": [
              4.292292000001908
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.030886196246139225,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/guard-verification.md#25-directory-de-quoting-the-widening-and-its-paired-refusal",
                "score": 0.030303030303030304
              },
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.028991596638655463
              }
            ],
            "durationMs": [
              3.436541999999463
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.031544957774465976
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.03021353930031804
              },
              {
                "ref": ".claude/context/conventions.md#registries-and-dispatch-tables",
                "score": 0.02976190476190476
              },
              {
                "ref": ".claude/context/cli.md#what-this-layer-owns-and-what-it-is-not",
                "score": 0.029138513513513514
              }
            ],
            "durationMs": [
              4.393165999998018
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031544957774465976,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.031544957774465976
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/typecheck-key-decision.md#4-option-a--make-the-key-optional",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.028985507246376812
              }
            ],
            "durationMs": [
              6.5338339999980235
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031544957774465976,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.03131881575727918
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.030776515151515152
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.029116045245077504
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.028021349599695006
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02792120864410021
              }
            ],
            "durationMs": [
              3.932209000002331
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03131881575727918,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.03278688524590164
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.03021353930031804
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.02964426877470356
              },
              {
                "ref": "docs/guard-verification.md#21-helper-call-order-composition",
                "score": 0.026547116736990152
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.02604430914933198
              }
            ],
            "durationMs": [
              4.288958000001003
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.0315136476426799
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.03149801587301587
              },
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.029551337359792925
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.028298204527712725
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.02736726874657909
              }
            ],
            "durationMs": [
              5.550584000000526
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.0315136476426799,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.032018442622950824
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.03200204813108039
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.029571646010002173
              },
              {
                "ref": "docs/development.md",
                "score": 0.029437229437229435
              }
            ],
            "durationMs": [
              5.506374999997206
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.03007688828584351
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02946236559139785
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.02750455373406193
              }
            ],
            "durationMs": [
              3.689249999999447
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03149801587301587,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.031746031746031744
              },
              {
                "ref": "docs/watcher.md#the-policy-a-coordinating-record-and-an-opt-in-lock",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02904040404040404
              }
            ],
            "durationMs": [
              3.97245799999655
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.02904040404040404
              }
            ],
            "durationMs": [
              3.5870839999988675
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 4
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.030886196246139225
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.030776515151515152
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.029957522915269395
              }
            ],
            "durationMs": [
              3.5722079999977723
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03200204813108039,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/analyze.md",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/analyze.md#1-the-target-vocabulary",
                "score": 0.02946912242686891
              },
              {
                "ref": "docs/analyze.md#10-what-the-skeletons-say-now-the-offer-exists",
                "score": 0.02919863597612958
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.02871794871794872
              }
            ],
            "durationMs": [
              5.153457999997045
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.027820121951219513
              },
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.027051561365286855
              },
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.026742734890354787
              }
            ],
            "durationMs": [
              5.087082999998529
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.029726775956284153
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.029030910609857977
              },
              {
                "ref": "docs/cli.md#the-interaction-rule",
                "score": 0.028790389395194696
              }
            ],
            "durationMs": [
              4.547375000001921
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03225806451612903,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.027809742999616416
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.02749719416386083
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.027118043247075507
              },
              {
                "ref": "docs/config.md",
                "score": 0.026494565217391304
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.02565270188221008
              }
            ],
            "durationMs": [
              6.231958000000304
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.027809742999616416
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/plugin.md#sample-fixtures",
                "score": 0.029411764705882353
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.027777777777777776
              },
              {
                "ref": ".claude/context/cli.md#dependencies-and-which-way-they-point",
                "score": 0.02761904761904762
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.027402402402402402
              },
              {
                "ref": ".claude/context/cli.md#one-example--the-shape-a-rule-takes-here",
                "score": 0.02715098147128967
              }
            ],
            "durationMs": [
              4.015708000002633
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.029411764705882353
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.03047794966520434
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.030017921146953404
              },
              {
                "ref": ".claude/context/conventions.md#documents-of-record",
                "score": 0.025481764612199396
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.025206087507926443
              }
            ],
            "durationMs": [
              5.927042000002984
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031009615384615385
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.030330882352941176
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.02938045560996381
              }
            ],
            "durationMs": [
              3.7186250000013388
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.032266458495966696
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.032266458495966696
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.02928692699490662
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.02871794871794872
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.027730294396961064
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.02639344262295082
              }
            ],
            "durationMs": [
              3.813750000001164
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.032266458495966696
          }
        ]
      }
    },
    {
      "arm": "E",
      "mode": "fused-rerank",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 20,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.4,
          "3": 0.6,
          "5": 0.6
        },
        "mrr": 0.5,
        "strict": {
          "recall": {
            "1": 0.26666666666666666,
            "3": 0.4666666666666667,
            "5": 0.5333333333333333
          },
          "mrr": 0.38333333333333336
        },
        "latency": {
          "p50": 600.7124999999978,
          "p95": 748.2279170000002
        },
        "samples": 20,
        "abstainedOnNegative": 5,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              748.2279170000002
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#3-the-allowdeny-surface",
                "score": 0.8066375851631165
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.7561017274856567
              },
              {
                "ref": "docs/guard-verification.md#32-tightened--silent--deny",
                "score": 0.5888859033584595
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.5314047336578369
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.3608555197715759
              }
            ],
            "durationMs": [
              771.617624999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8066375851631165,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.9983236789703369
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.94883793592453
              },
              {
                "ref": ".claude/context/cli.md#not-determined",
                "score": 0.8381896018981934
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.7049463391304016
              },
              {
                "ref": ".claude/context/plugin.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.6496245265007019
              }
            ],
            "durationMs": [
              540.9536250000019
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9983236789703369,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              607.6198750000003
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.9128396511077881
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.8800132274627686
              },
              {
                "ref": ".claude/context/plugin.md#the-placeholder-vocabulary",
                "score": 0.5044143795967102
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.4423319399356842
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.30130723118782043
              }
            ],
            "durationMs": [
              572.366667000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9128396511077881,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.7014356851577759
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.002652770606800914
              },
              {
                "ref": "docs/outer-loop-verification.md#11-commit-on-branchsh--refuses-loudly",
                "score": 0.0008274426218122244
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.00040268019074574113
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.000039824437408242375
              }
            ],
            "durationMs": [
              621.4848749999983
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7014356851577759,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.9804458022117615
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.9793976545333862
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.6777825355529785
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.03824503347277641
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.012248542159795761
              }
            ],
            "durationMs": [
              613.0555000000022
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9804458022117615,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.9992165565490723
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.9961328506469727
              },
              {
                "ref": "docs/development.md",
                "score": 0.9920783042907715
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.9666450023651123
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.7336789965629578
              }
            ],
            "durationMs": [
              552.6027079999985
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9992165565490723,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#1-the-loop-in-one-page",
                "score": 0.9118318557739258
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.45219185948371887
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.03981650248169899
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.02369111403822899
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.019104667007923126
              }
            ],
            "durationMs": [
              588.3287920000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9118318557739258,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.9862282872200012
              },
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.12589380145072937
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.029976895079016685
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.017711561173200607
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.015148887410759926
              }
            ],
            "durationMs": [
              583.2946249999986
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9862282872200012,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.5403093695640564
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.44221770763397217
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.093300461769104
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.055737048387527466
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.020913545042276382
              }
            ],
            "durationMs": [
              614.755000000001
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5403093695640564,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.6682106852531433
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.38246089220046997
              },
              {
                "ref": "docs/retrieval-eval-results.md",
                "score": 0.2793675363063812
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.27396267652511597
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.10480803996324539
              }
            ],
            "durationMs": [
              596.3052920000009
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.6682106852531433,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.33899036049842834
              },
              {
                "ref": "docs/analyze.md",
                "score": 0.2882399559020996
              },
              {
                "ref": "docs/analyze.md#9-how-the-offer-reaches-the-command-and-the-naming-hazard",
                "score": 0.24035446345806122
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.10705219954252243
              },
              {
                "ref": "docs/analyze.md#10-what-the-skeletons-say-now-the-offer-exists",
                "score": 0.046089813113212585
              }
            ],
            "durationMs": [
              570.9047910000008
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.33899036049842834,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.9918370842933655
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.9581737518310547
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.9212865829467773
              },
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.8447800278663635
              },
              {
                "ref": "docs/cli.md",
                "score": 0.8256142735481262
              }
            ],
            "durationMs": [
              608.6210420000025
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9918370842933655,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.9619483947753906
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.9537369608879089
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.45984140038490295
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.06278954446315765
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.050347305834293365
              }
            ],
            "durationMs": [
              620.1906659999986
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9619483947753906,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              600.1267079999998
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              621.8845000000001
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              600.7124999999978
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              596.7691249999989
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              630.4464169999992
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
    }
  ]
}
```
<!-- eval:corpus:self-docs:end -->

<!-- eval:generated:end -->

## Threshold calibration

_Task 14 fills this section: the value `ABSTAIN_SCORE_THRESHOLD` was calibrated to, the two score
distributions it separates, and the corpora it was calibrated on._

## Cold build and index size

_Task 8 fills this section: cold-build wall time and the index's size on disk._

## The query-log pass

_Task 7 fills this section: the pass over the shipped query log against the real models, and its own
latency figures._

## Arm A — awaiting a hand run

_Task 6 fills this section: arm A's harness and the procedure that produces the transcript whose
records fill its row above. The row itself is generated and never hand-edited._
