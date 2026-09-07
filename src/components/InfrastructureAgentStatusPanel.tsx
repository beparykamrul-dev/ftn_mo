/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Server,
  RotateCw,
  HardDrive,
  Database,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Play,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { InfraAgent, InfraAgentType } from '../types';

interface InfrastructureAgentStatusPanelProps {
  onNotify?: (msg: string) => void;
  compact?: boolean;
}

const INITIAL_AGENTS: InfraAgent[] = [
  {
    id: 'ansible-edge-ingress',
    name: 'Ansible Controller // Edge Ingress',
    type: 'ansible',
    version: 'v2.16.4',
    host: '10.0.4.12:22 (SSH)',
    status: 'healthy',
    uptime: '14d 6h 22m',
    lastPing: '2s ago',
    details: {
      managedNodes: 18,
      unreachableNodes: 0,
      lastPlaybookRun: 'site_ingress_hardening.yml (OK: 42, Changed: 0)',
      playbookSuccessRate: 99.4
    },
    restartCount: 2
  },
  {
    id: 'ansible-worker-nodes',
    name: 'Ansible Dispatcher // Microservice Fleet',
    type: 'ansible',
    version: 'v2.16.4',
    host: '10.0.4.15:22 (SSH)',
    status: 'healthy',
    uptime: '6d 18h 40m',
    lastPing: '5s ago',
    details: {
      managedNodes: 34,
      unreachableNodes: 0,
      lastPlaybookRun: 'caddy_tls_sync.yml (OK: 34, Changed: 2)',
      playbookSuccessRate: 100
    },
    restartCount: 0
  },
  {
    id: 'kopia-backup-daemon',
    name: 'Kopia Backup Engine // S3 Snapshot Repository',
    type: 'kopia',
    version: 'v0.17.0',
    host: 'backup-s3-vault.internal:51515',
    status: 'healthy',
    uptime: '28d 4h 12m',
    lastPing: '1s ago',
    details: {
      snapshotRepoStatus: 'connected',
      lastSnapshotTime: '18 minutes ago',
      totalSnapshotsCount: 428,
      backupSizeBytes: 42.6 * 1024 * 1024 * 1024, // 42.6 GB
      compressionRatio: 'zstd-fastest (2.41x)',
      nextScheduledSnapshot: 'in 42 minutes'
    },
    restartCount: 1
  },
  {
    id: 'opensearch-cluster-core',
    name: 'OpenSearch Log Telemetry Cluster // 3-Node Primary',
    type: 'opensearch',
    version: 'v2.13.0',
    host: 'opensearch-cluster.internal:9200',
    status: 'healthy',
    uptime: '42d 11h 05m',
    lastPing: '800ms ago',
    details: {
      clusterHealth: 'green',
      clusterName: 'caddydash-telemetry-prod',
      activePrimaryShards: 120,
      activeReplicaShards: 120,
      indexingRateEps: 1840,
      jvmHeapPercent: 54,
      totalNodes: 3
    },
    restartCount: 0
  }
];

export const InfrastructureAgentStatusPanel: React.FC<InfrastructureAgentStatusPanelProps> = ({
  onNotify,
  compact = false
}) => {
  const [agents, setAgents] = useState<InfraAgent[]>(() => {
    try {
      const cached = localStorage.getItem('caddydash_infra_agents');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return INITIAL_AGENTS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | InfraAgentType>('all');
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const saveAgents = (updated: InfraAgent[]) => {
    setAgents(updated);
    try {
      localStorage.setItem('caddydash_infra_agents', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRestartAgent = (agentId: string) => {
    const target = agents.find((a) => a.id === agentId);
    if (!target) return;

    setRestartingId(agentId);
    const notification = `Restarting ${target.name}... Initializing graceful worker handover.`;
    if (onNotify) onNotify(notification);

    // Update state to restarting
    const restartingState = agents.map((a) => {
      if (a.id === agentId) {
        return { ...a, status: 'restarting' as const, isRestarting: true };
      }
      return a;
    });
    saveAgents(restartingState);

    // Simulate graceful reboot sequence
    setTimeout(() => {
      const recoveredState = agents.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            status: 'healthy' as const,
            isRestarting: false,
            uptime: '0d 0h 01m',
            lastPing: 'just now',
            restartCount: a.restartCount + 1
          };
        }
        return a;
      });
      saveAgents(recoveredState);
      setRestartingId(null);
      if (onNotify) onNotify(`Successfully restarted ${target.name}! Service running healthy.`);
    }, 1800);
  };

  const handleRestartAll = () => {
    if (onNotify) onNotify('Dispatching fleet restart command to all connected infrastructure agents...');
    agents.forEach((agent) => {
      handleRestartAgent(agent.id);
    });
  };

  const filteredAgents = activeFilter === 'all'
    ? agents
    : agents.filter((a) => a.type === activeFilter);

  const totalHealthy = agents.filter((a) => a.status === 'healthy').length;
  const allHealthy = totalHealthy === agents.length;

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono font-bold">
              INFRASTRUCTURE_AGENTS // CONNECTED_FLEET
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {allHealthy ? 'ALL AGENTS GREEN' : `${totalHealthy}/${agents.length} HEALTHY`}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2 mt-0.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Infrastructure Health &amp; Orchestration Agents</span>
          </h3>
          <p className="text-xs text-gray-400">
            Real-time status monitor and quick-action restarts for Ansible controller nodes, Kopia snapshot engines, and OpenSearch log clusters.
          </p>
        </div>

        {/* Filter controls & Fleet restart */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center p-1 rounded bg-black border border-white/10">
            {(['all', 'ansible', 'kopia', 'opensearch'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded transition uppercase text-[11px] ${
                  activeFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={handleRestartAll}
            disabled={restartingId !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black hover:bg-white/5 border border-white/20 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 transition text-[11px] uppercase tracking-wider disabled:opacity-50"
            title="Perform sequential restart of all agents"
          >
            <RotateCw className={`w-3.5 h-3.5 ${restartingId ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Restart Fleet</span>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4 relative z-10`}>
        {filteredAgents.map((agent) => {
          const isRestarting = agent.isRestarting || restartingId === agent.id;
          const isAnsible = agent.type === 'ansible';
          const isKopia = agent.type === 'kopia';
          const isOpenSearch = agent.type === 'opensearch';

          return (
            <div
              key={agent.id}
              className="p-4 rounded-xl bg-black border border-white/10 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-4 group shadow-sm"
            >
              {/* Top info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      isAnsible
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isKopia
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {isAnsible && <Terminal className="w-4 h-4" />}
                      {isKopia && <HardDrive className="w-4 h-4" />}
                      {isOpenSearch && <Database className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">
                        {agent.type.toUpperCase()} // {agent.version}
                      </span>
                      <h4 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition">
                        {agent.name}
                      </h4>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 ${
                    isRestarting
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : agent.status === 'healthy'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isRestarting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                    }`} />
                    <span>{isRestarting ? 'RESTARTING' : agent.status}</span>
                  </span>
                </div>

                <div className="text-[11px] font-mono text-gray-400 truncate bg-white/[0.03] p-1.5 rounded border border-white/5">
                  Host: <span className="text-gray-200">{agent.host}</span>
                </div>

                {/* Agent Specific Telemetry Highlights */}
                {isAnsible && (
                  <div className="space-y-1.5 pt-1 text-[11px] font-mono text-gray-400">
                    <div className="flex justify-between">
                      <span>Managed Nodes:</span>
                      <strong className="text-white">{agent.details.managedNodes} targets</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Unreachable:</span>
                      <span className="text-emerald-400 font-bold">{agent.details.unreachableNodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="text-cyan-400 font-bold">{agent.details.playbookSuccessRate}%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate pt-1 border-t border-white/5">
                      Last Run: {agent.details.lastPlaybookRun}
                    </div>
                  </div>
                )}

                {isKopia && (
                  <div className="space-y-1.5 pt-1 text-[11px] font-mono text-gray-400">
                    <div className="flex justify-between">
                      <span>Repo Status:</span>
                      <span className="text-purple-400 font-bold uppercase">{agent.details.snapshotRepoStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Snapshots:</span>
                      <strong className="text-white">{agent.details.totalSnapshotsCount} points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Vault Volume:</span>
                      <strong className="text-white">{(agent.details.backupSizeBytes! / (1024 * 1024 * 1024)).toFixed(1)} GB</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Compression:</span>
                      <span className="text-cyan-400">{agent.details.compressionRatio}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 pt-1 border-t border-white/5 flex justify-between">
                      <span>Next: {agent.details.nextScheduledSnapshot}</span>
                      <span>Last: {agent.details.lastSnapshotTime}</span>
                    </div>
                  </div>
                )}

                {isOpenSearch && (
                  <div className="space-y-1.5 pt-1 text-[11px] font-mono text-gray-400">
                    <div className="flex justify-between">
                      <span>Cluster Status:</span>
                      <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {agent.details.clusterHealth}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Shards:</span>
                      <strong className="text-white">{agent.details.activePrimaryShards} active</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Indexing Rate:</span>
                      <span className="text-cyan-400 font-bold">{agent.details.indexingRateEps} eps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>JVM Heap Usage:</span>
                      <span className="text-purple-300 font-bold">{agent.details.jvmHeapPercent}% (Allocated)</span>
                    </div>
                    <div className="text-[10px] text-gray-500 pt-1 border-t border-white/5">
                      Nodes: {agent.details.totalNodes} clustered instances
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-gray-500">
                  <span>Up: {agent.uptime}</span>
                  <span className="mx-1.5">•</span>
                  <span>Restarts: {agent.restartCount}</span>
                </div>

                <button
                  onClick={() => handleRestartAgent(agent.id)}
                  disabled={isRestarting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition ${
                    isRestarting
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                      : 'bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 hover:border-cyan-500 text-gray-300 shadow-sm'
                  }`}
                  title={`Quick-action restart for ${agent.name}`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
                  <span>{isRestarting ? 'Booting...' : 'Restart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
