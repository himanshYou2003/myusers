'use client';
// components/FunnelBroadsheet.tsx - 4-Stage Drop-Off Funnel & Consensus Metrics
import React from 'react';

interface FunnelBroadsheetProps {
  conversionPct: number;
  stageStats: {
    heroPct: number;
    valuePct: number;
    pricingPct: number;
    convertPct: number;
  };
  clusters: {
    pricingResistance: { count: number; pct: number };
    jargonConfusion: { count: number; pct: number };
    valueAdvocacy: { count: number; pct: number };
  };
}

export const FunnelBroadsheet: React.FC<FunnelBroadsheetProps> = ({
  conversionPct,
  stageStats,
  clusters
}) => {
  return (
    <div className="editorial-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-rule)', paddingBottom: '0.75rem' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>SYNTHETIC METRICS</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', marginTop: '0.2rem' }}>
            Consensus & Funnel Attrition
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Consensus Rate:</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: conversionPct > 50 ? 'var(--accent-sage)' : 'var(--accent-terracotta)', lineHeight: 1 }}>
            {conversionPct}%
          </div>
        </div>
      </div>

      {/* 4-Stage Funnel Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Stage 1 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>I. Headline Impression (First 5s)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{stageStats.heroPct}% retained</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${stageStats.heroPct}%`, height: '100%', background: 'var(--ink-primary)', transition: 'width 0.6s ease' }}></div>
          </div>
        </div>

        {/* Stage 2 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>II. Value Comprehension</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{stageStats.valuePct}% retained</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${stageStats.valuePct}%`, height: '100%', background: '#475569', transition: 'width 0.6s ease' }}></div>
          </div>
        </div>

        {/* Stage 3 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>III. Pricing Scrutiny</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-terracotta)' }}>{stageStats.pricingPct}% retained</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${stageStats.pricingPct}%`, height: '100%', background: 'var(--accent-terracotta)', transition: 'width 0.6s ease' }}></div>
          </div>
        </div>

        {/* Stage 4 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>IV. Conversion Action</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sage)', fontWeight: 700 }}>{stageStats.convertPct}% converted</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${stageStats.convertPct}%`, height: '100%', background: 'var(--accent-sage)', transition: 'width 0.6s ease' }}></div>
          </div>
        </div>

      </div>

      <hr className="editorial-rule" />

      {/* Emergent Consensus Clusters */}
      <div>
        <span className="mono-tag" style={{ color: 'var(--ink-muted)', display: 'block', marginBottom: '0.5rem' }}>
          DOMINANT OBJECTION CLUSTERS:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
          <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-muted)', borderLeft: '3px solid var(--accent-terracotta)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent-terracotta)' }}>Pricing & Action Friction</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{clusters.pricingResistance.count} agents ({clusters.pricingResistance.pct}%)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Agents who reached pricing but encountered cost, commitment, or action friction.
            </p>
          </div>

          <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-muted)', borderLeft: '3px solid var(--accent-crimson)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent-crimson)' }}>Headline & Value Clarity</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{clusters.jargonConfusion.count} agents ({clusters.jargonConfusion.pct}%)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Agents who left during headline interpretation or value comprehension.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

