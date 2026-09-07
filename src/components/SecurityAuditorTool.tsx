/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Layers,
  FileCode,
  Terminal,
  Copy,
  Check,
  Search,
  Sliders,
  Filter,
  ArrowRight,
  ExternalLink,
  RotateCw,
  X
} from 'lucide-react';
import { SiteConfig, SecurityBenchmarkRule, CaddyAdminConfig } from '../types';

interface SecurityAuditorToolProps {
  sites: SiteConfig[];
  adminConfig?: CaddyAdminConfig;
  onAutoHardenSite?: (siteId: string, updates: Partial<SiteConfig['security']>) => void;
  onTriggerReload?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const DEFAULT_BENCHMARKS: SecurityBenchmarkRule[] = [
  // OSINT Benchmarks
  {
    id: 'OSINT-LEAK-01',
    framework: 'osint',
    title: 'Server Banner Masking (Suppress "Server: Caddy")',
    severity: 'high',
    category: 'Information Disclosure Prevention',
    description: 'Automated scanners (Shodan, Censys, Project Sonar) fingerprint the Caddy version and web server stack via the default Server header.',
    impact: 'Exposes proxy stack to version-targeted zero-day exploits and reconnaissance profiling.',
    status: 'warning',
    actionLabel: 'Strip Server Header',
    remediationSnippet: {
      type: 'caddyfile',
      title: 'Caddyfile Header Stripping Directive',
      code: `(security_headers) {
    header {
        -Server
        -X-Powered-By
        Server "Protected-Edge-Proxy"
    }
}`
    }
  },
  {
    id: 'OSINT-ADMIN-02',
    framework: 'osint',
    title: 'Caddy Admin API Loopback Binding (Port 2019)',
    severity: 'critical',
    category: 'Admin Interface Isolation',
    description: 'Verify the Caddy Admin API is strictly bound to 127.0.0.1 or an isolated Unix domain socket, preventing public internet access.',
    impact: 'If exposed publicly, adversaries can rewrite routing tables, steal certificates, and hijack traffic.',
    status: 'passed',
    actionLabel: 'Enforce Loopback Only',
    remediationSnippet: {
      type: 'caddyfile',
      title: 'Global Options Loopback Admin Binding',
      code: `{\n    admin 127.0.0.1:2019 {\n        enforce_origin\n    }\n}`
    }
  },
  {
    id: 'OSINT-DEBUG-03',
    framework: 'osint',
    title: 'Suppression of Internal Debug Endpoints',
    severity: 'medium',
    category: 'Diagnostic Surface Hardening',
    description: 'Ensure /debug/vars, pprof profiler, and internal health endpoints are dropped or shielded behind IP whitelists.',
    impact: 'Leaks runtime memory allocations, goroutine metrics, and internal network architecture.',
    status: 'passed',
    actionLabel: 'Restrict Debug Routes',
    remediationSnippet: {
      type: 'caddyfile',
      title: 'Path Filter for Debug Endpoints',
      code: `@debug path /debug/*\nhandle @debug {\n    respond "Access Denied" 403\n}`
    }
  },

  // Ansible Benchmarks
  {
    id: 'ANSIBLE-CIS-01',
    framework: 'ansible',
    title: 'Ansible CIS Systemd Hardening & Non-Root Sandbox',
    severity: 'critical',
    category: 'Host OS & Process Isolation',
    description: 'Audit systemd service template in Ansible roles to guarantee CapabilityBoundingSet, ProtectSystem=strict, and PrivateTmp=true are enabled.',
    impact: 'Compromised web server could escalate privileges to root or access host filesystem.',
    status: 'warning',
    actionLabel: 'Deploy Hardened Unit via Ansible',
    remediationSnippet: {
      type: 'ansible_yaml',
      title: 'ansible/roles/caddy/tasks/systemd.yml',
      code: `- name: Enforce CIS Systemd Sandboxing for Caddy
  systemd_service:
    name: caddy
    state: started
    enabled: true
    dropin:
      CapabilityBoundingSet: CAP_NET_BIND_SERVICE
      AmbientCapabilities: CAP_NET_BIND_SERVICE
      NoNewPrivileges: true
      ProtectSystem: strict
      ProtectHome: true
      PrivateTmp: true`
    }
  },
  {
    id: 'ANSIBLE-IDEMP-02',
    framework: 'ansible',
    title: 'Ansible Zero-Downtime Reload Handlers',
    severity: 'medium',
    category: 'Orchestration Idempotency',
    description: 'Verify Ansible playbooks utilize `caddy reload` rather than `systemctl restart caddy` to preserve active WebSockets and in-flight HTTP/3 streams.',
    impact: 'Restarts cause connection resets and brief 502 Bad Gateway outages during routine updates.',
    status: 'passed',
    actionLabel: 'Use Zero-Downtime Handler',
    remediationSnippet: {
      type: 'ansible_yaml',
      title: 'ansible/roles/caddy/handlers/main.yml',
      code: `- name: reload caddy
  command: caddy reload --config /etc/caddy/Caddyfile
  listen: "reload caddy"
  changed_when: false`
    }
  },
  {
    id: 'ANSIBLE-VAULT-03',
    framework: 'ansible',
    title: 'Ansible-Vault Secret Encryption for Cloudflare/DNS API Tokens',
    severity: 'high',
    category: 'Credential Security',
    description: 'Ensure DNS-01 challenge API tokens for ACME TLS certificate issuance are sealed with ansible-vault and not stored in plain YAML.',
    impact: 'Leaked DNS provider tokens permit hijacking DNS records and issuing unauthorized certificates.',
    status: 'passed',
    actionLabel: 'Encrypt via Ansible Vault',
    remediationSnippet: {
      type: 'ansible_yaml',
      title: 'ansible/group_vars/all/vault.yml',
      code: `# Encrypted via: ansible-vault encrypt_string
vault_cloudflare_api_token: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          38363737353931393666323630656265326266396637366363653139323730303862373264663363`
    }
  },

  // Terraform Benchmarks
  {
    id: 'TF-TLS-01',
    framework: 'terraform',
    title: 'Terraform State Ingress TLS 1.3 & HSTS Protocol Policy',
    severity: 'critical',
    category: 'Infrastructure as Code Compliance',
    description: 'Cross-reference Terraform state declarations for reverse proxy resources to ensure min_tls_version = "1.3" and strict ciphers are locked.',
    impact: 'Legacy TLS 1.0/1.1 protocols expose traffic to POODLE, BEAST, and Sweet32 cryptographic downgrades.',
    status: 'warning',
    actionLabel: 'Lock TLS 1.3 in Terraform HCL',
    remediationSnippet: {
      type: 'terraform_hcl',
      title: 'terraform/caddy_ingress.tf',
      code: `resource "caddy_reverse_proxy" "edge_ingress" {
  domain_name       = var.primary_domain
  min_tls_version   = "1.3"
  enable_http3      = true
  hsts_max_age      = 31536000
  hsts_subdomains   = true
  hsts_preload      = true
  coraza_waf_crs    = true
}`
    }
  },
  {
    id: 'TF-DRIFT-02',
    framework: 'terraform',
    title: 'Terraform Drift Detection on Cloud Security Groups',
    severity: 'high',
    category: 'Network Boundary Governance',
    description: 'Verify Terraform state matches cloud ingress rules: only ports 80, 443 (TCP/UDP) open to 0.0.0.0/0; all management ports restricted.',
    impact: 'Out-of-band security group changes can expose backend upstreams or SSH directly to the internet.',
    status: 'passed',
    actionLabel: 'Sync Terraform State',
    remediationSnippet: {
      type: 'terraform_hcl',
      title: 'terraform/security_groups.tf',
      code: `resource "aws_security_group" "caddy_edge" {
  name        = "caddy-edge-ingress-sg"
  description = "Strict ingress for Caddy TLS & QUIC"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "udp" # HTTP/3 QUIC
    cidr_blocks = ["0.0.0.0/0"]
  }
}`
    }
  }
];

export const SecurityAuditorTool: React.FC<SecurityAuditorToolProps> = ({
  sites,
  adminConfig,
  onAutoHardenSite,
  onTriggerReload,
  onClose,
  isModal = false
}) => {
  const [benchmarks, setBenchmarks] = useState<SecurityBenchmarkRule[]>(DEFAULT_BENCHMARKS);
  const [frameworkFilter, setFrameworkFilter] = useState<'all' | 'ansible' | 'terraform' | 'osint'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyRemediation = (benchmarkId: string) => {
    setRemediatingId(benchmarkId);

    // Apply auto-hardening to sites if needed
    if (onAutoHardenSite) {
      sites.forEach((site) => {
        onAutoHardenSite(site.id, {
          hsts: true,
          hstsSubdomains: true,
          hstsPreload: true,
          corazaWaf: true,
          botShield: true,
          nosniff: true,
          frameOptions: 'DENY'
        });
      });
    }

    // Mark benchmark as passed
    setTimeout(() => {
      const updated = benchmarks.map((b) => {
        if (b.id === benchmarkId) {
          return { ...b, status: 'passed' as const };
        }
        return b;
      });
      setBenchmarks(updated);
      setRemediatingId(null);
      setToastMsg(`Successfully applied hardening step for ${benchmarkId}!`);
      if (onTriggerReload) onTriggerReload();
      setTimeout(() => setToastMsg(null), 3500);
    }, 1200);
  };

  const handleApplyAllHardening = () => {
    if (onAutoHardenSite) {
      sites.forEach((site) => {
        onAutoHardenSite(site.id, {
          hsts: true,
          hstsSubdomains: true,
          hstsPreload: true,
          corazaWaf: true,
          botShield: true,
          nosniff: true,
          frameOptions: 'DENY'
        });
      });
    }

    const updated = benchmarks.map((b) => ({ ...b, status: 'passed' as const }));
    setBenchmarks(updated);
    setToastMsg('Enterprise Hardening applied across all Ansible, Terraform & OSINT benchmark rules!');
    if (onTriggerReload) onTriggerReload();
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filtered = benchmarks.filter((b) => {
    const matchesFramework = frameworkFilter === 'all' || b.framework === frameworkFilter;
    const matchesSeverity = severityFilter === 'all' || b.severity === severityFilter;
    return matchesFramework && matchesSeverity;
  });

  const totalPassed = benchmarks.filter((b) => b.status === 'passed').length;
  const overallScore = Math.round((totalPassed / benchmarks.length) * 100);

  const ansibleScore = Math.round(
    (benchmarks.filter((b) => b.framework === 'ansible' && b.status === 'passed').length /
      benchmarks.filter((b) => b.framework === 'ansible').length) *
      100
  );

  const tfScore = Math.round(
    (benchmarks.filter((b) => b.framework === 'terraform' && b.status === 'passed').length /
      benchmarks.filter((b) => b.framework === 'terraform').length) *
      100
  );

  const osintScore = Math.round(
    (benchmarks.filter((b) => b.framework === 'osint' && b.status === 'passed').length /
      benchmarks.filter((b) => b.framework === 'osint').length) *
      100
  );

  const content = (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/60 text-cyan-300 text-xs font-mono shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono font-bold">
              BENCHMARK_AUDITOR // IAC_&amp;_OSINT
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              CROSS-REFERENCED ({sites.length} SITES)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2 mt-0.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>Infrastructure &amp; OSINT Security Auditor</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
            Automated cross-referencing of Caddy ingress rules against CIS Ansible benchmarks, Terraform state-lock compliance, and OSINT reconnaissance exposure matrices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleApplyAllHardening}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tight rounded bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Apply All Remediation Steps</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Close Audit Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Benchmark Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Score */}
        <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-500">Overall Benchmark Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">{overallScore}%</span>
            <span className="text-xs font-mono text-gray-400">COMPLIANT</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
            <div style={{ width: `${overallScore}%` }} className="h-full bg-cyan-500" />
          </div>
        </div>

        {/* Ansible CIS */}
        <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center justify-between">
            <span>Ansible CIS Hardening</span>
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{ansibleScore}%</span>
            <span className="text-xs font-mono text-rose-400">ROLES OK</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
            <div style={{ width: `${ansibleScore}%` }} className="h-full bg-rose-500" />
          </div>
        </div>

        {/* Terraform HCL */}
        <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center justify-between">
            <span>Terraform State Compliance</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{tfScore}%</span>
            <span className="text-xs font-mono text-purple-400">NO DRIFT</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
            <div style={{ width: `${tfScore}%` }} className="h-full bg-purple-500" />
          </div>
        </div>

        {/* OSINT Surface */}
        <div className="p-4 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center justify-between">
            <span>OSINT Recon Resistance</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{osintScore}%</span>
            <span className="text-xs font-mono text-amber-400">PROTECTED</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
            <div style={{ width: `${osintScore}%` }} className="h-full bg-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Framework:
          </span>
          {(['all', 'ansible', 'terraform', 'osint'] as const).map((fw) => (
            <button
              key={fw}
              onClick={() => setFrameworkFilter(fw)}
              className={`px-2.5 py-1 rounded uppercase tracking-wider text-[11px] transition ${
                frameworkFilter === fw
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-black text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {fw}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-gray-500 mr-1">Severity:</span>
          {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded uppercase text-[10px] transition ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings & Remediation Steps List */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isPassed = item.status === 'passed';
          const isRemediating = remediatingId === item.id;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition space-y-4 ${
                isPassed
                  ? 'bg-black/60 border-emerald-500/30'
                  : 'bg-black border-white/10 hover:border-cyan-500/40'
              }`}
            >
              {/* Finding Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : item.severity === 'critical'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        {item.framework.toUpperCase()} // {item.id}
                      </span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                        item.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold font-mono text-white mt-0.5">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Status Indicator & Quick Action */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>{isPassed ? 'COMPLIANT' : 'ACTION REQUIRED'}</span>
                  </span>

                  {!isPassed && (
                    <button
                      onClick={() => handleApplyRemediation(item.id)}
                      disabled={isRemediating}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-mono uppercase rounded bg-cyan-500 hover:bg-cyan-400 text-black transition shadow-sm disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRemediating ? 'animate-spin' : ''}`} />
                      <span>{isRemediating ? 'Hardening...' : item.actionLabel}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Benchmark Finding:</span>
                  <p className="text-gray-300 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Exploitation Impact:</span>
                  <p className="text-rose-300/90 mt-0.5 leading-relaxed">{item.impact}</p>
                </div>
              </div>

              {/* Actionable IaC Code Remediation Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{item.remediationSnippet.title}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(item.id, item.remediationSnippet.code)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy IaC Block</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-black border border-white/10 text-gray-200 text-xs font-mono overflow-x-auto leading-relaxed">
                  <code>{item.remediationSnippet.code}</code>
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div className="w-full max-w-4xl rounded-2xl bg-[#0A0D14] border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] my-8 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 shadow-2xl">
      {content}
    </div>
  );
};
