"""The embedder and the reranker retrieval runs on; a port of `cli/src/retrieval/models.ts`.

The rule this module exists to enforce, carried over from `models.ts`: a model is downloaded only
by `fetch_models`, at setup time. Every other load runs with remote loading disabled, so a run
never reaches the network. `sentence_transformers` and `torch` are imported inside `load_models`
alone, so importing this module loads neither — the Python twin of the CLI's dynamic-import rule.

Precision and ids, decided here. Both models are the originals of the `Xenova/*` ONNX exports the
TypeScript side runs, loaded at full precision (fp32) on CPU: that is the normal Python path, and it
is the default. The ids are namespaced under `ID_NAMESPACE` because nothing in this branch measures
whether the two backends' vectors are interchangeable, and a shared id would claim they are; they
encode the precision the way the TypeScript id encodes `q8`. Whether ids may ever be shared is the
comparison branch's decision.

The weight cache is separate from the CLI's Xenova cache, in the Hugging Face hub layout
(`models--<org>--<name>/snapshots/<revision>/…`), and carries `MANIFEST_NAME`, written only by
`fetch_models` from what it actually downloaded.
"""

import asyncio
import json
import os
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from harness_docs_retrieval.errors import ServiceError


class Embedder(Protocol):
    """Turns text into vectors. `id` is stored in the index, and a change to it forces a rebuild."""

    id: str
    dimensions: int

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...


class Reranker(Protocol):
    """Scores passages against a query. Every score lies in `[0, 1]`, and higher is better."""

    id: str

    async def score(self, query: str, passages: Sequence[str]) -> list[float]: ...


EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# Copied verbatim from `models.ts`; prepended to queries only.
EMBEDDING_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

EMBEDDING_DIMENSIONS = 384
MODEL_PRECISION = "fp32"
# Bumped by hand when any loading parameter changes, so both ids change with it.
MODEL_VERSION = 1
ID_NAMESPACE = "py-st"

EMBEDDER_ID = (
    f"{ID_NAMESPACE}/{EMBEDDING_MODEL}:{MODEL_PRECISION}"
    f":cls:{EMBEDDING_DIMENSIONS}:v{MODEL_VERSION}"
)
RERANKER_ID = f"{ID_NAMESPACE}/{RERANK_MODEL}:{MODEL_PRECISION}:sigmoid:v{MODEL_VERSION}"

MODEL_IDS = (EMBEDDING_MODEL, RERANK_MODEL)

MODEL_CACHE_ENV = "HARNESS_DOCS_RETRIEVAL_MODEL_CACHE"
MANIFEST_NAME = "harness-docs-retrieval-models.json"
MANIFEST_VERSION = 1

_MODELS_EXTRA_HINT = (
    "the models extra (sentence-transformers, torch) is not installed; "
    "run bash scripts/python-service.sh sync --with-models"
)


def model_cache_dir() -> Path:
    """`MODEL_CACHE_ENV`, else `$XDG_CACHE_HOME`, else `~/.cache`, under `harness-docs-retrieval`.

    An empty variable counts as unset.
    """
    override = os.environ.get(MODEL_CACHE_ENV, "")
    if override:
        return Path(override)
    xdg = os.environ.get("XDG_CACHE_HOME", "")
    base = Path(xdg) if xdg else Path.home() / ".cache"
    return base / "harness-docs-retrieval" / "models"


def hub_model_dir(cache_dir: Path, model_id: str) -> Path:
    """The hub-layout directory of one model: `models--<org>--<name>`."""
    return cache_dir / ("models--" + model_id.replace("/", "--"))


def snapshot_dir(cache_dir: Path, model_id: str, revision: str) -> Path:
    return hub_model_dir(cache_dir, model_id) / "snapshots" / revision


@dataclass(frozen=True)
class ManifestEntry:
    revision: str
    files: tuple[str, ...]


def read_manifest(cache_dir: Path) -> dict[str, ManifestEntry]:
    """The manifest's well-formed entries; empty when it is missing, unreadable or malformed."""
    try:
        raw = json.loads((cache_dir / MANIFEST_NAME).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(raw, dict) or raw.get("version") != MANIFEST_VERSION:
        return {}
    models = raw.get("models")
    if not isinstance(models, dict):
        return {}
    entries: dict[str, ManifestEntry] = {}
    for model_id, entry in models.items():
        if not isinstance(entry, dict):
            continue
        revision = entry.get("revision")
        files = entry.get("files")
        if not isinstance(revision, str) or not revision or not isinstance(files, list):
            continue
        if not files or not all(isinstance(file, str) and file for file in files):
            continue
        entries[model_id] = ManifestEntry(revision=revision, files=tuple(files))
    return entries


def write_manifest(cache_dir: Path, entries: dict[str, ManifestEntry]) -> None:
    payload = {
        "version": MANIFEST_VERSION,
        "models": {
            model_id: {"revision": entry.revision, "files": list(entry.files)}
            for model_id, entry in entries.items()
        },
    }
    cache_dir.mkdir(parents=True, exist_ok=True)
    (cache_dir / MANIFEST_NAME).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


@dataclass(frozen=True)
class ModelFiles:
    present: bool
    missing: tuple[str, ...]


def model_files_present(cache_dir: Path) -> ModelFiles:
    """File existence only; loads nothing.

    A model the manifest does not describe is missing as `<model id>/<MANIFEST_NAME>`, and a
    listed snapshot file that does not exist as `<model id>/<file>`.
    """
    entries = read_manifest(cache_dir)
    missing: list[str] = []
    for model_id in MODEL_IDS:
        entry = entries.get(model_id)
        if entry is None:
            missing.append(f"{model_id}/{MANIFEST_NAME}")
            continue
        snapshot = snapshot_dir(cache_dir, model_id, entry.revision)
        missing.extend(
            f"{model_id}/{file}" for file in entry.files if not (snapshot / file).is_file()
        )
    return ModelFiles(present=not missing, missing=tuple(missing))


class _SentenceTransformerEmbedder:
    def __init__(self, model: Any) -> None:
        self.id = EMBEDDER_ID
        self.dimensions = EMBEDDING_DIMENSIONS
        self._model = model

    async def _embed(self, texts: list[str]) -> list[list[float]]:
        vectors = await asyncio.to_thread(
            self._model.encode,
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [[float(value) for value in row] for row in vectors.tolist()]

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        return [] if not texts else await self._embed(list(texts))

    async def embed_query(self, text: str) -> list[float]:
        vectors = await self._embed([f"{EMBEDDING_QUERY_PREFIX}{text}"])
        return vectors[0] if vectors else []


class _CrossEncoderReranker:
    def __init__(self, model: Any) -> None:
        self.id = RERANKER_ID
        self._model = model

    async def score(self, query: str, passages: Sequence[str]) -> list[float]:
        if not passages:
            return []
        scores = await asyncio.to_thread(
            self._model.predict,
            [(query, passage) for passage in passages],
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [float(value) for value in scores.tolist()]


def _pooling_mode(module: Any) -> Any:
    """sentence-transformers 6 holds the mode as the `pooling_mode` attribute, a name or a tuple of
    names, and has no `get_pooling_mode_str()`; earlier versions answer through that method."""
    mode = getattr(module, "pooling_mode", None)
    return module.get_pooling_mode_str() if mode is None else mode


def _require_cls_pooling(model: Any, pooling_type: Any) -> None:
    """The embedder id claims `cls`; a snapshot pooling any other way is refused."""
    modes = [_pooling_mode(module) for module in model if isinstance(module, pooling_type)]
    if modes != ["cls"]:
        raise ServiceError(
            f"{EMBEDDING_MODEL} loaded with pooling {modes!r}, but its id {EMBEDDER_ID} claims cls"
        )


def _manifest_revision(cache_dir: Path, model_id: str) -> str:
    entry = read_manifest(cache_dir).get(model_id)
    if entry is None:
        raise ServiceError(
            f"the docs-retrieval model cache at {cache_dir} has no fetched weights for {model_id}: "
            "run harness-docs-retrieval fetch-models where an operator is present"
        )
    return entry.revision


def load_models(allow_remote: bool) -> tuple[Embedder, Reranker]:
    """The real models, fp32 on CPU. Without `allow_remote` each loads the manifest's revision from
    the local cache only."""
    try:
        import torch
        from sentence_transformers import CrossEncoder, SentenceTransformer
        from sentence_transformers.models import Pooling
    except ImportError as error:
        raise ServiceError(_MODELS_EXTRA_HINT) from error

    cache_dir = model_cache_dir()
    local_files_only = not allow_remote

    embedding_revision = None if allow_remote else _manifest_revision(cache_dir, EMBEDDING_MODEL)
    embedding_model = SentenceTransformer(
        EMBEDDING_MODEL,
        cache_folder=str(cache_dir),
        device="cpu",
        revision=embedding_revision,
        local_files_only=local_files_only,
    )
    _require_cls_pooling(embedding_model, Pooling)

    rerank_revision = None if allow_remote else _manifest_revision(cache_dir, RERANK_MODEL)
    # `activation_fn` is the sentence-transformers v4+ name; set explicitly because the id claims
    # sigmoid rather than leaning on the library's default for a one-label model.
    rerank_model = CrossEncoder(
        RERANK_MODEL,
        cache_folder=str(cache_dir),
        device="cpu",
        revision=rerank_revision,
        local_files_only=local_files_only,
        activation_fn=torch.nn.Sigmoid(),
    )

    return _SentenceTransformerEmbedder(embedding_model), _CrossEncoderReranker(rerank_model)


def _fetched_entry(cache_dir: Path, model_id: str) -> ManifestEntry:
    """The snapshot `refs/main` names, and every file under it, as `fetch_models` left them."""
    model_dir = hub_model_dir(cache_dir, model_id)
    try:
        revision = (model_dir / "refs" / "main").read_text(encoding="utf-8").strip()
    except OSError as error:
        raise ServiceError(
            f"fetch-models: {model_id} loaded but {model_dir}/refs/main is unreadable: {error}"
        ) from error
    snapshot = snapshot_dir(cache_dir, model_id, revision)
    files = sorted(
        path.relative_to(snapshot).as_posix() for path in snapshot.rglob("*") if path.is_file()
    )
    if not files:
        raise ServiceError(f"fetch-models: {model_id} snapshot {snapshot} holds no files")
    return ManifestEntry(revision=revision, files=tuple(files))


async def _warm_up(embedder: Embedder, reranker: Reranker) -> None:
    await embedder.embed_query("warm up")
    await reranker.score("warm up", ["warm up"])


def fetch_models() -> None:
    """The one place a download is allowed: load both models remotely, run each once, and record
    what was downloaded in the manifest."""
    embedder, reranker = load_models(allow_remote=True)
    asyncio.run(_warm_up(embedder, reranker))
    cache_dir = model_cache_dir()
    entries = {model_id: _fetched_entry(cache_dir, model_id) for model_id in MODEL_IDS}
    write_manifest(cache_dir, entries)
