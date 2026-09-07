/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { AndroidFrame } from './components/AndroidFrame';
import { OverviewTab } from './components/OverviewTab';
import { SitesTab } from './components/SitesTab';
import { CyberSecurityTab } from './components/CyberSecurityTab';
import { SecOpsHubTab } from './components/SecOpsHubTab';
import { CaddyfileEditorTab } from './components/CaddyfileEditorTab';
import { LogsTab } from './components/LogsTab';
import { EcosystemGlossaryTab } from './components/EcosystemGlossaryTab';
import { AndroidAppHubTab } from './components/AndroidAppHubTab';
import { CommandPalette } from './components/CommandPalette';
import { ResourceAlertModal } from './components/ResourceAlertModal';
import { ResourceAlertToast } from './components/ResourceAlertToast';
import { downloadSecurityReportJson, downloadSecurityReportCsv } from './utils/securityReport';
import { useCaddyState } from './hooks/useCaddyState';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { DeviceViewMode } from './types';
import { WifiOff, CheckCircle2, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('web_desktop');
  const [isReloading, setIsReloading] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const isOnline = useOnlineStatus();

  const {
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
    alertThresholds,
    updateAlertThresholds,
    resourceAlert,
    dismissResourceAlert,
    triggerTestResourceAlert,
    currentCpu
  } = useCaddyState();

  const securityScore = calculateSecurityScore();
  const caddyfileContent = generateCaddyfile();

  // Listen for Ctrl+K or Cmd+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerReload = async () => {
    setIsReloading(true);
    const result = await reloadCaddy();
    setIsReloading(false);
    setGlobalToast(result.message);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  const handleAutoHardenAll = () => {
    sites.forEach((site) => {
      updateSite(site.id, {
        security: {
          ...site.security,
          wafEnabled: true,
          hstsEnabled: true,
          hstsSubdomains: true,
          blockBadBots: true,
          rateLimitRps: Math.max(100, site.security.rateLimitRps)
        }
      });
    });
  };

  const handleUpdateSiteSecurity = (siteId: string, secUpdate: any) => {
    const site = sites.find((s) => s.id === siteId);
    if (site) {
      updateSite(siteId, {
        security: {
          ...site.security,
          ...secUpdate
        }
      });
    }
  };

  // Render the active tab view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            sites={sites}
            adminConfig={adminConfig}
            metricsHistory={metricsHistory}
            threatEvents={threatEvents}
            isLiveStreaming={isLiveStreaming}
            setIsLiveStreaming={setIsLiveStreaming}
            onReload={handleTriggerReload}
            isReloading={isReloading}
            onNavigateToSites={() => setActiveTab('sites')}
            onNavigateToCyber={() => setActiveTab('cyber')}
            alertThresholds={alertThresholds}
            onOpenAlertThresholdsModal={() => setIsAlertModalOpen(true)}
          />
        );

      case 'sites':
        return (
          <SitesTab
            sites={sites}
            onAddSite={addSite}
            onUpdateSite={updateSite}
            onDeleteSite={deleteSite}
            onTriggerReload={handleTriggerReload}
          />
        );

      case 'cyber':
        return (
          <CyberSecurityTab
            threatEvents={threatEvents}
            securityScore={securityScore}
            sites={sites}
            onBlockIp={blockIpGlobal}
            onUpdateSiteSecurity={handleUpdateSiteSecurity}
            onAutoHardenAll={handleAutoHardenAll}
          />
        );

      case 'secops':
        return (
          <SecOpsHubTab
            onTriggerReload={handleTriggerReload}
            sites={sites}
            adminConfig={adminConfig}
            caddyfile={caddyfileContent}
          />
        );

      case 'caddyfile':
        return (
          <CaddyfileEditorTab
            initialCaddyfile={caddyfileContent}
            onReloadCaddy={handleTriggerReload}
            isReloading={isReloading}
          />
        );

      case 'logs':
        return (
          <LogsTab
            logs={logs}
            isStreaming={isLiveStreaming}
            setIsStreaming={setIsLiveStreaming}
            onClearLogs={clearLogs}
          />
        );

      case 'glossary':
        return <EcosystemGlossaryTab />;

      case 'android_hub':
        return (
          <AndroidAppHubTab
            onSwitchToAndroidFrame={() => setDeviceMode('pixel_8')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Offline Status Indicator */}
      {!isOnline && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 z-50 font-mono tracking-wider uppercase">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline Resilience Mode — Running cached Caddy proxy policies from Service Worker</span>
        </div>
      )}

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/50 text-cyan-300 text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.25)] animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-mono">{globalToast}</span>
        </div>
      )}

      {/* Automated High-Priority Resource Alert Toast */}
      <ResourceAlertToast
        alert={resourceAlert}
        onDismiss={dismissResourceAlert}
        onConfigureThresholds={() => setIsAlertModalOpen(true)}
      />

      {/* Resource Alert Thresholds Configuration Modal */}
      <ResourceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        thresholds={alertThresholds}
        onSave={updateAlertThresholds}
        onTriggerTestAlert={triggerTestResourceAlert}
        currentCpu={currentCpu}
        currentMemoryMb={adminConfig.memoryAllocatedMb}
      />

      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deviceMode={deviceMode}
        setDeviceMode={setDeviceMode}
        adminConfig={adminConfig}
        onReload={handleTriggerReload}
        isReloading={isReloading}
        securityScore={securityScore.total}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Global Command Palette Overlay (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onReloadCaddy={handleTriggerReload}
        onAutoHarden={handleAutoHardenAll}
        onClearLogs={clearLogs}
        onDownloadReportJson={() => {
          downloadSecurityReportJson(threatEvents, securityScore, sites);
          setGlobalToast('Downloaded Security Audit Report (JSON)');
          setTimeout(() => setGlobalToast(null), 3500);
        }}
        onDownloadReportCsv={() => {
          downloadSecurityReportCsv(threatEvents, securityScore, sites);
          setGlobalToast('Downloaded Threat Incident Log (CSV)');
          setTimeout(() => setGlobalToast(null), 3500);
        }}
        isStreaming={isLiveStreaming}
        onToggleStreaming={() => setIsLiveStreaming(!isLiveStreaming)}
        onOpenAlertThresholds={() => setIsAlertModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {deviceMode === 'pixel_8' ? (
          <AndroidFrame
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onExitFrame={() => setDeviceMode('web_desktop')}
          >
            {renderActiveView()}
          </AndroidFrame>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {renderActiveView()}
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t border-white/10 bg-black flex items-center justify-between px-4 sm:px-8 text-[9px] uppercase tracking-[0.25em] text-gray-500 font-mono select-none z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <span>SECURE_ROOT_CONNECTION: ESTABLISHED</span>
          </span>
          <span className="hidden md:inline text-white/20">|</span>
          <span className="hidden md:inline text-cyan-500/70">CADDYDASH ECOSYSTEM // MULTI-NODE MONITORING ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 hidden sm:inline">OWASP_CRS_v4: ACTIVE</span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-cyan-400 font-mono">SYS_SYNC // PROXY_V2.9</span>
        </div>
      </footer>
    </div>
  );
}
