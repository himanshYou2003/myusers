import type { SiteCopy } from './site';
// lib/graph-engine.ts - Force-Directed Physics Simulation & MiroFish Debate Dynamics
import type { AgentNode, GraphEdge } from './personas';

export interface ClusterAnchor {
  id: AgentNode['cluster'];
  name: string;
  x: number;
  y: number;
  color: string;
  description: string;
}

export const CLUSTER_ANCHORS: ClusterAnchor[] = [
  { id: 'pricing_resistance', name: 'Pricing Resistance', x: 220, y: 160, color: '#C2410C', description: 'Agents troubled by high fees, opaque tiers, or lack of free trial' },
  { id: 'value_advocacy', name: 'Value Advocates', x: 500, y: 160, color: '#15803D', description: 'Agents who find clear ROI and intend to convert' },
  { id: 'jargon_confusion', name: 'Headline Skeptics', x: 240, y: 340, color: '#B91C1C', description: 'Agents alienated by complex vocabulary or vague claims' },
  { id: 'undecided', name: 'Evaluating Cohort', x: 480, y: 340, color: '#1E3A5F', description: 'Agents currently deliberating and reviewing feature proof' }
];

export interface DebateMessage {
  id: string;
  timestamp: string;
  fromAgent: AgentNode;
  toAgent: AgentNode;
  content: string;
  impact: 'AGREEMENT' | 'DISAGREEMENT' | 'NEUTRAL';
}

export class MiroFishSimulationEngine {
  nodes: AgentNode[];
  edges: GraphEdge[];
  messages: DebateMessage[];
  width: number;
  height: number;
  isSimulating: boolean;

  constructor(nodes: AgentNode[], edges: GraphEdge[], width = 720, height = 480) {
    this.nodes = nodes;
    this.edges = edges;
    this.messages = [];
    this.width = width;
    this.height = height;
    this.isSimulating = false;
  }

  /**
   * Runs one step of 2D velocity-Verlet force simulation
   */
  tickPhysics(alpha = 0.08) {
    const kRepulsion = 1200;
    const kSpring = 0.04;
    const centerTargetX = this.width / 2;
    const centerTargetY = this.height / 2;
    const friction = 0.88;

    // 1. Repulsion between all node pairs
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1e-4;
        const dist = Math.sqrt(distSq);

        if (dist < 140) {
          const force = (kRepulsion / distSq) * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // 2. Spring attraction along MiroFish network edges
    const nodeMap = new Map<string, AgentNode>();
    this.nodes.forEach(n => nodeMap.set(n.id, n));

    this.edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredLength = 65;
      const displacement = dist - desiredLength;
      const force = displacement * kSpring * edge.strength * alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // 3. Cluster Anchor Gravitational Pull
    const clusterAnchorMap = new Map<string, ClusterAnchor>();
    CLUSTER_ANCHORS.forEach(c => clusterAnchorMap.set(c.id, c));

    this.nodes.forEach(node => {
      const anchor = clusterAnchorMap.get(node.cluster);
      if (anchor) {
        const dx = anchor.x - node.x;
        const dy = anchor.y - node.y;
        node.vx += dx * 0.015 * alpha;
        node.vy += dy * 0.015 * alpha;
      }

      // Gentle centering force
      const cx = centerTargetX - node.x;
      const cy = centerTargetY - node.y;
      node.vx += cx * 0.005 * alpha;
      node.vy += cy * 0.005 * alpha;

      // Apply velocities
      node.vx *= friction;
      node.vy *= friction;
      node.x += node.vx;
      node.y += node.vy;

      // Soft boundary clamp
      const pad = 24;
      node.x = Math.max(pad, Math.min(this.width - pad, node.x));
      node.y = Math.max(pad, Math.min(this.height - pad, node.y));
    });
  }

  /**
   * Simulates active website scrutiny & inter-agent debate cascades
   */
  evaluateWebsite(headline: string, pricing: string, _legacyFlag = false, subhead = '', cta = '') {
    this.messages = [];
    this.nodes.forEach(node => { node.recentDebates = []; });
    const jargon = (headline.match(/\b(orchestration|primitives|synergize|ecosystems|decentralized|diffusion|kinetic|multi-modal|next-gen|intelligent)\b/gi) || []).length;
    const words = headline.split(/\s+/).filter(Boolean).length;
    const clarity = Math.min(95, 18 + jargon * 16 + Math.max(0, words - 12) * 3 + (words < 3 ? 30 : 0));
    const amount = Number(pricing.match(/\d[\d,.]*/)?.[0].replace(/,/g, '') || 0);
    const priceRisk = !pricing.trim() ? 45 : /\bfree\b/i.test(pricing) && !amount ? 8 : Math.min(80, amount / 4 + (/annual|annually/i.test(pricing) ? 24 : 0) + (/custom|contact/i.test(pricing) ? 20 : 0));
    const stages = [0, 0, 0, 0];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const variation = (i * 13 % 21) - 10;
      const headlineRisk = clarity * (1 - node.traits.techLiteracy / 180) + node.traits.impatience * .12 + variation;
      const valueRisk = (!subhead.trim() ? 45 : 15) + node.traits.skepticism * .22 + variation;
      const pricingRisk = priceRisk * node.traits.priceSensitivity / 100 + node.traits.skepticism * .18 + variation;
      const actionRisk = !cta.trim() ? 85 : /waitlist|consultation|pre-order/i.test(cta) ? 46 + variation : 12 + variation;
      let stage = 0;
      if (headlineRisk <= 45) { stages[0]++; stage = 1;
        if (valueRisk <= 44) { stages[1]++; stage = 2;
          if (pricingRisk <= 44) { stages[2]++; stage = 3;
            if (actionRisk <= 45) { stages[3]++; stage = 4; }
          }
        }
      }
      node.status = stage === 4 ? 'CONVERTED' : 'BOUNCED';
      node.cluster = stage === 4 ? 'value_advocacy' : stage >= 2 ? 'pricing_resistance' : 'jargon_confusion';
      node.sentiment = stage === 4 ? .8 : -.3 - (4 - stage) * .1;

      // Role-grounded dynamic thoughts
      if (stage === 4) {
        const convertedThoughts = [
          `As ${node.role}, the workflow delivers direct ROI on our requirement: ${node.painPoint.toLowerCase()}.`,
          `Ready to trial this — if it delivers on "${cta || 'deployment'}", it eliminates our delivery delays.`,
          `The capability fits our stack at ${node.company}. The next logical step is a sandbox run.`,
          `High confidence in this product. Clear alignment with our operational goals.`
        ];
        node.activeThought = convertedThoughts[i % convertedThoughts.length];
      } else if (stage === 0) {
        node.activeThought = `Headline feels ambiguous for my engineering team: "${headline}". Needs clearer benefit phrasing.`;
      } else if (stage === 1) {
        node.activeThought = `Unclear evidence for ${node.role}: I require concrete technical proof regarding ${node.painPoint.toLowerCase()}.`;
      } else if (stage === 2) {
        node.activeThought = `Budget uncertainty: "${pricing || 'not disclosed'}". My constraint is ${node.painPoint.toLowerCase()}.`;
      } else {
        node.activeThought = `The next action "${cta || 'commit'}" introduces friction before we see self-serve technical documentation.`;
      }
    }
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    this.edges.forEach((edge, idx) => {
      const source = nodeMap.get(edge.source)!;
      const target = nodeMap.get(edge.target)!;
      const agrees = source.cluster === target.cluster;
      edge.type = agrees ? 'AGREES' : 'DEBATES';
      edge.pulseActive = idx < 18;
      if (idx >= 18) return;

      const agreeResponses = [
        'Agreed — our team has the exact same requirement.',
        'Spot on. We cannot approve without that.',
        'Concur completely; that directly matches our engineering priorities.',
        'Exactly right. The ROI hinges on that point.'
      ];
      const debateResponses = [
        `I see it differently: for my team, execution velocity outweighs ${source.painPoint.toLowerCase()}.`,
        `Fair point, though if the tooling delivers as promised, the cost is easily justified.`,
        `I am more skeptical — we need verified benchmarks before I would endorse it.`,
        `Our immediate priority is security compliance over feature velocity.`
      ];

      const responseText = agrees
        ? agreeResponses[(idx) % agreeResponses.length]
        : debateResponses[(idx) % debateResponses.length];

      const content = `${source.name}: ${source.activeThought} → ${target.name}: ${responseText}`;
      const message: DebateMessage = { id: `exchange_${idx}`, timestamp: new Date().toLocaleTimeString(), fromAgent: source, toAgent: target, content, impact: agrees ? 'AGREEMENT' : 'DISAGREEMENT' };
      this.messages.push(message);
      source.recentDebates.push(content);
      target.recentDebates.push(content);
    });
    const pct = (count: number) => this.nodes.length ? Math.round(count / this.nodes.length * 100) : 0;
    return { ...this.getConsensusMetrics(), stageStats: { heroPct: pct(stages[0]), valuePct: pct(stages[1]), pricingPct: pct(stages[2]), convertPct: pct(stages[3]) } };
  }

  evaluateCopy(copy: SiteCopy) {
    return this.evaluateWebsite(copy.headline, copy.pricing, false, copy.subhead, copy.cta);
  }

  getConsensusMetrics() {
    const total = this.nodes.length;
    const converted = this.nodes.filter(n => n.status === 'CONVERTED').length;
    const bounced = this.nodes.filter(n => n.status === 'BOUNCED').length;
    const metric = (cluster: AgentNode['cluster']) => {
      const count = this.nodes.filter(n => n.cluster === cluster).length;
      return { count, pct: total ? Math.round(count / total * 100) : 0 };
    };
    return { total, converted, bounced, conversionPct: total ? Math.round(converted / total * 100) : 0, clusters: { pricingResistance: metric('pricing_resistance'), jargonConfusion: metric('jargon_confusion'), valueAdvocacy: metric('value_advocacy') } };
  }
}

