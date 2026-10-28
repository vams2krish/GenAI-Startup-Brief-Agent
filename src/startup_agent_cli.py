from __future__ import annotations

import argparse

from dotenv import load_dotenv
from loguru import logger

from agent import build_agent
from startup_prompt import get_startup_prompt_template


def main() -> None:
    parser = argparse.ArgumentParser(description="Startup ideation agent")
    parser.add_argument("--idea", type=str, required=True, help="Startup idea / concept")
    model_choices = [
        "llama3.2:latest",
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

    prompt = get_startup_prompt_template().render(idea=args.idea)

    logger.info("startup_brief | model={} | idea_len={}", args.model, len(args.idea))

    result = executor.invoke(prompt)

    # Our runnable may return dict or a raw response depending on LangChain version.

    if isinstance(result, dict):
        output = result.get("output", result)
    else:
        output = result

    print(output)


if __name__ == "__main__":
    main()

