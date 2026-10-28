from __future__ import annotations

try:
    from loguru import logger  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("langchain-agent-chat")


try:
    from langchain_core.prompts import ChatPromptTemplate  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    ChatPromptTemplate = None  # type: ignore

# Ollama-compatible models via local HTTP endpoint (e.g., http://localhost:11434)
# Requires: pip install langchain-ollama
try:
    from langchain_ollama import ChatOllama  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    ChatOllama = None  # type: ignore



def _validate_ollama_model_exists(*, model_name: str) -> None:
    """Fail fast with a clear message if the requested Ollama model is missing.

    Validation can be disabled via env var:
      - SKIP_OLLAMA_MODEL_VALIDATION=1
    """
    import os
    import time

    if os.getenv("SKIP_OLLAMA_MODEL_VALIDATION", "").strip().lower() in {"1", "true", "yes", "on"}:
        logger.warning(
            "skip_ollama_model_validation | model=%s | reason=SKIP_OLLAMA_MODEL_VALIDATION enabled",
            model_name,
        )
        return

    try:
        from ollama import Client  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "Ollama python client is not available. Install requirements for Ollama support."
        ) from e

    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434").strip()
    # The Python client accepts host like: Client(host="http://localhost:11434")
    client = Client(host=ollama_host)  # type: ignore[arg-type]

    last_exc: Exception | None = None
    attempts = int(os.getenv("OLLAMA_MODEL_LIST_RETRIES", "5"))
    sleep_s = float(os.getenv("OLLAMA_MODEL_LIST_RETRY_SLEEP_SECONDS", "1"))

    models_resp = None
    for i in range(attempts):
        try:
            models_resp = client.list()  # typically: {"models": [{"name": ...}, ...]}
            break
        except Exception as e:
            last_exc = e
            if i < attempts - 1:
                time.sleep(sleep_s)

    if models_resp is None:
        raise RuntimeError(
            "Failed to connect to Ollama. Ensure Ollama is running and accessible.\n\n"
            f"Host: {ollama_host}\n"
            "Original error: " + str(last_exc)
        ) from last_exc

    existing_names = set()
    for m in models_resp.get("models", []):
        name = m.get("name")
        if name:
            existing_names.add(name)

    available = sorted(existing_names)

    # If Ollama is reachable but has no models, message should explain that
    # the user likely hasn't pulled anything yet (or Ollama is pointing at a different instance).
    if not available:
        raise RuntimeError(
            "Ollama returned zero models on this instance.\n\n"
            f"Requested model: '{model_name}'\n\n"
            f"Effective host: {ollama_host}\n\n"
            "To fix:\n"
            f"- Ensure Ollama is running and accessible at the configured host (OLLAMA_HOST={ollama_host})\n"
            f"- Run: 'ollama pull {model_name}'\n"
            "- If you use a remote Ollama, set the correct host (e.g., OLLAMA_HOST) and retry.\n"
            "- If you want to bypass validation (not recommended), set SKIP_OLLAMA_MODEL_VALIDATION=1."
        )

    if model_name not in existing_names:
        available_str = ", ".join(available[:10]) + ("..." if len(available) > 10 else "")
        raise RuntimeError(
            f"Ollama model not found: '{model_name}'.\n\n"
            f"Effective host: {ollama_host}\n"
            f"Available models: {available_str}\n\n"
            "To fix:\n"
            f"- Run: 'ollama pull {model_name}'\n"
            f"- Or choose one of the available models."
        )


class _LocalAgentStub:
    def invoke(self, prompt: str) -> dict:
        # Deterministic stub output for environments without LangChain.
        return {"output": f"[stub] {prompt}"}


def build_agent(*, model_name: str = "llama3.2:latest") -> object:
    """Create an Ollama-backed chat model runnable.

    This function is expected to work in two modes:
    - Full mode: LangChain + Ollama available.
    - Stub mode: dependencies missing; returns a deterministic runnable stub.
    """

    if ChatPromptTemplate is None or ChatOllama is None:
        logger.warning(
            "langchain dependencies missing; returning local stub (model=%s)",
            model_name,
        )

        return _LocalAgentStub()

    _validate_ollama_model_exists(model_name=model_name)

    llm = ChatOllama(model=model_name, temperature=0)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant. Answer the user as best you can.",
            ),
            ("human", "{input}"),
        ]
    )

    # Runnable composition: prompt -> llm
    executor = prompt | llm

    logger.debug("Agent built with model={}", model_name)
    return executor










