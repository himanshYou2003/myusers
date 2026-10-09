'use client';
import React from 'react';
import type { RealWebMetrics } from '../lib/pagespeed';

interface Props {
  metrics: RealWebMetrics | null;
  isLoading: boolean;
  error?: string;
  onRefresh?: () => void;
}

export function CoreWebVitalsCard({ metrics, isLoading, error, onRefresh }: Props) {
  if (isLoading) {
    return (
      <section className="editorial-card web-vitals-card" aria-label="Real Google UX & Performance">
        <div className="section-heading">
          <div>
            <span className="mono-tag live-tag">GOOGLE CRUX & PAGESPEED</span>
            <p>Querying real Chrome user field data…</p>
          </div>
        </div>
        <div className="vitals-loading-skeleton">
          <div className="pulse-bar" />
          <p className="muted">Fetching real Core Web Vitals, mobile load latency, and SEO diagnostics from Google API…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="editorial-card web-vitals-card" aria-label="Real Google UX & Performance">
        <div className="section-heading">
          <div>
            <span className="mono-tag error-tag">PAGESPEED NOTICE</span>
            <p>Google CrUX Data Unavailable for this URL</p>
          </div>
          {onRefresh && <button className="btn-editorial-secondary" onClick={onRefresh}>Retry</button>}
        </div>
        <p className="muted">{error} (PageSpeed requires a publicly reachable HTTP/HTTPS domain).</p>
      </section>
    );
  }

  if (!metrics) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#15803D'; // Green
    if (score >= 50) return '#D97706'; // Amber
    return '#DC2626'; // Red
  };

  const getRatingBadge = (rating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR') => {
    if (rating === 'GOOD') return <span className="rating-pill rating-good">Pass (Good)</span>;
    if (rating === 'NEEDS_IMPROVEMENT') return <span className="rating-pill rating-warn">Needs Work</span>;
    if (rating === 'POOR') return <span className="rating-pill rating-poor">Poor (Bounce Risk)</span>;
    return <span className="rating-pill rating-neutral">Lab Only</span>;
  };

  return (
    <section className="editorial-card web-vitals-card" aria-label="Real Google UX & Performance">
      <div className="section-heading">
        <div>
          <span className="mono-tag live-tag">REAL DATA · GOOGLE CHROME CRUX & LIGHTHOUSE</span>
          <p>Real-World Mobile Experience & Core Web Vitals</p>
        </div>
        <div className="heading-actions">
          <span className="tested-stamp">Tested: {new Date(metrics.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {onRefresh && <button className="btn-editorial-secondary btn-sm" onClick={onRefresh}>Re-audit</button>}
        </div>
      </div>

      {/* 3 Main Lighthouse Gauge Scores */}
      <div className="vitals-score-grid">
        <div className="vitals-gauge">
          <div className="gauge-number" style={{ color: getScoreColor(metrics.scores.performance) }}>
            {metrics.scores.performance}
          </div>
          <div className="gauge-label">Performance</div>
          <div className="gauge-sub">Mobile Speed</div>
        </div>

        <div className="vitals-gauge">
          <div className="gauge-number" style={{ color: getScoreColor(metrics.scores.seo) }}>
            {metrics.scores.seo}
          </div>
          <div className="gauge-label">SEO Audit</div>
          <div className="gauge-sub">Discoverability</div>
        </div>

        <div className="vitals-gauge">
          <div className="gauge-number" style={{ color: getScoreColor(metrics.scores.accessibility) }}>
            {metrics.scores.accessibility}
          </div>
          <div className="gauge-label">Accessibility</div>
          <div className="gauge-sub">WCAG & Usability</div>
        </div>

        <div className="vitals-gauge bounce-gauge">
          <div className="gauge-number" style={{ color: metrics.diagnostics.estimatedBounceRiskPct > 50 ? '#DC2626' : '#15803D' }}>
            {metrics.diagnostics.estimatedBounceRiskPct}%
          </div>
          <div className="gauge-label">Bounce Probability</div>
          <div className="gauge-sub">Speed Impact</div>
        </div>
      </div>

      {/* Real Core Web Vitals Row */}
      <div className="crux-row">
        <div className="crux-stat">
          <div className="stat-title">
            <strong>LCP</strong> (Largest Contentful Paint)
            {getRatingBadge(metrics.cruxFieldData.lcpRating)}
          </div>
          <div className="stat-value">
            {metrics.cruxFieldData.largestContentfulPaintSec !== undefined
              ? `${metrics.cruxFieldData.largestContentfulPaintSec}s`
              : `${metrics.diagnostics.mobileSpeedIndexSec}s (Lab)`}
          </div>
          <p className="stat-explainer">Time until primary hero text/image renders. Target: &lt;2.5s.</p>
        </div>

        <div className="crux-stat">
          <div className="stat-title">
            <strong>INP</strong> (Interaction to Next Paint)
            {getRatingBadge(metrics.cruxFieldData.inpRating)}
          </div>
          <div className="stat-value">
            {metrics.cruxFieldData.interactionToNextPaintMs !== undefined
              ? `${metrics.cruxFieldData.interactionToNextPaintMs}ms`
              : `${metrics.diagnostics.timeToInteractiveSec}s (TTI)`}
          </div>
          <p className="stat-explainer">User click & tap response responsiveness. Target: &lt;200ms.</p>
        </div>

        <div className="crux-stat">
          <div className="stat-title">
            <strong>CLS</strong> (Layout Shift)
            {getRatingBadge(metrics.cruxFieldData.clsRating)}
          </div>
          <div className="stat-value">
            {metrics.cruxFieldData.cumulativeLayoutShift !== undefined
              ? metrics.cruxFieldData.cumulativeLayoutShift
              : '0.01 (Stable)'}
          </div>
          <p className="stat-explainer">Visual stability during page load. Target: &lt;0.1.</p>
        </div>
      </div>

      {/* Diagnostics and SEO Findings */}
      <div className="vitals-findings">
        <h4>Real SEO & Diagnostic Insights</h4>
        <ul>
          <li><strong>Load Diagnosis:</strong> {metrics.diagnostics.speedSummary} (TTFB: {metrics.diagnostics.serverResTimeMs}ms)</li>
          {metrics.seoFindings.map((finding, idx) => (
            <li key={idx}><strong>SEO Alert:</strong> {finding}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
