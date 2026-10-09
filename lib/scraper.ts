import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';
import type { SiteData, ProductKnowledgeManifest, PricingTier, FaqItem } from './site';

export function publicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}

export function parsePublicUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input.includes('://') ? input : `https://${input}`); }
  catch { throw new Error('Enter a valid public website URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw new Error('Use a public HTTP or HTTPS website on its standard port.');
  if (url.hostname === 'localhost' || /\.(local|localhost|internal)$/i.test(url.hostname)) throw new Error('Private network destinations are not supported.');
  return url;
}

/**
 * Deep Semantic Extraction: Parses the entire DOM, JSON-LD schemas,
 * OpenGraph meta, pricing tables, features, FAQs, and social proof.
 */
export function extractCopy(html: string, url: string): SiteData {
  const $ = load(html);
  const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

  // 1. Technical Signals & Framework Detection
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const metaDesc = clean($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '');
  let frameworkDetected = 'Standard Web';
  if ($('script[id="__NEXT_DATA__"]').length > 0 || html.includes('__next')) frameworkDetected = 'Next.js';
  else if (html.includes('framer.com') || $('html[data-framer-generated]').length > 0) frameworkDetected = 'Framer';
  else if (html.includes('webflow') || $('html[data-wf-page]').length > 0) frameworkDetected = 'Webflow';
  else if (html.includes('wp-content')) frameworkDetected = 'WordPress';
  else if (html.includes('cdn.shopify.com')) frameworkDetected = 'Shopify';

  // 2. JSON-LD Structured Data Harvest
  let jsonLdBrand = '';
  let jsonLdHeadline = '';
  let jsonLdDescription = '';
  const jsonLdFaqs: FaqItem[] = [];
  const jsonLdOffers: PricingTier[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).text();
      if (!raw) return;
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const type = item['@type'];

        if (item.name && typeof item.name === 'string') {
          if (!jsonLdHeadline && (type === 'SoftwareApplication' || type === 'Product' || type === 'WebSite')) {
            jsonLdHeadline = clean(item.name);
          }
          if (!jsonLdBrand && (type === 'Organization' || type === 'Brand')) {
            jsonLdBrand = clean(item.name);
          }
        }

        if (item.description && typeof item.description === 'string' && !jsonLdDescription) {
          jsonLdDescription = clean(item.description);
        }

        // FAQs in JSON-LD
        if (type === 'FAQPage' && Array.isArray(item.mainEntity)) {
          for (const q of item.mainEntity) {
            if (q.name && q.acceptedAnswer?.text) {
              jsonLdFaqs.push({
                question: clean(q.name),
                answer: clean(q.acceptedAnswer.text).slice(0, 300)
              });
            }
          }
        }

        // Offers / Pricing in JSON-LD
        if (item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const off of offers) {
            if (off && (off.price !== undefined || off.priceSpecification)) {
              const priceVal = off.price || off.priceSpecification?.price || '0';
              const curr = off.priceCurrency || '$';
              jsonLdOffers.push({
                name: off.name || 'Standard Tier',
                price: `${curr}${priceVal}`,
                period: off.priceSpecification?.billingDuration || 'mo',
                features: []
              });
            }
          }
        }
      }
    } catch {
      /* ignore invalid JSON-LD script blocks */
    }
  });

  // 3. Brand & Page Title
  const ogTitle = clean($('meta[property="og:title"]').attr('content') || '');
  const docTitle = clean($('title').text() || '');
  const brandName = jsonLdBrand || clean($('meta[property="og:site_name"]').attr('content') || '') || docTitle.split(/[-–|]/)[0]?.trim() || 'Product';

  // 4. Hero Headline & Subhead
  // Prioritize primary h1, then JSON-LD, then OG title, then doc title
  const h1 = clean($('main h1, section h1, h1').first().text());
  const headline = clean(h1 || jsonLdHeadline || ogTitle || docTitle).slice(0, 2000);
  if (!headline) {
    throw new Error('No readable headline found. This site may require JavaScript; paste its copy instead.');
  }

  // Subhead: look for paragraphs directly following the h1 or prominent lead paragraphs
  const heroP = clean($('h1').first().nextAll('p').first().text()) ||
                clean($('main p, section p, p').first().text());
  const subhead = clean(heroP || jsonLdDescription || metaDesc).slice(0, 2000);

  // 5. Actions & CTAs
  const buttonTexts: string[] = [];
  $('a, button').each((_, el) => {
    const txt = clean($(el).text());
    if (txt && txt.length >= 3 && txt.length <= 40) {
      buttonTexts.push(txt);
    }
  });

  const ctaRegex = /\b(get started|try free|start free|sign up|start trial|book demo|schedule demo|join waitlist|download|request access|buy now|start now)\b/i;
  const primaryCta = buttonTexts.find(t => ctaRegex.test(t)) || buttonTexts[0] || 'Get started';
  const secondaryCta = buttonTexts.find(t => t !== primaryCta && /\b(learn more|see docs|watch demo|contact sales|pricing|features)\b/i.test(t));

  // 6. Deep Pricing Matrix Harvest
  const detectedTiers: PricingTier[] = [...jsonLdOffers];
  let rawPricingSnippet = '';

  // Scan pricing card elements
  $('[class*="pricing"], [class*="plan"], [class*="tier"]').each((_, el) => {
    const card = $(el);
    const cardText = clean(card.text());
    const tierNameMatch = card.find('h2, h3, h4, [class*="name"], [class*="title"]').first().text();
    const priceMatch = cardText.match(/([$€£₹]\s?\d[\d,.]*(?:\s*(?:\/|per)\s*(?:mo(?:nth)?|year|yr|user|seat))?)/i);

    if (priceMatch && tierNameMatch) {
      const tierName = clean(tierNameMatch).slice(0, 30);
      const priceStr = clean(priceMatch[0]);
      if (!detectedTiers.some(t => t.name.toLowerCase() === tierName.toLowerCase())) {
        const featureBullets: string[] = [];
        card.find('li').each((_, li) => {
          const bullet = clean($(li).text());
          if (bullet && bullet.length < 80) featureBullets.push(bullet);
        });

        detectedTiers.push({
          name: tierName,
          price: priceStr,
          period: priceStr.includes('yr') || priceStr.includes('year') ? 'yr' : 'mo',
          features: featureBullets.slice(0, 4)
        });
      }
    }
  });

  // Global body pricing regex fallback
  const bodyText = clean($('body').text());
  const bodyPriceMatch = bodyText.match(/(?:[$€£₹]\s?\d[\d,.]*(?:\s*(?:\/|per)\s*(?:mo(?:nth)?|year|yr|week))?(?:\s*\(?billed\s+(?:annually|monthly)\)?)?)/i);
  if (bodyPriceMatch) {
    rawPricingSnippet = bodyPriceMatch[0];
  } else if (detectedTiers.length > 0) {
    rawPricingSnippet = `${detectedTiers[0].name}: ${detectedTiers[0].price}`;
  } else if (/free trial|14-day trial|30-day trial|start for free/i.test(bodyText)) {
    rawPricingSnippet = 'Free Trial (Card optional)';
  } else if (/contact sales|talk to sales|book a call|custom pricing/i.test(bodyText)) {
    rawPricingSnippet = 'Enterprise Quote / Contact Sales';
  }

  // Determine pricing model
  let pricingModel: ProductKnowledgeManifest['pricing']['model'] = 'undisclosed';
  if (/usage-based|pay as you go|per token|per credit|per event/i.test(bodyText)) {
    pricingModel = 'usage-based';
  } else if (detectedTiers.some(t => /free/i.test(t.name) || t.price === '$0') && detectedTiers.length > 1) {
    pricingModel = 'freemium';
  } else if (detectedTiers.length > 0 || /\/mo|\/month|\/year/i.test(rawPricingSnippet)) {
    pricingModel = 'subscription';
  } else if (rawPricingSnippet.toLowerCase().includes('enterprise') || rawPricingSnippet.toLowerCase().includes('contact sales')) {
    pricingModel = 'enterprise-quote';
  } else if (rawPricingSnippet.toLowerCase().includes('free')) {
    pricingModel = 'free';
  }

  // 7. Core Features & Proof Points
  const features: string[] = [];
  $('section, div').filter('[class*="feature"], [class*="benefit"], [class*="grid"]').find('h3, h4, strong').each((_, el) => {
    const text = clean($(el).text());
    if (text.length >= 8 && text.length <= 90 && !features.includes(text) && !buttonTexts.includes(text)) {
      features.push(text);
    }
  });

  // Fallback to list items in body if feature headings were scarce
  if (features.length < 3) {
    $('main ul li, article ul li').each((_, el) => {
      const text = clean($(el).text());
      if (text.length >= 10 && text.length <= 100 && !features.includes(text)) {
        features.push(text);
      }
    });
  }

  // 8. FAQ Harvest
  const faqs: FaqItem[] = [...jsonLdFaqs];
  $('details').each((_, el) => {
    const q = clean($(el).find('summary').text());
    const a = clean($(el).clone().find('summary').remove().end().text());
    if (q && a && !faqs.some(f => f.question === q)) {
      faqs.push({ question: q.slice(0, 120), answer: a.slice(0, 300) });
    }
  });

  $('[class*="faq"], [class*="accordion"]').find('[class*="item"], [class*="question"]').each((_, el) => {
    const q = clean($(el).find('h3, h4, [class*="title"], button').first().text());
    const a = clean($(el).find('p, [class*="answer"], [class*="content"]').first().text());
    if (q && a && q.length > 5 && !faqs.some(f => f.question === q)) {
      faqs.push({ question: q.slice(0, 120), answer: a.slice(0, 300) });
    }
  });

  // 9. Social Proof & Metrics
  const metrics: string[] = [];
  const testimonials: string[] = [];
  bodyText.replace(/(\b\d+[\d,.]*[%kKmMbB]?\+?\s+(?:users|developers|customers|teams|companies|uptime|downloads|stars|reviews)\b)/gi, (match) => {
    if (!metrics.includes(match) && metrics.length < 5) metrics.push(match.trim());
    return match;
  });

  $('blockquote, [class*="testimonial"]').each((_, el) => {
    const quote = clean($(el).text());
    if (quote.length > 20 && quote.length < 250 && testimonials.length < 3) {
      testimonials.push(quote);
    }
  });

  // 10. Compile the Full Knowledge Manifest
  const manifest: ProductKnowledgeManifest = {
    url,
    title: docTitle || headline,
    brandName,
    hero: {
      headline,
      subhead,
      primaryCta,
      secondaryCta
    },
    pricing: {
      hasPricing: Boolean(rawPricingSnippet || detectedTiers.length > 0),
      rawText: rawPricingSnippet || 'Not disclosed',
      model: pricingModel,
      tiers: detectedTiers.slice(0, 5)
    },
    features: features.slice(0, 8),
    faqs: faqs.slice(0, 5),
    socialProof: {
      customerLogos: [],
      metrics,
      testimonials
    },
    technicalSignals: {
      frameworkDetected,
      viewportConfigured: hasViewport,
      metaDescription: metaDesc || undefined
    }
  };

  const warnings: string[] = [
    `Deep semantic extraction complete (${frameworkDetected} detected, ${manifest.features.length} features, ${manifest.pricing.tiers.length} pricing tiers, ${manifest.faqs.length} FAQs).`
  ];
  if (!manifest.pricing.hasPricing) {
    warnings.push('No direct pricing table detected. Personas will assess transparency friction.');
  }

  return {
    url,
    headline,
    subhead,
    pricing: manifest.pricing.rawText,
    cta: primaryCta,
    source: 'website',
    warnings,
    manifest
  };
}

export async function scrapeWebsite(input: string, signal?: AbortSignal): Promise<SiteData> {
  const deadline = Date.now() + 14000;
  let url = parsePublicUrl(input);

  for (let redirect = 0; redirect <= 4; redirect++) {
    if (signal?.aborted || Date.now() >= deadline) throw new Error('Website request timed out. Paste the page copy instead.');
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = await Promise.race([
      lookup(host, { all: true }),
      new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('DNS lookup timed out.')), 3000); timer.unref(); })
    ]);
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('Private or reserved network destinations are not supported.');
    const chosen = addresses[0];

    const response = await new Promise<{ status: number; location?: string; html: string }>((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http;
      const options: https.RequestOptions & { autoSelectFamily: boolean } = {
        signal, autoSelectFamily: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 PersonaPulse/2.0 (landing-page-research)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity'
        },
        lookup: ((_hostname: string, _options: unknown, callback: Function) => callback(null, chosen.address, chosen.family)) as any
      };
      const req = transport.get(url, options, res => {
        const status = res.statusCode || 500;
        if (status >= 300 && status < 400) { res.resume(); resolve({ status, location: res.headers.location, html: '' }); return; }
        if (status < 200 || status >= 300) { res.resume(); reject(new Error(`Website returned HTTP ${status}. Paste the copy to continue.`)); return; }
        if (!/text\/html|application\/xhtml\+xml/i.test(res.headers['content-type'] || '')) { res.resume(); reject(new Error('The destination must be an HTML page.')); return; }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 3_000_000) { req.destroy(new Error('Page exceeds the 3 MB extraction limit.')); return; }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ status, html: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      });
      const timer = setTimeout(() => req.destroy(new Error('Website request timed out. Paste the copy instead.')), Math.max(1, deadline - Date.now()));
      req.on('close', () => clearTimeout(timer));
      req.on('error', reject);
    });

    if (response.status >= 300 && response.status < 400) {
      if (!response.location) throw new Error('Website returned an invalid redirect.');
      url = parsePublicUrl(new URL(response.location, url).href);
      continue;
    }
    return extractCopy(response.html, url.href);
  }
  throw new Error('Too many redirects. Paste the page copy instead.');
}
