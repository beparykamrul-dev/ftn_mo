/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RotateCw,
  Shield,
  Trash2,
  FileDown,
  Activity,
  Globe,
  FileCode,
  Terminal,
  BookOpen,
  Smartphone,
  Cpu,
  Layers,
  ArrowRight,
  Command,
  Play,
  Pause,
  Sliders,
  BellRing
} from 'lucide-react';
import { TabType } from './Navbar';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Navigation' | 'Security';
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
  onReloadCaddy: () => void;
  onAutoHarden: () => void;
  onClearLogs: () => void;
  onDownloadReportJson: () => void;
  onDownloadReportCsv: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onOpenAlertThresholds?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onReloadCaddy,
  onAutoHarden,
  onClearLogs,
  onDownloadReportJson,
  onDownloadReportCsv,
  isStreaming,
  onToggleStreaming,
  onOpenAlertThresholds
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Actions
    {
      id: 'reload-caddy',
      title: 'Reload Caddy Server',
      category: 'Actions',
      description: 'Zero-downtime hot reload via Caddy Admin API (2019)',
      icon: <RotateCw className="w-4 h-4 text-cyan-400" />,
      shortcut: '⌘R',
      action: () => {
        onReloadCaddy();
        onClose();
      }
    },
    {
      id: 'auto-harden',
      title: 'Auto-Harden All Sites',
      category: 'Actions',
      description: 'Enable Coraza WAF, HSTS, Rate Limiting & BotShield across all proxy domains',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onAutoHarden();
        onClose();
      }
    },
    {
      id: 'clear-logs',
      title: 'Clear Buffered Logs',
      category: 'Actions',
      description: 'Flush memory buffer of access and threat logs',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: () => {
        onClearLogs();
        onClose();
      }
    },
    {
      id: 'download-json',
      title: 'Download Security Report (JSON)',
      category: 'Actions',
      description: 'Export comprehensive threat events and hardening status to JSON',
      icon: <FileDown className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onDownloadReportJson();
        onClose();
      }
    },
    {
      id: 'download-csv',
      title: 'Download Security Report (CSV)',
      category: 'Actions',
      description: 'Export threat logs and incident table to CSV spreadsheet format',
      icon: <FileDown className="w-4 h-4 text-purple-400" />,
      action: () => {
        onDownloadReportCsv();
        onClose();
      }
    },
    {
      id: 'toggle-stream',
      title: isStreaming ? 'Pause Telemetry Stream' : 'Resume Telemetry Stream',
      category: 'Actions',
      description: 'Halt or resume real-time metrics generation',
      icon: isStreaming ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onToggleStreaming();
        onClose();
      }
    },
    ...(onOpenAlertThresholds ? [{
      id: 'alert-thresholds',
      title: 'Configure Resource Alert Thresholds',
      category: 'Actions' as const,
      description: 'Set CPU & memory limits for high-priority warning toasts',
      icon: <Sliders className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onOpenAlertThresholds();
        onClose();
      }
    }] : []),

    // Navigation
    {
      id: 'nav-overview',
      title: 'Go to Monitoring & Overview',
      category: 'Navigation',
      description: 'Server load, memory usage, 60m recharts & proxy traffic',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigate('overview');
        onClose();
      }
    },
    {
      id: 'nav-secops',
      title: 'Go to SecOps & Ecosystem Control Hub',
      category: 'Navigation',
      description: 'Ansible, Terraform, Wazuh, InfluxDB, Kopia, OpenSearch & hardware audit',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      action: () => {
        onNavigate('secops');
        onClose();
      }
    },
    {
      id: 'nav-sites',
      title: 'Go to Sites & Reverse Proxies',
      category: 'Navigation',
      description: 'Manage reverse proxy domains, upstreams, route handlers & TLS',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigate('sites');
        onClose();
      }
    },
    {
      id: 'nav-cyber',
      title: 'Go to Cyber Defense & Global Threat Map',
      category: 'Navigation',
      description: 'Coraza WAF, OWASP CRS, live geomap & IP blacklist',
      icon: <Shield className="w-4 h-4 text-rose-400" />,
      action: () => {
        onNavigate('cyber');
        onClose();
      }
    },
    {
      id: 'nav-caddyfile',
      title: 'Go to Caddyfile Editor',
      category: 'Navigation',
      description: 'Live Caddyfile syntax viewer and hot-reload engine',
      icon: <FileCode className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigate('caddyfile');
        onClose();
      }
    },
    {
      id: 'nav-logs',
      title: 'Go to Live Access & Threat Logs',
      category: 'Navigation',
      description: 'Real-time JSON access stream and forensic inspector',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigate('logs');
        onClose();
      }
    },
    {
      id: 'nav-glossary',
      title: 'Go to Ecosystem Glossary',
      category: 'Navigation',
      description: 'Caddy directives, architecture patterns & blueprints',
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigate('glossary');
        onClose();
      }
    },
    {
      id: 'nav-android',
      title: 'Go to Android App Companion Hub',
      category: 'Navigation',
      description: 'PWA installation, Capacitor APK guide & push alerts',
      icon: <Smartphone className="w-4 h-4 text-purple-400" />,
      action: () => {
        onNavigate('android_hub');
        onClose();
      }
    }
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Command Palette Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#0A0A0A] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col font-sans"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search actions (e.g. 'reload', 'harden', 'report')..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none font-mono"
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded bg-black border border-white/10 text-[10px] font-mono text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-gray-500">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-white/10 border border-white/20 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black border border-white/10">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {cmd.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-white/5 text-gray-400 border border-white/5">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.description && (
                        <p className="text-[11px] text-gray-400 line-clamp-1">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-black border border-white/10 text-[10px] font-mono text-gray-400">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-black border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#151515] text-gray-300">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-[#151515] text-gray-300">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#151515] text-gray-300">↵</kbd> Select
            </span>
          </div>
          <span className="text-cyan-400">CADDYDASH QUICK ENGINE</span>
        </div>
      </div>
    </div>
  );
};
