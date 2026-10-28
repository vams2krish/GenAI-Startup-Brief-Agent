from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_PROMPT_PATH = Path(__file__).resolve().parent.parent / "agent_startup.yaml"


@dataclass(frozen=True)
class StartupPrompt:
    template: str

    @classmethod
    def load(cls, *, prompt_path: Path | None = None) -> "StartupPrompt":
        path = prompt_path or DEFAULT_PROMPT_PATH
        if not path.exists():
            return cls(template=_fallback_template())

        # Avoid adding a YAML dependency; parse the single field we need.
        # The file format is fixed by this repo.
        text = path.read_text(encoding="utf-8")
        marker = "startup_brainstorm_prompt: |"
        idx = text.find(marker)
        if idx == -1:
            return cls(template=_fallback_template())

        # Extract everything after marker up to end of file (trim leading newline).
        extracted = text[idx + len(marker) :]
        extracted = extracted.replace("\r\n", "\n")
        # Remove the first newline if present
        if extracted.startswith("\n"):
            extracted = extracted[1:]

        # Dedent 2 spaces if present
        lines = extracted.split("\n")
        lines = [ln[2:] if ln.startswith("  ") else ln for ln in lines]
        template = "\n".join(lines).rstrip() + "\n"
        return cls(template=template)

    def render(self, *, idea: str) -> str:
        return self.template.format(idea=idea)


def _fallback_template() -> str:
    return (
        "You are an experienced startup founder and venture analyst.\n"
        "Create a complete startup brief using the provided idea.\n\n"
        "Output sections:\n"
        "- Executive summary\n"
        "- Problem statement\n"
        "- Market research\n"
        "- Competition\n"
        "- Business Model Canvas\n"
        "- Monetization\n"
        "- Financial projections (3 years)\n"
        "- Exit strategies\n\n"
        "Idea:\n{idea}\n"
    )


def get_startup_prompt_template() -> StartupPrompt:
    return StartupPrompt.load()

