import { tavily } from '@tavily/core';

const groups = [
  ['Customer demand, pain points, buyer personas and evidence from surveys', 'problem'],
  ['Market size TAM SAM SOM, industry trends, official industry statistics and geography', 'market'],
  ['Direct and indirect competitors, alternatives, product features and pricing', 'competition'],
  ['Go-to-market channels, business models, pricing benchmarks, operating costs and retention', 'business'],
  ['Industry risks, regulation, and documented acquisitions or exits', 'risk'],
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Use POST.'});
  const {idea, extra = ''} = req.body ?? {};
  if (typeof idea !== 'string' || !idea.trim() || idea.length > 3000 || typeof extra !== 'string' || extra.length > 2000) {
    return res.status(400).json({error:'Enter an idea and stay within the form limits.'});
  }
  const concept = [idea.trim(), extra.trim()].filter(Boolean).join(' · ').replace(/\s+/g,' ').slice(0,280);
  try {
    const client = tavily();
    const results = await Promise.allSettled(groups.map(async ([topic,key]) => {
      const response = await client.search(concept + ' — ' + topic, {maxResults:4, includeAnswer:true});
      const sources = (response.results ?? []).filter(item => /^https?:\/\//i.test(item.url));
      if (!sources.length) throw new Error('No sources');
      return [key,{answer:response.answer?.trim() || 'Review these search results for evidence.',sources}];
    }));
    const evidence = Object.fromEntries(results.filter(result => result.status === 'fulfilled').map(result => result.value));
    if (!Object.keys(evidence).length) return res.status(503).json({error:'Live search is unavailable or rate limited. Please try again later.'});
    const sources = [...new Map(Object.values(evidence).flatMap(group => group.sources).map(source => [source.url,source])).values()];
    const withSources = key => {
      const group = evidence[key];
      if (!group) return 'Search evidence was unavailable for this topic.';
      const refs = group.sources.map(source => sources.findIndex(item => item.url === source.url) + 1);
      return group.answer + '\n\nSearch sources for this topic: ' + refs.map(ref => '[' + ref + ']').join(' ');
    };
    const sections = [
      ['Executive summary', 'Research brief for: ' + idea.trim() + '\n\n' + withSources('problem')],
      ['Startup idea', idea.trim() + (extra.trim() ? '\n\nContext: ' + extra.trim() : '')],
      ['Problem statement', withSources('problem')],
      ['Target customers and personas', 'Hypothesis to validate: distinguish the daily user from the buyer and start with one segment.\n\n' + withSources('problem')],
      ['Market research and TAM / SAM / SOM', withSources('market') + '\n\nEstimate TAM from eligible buyers × defensible annual spend, SAM from the geography and segment you can serve, and SOM from realistic acquisition capacity. Verify the population and spend inputs before publishing figures.'],
      ['Competitive landscape', withSources('competition')],
      ['Differentiation and moat', 'Compare alternatives on the same customer task. Test whether a meaningful improvement in time, cost, or reliability changes switching behavior.\n\n' + withSources('competition')],
      ['Product and solution', 'Pilot hypothesis: deliver the core outcome manually for a narrow customer segment, then automate the most repeated steps. Score task success and time to value.'],
      ['Business Model Canvas', 'Working hypotheses for nine blocks: choose one customer segment, define the value proposition, select acquisition channels, specify customer relationships, test revenue streams, identify key resources, list key activities, identify partners, and estimate cost structure.\n\n' + withSources('business')],
      ['Monetization strategy', withSources('business') + '\n\nTest willingness to pay in a pilot before relying on public price benchmarks.'],
      ['Go-to-market strategy', withSources('business') + '\n\nTest one channel first and track qualified leads through conversion and renewal.'],
      ['Metrics and milestones', 'Proposed milestones: establish a baseline, run paid pilots, then measure activation, conversion, repeat usage, retention, and acquisition cost. Set targets using pilot data.'],
      ['Three-year projections and sensitivity', 'Build Y1, Y2, and Y3 separately from opening customers, new customers, churn, and price. Revenue = average active customers × annual price. ARR = end-of-year active customers × annual recurring price. Gross margin = (revenue − direct costs) ÷ revenue. Run low/base/high scenarios for conversion, churn, and unit cost. Figures remain open until those inputs are verified.'],
      ['Risks and mitigations', withSources('risk') + '\n\nMap each material risk to an owner, mitigation, and validation step.'],
      ['Exit strategies', withSources('risk') + '\n\nTreat deal examples as context. Evaluate strategic fit, revenue durability, and buyer incentives before identifying plausible exit paths.'],
    ];
    const appendix = sources.map((source,index) => (index + 1) + '. ' + source.title + ' — ' + source.url).join('\n');
    const output = sections.map(([title,body]) => '## ' + title + '\n\n' + body).join('\n\n') + '\n\n## Sources\n\n' + appendix;
    return res.status(200).json({output, sources:sources.map(({title,url})=>({title,url})), partial:Object.keys(evidence).length < groups.length});
  } catch {
    return res.status(503).json({error:'Live search could not complete. Please try again.'});
  }
}
