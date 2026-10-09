import type { SiteCopy, SiteData, ProductKnowledgeManifest } from './site';
import type { AgentNode } from './personas';

export type QuestionSiteInput = SiteCopy | SiteData | (Partial<SiteData> & { headline: string; subhead?: string; pricing?: string; cta?: string; url?: string });

/**
 * Dynamically generates 4-5 contextual questions tailored to the target website,
 * its extracted headline, pricing tiers, CTA friction, and technical signals.
 */
export function getDynamicWebsiteQuestions(
  site: QuestionSiteInput,
  manifest?: ProductKnowledgeManifest
): string[] {
  const mf = manifest || (site as SiteData).manifest;
  const rawUrl = (site as SiteData).url || '';
  const domain = rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || '';
  const brand =
    mf?.brandName ||
    (domain ? domain.split('.')[0].toUpperCase() : 'this product');
  const headline = site.headline ? site.headline.trim() : '';
  const pricing = (site.pricing || mf?.pricing?.rawText || '').trim();
  const cta = (site.cta || mf?.hero?.primaryCta || '').trim();
  const features = mf?.features || [];

  const questions: string[] = [];

  // 1. Headline & Positioning Query (Website-specific)
  if (headline && headline.length > 5) {
    const shortHeadline = headline.length > 40 ? headline.slice(0, 38) + '…' : headline;
    questions.push(`Is "${shortHeadline}" clear or confusing for your workflow?`);
  } else if (domain) {
    questions.push(`Does ${domain} clearly communicate its core value proposition?`);
  } else {
    questions.push(`Does the headline clearly communicate what ${brand} delivers?`);
  }

  // 2. Pricing & Budget Query (Website-specific)
  if (pricing && pricing !== 'Not disclosed' && pricing !== 'undisclosed' && pricing.length > 2) {
    const shortPricing = pricing.length > 30 ? pricing.slice(0, 28) + '…' : pricing;
    questions.push(`Is ${shortPricing} considered fair ROI or too expensive?`);
  } else if (domain) {
    questions.push(`Why would visitors bounce without transparent pricing on ${domain}?`);
  } else {
    questions.push(`Why would buyers resist without upfront pricing on ${brand}?`);
  }

  // 3. Technical / Feature / Capability Query
  const isCliOrDev = /cli|terminal|agent|referee|api|sdk|code|dev|git|pipeline|model|github/i.test(
    `${headline} ${cta} ${features.join(' ')} ${rawUrl}`
  );
  if (isCliOrDev) {
    questions.push(`How would your engineering team rate this developer tool out of 10?`);
  } else if (features.length > 0) {
    const feat = features[0].length > 32 ? features[0].slice(0, 30) + '…' : features[0];
    questions.push(`Does "${feat}" solve your daily operational pain?`);
  } else if (domain) {
    questions.push(`What core capability is missing on ${domain} for team adoption?`);
  } else {
    questions.push(`What core capability is missing for your team's adoption?`);
  }

  // 4. CTA / Friction / Skeptic Objection Query
  if (cta && cta.length > 2 && cta.toLowerCase() !== 'none') {
    const shortCta = cta.length > 26 ? cta.slice(0, 24) + '…' : cta;
    questions.push(`Why would skeptics hesitate to click "${shortCta}"?`);
  } else if (domain) {
    questions.push(`What single change on ${domain} would convince skeptics to convert?`);
  } else {
    questions.push(`What single change would convince skeptics to convert on ${brand}?`);
  }

  // 5. Tier / Enterprise specific
  if (mf?.pricing?.tiers && mf.pricing.tiers.length > 0) {
    const tierName = mf.pricing.tiers[0].name;
    questions.push(`Does the "${tierName}" tier provide enough value to justify buying?`);
  }

  return questions.slice(0, 4);
}

/**
 * Dynamically generates 3-4 1-on-1 questions tailored to a specific persona
 * and the specific website they just experienced.
 */
export function getPersonaSpecificQuestions(
  agent: AgentNode,
  site: QuestionSiteInput,
  manifest?: ProductKnowledgeManifest
): string[] {
  const mf = manifest || (site as SiteData).manifest;
  const rawUrl = (site as SiteData).url || '';
  const domain = rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || '';
  const brand =
    mf?.brandName ||
    (domain ? domain.split('.')[0].toUpperCase() : 'this site');
  const headline = site.headline ? site.headline.trim() : '';
  const pricing = (site.pricing || mf?.pricing?.rawText || '').trim();
  const cta = (site.cta || mf?.hero?.primaryCta || '').trim();

  const isBounced = agent.status === 'BOUNCED';
  const shortHeadline = headline.length > 32 ? headline.slice(0, 30) + '…' : headline;
  const shortCta = cta.length > 22 ? cta.slice(0, 20) + '…' : cta;

  if (isBounced) {
    const list = [
      `Why did you personally bounce from ${brand}?`,
      shortHeadline ? `Did "${shortHeadline}" resonate with your daily priorities?` : `What confused you most about ${brand}?`,
      pricing && pricing !== 'Not disclosed' ? `Is ${pricing} outside your team's budget?` : `Why did missing pricing stop you from signing up?`,
      shortCta ? `What stopped you from clicking "${shortCta}"?` : `What single change would turn you into a buyer?`
    ];
    return list.slice(0, 4);
  } else {
    const list = [
      `What convinced you to convert on ${brand}?`,
      shortHeadline ? `How well does "${shortHeadline}" deliver for your role?` : `Which part of ${brand} gave you the most confidence?`,
      shortCta ? `Did clicking "${shortCta}" feel low-risk to you?` : `What makes ${brand} worth recommending to peers?`,
      `How would you defend buying ${brand} to skeptical teammates?`
    ];
    return list.slice(0, 4);
  }
}
