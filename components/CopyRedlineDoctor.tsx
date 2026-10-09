'use client';
// components/CopyRedlineDoctor.tsx - Editorial Manuscript Proofing & Copy Doctor
import React from 'react';

interface CopyRedlineDoctorProps {
  currentHeadline: string;
  recommendedHeadline: string;
  currentCta: string;
  recommendedCta: string;
  isApplied: boolean;
  onApplyRedline: () => void;
  lift: number;
  disabled?: boolean;
}

export const CopyRedlineDoctor: React.FC<CopyRedlineDoctorProps> = ({
  currentHeadline,
  recommendedHeadline,
  currentCta,
  recommendedCta,
  isApplied,
  onApplyRedline, lift, disabled
}) => {
  return (
    <div className="editorial-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-rule)', paddingBottom: '0.75rem' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--accent-crimson)', fontWeight: 700 }}>PROOFREADER'S DESK</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', marginTop: '0.2rem' }}>
            Editorial Manuscript Proofing & Redlines
          </h2>
        </div>
        <span className="stamp-badge" style={{ color: 'var(--accent-sage)', borderColor: 'rgba(21, 128, 61, 0.3)' }}>
          {lift > 0 ? '+' : ''}{lift} pp model difference
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
        Compare a plain-language alternative using the same personas. Prices and commercial terms are preserved. The score difference is a model result, not a prediction of actual sales.
      </p>

      {/* Proofing Box 1: Headline */}
      <div style={{ border: '1px solid var(--border-rule)', background: 'var(--bg-paper)', borderRadius: '3px', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Original Headline vs. Swarm-Proofed Alternative:
        </div>
        
        {/* Strike-through original */}
        <div style={{ textDecoration: 'line-through', color: 'var(--accent-crimson)', fontStyle: 'italic', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
          "{currentHeadline}"
        </div>

        {/* Recommended replacement */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--ink-primary)', fontWeight: 600, borderLeft: '3px solid var(--accent-sage)', paddingLeft: '0.75rem' }}>
          "{recommendedHeadline}"
        </div>
      </div>

      {/* Proofing Box 2: CTA & Pricing Friction */}
      <div style={{ border: '1px solid var(--border-rule)', background: 'var(--bg-paper)', borderRadius: '3px', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Call to Action & Friction Barrier:
        </div>
        <div style={{ textDecoration: 'line-through', color: 'var(--accent-crimson)', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          "{currentCta}"
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--accent-sage)', fontWeight: 600, borderLeft: '3px solid var(--accent-sage)', paddingLeft: '0.75rem' }}>
          "{recommendedCta}"
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          Applying this redline rewrites the target variables and triggers immediate re-simulation.
        </span>
        <button
          onClick={onApplyRedline} disabled={disabled}
          className="btn-editorial-primary"
          style={{ background: isApplied ? 'var(--accent-navy)' : 'var(--accent-terracotta)', borderColor: isApplied ? 'var(--accent-navy)' : 'var(--accent-terracotta)' }}
        >
          {isApplied ? '↩️ Revert to Unproofed Baseline' : '⚡ Apply Redline & Re-Simulate'}
        </button>
      </div>
    </div>
  );
};

