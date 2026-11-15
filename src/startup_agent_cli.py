from __future__ import annotations

import argparse

from dotenv import load_dotenv
from loguru import logger

from agent import _LocalAgentStub, build_agent, response_text
from startup_prompt import get_startup_prompt_template


def main() -> None:
    parser = argparse.ArgumentParser(description="Startup ideation agent")
    parser.add_argument("--idea", type=str, required=True, help="Startup idea / concept")
    model_choices = [
        "llama3.2:latest",
        "qwen2.5:0.5b",
        "minimax-m2.5:cloud",
        "kimi-k2.5:cloud",
    ]
    parser.add_argument(
        "--model",
        type=str,
        default="llama3.2:latest",
        choices=model_choices,
        help="Ollama model",
    )


    args = parser.parse_args()

    load_dotenv()

    try:
        executor = build_agent(model_name=args.model)
    except RuntimeError as e:
        logger.error("startup_agent_failed | {}", str(e).replace("\n", " | "))
        raise

    if isinstance(executor, _LocalAgentStub):
        parser.exit(1, "Install the Python runtime requirements to generate a brief.\n")

    prompt = get_startup_prompt_template().render(idea=args.idea)

    logger.info("startup_brief | model={} | idea_len={}", args.model, len(args.idea))

    result = executor.invoke(prompt)

    print(response_text(result))


if __name__ == "__main__":
    main()
