'use client';
import React, { useState } from 'react';
import { SAMPLES, SiteCopy, SiteData } from '../lib/site';

interface Props {
  currentCopy: SiteData;
  onAnalyze: (url: string, copy?: SiteCopy, sample?: boolean) => void;
  isLoading: boolean;
}

export function TargetWebsiteInput({ onAnalyze, isLoading, currentCopy }: Props) {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState<'URL' | 'MANUSCRIPT' | 'BLUEPRINT'>('URL');
  const [showBlueprintDrawer, setShowBlueprintDrawer] = useState(false);
  const [copy, setCopy] = useState<SiteCopy>({
    headline: '',
    subhead: '',
    pricing: '',
    cta: ''
  });

  const manifest = currentCopy.manifest;

  return (
    <section className="editorial-card intake" aria-labelledby="intake-title">
      <div className="section-heading">
        <div>
          <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
            DISPATCH INTAKE ENGINE · 100% DEEP EXTRACTION
          </span>
          <h2 id="intake-title">Website URL &amp; Deep Manifest to Examine</h2>
        </div>

        <div className="control-row">
          <button
            type="button"
            aria-pressed={tab === 'URL'}
            className={tab === 'URL' ? 'btn-editorial-primary' : 'btn-editorial-secondary'}
            onClick={() => setTab('URL')}
          >
            Website URL (100% Deep Scan)
          </button>
          <button
            type="button"
            aria-pressed={tab === 'MANUSCRIPT'}
            className={tab === 'MANUSCRIPT' ? 'btn-editorial-primary' : 'btn-editorial-secondary'}
            onClick={() => {
              setCopy({
                headline: currentCopy.headline,
                subhead: currentCopy.subhead,
                pricing: currentCopy.pricing,
                cta: currentCopy.cta
              });
              setTab('MANUSCRIPT');
            }}
          >
            Draft Pitch Manuscript
          </button>
          {manifest && (
            <button
              type="button"
              className={showBlueprintDrawer ? 'btn-editorial-primary' : 'btn-editorial-secondary'}
              onClick={() => setShowBlueprintDrawer(!showBlueprintDrawer)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📋 Extraction Blueprint</span>
              <span className="tab-badge" style={{ background: '#15803D' }}>{manifest.features.length} Features</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Intake Form */}
      <form onSubmit={event => {
        event.preventDefault();
        onAnalyze(url.trim(), tab === 'MANUSCRIPT' ? copy : undefined);
      }}>
        <fieldset disabled={isLoading}>
          {tab === 'URL' ? (
            <>
              <label htmlFor="target-url" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                Target Product Website URL (Full-Page DOM &amp; Tier Parser)
              </label>
              <div className="input-row">
                <input
                  id="target-url"
                  className="editorial-input"
                  type="url"
                  required
                  placeholder="https://yourproduct.com"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                  maxLength={2048}
                />
                <button className="btn-editorial-primary" type="submit" style={{ minWidth: '180px' }}>
                  {isLoading ? 'Scanning full DOM…' : 'Analyze Website →'}
                </button>
              </div>
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--ink-muted)' }}>
                Deep extraction parses JSON-LD schemas, pricing tier tables, core features, FAQs, and Google Chrome CrUX telemetry.
              </p>
            </>
          ) : (
            <>
              <div className="manuscript-grid">
                {(['headline', 'subhead', 'pricing', 'cta'] as const).map(key => (
                  <div key={key}>
                    <label htmlFor={`copy-${key}`} style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {({
                        headline: 'Hero headline (required)',
                        subhead: 'Value statement & subhead',
                        pricing: 'Pricing model & tier terms',
                        cta: 'Primary call to action'
                      })[key]}
                    </label>
                    <input
                      id={`copy-${key}`}
                      className="editorial-input"
                      required={key === 'headline'}
                      maxLength={2000}
                      value={copy[key]}
                      onChange={event => setCopy(prev => ({ ...prev, [key]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <button className="btn-editorial-primary" type="submit" style={{ marginTop: '0.75rem' }}>
                {isLoading ? 'Deliberating swarm…' : 'Run 50-Agent Swarm on Manuscript'}
              </button>
            </>
          )}

          {/* Sample Presets */}
          <div className="control-row sample-row" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-rule)' }}>
            <span className="mono-tag" style={{ color: 'var(--ink-muted)' }}>Test live enterprise presets:</span>
            {SAMPLES.map(sample => (
              <button
                key={sample.url}
                type="button"
                className="sample-button"
                onClick={() => onAnalyze(sample.url, undefined, true)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      {/* Extraction Blueprint Inspection Panel */}
      {manifest && showBlueprintDrawer && (
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="mono-tag" style={{ color: '#15803D', fontWeight: 700 }}>
                ✓ EXTRACTED KNOWLEDGE MANIFEST
              </span>
              <span style={{ fontSize: '0.8rem', background: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                Framework: <strong>{manifest.technicalSignals.frameworkDetected || 'Web'}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', background: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                Pricing Model: <strong>{manifest.pricing.model}</strong>
              </span>
            </div>
            <button
              onClick={() => setShowBlueprintDrawer(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6B7280' }}
            >
              ✕
            </button>
          </div>

          {/* Extracted Tiers */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Detected Pricing Tiers ({manifest.pricing.tiers.length})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {manifest.pricing.tiers.length > 0 ? (
                manifest.pricing.tiers.map((tier, idx) => (
                  <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#111827' }}>{tier.name}</strong>: <span style={{ color: '#C2410C' }}>{tier.price}</span>
                    {tier.features.length > 0 && (
                      <span style={{ color: '#6B7280', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({tier.features.slice(0, 2).join(', ')})
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
                  No multi-tier table found. Summary: {manifest.pricing.rawText}
                </span>
              )}
            </div>
          </div>

          {/* Extracted Features */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Extracted Core Features ({manifest.features.length})
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {manifest.features.map((feat, idx) => (
                <span key={idx} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '0.25rem 0.65rem', fontSize: '0.75rem', color: '#1F2937' }}>
                  ✦ {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Extracted FAQs */}
          {manifest.faqs.length > 0 && (
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Extracted FAQs ({manifest.faqs.length})
              </span>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {manifest.faqs.slice(0, 3).map((faq, idx) => (
                  <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>
                    <strong style={{ color: '#111827' }}>Q: {faq.question}</strong>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563', fontSize: '0.75rem' }}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
