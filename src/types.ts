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
