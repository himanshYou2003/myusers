// personas.js - Synthetic Persona Archetypes & Swarm Generator for PersonaPulse

export const DEMOGRAPHIC_PRESETS = {
  balanced: {
    name: "Balanced Market Mix",
    description: "Realistic cross-section of mainstream internet buyers",
    distribution: { 'B2B Enterprise': 0.25, 'Gen-Z Tech': 0.25, 'Small Business': 0.25, 'Non-Tech Senior': 0.25 }
  },
  b2b_saas: {
    name: "B2B SaaS / Enterprise",
    description: "Security-conscious buyers, CFOs, VPs of Eng with high purchasing friction",
    distribution: { 'B2B Enterprise': 0.60, 'Small Business': 0.25, 'Gen-Z Tech': 0.15, 'Non-Tech Senior': 0.00 }
  },
  consumer_genz: {
    name: "Consumer & Gen-Z Mobile",
    description: "Fast-moving, low attention span, highly visual, impatient",
    distribution: { 'Gen-Z Tech': 0.65, 'Small Business': 0.20, 'B2B Enterprise': 0.05, 'Non-Tech Senior': 0.10 }
  },
  mass_market: {
    name: "Mainstream & Non-Tech",
    description: "Easily confused by jargon, values trust, simple language, and direct phone/chat support",
    distribution: { 'Non-Tech Senior': 0.50, 'Small Business': 0.30, 'Gen-Z Tech': 0.10, 'B2B Enterprise': 0.10 }
  }
};

const FIRST_NAMES = [
  "Marcus", "Elena", "Devon", "Aaliyah", "Chen", "Sophia", "Tariq", "Chloe", "Mateo", "Priya",
  "Siddharth", "Ingrid", "Liam", "Yuki", "Amara", "Lucas", "Fatima", "Arthur", "Zoe", "Dante",
  "Hannah", "Vikram", "Camila", "Kofi", "Mei", "Jasper", "Leila", "Ronan", "Noor", "Ethan",
  "Beatriz", "Julian", "Ananya", "Felix", "Nadia", "Soren", "Zara", "Kenji", "Maya", "Darius",
  "Clara", "Zubair", "Fiona", "Derrick", "Mira", "Sean", "Tenzin", "Alina", "Oscar", "Valeria"
];

const ROLES_BY_DEMO = {
  'B2B Enterprise': [
    { title: "VP of Product", company: "FinTech 500", painPoint: "Needs SOC2 compliance and team SSO" },
    { title: "Chief Financial Officer", company: "SupplyChain Corp", painPoint: "Scrutinizes ROI and hidden annual contract renewals" },
    { title: "Head of Engineering", company: "ScaleAI Labs", painPoint: "Wants API docs before talking to a sales rep" },
    { title: "Procurement Director", company: "Global Logistics", painPoint: "Refuses to sign up without clear invoice billing" }
  ],
  'Gen-Z Tech': [
    { title: "Fullstack Indie Hacker", company: "Solo Venture", painPoint: "Zero patience for marketing fluff; expects 1-click GitHub auth" },
    { title: "Growth Marketer", company: "TikTok Agency", painPoint: "Evaluates mobile UX first; bounces if headline is boring" },
    { title: "Design Systems Lead", company: "DesignCraft", painPoint: "Critiques contrast, micro-interactions, and visual hierarchy" },
    { title: "CS Student & Creator", company: "University", painPoint: "Extremely price sensitive; demands free trial or freemium" }
  ],
  'Small Business': [
    { title: "Dental Clinic Owner", company: "Apex Smiles", painPoint: "Needs it to just work without hiring IT staff" },
    { title: "E-Commerce Boutique Founder", company: "Luxe Goods", painPoint: "Worries about integration downtime and transaction fees" },
    { title: "Catering Agency Owner", company: "Savory Bites", painPoint: "Wants to speak with a human or see 5-star customer reviews" },
    { title: "Freelance Photographer", company: "Studio One", painPoint: "Budget is capped at $40/month; hates hidden setup fees" }
  ],
  'Non-Tech Senior': [
    { title: "Retired High School Principal", company: "Community Board", painPoint: "Confused by modern tech buzzwords (e.g., 'Synergy', 'Orchestration')" },
    { title: "Local Antique Shop Owner", company: "Heritage Antiques", painPoint: "Looks for phone number and security lock badges" },
    { title: "Legal Consultant", company: "Private Practice", painPoint: "Needs very high text contrast and clear step-by-step instructions" },
    { title: "Non-Profit Treasurer", company: "Youth Foundation", painPoint: "Fearful of accidental recurring credit card charges" }
  ]
};

const AVATAR_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", 
  "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

export function generatePersonaCohort(count = 50, demographicKey = 'balanced', sliderOverrides = {}) {
  const preset = DEMOGRAPHIC_PRESETS[demographicKey] || DEMOGRAPHIC_PRESETS.balanced;
  const dist = preset.distribution;
  const personas = [];

  const demoPool = [];
  Object.entries(dist).forEach(([demo, ratio]) => {
    const slots = Math.round(count * ratio);
    for (let i = 0; i < slots; i++) demoPool.push(demo);
  });
  while (demoPool.length < count) demoPool.push('Small Business');
  demoPool.length = count;

  // Shuffle demo pool
  for (let i = demoPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [demoPool[i], demoPool[j]] = [demoPool[j], demoPool[i]];
  }

  for (let i = 0; i < count; i++) {
    const demo = demoPool[i];
    const roles = ROLES_BY_DEMO[demo];
    const roleInfo = roles[i % roles.length];
    const name = FIRST_NAMES[i % FIRST_NAMES.length];

    // Base traits per demographic + slider adjustments
    let priceSensitivity = 50;
    let techLiteracy = 50;
    let impatience = 50;
    let skepticism = 50;

    if (demo === 'B2B Enterprise') {
      priceSensitivity = 30; techLiteracy = 75; impatience = 45; skepticism = 85;
    } else if (demo === 'Gen-Z Tech') {
      priceSensitivity = 80; techLiteracy = 95; impatience = 90; skepticism = 60;
    } else if (demo === 'Small Business') {
      priceSensitivity = 70; techLiteracy = 45; impatience = 65; skepticism = 70;
    } else if (demo === 'Non-Tech Senior') {
      priceSensitivity = 60; techLiteracy = 20; impatience = 75; skepticism = 90;
    }

    // Apply slider modifiers if present
    if (sliderOverrides.priceSensitivity) priceSensitivity = Math.min(100, Math.max(0, priceSensitivity + (sliderOverrides.priceSensitivity - 50)));
    if (sliderOverrides.skepticism) skepticism = Math.min(100, Math.max(0, skepticism + (sliderOverrides.skepticism - 50)));
    if (sliderOverrides.impatience) impatience = Math.min(100, Math.max(0, impatience + (sliderOverrides.impatience - 50)));
    if (sliderOverrides.techLiteracy) techLiteracy = Math.min(100, Math.max(0, techLiteracy + (sliderOverrides.techLiteracy - 50)));

    const initials = name.split(" ").map(n => n[0]).join("") + (name.length > 1 ? name[1].toUpperCase() : "");

    personas.push({
      id: `p_${i + 1}`,
      name,
      initials,
      avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
      demographic: demo,
      role: roleInfo.title,
      company: roleInfo.company,
      painPoint: roleInfo.painPoint,
      traits: {
        priceSensitivity,
        techLiteracy,
        impatience,
        skepticism
      },
      currentStage: 0, // 0 = ready, 1 = hero, 2 = value, 3 = pricing, 4 = converted
      status: 'READY', // 'READY', 'ACTIVE', 'PASSED', 'BOUNCED'
      thoughtBubble: 'Waiting to inspect page...',
      bounceReason: null,
      stageHistory: {}
    });
  }

  return personas;
}
