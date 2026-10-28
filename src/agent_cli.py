from __future__ import annotations

import argparse
from typing import List

from dotenv import load_dotenv
from loguru import logger

from agent import build_agent


def run_interactive(executor, *, model_name: str) -> None:
    chat_history: List = []

    print("LangChain Agent Chat. Type 'exit' to quit.\n")

    while True:
        user_input = input("You> ").strip()
        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            break

        logger.info("prompt_received | model={} | prompt={}", model_name, user_input)

        # The current agent implementation is a Runnable bound with tools.
        # It expects raw input text rather than a dict payload.
        result = executor.invoke(user_input)


        # AgentExecutor returns something like {"output": "..."}
        output = result.get("output", result)

        print(f"Assistant> {output}\n")

        # Minimal chat history accumulation: store the last exchange.
        chat_history.append(("user", user_input))
        chat_history.append(("assistant", output))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", type=str, default=None)
    parser.add_argument("--interactive", action="store_true")
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

    executor = build_agent(model_name=args.model)

    if args.interactive:

        run_interactive(executor, model_name=args.model)
        return

    if args.prompt:
        logger.info("single_shot | model={} | prompt={}", args.model, args.prompt)
        result = executor.invoke(args.prompt)
        output = result.get("output", result) if isinstance(result, dict) else result

        print(output)
        return

    parser.error("Provide --prompt or use --interactive")


if __name__ == "__main__":
    main()

