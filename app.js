// app.js - Controller for PersonaPulse Elite Editorial Edition with Live MiroFish Swarm Graph
import { generateMiroFishSwarm } from './lib/personas.js';
import { MiroFishSimulationEngine, CLUSTER_ANCHORS } from './lib/graph-engine.js';
import { scrapeWebsiteData } from './scraper.js';

class PersonaPulseEliteApp {
  constructor() {
    this.siteData = {
      url: 'https://apexinvoice.io',
      headline: 'Next-Gen Intelligent Revenue Orchestration for Modern Ecosystems',
      subhead: 'Leverage decentralized primitives to synergize your multi-currency cashflows in real-time.',
      pricing: '$149 / mo (Billed Annually)',
      cta: 'Request Enterprise Consultation',
      optimizedHeadline: 'Send Clean Invoices in 60 Seconds & Get Paid 3x Faster',
      optimizedCta: '$29 / mo (Monthly Billing) • Start 14-Day Free Pilot'
    };

    this.isRedlineApplied = false;
    this.selectedAgent = null;
    this.hoveredAgent = null;
    this.activeClusterFilter = 'ALL';
    this.cohortFilter = 'ALL';
    this.draggingNode = null;

    // Initialize 50-node MiroFish Swarm
    const { nodes, edges } = generateMiroFishSwarm(50);
    this.nodes = nodes;
    this.edges = edges;
    this.engine = new MiroFishSimulationEngine(nodes, edges, 720, 480);

    this.initDOM();
    this.bindEvents();
    this.runInitialSimulation();
    this.startCanvasRenderLoop();
  }

  initDOM() {
    // Inputs & Tabs
    this.targetUrlInput = document.getElementById('targetUrlInput');
    this.runSimBtn = document.getElementById('runSimBtn');
    this.tabUrlBtn = document.getElementById('tabUrlBtn');
    this.tabManuscriptBtn = document.getElementById('tabManuscriptBtn');
    this.urlInputView = document.getElementById('urlInputView');
    this.manuscriptInputView = document.getElementById('manuscriptInputView');
    this.manuscriptHeadline = document.getElementById('manuscriptHeadline');
    this.manuscriptSubhead = document.getElementById('manuscriptSubhead');
    this.manuscriptPricing = document.getElementById('manuscriptPricing');
    this.manuscriptCta = document.getElementById('manuscriptCta');
    this.runManuscriptBtn = document.getElementById('runManuscriptBtn');
    this.presetChips = document.querySelectorAll('.preset-chip');

    // Canvas
    this.canvas = document.getElementById('mirofishCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.filterClusterBtns = document.querySelectorAll('.filter-cluster-btn');

    // Dossier Box
    this.nodeDossierBox = document.getElementById('nodeDossierBox');
    this.dossierId = document.getElementById('dossierId');
    this.dossierName = document.getElementById('dossierName');
    this.dossierRole = document.getElementById('dossierRole');
    this.dossierThought = document.getElementById('dossierThought');
    this.dossierMeta = document.getElementById('dossierMeta');
    this.dossierBadge = document.getElementById('dossierBadge');

    // Funnel & Consensus
    this.consensusRateDisplay = document.getElementById('consensusRateDisplay');
    this.stage1Label = document.getElementById('stage1Label');
    this.stage1Fill = document.getElementById('stage1Fill');
    this.stage2Label = document.getElementById('stage2Label');
    this.stage2Fill = document.getElementById('stage2Fill');
    this.stage3Label = document.getElementById('stage3Label');
    this.stage3Fill = document.getElementById('stage3Fill');
    this.stage4Label = document.getElementById('stage4Label');
    this.stage4Fill = document.getElementById('stage4Fill');
    this.clusterPricingCount = document.getElementById('clusterPricingCount');
    this.clusterJargonCount = document.getElementById('clusterJargonCount');

    // Redline Proofing
    this.redlineOldHeadline = document.getElementById('redlineOldHeadline');
    this.redlineNewHeadline = document.getElementById('redlineNewHeadline');
    this.redlineOldCta = document.getElementById('redlineOldCta');
    this.redlineNewCta = document.getElementById('redlineNewCta');
    this.applyRedlineBtn = document.getElementById('applyRedlineBtn');

    // Chatroom
    this.chatFilterBtns = document.querySelectorAll('.chat-filter-btn');
    this.chatMessagesBox = document.getElementById('chatMessagesBox');
    this.chatInput = document.getElementById('chatInput');
    this.chatSubmitBtn = document.getElementById('chatSubmitBtn');
    this.quickChips = document.querySelectorAll('.quick-chip');
    this.debateTickerBox = document.getElementById('debateTickerBox');
    this.tickerExchangeCount = document.getElementById('tickerExchangeCount');

    // Date
    const mastheadDate = document.getElementById('mastheadDate');
    if (mastheadDate) {
      mastheadDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  bindEvents() {
    // Tab switching
    if (this.tabUrlBtn && this.tabManuscriptBtn) {
      this.tabUrlBtn.addEventListener('click', () => {
        this.tabUrlBtn.className = 'btn-editorial-primary';
        this.tabManuscriptBtn.className = 'btn-editorial-secondary';
        this.urlInputView.style.display = 'block';
        this.manuscriptInputView.style.display = 'none';
      });

      this.tabManuscriptBtn.addEventListener('click', () => {
        this.tabManuscriptBtn.className = 'btn-editorial-primary';
        this.tabUrlBtn.className = 'btn-editorial-secondary';
        this.urlInputView.style.display = 'none';
        this.manuscriptInputView.style.display = 'flex';
      });
    }

    // Deploy Swarm on URL
    if (this.runSimBtn) {
      this.runSimBtn.addEventListener('click', async () => {
        const rawUrl = this.targetUrlInput.value.trim();
        this.runSimBtn.textContent = '⏳ Scraping & Simulating...';
        this.runSimBtn.disabled = true;

        const scraped = await scrapeWebsiteData(rawUrl);
        this.siteData = {
          url: scraped.url,
          headline: scraped.heroHeadline,
          subhead: scraped.heroSubhead,
          pricing: scraped.pricing,
          cta: scraped.ctaText,
          optimizedHeadline: scraped.optimizedCopy.heroHeadline,
          optimizedCta: `${scraped.optimizedCopy.pricing} • ${scraped.optimizedCopy.ctaText}`
        };

        this.presetChips.forEach(c => c.classList.remove('btn-editorial-primary'));
        this.updateRedlineUI();
        this.evaluateSwarm(false);

        this.runSimBtn.textContent = '⚡ Deploy 50-Agent Swarm';
        this.runSimBtn.disabled = false;
      });
    }

    // Deploy Swarm on Manuscript
    if (this.runManuscriptBtn) {
      this.runManuscriptBtn.addEventListener('click', () => {
        const h = this.manuscriptHeadline.value.trim() || 'Intelligent Autonomous Workflow Platform';
        const s = this.manuscriptSubhead.value.trim() || 'Accelerate team output with multi-agent orchestration.';
        const p = this.manuscriptPricing.value.trim() || '$149 / mo (Billed Annually)';
        const c = this.manuscriptCta.value.trim() || 'Request Consultation';

        this.siteData = {
          url: 'https://draft-manuscript.io',
          headline: h,
          subhead: s,
          pricing: p,
          cta: c,
          optimizedHeadline: `${h} — High-Impact Automation`,
          optimizedCta: `${p.includes('$') ? '$29 / mo' : 'Free Trial'} • 14 Days Free`
        };

        this.updateRedlineUI();
        this.evaluateSwarm(false);
      });
    }

    // Preset chips
    this.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const siteKey = chip.getAttribute('data-site');
        if (siteKey === 'saas_invoicing') {
          this.targetUrlInput.value = 'https://apexinvoice.io';
          this.siteData = {
            url: 'https://apexinvoice.io',
            headline: 'Next-Gen Intelligent Revenue Orchestration for Modern Ecosystems',
            subhead: 'Leverage decentralized primitives to synergize your multi-currency cashflows in real-time.',
            pricing: '$149 / mo (Billed Annually)',
            cta: 'Request Enterprise Consultation',
            optimizedHeadline: 'Send Clean Invoices in 60 Seconds & Get Paid 3x Faster',
            optimizedCta: '$29 / mo (Monthly Billing) • Start 14-Day Free Pilot'
          };
        } else if (siteKey === 'ai_studio') {
          this.targetUrlInput.value = 'https://luminastudio.ai';
          this.siteData = {
            url: 'https://luminastudio.ai',
            headline: 'Hyper-Realistic Generative Diffusion Pipeline for Digital Cinephiles',
            subhead: 'Unleash transformer-powered neural synthesis into your multi-modal canvas.',
            pricing: 'Custom GPU Token Credits',
            cta: 'Join Waitlist (#14,892)',
            optimizedHeadline: 'Turn Scripts into 4K Studio Videos in 2 Minutes',
            optimizedCta: '$19 / mo • Generate First Video Free'
          };
        } else if (siteKey === 'ecommerce_sneakers') {
          this.targetUrlInput.value = 'https://cloudstrides.store';
          this.siteData = {
            url: 'https://cloudstrides.store',
            headline: 'Algorithmic Ergonomics for Bio-Mechanical Kinetic Motion',
            subhead: 'Engineered with proprietary circular polymers for maximum energy recovery.',
            pricing: '$180 + $15 Shipping',
            cta: 'Explore Pre-Order Campaign',
            optimizedHeadline: 'The Most Comfortable Running Shoes You Will Ever Wear',
            optimizedCta: '$140 • Free 2-Day Shipping & 30-Day Returns'
          };
        }

        this.updateRedlineUI();
        this.evaluateSwarm(false);
      });
    });

    // Toggle Apply Redline
    if (this.applyRedlineBtn) {
      this.applyRedlineBtn.addEventListener('click', () => {
        this.isRedlineApplied = !this.isRedlineApplied;
        this.applyRedlineBtn.textContent = this.isRedlineApplied ? '↩️ Revert to Baseline' : '⚡ Apply Redline & Re-Simulate';
        this.applyRedlineBtn.style.background = this.isRedlineApplied ? 'var(--accent-navy)' : 'var(--accent-terracotta)';
        this.evaluateSwarm(this.isRedlineApplied);
      });
    }

    // Cluster Filter Buttons
    this.filterClusterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterClusterBtns.forEach(b => b.className = 'filter-cluster-btn btn-editorial-secondary');
        btn.className = 'filter-cluster-btn btn-editorial-primary';
        this.activeClusterFilter = btn.getAttribute('data-cluster') || 'ALL';
      });
    });

    // Chat cohort filter buttons
    this.chatFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.chatFilterBtns.forEach(b => b.className = 'chat-filter-btn btn-editorial-secondary');
        btn.className = 'chat-filter-btn btn-editorial-primary';
        this.cohortFilter = btn.getAttribute('data-cohort') || 'ALL';
      });
    });

    // Chat submit
    if (this.chatSubmitBtn && this.chatInput) {
      this.chatSubmitBtn.addEventListener('click', () => this.handleSendMessage());
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    // Quick prompt chips
    this.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-q');
        if (q) {
          this.chatInput.value = q;
          this.handleSendMessage();
        }
      });
    });

    // Canvas Drag and Click interaction
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const clicked = this.nodes.find(n => Math.hypot(n.x - x, n.y - y) < 18);
        if (clicked) {
          this.draggingNode = clicked;
          this.selectAgent(clicked);
        }
      });

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.draggingNode) {
          this.draggingNode.x = x;
          this.draggingNode.y = y;
          this.draggingNode.vx = 0;
          this.draggingNode.vy = 0;
          return;
        }

        this.hoveredAgent = this.nodes.find(n => Math.hypot(n.x - x, n.y - y) < 16) || null;
      });

      window.addEventListener('mouseup', () => {
        this.draggingNode = null;
      });
    }
  }

  runInitialSimulation() {
    this.selectAgent(this.nodes[0]);
    this.updateRedlineUI();
    this.evaluateSwarm(false);
  }

  selectAgent(agent) {
    this.selectedAgent = agent;
    if (!this.dossierName) return;

    this.dossierId.textContent = agent.id.toUpperCase();
    this.dossierName.textContent = agent.name;
    this.dossierRole.textContent = `— ${agent.role} at ${agent.company}`;
    this.dossierThought.textContent = `"${agent.activeThought}"`;
    this.dossierMeta.innerHTML = `Demographic: <strong>${agent.demographic}</strong> • Price Sensitivity: <strong>${agent.traits.priceSensitivity}%</strong> • Skepticism: <strong>${agent.traits.skepticism}%</strong>`;
    
    this.dossierBadge.textContent = agent.status;
    this.dossierBadge.className = `stamp-badge ${agent.status === 'CONVERTED' ? 'free' : 'active'}`;
  }

  evaluateSwarm(isOptimized) {
    const h = isOptimized ? this.siteData.optimizedHeadline : this.siteData.headline;
    const p = isOptimized ? this.siteData.optimizedCta : this.siteData.pricing;

    const metrics = this.engine.evaluateWebsite(h, p, isOptimized);

    // Update Funnel Numbers
    if (this.consensusRateDisplay) {
      this.consensusRateDisplay.textContent = `${metrics.conversionPct}%`;
      this.consensusRateDisplay.style.color = metrics.conversionPct > 50 ? 'var(--accent-sage)' : 'var(--accent-terracotta)';
      
      const s1 = isOptimized ? 90 : 64;
      const s2 = isOptimized ? 80 : 48;
      const s3 = isOptimized ? 72 : 34;

      this.stage1Label.textContent = `${s1}% retained`;
      this.stage1Fill.style.width = `${s1}%`;
      this.stage2Label.textContent = `${s2}% retained`;
      this.stage2Fill.style.width = `${s2}%`;
      this.stage3Label.textContent = `${s3}% retained`;
      this.stage3Fill.style.width = `${s3}%`;
      this.stage4Label.textContent = `${metrics.conversionPct}% converted`;
      this.stage4Fill.style.width = `${metrics.conversionPct}%`;

      this.clusterPricingCount.textContent = `${metrics.clusters.pricingResistance.count} agents (${metrics.clusters.pricingResistance.pct}%)`;
      this.clusterJargonCount.textContent = `${metrics.clusters.jargonConfusion.count} agents (${metrics.clusters.jargonConfusion.pct}%)`;
    }

    // Update Live Debate Ticker
    if (this.debateTickerBox && this.engine.messages.length > 0) {
      this.debateTickerBox.innerHTML = '';
      this.tickerExchangeCount.textContent = `${this.engine.messages.length} exchanges observed`;
      this.engine.messages.slice(-4).forEach(msg => {
        const div = document.createElement('div');
        div.style.color = msg.impact === 'DISAGREEMENT' ? 'var(--accent-crimson)' : 'var(--accent-sage)';
        div.textContent = `[${msg.timestamp}] ${msg.content}`;
        this.debateTickerBox.appendChild(div);
      });
    }

    if (this.selectedAgent) {
      this.selectAgent(this.selectedAgent);
    }
  }

  updateRedlineUI() {
    if (this.redlineOldHeadline) {
      this.redlineOldHeadline.textContent = `"${this.siteData.headline}"`;
      this.redlineNewHeadline.textContent = `"${this.siteData.optimizedHeadline}"`;
      this.redlineOldCta.textContent = `"${this.siteData.pricing} • ${this.siteData.cta}"`;
      this.redlineNewCta.textContent = `"${this.siteData.optimizedCta}"`;
    }
  }

  handleSendMessage() {
    const query = this.chatInput.value.trim();
    if (!query) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.appendChatMsg('Founder / Reviewer (Examiner)', query, true, time);
    this.chatInput.value = '';

    // Pick 2 representative agents
    let pool = this.nodes;
    if (this.cohortFilter === 'BOUNCED') pool = this.nodes.filter(n => n.status === 'BOUNCED');
    if (this.cohortFilter === 'CONVERTED') pool = this.nodes.filter(n => n.status === 'CONVERTED');
    if (pool.length === 0) pool = this.nodes;

    const a1 = pool[Math.floor(Math.random() * pool.length)];
    const a2 = pool[(pool.indexOf(a1) + 1) % pool.length];

    const craftAnswer = (a) => {
      const q = query.toLowerCase();
      if (q.includes('pricing') || q.includes('cost') || q.includes('money')) {
        return a.status === 'BOUNCED'
          ? `Speaking as ${a.role} at ${a.company}: $149/mo upfront without a risk-free pilot was a dealbreaker for our budget.`
          : `For our operations, saving 5 hours a week easily recoups the price tag.`;
      }
      if (q.includes('headline') || q.includes('confusing')) {
        return a.traits.techLiteracy < 50
          ? `The terminology felt like engineering buzzwords. State the concrete outcome in the first 5 seconds.`
          : `The headline has ambition, but needs a measurable metric (e.g. 'Get paid 3x faster').`;
      }
      return `My primary operational concern is ${a.painPoint.toLowerCase()}. Address that directly on the page to eliminate friction.`;
    };

    setTimeout(() => {
      this.appendChatMsg(`${a1.name} (${a1.role})`, craftAnswer(a1), false, time);
      this.appendChatMsg(`${a2.name} (${a2.role})`, craftAnswer(a2), false, time);
    }, 350);
  }

  appendChatMsg(sender, text, isUser, time) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `display: flex; flex-direction: column; align-items: ${isUser ? 'flex-end' : 'flex-start'};`;
    wrap.innerHTML = `
      <div style="font-size: 0.7rem; color: var(--ink-muted); margin-bottom: 0.15rem;">
        <strong>${sender}</strong> • ${time}
      </div>
      <div style="
        max-width: 82%;
        padding: 0.6rem 0.85rem;
        border-radius: 3px;
        font-size: 0.86rem;
        background: ${isUser ? 'var(--ink-primary)' : 'var(--bg-paper)'};
        color: ${isUser ? '#FFFFFF' : 'var(--ink-body)'};
        border: ${isUser ? 'none' : '1px solid var(--border-rule)'};
        font-family: ${isUser ? 'var(--font-sans)' : 'var(--font-serif)'};
        font-style: ${isUser ? 'normal' : 'italic'};
      ">
        ${text}
      </div>
    `;
    this.chatMessagesBox.appendChild(wrap);
    this.chatMessagesBox.scrollTop = this.chatMessagesBox.scrollHeight;
  }

  startCanvasRenderLoop() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    let pulseProgress = 0;

    const render = () => {
      this.engine.tickPhysics(0.06);
      pulseProgress = (pulseProgress + 0.02) % 1;

      // Clear Canvas with warm paper tint
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 1. Draw Cluster Halo Regions
      CLUSTER_ANCHORS.forEach(cluster => {
        const grad = ctx.createRadialGradient(cluster.x, cluster.y, 10, cluster.x, cluster.y, 135);
        grad.addColorStop(0, `${cluster.color}18`);
        grad.addColorStop(1, `${cluster.color}00`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, 135, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cluster.color;
        ctx.font = '500 11px Plus Jakarta Sans';
        ctx.fillText(cluster.name.toUpperCase(), cluster.x - 45, cluster.y - 110);
      });

      // 2. Draw Network Edges
      const nodeMap = new Map();
      this.nodes.forEach(n => nodeMap.set(n.id, n));

      this.edges.forEach(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const isFiltered = this.activeClusterFilter === 'ALL' || src.cluster === this.activeClusterFilter || tgt.cluster === this.activeClusterFilter;
        if (!isFiltered) return;

        ctx.strokeStyle = edge.type === 'DEBATES' ? 'rgba(185, 28, 28, 0.28)' : 'rgba(213, 205, 192, 0.5)';
        ctx.lineWidth = edge.type === 'DEBATES' ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();

        // Pulsing data packet along debating edge
        if (edge.pulseActive || edge.type === 'DEBATES') {
          const px = src.x + (tgt.x - src.x) * pulseProgress;
          const py = src.y + (tgt.y - src.y) * pulseProgress;
          ctx.fillStyle = edge.type === 'DEBATES' ? '#B91C1C' : '#15803D';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Draw Agent Nodes
      this.nodes.forEach(node => {
        const isSelected = this.selectedAgent?.id === node.id;
        const isHovered = this.hoveredAgent?.id === node.id;
        const isDimmed = this.activeClusterFilter !== 'ALL' && node.cluster !== this.activeClusterFilter;

        let nodeColor = '#1E3A5F';
        if (node.cluster === 'pricing_resistance') nodeColor = '#C2410C';
        else if (node.cluster === 'value_advocacy') nodeColor = '#15803D';
        else if (node.cluster === 'jargon_confusion') nodeColor = '#B91C1C';

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.22 : 1.0;

        if (isSelected || isHovered) {
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 8.5px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.initials, node.x, node.y + 0.5);

        if (isSelected || isHovered) {
          ctx.fillStyle = '#1C1917';
          ctx.font = '600 11px Plus Jakarta Sans';
          ctx.fillText(node.name, node.x, node.y + 24);
        }

        ctx.restore();
      });

      requestAnimationFrame(render);
    };

    render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.personaPulseEliteApp = new PersonaPulseEliteApp();
});
