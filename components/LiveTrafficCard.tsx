'use client';
import React from 'react';
import type { LiveAnalyticsSummary } from '../lib/live-analytics';

interface Props {
  analytics: LiveAnalyticsSummary | null;
  isLoading: boolean;
  error?: string;
}

export function LiveTrafficCard({ analytics, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <section className="editorial-card live-traffic-card" aria-label="Live Website Analytics">
        <div className="section-heading">
          <div>
            <span className="mono-tag live-tag">POSTHOG LIVE ANALYTICS</span>
            <p>Querying real production traffic data…</p>
          </div>
        </div>
        <div className="vitals-loading-skeleton">
          <div className="pulse-bar" />
          <p className="muted">Retrieving live pageviews, unique visitors, and funnel progression…</p>
        </div>
      </section>
    );
  }

  if (error || !analytics?.connected) {
    return null; // Keep the dashboard clean and direct
  }

  return (
    <section className="editorial-card live-traffic-card" aria-label="Live Website Analytics">
      <div className="section-heading">
        <div>
          <span className="mono-tag live-tag">POSTHOG CLOUD · PRODUCTION METRICS</span>
          <p>Real Visitor Traffic ({analytics.period})</p>
        </div>
      </div>

      <div className="live-stat-grid">
        <div className="live-stat-box">
          <div className="live-stat-val">{analytics.totalVisitors.toLocaleString()}</div>
          <div className="live-stat-lbl">Unique Visitors</div>
        </div>
        <div className="live-stat-box">
          <div className="live-stat-val">{analytics.totalPageviews.toLocaleString()}</div>
          <div className="live-stat-lbl">Total Pageviews</div>
        </div>
        <div className="live-stat-box">
          <div className="live-stat-val">{analytics.bounceRatePct}%</div>
          <div className="live-stat-lbl">Measured Bounce Rate</div>
        </div>
        <div className="live-stat-box">
          <div className="live-stat-val">{analytics.averageSessionSec}s</div>
          <div className="live-stat-lbl">Avg Time on Page</div>
        </div>
      </div>

      <div className="live-funnel-section">
        <h4>Production Conversion Funnel (Real Visitors)</h4>
        <div className="live-funnel-bars">
          {analytics.conversionFunnel.map((stage, idx) => (
            <div key={idx} className="funnel-row">
              <span className="stage-name">{stage.stage}</span>
              <div className="funnel-bar-container">
                <div className="funnel-bar-fill" style={{ width: `${stage.pct}%` }} />
              </div>
              <span className="stage-stat">{stage.visitors.toLocaleString()} ({stage.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
