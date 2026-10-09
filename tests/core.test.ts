import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMiroFishSwarm } from '../lib/personas.ts';
import { MiroFishSimulationEngine } from '../lib/graph-engine.ts';
import { SAMPLES, suggestCopy, validateCopy } from '../lib/site.ts';
import { publicAddress, parsePublicUrl, extractCopy, scrapeWebsite } from '../lib/scraper.ts';
function engine() { const { nodes, edges } = generateMiroFishSwarm(50); return new MiroFishSimulationEngine(nodes, edges); }

test('same input yields identical outcomes and a monotonic funnel', () => {
  for (const sample of SAMPLES) {
    const a = engine().evaluateCopy(sample);
    assert.deepEqual(a, engine().evaluateCopy(sample));
    const stages = Object.values(a.stageStats);
    assert.ok(stages.every((x, i) => x >= 0 && x <= 100 && (i === 0 || x <= stages[i - 1])));
    assert.equal(a.converted + a.bounced, a.total);
    assert.equal(Object.values(a.clusters).reduce((sum, cluster) => sum + cluster.count, 0), 50);
  }
});
test('content changes results without a forced optimization boost', () => {
  const clear = { headline: 'Send invoices and track payments', subhead: 'Create invoices and manage payments in one place.', pricing: 'Free', cta: 'Get started' };
  const vague = { ...SAMPLES[0], pricing: '$999 billed annually' };
  assert.ok(engine().evaluateCopy(clear).conversionPct > engine().evaluateCopy(vague).conversionPct);
  assert.ok(engine().evaluateCopy({ ...clear, pricing: '$999 billed annually' }).conversionPct < engine().evaluateCopy(clear).conversionPct);
});
test('suggestions preserve prices and avoid manufactured promises', () => {
  const revised = suggestCopy(SAMPLES[0]);
  assert.equal(revised.pricing, SAMPLES[0].pricing);
  assert.ok(!/orchestration|primitives|synergize/i.test(revised.headline + revised.subhead));
  assert.ok(!/14.day|3x|60 seconds/i.test(JSON.stringify(revised)));
});
test('archetypes cover all 16 roles and graph links remain valid', () => {
  const { nodes, edges } = generateMiroFishSwarm(50);
  assert.equal(new Set(nodes.map(n => n.role)).size, 16);
  assert.ok(edges.every(edge => nodes.some(n => n.id === edge.source) && nodes.some(n => n.id === edge.target)));
  const model = engine(); model.evaluateCopy(SAMPLES[0]);
  for (let i = 0; i < 100; i++) model.tickPhysics();
  assert.ok(model.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y) && n.x >= 24 && n.x <= 696));
  model.evaluateCopy(SAMPLES[2]); assert.equal(model.messages.length, 18);
});
test('public URL guard blocks local, reserved and mapped IPv6 addresses', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.2.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1']) assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress('93.184.216.34'), true);
  for (const url of ['file:///etc/passwd', 'http://localhost', 'https://user:pass@example.com', 'http://example.com:8080']) assert.throws(() => parsePublicUrl(url));
  await assert.rejects(scrapeWebsite('http://127.0.0.1'), /Private|reserved/);
});
test('extracts source copy without executing markup', () => {
  const site = extractCopy('<html><head><title>Fallback</title><meta name="description" content="Simple invoices"></head><body><h1>Invoices for teams</h1><script>steal()</script><p>$29 per month</p><button>Get started</button></body></html>', 'https://example.com');
  assert.equal(site.headline, 'Invoices for teams'); assert.equal(site.pricing, '$29 per month'); assert.equal(site.cta, 'Get started');
  assert.throws(() => extractCopy('<script>hello</script>', 'https://example.com'), /No readable/);
  assert.throws(() => validateCopy({ headline: '', subhead: '', pricing: '', cta: '' }), /required/);
});

test('JSON intake bounds streaming requests and reports malformed data', async () => {
  const { readJson } = await import('../lib/request.ts');
  assert.deepEqual(await readJson(new Request('http://test', { method: 'POST', body: '{"a":1}' }), 50), { a: 1 });
  await assert.rejects(readJson(new Request('http://test', { method: 'POST', body: 'invalid' }), 50), /valid JSON/);
  await assert.rejects(readJson(new Request('http://test', { method: 'POST', body: 'x'.repeat(100) }), 50), /size limit/);
});

test('deep semantic extractor generates rich ProductKnowledgeManifest with tiers and features', () => {
  const richHtml = `
    <html>
      <head>
        <title>ApexFlow - AI Automation Platform</title>
        <meta name="description" content="Automate enterprise workflows with generative AI.">
        <script type="application/ld+json">
          {
            "@type": "SoftwareApplication",
            "name": "ApexFlow Enterprise",
            "offers": { "price": "99", "priceCurrency": "$" }
          }
        </script>
      </head>
      <body>
        <main>
          <h1>Automate enterprise workflows with generative AI</h1>
          <p>The leading AI workflow platform for modern teams.</p>
          <div class="pricing-card">
            <h3>Pro Tier</h3>
            <p>$49/mo</p>
            <ul><li>Unlimited workflows</li><li>Dedicated support</li></ul>
          </div>
          <section class="features">
            <h3>Real-time orchestration</h3>
            <h3>Zero-code connectors</h3>
          </section>
          <details><summary>Is there a free trial?</summary><p>Yes, 14 days free.</p></details>
          <button>Get started free</button>
        </main>
      </body>
    </html>
  `;
  const result = extractCopy(richHtml, 'https://apexflow.io');
  assert.equal(result.headline, 'Automate enterprise workflows with generative AI');
  assert.ok(result.manifest);
  assert.equal(result.manifest.brandName, 'ApexFlow');
  assert.ok(result.manifest.pricing.tiers.length >= 1);
  assert.ok(result.manifest.features.length >= 1);
  assert.ok(result.manifest.faqs.length >= 1);
});

test('getDynamicWebsiteQuestions creates dynamic, URL-tailored questions instead of generic hardcoded ones', async () => {
  const { getDynamicWebsiteQuestions, getPersonaSpecificQuestions } = await import('../lib/questions.ts');

  // Test 1: Developer/CLI website
  const cliSite = {
    url: 'https://cli.acme.tools/docs',
    headline: 'Fastest CLI for Kubernetes deployments',
    subhead: 'Instant terminal deployments for modern clusters',
    pricing: 'Free open source',
    cta: 'Install via curl'
  };
  const cliQuestions = getDynamicWebsiteQuestions(cliSite);
  assert.equal(cliQuestions.length, 4);
  assert.ok(cliQuestions.some(q => q.includes('Fastest CLI for Kubernetes deployments')));
  assert.ok(cliQuestions.some(q => q.toLowerCase().includes('cli') || q.toLowerCase().includes('developer')));
  assert.ok(cliQuestions.some(q => q.includes('Install via curl')));

  // Test 2: High-ticket B2B SaaS without upfront pricing
  const b2bSite = {
    url: 'https://enterprise-ai.co',
    headline: 'Autonomous Sales Agents for Fortune 500',
    subhead: 'Enterprise revenue acceleration platform',
    pricing: 'Not disclosed',
    cta: 'Book Demo'
  };
  const b2bQuestions = getDynamicWebsiteQuestions(b2bSite);
  assert.equal(b2bQuestions.length, 4);
  assert.ok(b2bQuestions.some(q => q.includes('Autonomous Sales Agents for Fortune 500')));
  assert.ok(b2bQuestions.some(q => q.toLowerCase().includes('pricing') || q.toLowerCase().includes('transparent')));
  assert.ok(b2bQuestions.some(q => q.includes('Book Demo')));

  // Test 3: 1-on-1 Persona Specific Questions
  const mockBouncedAgent = {
    id: 'agent-1',
    name: 'Skeptical CTO Susan',
    role: 'CTO',
    status: 'BOUNCED' as const,
    bias: 'Tech debt & Security',
    budget: '$50,000/yr',
    painPoint: 'Vendor lock-in',
    currentStack: 'AWS',
    quote: 'Too risky'
  };
  const bouncedQuestions = getPersonaSpecificQuestions(mockBouncedAgent as any, cliSite);
  assert.equal(bouncedQuestions.length, 4);
  assert.ok(bouncedQuestions[0].includes('bounce'));
  assert.ok(bouncedQuestions.some(q => q.includes('Install via curl') || q.includes('CLI')));

  const mockConvertedAgent = {
    ...mockBouncedAgent,
    name: 'Early Adopter Alex',
    status: 'CONVERTED' as const
  };
  const convertedQuestions = getPersonaSpecificQuestions(mockConvertedAgent as any, cliSite);
  assert.equal(convertedQuestions.length, 4);
  assert.ok(convertedQuestions[0].includes('convert'));
});


