/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Search,
  Filter,
  Trash2,
  Download,
  Play,
  Pause,
  ShieldAlert,
  ArrowDown,
  GitBranch,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  Sparkles,
  Layers,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ServerLog, LogLevel, LogClusterGroup } from '../types';

interface LogsTabProps {
  logs: ServerLog[];
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  onClearLogs: () => void;
}

type ClusteringMode = 'endpoint_params' | 'security_threats' | 'error_codes' | 'custom_regex';

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  isStreaming,
  setIsStreaming,
  onClearLogs
}) => {
  const [activeView, setActiveView] = useState<'stream' | 'clustering'>('stream');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '4xx' | '5xx'>('all');

  // Clustering tool states
  const [clusteringMode, setClusteringMode] = useState<ClusteringMode>('endpoint_params');
  const [customRegexInput, setCustomRegexInput] = useState('^(/api/v\\d+/[a-z0-9_-]+|/static/[a-z.]+)');
  const [clusterCategoryFilter, setClusterCategoryFilter] = useState<'all' | 'security' | 'error' | 'traffic'>('all');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // Group similar log entries using regex patterns
  const logClusters = useMemo(() => {
    if (logs.length === 0) return [];

    const map = new Map<string, { pattern: string; logs: ServerLog[]; method: string; category: 'security' | 'error' | 'traffic' }>();

    logs.forEach((log) => {
      let patternKey = '';
      let category: 'security' | 'error' | 'traffic' = 'traffic';

      if (log.threatDetails || log.level === 'security') {
        category = 'security';
      } else if (log.status >= 400 || log.level === 'error') {
        category = 'error';
      }

      switch (clusteringMode) {
        case 'endpoint_params': {
          // Normalizes UUIDs, numeric IDs, hashes, and query params
          const normalizedUri = log.uri
            .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<UUID>')
            .replace(/\/[0-9a-fA-F]{16,}/g, '/<HASH>')
            .replace(/\/\d+/g, '/<ID>')
            .replace(/\?.*$/, '?<QUERY>');
          patternKey = `${log.method} ${normalizedUri}`;
          break;
        }

        case 'security_threats': {
          if (log.threatDetails) {
            patternKey = `[WAF] ${log.threatDetails}`;
            category = 'security';
          } else if (log.status === 403) {
            patternKey = `[403 FORBIDDEN] Probing: ${log.uri.replace(/\?.*$/, '')}`;
            category = 'security';
          } else {
            patternKey = `[ROUTINE] ${log.method} ${log.uri.replace(/\?.*$/, '')}`;
          }
          break;
        }

        case 'error_codes': {
          const baseUri = log.uri.replace(/\?.*$/, '').replace(/\/\d+/g, '/<ID>');
          patternKey = `HTTP ${log.status} - ${log.method} ${baseUri}`;
          if (log.status >= 400) category = 'error';
          break;
        }

        case 'custom_regex': {
          try {
            const rx = new RegExp(customRegexInput, 'i');
            const match = log.uri.match(rx);
            if (match) {
              const matchedStr = match[1] || match[0];
              patternKey = `${log.method} ${matchedStr}*`;
            } else {
              patternKey = `${log.method} [Unmatched URI Pattern]`;
            }
          } catch {
            patternKey = `${log.method} ${log.uri.replace(/\?.*$/, '')}`;
          }
          break;
        }
      }

      if (!map.has(patternKey)) {
        map.set(patternKey, {
          pattern: patternKey,
          logs: [log],
          method: log.method,
          category
        });
      } else {
        const item = map.get(patternKey)!;
        item.logs.push(log);
        if (category === 'security') item.category = 'security';
        else if (category === 'error' && item.category !== 'security') item.category = 'error';
      }
    });

    const totalLogs = logs.length;
    const result: LogClusterGroup[] = [];

    map.forEach((item, key) => {
      const clusterLogs = item.logs;
      const sortedByTime = [...clusterLogs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const uniqueIps = new Set(clusterLogs.map((l) => l.clientIp)).size;
      const uniqueStatuses = Array.from(new Set(clusterLogs.map((l) => l.status)));

      result.push({
        id: 'cluster-' + key.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 32),
        pattern: key,
        count: clusterLogs.length,
        percentage: Math.round((clusterLogs.length / totalLogs) * 1000) / 10,
        method: item.method,
        sampleLog: clusterLogs[0],
        matchingLogs: clusterLogs,
        firstSeen: sortedByTime[0]?.timestamp || '',
        lastSeen: sortedByTime[sortedByTime.length - 1]?.timestamp || '',
        uniqueIpsCount: uniqueIps,
        statusCodes: uniqueStatuses,
        category: item.category
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }, [logs, clusteringMode, customRegexInput]);

  const filteredClusters = logClusters.filter((c) => {
    const matchesCategory = clusterCategoryFilter === 'all' || c.category === clusterCategoryFilter;
    const matchesSearch =
      !searchQuery ||
      c.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.matchingLogs.some(
        (l) =>
          l.uri.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.clientIp.includes(searchQuery) ||
          (l.threatDetails && l.threatDetails.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    return matchesCategory && matchesSearch;
  });

  const filteredLogs = logs.filter((log) => {
    // Search matching
    const matchesSearch =
      !searchQuery ||
      log.uri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.clientIp.includes(searchQuery) ||
      log.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.threatDetails && log.threatDetails.toLowerCase().includes(searchQuery.toLowerCase()));

    // Level matching
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;

    // Status matching
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === '2xx' && log.status >= 200 && log.status < 300) ||
      (statusFilter === '4xx' && log.status >= 400 && log.status < 500) ||
      (statusFilter === '5xx' && log.status >= 500);

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const exportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `caddy-access-logs-${Date.now()}.json`);
    a.click();
  };

  const getStatusBadge = (status: number) => {
    if (status >= 500) {
      return <span className="text-rose-400 font-bold">{status}</span>;
    }
    if (status >= 400) {
      return <span className="text-amber-400 font-bold">{status}</span>;
    }
    if (status >= 300) {
      return <span className="text-blue-400 font-bold">{status}</span>;
    }
    return <span className="text-emerald-400 font-bold">{status}</span>;
  };

  const getMethodBadge = (method: ServerLog['method']) => {
    const colors: Record<string, string> = {
      GET: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
      POST: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      PUT: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      DELETE: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[method] || 'text-slate-300'}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">TELEMETRY // LOG_ANALYTICS</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Caddy Live Access &amp; Log Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time JSON structured telemetry stream and regex-powered event pattern clustering.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-black border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveView('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded uppercase tracking-wider transition ${
                activeView === 'stream'
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Stream</span>
            </button>
            <button
              onClick={() => setActiveView('clustering')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded uppercase tracking-wider transition ${
                activeView === 'clustering'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Regex Pattern Clusters</span>
              <span className="ml-1 px-1.5 py-0.2 text-[9px] rounded bg-white/10 text-cyan-300">
                {logClusters.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded border transition ${
              isStreaming
                ? 'bg-black border-white/10 text-gray-300 hover:text-white'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded bg-black border border-white/10 text-gray-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded bg-black border border-white/10 text-gray-400 hover:text-rose-400 transition"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW 1: REGEX PATTERN CLUSTERING & TREND IDENTIFICATION TOOL */}
      {activeView === 'clustering' && (
        <div className="space-y-4">
          {/* Analysis Mode Controls */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-cyan-500/20 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Clustering Regex Engine:</span>
                <button
                  onClick={() => setClusteringMode('endpoint_params')}
                  className={`px-3 py-1.5 rounded text-xs transition ${
                    clusteringMode === 'endpoint_params'
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  API Endpoints (Normalize IDs &amp; UUIDs)
                </button>
                <button
                  onClick={() => setClusteringMode('security_threats')}
                  className={`px-3 py-1.5 rounded text-xs transition ${
                    clusteringMode === 'security_threats'
                      ? 'bg-rose-500 text-black font-bold'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  WAF Security Signatures &amp; Probes
                </button>
                <button
                  onClick={() => setClusteringMode('error_codes')}
                  className={`px-3 py-1.5 rounded text-xs transition ${
                    clusteringMode === 'error_codes'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  HTTP Status &amp; Error Groups
                </button>
                <button
                  onClick={() => setClusteringMode('custom_regex')}
                  className={`px-3 py-1.5 rounded text-xs transition ${
                    clusteringMode === 'custom_regex'
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Custom Regex Pattern
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px]">Filter:</span>
                <select
                  value={clusterCategoryFilter}
                  onChange={(e) => setClusterCategoryFilter(e.target.value as any)}
                  className="px-2.5 py-1 rounded bg-black border border-white/10 text-gray-200 text-xs focus:outline-none"
                >
                  <option value="all">All Clusters</option>
                  <option value="security">Security Threats Only</option>
                  <option value="error">Error Trends (4xx/5xx)</option>
                  <option value="traffic">Routine Traffic</option>
                </select>
              </div>
            </div>

            {/* Custom Regex Input (when active) */}
            {clusteringMode === 'custom_regex' && (
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <span className="text-purple-400 text-xs font-bold">Regex:</span>
                <input
                  type="text"
                  value={customRegexInput}
                  onChange={(e) => setCustomRegexInput(e.target.value)}
                  placeholder="Enter regex capture pattern (e.g. ^(/api/v\d+/[a-z]+) or ^(/[^/]+))"
                  className="flex-1 px-3 py-1.5 rounded bg-black border border-purple-500/40 text-purple-300 text-xs focus:outline-none"
                />
                <span className="text-gray-500 text-[10px]">Groups log URIs matching capture group 1</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase">Unique Patterns</span>
              <div className="text-xl font-bold text-white">{logClusters.length}</div>
              <span className="text-[10px] text-cyan-400">Fingerprints Clustered</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase">Security Clusters</span>
              <div className="text-xl font-bold text-rose-400">
                {logClusters.filter((c) => c.category === 'security').length}
              </div>
              <span className="text-[10px] text-rose-400">OWASP / CRS Threats</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase">Error Clusters</span>
              <div className="text-xl font-bold text-amber-400">
                {logClusters.filter((c) => c.category === 'error').length}
              </div>
              <span className="text-[10px] text-amber-400">4xx / 5xx Anomalies</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase">Peak Frequency</span>
              <div className="text-xl font-bold text-cyan-400">
                {logClusters[0]?.count || 0} hits
              </div>
              <span className="text-[10px] text-gray-400">Top Repeating Group</span>
            </div>
          </div>

          {/* Clusters List */}
          <div className="space-y-3">
            {filteredClusters.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-black rounded-2xl border border-white/10">
                No log clusters matched the selected regex pattern criteria.
              </div>
            ) : (
              filteredClusters.map((cluster) => {
                const isExpanded = expandedClusterId === cluster.id;
                const isSecurity = cluster.category === 'security';
                const isError = cluster.category === 'error';

                return (
                  <div
                    key={cluster.id}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isSecurity
                        ? 'bg-rose-950/10 border-rose-900/40'
                        : isError
                        ? 'bg-amber-950/10 border-amber-900/40'
                        : 'bg-black border-white/10'
                    }`}
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Pattern & Trend Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isSecurity
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isError
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {isSecurity
                              ? 'Repetitive Threat Signature'
                              : isError
                              ? 'Frequent Error Trend'
                              : 'High-Volume Route Pattern'}
                          </span>

                          <span className="text-gray-500 text-[11px]">
                            {cluster.uniqueIpsCount} unique client IP{cluster.uniqueIpsCount > 1 ? 's' : ''}
                          </span>

                          <span className="text-gray-500 text-[11px]">
                            Statuses: {cluster.statusCodes.join(', ')}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-white break-all flex items-center gap-2">
                          <span className="text-cyan-400">{cluster.pattern}</span>
                        </div>

                        {/* Frequency bar */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex-1 max-w-xs h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isSecurity
                                  ? 'bg-rose-500'
                                  : isError
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, cluster.percentage))}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 font-bold">
                            {cluster.count} hits ({cluster.percentage}% of traffic)
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => {
                            setSearchQuery(cluster.sampleLog.uri.replace(/\?.*$/, ''));
                            setActiveView('stream');
                          }}
                          className="px-3 py-1.5 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 uppercase tracking-wider transition"
                          title="Filter live stream by this pattern"
                        >
                          Filter Live Stream
                        </button>

                        <button
                          onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-white text-black font-bold uppercase tracking-wider hover:bg-slate-200 transition"
                        >
                          <span>{isExpanded ? 'Hide Events' : `Inspect (${cluster.count})`}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable constituent log instances */}
                    {isExpanded && (
                      <div className="p-3 bg-[#070707] border-t border-white/10 space-y-1.5 max-h-64 overflow-y-auto text-xs">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider pb-1">
                          Log records matching pattern &quot;{cluster.pattern}&quot;:
                        </div>
                        {cluster.matchingLogs.map((logItem) => (
                          <div
                            key={logItem.id}
                            className="p-2 rounded bg-black/60 border border-white/5 flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-500">
                                {logItem.timestamp.split('T')[1]?.replace('Z', '')}
                              </span>
                              {getMethodBadge(logItem.method)}
                              {getStatusBadge(logItem.status)}
                              <span className="text-gray-300 break-all">{logItem.uri}</span>
                              {logItem.threatDetails && (
                                <span className="text-rose-400 font-bold">[{logItem.threatDetails}]</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
                              <span>{logItem.durationMs}ms</span>
                              <span className="text-gray-400">{logItem.clientIp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: STANDARD LIVE STREAM LOGS */}
      {activeView === 'stream' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search path, client IP, host, or threat signature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Level Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="px-2 py-1 rounded bg-black border border-white/10 text-gray-200 text-xs font-mono focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                  <option value="security">Security</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1 rounded bg-black border border-white/10 text-gray-200 text-xs font-mono focus:outline-none"
                >
                  <option value="all">All HTTP</option>
                  <option value="2xx">2xx OK</option>
                  <option value="4xx">4xx Client</option>
                  <option value="5xx">5xx Error</option>
                </select>
              </div>
            </div>
          </div>

          {/* Terminal View */}
          <div className="rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl">
            <div className="h-10 px-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-white font-bold">caddy stdout — {filteredLogs.length} events buffered</span>
              </div>
              <span className="text-[11px] text-gray-500">Live JSON Stream</span>
            </div>

            <div className="p-3 max-h-[520px] overflow-y-auto space-y-1.5 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-600 font-mono">
                  No matching log records found for the active filter.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition font-mono ${
                      log.level === 'security'
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                        : log.level === 'warn'
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                        : log.level === 'error'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-[#0A0A0A] border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-gray-500 text-[11px]">
                        {log.timestamp.split('T')[1]?.replace('Z', '')}
                      </span>
                      {getMethodBadge(log.method)}
                      {getStatusBadge(log.status)}
                      <span className="text-cyan-400 font-bold">{log.host}</span>
                      <span className="text-gray-200 break-all">{log.uri}</span>

                      {log.threatDetails && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {log.threatDetails}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 self-end sm:self-auto">
                      <span>{log.durationMs}ms</span>
                      <span className="text-gray-400">{log.clientIp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
