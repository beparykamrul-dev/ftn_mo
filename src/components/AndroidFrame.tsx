/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wifi,
  BatteryMedium,
  Activity,
  Globe,
  Shield,
  FileCode,
  Terminal,
  BookOpen,
  Smartphone,
  X,
  Maximize2,
  Layers
} from 'lucide-react';
import { TabType } from './Navbar';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onExitFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  setActiveTab,
  onExitFrame
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const mobileNavItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'sites', label: 'Sites', icon: <Globe className="w-4 h-4" /> },
    { id: 'cyber', label: 'Cyber', icon: <Shield className="w-4 h-4" /> },
    { id: 'secops', label: 'SecOps', icon: <Layers className="w-4 h-4" /> },
    { id: 'caddyfile', label: 'Config', icon: <FileCode className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs', icon: <Terminal className="w-4 h-4" /> },
    { id: 'android_hub', label: 'App', icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-4 px-2 sm:px-4 bg-[#050505]">
      {/* Top Controller Bar */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-xs text-gray-400 px-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">Pixel 8 Pro // Mobile Runtime</span>
        </div>
        <button
          onClick={onExitFrame}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-black border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-mono uppercase tracking-wider transition"
          title="Return to standard full-width Web Dashboard"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Exit Simulator</span>
        </button>
      </div>

      {/* Android Device Body */}
      <div className="relative w-full max-w-[390px] h-[812px] bg-[#050505] rounded-[44px] border-[10px] border-[#181818] shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Device Punch Hole & Speaker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black z-50 ring-2 ring-white/10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
        </div>

        {/* Android Status Bar */}
        <div className="h-10 w-full px-7 pt-2 flex items-center justify-between text-[11px] font-mono font-semibold text-gray-300 select-none z-40 bg-[#0A0A0A]">
          <span>{currentTime}</span>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-[10px] tracking-wider text-cyan-400 font-bold font-mono">5G</span>
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-0.5 font-mono">
              <span>94%</span>
              <BatteryMedium className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* In-Device Scrollable Content View */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#050505] text-white p-3 pb-24">
          {children}
        </div>

        {/* Material 3 Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-[#0A0A0A]/95 border-t border-white/10 backdrop-blur-md flex items-center justify-around px-1 z-40">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all font-mono ${
                  isActive ? 'text-cyan-400 scale-105' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div
                  className={`p-1 rounded-full transition-colors ${
                    isActive ? 'bg-cyan-500/20 text-cyan-400' : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Android Gesture Navigation Home Indicator Pill */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full z-50 pointer-events-none"></div>
      </div>
    </div>
  );
};
