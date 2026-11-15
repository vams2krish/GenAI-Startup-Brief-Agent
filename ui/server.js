import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const bundled = path.join(root, '.venv', ... (process.platform === 'win32' ? ['Scripts','python.exe'] : ['bin','python']));
const python = process.env.PYTHON_EXEC || (existsSync(bundled) ? bundled : process.platform === 'win32' ? 'python' : 'python3');
const models = ['llama3.2:latest','qwen2.5:0.5b','minimax-m2.5:cloud','kimi-k2.5:cloud'];
const app = express();
app.use(express.json({limit:'32kb'}));
app.use(express.static(path.join(here,'public')));
app.get('/api/config', (_, res) => res.json({models}));
app.post('/api/startup-brief', (req,res) => {
  const {idea, extra = '', model = models[0]} = req.body ?? {};
  if (typeof idea !== 'string' || !idea.trim() || idea.length > 3000 || typeof extra !== 'string' || extra.length > 2000 || !models.includes(model)) {
    return res.status(400).json({error:'Enter a startup idea of up to 3,000 characters and choose an available model.'});
  }
  const input = [idea.trim(), extra.trim() && 'Additional context:\n' + extra.trim()].filter(Boolean).join('\n\n');
  execFile(python,['-X','utf8',path.join(root,'src','startup_agent_cli.py'),'--model',model,'--idea='+input],{cwd:root,windowsHide:true,timeout:180000,maxBuffer:1024*1024},(error, stdout) => {
    if (error) return res.status(error.killed ? 504 : 502).json({error:error.killed ? 'Generation timed out. Try a smaller model.' : 'Generation failed. Check that Ollama is running, the model is installed, and Python requirements are installed.'});
    if (!stdout.trim()) return res.status(502).json({error:'The model returned an empty brief. Please retry.'});
    res.json({output:stdout.trim()});
  });
});
app.use((error,req,res,next) => res.status(error.status === 413 ? 413 : 400).json({error:'The request is too large or contains invalid JSON.'}));
app.listen(Number(process.env.PORT || 3000),'127.0.0.1', () => console.log('Startup Brief Studio running on http://127.0.0.1:' + (process.env.PORT || 3000)));
