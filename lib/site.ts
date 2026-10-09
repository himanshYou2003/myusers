export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  features: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProductKnowledgeManifest {
  url: string;
  title: string;
  brandName: string;
  hero: {
    headline: string;
    subhead: string;
    primaryCta: string;
    secondaryCta?: string;
  };
  pricing: {
    hasPricing: boolean;
    rawText: string;
    model: 'free' | 'freemium' | 'subscription' | 'usage-based' | 'enterprise-quote' | 'undisclosed';
    tiers: PricingTier[];
  };
  features: string[];
  faqs: FaqItem[];
  socialProof: {
    customerLogos: string[];
    metrics: string[];
    testimonials: string[];
  };
  technicalSignals: {
    frameworkDetected?: string;
    viewportConfigured: boolean;
    metaDescription?: string;
  };
}

export interface SiteCopy {
  headline: string;
  subhead: string;
  pricing: string;
  cta: string;
}

export interface SiteData extends SiteCopy {
  url: string;
  source: 'sample' | 'manuscript' | 'website';
  warnings: string[];
  manifest?: ProductKnowledgeManifest;
}

export const SAMPLES: Array<SiteData & { label: string }> = [
  { label: 'B2B Invoicing SaaS', url: 'https://apexinvoice.io', source: 'sample', warnings: [], headline: 'Next-Gen Intelligent Revenue Orchestration for Modern Ecosystems', subhead: 'Leverage decentralized primitives to synergize your multi-currency cashflows in real-time.', pricing: '$149 / mo (Billed Annually)', cta: 'Request Enterprise Consultation' },
  { label: 'AI Video Studio', url: 'https://luminastudio.ai', source: 'sample', warnings: [], headline: 'Generative Diffusion Pipeline for Digital Cinephiles', subhead: 'Turn your scripts into videos using our online video editor.', pricing: '$19 / month', cta: 'Join Waitlist' },
  { label: 'D2C Running Shoes', url: 'https://cloudstrides.store', source: 'sample', warnings: [], headline: 'Comfortable Running Shoes for Your Daily Run', subhead: 'Lightweight shoes with cushioned soles and a 30-day return policy.', pricing: '$180 + $15 Shipping', cta: 'Shop Running Shoes' }
];

export function validateCopy(value: unknown): SiteCopy {
  if (!value || typeof value !== 'object') throw new Error('Provide a headline and page copy.');
  const data = value as Record<string, unknown>;
  const copy = {} as SiteCopy;
  for (const key of ['headline', 'subhead', 'pricing', 'cta'] as const) {
    if (typeof data[key] !== 'string' || data[key].length > 2000) throw new Error(`Invalid ${key}; use up to 2,000 characters.`);
    copy[key] = data[key].trim();
  }
  if (!copy.headline) throw new Error('A headline is required.');
  return copy;
}

// Editorial suggestions preserve commercial terms and introduce no unverified promises.
export function suggestCopy(copy: SiteCopy): SiteCopy {
  const replacements: Record<string, string> = { 'next-gen': '', 'next-generation': '', intelligent: '', orchestration: 'management', ecosystems: 'teams', leverage: 'use', decentralized: '', primitives: 'tools', synergize: 'connect', 'multi-modal': '', 'hyper-realistic': '', 'generative diffusion pipeline': 'AI video tools', 'digital cinephiles': 'video creators' };
  const simplify = (text: string) => {
    for (const [word, replacement] of Object.entries(replacements)) text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), replacement);
    return text.replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase());
  };
  return { ...copy, headline: simplify(copy.headline), subhead: simplify(copy.subhead), cta: /request.*consultation/i.test(copy.cta) ? 'Talk to our team' : copy.cta };
}
