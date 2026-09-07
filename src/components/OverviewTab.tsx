/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Clock,
  ShieldCheck,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Lock,
  Sliders,
  BellRing
} from 'lucide-react';
import { SiteConfig, ServerMetricPoint, CaddyAdminConfig, CyberThreatEvent, ResourceAlertThresholds } from '../types';
import { ServerTelemetryRecharts } from './ServerTelemetryRecharts';
import { InfrastructureAgentStatusPanel } from './InfrastructureAgentStatusPanel';
import { TrafficHealthHeatmap } from './TrafficHealthHeatmap';

interface OverviewTabProps {
  sites: SiteConfig[];
  adminConfig: CaddyAdminConfig;
  metricsHistory: ServerMetricPoint[];
  threatEvents: CyberThreatEvent[];
  isLiveStreaming: boolean;
  setIsLiveStreaming: (v: boolean) => void;
  onReload: () => void;
  isReloading: boolean;
  onNavigateToSites: () => void;
  onNavigateToCyber: () => void;
  alertThresholds?: ResourceAlertThresholds;
  onOpenAlertThresholdsModal?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  sites,
  adminConfig,
  metricsHistory,
  threatEvents,
  isLiveStreaming,
  setIsLiveStreaming,
  onReload,
  isReloading,
  onNavigateToSites,
  onNavigateToCyber,
  alertThresholds,
  onOpenAlertThresholdsModal
}) => {
  const [chartMode, setChartMode] = useState<'requests' | 'latency' | 'bandwidth'>('requests');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentMetric = metricsHistory[metricsHistory.length - 1] || {
    reqsPerSec: 184,
    activeConnections: 52,
    latencyMs: 16.4,
    bandwidthInMb: 3.2,
    bandwidthOutMb: 24.1,
    status2xx: 174,
    status4xx: 8,
    status5xx: 2
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // SVG Chart Geometry Calculation
  const width = 600;
  const height = 180;
  const padding = 20;

  const getPoints = () => {
    if (metricsHistory.length === 0) return '';
    const vals = metricsHistory.map((m) => {
      if (chartMode === 'requests') return m.reqsPerSec;
      if (chartMode === 'latency') return m.latencyMs;
      return m.bandwidthOutMb;
    });

    const min = Math.min(...vals) * 0.85;
    const max = Math.max(...vals) * 1.15 || 1;

    return vals
      .map((v, idx) => {
        const x = padding + (idx / (vals.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((v - min) / (max - min)) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const totalUpstreams = sites.reduce((acc, s) => acc + s.upstreams.length, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/50 text-cyan-300 text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span className="font-mono">{toastMsg}</span>
        </div>
      )}

      {/* Hero Operational Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-7 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold">
                LIVE EDGE PROXY // ACTIVE
              </span>
              <span className="text-white/20">•</span>
              <span className="text-xs text-gray-500">PID 1024 • ADMIN: 127.0.0.1:2019</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white italic">
              Caddy Enterprise Ecosystem Management
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Real-time reverse proxy telemetry, automated ACME TLS certificate lifecycle, Coraza WAF threat mitigation, and high-performance load balancing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenAlertThresholdsModal && (
              <button
                onClick={onOpenAlertThresholdsModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/50 text-cyan-300 transition shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                title="Configure CPU and Memory alert thresholds"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Alert Watchdog (CPU: {alertThresholds?.cpuPercent || 75}%, RAM: {alertThresholds?.memoryMb || 45}MB)</span>
              </button>
            )}

            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded border transition ${
                isLiveStreaming
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isLiveStreaming ? 'PAUSE STREAM' : 'RESUME STREAM'}</span>
            </button>

            <button
              onClick={() => {
                onReload();
                showToast('Triggered zero-downtime hot reload via Caddy Admin API');
              }}
              disabled={isReloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tighter text-black bg-white hover:bg-slate-200 active:bg-slate-300 rounded shadow-sm transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-black ${isReloading ? 'animate-spin' : ''}`} />
              <span>{isReloading ? 'RELOADING...' : 'HOT RELOAD'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Requests Velocity */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2">
            <span>Throughput Velocity</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {currentMetric.reqsPerSec}
            </span>
            <span className="text-xs font-mono text-cyan-400">REQ/S</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Sockets: {currentMetric.activeConnections}</span>
            <span className="text-cyan-400">99.98% OK</span>
          </div>
        </div>

        {/* Metric 2: Latency */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {currentMetric.latencyMs}
            </span>
            <span className="text-xs font-mono text-emerald-400">MS</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>p95: 28.4ms</span>
            <span className="text-emerald-400">p99: 41.2ms</span>
          </div>
        </div>

        {/* Metric 3: Active Domains & TLS */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2">
            <span>Managed Sites</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {sites.length}
            </span>
            <span className="text-xs font-mono text-purple-400">DOMAINS</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-HTTPS
            </span>
            <span>{totalUpstreams} nodes</span>
          </div>
        </div>

        {/* Metric 4: Cyber Threats Blocked */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2">
            <span>Threats Neutralized</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 tracking-tight">
              {threatEvents.length * 24 + 114}
            </span>
            <span className="text-xs font-mono text-rose-400">24H</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="text-rose-400">WAF + Rate Limit</span>
            <button
              onClick={onNavigateToCyber}
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Inspect <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 60-Minute Server Load, Memory & Throughput Recharts Component */}
      <ServerTelemetryRecharts currentMetrics={currentMetric} memoryMb={adminConfig.memoryAllocatedMb} />
      
      {/* Infrastructure Agents & Traffic Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfrastructureAgentStatusPanel />
        <TrafficHealthHeatmap />
      </div>

      {/* Main Telemetry Chart & HTTP Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Real-time SVG Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">TELEMETRY_PULSE // REALTIME</div>
              <h2 className="text-base font-bold text-white italic">Real-Time Traffic Engine</h2>
              <p className="text-xs text-gray-400">Live telemetry updated every 2.5s via Caddy metrics feed</p>
            </div>

            {/* Metric Mode Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded bg-black border border-white/10 text-xs font-mono">
              <button
                onClick={() => setChartMode('requests')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'requests'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                REQS/S
              </button>
              <button
                onClick={() => setChartMode('latency')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'latency'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                LATENCY
              </button>
              <button
                onClick={() => setChartMode('bandwidth')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'bandwidth'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                BANDWIDTH
              </button>
            </div>
          </div>

          {/* SVG Graph Canvas */}
          <div className="w-full h-48 sm:h-56 relative bg-black rounded-xl border border-white/10 p-2 overflow-hidden flex items-end">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#ffffff" strokeOpacity="0.07" strokeDasharray="3 3" />
              <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#ffffff" strokeOpacity="0.07" strokeDasharray="3 3" />
              <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#ffffff" strokeOpacity="0.07" strokeDasharray="3 3" />

              {/* Area polygon fill */}
              {metricsHistory.length > 1 && (
                <polygon
                  points={`${padding},${height - padding} ${getPoints()} ${width - padding},${height - padding}`}
                  fill={chartMode === 'requests' ? 'url(#reqGrad)' : chartMode === 'latency' ? 'url(#latencyGrad)' : 'url(#bwGrad)'}
                />
              )}

              {/* Stroke line */}
              {metricsHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke={chartMode === 'requests' ? '#06b6d4' : chartMode === 'latency' ? '#10b981' : '#a855f7'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPoints()}
                />
              )}
            </svg>

            {/* Metric overlay labels */}
            <div className="absolute top-3 right-4 text-xs font-mono bg-[#0A0A0A] px-2.5 py-1 rounded border border-white/10 text-cyan-300 shadow-sm">
              {chartMode === 'requests' && `Current: ${currentMetric.reqsPerSec} req/s`}
              {chartMode === 'latency' && `Current: ${currentMetric.latencyMs} ms`}
              {chartMode === 'bandwidth' && `Out: ${currentMetric.bandwidthOutMb} MB/s`}
            </div>
          </div>

          {/* Time axis footer */}
          <div className="flex justify-between text-[10px] text-gray-500 font-mono px-2">
            <span>{metricsHistory[0]?.time || 'T-60s'}</span>
            <span>{metricsHistory[Math.floor(metricsHistory.length / 2)]?.time || 'T-30s'}</span>
            <span className="text-cyan-400">{currentMetric.time} (Current)</span>
          </div>
        </div>

        {/* HTTP Status Code Distribution & Edge Performance */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">CODE_TELEMETRY // 24H</div>
            <h2 className="text-base font-bold text-white italic">Status Breakdown</h2>
            <p className="text-xs text-gray-400">Response telemetry filtered across all proxy sites</p>
          </div>

          {/* Status Stacked Bar */}
          <div className="space-y-3">
            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden flex">
              <div style={{ width: '94.2%' }} className="bg-cyan-500 h-full" title="2xx Success (94.2%)"></div>
              <div style={{ width: '4.6%' }} className="bg-amber-500 h-full" title="4xx Client Error (4.6%)"></div>
              <div style={{ width: '1.2%' }} className="bg-rose-500 h-full" title="5xx Server Error (1.2%)"></div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-black border border-white/5">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
                  2xx Successful
                </span>
                <span className="font-bold text-cyan-400">94.2%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-black border border-white/5">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  4xx Client / WAF
                </span>
                <span className="font-bold text-amber-400">4.6%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-black border border-white/5">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  5xx Upstream
                </span>
                <span className="font-bold text-rose-400">1.2%</span>
              </div>
            </div>
          </div>

          {/* Caddy Core Engine Specs */}
          <div className="pt-3 border-t border-white/10 text-xs font-mono space-y-1.5 text-gray-400">
            <div className="flex justify-between">
              <span>Go Runtime Routines:</span>
              <span className="text-white">{adminConfig.goroutines}</span>
            </div>
            <div className="flex justify-between">
              <span>Resident Memory:</span>
              <span className="text-white">{adminConfig.memoryAllocatedMb} MB</span>
            </div>
            <div className="flex justify-between">
              <span>HTTP/3 (QUIC) Engine:</span>
              <span className="text-cyan-400 font-bold">Active (UDP 443)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upstream Clusters & Quick Health Status */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">UPSTREAM_TOPOLOGY</div>
            <h2 className="text-base font-bold text-white italic">Upstream Clusters &amp; Load Balancing</h2>
            <p className="text-xs text-gray-400">Reverse proxy nodes monitored via active health URI probes</p>
          </div>
          <button
            onClick={onNavigateToSites}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono uppercase tracking-wider"
          >
            Manage Sites <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {sites.map((site) => (
            <div
              key={site.id}
              className="p-4 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white truncate font-mono">{site.domain}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {site.tlsStatus === 'active' ? 'HTTPS Active' : 'Internal CA'}
                </span>
              </div>

              <div className="text-xs text-gray-400 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">POLICY:</span>
                  <span className="text-gray-300">{site.loadBalancing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UPSTREAMS:</span>
                  <span className="text-cyan-400">{site.upstreams.length} online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SECURITY:</span>
                  <span className={site.security.wafEnabled ? 'text-emerald-400' : 'text-gray-400'}>
                    {site.security.wafEnabled ? 'WAF + CRS Active' : 'Basic Proxy'}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-500">Cert: {site.tlsCertExpiryDays}d</span>
                <button
                  onClick={() => showToast(`Simulated ping to ${site.domain}: HTTP 200 OK (11ms)`)}
                  className="text-cyan-400 hover:underline flex items-center gap-0.5 uppercase text-[10px]"
                >
                  Health Ping
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
