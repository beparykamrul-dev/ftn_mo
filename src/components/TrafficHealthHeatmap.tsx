/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Flame,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Filter,
  Layers,
  Database,
  Radio,
  Zap,
  Sparkles
} from 'lucide-react';
import { TrafficHealthCell } from '../types';

interface TrafficHealthHeatmapProps {
  onSelectAnomaly?: (cell: TrafficHealthCell) => void;
}

const NODES = [
  'caddy-ingress-01',
  'api-gateway-core',
  'coraza-waf-shield',
  'auth-token-proxy',
  'opensearch-log-sink'
];

// Generate realistic initial 20 time buckets for the 5 services
function generateInitialHeatmapData(): TrafficHealthCell[] {
  const cells: TrafficHealthCell[] = [];
  const now = Date.now();
  const timeStepMs = 3 * 60 * 1000; // 3-minute buckets

  for (let t = 19; t >= 0; t--) {
    const timestamp = new Date(now - t * timeStepMs);
    const timeLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeBucket = timestamp.toISOString();

    NODES.forEach((node, nodeIdx) => {
      // Deterministic variations with a couple realistic anomalies
      const isCorazaSpike = node === 'coraza-waf-shield' && (t === 4 || t === 5);
      const isLogBurster = node === 'opensearch-log-sink' && t === 12;

      let anomalyScore = Math.random() * 0.15;
      let errorRate = Math.random() * 0.8;
      let latency = 12 + Math.random() * 8;
      let reqs = 150 + Math.floor(Math.random() * 80);
      let pattern = 'Normal steady-state ingress';
      let status: 'healthy' | 'elevated' | 'critical' = 'healthy';
      const source: 'influxdb' | 'opensearch' | 'unified' = nodeIdx % 2 === 0 ? 'influxdb' : 'opensearch';

      if (isCorazaSpike) {
        anomalyScore = 0.88;
        errorRate = 7.4;
        latency = 48.2;
        reqs = 390;
        pattern = 'OpenSearch: OWASP CRS Rule 942100 (SQLi Pattern Burst)';
        status = 'critical';
      } else if (isLogBurster) {
        anomalyScore = 0.65;
        errorRate = 3.2;
        latency = 31.0;
        reqs = 280;
        pattern = 'InfluxDB: High Upstream Connect Latency Spike';
        status = 'elevated';
      } else if (Math.random() > 0.85) {
        anomalyScore = 0.35;
        errorRate = 1.8;
        status = 'elevated';
        pattern = 'Minor telemetry jitter detected by InfluxDB';
      }

      cells.push({
        id: `${node}-${t}`,
        timeBucket,
        timeLabel,
        nodeName: node,
        reqsPerSec: reqs,
        latencyMs: parseFloat(latency.toFixed(1)),
        errorRatePercent: parseFloat(errorRate.toFixed(2)),
        anomalyScore: parseFloat(anomalyScore.toFixed(2)),
        source,
        anomalyPattern: pattern,
        status
      });
    });
  }

  return cells;
}

export const TrafficHealthHeatmap: React.FC<TrafficHealthHeatmapProps> = ({ onSelectAnomaly }) => {
  const [data, setData] = useState<TrafficHealthCell[]>(generateInitialHeatmapData);
  const [activeSource, setActiveSource] = useState<'all' | 'influxdb' | 'opensearch'>('all');
  const [metricMode, setMetricMode] = useState<'health' | 'anomaly' | 'latency' | 'errors'>('health');
  const [hoveredCell, setHoveredCell] = useState<TrafficHealthCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (activeSource === 'all') return data;
    return data.filter((c) => c.source === activeSource);
  }, [data, activeSource]);

  // Unique time labels and nodes
  const timeLabels = useMemo(() => {
    const set = new Set<string>();
    data.forEach((c) => set.add(c.timeLabel));
    return Array.from(set);
  }, [data]);

  // Inject synthetic anomaly for interactive demonstration
  const handleInjectAnomaly = () => {
    const updated = [...data];
    const randomIndex = Math.floor(Math.random() * updated.length);
    const target = updated[randomIndex];
    target.anomalyScore = 0.94;
    target.errorRatePercent = 9.8;
    target.latencyMs = 88.4;
    target.status = 'critical';
    target.anomalyPattern = 'Simulated DDoS surge detected across InfluxDB & OpenSearch pipeline';
    setData(updated);
    setHoveredCell(target);
  };

  // Reset to nominal
  const handleResetData = () => {
    setData(generateInitialHeatmapData());
  };

  // D3 Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 35, right: 30, bottom: 40, left: 145 };
    const height = 230;
    const width = containerWidth;

    svg.attr('width', width).attr('height', height);

    // X scale: Time intervals
    const xScale = d3
      .scaleBand()
      .domain(timeLabels)
      .range([margin.left, width - margin.right])
      .padding(0.08);

    // Y scale: Ingress nodes / services
    const yScale = d3
      .scaleBand()
      .domain(NODES)
      .range([margin.top, height - margin.bottom])
      .padding(0.12);

    // D3 Color interpolation based on metricMode
    const getColor = (d: TrafficHealthCell): string => {
      if (metricMode === 'health') {
        // High health = emerald green; Elevated = amber; Anomaly = rose
        if (d.status === 'critical') return '#f43f5e';
        if (d.status === 'elevated') return '#f59e0b';
        return '#10b981';
      }

      if (metricMode === 'anomaly') {
        // Continuous scale from dark cyan -> amber -> bright rose
        const interpolator = d3.interpolateRgbBasis([
          '#042f2e',
          '#0d9488',
          '#14b8a6',
          '#f59e0b',
          '#f43f5e',
          '#e11d48'
        ]);
        return interpolator(d.anomalyScore);
      }

      if (metricMode === 'latency') {
        // 10ms (green) to 90ms (rose)
        const t = Math.min(Math.max((d.latencyMs - 10) / 80, 0), 1);
        return d3.interpolateRgbBasis(['#042f2e', '#10b981', '#fbbf24', '#f43f5e'])(t);
      }

      // Errors: 0% (emerald) to 10% (rose)
      const errT = Math.min(d.errorRatePercent / 8, 1);
      return d3.interpolateRgbBasis(['#064e3b', '#10b981', '#f59e0b', '#e11d48'])(errT);
    };

    // Draw background cells
    const cellsGroup = svg.append('g').attr('class', 'heatmap-cells');

    cellsGroup
      .selectAll('rect')
      .data(filteredData, (d: any) => d.id)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.timeLabel) || 0)
      .attr('y', (d) => yScale(d.nodeName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => getColor(d))
      .attr('stroke', (d) => (d.status === 'critical' ? '#ffffff' : 'rgba(255,255,255,0.08)'))
      .attr('stroke-width', (d) => (d.status === 'critical' ? 1.5 : 0.6))
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 2.5);

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
        setHoveredCell(d);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('stroke', d.status === 'critical' ? '#ffffff' : 'rgba(255,255,255,0.08)')
          .attr('stroke-width', d.status === 'critical' ? 1.5 : 0.6);
        setHoveredCell(null);
      })
      .on('click', (event, d) => {
        if (onSelectAnomaly) onSelectAnomaly(d);
      })
      .transition()
      .duration(400)
      .delay((_, i) => (i % 20) * 15)
      .attr('opacity', 0.9);

    // Y Axis: Node labels
    const yAxisGroup = svg.append('g').attr('class', 'y-axis');

    NODES.forEach((node) => {
      const yPos = (yScale(node) || 0) + yScale.bandwidth() / 2;
      yAxisGroup
        .append('text')
        .attr('x', margin.left - 12)
        .attr('y', yPos + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(node);
    });

    // X Axis: Time intervals (sparse for readability)
    const xAxisGroup = svg.append('g').attr('class', 'x-axis');
    timeLabels.forEach((label, idx) => {
      if (idx % 3 === 0 || idx === timeLabels.length - 1) {
        const xPos = (xScale(label) || 0) + xScale.bandwidth() / 2;
        xAxisGroup
          .append('text')
          .attr('x', xPos)
          .attr('y', height - 12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('fill', '#64748b')
          .text(label);
      }
    });
  }, [filteredData, timeLabels, metricMode]);

  return (
    <div className="rounded-2xl bg-[#0A0A0A] border border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none"></div>

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono font-bold">
              ANOMALY_ENGINE // D3_HEATMAP
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Database className="w-3 h-3" />
              <span>InfluxDB &amp; OpenSearch Aggregated</span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2 mt-0.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Dynamic Traffic Health &amp; Anomaly Heatmap</span>
          </h3>
          <p className="text-xs text-gray-400">
            D3-powered real-time temporal matrix evaluating throughput, p95 latency, Coraza WAF anomalies, and log bursts across edge ingress nodes.
          </p>
        </div>

        {/* Metric mode & Source selector */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Telemetry Source filter */}
          <div className="flex items-center p-0.5 rounded bg-black border border-white/10">
            <button
              onClick={() => setActiveSource('all')}
              className={`px-2.5 py-1 rounded text-[11px] uppercase transition ${
                activeSource === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setActiveSource('influxdb')}
              className={`px-2.5 py-1 rounded text-[11px] uppercase transition ${
                activeSource === 'influxdb'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              InfluxDB
            </button>
            <button
              onClick={() => setActiveSource('opensearch')}
              className={`px-2.5 py-1 rounded text-[11px] uppercase transition ${
                activeSource === 'opensearch'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              OpenSearch
            </button>
          </div>

          {/* Metric dimension */}
          <div className="flex items-center p-0.5 rounded bg-black border border-white/10">
            {(['health', 'anomaly', 'latency', 'errors'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMetricMode(mode)}
                className={`px-2.5 py-1 rounded text-[11px] uppercase transition ${
                  metricMode === mode
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Quick Simulation Trigger */}
          <button
            onClick={handleInjectAnomaly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-mono transition uppercase"
            title="Inject an anomaly burst into the telemetry pipeline"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Anomaly</span>
          </button>

          <button
            onClick={handleResetData}
            className="p-1.5 rounded bg-black hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white transition"
            title="Reset telemetry matrix"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div ref={containerRef} className="relative w-full bg-black/60 rounded-xl border border-white/5 p-2 overflow-x-auto">
        <svg ref={svgRef} className="w-full min-w-[650px] overflow-visible" />

        {/* Interactive Floating D3 Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 700) - 270),
              top: Math.max(tooltipPos.y - 120, 10)
            }}
            className="absolute z-30 w-64 p-3 rounded-xl bg-[#090D14] border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150 space-y-2 text-xs font-mono"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold text-white truncate">{hoveredCell.nodeName}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                hoveredCell.status === 'critical'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : hoveredCell.status === 'elevated'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {hoveredCell.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400">
              <div>Time: <strong className="text-white">{hoveredCell.timeLabel}</strong></div>
              <div>Throughput: <strong className="text-cyan-300">{hoveredCell.reqsPerSec} r/s</strong></div>
              <div>p95 Latency: <strong className="text-emerald-300">{hoveredCell.latencyMs} ms</strong></div>
              <div>Errors: <strong className={hoveredCell.errorRatePercent > 3 ? 'text-rose-400' : 'text-white'}>{hoveredCell.errorRatePercent}%</strong></div>
            </div>

            <div className="pt-1.5 border-t border-white/10 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Anomaly Deviation:</span>
                <span className={`font-bold ${hoveredCell.anomalyScore > 0.5 ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {(hoveredCell.anomalyScore * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-snug">
                {hoveredCell.anomalyPattern}
              </p>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">
                SOURCE: {hoveredCell.source.toUpperCase()} CLUSTER
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono text-gray-400 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span>Nominal (&lt; 0.20 Anomaly)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
            <span>Elevated Traffic Jitter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
            <span>Anomaly Breach / OWASP Alert</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>Resolution: 3m Time-Buckets</span>
          <span>•</span>
          <span>Total Nodes: 5</span>
          <span>•</span>
          <span className="text-cyan-400">Real-Time Ingestion Active</span>
        </div>
      </div>
    </div>
  );
};
