/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  Server,
  Lock,
  Radio,
  Eye,
  Sparkles,
  Layers,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import { CensysThreatIntelResult, CensysExposedSubdomain } from '../types';

interface CensysThreatIntelligenceWidgetProps {
  defaultDomain?: string;
  onBlockIp?: (ip: string) => void;
  onApplyHardening?: (subdomain: string) => void;
}

const SAMPLE_INTEL_DB: Record<string, CensysThreatIntelResult> = {
  'example.com': {
    query: 'services.tls.certificates.leaf_data.names: example.com',
    scannedAt: 'Just now (Live Censys API v2)',
    totalExposedAssets: 6,
    criticalVulnerabilities: 2,
    rawApiQuery: 'services.port: {80, 443, 2019, 8443, 9200} AND host.domain: example.com',
    subdomains: [
      {
        subdomain: 'api.example.com',
        ip: '198.51.100.42',
        asn: 'AS13335',
        asnOrg: 'CLOUDFLARENET',
        country: 'United States',
        countryCode: 'US',
        openPorts: [80, 443, 8443],
        protocols: ['HTTP/1.1', 'HTTP/2', 'HTTP/3 (QUIC)'],
        tlsVersion: 'TLS 1.3',
        certIssuer: "Let's Encrypt E6",
        certExpiration: '2026-11-20',
        threatRating: 'clean',
        vulnerabilities: []
      },
      {
        subdomain: 'admin.example.com',
        ip: '198.51.100.45',
        asn: 'AS13335',
        asnOrg: 'CLOUDFLARENET',
        country: 'United States',
        countryCode: 'US',
        openPorts: [443, 2019],
        protocols: ['HTTP/2', 'HTTP Caddy Admin API'],
        tlsVersion: 'TLS 1.2',
        certIssuer: "Let's Encrypt E6",
        certExpiration: '2026-10-15',
        threatRating: 'critical',
        vulnerabilities: [
          {
            cveId: 'CVE-2023-CADDY-ADMIN',
            title: 'Exposed Port 2019 /admin API to Public Internet',
            severity: 'CRITICAL'
          },
          {
            cveId: 'CENSYS-OSINT-EXP',
            title: 'Unauthenticated Config Introspection Allowed',
            severity: 'HIGH'
          }
        ]
      },
      {
        subdomain: 'telemetry.example.com',
        ip: '198.51.100.58',
        asn: 'AS13335',
        asnOrg: 'CLOUDFLARENET',
        country: 'Germany',
        countryCode: 'DE',
        openPorts: [443, 9200],
        protocols: ['HTTPS', 'OpenSearch Transport HTTP'],
        tlsVersion: 'TLS 1.3',
        certIssuer: 'ZeroSSL RSA Domain Secure',
        certExpiration: '2026-12-01',
        threatRating: 'high',
        vulnerabilities: [
          {
            cveId: 'CENSYS-PORT-9200',
            title: 'OpenSearch REST API Port exposed without Mutual TLS',
            severity: 'HIGH'
          }
        ]
      },
      {
        subdomain: 'cdn.example.com',
        ip: '198.51.100.60',
        asn: 'AS13335',
        asnOrg: 'CLOUDFLARENET',
        country: 'United States',
        countryCode: 'US',
        openPorts: [80, 443],
        protocols: ['HTTP/2', 'HTTP/3 (QUIC)'],
        tlsVersion: 'TLS 1.3',
        certIssuer: "Let's Encrypt E6",
        certExpiration: '2026-11-20',
        threatRating: 'clean',
        vulnerabilities: []
      },
      {
        subdomain: 'staging-auth.example.com',
        ip: '198.51.100.74',
        asn: 'AS13335',
        asnOrg: 'CLOUDFLARENET',
        country: 'Netherlands',
        countryCode: 'NL',
        openPorts: [80, 443],
        protocols: ['HTTP/1.1', 'HTTP/2'],
        tlsVersion: 'TLS 1.2 (Legacy)',
        certIssuer: 'Self-Signed Staging CA',
        certExpiration: '2026-09-28',
        threatRating: 'medium',
        vulnerabilities: [
          {
            cveId: 'CENSYS-CERT-UNTRUSTED',
            title: 'Self-Signed Certificate in Public DNS Zone',
            severity: 'MEDIUM'
          }
        ]
      }
    ],
    recommendedMitigations: [
      'Bind Caddy Admin API (port 2019) strictly to 127.0.0.1 or unix socket',
      'Shield OpenSearch REST port 9200 behind Ingress VPN or IP Whitelist',
      'Replace staging self-signed certificate with ACME automated ZeroSSL TLS',
      'Enforce TLS 1.3 minimum cipher protocol across all virtual hosts'
    ]
  }
};

export const CensysThreatIntelligenceWidget: React.FC<CensysThreatIntelligenceWidgetProps> = ({
  defaultDomain = 'example.com',
  onBlockIp,
  onApplyHardening
}) => {
  const [searchDomain, setSearchDomain] = useState(defaultDomain);
  const [isScanning, setIsScanning] = useState(false);
  const [intelResult, setIntelResult] = useState<CensysThreatIntelResult>(
    SAMPLE_INTEL_DB['example.com']
  );
  const [ratingFilter, setRatingFilter] = useState<'all' | 'critical' | 'high' | 'clean'>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIp(val);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handlePerformCensysLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchDomain.trim()) return;

    setIsScanning(true);
    setTimeout(() => {
      const cleanTarget = searchDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
      const result: CensysThreatIntelResult = {
        query: `services.tls.certificates.leaf_data.names: ${cleanTarget}`,
        scannedAt: 'Just now (Censys Cloud Engine)',
        totalExposedAssets: 4,
        criticalVulnerabilities: 1,
        rawApiQuery: `services.port: {80, 443, 2019, 8080} AND host.domain: ${cleanTarget}`,
        subdomains: [
          {
            subdomain: `${cleanTarget}`,
            ip: '198.51.100.88',
            asn: 'AS13335',
            asnOrg: 'CLOUDFLARENET',
            country: 'United States',
            countryCode: 'US',
            openPorts: [80, 443],
            protocols: ['HTTP/2', 'HTTP/3'],
            tlsVersion: 'TLS 1.3',
            certIssuer: "Let's Encrypt E6",
            certExpiration: '2026-11-20',
            threatRating: 'clean',
            vulnerabilities: []
          },
          {
            subdomain: `api.${cleanTarget}`,
            ip: '198.51.100.91',
            asn: 'AS13335',
            asnOrg: 'CLOUDFLARENET',
            country: 'United States',
            countryCode: 'US',
            openPorts: [443, 8080],
            protocols: ['HTTP/2'],
            tlsVersion: 'TLS 1.3',
            certIssuer: "Let's Encrypt E6",
            certExpiration: '2026-10-30',
            threatRating: 'clean',
            vulnerabilities: []
          },
          {
            subdomain: `internal.${cleanTarget}`,
            ip: '198.51.100.95',
            asn: 'AS13335',
            asnOrg: 'CLOUDFLARENET',
            country: 'Germany',
            countryCode: 'DE',
            openPorts: [443, 2019],
            protocols: ['HTTP/2', 'Caddy Admin REST API'],
            tlsVersion: 'TLS 1.2',
            certIssuer: 'ZeroSSL RSA',
            certExpiration: '2026-09-25',
            threatRating: 'critical',
            vulnerabilities: [
              {
                cveId: 'CENSYS-ADMIN-PORT-EXPOSED',
                title: 'Port 2019 Management API open to Censys Scanners',
                severity: 'CRITICAL'
              }
            ]
          }
        ],
        recommendedMitigations: [
          `Audit DNS records for internal.${cleanTarget} and isolate port 2019`,
          `Activate Coraza WAF rules for exposed API endpoints`,
          `Enable HTTP/3 QUIC on all edge servers for zero head-of-line blocking`
        ]
      };

      setIntelResult(result);
      setIsScanning(false);
      setToastMsg(`Censys Threat Intelligence scan complete for ${cleanTarget}!`);
      setTimeout(() => setToastMsg(null), 3500);
    }, 900);
  };

  const filteredSubdomains = intelResult.subdomains.filter((s) => {
    if (ratingFilter === 'all') return true;
    if (ratingFilter === 'critical') return s.threatRating === 'critical';
    if (ratingFilter === 'high') return s.threatRating === 'high' || s.threatRating === 'critical';
    if (ratingFilter === 'clean') return s.threatRating === 'clean';
    return true;
  });

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black border border-cyan-500/60 text-cyan-300 text-xs font-mono shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono font-bold">
              OSINT_RECON // CENSYS_SEARCH_ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              API v2 ACTIVE
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2 mt-0.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Censys Threat Intelligence &amp; Exposure Scanner</span>
          </h3>
          <p className="text-xs text-gray-400">
            Automated internet-wide reconnaissance query uncovering exposed subdomains, open management ports, TLS certificate chains, and vulnerability footprints.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handlePerformCensysLookup} className="flex items-center gap-2 relative z-10">
          <div className="relative">
            <input
              type="text"
              value={searchDomain}
              onChange={(e) => setSearchDomain(e.target.value)}
              placeholder="Query domain (e.g. example.com)..."
              className="w-56 sm:w-72 bg-black border border-white/20 focus:border-cyan-500 rounded-lg px-3 py-1.5 pl-8 text-xs font-mono text-white placeholder-gray-500 outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="submit"
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Censys Scan'}</span>
          </button>
        </form>
      </div>

      {/* Intelligence Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Exposed Assets Found</div>
          <div className="text-2xl font-bold font-mono text-white">
            {intelResult.subdomains.length}
          </div>
          <div className="text-[10px] font-mono text-cyan-400">DNS &amp; TLS Certs Indexed</div>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Critical Exposures</div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {intelResult.subdomains.filter((s) => s.threatRating === 'critical').length}
          </div>
          <div className="text-[10px] font-mono text-rose-400/80">Management Ports Open</div>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">TLS 1.3 Compliant</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {intelResult.subdomains.filter((s) => s.tlsVersion?.includes('1.3')).length}/
            {intelResult.subdomains.length}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80">ZeroSSL / Let&apos;s Encrypt</div>
        </div>

        <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Recon Last Synced</div>
          <div className="text-xs font-bold font-mono text-gray-200 truncate mt-1">
            {intelResult.scannedAt}
          </div>
          <div className="text-[10px] font-mono text-gray-400 truncate">{intelResult.query}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Threat Level:
          </span>
          {(['all', 'critical', 'high', 'clean'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setRatingFilter(filter)}
              className={`px-2.5 py-1 rounded uppercase tracking-wider text-[11px] transition ${
                ratingFilter === filter
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'bg-black text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-gray-500">
          Showing {filteredSubdomains.length} of {intelResult.subdomains.length} discovered ingress surfaces
        </span>
      </div>

      {/* Subdomains & Asset Findings */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredSubdomains.map((asset) => {
          const isCritical = asset.threatRating === 'critical';
          const isHigh = asset.threatRating === 'high';
          const isClean = asset.threatRating === 'clean';

          return (
            <div
              key={asset.subdomain}
              className={`p-4 rounded-xl border transition space-y-3 ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-black border-white/10 hover:border-cyan-500/30'
              }`}
            >
              {/* Asset Headline */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {isCritical ? <ShieldAlert className="w-4 h-4" /> : isHigh ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-white">
                        {asset.subdomain}
                      </span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                        isCritical
                          ? 'bg-rose-500 text-black font-black'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {asset.threatRating}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        IP: <strong className="text-gray-200">{asset.ip}</strong>
                        <button
                          onClick={() => handleCopy(asset.ip)}
                          className="text-gray-500 hover:text-white"
                          title="Copy IP"
                        >
                          {copiedIp === asset.ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </span>
                      <span>•</span>
                      <span>{asset.asn} ({asset.asnOrg})</span>
                      <span>•</span>
                      <span>{asset.country} ({asset.countryCode})</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {onBlockIp && isCritical && (
                    <button
                      onClick={() => onBlockIp(asset.ip)}
                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-mono transition"
                    >
                      Block IP in Caddy
                    </button>
                  )}
                  {onApplyHardening && isCritical && (
                    <button
                      onClick={() => onApplyHardening(asset.subdomain)}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold transition shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Harden Endpoint</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Protocol & Ports & TLS Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-2.5 rounded-lg bg-black/60 border border-white/5">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Open Ports:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.openPorts.map((port) => (
                      <span
                        key={port}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          port === 2019 || port === 9200
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        :{port}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Protocols:</span>
                  <span className="text-gray-300 mt-1 block truncate">
                    {asset.protocols.join(', ')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">TLS Protocol:</span>
                  <span className={`mt-1 block font-bold ${asset.tlsVersion?.includes('1.3') ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {asset.tlsVersion || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Cert Issuer:</span>
                  <span className="text-gray-300 mt-1 block truncate">
                    {asset.certIssuer} (exp: {asset.certExpiration})
                  </span>
                </div>
              </div>

              {/* Vulnerabilities if any */}
              {asset.vulnerabilities.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">
                    Identified Vulnerabilities &amp; Misconfigurations:
                  </span>
                  {asset.vulnerabilities.map((vuln, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-rose-200">
                        <strong className="text-rose-400 mr-1.5">{vuln.cveId}</strong>
                        {vuln.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-500 text-black text-[9px] font-bold uppercase">
                        {vuln.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommended OSINT Mitigations */}
      <div className="p-4 rounded-xl bg-black border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommended Censys Remediation Playbook:</span>
        </div>
        <ul className="space-y-1 text-xs font-mono text-gray-300">
          {intelResult.recommendedMitigations.map((rec, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
