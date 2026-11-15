from __future__ import annotations

import argparse
from dotenv import load_dotenv
from agent import build_agent, response_text


def main() -> None:
    parser = argparse.ArgumentParser(description="Chat with an Ollama model")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--prompt")
    mode.add_argument("--interactive", action="store_true")
    parser.add_argument("--model", default="llama3.2:latest")
    args = parser.parse_args()
    load_dotenv()
    agent = build_agent(model_name=args.model)
    if args.prompt is not None:
        print(response_text(agent.invoke(args.prompt)))
        return
    history: list[str] = []
    print("LangChain Agent Chat. Type 'exit' to quit.")
    while True:
        try:
            prompt = input("You> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if prompt.lower() in {"exit", "quit"}:
            break
        if not prompt:
            continue
        context = "\n".join([*history[-12:], f"User: {prompt}"])
        answer = response_text(agent.invoke(context))
        history.extend([f"User: {prompt}", f"Assistant: {answer}"])
        print(f"Assistant> {answer}")


if __name__ == "__main__":
    main()
