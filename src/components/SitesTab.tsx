/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Server,
  Shield,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Wrench,
  RotateCw,
  Sliders
} from 'lucide-react';
import { SiteConfig, UpstreamServer, RouteRule, LoadBalancingPolicy, TLSProvider } from '../types';

interface SitesTabProps {
  sites: SiteConfig[];
  onAddSite: (site: SiteConfig) => void;
  onUpdateSite: (id: string, updated: Partial<SiteConfig>) => void;
  onDeleteSite: (id: string) => void;
  onTriggerReload: () => void;
}

interface SiteScanIssue {
  type: 'hsts' | 'protocol' | 'waf' | 'rate_limit';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  remediation: string;
}

interface SiteScanResult {
  siteId: string;
  domain: string;
  score: number;
  status: 'passed' | 'warning' | 'critical';
  issues: SiteScanIssue[];
}

export const SitesTab: React.FC<SitesTabProps> = ({
  sites,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  onTriggerReload
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Bulk Security Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<SiteScanResult[] | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const runBulkSecurityScan = () => {
    setIsScanning(true);
    setIsScannerOpen(true);

    setTimeout(() => {
      const results: SiteScanResult[] = sites.map((site) => {
        const issues: SiteScanIssue[] = [];
        let score = 100;

        // Check 1: HSTS Headers
        if (!site.security?.hstsEnabled) {
          issues.push({
            type: 'hsts',
            severity: 'critical',
            title: 'Missing HSTS Security Header',
            description: 'HTTP Strict Transport Security (HSTS) is disabled. Vulnerable to SSL-stripping and downgrade attacks.',
            remediation: 'Enable HSTS with max-age=31536000'
          });
          score -= 30;
        } else if (!site.security?.hstsSubdomains) {
          issues.push({
            type: 'hsts',
            severity: 'medium',
            title: 'HSTS IncludeSubdomains Flag Missing',
            description: 'Subdomains of this domain are not strictly forced over HTTPS.',
            remediation: 'Enable includeSubDomains flag in HSTS directive'
          });
          score -= 10;
        }

        // Check 2: Protocol Modernization (HTTP/3 & TLS)
        if (!site.tlsEnabled) {
          issues.push({
            type: 'protocol',
            severity: 'critical',
            title: 'TLS Encryption Disabled (Plaintext HTTP)',
            description: 'Site is served over unencrypted HTTP. In-transit credentials and session tokens are exposed.',
            remediation: 'Enable automated Let\'s Encrypt or ZeroSSL TLS certificate issuance'
          });
          score -= 40;
        }
        if (!site.http3Enabled) {
          issues.push({
            type: 'protocol',
            severity: 'medium',
            title: 'Outdated Protocol: HTTP/3 (QUIC) Disabled',
            description: 'Site lacks modern HTTP/3 multiplexing, connection migration, and head-of-line blocking elimination.',
            remediation: 'Enable HTTP/3 over UDP port 443'
          });
          score -= 12;
        }

        // Check 3: WAF & Rate Limiting Posture
        if (!site.security?.wafEnabled) {
          issues.push({
            type: 'waf',
            severity: 'critical',
            title: 'Coraza WAF Engine Disabled',
            description: 'Web Application Firewall is turned off. Probing scanners, SQLi, and XSS exploits reach upstreams uninspected.',
            remediation: 'Turn on Coraza OWASP Core Rule Set (CRS v4.0) inspection'
          });
          score -= 35;
        }
        if (!site.security?.blockBadBots) {
          issues.push({
            type: 'waf',
            severity: 'high',
            title: 'Aggressive Bot & Scraper Filter Disabled',
            description: 'Known aggressive AI scrapers, vulnerability scanners, and automated credential stuffers are not filtered.',
            remediation: 'Enable Caddy Bot Shield filter rule'
          });
          score -= 15;
        }
        if (site.security?.rateLimitRps > 150) {
          issues.push({
            type: 'rate_limit',
            severity: 'medium',
            title: 'Permissive Rate Limit Setting',
            description: `Configured rate limit (${site.security.rateLimitRps} RPS) exceeds recommended threshold for sensitive API endpoints.`,
            remediation: 'Tighten rate limit to 60-120 req/s'
          });
          score -= 8;
        }

        const finalScore = Math.max(0, score);
        const status: 'passed' | 'warning' | 'critical' =
          finalScore >= 85 ? 'passed' : finalScore >= 60 ? 'warning' : 'critical';

        return {
          siteId: site.id,
          domain: site.domain,
          score: finalScore,
          status,
          issues
        };
      });

      setScanResults(results);
      setIsScanning(false);
      showToast(`Rapid bulk security audit completed across ${sites.length} ingress hosts.`);
    }, 600);
  };

  const handleFixSite = (siteId: string) => {
    const targetSite = sites.find(s => s.id === siteId);
    if (!targetSite) return;

    onUpdateSite(siteId, {
      tlsEnabled: true,
      http3Enabled: true,
      security: {
        ...targetSite.security,
        wafEnabled: true,
        blockBadBots: true,
        hstsEnabled: true,
        hstsSubdomains: true,
        rateLimitRps: Math.min(targetSite.security.rateLimitRps, 100)
      }
    });
    onTriggerReload();
    showToast(`Remediated and hardened configuration for ${targetSite.domain}.`);
    setTimeout(() => {
      runBulkSecurityScan();
    }, 350);
  };

  const handleFixAllSites = () => {
    sites.forEach((site) => {
      onUpdateSite(site.id, {
        tlsEnabled: true,
        http3Enabled: true,
        security: {
          ...site.security,
          wafEnabled: true,
          blockBadBots: true,
          hstsEnabled: true,
          hstsSubdomains: true,
          rateLimitRps: Math.min(site.security.rateLimitRps, 100)
        }
      });
    });
    onTriggerReload();
    showToast(`Bulk Auto-Hardening applied to all ${sites.length} sites! Caddy reload triggered.`);
    setTimeout(() => {
      runBulkSecurityScan();
    }, 350);
  };

  // New Site Form State
  const [domainName, setDomainName] = useState('');
  const [upstreamAddress, setUpstreamAddress] = useState('127.0.0.1:8080');
  const [loadBalancing, setLoadBalancing] = useState<LoadBalancingPolicy>('least_conn');
  const [tlsProvider, setTlsProvider] = useState<TLSProvider>("Let's Encrypt");
  const [wafEnabled, setWafEnabled] = useState(true);
  const [rateLimitRps, setRateLimitRps] = useState(100);
  const [http3Enabled, setHttp3Enabled] = useState(true);

  const filteredSites = sites.filter(s =>
    s.domain.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.upstreams.some(u => u.address.includes(filterQuery))
  );

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    const newSite: SiteConfig = {
      id: 'site-' + Date.now(),
      domain: domainName.trim(),
      upstreams: [
        {
          id: 'u-' + Date.now(),
          address: upstreamAddress.trim(),
          status: 'healthy',
          latencyMs: 12,
          failsCount: 0
        }
      ],
      loadBalancing,
      tlsEnabled: true,
      tlsProvider,
      tlsCertExpiryDays: 90,
      tlsStatus: tlsProvider === 'Internal CA' ? 'internal' : 'active',
      http3Enabled,
      gzipCompression: true,
      routes: [
        {
          id: 'r-' + Date.now(),
          path: '/*',
          handler: 'reverse_proxy',
          target: upstreamAddress.trim(),
          active: true
        }
      ],
      security: {
        wafEnabled,
        rateLimitRps,
        burstLimit: Math.round(rateLimitRps * 0.3),
        blockBadBots: true,
        hstsEnabled: true,
        hstsSubdomains: true,
        corsEnabled: false,
        allowedOrigins: [],
        ipWhitelist: [],
        ipBlacklist: []
      },
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddSite(newSite);
    setIsModalOpen(false);
    setDomainName('');
    onTriggerReload();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">INGRESS_CONFIG // PROXY_HOSTS</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Sites &amp; Reverse Proxy Routes</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Configure ingress domain routing, multi-upstream clusters, ACME certificates, and path handles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="text"
            placeholder="Filter domains or upstreams..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3.5 py-2 text-xs rounded bg-black border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono w-48 sm:w-64"
          />

          <button
            onClick={runBulkSecurityScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 transition shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-50"
            title="Scan all configured sites for missing HSTS headers, outdated protocols, or misconfigured WAF settings"
          >
            {isScanning ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isScanning ? 'Auditing Sites...' : 'Bulk Security Scanner'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tighter rounded bg-white hover:bg-slate-200 text-black shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Bulk Security Scanner Panel */}
      {isScannerOpen && (
        <div className="p-5 rounded-2xl bg-[#090D14] border border-cyan-500/30 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                    Bulk Ingress Security Scanner
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-mono uppercase rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Live Audit
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Comprehensive automated audit across {sites.length} ingress host configurations for missing HSTS, outdated protocols (HTTP/3/TLS), and WAF/bot posture.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runBulkSecurityScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-mono uppercase tracking-wider transition"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Re-Scan</span>
              </button>

              <button
                onClick={handleFixAllSites}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Harden All Sites</span>
              </button>

              <button
                onClick={() => setIsScannerOpen(false)}
                className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results Summary Bar */}
          {scanResults && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Hosts Inspected</div>
                <div className="text-xl font-bold font-mono text-white">{scanResults.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Hardened / 100% Secure</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {scanResults.filter(r => r.score >= 90).length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Warnings / Modernization Needed</div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {scanResults.filter(r => r.score >= 60 && r.score < 90).length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase">Critical Vulnerabilities</div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {scanResults.filter(r => r.score < 60).length}
                </div>
              </div>
            </div>
          )}

          {/* Individual Site Findings */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {scanResults && scanResults.map(result => (
              <div
                key={result.siteId}
                className="p-3.5 rounded-xl bg-black/80 border border-white/10 flex flex-col gap-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-white">{result.domain}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                        result.score >= 90
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : result.score >= 60
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      Security Score: {result.score}/100
                    </span>
                  </div>

                  {result.issues.length > 0 ? (
                    <button
                      onClick={() => handleFixSite(result.siteId)}
                      className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition self-start sm:self-auto"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Remediate &amp; Harden Domain</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fully Hardened &amp; Compliant</span>
                    </span>
                  )}
                </div>

                {result.issues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                    {result.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs ${
                          issue.severity === 'critical'
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : issue.severity === 'high'
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-yellow-950/20 border-yellow-500/30 text-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{issue.title}</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">{issue.description}</p>
                        <div className="text-[10px] font-mono opacity-90 mt-1 font-semibold text-cyan-300">
                          Fix: {issue.remediation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>HSTS strict headers active, HTTP/3 QUIC enabled, Coraza WAF active, and bot filtering armed.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-black border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sites List */}
      <div className="space-y-4">
        {filteredSites.map((site) => (
          <div
            key={site.id}
            className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/15 transition space-y-4 shadow-sm"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-black border border-white/10 text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-mono tracking-tight">{site.domain}</h2>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border ${
                        site.tlsEnabled
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {site.tlsProvider}
                    </span>
                    {site.http3Enabled && (
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        HTTP/3 QUIC
                      </span>
                    )}
                  </div>
                  {site.aliases && site.aliases.length > 0 && (
                    <p className="text-xs text-gray-500 font-mono">Aliases: {site.aliases.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Status toggles & actions */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => onUpdateSite(site.id, { active: !site.active })}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded border transition ${
                    site.active
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/10'
                  }`}
                >
                  {site.active ? 'Serving Traffic' : 'Suspended'}
                </button>

                <button
                  onClick={() => onDeleteSite(site.id)}
                  className="p-2 rounded hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-transparent hover:border-rose-900 transition"
                  title="Remove Site"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upstream cluster & routes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Upstreams */}
              <div className="space-y-2.5 p-4 rounded-xl bg-black border border-white/5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Upstream Cluster ({site.loadBalancing})
                  </span>
                  <span className="text-cyan-400 font-bold">{site.upstreams.length} Nodes</span>
                </div>

                <div className="space-y-1.5">
                  {site.upstreams.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 text-[11px]"
                    >
                      <span className="text-gray-200">{u.address}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{u.latencyMs}ms</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Route Rules */}
              <div className="space-y-2.5 p-4 rounded-xl bg-black border border-white/5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Security &amp; Path Handlers
                  </span>
                  <span className="text-gray-400">{site.routes.length} Rules</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-gray-400">Coraza WAF (CRS):</span>
                    <button
                      onClick={() =>
                        onUpdateSite(site.id, {
                          security: { ...site.security, wafEnabled: !site.security.wafEnabled }
                        })
                      }
                      className={`font-bold uppercase tracking-wider ${
                        site.security.wafEnabled ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      {site.security.wafEnabled ? 'Enforcing' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-gray-400">DDoS Rate Shaper:</span>
                    <span className="text-cyan-400 font-bold">{site.security.rateLimitRps} RPS MAX</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-gray-400">HSTS Preload:</span>
                    <span className="text-purple-400">max-age=63072000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Routes Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-gray-500">Route Matchers:</span>
              {site.routes.map((r) => (
                <span
                  key={r.id}
                  className="px-2.5 py-1 rounded text-[11px] font-mono bg-black text-gray-300 border border-white/10 flex items-center gap-1.5"
                >
                  <span>{r.path}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-gray-500" />
                  <span className="text-cyan-400">{r.target}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Site Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-[#0A0A0A] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">NEW_INGRESS_ROUTE</div>
                <h3 className="text-base font-bold text-white italic flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Provision Domain &amp; Upstream</span>
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Domain Name (FQDN)</label>
                <input
                  type="text"
                  placeholder="e.g. api.mycompany.com or mysite.io"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Upstream Target Server Address</label>
                <input
                  type="text"
                  placeholder="e.g. 127.0.0.1:3000 or backend-service:8080"
                  value={upstreamAddress}
                  onChange={(e) => setUpstreamAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Load Balancing Policy</label>
                  <select
                    value={loadBalancing}
                    onChange={(e) => setLoadBalancing(e.target.value as LoadBalancingPolicy)}
                    className="w-full px-2.5 py-2 rounded bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="least_conn">Least Connections</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="ip_hash">IP Hash (Sticky)</option>
                    <option value="first">First Available</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">TLS / HTTPS Provider</label>
                  <select
                    value={tlsProvider}
                    onChange={(e) => setTlsProvider(e.target.value as TLSProvider)}
                    className="w-full px-2.5 py-2 rounded bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Let's Encrypt">Let's Encrypt (Automated)</option>
                    <option value="ZeroSSL">ZeroSSL</option>
                    <option value="Internal CA">Internal CA (Zero-Trust)</option>
                    <option value="Cloudflare DNS">Cloudflare DNS-01</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black border border-white/10 space-y-2.5">
                <span className="font-bold text-gray-300 block uppercase tracking-wider text-[10px]">Security Ingress Features:</span>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={wafEnabled}
                    onChange={(e) => setWafEnabled(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Enable Coraza WAF (OWASP Top 10 SQLi/XSS Shield)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={http3Enabled}
                    onChange={(e) => setHttp3Enabled(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Enable HTTP/3 (QUIC) over UDP port 443</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-gray-400 hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-tighter shadow-sm transition"
                >
                  Provision Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
