# Startup Agent UI

Install dependencies from the repository root:

```powershell
npm --prefix ui ci
```

Create the Python virtual environment and install runtime requirements as described in the root README. Ensure Ollama is running and the selected model is available.

Start from the repository root:

```powershell
node ui/server.js
```

Open http://localhost:3000. The server invokes `.venv/Scripts/python.exe` with `src/startup_agent_cli.py`. It resolves both paths relative to the current working directory, so do not start it inside `ui`. The current launcher expects Windows and does not implement a system-Python fallback.

See the root README for configuration, architecture, and current limitations.
