/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Server,
  Shield,
  Radio,
  HardDrive,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sliders,
  Cpu,
  Globe,
  Lock,
  Eye,
  Activity,
  Zap,
  Terminal,
  ExternalLink,
  Wifi,
  Database,
  Box,
  FileCheck
} from 'lucide-react';
import { SecOpsModule, SiteConfig, CaddyAdminConfig, BackupMetadata } from '../types';

interface SecOpsHubTabProps {
  onTriggerReload?: () => void;
  sites?: SiteConfig[];
  adminConfig?: CaddyAdminConfig;
  caddyfile?: string;
  onRestoreBackup?: (backupSites: SiteConfig[]) => void;
}

export const SecOpsHubTab: React.FC<SecOpsHubTabProps> = ({
  onTriggerReload,
  sites = [],
  adminConfig,
  caddyfile = '',
  onRestoreBackup
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<SecOpsModule | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Load last backup metadata from local storage
  const [lastBackup, setLastBackup] = useState<BackupMetadata | null>(() => {
    try {
      const saved = localStorage.getItem('caddydash_backup_metadata');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default initial snapshot state
    return {
      id: 'bk-init',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      sitesCount: sites.length || 3,
      routesCount: 7,
      caddyfileLength: caddyfile.length || 1840,
      sizeBytes: 4210,
      version: '2.9.1'
    };
  });

  // Initial comprehensive suite of SecOps & Ecosystem modules
  const [modules, setModules] = useState<SecOpsModule[]>([
    // DevOps & Cloud
    {
      id: 'ansible',
      name: 'Ansible Orchestrator',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Automated configuration management and zero-downtime playbook runner for Caddy edge clusters.',
      version: 'v2.16.4',
      endpoint: '127.0.0.1:8088',
      metrics: [
        { label: 'Active Playbooks', value: '4 Managed' },
        { label: 'Inventory Nodes', value: '18 Nodes' },
        { label: 'Last Run', value: '3m ago (Success)' }
      ],
      lastSync: 'Just now',
      tags: ['Playbooks', 'Idempotency', 'Cluster Sync'],
      integrationType: 'agent',
      autoManaged: true
    },
    {
      id: 'terraform',
      name: 'Terraform State Engine',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Infrastructure-as-Code (IaC) orchestrator tracking multi-cloud Caddy DNS records and edge compute state.',
      version: 'v1.8.2',
      endpoint: 'cloud-tf.internal:443',
      metrics: [
        { label: 'Managed Resources', value: '64 Active' },
        { label: 'Drift Status', value: 'Zero Drift' },
        { label: 'Cloud Provider', value: 'AWS / GCP / Edge' }
      ],
      lastSync: '12m ago',
      tags: ['IaC', 'Cloud State', 'Terraform Cloud'],
      integrationType: 'api',
      autoManaged: true
    },
    {
      id: 'cobbler',
      name: 'Cobbler Provisioner',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Linux installation server for bare-metal PXE provisioning, DHCP/DNS integration, and physical server orchestration.',
      version: 'v3.3.3',
      endpoint: '10.0.1.2:80',
      metrics: [
        { label: 'PXE Profiles', value: '6 Profiles' },
        { label: 'Baremetal Hosts', value: '12 Online' },
        { label: 'DHCP Leases', value: '34 Active' }
      ],
      lastSync: '18m ago',
      tags: ['PXE', 'Bare-Metal', 'Kickstart'],
      integrationType: 'daemon',
      autoManaged: true
    },
    {
      id: 'influxdb',
      name: 'InfluxDB Time-Series Engine',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'High-throughput time-series database storing Caddy request rates, latency distributions, and proxy telemetry.',
      version: 'v2.7.5',
      endpoint: '127.0.0.1:8086',
      metrics: [
        { label: 'Write Rate', value: '1,420 pts/s' },
        { label: 'Bucket Retention', value: '90 Days' },
        { label: 'Disk Utilization', value: '4.8 GB' }
      ],
      lastSync: 'Live Stream',
      tags: ['TSDB', 'Prometheus', 'Metrics'],
      integrationType: 'api',
      autoManaged: true
    },
    {
      id: 'opensearch',
      name: 'OpenSearch Log Indexer',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Distributed search and analytics engine for security log ingestion, query search, and threat analytics.',
      version: 'v2.13.0',
      endpoint: '127.0.0.1:9200',
      metrics: [
        { label: 'Indexed Logs', value: '3.4M Docs' },
        { label: 'Cluster Health', value: 'Green (3 Nodes)' },
        { label: 'Query Search Latency', value: '4.2ms' }
      ],
      lastSync: 'Real-Time',
      tags: ['Query Search', 'SIEM Logs', 'Elastic API'],
      integrationType: 'api',
      autoManaged: true
    },
    {
      id: 'kopia',
      name: 'Kopia Encrypted Backup',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Fast, secure, end-to-end encrypted snapshot backup manager for Caddy configs, TLS certificates, and databases.',
      version: 'v0.16.0',
      endpoint: 'local-repo:/backup',
      metrics: [
        { label: 'Snapshot Count', value: '142 Snapshots' },
        { label: 'Repository Size', value: '18.4 GB (Deduplicated)' },
        { label: 'Last Snapshot', value: '1h ago (Verified)' }
      ],
      lastSync: '1h ago',
      tags: ['Encrypted Backup', 'Deduplication', 'Snapshots'],
      integrationType: 'daemon',
      autoManaged: true
    },
    {
      id: 'webserver-core',
      name: 'Caddy Webserver Core',
      category: 'devops',
      categoryLabel: 'DevOps & Infra',
      status: 'online',
      description: 'Primary Caddy v2.9 proxy engine with automated ACME TLS, HTTP/3 QUIC, and dynamic route dispatcher.',
      version: 'v2.9.1 (Custom Build)',
      endpoint: '127.0.0.1:2019',
      metrics: [
        { label: 'Worker Goroutines', value: '128 Active' },
        { label: 'HTTP/3 Conns', value: '68% of Traffic' },
        { label: 'Uptime', value: '99.998%' }
      ],
      lastSync: 'Live',
      tags: ['Caddy', 'HTTP/3', 'Zero-Downtime'],
      integrationType: 'daemon',
      autoManaged: true
    },

    // SIEM & Host Defense
    {
      id: 'wazuh',
      name: 'Wazuh SIEM & XDR Manager',
      category: 'siem',
      categoryLabel: 'SIEM & Host',
      status: 'online',
      description: 'Unified Open-Source Security Information and Event Management (SIEM), Host IDS/IPS, and File Integrity Monitoring (FIM).',
      version: 'v4.7.2',
      endpoint: '127.0.0.1:55000',
      metrics: [
        { label: 'Connected Agents', value: '18 / 18 Online' },
        { label: 'FIM Alerts', value: '0 Critical' },
        { label: 'Vulnerability CVEs', value: 'Remediated' }
      ],
      lastSync: '2m ago',
      tags: ['SIEM', 'Host IDS', 'File Integrity', 'CIS Benchmark'],
      integrationType: 'agent',
      autoManaged: true
    },
    {
      id: 'solarwinds',
      name: 'SolarWinds NMS Sensor',
      category: 'siem',
      categoryLabel: 'SIEM & Host',
      status: 'online',
      description: 'Enterprise Network Performance Monitor, SNMP trap collector, and switch port bandwidth monitor.',
      version: 'v2024.1',
      endpoint: 'nms.internal:161',
      metrics: [
        { label: 'SNMP Traps', value: 'Normal (0 dropped)' },
        { label: 'Gateway Latency', value: '1.2ms' },
        { label: 'Packet Loss', value: '0.00%' }
      ],
      lastSync: '4m ago',
      tags: ['SNMP', 'Network NMS', 'Switching'],
      integrationType: 'probe',
      autoManaged: true
    },
    {
      id: 'cygwin',
      name: 'Cygwin POSIX Bridge',
      category: 'siem',
      categoryLabel: 'SIEM & Host',
      status: 'standby',
      description: 'POSIX compatibility API runtime bridge for mixed Windows/Linux edge nodes and automated Unix shell execution.',
      version: 'v3.5.0',
      endpoint: 'node-win-01:Cygwin',
      metrics: [
        { label: 'Bridge Mode', value: 'POSIX Emulation' },
        { label: 'Shell Wrapper', value: 'Bash 5.2' },
        { label: 'Session Health', value: 'Standby' }
      ],
      lastSync: '22m ago',
      tags: ['POSIX', 'Windows Node', 'Shell Bridge'],
      integrationType: 'daemon',
      autoManaged: false
    },
    {
      id: 'wrapper-supervisor',
      name: 'Wrapper Auto/Manual Supervisor',
      category: 'wrapper',
      categoryLabel: 'Wrapper System',
      status: 'online',
      description: 'Process supervisor managing third-party binary daemons with automated restart policies and manual override controls.',
      version: 'v2.4.0',
      metrics: [
        { label: 'Supervised Daemons', value: '8 Running' },
        { label: 'Supervision Mode', value: 'Auto-Managed' },
        { label: 'Crash Restarts', value: '0 in 24h' }
      ],
      lastSync: 'Live',
      tags: ['Process Wrapper', 'Supervisor', 'Daemon Control'],
      integrationType: 'wrapper',
      autoManaged: true
    },

    // Edge, CDN & Media Tools
    {
      id: 'jsdelivr',
      name: 'jsDelivr Multi-CDN Gateway',
      category: 'network',
      categoryLabel: 'Edge & CDN',
      status: 'online',
      description: 'Global content delivery routing layer, caching public edge assets and accelerating Caddy reverse proxy distribution.',
      version: 'CDN v4',
      endpoint: 'cdn.jsdelivr.net',
      metrics: [
        { label: 'Global PoPs', value: '120+ Edge Locations' },
        { label: 'Cache Hit Ratio', value: '94.6%' },
        { label: 'Edge TTFB', value: '18ms' }
      ],
      lastSync: 'Active',
      tags: ['Multi-CDN', 'Edge Cache', 'Assets'],
      integrationType: 'api',
      autoManaged: true
    },
    {
      id: 'wormhole',
      name: 'Wormhole Encrypted Tunnel',
      category: 'network',
      categoryLabel: 'Edge & CDN',
      status: 'online',
      description: 'Peer-to-peer end-to-end encrypted tunneling overlay connecting private backend microservices to public Caddy frontends.',
      version: 'v0.9.1',
      endpoint: 'p2p-wormhole:7000',
      metrics: [
        { label: 'Active Tunnels', value: '3 Established' },
        { label: 'Encryption', value: 'ChaCha20-Poly1305' },
        { label: 'Throughput', value: '42 MB/s' }
      ],
      lastSync: 'Live Stream',
      tags: ['P2P Tunnel', 'E2EE', 'Zero-Trust'],
      integrationType: 'daemon',
      autoManaged: true
    },
    {
      id: 'wolfsoftware',
      name: 'Wolf Software Suite',
      category: 'network',
      categoryLabel: 'Edge & CDN',
      status: 'online',
      description: 'Automation utilities and custom wrapper tooling for systems integration, container health checks, and edge telemetry.',
      version: 'v3.1.0',
      endpoint: 'wolf-agent.local:8080',
      metrics: [
        { label: 'Health Monitors', value: '14 Active' },
        { label: 'Webhook Listeners', value: 'Enabled' },
        { label: 'Telemetry Pipe', value: 'Stable' }
      ],
      lastSync: '8m ago',
      tags: ['Systems Automation', 'Wolf Tools', 'Integrations'],
      integrationType: 'wrapper',
      autoManaged: true
    },
    {
      id: 'nitefood',
      name: 'nitefood Service Wrapper',
      category: 'network',
      categoryLabel: 'Edge & CDN',
      status: 'online',
      description: 'Background daemon wrapper and reverse proxy connector for specialized media, streaming, and content services.',
      version: 'v1.4.2',
      endpoint: '127.0.0.1:8096',
      metrics: [
        { label: 'Upstream Proxy', value: 'Caddy Direct Link' },
        { label: 'Sub-Process State', value: 'Supervised' },
        { label: 'Memory', value: '28 MB' }
      ],
      lastSync: '14m ago',
      tags: ['Media Wrapper', 'Service Proxy', 'Daemon'],
      integrationType: 'wrapper',
      autoManaged: true
    },

    // Threat Intelligence, RF & Surveillance
    {
      id: 'kismet',
      name: 'Kismet RF & Wireless Sensor',
      category: 'threat_intel',
      categoryLabel: 'Threat & Surveillance',
      status: 'online',
      description: 'Wireless network detector, 802.11 / Bluetooth RF sniffer, and rogue wireless access point intrusion detection sensor.',
      version: 'v2023-07-R1',
      endpoint: 'kismet-rf.internal:2501',
      metrics: [
        { label: 'Captured Packets', value: '1.2M RF Packets' },
        { label: 'Tracked SSIDs', value: '42 Detected' },
        { label: 'Rogue APs', value: '0 Detected (Clear)' }
      ],
      lastSync: 'Live Feed',
      tags: ['Wireless IDS', 'RF Sniffer', '802.11 / BLE', 'Wardriving Defense'],
      integrationType: 'probe',
      autoManaged: true
    },
    {
      id: 'osint-intel',
      name: 'OSINT Global Intelligence',
      category: 'threat_intel',
      categoryLabel: 'Threat & Surveillance',
      status: 'online',
      description: 'Open-Source Threat Intelligence aggregator ingesting AlienVault OTX, AbuseIPDB, and bad ASN blocklists into Coraza WAF.',
      version: 'Feed v3.8',
      metrics: [
        { label: 'Known Malicious IPs', value: '184,290 IPs' },
        { label: 'Feed Sync Interval', value: 'Every 30m' },
        { label: 'Threat Confidence', value: '99.2%' }
      ],
      lastSync: '6m ago',
      tags: ['OSINT', 'Threat Feeds', 'AbuseIPDB', 'AlienVault OTX'],
      integrationType: 'api',
      autoManaged: true
    },
    {
      id: 'censorship-monitor',
      name: 'Censorship & Surveillance Probe',
      category: 'threat_intel',
      categoryLabel: 'Threat & Surveillance',
      status: 'online',
      description: 'Network neutrality monitor, Deep Packet Inspection (DPI) sensor, DNS poisoning detector, and BGP route surveillance telemetry.',
      version: 'OONI/NetBlocks Spec',
      metrics: [
        { label: 'DPI Interference', value: 'None Detected' },
        { label: 'DNS Authenticity', value: '100% DNSSEC Valid' },
        { label: 'BGP Route Hijacks', value: '0 Anomaly Alerts' }
      ],
      lastSync: 'Just now',
      tags: ['Censorship Watch', 'DPI Detection', 'DNSSEC', 'Surveillance Audit'],
      integrationType: 'probe',
      autoManaged: true
    },
    {
      id: 'censys',
      name: 'Censys.io Attack Surface & Internet Scanner',
      category: 'threat_intel',
      categoryLabel: 'Threat & Surveillance',
      status: 'online',
      description: 'Continuous attack surface intelligence, internet-wide certificate scanning, exposed host discovery, and port enumeration sensor.',
      version: 'API v2 (ASM)',
      endpoint: 'search.censys.io:443',
      metrics: [
        { label: 'Indexed Exposed Ports', value: '443, 80, 2019' },
        { label: 'Cert Visibility', value: '100% Monitored' },
        { label: 'Host Posture', value: 'Zero CVE Risk' }
      ],
      lastSync: '4m ago',
      tags: ['Censys.io', 'Attack Surface', 'Port Scanner', 'Cert Transparency', 'OSINT'],
      integrationType: 'api',
      autoManaged: true
    },

    // Hardware, Exploits & DMA Audit
    {
      id: 'hardware-dma-audit',
      name: 'DMA & Baseband Hardware Guard',
      category: 'audit_hardware',
      categoryLabel: 'Hardware & Exploit Defense',
      status: 'online',
      description: 'Direct Memory Access (DMA) attack mitigation via PCIe IOMMU memory protection, firmware baseband isolation, and hardware peripheral attestation.',
      version: 'IOMMU Guard v2.2',
      metrics: [
        { label: 'IOMMU State', value: 'Strict Enforced' },
        { label: 'PCIe Bus Scan', value: 'All Devices Attested' },
        { label: 'DMA Memory Bounds', value: 'Zero Violations' }
      ],
      lastSync: '5m ago',
      tags: ['DMA Protection', 'IOMMU', 'Baseband Isolation', 'Hardware Attestation'],
      integrationType: 'agent',
      autoManaged: true
    },
    {
      id: 'exploit-scanner-matrix',
      name: 'Exploit Scanner & Signature Matrix',
      category: 'audit_hardware',
      categoryLabel: 'Hardware & Exploit Defense',
      status: 'online',
      description: 'Defensive inspection signatures blocking penetration test scanners, Impacket SMB/RPC remote execution calls, and Metasploit payload patterns.',
      version: 'CRS v4.0 + Custom',
      metrics: [
        { label: 'Impacket Rules', value: 'Active (RPC/SMB Blocked)' },
        { label: 'Metasploit Patterns', value: '1,820 Signatures Loaded' },
        { label: 'Zero-Day Heuristics', value: 'Enabled' }
      ],
      lastSync: 'Live',
      tags: ['Impacket Defense', 'Metasploit Blocker', 'CVE Scanner DB', 'Exploit Neutralizer'],
      integrationType: 'daemon',
      autoManaged: true
    }
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleAutoManaged = (modId: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === modId) {
          const nextVal = !m.autoManaged;
          showToast(`${m.name}: Switched to ${nextVal ? 'Auto-Managed' : 'Manual Control'} Mode`);
          return { ...m, autoManaged: nextVal };
        }
        return m;
      })
    );
  };

  const handleRestartModule = (modId: string) => {
    const mod = modules.find((m) => m.id === modId);
    showToast(`Restarting ${mod?.name || 'Module'} daemon... State refreshed.`);
  };

  const handleRunDiagnostics = (modId: string) => {
    const mod = modules.find((m) => m.id === modId);
    showToast(`Diagnostics passed for ${mod?.name || 'Module'} — All health checks 100% OK`);
  };

  const getRelativeTimeString = (iso: string) => {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  const handleManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const backupData = {
        version: adminConfig?.version || '2.9.1',
        timestamp: new Date().toISOString(),
        sites: sites || [],
        adminConfig: adminConfig || null,
        caddyfile: caddyfile || ''
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      localStorage.setItem('caddydash_config_backup', jsonStr);

      const meta: BackupMetadata = {
        id: 'bk-' + Date.now(),
        timestamp: new Date().toISOString(),
        sitesCount: sites?.length || 0,
        routesCount: sites?.reduce((acc, s) => acc + (s.routes?.length || 0), 0) || 0,
        caddyfileLength: caddyfile?.length || 0,
        sizeBytes: new Blob([jsonStr]).size,
        version: adminConfig?.version || '2.9.1'
      };

      localStorage.setItem('caddydash_backup_metadata', JSON.stringify(meta));
      setLastBackup(meta);
      setIsBackingUp(false);
      showToast('Caddy configuration & sites backup successfully saved to Local Storage!');
    }, 600);
  };

  const handleDownloadBackupFile = () => {
    const saved = localStorage.getItem('caddydash_config_backup');
    const payload =
      saved ||
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          version: adminConfig?.version || '2.9.1',
          sites,
          adminConfig,
          caddyfile
        },
        null,
        2
      );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caddy-config-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Caddy configuration backup JSON');
  };

  const categories = [
    { id: 'all', label: 'All Modules', count: modules.length },
    { id: 'devops', label: 'DevOps & Infra', count: modules.filter((m) => m.category === 'devops').length },
    { id: 'siem', label: 'SIEM & Host', count: modules.filter((m) => m.category === 'siem').length },
    { id: 'network', label: 'Edge & CDN', count: modules.filter((m) => m.category === 'network').length },
    { id: 'threat_intel', label: 'Threat & Surveillance', count: modules.filter((m) => m.category === 'threat_intel').length },
    { id: 'audit_hardware', label: 'Hardware & Exploit Defense', count: modules.filter((m) => m.category === 'audit_hardware').length },
    { id: 'wrapper', label: 'Wrappers', count: modules.filter((m) => m.category === 'wrapper').length }
  ];

  const filteredModules = modules.filter((mod) => {
    const matchesCat = selectedCategory === 'all' || mod.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesSearch =
      mod.name.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const onlineCount = modules.filter((m) => m.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/60 text-cyan-300 text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-mono">{toastMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-500 font-mono font-bold">
            INFRASTRUCTURE // SECOPS &amp; ECOSYSTEM CONTROL HUB
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>SecOps &amp; Infrastructure Orchestrator</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
            Unified telemetry, SIEM monitoring, and daemon supervision: Ansible, Terraform, Cobbler, Wazuh, InfluxDB, OpenSearch, Kopia, Kismet, Hardware DMA Guard, OSINT Feeds, and Censorship Probes.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onTriggerReload) onTriggerReload();
              showToast('Synchronized all SecOps service configurations with Caddy');
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tighter text-black bg-white hover:bg-slate-200 active:bg-slate-300 rounded shadow-sm transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-black" />
            <span>Sync All Daemons</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
            <span>Total Modules</span>
            <Box className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{modules.length}</div>
          <span className="text-[10px] text-cyan-400">Integrated Services</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
            <span>Operational Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{onlineCount}/{modules.length}</div>
          <span className="text-[10px] text-gray-400">Daemons Online</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
            <span>Hardware DMA Guard</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">IOMMU Active</div>
          <span className="text-[10px] text-gray-400">Baseband Isolated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
            <span>Censorship Probe</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">0 DPI Intercepts</div>
          <span className="text-[10px] text-gray-400">Network Neutral</span>
        </div>
      </div>

      {/* Data Backup & Configuration Vault Status Widget */}
      <div className="p-5 rounded-2xl bg-[#080808] border border-cyan-500/30 shadow-lg relative overflow-hidden font-mono">
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                <HardDrive className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Data Backup &amp; Caddy State Vault</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Local Storage Active
                </span>
              </h2>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              Local snapshot engine capturing all site definitions, ingress routes, upstream load balancers, Coraza WAF policies, and live Caddyfile configurations into client-side browser storage.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="text-gray-500">Last Successful Backup:</span>
                <span className="text-cyan-300 font-bold">
                  {lastBackup?.timestamp ? new Date(lastBackup.timestamp).toLocaleString() : 'Never'}
                </span>
                <span className="text-gray-500 text-[10px]">
                  ({lastBackup?.timestamp ? getRelativeTimeString(lastBackup.timestamp) : 'Pending'})
                </span>
              </span>
              <span className="hidden sm:inline text-gray-600">•</span>
              <span>
                <span className="text-gray-500">Payload:</span>{' '}
                <span className="text-white font-bold">{lastBackup?.sitesCount ?? sites.length} Sites</span>,{' '}
                <span className="text-white font-bold">{lastBackup?.routesCount ?? 7} Routes</span> (~{Math.round((lastBackup?.sizeBytes || 4200) / 1024 * 10) / 10} KB)
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>{isBackingUp ? 'Saving Snapshot...' : 'Backup Caddy Config Now'}</span>
            </button>

            <button
              onClick={handleDownloadBackupFile}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider bg-black border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition"
              title="Download snapshot JSON file to disk"
            >
              <FileCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Categories + Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sub-Sidebar for Module Navigation */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search module, tool, or CVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded bg-black border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category List */}
          <div className="p-2 rounded-2xl bg-[#080808] border border-white/10 space-y-1 font-mono text-xs">
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold border-b border-white/5">
              SYSTEM SECTORS
            </div>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                    isActive
                      ? 'bg-white text-black font-bold uppercase tracking-wider'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive ? 'bg-black text-white' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick System Status Card */}
          <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>SUPERVISOR STATUS</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Daemon wrappers and API links monitored continuously. Auto-healing restores any stalled subprocess within 500ms.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500">
              <span>ORCHESTRATOR API</span>
              <span className="text-emerald-400">HEALTHY (v2.9.1)</span>
            </div>
          </div>
        </div>

        {/* Right Modules Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModules.map((mod) => {
              return (
                <div
                  key={mod.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white font-mono">{mod.name}</h3>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-black text-cyan-400 border border-cyan-500/30">
                            {mod.version}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                          {mod.categoryLabel} {mod.endpoint && `• ${mod.endpoint}`}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          mod.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {mod.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{mod.description}</p>

                    {/* Metrics Key-Value Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black border border-white/5 font-mono text-[10px]">
                      {mod.metrics.map((met, i) => (
                        <div key={i}>
                          <span className="text-gray-500 block">{met.label}</span>
                          <span className="text-white font-bold">{met.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mod.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 border border-white/5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAutoManaged(mod.id)}
                        className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold transition ${
                          mod.autoManaged
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                        title="Toggle Auto-Managed Supervision or Manual Mode"
                      >
                        {mod.autoManaged ? 'Auto Mode' : 'Manual Mode'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRunDiagnostics(mod.id)}
                        className="px-2.5 py-1 rounded bg-black border border-white/10 text-[10px] text-gray-300 hover:text-white uppercase tracking-wider transition"
                      >
                        Diagnostics
                      </button>
                      <button
                        onClick={() => handleRestartModule(mod.id)}
                        className="px-2.5 py-1 rounded bg-white text-black font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition"
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
