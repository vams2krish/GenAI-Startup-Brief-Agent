const el = id => document.getElementById(id);
const idea = el('idea'), extra = el('extra'), status = el('status');
let brief = '', local = false;
const count = () => el('count').textContent = idea.value.length.toLocaleString('en-US') + ' / 3,000';
idea.addEventListener('input',count);
const examples = {
  starter: ['A scheduling assistant for independent fitness coaches.',
    'Start with solo coaches who use spreadsheets. Test a paid pilot before building integrations.'],
  airbnb: ['An event-stay marketplace matching local hosts with conference attendees.',
    'Start with one neighborhood and one event. Arrange the first bookings manually and track repeat interest from hosts and guests. Inspired by Airbnb’s first hosted stays.'],
  buffer: ['A social post scheduler for independent creators who publish in batches.',
    'Test interest with a landing page that describes the workflow and shows a paid plan. Invite visitors to a pilot before building integrations. Inspired by Buffer’s early landing-page test.']
};
function loadExample(key) {
  const example = examples[key];
  if (!example) return;
  if ((idea.value.trim() || extra.value.trim()) &&
      !examplesMatchDraft() && !window.confirm('Replace your current idea and context with this example?')) return;
  [idea.value, extra.value] = example;
  count();
  el('error').hidden = true;
  idea.focus({preventScroll:true});
  el('workspace').scrollIntoView({block:'start'});
}
function examplesMatchDraft() {
  return Object.values(examples).some(([input, notes]) => idea.value === input && extra.value === notes);
}
el('example').onclick = () => loadExample('starter');
for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => loadExample(button.dataset.example));
}

const configReady = fetch('./api/config',{signal:AbortSignal.timeout(2500)}).then(async response => {
  if (!response.ok) return;
  const {models} = await response.json();
  if (!Array.isArray(models) || !models.length) return;
  for (const model of models) el('model').append(new Option(model,model));
  local = true;
  el('model-field').hidden = false;
  el('mode').textContent = '◉ Local Ollama';
  el('note').textContent = 'Uses your selected model through Ollama.';
}).catch(() => {});
function show(output) {
  const article = el('result'), fragment = document.createDocumentFragment();
  for (const block of output.split(/\r?\n\s*\r?\n/)) {
    for (const segment of block.split(/\r?\n(?=#{1,6}\s)/)) {
      const [first,...rest] = segment.split(/\r?\n/);
      const heading = first.match(/^#{1,6}\s+(.+)/);
      if (heading) {
        const h = document.createElement('h3');
        h.textContent = heading[1];
        fragment.append(h);
      }
      const p = document.createElement('p');
      const lines = heading ? rest : [first,...rest];
      for (const [index,line] of lines.entries()) {
        if (index) p.append('\n');
        const link = line.match(/^(\d+\. .+ — )(https?:\/\/\S+)$/i);
        if (!link) { p.append(line); continue; }
        const anchor = document.createElement('a');
        anchor.href = link[2];
        anchor.textContent = link[2];
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        p.append(link[1],anchor);
      }
      if (p.textContent) fragment.append(p);
    }
  }
  article.replaceChildren(fragment);
  article.hidden = el('actions').hidden = false;
  el('empty').hidden = true;
}
el('form').onsubmit = async event => {
  event.preventDefault();
  if (el('generate').disabled) return;
  const input = idea.value.trim(), notes = extra.value.trim();
  el('error').hidden = true;
  if (!input) {
    el('error').textContent = 'Enter a startup idea to continue.';
    el('error').hidden = false;
    idea.focus();
    return;
  }
  el('generate').disabled = true;
  status.textContent = 'Preparing your brief…';
  try {
    await configReady;
    if (local) {
      status.textContent = 'Generating with Ollama…';
      const response = await fetch('./api/startup-brief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idea:input,extra:notes,model:el('model').value}),signal:AbortSignal.timeout(185000)});
      const data = await response.json();
      if (!response.ok || typeof data.output !== 'string') throw new Error(data.error || 'Generation failed. Please retry.');
      brief = data.output;
    } else {
      status.textContent = 'Searching the web and compiling your brief…';
      const response = await fetch('./api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idea:input,extra:notes}),signal:AbortSignal.timeout(60000)});
      const data = await response.json();
      if (!response.ok || typeof data.output !== 'string') throw new Error(data.error || 'Live research failed.');
      brief = data.output;
      status.textContent = data.partial ? 'Research brief ready · Some topics have limited evidence' : 'Live research brief · Ready for review';
    }
    show(brief);
    if (local) status.textContent = 'Model-generated draft · Ready for review';
  } catch (error) {
    el('error').textContent = error.name === 'TimeoutError' ? 'Generation timed out. Try a smaller model.' : error.message;
    el('error').hidden = false;
    status.textContent = brief ? 'Showing the previous brief.' : 'Your brief could not be generated.';
  } finally { el('generate').disabled = false; }
};
el('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(brief); status.textContent = 'Brief copied to clipboard.'; }
  catch { status.textContent = 'Clipboard unavailable. Use Download .md instead.'; }
};
el('download').onclick = () => {
  const url = URL.createObjectURL(new Blob([brief],{type:'text/markdown;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'startup-brief.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  status.textContent = 'Markdown download started.';
};
