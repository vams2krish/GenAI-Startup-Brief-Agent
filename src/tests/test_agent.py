from __future__ import annotations

from src.agent import build_agent


def test_agent_builds_without_calling_model(monkeypatch):
    # Unit tests must not require a live Ollama server.
    # Patch the internal model validation helper to bypass network calls.
    from src import agent as agent_module

    monkeypatch.setattr(agent_module, "_validate_ollama_model_exists", lambda *, model_name: None)

    executor = build_agent(model_name="llama3.2:latest")
    assert executor is not None



