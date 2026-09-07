/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Radio,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  Filter,
  Flame,
  Terminal,
  ChevronRight,
  Sparkles,
  Sliders,
  Eye,
  RefreshCw,
  FileDown,
  Download
} from 'lucide-react';
import { CyberThreatEvent, SecurityScore, SiteConfig } from '../types';
import { ThreatWorldMap } from './ThreatWorldMap';
import { downloadSecurityReportJson, downloadSecurityReportCsv } from '../utils/securityReport';

interface CyberSecurityTabProps {
  threatEvents: CyberThreatEvent[];
  securityScore: SecurityScore;
  sites: SiteConfig[];
  onBlockIp: (ip: string) => void;
  onUpdateSiteSecurity: (siteId: string, security: Partial<SiteConfig['security']>) => void;
  onAutoHardenAll: () => void;
}

export const CyberSecurityTab: React.FC<CyberSecurityTabProps> = ({
  threatEvents,
  securityScore,
  sites,
  onBlockIp,
  onUpdateSiteSecurity,
  onAutoHardenAll
}) => {
  const [selectedThreat, setSelectedThreat] = useState<CyberThreatEvent | null>(threatEvents[0] || null);
  const [newBlockedIp, setNewBlockedIp] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<'radar' | 'firewall' | 'headers' | 'tls'>('radar');
  const [hardenedToast, setHardenedToast] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [showReportMenu, setShowReportMenu] = useState(false);

  const handleManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedIp.trim()) return;
    onBlockIp(newBlockedIp.trim());
    setNewBlockedIp('');
  };

  const handleHarden = () => {
    onAutoHardenAll();
    setHardenedToast(true);
    setTimeout(() => setHardenedToast(false), 4000);
  };

  const handleDownloadJson = () => {
    downloadSecurityReportJson(threatEvents, securityScore, sites);
    setShowReportMenu(false);
    setDownloadToast('Generated and downloaded Security Audit Report (JSON)');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleDownloadCsv = () => {
    downloadSecurityReportCsv(threatEvents, securityScore, sites);
    setShowReportMenu(false);
    setDownloadToast('Exported Threat Incident Table to CSV');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  // Severity color mapping
  const getSeverityBadge = (sev: CyberThreatEvent['severity']) => {
    if (sev === 'critical') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">CRITICAL</span>;
    }
    if (sev === 'high') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">HIGH</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">MEDIUM</span>;
  };

  return (
    <div className="space-y-6">
      {/* Auto-Harden Toast */}
      {hardenedToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/60 text-cyan-300 text-xs font-mono shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Applied Enterprise Hardening: WAF Enforced, HSTS Preloaded, Bad Bots Dropped!</span>
        </div>
      )}

      {/* Cyber Security Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">SECURITY_OPS // CORAZA_WAF</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Cyber Defense &amp; Threat Intelligence Suite</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time Coraza WAF (OWASP CRS), DDoS shaper, bot shields, and automated SSL/TLS hardening.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative">
          {/* Download Security Report Button */}
          <div className="relative">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded bg-black border border-white/20 text-cyan-300 hover:text-white hover:border-cyan-500/50 shadow-sm transition"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Download Security Report</span>
            </button>

            {showReportMenu && (
              <div className="absolute right-0 mt-1 w-56 rounded-xl bg-[#0A0A0A] border border-white/20 shadow-2xl p-1.5 z-40 font-mono text-xs space-y-1 animate-fade-in">
                <button
                  onClick={handleDownloadJson}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white flex items-center justify-between transition"
                >
                  <span>JSON Summary</span>
                  <span className="text-[10px] text-cyan-400 font-bold">.json</span>
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white flex items-center justify-between transition"
                >
                  <span>CSV Incidents Log</span>
                  <span className="text-[10px] text-purple-400 font-bold">.csv</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleHarden}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tighter rounded bg-white hover:bg-slate-200 text-black shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>1-Click Auto-Harden All Sites</span>
          </button>
        </div>
      </div>

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-emerald-500/60 text-emerald-300 text-xs font-mono shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Security Posture Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Score Ring / Grade */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">POSTURE_RATING</span>
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyan-500/40 bg-cyan-500/5 shadow-inner">
            <span className="text-4xl font-extrabold text-cyan-400 font-mono">{securityScore.grade}</span>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black border border-cyan-500/40 text-cyan-300">
              {securityScore.total}/100
            </span>
          </div>
          <p className="text-xs text-white font-bold font-mono uppercase tracking-wider">Enterprise Hardened</p>
          <p className="text-[10px] text-gray-500 font-mono">Mozilla Observatory Standards</p>
        </div>

        {/* 3 Pillars Breakdown */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Defense Surface Matrix</h2>
            <span className="text-[10px] font-mono text-cyan-400">CORAZA_CRS v3.3.2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pillar 1: WAF */}
            <div className="p-3.5 rounded-xl bg-black border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Coraza WAF (OWASP)</span>
                <span className="font-bold text-cyan-400">{securityScore.wafScore}/25 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div style={{ width: `${(securityScore.wafScore / 25) * 100}%` }} className="h-full bg-cyan-500"></div>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">SQLi, XSS, SSRF &amp; RCE deep inspection</p>
            </div>

            {/* Pillar 2: DDoS & Rate Limits */}
            <div className="p-3.5 rounded-xl bg-black border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">DDoS &amp; Rate Shaper</span>
                <span className="font-bold text-emerald-400">{securityScore.rateLimitScore}/25 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div style={{ width: `${(securityScore.rateLimitScore / 25) * 100}%` }} className="h-full bg-emerald-500"></div>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Token-bucket sliding window burst filter</p>
            </div>

            {/* Pillar 3: HSTS & Headers */}
            <div className="p-3.5 rounded-xl bg-black border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">HSTS &amp; Preload</span>
                <span className="font-bold text-purple-400">{securityScore.headersScore}/25 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div style={{ width: `${(securityScore.headersScore / 25) * 100}%` }} className="h-full bg-purple-500"></div>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Preload header, CSP &amp; -Server banner</p>
            </div>
          </div>

          {/* Audit Checks Checklist */}
          <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {securityScore.checks.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded bg-black border border-white/5">
                <div className="flex items-center gap-2">
                  {c.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="text-gray-200">{c.name}</span>
                </div>
                <span className="text-[10px] text-gray-500">{c.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-xs">
        <button
          onClick={() => setActiveSubSection('radar')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
            activeSubSection === 'radar'
              ? 'bg-white text-black font-bold uppercase tracking-tighter shadow-sm'
              : 'text-gray-400 hover:text-white font-mono uppercase tracking-wider bg-black border border-white/5'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${activeSubSection === 'radar' ? 'text-black' : 'text-rose-400 animate-pulse'}`} />
          <span>Live Threat Radar</span>
        </button>

        <button
          onClick={() => setActiveSubSection('firewall')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
            activeSubSection === 'firewall'
              ? 'bg-white text-black font-bold uppercase tracking-tighter shadow-sm'
              : 'text-gray-400 hover:text-white font-mono uppercase tracking-wider bg-black border border-white/5'
          }`}
        >
          <Ban className={`w-3.5 h-3.5 ${activeSubSection === 'firewall' ? 'text-black' : 'text-cyan-400'}`} />
          <span>IP Blacklist &amp; Bot Defense</span>
        </button>

        <button
          onClick={() => setActiveSubSection('headers')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
            activeSubSection === 'headers'
              ? 'bg-white text-black font-bold uppercase tracking-tighter shadow-sm'
              : 'text-gray-400 hover:text-white font-mono uppercase tracking-wider bg-black border border-white/5'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${activeSubSection === 'headers' ? 'text-black' : 'text-purple-400'}`} />
          <span>Security Headers Injector</span>
        </button>
      </div>

      {/* Sub-Section 1: Live Threat Radar & Attack Interceptor */}
      {activeSubSection === 'radar' && (
        <div className="space-y-6">
          {/* Interactive Global Threat Geomap */}
          <ThreatWorldMap threatEvents={threatEvents} onBlockIp={onBlockIp} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Threat Stream */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">INTERCEPT_STREAM</div>
                <h2 className="text-base font-bold text-white italic flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Live Cyber Attacks Intercepted</span>
                </h2>
                <p className="text-xs text-gray-400">Streamed from Coraza WAF engine and Caddy rate limiter</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30 uppercase tracking-wider">
                Active Enforce Mode
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {threatEvents.map((threat) => (
                <div
                  key={threat.id}
                  onClick={() => setSelectedThreat(threat)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    selectedThreat?.id === threat.id
                      ? 'bg-[#0A0A0A] border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                      : 'bg-black border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(threat.severity)}
                      <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                        {threat.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs font-mono text-cyan-300">{threat.sourceIp}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                        {threat.country} ({threat.countryCode})
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-400 truncate max-w-md">
                      Target: <span className="text-rose-400">{threat.targetPath}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                      {threat.action.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">{threat.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Inspector & Instant IP Drop */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4 flex flex-col justify-between">
            {selectedThreat ? (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-rose-500 font-mono">FORENSICS_NODE</div>
                  <h3 className="text-base font-bold text-white italic flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Attack Forensics Inspector</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedThreat.id}</p>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300 font-mono">
                  <div className="p-2.5 rounded bg-black border border-white/5">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Rule Triggered</span>
                    <span className="text-rose-400 text-[11px] break-all">
                      {selectedThreat.ruleTriggered}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-black border border-white/5">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Malicious Payload / URI</span>
                    <span className="text-gray-200 text-[11px] break-all">
                      {selectedThreat.targetPath}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-black border border-white/5">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Client User Agent</span>
                    <span className="text-gray-400 text-[11px] break-all">
                      {selectedThreat.userAgent}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 text-xs">
                    <span className="text-gray-500">Target Host:</span>
                    <span className="font-bold text-white">{selectedThreat.targetDomain}</span>
                  </div>

                  <div className="flex justify-between py-1 text-xs">
                    <span className="text-gray-500">Geo Location:</span>
                    <span className="font-bold text-white">{selectedThreat.country} ({selectedThreat.countryCode})</span>
                  </div>
                </div>

                <button
                  onClick={() => onBlockIp(selectedThreat.sourceIp)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs transition shadow-lg shadow-rose-950/50"
                >
                  <Ban className="w-4 h-4" />
                  <span>Permanently Drop IP ({selectedThreat.sourceIp})</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-mono">Select any threat from the live stream to inspect deep packet details.</p>
            )}

            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
              <span className="font-bold block uppercase tracking-wider text-[10px]">Automatic Coraza Action:</span>
              TCP connections from repeated offending IPs are immediately closed without sending upstream headers.
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Sub-Section 2: IP Blacklist & Bot Defense */}
      {activeSubSection === 'firewall' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP Blacklist Manager */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-rose-500 font-mono">LAYER_7_FIREWALL</div>
            <h3 className="text-base font-bold text-white italic flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>IP CIDR Blacklist</span>
            </h3>
            <p className="text-xs text-gray-400">
              Drop incoming packets at layer 7 before processing TLS handshakes or routing.
            </p>

            <form onSubmit={handleManualBlock} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter IP or CIDR (e.g. 194.26.29.0/24)"
                value={newBlockedIp}
                onChange={(e) => setNewBlockedIp(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-black border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs"
              >
                Block IP
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sites.flatMap(s => s.security.ipBlacklist).filter((v, i, a) => a.indexOf(v) === i).map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-black border border-white/5 text-xs font-mono">
                  <span className="text-gray-300">{ip}</span>
                  <span className="text-[10px] text-rose-400 font-bold uppercase">DROPPED (403)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bad Bot Defense Controls */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">CRAWLER_DEFENSE</div>
            <h3 className="text-base font-bold text-white italic flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Automated Bot &amp; Crawler Shield</span>
            </h3>
            <p className="text-xs text-gray-400">
              Detects and drops unauthorized crawlers, AI training scraping bots, and vulnerability spiders.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-black border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-200 block">AI Web Harvesters &amp; Training Spiders</span>
                  <span className="text-gray-500 text-[11px]">Blocks GPTBot, CCBot, ClaudeBot, Bytespider</span>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  SHIELD ACTIVE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-200 block">Aggressive SEO &amp; Reconnaissance Crawlers</span>
                  <span className="text-gray-500 text-[11px]">Blocks SemrushBot, AhrefsBot, MJ12bot, DotBot</span>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  SHIELD ACTIVE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-200 block">CMS &amp; Admin Panel Probing Defense</span>
                  <span className="text-gray-500 text-[11px]">Instantly drops scans targeting /wp-admin, /.env, /config</span>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  SHIELD ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Section 3: Security Headers Injector */}
      {activeSubSection === 'headers' && (
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-mono">HEADER_INJECTOR</div>
              <h3 className="text-base font-bold text-white italic flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Enterprise Security Headers Suite</span>
              </h3>
              <p className="text-xs text-gray-400">
                Automatically appended to all downstream responses via Caddy's high-speed header directive.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Mozilla A+ Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
              <span className="text-cyan-400 font-bold">Strict-Transport-Security</span>
              <p className="text-gray-300">max-age=63072000; includeSubDomains; preload</p>
              <p className="text-[10px] text-gray-500 font-sans">Forces browsers to always connect via TLS for 2 years</p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
              <span className="text-cyan-400 font-bold">X-Content-Type-Options</span>
              <p className="text-gray-300">nosniff</p>
              <p className="text-[10px] text-gray-500 font-sans">Prevents malicious MIME-type execution and sniffing</p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
              <span className="text-cyan-400 font-bold">X-Frame-Options</span>
              <p className="text-gray-300">DENY</p>
              <p className="text-[10px] text-gray-500 font-sans">Protects against clickjacking and malicious iframe embedding</p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
              <span className="text-cyan-400 font-bold">Server Header Stripping</span>
              <p className="text-gray-300">-Server</p>
              <p className="text-[10px] text-gray-500 font-sans">Hides Caddy engine details from port scanners and recon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
