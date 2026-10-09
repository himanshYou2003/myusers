// simulation.js - 4-Stage Swarm Simulation Engine, Heatmap Model, and Interrogation Chat for PersonaPulse

export const SAMPLE_TARGET_SITES = {
  saas_invoicing: {
    id: "saas_invoicing",
    name: "ApexInvoice - B2B Billing Automation",
    url: "https://apexinvoice.io",
    category: "B2B SaaS",
    heroHeadline: "Next-Gen Intelligent Revenue Orchestration for Modern Ecosystems",
    heroSubhead: "Leverage decentralized primitives to synergize your multi-currency cashflows in real-time.",
    ctaText: "Request Enterprise Consultation",
    pricing: "$149 / mo (Billed Annually)",
    socialProof: "Trusted by 12 stealth startups",
    sections: [
      { id: "hero", label: "Hero & Headline", scoreBaseline: 52, confusionRisk: 78, copyFeedback: "Too much buzzword soup. Non-tech users don't know what 'decentralized primitives' means." },
      { id: "features", label: "Feature Matrix", scoreBaseline: 64, confusionRisk: 45, copyFeedback: "Features listed without clear benefit outcomes." },
      { id: "pricing", label: "Pricing Section", scoreBaseline: 48, confusionRisk: 82, copyFeedback: "High barrier with annual-only lock-in and no free tier." },
      { id: "cta", label: "Primary Call to Action", scoreBaseline: 58, confusionRisk: 65, copyFeedback: "'Request Consultation' scares away self-serve buyers." }
    ],
    optimizedCopy: {
      heroHeadline: "Send Beautiful Invoices in 60 Seconds & Get Paid 3x Faster",
      heroSubhead: "Automated payment reminders, 1-click credit card payouts, and zero accounting headaches.",
      ctaText: "Start Free 14-Day Trial (No Credit Card Required)",
      pricing: "$29 / mo (Monthly or Annual with 2 Months Free)"
    }
  },
  ai_studio: {
    id: "ai_studio",
    name: "Lumina Studio - AI Video Generator",
    url: "https://luminastudio.ai",
    category: "Creator Tool",
    heroHeadline: "Hyper-Realistic Generative Diffusion Pipeline for Digital Cinephiles",
    heroSubhead: "Unleash transformer-powered neural synthesis directly into your multi-modal creative canvas.",
    ctaText: "Join Waitlist (Position #14,892)",
    pricing: "Custom GPU Token Credits",
    socialProof: "Featured on ProductHunt #4 of the Day",
    sections: [
      { id: "hero", label: "Hero & Headline", scoreBaseline: 62, confusionRisk: 68, copyFeedback: "Intimidating vocabulary. Casual creators feel out of their depth." },
      { id: "features", label: "Feature Matrix", scoreBaseline: 70, confusionRisk: 40, copyFeedback: "Demo video is impressive, but specs are confusing." },
      { id: "pricing", label: "Pricing Section", scoreBaseline: 42, confusionRisk: 88, copyFeedback: "Credit-based token systems cause pricing anxiety." },
      { id: "cta", label: "Primary Call to Action", scoreBaseline: 50, confusionRisk: 70, copyFeedback: "Huge waitlist position discourages immediate impulse signups." }
    ],
    optimizedCopy: {
      heroHeadline: "Turn Text Prompts into 4K Studio Videos in 2 Minutes",
      heroSubhead: "No cameras, no editing skills needed. Type a script and download cinematic MP4s instantly.",
      ctaText: "Generate First Video Free",
      pricing: "$19 / mo for 50 HD Videos"
    }
  },
  ecommerce_sneakers: {
    id: "ecommerce_sneakers",
    name: "CloudStrides - Eco-Friendly Running Shoes",
    url: "https://cloudstrides.store",
    category: "E-Commerce D2C",
    heroHeadline: "Algorithmic Ergonomics for Bio-Mechanical Kinetic Motion",
    heroSubhead: "Engineered with proprietary circular polymers for maximum kinetic energy recovery.",
    ctaText: "Explore Pre-Order Campaign",
    pricing: "$180 + $15 Shipping",
    socialProof: "Voted Best Sneaker by TechCrunch Lifestyle",
    sections: [
      { id: "hero", label: "Hero & Headline", scoreBaseline: 58, confusionRisk: 60, copyFeedback: "Sounds like a robotics lab rather than comfortable running shoes." },
      { id: "features", label: "Feature Matrix", scoreBaseline: 75, confusionRisk: 30, copyFeedback: "Materials look great, but size chart is hidden." },
      { id: "pricing", label: "Pricing Section", scoreBaseline: 55, confusionRisk: 65, copyFeedback: "Unexpected shipping fees at checkout." },
      { id: "cta", label: "Primary Call to Action", scoreBaseline: 60, confusionRisk: 55, copyFeedback: "Pre-order with 8-week delivery delay dampens excitement." }
    ],
    optimizedCopy: {
      heroHeadline: "The Most Comfortable Running Shoes You'll Ever Wear",
      heroSubhead: "Made from 100% recycled ocean plastic. Lightweight cushion that protects your knees on every run.",
      ctaText: "Shop Men & Women (Free Shipping & 30-Day Returns)",
      pricing: "$140 (Free 2-Day Shipping Included)"
    }
  }
};

export class SimulationEngine {
  constructor(targetSite, personas, isOptimized = false) {
    this.site = targetSite;
    this.personas = personas;
    this.isOptimized = isOptimized;
    this.currentStep = 0;
    this.stageStats = [
      { name: "Stage 1: Hero Impression", passCount: 0, bounceCount: 0, topObjection: "" },
      { name: "Stage 2: Value Proposition", passCount: 0, bounceCount: 0, topObjection: "" },
      { name: "Stage 3: Pricing & Objections", passCount: 0, bounceCount: 0, topObjection: "" },
      { name: "Stage 4: Final Conversion", passCount: 0, bounceCount: 0, topObjection: "" }
    ];
  }

  runSimulation() {
    const boost = this.isOptimized ? 25 : 0;

    this.personas.forEach(p => {
      // Stage 1: Hero
      const heroThreshold = (this.isOptimized ? 30 : 60) + (p.traits.skepticism * 0.25) - (p.traits.techLiteracy * 0.15) - boost;
      const roll1 = Math.random() * 100;
      
      if (roll1 > heroThreshold) {
        p.stageHistory.stage1 = { passed: true, thought: "Headline caught my eye. Let's see what they actually do." };
      } else {
        p.stageHistory.stage1 = { passed: false, thought: p.traits.techLiteracy < 40 
          ? "Too much tech jargon. I have no idea what this product actually does." 
          : "Looks like another generic buzzword tool. Not convinced." };
        p.status = 'BOUNCED';
        p.currentStage = 1;
        p.bounceReason = p.stageHistory.stage1.thought;
        return;
      }

      // Stage 2: Value Comprehension
      const valueThreshold = (this.isOptimized ? 25 : 55) + (p.traits.impatience * 0.3) - (p.traits.techLiteracy * 0.1) - boost;
      const roll2 = Math.random() * 100;

      if (roll2 > valueThreshold) {
        p.stageHistory.stage2 = { passed: true, thought: "The features solve a genuine problem I have." };
      } else {
        p.stageHistory.stage2 = { passed: false, thought: p.traits.impatience > 70 
          ? "Too much text to read through. Where is the simple demonstration?" 
          : "Unclear how this is different from what I already use." };
        p.status = 'BOUNCED';
        p.currentStage = 2;
        p.bounceReason = p.stageHistory.stage2.thought;
        return;
      }

      // Stage 3: Pricing Evaluation
      const priceThreshold = (this.isOptimized ? 20 : 65) + (p.traits.priceSensitivity * 0.35) + (p.traits.skepticism * 0.2) - boost;
      const roll3 = Math.random() * 100;

      if (roll3 > priceThreshold) {
        p.stageHistory.stage3 = { passed: true, thought: "Pricing is transparent and justifiable for the value." };
      } else {
        p.stageHistory.stage3 = { passed: false, thought: p.traits.priceSensitivity > 65 
          ? `Way too expensive for my budget (${this.isOptimized ? '$29' : '$149'}). No risk-free trial.` 
          : "Contract terms or pricing tiers feel predatory or opaque." };
        p.status = 'BOUNCED';
        p.currentStage = 3;
        p.bounceReason = p.stageHistory.stage3.thought;
        return;
      }

      // Stage 4: Conversion
      const convertThreshold = (this.isOptimized ? 15 : 45) + (p.traits.impatience * 0.2) - boost;
      const roll4 = Math.random() * 100;

      if (roll4 > convertThreshold) {
        p.stageHistory.stage4 = { passed: true, thought: "I'm signing up right now. The offer is a no-brainer!" };
        p.status = 'PASSED';
        p.currentStage = 4;
        p.thoughtBubble = "Converted! Excited to try it.";
      } else {
        p.stageHistory.stage4 = { passed: false, thought: "Hesitated at the final CTA. Maybe I'll bookmark this for later." };
        p.status = 'BOUNCED';
        p.currentStage = 4;
        p.bounceReason = p.stageHistory.stage4.thought;
      }
    });

    return this.calculateMetrics();
  }

  calculateMetrics() {
    const total = this.personas.length;
    let s1Pass = 0, s2Pass = 0, s3Pass = 0, s4Pass = 0;

    this.personas.forEach(p => {
      if (p.stageHistory.stage1?.passed) s1Pass++;
      if (p.stageHistory.stage2?.passed) s2Pass++;
      if (p.stageHistory.stage3?.passed) s3Pass++;
      if (p.stageHistory.stage4?.passed) s4Pass++;
    });

    const conversionRate = Math.round((s4Pass / total) * 100);
    const clarityScore = Math.round((s1Pass / total) * 100);
    const valueScore = Math.round((s2Pass / total) * 100);
    const priceAcceptance = Math.round((s3Pass / total) * 100);

    const overallScore = Math.round((clarityScore * 0.3) + (valueScore * 0.3) + (priceAcceptance * 0.4));

    // Top objections ledger
    const objections = {};
    this.personas.filter(p => p.bounceReason).forEach(p => {
      const reason = p.bounceReason;
      objections[reason] = (objections[reason] || 0) + 1;
    });

    const sortedObjections = Object.entries(objections)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([reason, count]) => ({ reason, count, pct: Math.round((count / total) * 100) }));

    return {
      total,
      stageCounts: {
        stage1: { count: s1Pass, pct: Math.round((s1Pass / total) * 100), dropped: total - s1Pass },
        stage2: { count: s2Pass, pct: Math.round((s2Pass / total) * 100), dropped: s1Pass - s2Pass },
        stage3: { count: s3Pass, pct: Math.round((s3Pass / total) * 100), dropped: s2Pass - s3Pass },
        stage4: { count: s4Pass, pct: conversionRate, dropped: s3Pass - s4Pass }
      },
      scores: {
        overall: overallScore,
        clarity: clarityScore,
        value: valueScore,
        priceAcceptance: priceAcceptance,
        conversionRate
      },
      topObjections: sortedObjections,
      isOptimized: this.isOptimized
    };
  }

  generateChatResponse(query, cohortFilter = 'ALL') {
    const qLower = query.toLowerCase();
    let candidates = this.personas;

    if (cohortFilter === 'BOUNCED') {
      candidates = this.personas.filter(p => p.status === 'BOUNCED');
    } else if (cohortFilter === 'CONVERTED') {
      candidates = this.personas.filter(p => p.status === 'PASSED');
    }

    if (candidates.length === 0) candidates = this.personas;

    // Pick 2 representative personas
    const p1 = candidates[Math.floor(Math.random() * candidates.length)];
    let p2 = candidates[Math.floor(Math.random() * candidates.length)];
    if (p1 === p2 && candidates.length > 1) p2 = candidates[(candidates.indexOf(p1) + 1) % candidates.length];

    function craftPersonaVoice(p, q) {
      if (q.includes("pricing") || q.includes("expensive") || q.includes("cost") || q.includes("money")) {
        if (p.status === 'BOUNCED' && p.currentStage === 3) {
          return `As a ${p.role} at a ${p.company}, I immediately scrutinized your pricing. Asking for high upfront commitment without a 14-day free trial or monthly cancellation is a non-starter for my budget.`;
        } else if (p.status === 'PASSED') {
          return `I actually thought the pricing was fair given the time it saves. For my team, saving 5 hours a week easily pays for itself.`;
        } else {
          return `I didn't even make it to the pricing page because the headline confused me before I could scroll down.`;
        }
      }

      if (q.includes("headline") || q.includes("copy") || q.includes("understand") || q.includes("first impression")) {
        if (p.traits.techLiteracy < 50) {
          return `Honestly, when I opened the page, words like '${p.company.includes("FinTech") ? "synergistic primitives" : "automated orchestration"}' flew right over my head. Tell me in plain English what problem you solve in the first 5 seconds.`;
        } else {
          return `The headline was okay for an engineer, but it lacked a punchy outcome. Why should I switch from my current workflow?`;
        }
      }

      if (q.includes("convince") || q.includes("buy") || q.includes("sign up") || q.includes("fix")) {
        return `Show me social proof with real metrics (like 'Trusted by 500+ teams'), add a 1-click interactive demo video, and offer a transparent monthly tier. Then I would sign up without thinking twice.`;
      }

      // Default contextual response
      if (p.status === 'BOUNCED') {
        return `I bounced during ${p.currentStage === 1 ? 'the Hero section' : p.currentStage === 2 ? 'the Feature breakdown' : 'the Pricing section'}. Specifically: "${p.bounceReason}". My pain point is ${p.painPoint.toLowerCase()}.`;
      } else {
        return `I converted! What won me over was the clear value proposition and how directly it addressed my need for ${p.painPoint.toLowerCase()}.`;
      }
    }

    return [
      {
        persona: p1,
        message: craftPersonaVoice(p1, qLower)
      },
      {
        persona: p2,
        message: craftPersonaVoice(p2, qLower)
      }
    ];
  }
}
