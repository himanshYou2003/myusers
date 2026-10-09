import type { ProductKnowledgeManifest } from './site';

export interface AIPersonaEvaluation {
  personaId: string;
  name: string;
  role: string;
  archetype: 'procurement' | 'frugal_smb' | 'non_tech' | 'growth_lead';
  status: 'CONVERTED' | 'BOUNCED';
  clarityRating: number; // 0-100
  conversionProbability: number; // 0-100
  verdict: string;
  primaryObjection: string;
  recommendedFix: string;
}

export interface RealAIAnalysisResult {
  source: 'google_gemini_ai' | 'smart_heuristic';
  overallConversionScore: number;
  executiveSummary: string;
  personas: AIPersonaEvaluation[];
  suggestedHeadline: string;
  suggestedSubhead: string;
  suggestedCta: string;
}

const PERSONA_PROMPTS = [
  {
    personaId: 'p_enterprise',
    name: 'Elena Rostova',
    role: 'Enterprise Procurement & Security Director',
    archetype: 'procurement' as const,
    focus: 'Demands proof of security, compliance, clear ROI, transparent enterprise contract terms, and hates buzzwords.'
  },
  {
    personaId: 'p_frugal',
    name: 'Marcus Chen',
    role: 'Bootstrapped SaaS Founder',
    archetype: 'frugal_smb' as const,
    focus: 'Extremely price sensitive. Wants to see upfront pricing, no hidden annual traps, and immediate self-serve utility.'
  },
  {
    personaId: 'p_nontech',
    name: 'Sarah Jenkins',
    role: 'Operations & Practice Manager',
    archetype: 'non_tech' as const,
    focus: 'Non-technical decision maker. Alienated by developer jargon. Needs to understand plain business workflow benefits in 5 seconds.'
  },
  {
    personaId: 'p_growth',
    name: 'Alex Rivera',
    role: 'VP of Growth & Conversion',
    archetype: 'growth_lead' as const,
    focus: 'Conversion rate expert. Analyzes value proposition clarity, friction in the CTA, and cognitive load.'
  }
];

export async function evaluateCopyWithGemini(
  copy: { headline: string; subhead?: string; pricing?: string; cta?: string; url?: string; manifest?: ProductKnowledgeManifest },
  apiKey?: string,
  signal?: AbortSignal
): Promise<RealAIAnalysisResult> {
  const key = apiKey || process.env.GEMINI_API_KEY || '';

  if (!key) {
    // Graceful smart heuristic fallback if no key is entered yet
    return getFallbackSmartEvaluation(copy);
  }

  const manifest = copy.manifest;
  const tiersContext = manifest?.pricing?.tiers && manifest.pricing.tiers.length > 0
    ? manifest.pricing.tiers.map(t => `- Tier "${t.name}": ${t.price} (${t.features.slice(0, 3).join(', ') || 'standard capabilities'})`).join('\n')
    : copy.pricing || 'Not disclosed';

  const featuresContext = manifest?.features && manifest.features.length > 0
    ? manifest.features.slice(0, 6).map(f => `- ${f}`).join('\n')
    : 'None explicitly extracted';

  const faqsContext = manifest?.faqs && manifest.faqs.length > 0
    ? manifest.faqs.slice(0, 3).map(q => `Q: ${q.question} -> A: ${q.answer}`).join('\n')
    : 'None';

  const prompt = `You are evaluating a website landing page from the perspective of 4 distinct prospective buyers.
Website: ${manifest?.brandName || copy.url || 'Product landing page'} (${copy.url || 'No URL'})
Hero Headline: "${copy.headline}"
Subhead: "${copy.subhead || 'None'}"
Pricing Summary: "${copy.pricing || 'Not disclosed'}" (Model: ${manifest?.pricing?.model || 'subscription'})
Call to Action (CTA): "${copy.cta || 'None'}"

Detected Pricing Matrix:
${tiersContext}

Extracted Core Capabilities & Features:
${featuresContext}

Extracted FAQs / Guarantees:
${faqsContext}

Evaluate how each of these 4 real personas would react with deep specificity regarding the headline, pricing tiers, and features:
1. Elena Rostova (Enterprise Procurement Director): Cares about compliance, risk, concrete proof, zero jargon.
2. Marcus Chen (Bootstrapped SaaS Founder): Cares about price transparency, ROI, self-serve access, no hidden costs.
3. Sarah Jenkins (Operations Manager): Non-technical. Wants plain English, clear daily workflow benefits, zero tech buzzwords.
4. Alex Rivera (VP of Growth): Cares about CTA friction, value proposition punchiness, bounce triggers.

Respond ONLY with valid JSON in this exact structure:
{
  "overallConversionScore": <number between 0 and 100>,
  "executiveSummary": "<2-sentence synthesis of how real buyers perceive this copy>",
  "suggestedHeadline": "<punchy, clear alternative headline>",
  "suggestedSubhead": "<benefit-driven subhead>",
  "suggestedCta": "<low-friction call to action>",
  "personas": [
    {
      "personaId": "p_enterprise",
      "name": "Elena Rostova",
      "role": "Enterprise Procurement & Security Director",
      "archetype": "procurement",
      "status": "<CONVERTED or BOUNCED>",
      "clarityRating": <0-100>,
      "conversionProbability": <0-100>,
      "verdict": "<1-2 sentence real reaction>",
      "primaryObjection": "<specific complaint about the copy>",
      "recommendedFix": "<specific advice>"
    },
    {
      "personaId": "p_frugal",
      "name": "Marcus Chen",
      "role": "Bootstrapped SaaS Founder",
      "archetype": "frugal_smb",
      "status": "<CONVERTED or BOUNCED>",
      "clarityRating": <0-100>,
      "conversionProbability": <0-100>,
      "verdict": "<1-2 sentence real reaction>",
      "primaryObjection": "<specific complaint about the copy>",
      "recommendedFix": "<specific advice>"
    },
    {
      "personaId": "p_nontech",
      "name": "Sarah Jenkins",
      "role": "Operations & Practice Manager",
      "archetype": "non_tech",
      "status": "<CONVERTED or BOUNCED>",
      "clarityRating": <0-100>,
      "conversionProbability": <0-100>,
      "verdict": "<1-2 sentence real reaction>",
      "primaryObjection": "<specific complaint about the copy>",
      "recommendedFix": "<specific advice>"
    },
    {
      "personaId": "p_growth",
      "name": "Alex Rivera",
      "role": "VP of Growth & Conversion",
      "archetype": "growth_lead",
      "status": "<CONVERTED or BOUNCED>",
      "clarityRating": <0-100>,
      "conversionProbability": <0-100>,
      "verdict": "<1-2 sentence real reaction>",
      "primaryObjection": "<specific complaint about the copy>",
      "recommendedFix": "<specific advice>"
    }
  ]
}`;

  // Try active Gemini models in order of availability and speed
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.7-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        }),
        signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini API (${model}) error (${response.status}): ${text.slice(0, 120)}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response received from Gemini.');

      const parsed = JSON.parse(rawText) as RealAIAnalysisResult;
      return {
        ...parsed,
        source: 'google_gemini_ai'
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Graceful fallback to smart heuristic evaluation if all remote models fail or quota exceeded
  console.warn('Gemini AI evaluation unavailable, activating smart heuristic fallback:', lastError?.message);
  return getFallbackSmartEvaluation(copy);
}

function getContextAwarePersonaResponse(
  message: string,
  persona: { name: string; role: string; archetype: string; painPoint?: string; status?: string },
  site: { headline: string; subhead?: string; pricing?: string; cta?: string; manifest?: ProductKnowledgeManifest }
): string {
  const isRating = /rate|rating|score|how much|evaluate|\bout of 10\b/i.test(message);
  const isCli = /cli|terminal|command|tool|dev|code|engineering/i.test(message);
  const isPrice = /price|pricing|cost|budget|expensive|free|tier/i.test(message);

  if (isRating) {
    const score = persona.status === 'CONVERTED' ? 8 : 4.5;
    return `Speaking as ${persona.role}, I would rate this a ${score}/10. ${persona.status === 'CONVERTED' ? 'The core value proposition addresses our daily operational requirements.' : `My primary hesitation is: ${persona.painPoint || 'lack of verified technical proof and transparent pricing'}.`} ${isCli ? 'For developer and CLI tooling, we need explicit terminal ergonomics and zero build-pipeline latency before rolling it out.' : ''}`.trim();
  }
  if (isCli) {
    return `Speaking as ${persona.role}, terminal and developer ergonomics are vital. If the CLI executes cleanly in CI/CD without unexpected breaks, it solves a real bottleneck; otherwise, my primary priority remains: ${persona.painPoint || 'security and workflow clarity'}.`;
  }
  if (isPrice) {
    return `On pricing, "${site.pricing || 'undisclosed'}" is the key factor. For my budget as ${persona.role}, I need guaranteed ROI and transparent monthly tiers rather than hidden enterprise contact forms.`;
  }
  return `As ${persona.role}, regarding "${message}": My decision is driven by: ${persona.painPoint || 'clear technical evidence'}. If the landing page provides verified technical proof for that, I am ready to trial.`;
}

export async function chatWithAIPersona(
  message: string,
  persona: { name: string; role: string; archetype: string; painPoint?: string; status?: string },
  site: { headline: string; subhead?: string; pricing?: string; cta?: string; manifest?: ProductKnowledgeManifest },
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY || '';
  if (!key) {
    return getContextAwarePersonaResponse(message, persona, site);
  }

  const manifest = site.manifest;
  const tiersDesc = manifest?.pricing?.tiers?.length
    ? manifest.pricing.tiers.map(t => `${t.name}: ${t.price}`).join(', ')
    : site.pricing || 'Not disclosed';

  const prompt = `You are roleplaying as ${persona.name}, whose professional role is "${persona.role}".
Your primary operational concern is: "${persona.painPoint || 'Practical workflow value and transparent pricing'}".
Your current stance: ${persona.status === 'CONVERTED' ? 'CONVERTED (favorable advocate, see clear value)' : 'BOUNCED (skeptical, have reservations)'}.

You are evaluating this product & landing page:
- Brand: "${manifest?.brandName || 'Product'}"
- Headline: "${site.headline}"
- Subhead: "${site.subhead || 'None'}"
- Pricing Model: "${manifest?.pricing?.model || 'subscription'}" (Tiers: ${tiersDesc})
- Key Capabilities: "${manifest?.features?.slice(0, 5).join(', ') || 'Standard capabilities'}"
- Call to Action: "${site.cta || 'None'}"

The user asks you directly: "${message}".

MANDATORY DIRECTIVES:
1. DIRECTLY AND SPECIFICALLY ANSWER what the user asked.
   - If asked for a rating or score (e.g. "how much you'll rate this application and CLI"), PROVIDE a clear numerical rating out of 10 (e.g., "I'd rate this a 7/10...") with an honest technical justification from your role's perspective.
   - If asked about CLI, terminal workflow, security, or specific features, address those exact technical topics with authentic professional insight.
2. DO NOT use generic canned formulas or repeat boilerplate like 'I understand headline and would consider next step'.
3. Speak naturally in first-person ("I..."), reflecting your specific role's skepticism, excitement, or budget reality.
4. Keep the answer concise: 2 to 4 sentences.`;

  const models = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.7-flash'];
  let lastChatError: Error | null = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
        }),
        signal
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const errText = await response.text();
        lastChatError = new Error(`Gemini Chat (${model}) error: HTTP ${response.status} - ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      lastChatError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Gracefully return context-aware persona response if upstream Google API is unavailable or rate-limited
  console.warn('Gemini chat unavailable, returning context-aware persona answer:', lastChatError?.message);
  return getContextAwarePersonaResponse(message, persona, site);
}

function getFallbackSmartEvaluation(copy: { headline: string; subhead?: string; pricing?: string; cta?: string }): RealAIAnalysisResult {
  const hasPrice = Boolean(copy.pricing && copy.pricing.trim());
  const hasCta = Boolean(copy.cta && copy.cta.trim());
  const words = copy.headline.split(/\s+/).filter(Boolean).length;
  const isJargonHeavy = /\b(orchestrat|synerg|ecosystem|next-gen|paradigm|seamless|holistic)\b/i.test(copy.headline);

  const score = Math.max(15, Math.min(85, (hasPrice ? 35 : 10) + (hasCta ? 25 : 5) + (!isJargonHeavy ? 20 : 0) + (words < 10 ? 10 : 0)));

  return {
    source: 'smart_heuristic',
    overallConversionScore: score,
    executiveSummary: `Evaluated without live LLM. Page ${hasPrice ? 'includes upfront pricing' : 'omits upfront pricing'}, and the headline has ${words} words. Connect a free Google Gemini key for deep LLM reasoning.`,
    suggestedHeadline: copy.headline.replace(/orchestrat\w+|synerg\w+|next-gen/gi, 'streamlined').slice(0, 120),
    suggestedSubhead: copy.subhead || 'Deliver clear business results with faster onboarding and transparent pricing.',
    suggestedCta: copy.cta || 'Start free trial',
    personas: PERSONA_PROMPTS.map(p => {
      const converted = p.archetype === 'frugal_smb' ? hasPrice : p.archetype === 'non_tech' ? !isJargonHeavy : score >= 50;
      return {
        personaId: p.personaId,
        name: p.name,
        role: p.role,
        archetype: p.archetype,
        status: converted ? 'CONVERTED' : 'BOUNCED',
        clarityRating: !isJargonHeavy ? 80 : 40,
        conversionProbability: converted ? 65 : 25,
        verdict: converted
          ? `The value proposition addresses my core responsibilities as ${p.role}.`
          : `I am reluctant to move forward because ${p.focus.toLowerCase()}`,
        primaryObjection: p.archetype === 'frugal_smb' && !hasPrice
          ? 'No clear pricing displayed; I cannot commit without budget visibility.'
          : p.archetype === 'non_tech' && isJargonHeavy
          ? 'The headline language feels too abstract for my daily workflow.'
          : 'Requires more concrete social proof and immediate benefit clarity.',
        recommendedFix: p.archetype === 'frugal_smb'
          ? 'Display a clear self-serve tier or transparent pricing.'
          : 'Translate technical capabilities into concrete time or dollar savings.'
      };
    })
  };
}
