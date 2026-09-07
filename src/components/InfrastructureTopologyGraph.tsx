/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Server, Database, Terminal, GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'caddy' | 'ansible' | 'influxdb' | 'opensearch';
  status: 'healthy' | 'warning' | 'critical';
}

interface Link {
  source: string;
  target: string;
}

const nodes: Node[] = [
  { id: 'caddy', label: 'Caddy Ingress', type: 'caddy', status: 'healthy' },
  { id: 'ansible', label: 'Ansible Controller', type: 'ansible', status: 'healthy' },
  { id: 'influxdb', label: 'InfluxDB', type: 'influxdb', status: 'healthy' },
  { id: 'opensearch', label: 'OpenSearch', type: 'opensearch', status: 'warning' },
];

const links: Link[] = [
  { source: 'caddy', target: 'ansible' },
  { source: 'caddy', target: 'influxdb' },
  { source: 'ansible', target: 'opensearch' },
  { source: 'influxdb', target: 'opensearch' },
];

export const InfrastructureTopologyGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#475569')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 20)
      .attr('fill', d => d.status === 'healthy' ? '#10b981' : d.status === 'warning' ? '#f59e0b' : '#f43f5e');

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.label)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', 40);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
  }, []);

  return <svg ref={svgRef} width="800" height="400" className="w-full h-auto bg-black rounded-xl border border-white/10" />;
};
