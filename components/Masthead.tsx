'use client';
// components/Masthead.tsx - Broadsheet Editorial Masthead Header
import React from 'react';

interface MastheadProps {
  agentCount: number;
  activeStatus: string;
  onOpenSettings?: () => void;
  hasGeminiKey?: boolean;
}

export const Masthead: React.FC<MastheadProps> = ({ agentCount, activeStatus, onOpenSettings, hasGeminiKey }) => {
  const today = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header style={{ borderBottom: '2px solid var(--border-strong)', padding: '1.25rem 0', background: 'var(--bg-paper)' }}>
      {/* Top Telemetry & Metadata Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--ink-muted)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span className="mono-tag" style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>VOL. IV • NO. 42</span>
          <span>{today}</span>
          <span>Google CrUX + Gemini Intelligence Edition</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="stamp-badge free">
            <span>●</span> Google CrUX (Live Field Data)
          </span>
          <span className="stamp-badge free">
            <span>●</span> Gemini AI: Active
          </span>
        </div>
      </div>

      {/* Main Newspaper Masthead Title */}
      <div style={{ textAlign: 'center', padding: '1.75rem 0 1rem 0' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '0.35rem' }}>
          The Real Intelligence & Synthetic Research Dispatch
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.6rem', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink-primary)' }}>
          PersonaPulse <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--accent-navy)' }}>Elite</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
          Real Google UX field data, AI executive personas, and live conversion intelligence
        </p>
      </div>

      {/* Sub-bar Motto & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border-rule)', paddingTop: '0.6rem', color: 'var(--ink-muted)' }}>
        <span>"Unfiltered Consensus: Live Chrome Field Telemetry + Real Buyer Evaluation"</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          Status: <strong style={{ color: 'var(--accent-sage)' }}>{activeStatus}</strong>
        </span>
      </div>
    </header>
  );
};

