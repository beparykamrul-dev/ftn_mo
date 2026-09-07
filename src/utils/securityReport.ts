/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CyberThreatEvent, SecurityScore, SiteConfig } from '../types';

export function downloadSecurityReportJson(
  threatEvents: CyberThreatEvent[],
  securityScore: SecurityScore,
  sites: SiteConfig[]
) {
  const report = {
    reportTitle: 'CaddyDash Enterprise Cyber Security & Threat Intelligence Audit',
    reportId: `SEC-AUDIT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    proxyEngine: 'Caddy v2.9.1 (Coraza WAF CRS v3.3.2 / v4.0)',
    postureRating: {
      overallScore: securityScore.total,
      grade: securityScore.grade,
      breakdown: {
        wafScore: securityScore.wafScore,
        rateLimitScore: securityScore.rateLimitScore,
        headersScore: securityScore.headersScore
      },
      auditChecks: securityScore.checks
    },
    defenseSurfaceSummary: {
      totalSites: sites.length,
      sitesProtectedWithWaf: sites.filter((s) => s.security.wafEnabled).length,
      sitesWithHsts: sites.filter((s) => s.security.hstsEnabled).length,
      sitesWithBotShield: sites.filter((s) => s.security.blockBadBots).length,
      sites: sites.map((s) => ({
        domain: s.domain,
        tlsProvider: s.tlsProvider,
        tlsStatus: s.tlsStatus,
        wafEnabled: s.security.wafEnabled,
        rateLimitRps: s.security.rateLimitRps,
        burstLimit: s.security.burstLimit,
        hstsEnabled: s.security.hstsEnabled,
        blockBadBots: s.security.blockBadBots,
        ipBlacklistCount: s.security.ipBlacklist.length,
        ipBlacklist: s.security.ipBlacklist
      }))
    },
    threatTelemetrySummary: {
      totalInterceptedEvents: threatEvents.length,
      criticalThreats: threatEvents.filter((t) => t.severity === 'critical').length,
      highThreats: threatEvents.filter((t) => t.severity === 'high').length,
      blockedActions: threatEvents.filter((t) => t.action === 'blocked').length,
      recentThreatEvents: threatEvents.map((t) => ({
        id: t.id,
        timestamp: t.timestamp,
        type: t.type,
        sourceIp: t.sourceIp,
        country: t.country,
        countryCode: t.countryCode,
        coordinates: { lat: t.lat, lng: t.lng },
        targetDomain: t.targetDomain,
        targetPath: t.targetPath,
        severity: t.severity,
        action: t.action,
        ruleTriggered: t.ruleTriggered,
        userAgent: t.userAgent
      }))
    }
  };

  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `caddy-security-report-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSecurityReportCsv(
  threatEvents: CyberThreatEvent[],
  securityScore: SecurityScore,
  sites: SiteConfig[]
) {
  const headers = [
    'Event_ID',
    'Timestamp',
    'Severity',
    'Action',
    'Threat_Type',
    'Source_IP',
    'Country',
    'Latitude',
    'Longitude',
    'Target_Domain',
    'Target_Path',
    'Rule_Triggered',
    'User_Agent'
  ];

  const rows = threatEvents.map((t) => [
    `"${t.id}"`,
    `"${t.timestamp}"`,
    `"${t.severity}"`,
    `"${t.action}"`,
    `"${t.type}"`,
    `"${t.sourceIp}"`,
    `"${t.country} (${t.countryCode})"`,
    `"${t.lat ?? ''}"`,
    `"${t.lng ?? ''}"`,
    `"${t.targetDomain}"`,
    `"${t.targetPath.replace(/"/g, '""')}"`,
    `"${t.ruleTriggered.replace(/"/g, '""')}"`,
    `"${t.userAgent.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `caddy-threat-events-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
