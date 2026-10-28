import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// Serve UI
app.use(express.static(path.join(__dirname)));
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/startup-brief', async (req, res) => {
  const { idea, extra, model } = req.body || {};

  if (!idea || !String(idea).trim()) {
    res.status(400).json({ error: 'Missing idea' });
    return;
  }

  const mergedIdea = [String(idea).trim(), String(extra || '').trim()]
    .filter(Boolean)
    .join('\n\nExtra details:\n');

  // Resolve repo root when started from `langchain-agent-chat/`.
  const repoRoot = process.cwd();

  // Prefer a project-local venv, but fall back to system python.
  // - Expected: <repoRoot>/.venv/Scripts/python.exe
  // - Fallback: `python` (should be on PATH)
  const localPython = path.join(repoRoot, '.venv', 'Scripts', 'python.exe');

  const PYTHON_EXEC = localPython;
  const startupCliPath = path.join(repoRoot, 'src', 'startup_agent_cli.py');





  const py = spawn(
    PYTHON_EXEC,
    [startupCliPath, '--idea', mergedIdea, '--model', model || 'llama3.2:latest'],
    {
      windowsHide: true,
      cwd: repoRoot,
    }
  );




  let stdout = '';
  let stderr = '';

  py.stdout.on('data', (d) => {
    stdout += d.toString('utf8');
  });

  py.stderr.on('data', (d) => {
    stderr += d.toString('utf8');
  });

  py.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ error: stderr || `Python exited with code ${code}` });
      return;
    }
    res.json({ output: stdout.trim() });
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`UI running: http://localhost:${port}`);
});

