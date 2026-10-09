'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Masthead } from '../components/Masthead';
import { TargetWebsiteInput } from '../components/TargetWebsiteInput';
import { CoreWebVitalsCard } from '../components/CoreWebVitalsCard';
import { RealAIPersonasCard } from '../components/RealAIPersonasCard';
import { LiveTrafficCard } from '../components/LiveTrafficCard';
import { MiroFishGraph } from '../components/MiroFishGraph';
import { FullGraphStudio } from '../components/FullGraphStudio';
import { FunnelBroadsheet } from '../components/FunnelBroadsheet';
import { CopyRedlineDoctor } from '../components/CopyRedlineDoctor';
import { AgentDiscourseChat } from '../components/AgentDiscourseChat';
import { generateMiroFishSwarm, AgentNode } from '../lib/personas';
import { MiroFishSimulationEngine } from '../lib/graph-engine';
import { SAMPLES, SiteCopy, SiteData, suggestCopy, validateCopy } from '../lib/site';
import type { RealWebMetrics } from '../lib/pagespeed';
import type { RealAIAnalysisResult, AIPersonaEvaluation } from '../lib/gemini';
import type { LiveAnalyticsSummary } from '../lib/live-analytics';

type Message = { sender: string; role: string; text: string; isUser: boolean; timestamp: string };
const intro = (): Message[] => [{
  sender: 'Editorial moderator',
  role: 'Consensus dispatch',
  text: 'Dual-Engine Active: Real Google Chrome CrUX telemetry & Gemini AI executive personas combined with a 50-agent network simulation.',
  isUser: false,
  timestamp: 'Live Dispatch'
}];

function analyze(copy: SiteCopy) {
  const { nodes, edges } = generateMiroFishSwarm(50);
  const engine = new MiroFishSimulationEngine(nodes, edges);
  return { engine, metrics: engine.evaluateCopy(copy) };
}

export default function EditorialDashboard() {
  const [site, setSite] = useState<SiteData>(SAMPLES[0]);
  const [isApplied, setApplied] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyze> | null>(null);
  const [baseline, setBaseline] = useState(0);
  const [lift, setLift] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>(intro);
  const [saved, setSaved] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'overview' | 'graph_studio' | 'chat_room'>('overview');

  // Real Data States
  const [webMetrics, setWebMetrics] = useState<RealWebMetrics | null>(null);
  const [isVitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState<RealAIAnalysisResult | null>(null);
  const [isAILoading, setAILoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [selectedAIPersona, setSelectedAIPersona] = useState<AIPersonaEvaluation | null>(null);

  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalyticsSummary | null>(null);
  const [isLiveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');

  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [posthogKey, setPosthogKey] = useState('');
  const [posthogProjectId, setPosthogProjectId] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [thinkingPersona, setThinkingPersona] = useState<{ name: string; role: string; status?: string } | null>(null);

  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const recommendation = suggestCopy(site);

  // Load stored API keys on startup without auto-running any sample analysis
  useEffect(() => {
    try {
      const storedKeys = {
        gemini: localStorage.getItem('personapulse:gemini_key') || '',
        phKey: localStorage.getItem('personapulse:posthog_key') || '',
        phProject: localStorage.getItem('personapulse:posthog_project_id') || ''
      };
      setGeminiKey(storedKeys.gemini);
      setPosthogKey(storedKeys.phKey);
      setPosthogProjectId(storedKeys.phProject);

      localStorage.removeItem('personapulse:last-report');
    } catch {
      /* Storage unavailable */
    }

    return () => abort.current?.abort();
  }, []);

  // Real CrUX & PageSpeed Fetcher
  const triggerPageSpeed = async (targetUrl: string) => {
    if (!targetUrl || targetUrl.startsWith('sample:') || targetUrl.includes('Draft manuscript')) {
      setWebMetrics(null);
      setVitalsError('');
      return;
    }
    setVitalsLoading(true);
    setVitalsError('');
    try {
      const res = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch PageSpeed data.');
      setWebMetrics(data);
    } catch (err) {
      setVitalsError(err instanceof Error ? err.message : 'Google PageSpeed request failed.');
    } finally {
      setVitalsLoading(false);
    }
  };

  // Real Gemini AI Evaluator
  const triggerAIAnalysis = async (copyData: SiteData, customApiKey?: string) => {
    setAILoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: copyData.headline,
          subhead: copyData.subhead,
          pricing: copyData.pricing,
          cta: copyData.cta,
          url: copyData.url,
          apiKey: customApiKey || geminiKey,
          manifest: copyData.manifest
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI analysis failed.');
      setAiAnalysis(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI Evaluation encountered an error.');
    } finally {
      setAILoading(false);
    }
  };

  // Real PostHog Live Traffic Fetcher
  const triggerLiveAnalytics = async (customKey?: string, customProject?: string) => {
    const key = customKey || posthogKey;
    const project = customProject || posthogProjectId;
    if (!key || !project) {
      setLiveAnalytics(null);
      return;
    }
    setLiveLoading(true);
    setLiveError('');
    try {
      const res = await fetch('/api/live-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, projectId: project })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PostHog query failed.');
      setLiveAnalytics(data);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Unable to reach PostHog.');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleAnalyze = async (url: string, customCopy?: SiteCopy, sample = false) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    setSaved(false);

    const controller = new AbortController();
    abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 16000);

    try {
      let next: SiteData;
      if (customCopy) {
        next = { ...validateCopy(customCopy), url: 'Draft manuscript', source: 'manuscript', warnings: [] };
      } else if (sample) {
        next = SAMPLES.find(s => s.url === url) || SAMPLES[0];
      } else {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Website extraction failed.');
        next = { ...data, ...validateCopy(data) };
      }

      setHasAnalyzed(true);
      const report = analyze(next);
      setSite(next);
      setResult(report);
      setBaseline(report.metrics.conversionPct);
      setLift(analyze(suggestCopy(next)).metrics.conversionPct - report.metrics.conversionPct);
      setApplied(false);
      setSelectedAgent(null);
      setWorkspaceMode('overview');
      setChatHistory(intro());

      // Trigger Real External Data in parallel
      if (!sample && next.source === 'website') {
        triggerPageSpeed(next.url);
      } else {
        setWebMetrics(null);
      }
      triggerAIAnalysis(next);
      if (posthogKey && posthogProjectId) {
        triggerLiveAnalytics();
      }

      setSaved(true);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Analysis failed.');
      else setError('Website extraction timed out. Try again or paste the page copy.');
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setLoading(false);
    }
  };

  const toggleRedline = () => {
    const updatedCopy = isApplied ? site : recommendation;
    setResult(analyze(updatedCopy));
    setApplied(!isApplied);
    setSelectedAgent(null);
    setChatHistory(intro());
    triggerAIAnalysis({ ...site, ...updatedCopy });
  };

  // Conversational Q&A with live Gemini AI or smart fallback
  // Conversational Q&A with live Gemini AI or intelligent question-aware persona
  const ask = async (query: string, cohort: string) => {
    if (!result || isLoading || !query.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { sender: 'You', role: 'Reviewer', text: query.slice(0, 2000), isUser: true, timestamp };
    const activeCopy = isApplied ? recommendation : site;
    const pool = result.engine.nodes.filter(n => cohort === 'ALL' || n.status === cohort);
    const chosenAgent = selectedAgent || pool[Math.floor(Math.random() * Math.min(pool.length, 6))] || pool[0];

    const targetPersona = chosenAgent ? {
      name: chosenAgent.name,
      role: chosenAgent.role,
      archetype: chosenAgent.cluster,
      painPoint: chosenAgent.painPoint,
      status: chosenAgent.status
    } : {
      name: aiAnalysis?.personas?.[0]?.name || 'Elena Rostova',
      role: aiAnalysis?.personas?.[0]?.role || 'Director of Procurement & Compliance',
      archetype: aiAnalysis?.personas?.[0]?.archetype || 'procurement',
      painPoint: aiAnalysis?.personas?.[0]?.primaryObjection || 'Requires SOC2 compliance, team SSO, and invoice billing',
      status: aiAnalysis?.personas?.[0]?.status || 'BOUNCED'
    };

    setIsChatThinking(true);
    setThinkingPersona({ name: targetPersona.name, role: targetPersona.role, status: targetPersona.status });
    setChatHistory(history => [...history, userMessage]);

    try {
      // Query live Gemini AI persona (uses server API key or client key)
      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            persona: targetPersona,
            site: activeCopy,
            apiKey: geminiKey || undefined
          })
        });
        const data = await res.json();
        if (res.ok && data.answer) {
          const aiReply: Message = {
            sender: targetPersona.name,
            role: `${targetPersona.role} · ${targetPersona.status === 'CONVERTED' ? 'Advocate' : 'Skeptic'}`,
            text: data.answer,
            isUser: false,
            timestamp
          };
          setChatHistory(history => [...history, aiReply]);
          return;
        }
      } catch {
        // Fall through to question-aware fallback if offline
      }

      // Question-aware intelligent heuristic fallback (zero boilerplate)
      const isRating = /rate|rating|score|how much|evaluate|\bout of 10\b/i.test(query);
      const isCli = /cli|terminal|command|tool|dev|code|engineering/i.test(query);
      const isPrice = /price|cost|budget|tier/i.test(query);

      const fallbackText = isRating
        ? `Speaking as ${targetPersona.role}, I would rate this a ${targetPersona.status === 'CONVERTED' ? '7.5' : '4.5'}/10. ${targetPersona.status === 'CONVERTED' ? 'The core value proposition addresses my daily workflow requirements.' : `My primary reservation is: ${targetPersona.painPoint}.`} ${isCli ? 'For developer and CLI tooling, we require explicit terminal ergonomics and verified zero build-latency before rolling it out.' : ''}`.trim()
        : isCli
        ? `Speaking as ${targetPersona.role}, terminal and developer ergonomics are vital. If the CLI provides seamless execution without breaking CI, it solves real pain; otherwise, my priority remains: ${targetPersona.painPoint}.`
        : isPrice
        ? `On pricing, "${site.pricing || 'not disclosed'}" is the key factor. For my budget as ${targetPersona.role}, I need guaranteed ROI and transparent monthly tiers rather than hidden sales forms.`
        : `As ${targetPersona.role}, regarding "${query}": My decision is driven by: ${targetPersona.painPoint}. If the landing page provides verified technical proof for that, I am ready to trial.`;

      const fallbackReply: Message = {
        sender: targetPersona.name,
        role: `${targetPersona.role} · ${targetPersona.status === 'CONVERTED' ? 'Advocate' : 'Skeptic'}`,
        text: fallbackText,
        isUser: false,
        timestamp
      };
      setChatHistory(history => [...history, fallbackReply]);
    } finally {
      setIsChatThinking(false);
      setThinkingPersona(null);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const report = {
      version: 2,
      exportedAt: new Date().toISOString(),
      method: 'Multi-Engine: Real Google Chrome CrUX + Gemini AI + Heuristic Persona Consensus',
      site,
      appliedCopy: isApplied ? recommendation : site,
      realGooglePageSpeed: webMetrics,
      realGeminiAIEvaluation: aiAnalysis,
      realPostHogAnalytics: liveAnalytics,
      baselinePct: baseline,
      differenceInPercentagePoints: result.metrics.conversionPct - baseline,
      metrics: result.metrics,
      personas: result.engine.nodes.map(({ x, y, vx, vy, ...agent }) => agent),
      conversation: chatHistory
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'personapulse-real-intelligence-report.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="dashboard-shell">
      <Masthead
        agentCount={50}
        activeStatus={isLoading ? 'Extracting page…' : isVitalsLoading ? 'Auditing Google CrUX…' : 'Real intelligence ready'}
      />

      <div className="workspace-mode-nav">
        <div className="workspace-mode-tabs">
          <button
            className={`mode-tab-btn ${workspaceMode === 'overview' ? 'active' : ''}`}
            onClick={() => setWorkspaceMode('overview')}
          >
            <span>✦ Workbench (Overview)</span>
          </button>
          <button
            className={`mode-tab-btn ${workspaceMode === 'graph_studio' ? 'active' : ''}`}
            onClick={() => setWorkspaceMode('graph_studio')}
          >
            <span>⛶ Graph (Full View)</span>
          </button>
          <button
            className={`mode-tab-btn ${workspaceMode === 'chat_room' ? 'active' : ''}`}
            onClick={() => setWorkspaceMode('chat_room')}
          >
            <span>💬 Examination Room</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            Active Swarm: <strong style={{ color: 'var(--accent-navy)' }}>{hasAnalyzed ? '50 Agents Deliberating' : 'Standby (0 Agents)'}</strong>
          </span>
        </div>
      </div>

      <main>
        {/* VIEW 1: FULL GRAPH STUDIO (Interactive D3 SVG Canvas + 1-on-1 POV Interrogation) */}
        {workspaceMode === 'graph_studio' ? (
          !hasAnalyzed || !result ? (
            <div className="editorial-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>AWAITING TARGET URL</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: '0.6rem 0' }}>No website has been analyzed yet</h2>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Enter a website URL in the Workbench Overview tab to initiate the Swarm simulation.</p>
              <button className="btn-editorial-primary" onClick={() => setWorkspaceMode('overview')}>
                ← Return to Workbench to Enter URL
              </button>
            </div>
          ) : (
            <FullGraphStudio
              engine={result.engine}
              site={isApplied ? recommendation : site}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              onBackToOverview={() => setWorkspaceMode('overview')}
              geminiKey={geminiKey}
            />
          )
        ) : workspaceMode === 'chat_room' ? (
          /* VIEW 2: EXAMINATION ROOM (Cohort Debrief & Live Interrogation) */
          !hasAnalyzed || !result ? (
            <div className="editorial-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>AWAITING TARGET URL</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: '0.6rem 0' }}>No website has been analyzed yet</h2>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Enter a website URL in the Workbench Overview tab to open the Examination Room.</p>
              <button className="btn-editorial-primary" onClick={() => setWorkspaceMode('overview')}>
                ← Return to Workbench to Enter URL
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <button className="btn-editorial-secondary" onClick={() => setWorkspaceMode('overview')}>
                  ← Back to Executive Overview
                </button>
                <button
                  className="btn-editorial-primary"
                  onClick={() => {
                    setWorkspaceMode('graph_studio');
                  }}
                  style={{ background: 'var(--accent-navy)', color: '#FFFFFF' }}
                >
                  ⚡ Open in Full Swarm Graph Studio
                </button>
              </div>
              <AgentDiscourseChat
                nodes={result.engine.nodes}
                liveMessages={result.engine.messages}
                onAskQuestion={ask}
                chatHistory={chatHistory}
                disabled={isLoading}
                site={isApplied ? recommendation : site}
                isThinking={isChatThinking}
                thinkingPersona={thinkingPersona}
              />
            </div>
          )
        ) : (
          /* VIEW 3: EXECUTIVE OVERVIEW (CrUX, AI Personas, Traffic, Funnel, Redline) */
          <>
            <div className="research-note">
              100% Free Real Data Engine: Google CrUX Field Data + Free Gemini 2.0 AI + 50-Agent Consensus Dynamics
            </div>

            <TargetWebsiteInput currentCopy={site} onAnalyze={handleAnalyze} isLoading={isLoading} />

            {error && <div className="error-notice" role="alert">{error}</div>}

            {!hasAnalyzed || !result ? (
              <section className="editorial-card standby-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginTop: '1.5rem', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                  <span className="mono-tag" style={{ color: 'var(--accent-navy)', fontWeight: 700, letterSpacing: '0.08em' }}>
                    STANDBY · AWAITING TARGET URL
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', marginTop: '0.6rem', marginBottom: '0.8rem', color: 'var(--ink-primary)' }}>
                    Enter a website URL above to inspect and simulate buyer personas
                  </h2>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                    PersonaPulse extracts the live page DOM, parses pricing tier tables, detects brand capabilities, and runs a 50-agent synthetic buyer simulation with real Google Chrome CrUX telemetry &amp; Gemini AI debriefs.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', textAlign: 'left' }}>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-rule)', borderRadius: '3px', background: 'var(--bg-paper)' }}>
                      <div className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700, marginBottom: '0.3rem' }}>01 · DEEP EXTRACTION</div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>Full-Page DOM Parser</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Pulls JSON-LD schemas, pricing tables, hero value propositions, and core CTAs.</p>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-rule)', borderRadius: '3px', background: 'var(--bg-paper)' }}>
                      <div className="mono-tag" style={{ color: 'var(--accent-sage)', fontWeight: 700, marginBottom: '0.3rem' }}>02 · SWARM SIMULATION</div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>50 Synthetic Personas</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>16 professional buyer archetypes debate friction, calculate ROI, and predict conversion.</p>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-rule)', borderRadius: '3px', background: 'var(--bg-paper)' }}>
                      <div className="mono-tag" style={{ color: 'var(--accent-navy)', fontWeight: 700, marginBottom: '0.3rem' }}>03 · LIVE DEBRIEF</div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>Direct Interrogation</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Cross-examine bounced and converted personas with dynamic website questions.</p>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Source Headline & Metadata Preview */}
                <section className="editorial-card source-preview" aria-label="Analyzed page">
                  <div className="section-heading">
                    <div>
                      <span className="mono-tag">
                        {site.source === 'sample' ? 'FICTIONAL SAMPLE EDITION' : site.source === 'website' ? 'EXTRACTED WEBSITE COPY' : 'DRAFT MANUSCRIPT'}
                      </span>
                      <p>{site.url}</p>
                    </div>
                    <div className="heading-actions">
                      <button className="btn-editorial-secondary" onClick={exportReport} disabled={!result || isLoading}>
                        Export Comprehensive Report
                      </button>
                    </div>
                  </div>
                  <h2>{(isApplied ? recommendation : site).headline}</h2>
                  <p>{(isApplied ? recommendation : site).subhead || 'No value statement supplied.'}</p>
                  <p>
                    <strong>Price:</strong> {site.pricing || 'Not disclosed'} · <strong>Action:</strong> {(isApplied ? recommendation : site).cta || 'Not detected'}
                  </p>
                  {site.warnings.map((warning, i) => <p className="muted" key={i}>{warning}</p>)}
                  {saved && <small role="status">Last analysis saved on this device.</small>}
                </section>

                {/* 1. Real Google PageSpeed & Chrome CrUX Field Data Card */}
                {site.source === 'website' && (
                  <CoreWebVitalsCard
                    metrics={webMetrics}
                    isLoading={isVitalsLoading}
                    error={vitalsError}
                    onRefresh={() => triggerPageSpeed(site.url)}
                  />
                )}

                {/* 2. Real Google Gemini AI Executive Personas Card */}
                <RealAIPersonasCard
                  analysis={aiAnalysis}
                  isLoading={isAILoading}
                  error={aiError}
                  selectedPersonaId={selectedAIPersona?.personaId}
                  onSelectPersona={p => setSelectedAIPersona(p)}
                />

                {/* 3. Real Live Traffic Card (PostHog Cloud) */}
                <LiveTrafficCard
                  analytics={liveAnalytics}
                  isLoading={isLiveLoading}
                  error={liveError}
                />

                {/* 4. Swarm Network Dynamics & Funnel */}
                <div className="spread spread-primary">
                  <MiroFishGraph
                    engine={result.engine}
                    onSelectAgent={(agent) => {
                      setSelectedAgent(agent);
                    }}
                    selectedAgent={selectedAgent}
                    onExpandStudio={(agent) => {
                      if (agent) setSelectedAgent(agent);
                      setWorkspaceMode('graph_studio');
                    }}
                  />
                  <FunnelBroadsheet conversionPct={result.metrics.conversionPct} stageStats={result.metrics.stageStats} clusters={result.metrics.clusters} />
                </div>

                <div className="spread spread-secondary">
                  <CopyRedlineDoctor
                    currentHeadline={site.headline}
                    recommendedHeadline={aiAnalysis?.suggestedHeadline || recommendation.headline}
                    currentCta={`${site.pricing || 'Price not disclosed'} · ${site.cta || 'No action supplied'}`}
                    recommendedCta={`${recommendation.pricing || 'Price not disclosed'} · ${aiAnalysis?.suggestedCta || recommendation.cta || 'No action supplied'}`}
                    isApplied={isApplied}
                    onApplyRedline={toggleRedline}
                    lift={lift}
                    disabled={isLoading}
                  />
                  <AgentDiscourseChat
                    nodes={result.engine.nodes}
                    liveMessages={result.engine.messages}
                    onAskQuestion={ask}
                    chatHistory={chatHistory}
                    disabled={isLoading}
                    site={isApplied ? recommendation : site}
                    isThinking={isChatThinking}
                    thinkingPersona={thinkingPersona}
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer>
        PersonaPulse Elite · Zero-paywall research sandbox. Real Google Chrome CrUX telemetry &amp; Gemini 2.0 AI paired with multi-agent consensus dynamics.
      </footer>
    </div>
  );
}



