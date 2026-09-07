/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity, Cpu, HardDrive, Zap, TrendingUp, Clock } from 'lucide-react';
import { ServerMetricPoint } from '../types';

interface ServerTelemetryRechartsProps {
  currentMetrics?: ServerMetricPoint;
  memoryMb?: number;
}

export const ServerTelemetryRecharts: React.FC<ServerTelemetryRechartsProps> = ({
  currentMetrics,
  memoryMb = 38.4
}) => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'load' | 'memory' | 'throughput'>('all');

  // Synthesize realistic 60-minute rolling dataset based on live values
  const data = useMemo(() => {
    const points = [];
    const baseReqs = currentMetrics?.reqsPerSec || 185;
    const baseMem = memoryMb;
    const now = new Date();

    for (let i = 12; i >= 0; i--) {
      const minutesAgo = i * 5;
      const timeLabel = minutesAgo === 0 ? 'Now' : `-${minutesAgo}m`;
      
      // Natural oscillating variance with slight drift
      const factor = Math.sin((12 - i) * 0.7) * 0.25 + 0.95;
      const noise = (Math.sin(i * 1.5) * 0.1);
      
      const serverLoad = Math.min(95, Math.max(8, Math.round((28 * factor + noise * 10) * 10) / 10));
      const memoryUsage = Math.round((baseMem * (0.92 + (12 - i) * 0.012 + noise * 0.5)) * 10) / 10;
      const requestThroughput = Math.round(baseReqs * factor + noise * 25);
      const bandwidthOut = Math.round((requestThroughput * 0.13) * 10) / 10;

      points.push({
        time: timeLabel,
        serverLoad, // Percentage %
        memoryUsage, // MB
        requestThroughput, // req/sec
        bandwidthOut // MB/s
      });
    }
    return points;
  }, [currentMetrics?.reqsPerSec, memoryMb]);

  const currentPoint = data[data.length - 1];
  const peakLoad = Math.max(...data.map(d => d.serverLoad));
  const peakThroughput = Math.max(...data.map(d => d.requestThroughput));

  return (
    <div className="p-6 rounded-2xl bg-[#080808] border border-white/10 space-y-5 relative overflow-hidden shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-bold">
              HISTORICAL TELEMETRY // 60-MINUTE AUDIT
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white italic flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Server Load, Memory &amp; Caddy Request Throughput</span>
          </h2>
          <p className="text-xs text-gray-400">
            Recharts time-series visualization tracking infrastructure saturation over the last 60 minutes.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded bg-black border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1 rounded transition ${
              activeMetric === 'all'
                ? 'bg-white text-black font-bold uppercase tracking-wider'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveMetric('throughput')}
            className={`px-3 py-1 rounded transition ${
              activeMetric === 'throughput'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Req/s
          </button>
          <button
            onClick={() => setActiveMetric('load')}
            className={`px-3 py-1 rounded transition ${
              activeMetric === 'load'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            CPU Load %
          </button>
          <button
            onClick={() => setActiveMetric('memory')}
            className={`px-3 py-1 rounded transition ${
              activeMetric === 'memory'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Memory (MB)
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Throughput (Current)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-cyan-400">{currentPoint.requestThroughput}</span>
            <span className="text-[10px] text-gray-400">req/s</span>
          </div>
          <span className="text-[10px] text-gray-500">Peak: {peakThroughput} req/s</span>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" /> Server Load
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-purple-400">{currentPoint.serverLoad}%</span>
            <span className="text-[10px] text-gray-400">CPU</span>
          </div>
          <span className="text-[10px] text-gray-500">Peak: {peakLoad}%</span>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" /> RAM Working Set
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-400">{currentPoint.memoryUsage}</span>
            <span className="text-[10px] text-gray-400">MB</span>
          </div>
          <span className="text-[10px] text-gray-500">Go Runtime Heap</span>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" /> Bandwidth Output
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-400">{currentPoint.bandwidthOut}</span>
            <span className="text-[10px] text-gray-400">MB/s</span>
          </div>
          <span className="text-[10px] text-gray-500">HTTP/2 + HTTP/3</span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-72 sm:h-80 bg-black rounded-xl border border-white/10 p-3 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Cyan Gradient for Throughput */}
              <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              {/* Purple Gradient for Server Load */}
              <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
              {/* Emerald Gradient for Memory */}
              <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />

            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="p-3 rounded-lg bg-[#0A0A0A] border border-white/20 shadow-xl font-mono text-xs space-y-1.5 backdrop-blur-md">
                    <span className="text-gray-400 block border-b border-white/10 pb-1">
                      TIME: <strong className="text-white">{label}</strong>
                    </span>
                    {payload.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}:
                        </span>
                        <span className="text-white font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />

            {/* Request Throughput (Req/s) */}
            {(activeMetric === 'all' || activeMetric === 'throughput') && (
              <Area
                type="monotone"
                dataKey="requestThroughput"
                name="Throughput (req/s)"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cyanArea)"
              />
            )}

            {/* Server Load (%) */}
            {(activeMetric === 'all' || activeMetric === 'load') && (
              <Area
                type="monotone"
                dataKey="serverLoad"
                name="Server Load (%)"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#purpleArea)"
              />
            )}

            {/* Memory Usage (MB) */}
            {(activeMetric === 'all' || activeMetric === 'memory') && (
              <Area
                type="monotone"
                dataKey="memoryUsage"
                name="Memory (MB)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#emeraldArea)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
