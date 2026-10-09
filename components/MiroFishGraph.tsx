'use client';
// components/MiroFishGraph.tsx - Authentic MiroFish D3.js (v7) SVG Force-Directed Swarm Graph
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AgentNode, GraphEdge } from '../lib/personas';
import { MiroFishSimulationEngine, CLUSTER_ANCHORS } from '../lib/graph-engine';

interface MiroFishGraphProps {
  engine: MiroFishSimulationEngine | null;
  onSelectAgent: (agent: AgentNode) => void;
  selectedAgent: AgentNode | null;
  onExpandStudio?: (agent?: AgentNode) => void;
}

export const MiroFishGraph: React.FC<MiroFishGraphProps> = ({
  engine,
  onSelectAgent,
  selectedAgent,
  onExpandStudio
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentNode | null>(null);
  const [activeClusterFilter, setActiveClusterFilter] = useState<string>('ALL');
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Zoom reference
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Cluster colors matching MiroFish palette
  const getClusterColor = (cluster: string) => {
    switch (cluster) {
      case 'value_advocacy': return '#15803D'; // Green
      case 'pricing_resistance': return '#FF6B35'; // Coral/Orange
      case 'jargon_confusion': return '#E91E63'; // Magenta/Crimson
      default: return '#004E89'; // Deep Navy
    }
  };

  // Node count per cluster
  const clusterCounts = useMemo(() => {
    if (!engine) return {};
    const counts: Record<string, number> = { ALL: engine.nodes.length };
    engine.nodes.forEach(n => {
      counts[n.cluster] = (counts[n.cluster] || 0) + 1;
    });
    return counts;
  }, [engine]);

  // Main D3 SVG Force Graph Simulation
  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl || !engine) return;

    const width = container.clientWidth || 800;
    const height = 480;

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();

    // SVG Defs: Marker Arrows & Filters
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'mf-arrow-overview')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#9CA3AF');

    defs.append('marker')
      .attr('id', 'mf-arrow-overview-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#E91E63');

    // Container Group for Zoom/Pan
    const g = svg.append('g').attr('class', 'graph-viewport');

    // D3 Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Filter nodes and edges by active cluster
    const filteredNodes = engine.nodes.filter(
      n => activeClusterFilter === 'ALL' || n.cluster === activeClusterFilter
    );
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = engine.edges.filter(
      e => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    // Compute edge curvature for multi-edges
    const edgePairCount: Record<string, number> = {};
    filteredEdges.forEach(e => {
      const pair = [e.source, e.target].sort().join('_');
      edgePairCount[pair] = (edgePairCount[pair] || 0) + 1;
    });

    const edgePairIndex: Record<string, number> = {};
    const d3Links = filteredEdges.map(e => {
      const pair = [e.source, e.target].sort().join('_');
      const total = edgePairCount[pair] || 1;
      const index = edgePairIndex[pair] || 0;
      edgePairIndex[pair] = index + 1;

      let curvature = 0;
      if (total > 1) {
        curvature = ((index / (total - 1)) - 0.5) * 0.8;
      }
      return {
        source: e.source,
        target: e.target,
        type: e.type,
        weight: (e as any).weight || 1,
        curvature,
        raw: e
      };
    });

    // D3 Force Simulation (Matching MiroFish parameters)
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(d3Links).id((d: any) => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(32))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    // Draw Links (Curved SVG Paths)
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll<SVGPathElement, any>('path')
      .data(d3Links)
      .enter().append('path')
      .attr('stroke', (d: any) => d.type === 'DEBATES' ? 'rgba(233, 30, 99, 0.45)' : 'rgba(209, 213, 219, 0.75)')
      .attr('stroke-width', (d: any) => d.type === 'DEBATES' ? 1.8 : 1.2)
      .attr('stroke-dasharray', (d: any) => d.type === 'DEBATES' ? '4,3' : 'none')
      .attr('fill', 'none')
      .attr('marker-end', (d: any) => d.type === 'DEBATES' ? 'url(#mf-arrow-overview-active)' : 'url(#mf-arrow-overview)');

    // Optional Edge Labels
    let linkLabels: d3.Selection<SVGTextElement, any, SVGGElement, unknown> | null = null;
    let linkLabelBgs: d3.Selection<SVGRectElement, any, SVGGElement, unknown> | null = null;

    if (showEdgeLabels) {
      const labelGroup = g.append('g').attr('class', 'edge-labels');
      linkLabelBgs = labelGroup.selectAll<SVGRectElement, any>('rect')
        .data(d3Links)
        .enter().append('rect')
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 0.5)
        .attr('rx', 3);

      linkLabels = labelGroup.selectAll<SVGTextElement, any>('text')
        .data(d3Links)
        .enter().append('text')
        .text((d: any) => d.type)
        .attr('font-size', '9px')
        .attr('fill', '#6B7280')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style('pointer-events', 'none');
    }

    // Draw Nodes (SVG Circles with white border)
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll<SVGGElement, AgentNode>('g')
      .data(filteredNodes)
      .enter().append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer');

    // Outer Halo for selection / hover
    node.append('circle')
      .attr('class', 'node-halo')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', (d: AgentNode) => getClusterColor(d.cluster))
      .attr('stroke-width', 2.5)
      .attr('opacity', (d: AgentNode) => selectedAgent?.id === d.id ? 1 : 0);

    // Main Circle
    node.append('circle')
      .attr('class', 'node-main-circle')
      .attr('r', 10)
      .attr('fill', (d: AgentNode) => getClusterColor(d.cluster))
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2.5);

    // Node Initials Text
    node.append('text')
      .text((d: AgentNode) => d.initials || d.name.substring(0, 2).toUpperCase())
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('fill', '#FFFFFF')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('pointer-events', 'none');

    // Node Label (Right of circle)
    node.append('text')
      .text((d: AgentNode) => d.name.length > 12 ? d.name.substring(0, 11) + '…' : d.name)
      .attr('dx', 15)
      .attr('dy', 3)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#1F2937')
      .style('pointer-events', 'none')
      .style('font-family', 'var(--font-sans)');

    // D3 Drag Behavior
    node.call(
      d3.drag<SVGGElement, AgentNode>()
        .on('start', (event, d: any) => {
          if (!event.active && !isPaused) simulation.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active && !isPaused) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // Click to Select & Interrogate
    node.on('click', (event, d: AgentNode) => {
      event.stopPropagation();
      onSelectAgent(d);
      if (onExpandStudio) {
        onExpandStudio(d);
      }
    });

    // Hover effect
    node.on('mouseenter', (event, d: AgentNode) => {
      setHoveredAgent(d);
      d3.select(event.currentTarget as SVGGElement).select('.node-halo').attr('opacity', 1);
    });

    node.on('mouseleave', (event, d: AgentNode) => {
      setHoveredAgent(null);
      if (selectedAgent?.id !== d.id) {
        d3.select(event.currentTarget as SVGGElement).select('.node-halo').attr('opacity', 0);
      }
    });

    // Simulation Tick Updates
    simulation.on('tick', () => {
      // Calculate curved path
      link.attr('d', (d: any) => {
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        if (!d.curvature) return `M${sx},${sy} L${tx},${ty}`;

        const dx = tx - sx, dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const offset = dist * 0.25 * d.curvature;
        const cx = (sx + tx) / 2 - (dy / dist) * offset;
        const cy = (sy + ty) / 2 + (dx / dist) * offset;
        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      });

      if (showEdgeLabels && linkLabels && linkLabelBgs) {
        linkLabels.each(function(d: any) {
          const sx = d.source.x, sy = d.source.y;
          const tx = d.target.x, ty = d.target.y;
          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;
          d3.select(this).attr('x', midX).attr('y', midY);
        });

        linkLabelBgs.each(function(d: any, i) {
          const textEl = linkLabels!.nodes()[i];
          if (textEl) {
            const bbox = textEl.getBBox();
            d3.select(this)
              .attr('x', bbox.x - 3)
              .attr('y', bbox.y - 1)
              .attr('width', bbox.width + 6)
              .attr('height', bbox.height + 2);
          }
        });
      }

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [engine, activeClusterFilter, showEdgeLabels, selectedAgent, isPaused]);

  // Handle Zoom buttons
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy,
      factor
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="editorial-card mirofish-overview-container" style={{ padding: '1.25rem', background: '#FFFFFF', position: 'relative' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span className="mono-tag" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
            AUTHENTIC MIROFISH D3.JS SVG GRAPH
          </span>
          <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0', color: '#111827', fontWeight: 600 }}>
            50-Agent Swarm Relationship Visualization
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
            Powered by D3.js (v7) SVG force-simulation. Click any agent to open Full Graph Studio &amp; POV dialogue.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn-editorial-secondary"
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {showEdgeLabels ? 'Hide Edge Labels' : 'Show Edge Labels'}
          </button>
          <button
            className="btn-editorial-secondary"
            onClick={() => setIsPaused(!isPaused)}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            className="btn-editorial-primary"
            onClick={() => onExpandStudio && onExpandStudio(selectedAgent || undefined)}
            style={{ background: '#111827', color: '#FFFFFF', padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>⛶ Open Full Graph Studio</span>
          </button>
        </div>
      </div>

      {/* Cluster Filter Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All 50 Agents' },
          { id: 'pricing_resistance', label: 'Pricing Objections' },
          { id: 'value_advocacy', label: 'Value Advocates' },
          { id: 'jargon_confusion', label: 'Headline Skeptics' }
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setActiveClusterFilter(chip.id)}
            style={{
              padding: '0.3rem 0.7rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: '20px',
              border: activeClusterFilter === chip.id ? '1px solid #111827' : '1px solid #E5E7EB',
              background: activeClusterFilter === chip.id ? '#111827' : '#F9FAFB',
              color: activeClusterFilter === chip.id ? '#FFFFFF' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {chip.label} ({clusterCounts[chip.id] || 0})
          </button>
        ))}
      </div>

      {/* D3 SVG Canvas Container with MiroFish Dot Matrix Background */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '480px',
          backgroundColor: '#FAFAFA',
          backgroundImage: 'radial-gradient(#D0D0D0 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>

        {/* Floating Zoom / Pan HUD */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px', background: '#FFFFFF', padding: '4px', borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => handleZoom(1.3)}
            style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: '#374151', borderRadius: '4px' }}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(0.75)}
            style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: '#374151', borderRadius: '4px' }}
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#374151', borderRadius: '4px' }}
            title="Reset View"
          >
            ⊙
          </button>
        </div>

        {/* Bottom Legend */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(6px)', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#15803D' }}></span> Advocates
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FF6B35' }}></span> Pricing Objection
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E91E63' }}></span> Headline Confusion
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#004E89' }}></span> Evaluating
          </span>
          <span style={{ color: '#9CA3AF', fontStyle: 'italic', marginLeft: '0.5rem' }}>
            Click node for 1-on-1 POV interrogation
          </span>
        </div>
      </div>

      {/* Selected Agent Quick Preview Card */}
      {selectedAgent && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono-tag" style={{ color: '#6B7280' }}>{selectedAgent.id.toUpperCase()}</span>
                <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{selectedAgent.name}</strong>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>— {selectedAgent.role} at {selectedAgent.company}</span>
                <span className={`status-pill ${selectedAgent.status === 'CONVERTED' ? 'status-pass' : 'status-fail'}`}>
                  {selectedAgent.status}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#4B5563', fontStyle: 'italic' }}>
                "{selectedAgent.activeThought}"
              </p>
            </div>

            <button
              className="btn-editorial-primary"
              onClick={() => onExpandStudio && onExpandStudio(selectedAgent)}
              style={{ background: '#111827', color: '#FFFFFF', fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              💬 Interrogate {selectedAgent.name} (1-on-1) →
            </button>
          </div>

          {/* Peer Deliberation Box (e.g. Sophia & Ethan) */}
          {(() => {
            const rawDebate = selectedAgent.recentDebates?.slice(-1)[0];
            if (!rawDebate) return null;
            const parts = rawDebate.split(' → ');
            const parseSpeaker = (str: string) => {
              const idx = str.indexOf(': ');
              return idx !== -1
                ? { name: str.slice(0, idx).trim(), text: str.slice(idx + 2).trim() }
                : { name: '', text: str };
            };
            const s1 = parseSpeaker(parts[0]);
            const s2 = parts[1] ? parseSpeaker(parts[1]) : null;

            return (
              <div className="dossier-conversation-box" style={{ marginTop: '0.75rem' }}>
                <div className="conversation-header">
                  <span className="mono-tag debate-tag">OBSERVED PEER DELIBERATION</span>
                  <span className="conversation-sub">Swarm consensus exchange</span>
                </div>

                <div className="dialogue-thread">
                  <div className="dialogue-turn speaker-first">
                    <div className="speaker-avatar" aria-hidden="true">
                      {s1.name ? s1.name[0] : '●'}
                    </div>
                    <div className="bubble-wrapper">
                      <div className="speaker-meta">
                        <strong className="speaker-title">{s1.name}</strong>
                        <span className="speaker-subtag">Initial Perspective</span>
                      </div>
                      <div className="speech-bubble">
                        "{s1.text}"
                      </div>
                    </div>
                  </div>

                  {s2 && (
                    <div className="dialogue-connector">
                      <span className="connector-line" />
                      <span className="connector-badge">⚡ Counterpoint / Deliberation</span>
                      <span className="connector-line" />
                    </div>
                  )}

                  {s2 && (
                    <div className="dialogue-turn speaker-second">
                      <div className="speaker-avatar alt" aria-hidden="true">
                        {s2.name ? s2.name[0] : '●'}
                      </div>
                      <div className="bubble-wrapper">
                        <div className="speaker-meta">
                          <strong className="speaker-title">{s2.name}</strong>
                          <span className="speaker-subtag">Peer Response</span>
                        </div>
                        <div className="speech-bubble alt">
                          "{s2.text}"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
