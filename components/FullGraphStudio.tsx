'use client';
// components/FullGraphStudio.tsx - Authentic MiroFish D3.js (v7) SVG Swarm Graph & 1-on-1 Persona POV Interrogation
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { AgentNode } from '../lib/personas';
import { MiroFishSimulationEngine, CLUSTER_ANCHORS } from '../lib/graph-engine';
import { SiteCopy, SiteData } from '../lib/site';
import { getPersonaSpecificQuestions } from '../lib/questions';

interface FullGraphStudioProps {
  engine: MiroFishSimulationEngine | null;
  site: SiteCopy | SiteData;
  selectedAgent: AgentNode | null;
  onSelectAgent: (agent: AgentNode | null) => void;
  onBackToOverview: () => void;
  geminiKey?: string;
}

interface PersonaChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export const FullGraphStudio: React.FC<FullGraphStudioProps> = ({
  engine,
  site,
  selectedAgent,
  onSelectAgent,
  onBackToOverview,
  geminiKey
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pulseGroupRef = useRef<SVGGElement | null>(null);

  // Full Graph Studio View (100% Graph Canvas with slide-out POV inspection drawer)
  const layoutMode = 'full';
  const [activeClusterFilter, setActiveClusterFilter] = useState<string>('ALL');
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(true);

  // 1-on-1 Dialogue History per Persona
  const [personaChatHistory, setPersonaChatHistory] = useState<Record<string, PersonaChatMessage[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [drawerThinkingPhase, setDrawerThinkingPhase] = useState(0);
  const drawerThinkingActions = useMemo(() => [
    "Reviewing...",
    "Analyzing copy...",
    "Synthesizing...",
    "Drafting perspective..."
  ], []);

  useEffect(() => {
    if (!isChatLoading) {
      setDrawerThinkingPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setDrawerThinkingPhase(p => (p + 1) % drawerThinkingActions.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isChatLoading, drawerThinkingActions]);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const startersRef = useRef<HTMLDivElement | null>(null);

  // Custom Ultra-Thin 2px Scroller Metrics for Options
  const [scrollerThumbMetrics, setScrollerThumbMetrics] = useState({ widthPct: 35, leftPct: 0 });

  const updateScrollerMetrics = useCallback(() => {
    const el = startersRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollWidth <= clientWidth) {
      setScrollerThumbMetrics({ widthPct: 100, leftPct: 0 });
      return;
    }
    const widthPct = Math.max(16, Math.min(100, (clientWidth / scrollWidth) * 100));
    const maxScroll = scrollWidth - clientWidth;
    const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const maxLeftPct = 100 - widthPct;
    const leftPct = scrollRatio * maxLeftPct;
    setScrollerThumbMetrics({ widthPct, leftPct });
  }, []);

  const personaStarterQuestions = useMemo(() => {
    if (selectedAgent && site) {
      return getPersonaSpecificQuestions(selectedAgent, site, (site as any).manifest);
    }
    return [
      "Why did you bounce without buying?",
      "What price would fit your budget?",
      "What is confusing about the headline?",
      "What single change would convert you?"
    ];
  }, [selectedAgent, site]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollerMetrics();
    }, 50);
    return () => clearTimeout(timer);
  }, [personaStarterQuestions, selectedAgent, updateScrollerMetrics]);

  const handleStartersScroll = () => {
    updateScrollerMetrics();
  };

  const handleScrollerTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = startersRef.current;
    if (!el) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const ratio = Math.max(0, Math.min(1, clickX / trackRect.width));
    const targetScroll = ratio * (el.scrollWidth - el.clientWidth);
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  // Entire Screen Size Mode (100vw/100vh full-bleed view)
  const [isEntireScreen, setIsEntireScreen] = useState(false);
  const studioShellRef = useRef<HTMLDivElement | null>(null);

  // D3 Zoom & Simulation References
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentSimulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  const toggleEntireScreen = async () => {
    const nextState = !isEntireScreen;
    setIsEntireScreen(nextState);

    try {
      if (nextState) {
        if (!document.fullscreenElement && studioShellRef.current?.requestFullscreen) {
          await studioShellRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Gracefully fall back to CSS full-bleed layout
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isEntireScreen) {
        setIsEntireScreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEntireScreen) {
        setIsEntireScreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEntireScreen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      handleResetZoom();
    }, 150);
    return () => clearTimeout(timer);
  }, [isEntireScreen]);

  // Cluster Counts
  const clusterCounts = useMemo(() => {
    if (!engine) return {};
    const counts: Record<string, number> = { ALL: engine.nodes.length };
    engine.nodes.forEach(n => {
      counts[n.cluster] = (counts[n.cluster] || 0) + 1;
    });
    return counts;
  }, [engine]);

  // Initial greeting for selected persona
  useEffect(() => {
    if (!selectedAgent) return;
    setShowDrawer(true);
    setPersonaChatHistory(prev => {
      if (prev[selectedAgent.id]) return prev;
      const initialThought = selectedAgent.activeThought || 'Evaluating the product headline and pricing.';
      const statusReason = selectedAgent.status === 'CONVERTED'
        ? 'The proposed workflow matches my operational priorities.'
        : `I currently bounced. My reservation is: ${selectedAgent.painPoint}.`;

      return {
        ...prev,
        [selectedAgent.id]: [
          {
            id: 'init-1',
            sender: selectedAgent.name,
            role: selectedAgent.role,
            text: `"${initialThought}" As ${selectedAgent.role} at ${selectedAgent.company}, ${statusReason}`,
            isUser: false,
            timestamp: 'Now'
          }
        ]
      };
    });
  }, [selectedAgent]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [personaChatHistory, selectedAgent, isChatLoading]);

  // Core D3.js (v7) SVG Force Simulation Render (Matching MiroFish GraphPanel.vue)
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container || !engine) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();

    // 1. SVG Defs: Marker Arrows & Drop Shadows
    const defs = svg.append('defs');

    // Arrow markers
    defs.append('marker')
      .attr('id', 'arrow-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94A3B8');

    defs.append('marker')
      .attr('id', 'arrow-debates')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#DC2626');

    defs.append('marker')
      .attr('id', 'arrow-agrees')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#16A34A');

    // Node drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '3')
      .attr('flood-opacity', '0.12');

    // Main Zoomable Root Container
    const g = svg.append('g').attr('class', 'graph-root');

    // D3 Zoom Setup (Matching MiroFish .scaleExtent([0.1, 4]))
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3.5])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Center initially based on viewport dimensions
    const initialTransform = d3.zoomIdentity
      .translate(width * (1 - 0.92) / 2, height * (1 - 0.92) / 2)
      .scale(0.92);
    svg.call(zoom.transform, initialTransform);

    // 2. Draw Global Swarm Field & Cluster Halos
    const globalFieldGroup = g.append('g').attr('class', 'global-swarm-field').style('pointer-events', 'none');
    globalFieldGroup.append('circle')
      .attr('class', 'global-field-circle')
      .attr('fill', 'rgba(248, 250, 252, 0.4)')
      .attr('stroke', 'rgba(148, 163, 184, 0.25)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '8,8');

    const clusterGroup = g.append('g').attr('class', 'cluster-halos').style('pointer-events', 'none');
    CLUSTER_ANCHORS.forEach(cluster => {
      const clusterG = clusterGroup.append('g')
        .attr('class', `cluster-${cluster.id}`)
        .attr('opacity', activeClusterFilter === 'ALL' || activeClusterFilter === cluster.id ? 1 : 0.15)
        .style('pointer-events', 'none');

      // Subtle boundary circle
      clusterG.append('circle')
        .attr('class', 'halo-circle')
        .attr('fill', `${cluster.color}08`)
        .attr('stroke', `${cluster.color}35`)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');

      // Cluster Title Label
      clusterG.append('text')
        .attr('class', 'cluster-title')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.06em')
        .attr('fill', cluster.color);

      // Cluster count sublabel
      clusterG.append('text')
        .attr('class', 'cluster-subtitle')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '9px')
        .attr('fill', '#64748B');
    });

    // 3. Prepare Node and Edge Data
    const nodeMap = new Map<string, AgentNode>();
    engine.nodes.forEach(n => nodeMap.set(n.id, n));

    const nodesData = engine.nodes.map(n => ({
      ...n,
      x: n.x,
      y: n.y,
      vx: n.vx || 0,
      vy: n.vy || 0
    }));

    const edgesData = engine.edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        ...e,
        source: e.source,
        target: e.target
      }));

    // Adaptive cluster quadrant anchors
    const clusterTargets: Record<string, { x: number; y: number }> = {
      value_advocacy: { x: width * 0.64, y: height * 0.40 },
      pricing_resistance: { x: width * 0.36, y: height * 0.60 },
      jargon_confusion: { x: width * 0.35, y: height * 0.36 },
      undecided: { x: width * 0.65, y: height * 0.64 }
    };

    // 4. Force Simulation (Matching MiroFish d3.forceSimulation with cluster grouping)
    const simulation = d3.forceSimulation(nodesData as any)
      .force('link', d3.forceLink(edgesData as any).id((d: any) => d.id).distance(100).strength(0.32))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(30))
      .force('clusterX', d3.forceX((d: any) => clusterTargets[d.cluster]?.x || width / 2).strength(0.12))
      .force('clusterY', d3.forceY((d: any) => clusterTargets[d.cluster]?.y || height / 2).strength(0.12));

    currentSimulationRef.current = simulation as any;

    // 5. Draw Links (Curved SVG Paths with Markers)
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup.selectAll<SVGPathElement, any>('path')
      .data(edgesData)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', (d: any) => d.type === 'DEBATES' ? 1.8 : 1.2)
      .attr('stroke', (d: any) => {
        if (d.type === 'DEBATES') return 'rgba(220, 38, 38, 0.45)';
        if (d.type === 'AGREES') return 'rgba(22, 163, 74, 0.45)';
        return 'rgba(203, 213, 225, 0.7)';
      })
      .attr('marker-end', (d: any) => {
        if (d.type === 'DEBATES') return 'url(#arrow-debates)';
        if (d.type === 'AGREES') return 'url(#arrow-agrees)';
        return 'url(#arrow-default)';
      })
      .attr('opacity', (d: any) => {
        if (activeClusterFilter === 'ALL') return 1;
        const src = nodeMap.get(typeof d.source === 'object' ? d.source.id : d.source);
        const tgt = nodeMap.get(typeof d.target === 'object' ? d.target.id : d.target);
        return src?.cluster === activeClusterFilter || tgt?.cluster === activeClusterFilter ? 1 : 0.15;
      });

    // Pulse Particles Layer
    const pulseG = g.append('g').attr('class', 'pulse-particles');
    pulseGroupRef.current = pulseG.node();

    // 6. Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll<SVGGElement, any>('g')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer')
      .attr('opacity', (d: any) => activeClusterFilter === 'ALL' || d.cluster === activeClusterFilter ? 1 : 0.2)
      .on('click', (event: MouseEvent, d: any) => {
        event.stopPropagation();
        onSelectAgent(d);
      });

    // Selection Outer Ring
    nodeElements.append('circle')
      .attr('class', 'selection-ring')
      .attr('r', 21)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => selectedAgent?.id === d.id ? '#1E3A5F' : 'transparent')
      .attr('stroke-width', 2.5);

    // Node Circle Body
    nodeElements.append('circle')
      .attr('r', 15)
      .attr('filter', 'url(#node-shadow)')
      .attr('fill', (d: any) => {
        if (d.cluster === 'pricing_resistance') return '#C2410C';
        if (d.cluster === 'value_advocacy') return '#15803D';
        if (d.cluster === 'jargon_confusion') return '#B91C1C';
        return '#1E3A5F';
      })
      .attr('stroke', (d: any) => d.status === 'CONVERTED' ? '#22C55E' : '#F87171')
      .attr('stroke-width', 2);

    // Node Initials
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-weight', '600')
      .attr('font-size', '9px')
      .attr('fill', '#FFFFFF')
      .text((d: any) => d.initials || '●');

    // Node Name Tag Below
    nodeElements.append('text')
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-serif)')
      .attr('font-weight', '600')
      .attr('font-size', '11px')
      .attr('fill', '#1C1917')
      .text((d: any) => d.name);

    // Node Role Tag Below
    nodeElements.append('text')
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', '8.5px')
      .attr('fill', '#64748B')
      .text((d: any) => d.role?.slice(0, 22) || '');

    // 7. D3 Node Drag Behavior
    const drag = d3.drag<SVGGElement, any>()
      .on('start', (event: any, d: any) => {
        if (!event.active && !isPhysicsPaused) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active && !isPhysicsPaused) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeElements.call(drag as any);

    // 8. Simulation Tick Callback (Calculating Curved Paths)
    let pulseStep = 0;
    simulation.on('tick', () => {
      // Calculate curved link path
      links.attr('d', (d: any) => {
        const sx = d.source.x;
        const sy = d.source.y;
        const tx = d.target.x;
        const ty = d.target.y;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const offset = 18;
        const cx = (sx + tx) / 2 - (dy / dist) * offset;
        const cy = (sy + ty) / 2 + (dx / dist) * offset;
        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      });

      // Update Node positions
      nodeElements.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      // Update Global Swarm Field circle around all nodes
      if (nodesData.length > 0) {
        let allX = 0;
        let allY = 0;
        nodesData.forEach((n: any) => { allX += n.x; allY += n.y; });
        const gCx = allX / nodesData.length;
        const gCy = allY / nodesData.length;
        let gMaxR = 0;
        nodesData.forEach((n: any) => {
          const dist = Math.hypot(n.x - gCx, n.y - gCy);
          if (dist > gMaxR) gMaxR = dist;
        });
        globalFieldGroup.select('.global-field-circle')
          .attr('cx', gCx)
          .attr('cy', gCy)
          .attr('r', Math.max(140, gMaxR + 50));
      }

      // Update Cluster Field Circles to properly surround the actual nodes
      CLUSTER_ANCHORS.forEach(cluster => {
        const clusterNodes = nodesData.filter((n: any) => n.cluster === cluster.id);
        const haloG = clusterGroup.select(`.cluster-${cluster.id}`);

        if (clusterNodes.length === 0 || (activeClusterFilter !== 'ALL' && activeClusterFilter !== cluster.id)) {
          haloG.attr('display', 'none');
          return;
        }
        haloG.attr('display', 'inline');

        let sumX = 0;
        let sumY = 0;
        clusterNodes.forEach((n: any) => {
          sumX += n.x;
          sumY += n.y;
        });
        const cx = sumX / clusterNodes.length;
        const cy = sumY / clusterNodes.length;

        let maxDist = 0;
        clusterNodes.forEach((n: any) => {
          const dist = Math.hypot(n.x - cx, n.y - cy);
          if (dist > maxDist) maxDist = dist;
        });
        const r = Math.max(65, maxDist + 42);

        haloG.select('.halo-circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r);

        haloG.select('.cluster-title')
          .attr('x', cx)
          .attr('y', cy - r + 20)
          .text(cluster.name.toUpperCase());

        haloG.select('.cluster-subtitle')
          .attr('x', cx)
          .attr('y', cy - r + 33)
          .text(`${clusterNodes.length} PERSONAS DELIBERATING`);
      });

      // Update pulse particles
      pulseStep = (pulseStep + 0.015) % 1;
      const debatingEdges = edgesData.filter(e => e.type === 'DEBATES' || e.type === 'AGREES');
      const particleSelection = pulseG.selectAll<SVGCircleElement, any>('circle')
        .data(debatingEdges, (d: any) => `${d.source.id || d.source}_${d.target.id || d.target}`);

      particleSelection.enter()
        .append('circle')
        .attr('r', 3)
        .attr('fill', (d: any) => d.type === 'DEBATES' ? '#DC2626' : '#16A34A')
        .merge(particleSelection)
        .attr('cx', (d: any) => {
          const sx = d.source.x || 0;
          const tx = d.target.x || 0;
          return sx + (tx - sx) * pulseStep;
        })
        .attr('cy', (d: any) => {
          const sy = d.source.y || 0;
          const ty = d.target.y || 0;
          return sy + (ty - sy) * pulseStep;
        });

      particleSelection.exit().remove();
    });

    if (isPhysicsPaused) {
      simulation.stop();
    }

    return () => {
      simulation.stop();
    };
  }, [engine, activeClusterFilter, isPhysicsPaused, clusterCounts, layoutMode, selectedAgent, isEntireScreen]);

  // Zoom Button Handlers
  const handleZoom = (scaleFactor: number) => {
    const svgEl = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svgEl || !zoom) return;

    d3.select(svgEl).transition().duration(250).call(zoom.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    const svgEl = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    const container = containerRef.current;
    if (!svgEl || !zoom || !container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;
    const initialTransform = d3.zoomIdentity
      .translate(width * (1 - 0.92) / 2, height * (1 - 0.92) / 2)
      .scale(0.92);
    d3.select(svgEl).transition().duration(400).call(zoom.transform, initialTransform);
  };

  // Focus and select specific agent
  const handleSelectAgentAndFocus = (agent: AgentNode) => {
    onSelectAgent(agent);
    const svgEl = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    const container = containerRef.current;
    if (!svgEl || !zoom || !container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;
    const scale = 1.4;
    const targetTransform = d3.zoomIdentity
      .translate(width / 2 - agent.x * scale, height / 2 - agent.y * scale)
      .scale(scale);

    d3.select(svgEl).transition().duration(500).call(zoom.transform, targetTransform);
  };

  // 1-on-1 Persona Point of View Chat Message Handler
  const handleSendPersonaMessage = async (customPrompt?: string) => {
    const query = (customPrompt || chatInput).trim();
    if (!query || !selectedAgent || isChatLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: PersonaChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'You',
      role: 'Reviewer',
      text: query,
      isUser: true,
      timestamp
    };

    setPersonaChatHistory(prev => ({
      ...prev,
      [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMessage]
    }));
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          persona: {
            name: selectedAgent.name,
            role: selectedAgent.role,
            archetype: selectedAgent.cluster
          },
          site: {
            headline: site.headline,
            subhead: site.subhead,
            pricing: site.pricing,
            cta: site.cta,
            manifest: (site as any).manifest
          },
          apiKey: geminiKey
        })
      });

      const data = await res.json();
      const answerText = data.answer || `As ${selectedAgent.role}, regarding "${query}": I evaluate this landing page based on budget visibility and immediate clarity.`;

      const aiReply: PersonaChatMessage = {
        id: `ai-${Date.now()}`,
        sender: selectedAgent.name,
        role: `${selectedAgent.role} (${geminiKey ? 'Gemini AI' : 'Persona POV'})`,
        text: answerText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setPersonaChatHistory(prev => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), aiReply]
      }));
    } catch {
      const fallbackReply: PersonaChatMessage = {
        id: `err-${Date.now()}`,
        sender: selectedAgent.name,
        role: selectedAgent.role,
        text: `As ${selectedAgent.role}, my core reservation is: ${selectedAgent.painPoint}. The pricing of "${site.pricing || 'undisclosed'}" needs clearer justification before I can proceed.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPersonaChatHistory(prev => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), fallbackReply]
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  const currentChat = selectedAgent ? (personaChatHistory[selectedAgent.id] || []) : [];

  return (
    <div
      ref={studioShellRef}
      className={`mirofish-studio-shell ${isEntireScreen ? 'is-entire-screen' : ''}`}
    >
      {/* 1. Header Toolbar (MiroFish Style) */}
      <header className="mirofish-studio-header">
        <div className="header-brand-block">
          <button className="btn-editorial-secondary" onClick={onBackToOverview} title="Return to Overview">
            ← Back to Overview
          </button>
          <div className="title-column">
            <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
              MIROFISH SWARM NETWORK VISUALIZER
            </span>
            <h1 className="header-site-title">{site.headline}</h1>
          </div>
        </div>

        {/* Entire Screen Size Option */}
        <button
          className={`btn-editorial-secondary ${isEntireScreen ? 'btn-active-entire' : ''}`}
          onClick={toggleEntireScreen}
          title={isEntireScreen ? 'Exit Entire Screen (Esc)' : 'Open graph in entire screen size'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600,
            fontSize: '0.78rem',
            padding: '0.4rem 0.85rem',
            background: isEntireScreen ? 'var(--accent-navy)' : 'var(--bg-surface)',
            color: isEntireScreen ? '#FFFFFF' : 'var(--ink-primary)',
            borderColor: isEntireScreen ? 'var(--accent-navy)' : 'var(--border-rule)',
            borderRadius: '4px'
          }}
        >
          <span>{isEntireScreen ? '✕ Exit Entire Screen' : '⛶ Entire Screen Size'}</span>
        </button>

        {/* Search Persona Filter */}
        <div className="header-search-wrap">
          <input
            type="text"
            className="editorial-input search-input-box"
            placeholder="Search persona by name or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="search-dropdown-menu">
              {engine?.nodes
                .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.role.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 6)
                .map(n => (
                  <button
                    key={n.id}
                    className="search-item-btn"
                    onClick={() => {
                      handleSelectAgentAndFocus(n);
                      setSearchQuery('');
                    }}
                  >
                    <div>
                      <strong>{n.name}</strong> · <span className="item-role">{n.role}</span>
                    </div>
                    <span className={`status-pill ${n.status === 'CONVERTED' ? 'status-pass' : 'status-fail'}`}>
                      {n.status}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. Cluster Filter Sub-Bar */}
      <div className="cluster-subbar">
        <div className="cluster-chips-row">
          {[
            { id: 'ALL', label: 'All 50 Personas' },
            { id: 'pricing_resistance', label: 'Pricing Objection' },
            { id: 'value_advocacy', label: 'Value Advocates' },
            { id: 'jargon_confusion', label: 'Headline Skeptics' }
          ].map(chip => (
            <button
              key={chip.id}
              className={`cluster-chip-btn ${activeClusterFilter === chip.id ? 'active' : ''}`}
              onClick={() => setActiveClusterFilter(chip.id)}
            >
              <span>{chip.label}</span>
              <strong className="chip-badge">({clusterCounts[chip.id] || 0})</strong>
            </button>
          ))}
        </div>

        <div className="quick-actions-row">
          <button
            className="btn-editorial-secondary"
            onClick={() => setIsPhysicsPaused(!isPhysicsPaused)}
            title="Toggle Physics Simulation"
          >
            {isPhysicsPaused ? '▶ Resume Physics' : '⏸ Pause Physics'}
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Full Graph Canvas */}
      <div className="mirofish-workspace-body is-full">
        {/* GRAPH PANEL (Authentic MiroFish SVG Dot-Grid Canvas) */}
        <div className="mirofish-graph-panel" ref={containerRef}>
          <svg ref={svgRef} className="mirofish-graph-svg"></svg>

          {/* Floating MiroFish HUD Controls */}
          <div className="mirofish-floating-hud">
            <button className="hud-icon-btn" onClick={() => handleZoom(1.3)} title="Zoom In (+)">
              +
            </button>
            <button className="hud-icon-btn" onClick={() => handleZoom(0.75)} title="Zoom Out (-)">
              −
            </button>
            <button className="hud-icon-btn" onClick={handleResetZoom} title="Reset View (Center)">
              ⊙
            </button>
            <button
              className="hud-icon-btn"
              onClick={toggleEntireScreen}
              title={isEntireScreen ? 'Exit Entire Screen (Esc)' : 'Open Entire Screen Size'}
              style={{
                color: isEntireScreen ? 'var(--accent-terracotta)' : 'inherit',
                fontWeight: 700
              }}
            >
              {isEntireScreen ? '✕' : '⛶'}
            </button>
            <div className="hud-divider" />
            {selectedAgent && !showDrawer && (
              <button
                className="hud-text-btn"
                onClick={() => setShowDrawer(true)}
              >
                💬 Open POV Drawer ({selectedAgent.name})
              </button>
            )}
          </div>

          {/* MiroFish Graph Legend (Bottom Left) */}
          <div className="mirofish-legend-box">
            <span className="legend-title">SWARM ENTITY LEGEND</span>
            <div className="legend-grid">
              <span className="legend-entry"><span className="dot dot-green" /> Converted Advocate</span>
              <span className="legend-entry"><span className="dot dot-orange" /> Pricing Objection</span>
              <span className="legend-entry"><span className="dot dot-red" /> Headline Skeptic</span>
              <span className="legend-entry"><span className="dot dot-navy" /> Evaluating Cohort</span>
            </div>
            <div className="legend-hint">Scroll wheel to zoom • Drag background to pan • Click node to interrogate</div>
          </div>
        </div>

        {/* INTERACTION WORKBENCH / DRAWER (1-on-1 Point of View Chat) */}
        {selectedAgent && showDrawer && (
          <aside className="mirofish-interaction-drawer drawer-overlay">
            {/* Drawer Header */}
            <div className="drawer-header-bar">
              <div className="drawer-persona-info">
                <div
                  className="drawer-avatar-circle"
                  style={{
                    background:
                      selectedAgent.cluster === 'pricing_resistance'
                        ? '#C2410C'
                        : selectedAgent.cluster === 'value_advocacy'
                        ? '#15803D'
                        : selectedAgent.cluster === 'jargon_confusion'
                        ? '#B91C1C'
                        : '#1E3A5F'
                  }}
                >
                  {selectedAgent.initials}
                </div>
                <div className="drawer-text-col">
                  <div className="name-and-status">
                    <strong className="agent-display-name">{selectedAgent.name}</strong>
                    <span className={`status-pill ${selectedAgent.status === 'CONVERTED' ? 'status-pass' : 'status-fail'}`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                  <div className="agent-role-line">
                    {selectedAgent.role} · <em>{selectedAgent.company}</em>
                  </div>
                </div>
              </div>

              {layoutMode === 'full' && (
                <button
                  className="btn-close-drawer"
                  onClick={() => setShowDrawer(false)}
                  aria-label="Close Persona Drawer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Persona Point of View & Traits */}
            <div className="drawer-point-of-view">
              <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                PERSONA POINT OF VIEW &amp; MONOLOGUE:
              </span>
              <p className="pov-thought-quote">"{selectedAgent.activeThought}"</p>
              <div className="trait-badges-row">
                <span className="trait-pill">Demographic: <strong>{selectedAgent.demographic}</strong></span>
                <span className="trait-pill">Price Sensitivity: <strong>{selectedAgent.traits.priceSensitivity}%</strong></span>
                <span className="trait-pill">Skepticism: <strong>{selectedAgent.traits.skepticism}%</strong></span>
              </div>
            </div>

            {/* Observed Swarm Deliberation */}
            {selectedAgent.recentDebates && selectedAgent.recentDebates.length > 0 && (
              <div className="drawer-debate-exchange">
                <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontSize: '0.65rem' }}>
                  OBSERVED PEER CONSENSUS EXCHANGE:
                </span>
                <p className="debate-snippet">
                  {selectedAgent.recentDebates[selectedAgent.recentDebates.length - 1]}
                </p>
              </div>
            )}

            {/* 1-on-1 Dialogue Stream with Gemini AI */}
            <div className="drawer-dialogue-section">
              <div className="dialogue-header-line">
                <span className="mono-tag" style={{ color: 'var(--accent-navy)', fontWeight: 700 }}>
                  1-ON-1 INTERROGATION STREAM:
                </span>
                <span className="dialogue-sub">Point of view dialogue with {selectedAgent.name}</span>
              </div>

              <div className="dialogue-scroll-box" ref={chatScrollRef}>
                {currentChat.map(msg => (
                  <div key={msg.id} className={`dialogue-turn-row ${msg.isUser ? 'turn-user' : 'turn-persona'}`}>
                    <div className="turn-meta">
                      <strong>{msg.sender}</strong> <span className="turn-time">{msg.timestamp}</span>
                    </div>
                    <div className={`turn-speech-bubble ${msg.isUser ? 'bubble-user-style' : 'bubble-persona-style'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="simple-thinking-row" style={{ padding: '0.45rem 0', margin: '0.2rem 0' }} aria-live="polite">
                    <span className="pulse-beacon-dot" />
                    <div className="simple-thinking-content">
                      <span className="simple-thinking-name">{selectedAgent.name}</span>
                      <span className="simple-thinking-action">
                        {drawerThinkingActions[drawerThinkingPhase]}
                      </span>
                      <span className="minimal-typing-dots">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Starter Question Chips - Dynamically tailored to Persona & Website */}
              <div className="prompt-starters-container">
                <button
                  type="button"
                  className="starters-nav-arrow"
                  onClick={() => startersRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                  title="Scroll options left (‹)"
                  aria-label="Scroll options left"
                >
                  ‹
                </button>
                <div className="prompt-starters-center-col">
                  <div
                    className="prompt-starters-wrap"
                    ref={startersRef}
                    onScroll={handleStartersScroll}
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                  >
                    {personaStarterQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        className="starter-btn-chip"
                        onClick={() => handleSendPersonaMessage(q)}
                        disabled={isChatLoading}
                        title={`Ask ${selectedAgent.name}: "${q}"`}
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                  {/* Custom Ultra-Thin 2px Scroller Track */}
                  <div
                    className="custom-thin-scroller-track"
                    onClick={handleScrollerTrackClick}
                    title="Click or drag to navigate all options"
                  >
                    <div
                      className="custom-thin-scroller-thumb"
                      style={{
                        width: `${scrollerThumbMetrics.widthPct}%`,
                        left: `${scrollerThumbMetrics.leftPct}%`
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="starters-nav-arrow"
                  onClick={() => startersRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                  title="Scroll options right (›)"
                  aria-label="Scroll options right"
                >
                  ›
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="dialogue-input-bar">
                <input
                  type="text"
                  className="editorial-input dialogue-text-input"
                  placeholder={isChatLoading ? `${selectedAgent.name} is reviewing...` : `Ask ${selectedAgent.name} directly from their perspective...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendPersonaMessage()}
                  disabled={isChatLoading}
                />
                <button
                  className="btn-editorial-primary"
                  onClick={() => handleSendPersonaMessage()}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  {isChatLoading ? 'Reviewing...' : 'Send'}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
