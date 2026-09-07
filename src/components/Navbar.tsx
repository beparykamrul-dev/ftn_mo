/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shield,
  Server,
  Activity,
  Globe,
  FileCode,
  Terminal,
  BookOpen,
  Smartphone,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Layers
} from 'lucide-react';
import { DeviceViewMode, CaddyAdminConfig } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type TabType = 'overview' | 'sites' | 'cyber' | 'secops' | 'caddyfile' | 'logs' | 'glossary' | 'android_hub';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  deviceMode: DeviceViewMode;
  setDeviceMode: (mode: DeviceViewMode) => void;
  adminConfig: CaddyAdminConfig;
  onReload: () => void;
  isReloading: boolean;
  securityScore: number;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  deviceMode,
  setDeviceMode,
  adminConfig,
  onReload,
  isReloading,
  securityScore,
  onOpenCommandPalette
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'sites', label: 'Sites & Proxies', icon: <Globe className="w-4 h-4" /> },
    {
      id: 'cyber',
      label: 'Cyber Shield',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      badge: `${securityScore}/100`
    },
    {
      id: 'secops',
      label: 'SecOps Hub',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      badge: '21 Tools'
    },
    { id: 'caddyfile', label: 'Caddyfile', icon: <FileCode className="w-4 h-4" /> },
    { id: 'logs', label: 'Live Logs', icon: <Terminal className="w-4 h-4" /> },
    { id: 'glossary', label: 'Ecosystem', icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'android_hub',
      label: 'Android App',
      icon: <Smartphone className="w-4 h-4 text-cyan-400" />,
      badge: isInstalled ? 'Installed' : 'PWA/APK'
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">
        {/* Brand Logo & Server Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-black border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tighter text-white italic">
                CADDY<span className="text-cyan-500">DASH</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-[0.2em] rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO v2.9
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-400">
              <span className="inline-flex items-center gap-1.5 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
                API ACTIVE
              </span>
              <span className="text-white/20">•</span>
              <span className="text-gray-400">UPTIME: {Math.floor(adminConfig.uptimeSeconds / 3600)}H {Math.floor((adminConfig.uptimeSeconds % 3600) / 60)}M</span>
              <span className="text-white/20">•</span>
              <span className="text-gray-400">MEM: {adminConfig.memoryAllocatedMb}MB</span>
            </div>
          </div>
        </div>

        {/* Right Tools & Device View Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs font-mono text-gray-400 hover:text-white hover:border-white/30 transition shadow-sm"
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <span>Search / Actions</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-300 font-bold">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Reload Button */}
          <button
            id="caddy-reload-btn"
            onClick={onReload}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-tighter text-black bg-white hover:bg-slate-200 active:bg-slate-300 rounded transition shadow-sm disabled:opacity-60"
            title="Trigger Zero-Downtime Hot Reload via Caddy Admin API"
          >
            <RotateCw className={`w-3.5 h-3.5 text-black ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'Reloading...' : 'Hot Reload'}</span>
          </button>

          {/* Android / Desktop View Toggle */}
          <div className="hidden md:flex items-center p-0.5 bg-black border border-white/10 rounded">
            <button
              id="view-desktop-btn"
              onClick={() => setDeviceMode('web_desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded transition ${
                deviceMode === 'web_desktop'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Web</span>
            </button>
            <button
              id="view-android-pixel-btn"
              onClick={() => setDeviceMode('pixel_8')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded transition ${
                deviceMode === 'pixel_8'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Shell</span>
            </button>
          </div>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              id="pwa-install-header-btn"
              onClick={install}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-tighter text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded shadow-[0_0_15px_rgba(6,182,212,0.2)] transition active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setActiveTab('android_hub')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 rounded"
            >
              Mobile PWA
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none border-t border-white/10 bg-[#070707]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded transition-all ${
                isActive
                  ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              )}
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    item.id === 'cyber'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
