// lib/personas.ts - MiroFish Swarm Personas & Social Network Topology

export interface AgentNode {
  id: string;
  name: string;
  initials: string;
  demographic: 'B2B Enterprise' | 'Gen-Z Tech' | 'Small Business' | 'Non-Tech Senior';
  role: string;
  company: string;
  painPoint: string;
  traits: {
    priceSensitivity: number; // 0 - 100
    techLiteracy: number;     // 0 - 100
    impatience: number;       // 0 - 100
    skepticism: number;       // 0 - 100
    socialInfluence: number;  // 0 - 100 (MiroFish graph centrality)
  };
  // Graph Physics State
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: 'pricing_resistance' | 'value_advocacy' | 'jargon_confusion' | 'undecided';
  status: 'EVALUATING' | 'CONVERTED' | 'BOUNCED';
  sentiment: number; // -1.0 to 1.0
  activeThought: string;
  recentDebates: string[];
}

export interface GraphEdge {
  source: string; // Agent ID
  target: string; // Agent ID
  strength: number; // 0.1 to 1.0
  type: 'DEBATES' | 'AGREES' | 'INFLUENCES';
  pulseActive: boolean;
}

const FIRST_NAMES = [
  "Marcus", "Elena", "Devon", "Aaliyah", "Chen", "Sophia", "Tariq", "Chloe", "Mateo", "Priya",
  "Siddharth", "Ingrid", "Liam", "Yuki", "Amara", "Lucas", "Fatima", "Arthur", "Zoe", "Dante",
  "Hannah", "Vikram", "Camila", "Kofi", "Mei", "Jasper", "Leila", "Ronan", "Noor", "Ethan",
  "Beatriz", "Julian", "Ananya", "Felix", "Nadia", "Soren", "Zara", "Kenji", "Maya", "Darius",
  "Clara", "Zubair", "Fiona", "Derrick", "Mira", "Sean", "Tenzin", "Alina", "Oscar", "Valeria"
];

const DEMOGRAPHICS: Array<AgentNode['demographic']> = [
  'B2B Enterprise', 'Gen-Z Tech', 'Small Business', 'Non-Tech Senior'
];

const ROLES_MAP = {
  'B2B Enterprise': [
    { role: "VP of Product", company: "FinTech Global", pain: "Requires SOC2 compliance, team SSO, and invoice billing" },
    { role: "Chief Financial Officer", company: "LogiGroup 500", pain: "Demands transparent ROI calculation and quarterly budget flexibility" },
    { role: "Head of Infrastructure", company: "Aether Systems", pain: "Scrutinizes API latency, uptime SLAs, and vendor lock-in" },
    { role: "Procurement Lead", company: "Starlight Corp", pain: "Refuses upfront annual commitments without a legal pilot period" }
  ],
  'Gen-Z Tech': [
    { role: "Fullstack Indie Hacker", company: "Solo Venture", pain: "Zero patience for marketing fluff; expects instant GitHub auth" },
    { role: "Growth Engineer", company: "HyperScale Media", pain: "Requires self-serve onboarding and transparent monthly pricing" },
    { role: "Interface Designer", company: "CraftStudio", pain: "Critiques visual hierarchy, typographic scale, and mobile responsiveness" },
    { role: "Student Builder", company: "University Lab", pain: "Extremely price conscious; demands genuine freemium or low-tier entry" }
  ],
  'Small Business': [
    { role: "Boutique Clinic Owner", company: "Apex Health", pain: "Needs out-of-the-box reliability without hiring an IT administrator" },
    { role: "E-Commerce Merchant", company: "Artisan Goods", pain: "Worries about unexpected transaction fees and integration friction" },
    { role: "Catering Founder", company: "Urban Palate", pain: "Relies heavily on verifiable customer testimonials and phone support" },
    { role: "Freelance Creative", company: "Studio One", pain: "Hard budget ceiling of $35/month; abandons immediately on hidden fees" }
  ],
  'Non-Tech Senior': [
    { role: "Retired School Administrator", company: "Community Trust", pain: "Confused by contemporary tech jargon (orchestration, primitives, synergy)" },
    { role: "Local Hardware Store Owner", company: "Pioneer Hardware", pain: "Looks for security badges, phone contact, and plain language explanations" },
    { role: "Family Legal Consultant", company: "Private Chambers", pain: "Demands high visual contrast and step-by-step explanatory clarity" },
    { role: "Non-Profit Director", company: "Youth Endeavor", pain: "Apprehensive about recurring credit card charges without warning" }
  ]
};

export function generateMiroFishSwarm(count = 50): { nodes: AgentNode[]; edges: GraphEdge[] } {
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error('Persona count must be an integer from 1 to 200.');
  const nodes: AgentNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < count; i++) {
    const demographic = DEMOGRAPHICS[i % DEMOGRAPHICS.length];
    const rolesList = ROLES_MAP[demographic];
    const roleItem = rolesList[Math.floor(i / DEMOGRAPHICS.length) % rolesList.length];
    const name = FIRST_NAMES[i % FIRST_NAMES.length];
    const initials = name.slice(0, 2).toUpperCase();

    // Archetype traits
    let priceSensitivity = 50;
    let techLiteracy = 50;
    let impatience = 50;
    let skepticism = 50;

    if (demographic === 'B2B Enterprise') {
      priceSensitivity = 35; techLiteracy = 80; impatience = 45; skepticism = 85;
    } else if (demographic === 'Gen-Z Tech') {
      priceSensitivity = 85; techLiteracy = 95; impatience = 90; skepticism = 60;
    } else if (demographic === 'Small Business') {
      priceSensitivity = 70; techLiteracy = 45; impatience = 65; skepticism = 70;
    } else if (demographic === 'Non-Tech Senior') {
      priceSensitivity = 60; techLiteracy = 25; impatience = 75; skepticism = 90;
    }

    // Initial spatial layout (circular distribution around canvas center)
    const angle = (i / count) * 2 * Math.PI;
    const radius = 140 + (i * 37 % 80);
    const centerX = 360;
    const centerY = 240;

    nodes.push({
      id: `agent_${i + 1}`,
      name,
      initials,
      demographic,
      role: roleItem.role,
      company: roleItem.company,
      painPoint: roleItem.pain,
      traits: {
        priceSensitivity,
        techLiteracy,
        impatience,
        skepticism,
        socialInfluence: 30 + (i * 17 % 65)
      },
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      cluster: 'undecided',
      status: 'EVALUATING',
      sentiment: 0.0,
      activeThought: `Inspecting headline and layout value proposition...`,
      recentDebates: []
    });
  }

  // Create MiroFish Swarm Interaction Network Edges (Small-World Network topology)
  for (let i = 0; i < nodes.length; i++) {
    // Connect each node to 2 nearest demographic peers
    const sameDemoNodes = nodes.filter((n, idx) => n.demographic === nodes[i].demographic && idx !== i);
    const peer1 = sameDemoNodes[i % sameDemoNodes.length];
    const peer2 = sameDemoNodes[(i + 1) % sameDemoNodes.length];

    if (peer1) {
      edges.push({
        source: nodes[i].id,
        target: peer1.id,
        strength: 0.7,
        type: 'AGREES',
        pulseActive: false
      });
    }

    if (peer2) {
      edges.push({
        source: nodes[i].id,
        target: peer2.id,
        strength: 0.5,
        type: 'INFLUENCES',
        pulseActive: false
      });
    }

    // Connect some cross-demographic bridges (e.g. B2B Executive debating Gen-Z Indie Hacker)
    if (i % 3 === 0) {
      const otherDemoNode = nodes[(i + 15) % nodes.length];
      edges.push({
        source: nodes[i].id,
        target: otherDemoNode.id,
        strength: 0.35,
        type: 'DEBATES',
        pulseActive: false
      });
    }
  }

  const seen = new Set<string>();
  const uniqueEdges = edges.filter(edge => {
    if (edge.source === edge.target) return false;
    const key = [edge.source, edge.target].sort().join(':');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { nodes, edges: uniqueEdges };
}


