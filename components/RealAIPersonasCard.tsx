'use client';
import React from 'react';
import type { RealAIAnalysisResult, AIPersonaEvaluation } from '../lib/gemini';

interface Props {
  analysis: RealAIAnalysisResult | null;
  isLoading: boolean;
  error?: string;
  onSelectPersona?: (persona: AIPersonaEvaluation) => void;
  selectedPersonaId?: string;
}

export function RealAIPersonasCard({ analysis, isLoading, error, onSelectPersona, selectedPersonaId }: Props) {
  if (isLoading) {
    return (
      <section className="editorial-card ai-personas-card" aria-label="Real AI Persona Evaluation">
        <div className="section-heading">
          <div>
            <span className="mono-tag live-tag">GOOGLE GEMINI 2.0 AI EVALUATION</span>
            <p>Simulating 4 authentic executive buyers analyzing copy…</p>
          </div>
        </div>
        <div className="vitals-loading-skeleton">
          <div className="pulse-bar" />
          <p className="muted">Running deep LLM evaluation on real extracted copy, testing pricing pushback, and diagnosing conversion blockers…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="editorial-card ai-personas-card" aria-label="Real AI Persona Evaluation">
        <div className="section-heading">
          <div>
            <span className="mono-tag error-tag">AI ANALYSIS NOTICE</span>
            <p>Evaluation unavailable</p>
          </div>
        </div>
        <p className="muted">{error}</p>
      </section>
    );
  }

  if (!analysis) return null;

  return (
    <section className="editorial-card ai-personas-card" aria-label="Real AI Persona Evaluation">
      <div className="section-heading">
        <div>
          <span className="mono-tag live-tag">
            {analysis.source === 'google_gemini_ai' ? 'LIVE GOOGLE GEMINI 2.0 FLASH AI' : 'INTELLIGENT HEURISTIC AUDIT'}
          </span>
          <p>Real Buyer Archetype Objections & Conversion Verdicts</p>
        </div>
        <div className="overall-ai-score">
          <span className="score-num">{analysis.overallConversionScore}%</span>
          <span className="score-lbl">Buyer Consensus</span>
        </div>
      </div>

      <div className="ai-executive-summary">
        <p><strong>Executive Synthesis:</strong> {analysis.executiveSummary}</p>
      </div>

      <div className="ai-persona-grid">
        {analysis.personas.map(persona => {
          const isSelected = selectedPersonaId === persona.personaId;
          const isConverted = persona.status === 'CONVERTED';

          return (
            <div
              key={persona.personaId}
              className={`persona-feedback-card ${isSelected ? 'selected' : ''} ${isConverted ? 'converted' : 'bounced'}`}
              onClick={() => onSelectPersona?.(persona)}
              role="button"
              tabIndex={0}
            >
              <div className="persona-card-top">
                <div>
                  <h4 className="persona-name">{persona.name}</h4>
                  <span className="persona-role-badge">{persona.role}</span>
                </div>
                <span className={`status-pill ${isConverted ? 'status-pass' : 'status-fail'}`}>
                  {isConverted ? 'Converts' : 'Bounces'}
                </span>
              </div>

              <div className="persona-meters">
                <div className="meter-item">
                  <span>Clarity</span>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${persona.clarityRating}%` }} />
                  </div>
                  <span className="meter-pct">{persona.clarityRating}%</span>
                </div>
                <div className="meter-item">
                  <span>Intent</span>
                  <div className="meter-bar">
                    <div className="meter-fill intent" style={{ width: `${persona.conversionProbability}%` }} />
                  </div>
                  <span className="meter-pct">{persona.conversionProbability}%</span>
                </div>
              </div>

              <p className="persona-verdict">“{persona.verdict}”</p>

              <div className="persona-objection-block">
                <strong>Primary Objection:</strong>
                <p>{persona.primaryObjection}</p>
              </div>

              <div className="persona-fix-block">
                <strong>Recommended Fix:</strong>
                <p>{persona.recommendedFix}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
