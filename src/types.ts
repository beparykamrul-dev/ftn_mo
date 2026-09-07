/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LoadBalancingPolicy = 'round_robin' | 'least_conn' | 'ip_hash' | 'first' | 'random';
export type TLSProvider = "Let's Encrypt" | 'ZeroSSL' | 'Internal CA' | 'Custom Cert' | 'Cloudflare DNS';
export type HealthStatus = 'healthy' | 'degraded' | 'failing' | 'unknown';
export type LogLevel = 'info' | 'warn' | 'error' | 'security';
export type ThreatType = 'sqli' | 'xss' | 'ddos' | 'bad_bot' | 'brute_force' | 'path_traversal' | 'scanner' | 'rate_limit';
export type ThreatAction = 'blocked' | 'rate_limited' | 'challenged' | 'monitored';
export type DeviceViewMode = 'web_desktop' | 'pixel_8' | 'samsung_s24' | 'android_fullscreen';

export interface UpstreamServer {
  id: string;
  address: string; // e.g. 127.0.0.1:8080 or api-service:3000
  weight?: number;
  status: HealthStatus;
  latencyMs: number;
  failsCount: number;
}

export interface RouteRule {
  id: string;
  path: string; // e.g. /api/* or /static/*
  handler: 'reverse_proxy' | 'file_server' | 'redir' | 'respond' | 'rewrite';
  target: string; // e.g. "srv-api:4000" or "/var/www/dist"
  stripPrefix?: boolean;
  active: boolean;
}

export interface SiteConfig {
  id: string;
  domain: string; // e.g. "app.example.com" or "localhost:80"
  aliases?: string[];
  upstreams: UpstreamServer[];
  loadBalancing: LoadBalancingPolicy;
  tlsEnabled: boolean;
  tlsProvider: TLSProvider;
  tlsCertExpiryDays: number;
  tlsStatus: 'active' | 'renewing' | 'expiring_soon' | 'internal' | 'disabled';
  http3Enabled: boolean;
  gzipCompression: boolean;
  routes: RouteRule[];
  security: {
    wafEnabled: boolean;
    rateLimitRps: number;
    burstLimit: number;
    blockBadBots: boolean;
    hstsEnabled: boolean;
    hstsSubdomains: boolean;
    corsEnabled: boolean;
    allowedOrigins: string[];
    ipWhitelist: string[];
    ipBlacklist: string[];
  };
  customDirectives?: string;
  active: boolean;
  createdAt: string;
}

export interface CyberThreatEvent {
  id: string;
  timestamp: string;
  type: ThreatType;
  sourceIp: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
  targetDomain: string;
  targetPath: string;
  action: ThreatAction;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ruleTriggered: string;
  userAgent: string;
}

export interface SecOpsModule {
  id: string;
  name: string;
  category: 'devops' | 'siem' | 'network' | 'threat_intel' | 'audit_hardware' | 'wrapper';
  categoryLabel: string;
  status: 'online' | 'standby' | 'syncing' | 'alert' | 'offline';
  description: string;
  version: string;
  endpoint?: string;
  metrics: { label: string; value: string }[];
  lastSync: string;
  tags: string[];
  integrationType: 'agent' | 'api' | 'daemon' | 'probe' | 'wrapper';
  autoManaged: boolean;
}

export interface SecurityScore {
  total: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  tlsScore: number;
  wafScore: number;
  headersScore: number;
  rateLimitScore: number;
  checks: {
    name: string;
    passed: boolean;
    category: 'TLS' | 'WAF' | 'Headers' | 'Access';
    description: string;
    impact: string;
  }[];
}

export interface ServerMetricPoint {
  time: string;
  reqsPerSec: number;
  activeConnections: number;
  latencyMs: number;
  bandwidthInMb: number;
  bandwidthOutMb: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  cpuPercent?: number;
  memoryAllocatedMb?: number;
}

export interface ServerLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  host: string;
  uri: string;
  status: number;
  clientIp: string;
  durationMs: number;
  upstream?: string;
  userAgent?: string;
  threatDetails?: string;
}

export interface CaddyAdminConfig {
  connected: boolean;
  adminUrl: string; // e.g. "http://localhost:2019"
  mode: 'connected' | 'demo_simulation';
  version: string;
  uptimeSeconds: number;
  memoryAllocatedMb: number;
  goroutines: number;
  configHash: string;
  lastReloadTime: string;
}

export interface EcosystemGlossaryItem {
  id: string;
  category: 'Directives' | 'Core Concepts' | 'Cyber Security' | 'ACME & TLS' | 'Modules' | 'Architectures';
  title: string;
  tag: string;
  summary: string;
  syntax: string;
  caddyfileExample: string;
  proTip: string;
  officialDocUrl?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  sitesCount: number;
  routesCount: number;
  caddyfileLength: number;
  sizeBytes: number;
  version: string;
}

export interface ResourceAlertThresholds {
  cpuPercent: number;
  memoryMb: number;
  enabled: boolean;
}

export interface LogClusterGroup {
  id: string;
  pattern: string;
  count: number;
  percentage: number;
  method: string;
  sampleLog: ServerLog;
  matchingLogs: ServerLog[];
  firstSeen: string;
  lastSeen: string;
  uniqueIpsCount: number;
  statusCodes: number[];
  category: 'error' | 'security' | 'traffic';
}

// Infrastructure Agent Monitoring
export type InfraAgentType = 'ansible' | 'kopia' | 'opensearch';
export type InfraAgentStatus = 'healthy' | 'warning' | 'degraded' | 'restarting' | 'offline';

export interface InfraAgent {
  id: string;
  name: string;
  type: InfraAgentType;
  version: string;
  host: string;
  status: InfraAgentStatus;
  uptime: string;
  lastPing: string;
  details: {
    // Ansible specific
    managedNodes?: number;
    unreachableNodes?: number;
    lastPlaybookRun?: string;
    playbookSuccessRate?: number;
    // Kopia specific
    snapshotRepoStatus?: 'connected' | 'syncing' | 'idle';
    lastSnapshotTime?: string;
    totalSnapshotsCount?: number;
    backupSizeBytes?: number;
    compressionRatio?: string;
    nextScheduledSnapshot?: string;
    // OpenSearch specific
    clusterHealth?: 'green' | 'yellow' | 'red';
    clusterName?: string;
    activePrimaryShards?: number;
    activeReplicaShards?: number;
    indexingRateEps?: number;
    jvmHeapPercent?: number;
    totalNodes?: number;
  };
  restartCount: number;
  isRestarting?: boolean;
}

// Traffic Health Heatmap (D3)
export interface TrafficHealthCell {
  id: string;
  timeBucket: string;
  timeLabel: string;
  nodeName: string;
  reqsPerSec: number;
  latencyMs: number;
  errorRatePercent: number;
  anomalyScore: number; // 0.00 to 1.00
  source: 'influxdb' | 'opensearch' | 'unified';
  anomalyPattern?: string;
  status: 'healthy' | 'elevated' | 'critical';
}

// Security Auditing (Ansible / Terraform / OSINT)
export interface SecurityBenchmarkRule {
  id: string;
  framework: 'ansible' | 'terraform' | 'osint';
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  status: 'passed' | 'failed' | 'warning';
  remediationSnippet: {
    type: 'ansible_yaml' | 'terraform_hcl' | 'caddyfile';
    title: string;
    code: string;
  };
  applicableSites?: string[];
  actionLabel: string;
}

// Censys Threat Intelligence
export interface CensysExposedSubdomain {
  subdomain: string;
  ip: string;
  asn: string;
  asnOrg: string;
  country: string;
  countryCode: string;
  openPorts: number[];
  protocols: string[];
  tlsVersion?: string;
  certIssuer?: string;
  certExpiration?: string;
  threatRating: 'clean' | 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: {
    cveId: string;
    title: string;
    severity: string;
  }[];
}

export interface CensysThreatIntelResult {
  query: string;
  scannedAt: string;
  totalExposedAssets: number;
  criticalVulnerabilities: number;
  subdomains: CensysExposedSubdomain[];
  recommendedMitigations: string[];
  rawApiQuery: string;
}
