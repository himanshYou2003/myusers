import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgentNode } from '../lib/personas';
import { DebateMessage } from '../lib/graph-engine';
import { SiteCopy, SiteData } from '../lib/site';
import { getDynamicWebsiteQuestions } from '../lib/questions';

interface AgentDiscourseChatProps {
  disabled?: boolean;
  nodes: AgentNode[];
  liveMessages: DebateMessage[];
  onAskQuestion: (query: string, cohort: string) => void;
  chatHistory: Array<{ sender: string; role: string; text: string; isUser: boolean; timestamp: string }>;
  site?: SiteCopy | SiteData;
  isThinking?: boolean;
  thinkingPersona?: { name: string; role: string; status?: string } | null;
}

export const AgentDiscourseChat: React.FC<AgentDiscourseChatProps> = ({
  nodes, disabled,
  liveMessages,
  onAskQuestion,
  chatHistory,
  site,
  isThinking,
  thinkingPersona
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<'ALL' | 'BOUNCED' | 'CONVERTED'>('ALL');
  const [thinkingPhase, setThinkingPhase] = useState(0);

  const dynamicThinkingActions = useMemo(() => [
    "Reviewing...",
    "Analyzing copy...",
    "Synthesizing...",
    "Weighing claims...",
    "Drafting perspective..."
  ], []);

  useEffect(() => {
    if (!isThinking) {
      setThinkingPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingPhase(p => (p + 1) % dynamicThinkingActions.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isThinking, dynamicThinkingActions]);

  const suggestedQuestions = useMemo(() => {
    if (site) {
      return getDynamicWebsiteQuestions(site, (site as any).manifest);
    }
    return [
      "What caused pricing objections in this run?",
      "Was the initial hero headline clear or confusing?",
      "What single change would convince skeptics to convert?"
    ];
  }, [site]);

  const streamRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [chatHistory, isThinking, thinkingPhase]);

  const handleSend = () => {
    if (!inputQuery.trim() || disabled || isThinking) return;
    onAskQuestion(inputQuery.trim(), cohortFilter);
    setInputQuery('');
  };

  return (
    <div className="editorial-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-rule)', paddingBottom: '0.75rem' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--accent-navy)', fontWeight: 700 }}>EXAMINATION ROOM</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', marginTop: '0.2rem' }}>
            Swarm Interrogation & Real-Time Debrief
          </h2>
        </div>

        {/* Cohort filter */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'ALL', label: 'All personas' },
            { id: 'BOUNCED', label: '🔴 Skeptics & Bounced' },
            { id: 'CONVERTED', label: '🟢 Advocates' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCohortFilter(c.id as 'ALL' | 'BOUNCED' | 'CONVERTED')}
              className={cohortFilter === c.id ? 'btn-editorial-primary' : 'btn-editorial-secondary'}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              {c.label} ({nodes.filter(n => c.id === 'ALL' || n.status === c.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Live MiroFish Debate Ticker (Inter-agent communication) */}
      <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-rule)', borderRadius: '3px', padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--ink-muted)' }}>
          <span className="mono-tag" style={{ color: 'var(--accent-terracotta)' }}>SIMULATED AGENT EXCHANGES:</span>
          <span>{liveMessages.length} exchanges observed</span>
        </div>
        <div style={{ maxHeight: '75px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {liveMessages.slice(-3).map(msg => (
            <div key={msg.id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: msg.impact === 'DISAGREEMENT' ? 'var(--accent-crimson)' : 'var(--accent-sage)' }}>
              [{msg.timestamp}] {msg.content}
            </div>
          ))}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div ref={streamRef} role="log" aria-live="polite" aria-label="Persona conversation" style={{ height: '280px', overflowY: 'auto', border: '1px solid var(--border-rule)', background: '#FFFFFF', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        {chatHistory.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: item.isUser ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginBottom: '0.2rem' }}>
              <strong>{item.sender}</strong> ({item.role}) • {item.timestamp}
            </div>
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '3px',
              fontSize: '0.88rem',
              background: item.isUser ? 'var(--ink-primary)' : 'var(--bg-paper)',
              color: item.isUser ? '#FFFFFF' : 'var(--ink-body)',
              border: item.isUser ? 'none' : '1px solid var(--border-rule)',
              fontFamily: item.isUser ? 'var(--font-sans)' : 'var(--font-serif)',
              fontStyle: item.isUser ? 'normal' : 'italic'
            }}>
              {item.text}
            </div>
          </div>
        ))}

        {/* Dynamic Agent Thinking State - Simple, Card-Free & Beautiful */}
        {isThinking && thinkingPersona && (
          <div className="simple-thinking-row" aria-live="polite">
            <span className="pulse-beacon-dot" />
            <div className="simple-thinking-content">
              <span className="simple-thinking-name">{thinkingPersona.name}</span>
              <span className="simple-thinking-action">
                {dynamicThinkingActions[thinkingPhase]}
              </span>
              <span className="minimal-typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Question Chips - Dynamically customized to target website */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '3px' }}>
        {suggestedQuestions.map(q => (
          <button
            key={q}
            disabled={disabled || isThinking}
            onClick={() => { setInputQuery(''); onAskQuestion(q, cohortFilter); }}
            style={{
              background: 'var(--bg-paper)',
              border: '1px solid var(--border-rule)',
              padding: '4px 10px',
              borderRadius: '2px',
              fontSize: '0.75rem',
              color: isThinking ? 'var(--ink-muted)' : 'var(--ink-body)',
              cursor: isThinking ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: isThinking ? 0.6 : 1,
              transition: 'background 0.15s ease, border-color 0.15s ease'
            }}
            title={isThinking ? 'Waiting for persona response...' : `Ask cohort: ${q}`}
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text" aria-label="Question for synthetic personas" maxLength={2000} disabled={disabled || isThinking}
          className="editorial-input"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isThinking ? `${thinkingPersona?.name || 'Persona'} is reviewing...` : "Ask the synthetic cohort any question..."}
          style={{ fontSize: '0.88rem', opacity: isThinking ? 0.75 : 1 }}
        />
        <button disabled={disabled || isThinking || !inputQuery.trim()} onClick={handleSend} className="btn-editorial-primary">
          {isThinking ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="pulse-beacon-dot" style={{ background: '#FFFFFF', width: '5px', height: '5px' }} />
              Reviewing...
            </span>
          ) : 'Submit'}
        </button>
      </div>
    </div>
  );
};


