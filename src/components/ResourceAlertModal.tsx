/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, X, Cpu, HardDrive, BellRing, Check, Sparkles } from 'lucide-react';
import { ResourceAlertThresholds } from '../types';

interface ResourceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ResourceAlertThresholds;
  onSave: (thresholds: ResourceAlertThresholds) => void;
  onTriggerTestAlert: (type: 'cpu' | 'memory') => void;
  currentCpu: number;
  currentMemoryMb: number;
}

export const ResourceAlertModal: React.FC<ResourceAlertModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
  onTriggerTestAlert,
  currentCpu,
  currentMemoryMb
}) => {
  const [cpuPercent, setCpuPercent] = useState(thresholds.cpuPercent);
  const [memoryMb, setMemoryMb] = useState(thresholds.memoryMb);
  const [enabled, setEnabled] = useState(thresholds.enabled);
  const [hasSaved, setHasSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      cpuPercent,
      memoryMb,
      enabled
    });
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#090D14] border border-cyan-500/30 p-6 space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-500">
                TELEMETRY_WATCHDOG // CONFIG
              </div>
              <h2 className="text-lg font-bold text-white font-mono tracking-tight">
                Resource Alert Thresholds
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Automated Monitoring Toggle */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white font-mono block">
                Automated Resource Watchdog
              </span>
              <span className="text-[11px] text-gray-400">
                Continuously poll CPU and RAM metrics to fire high-priority alert toasts
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* CPU Threshold Control */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-white">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>CPU Utilization Threshold</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {cpuPercent}%
              </span>
            </div>

            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={cpuPercent}
              onChange={(e) => setCpuPercent(Number(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-gray-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span>Current Load: <strong className="text-white">{currentCpu}%</strong></span>
              <span>Trigger Alert: &ge; {cpuPercent}%</span>
            </div>
          </div>

          {/* Memory Threshold Control */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-white">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Memory Allocation Limit</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                {memoryMb} MB
              </span>
            </div>

            <input
              type="range"
              min="25"
              max="120"
              step="2"
              value={memoryMb}
              onChange={(e) => setMemoryMb(Number(e.target.value))}
              className="w-full accent-purple-400 h-2 bg-gray-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span>Current Allocation: <strong className="text-white">{currentMemoryMb} MB</strong></span>
              <span>Trigger Alert: &ge; {memoryMb} MB</span>
            </div>
          </div>

          {/* Test Alert Triggers */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              Diagnostic Simulations (Test Notifications):
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onTriggerTestAlert('cpu');
                  onClose();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-black border border-rose-500/30 hover:border-rose-500/60 text-rose-300 text-xs font-mono transition text-center"
              >
                Fire Test CPU Spike Alert
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerTestAlert('memory');
                  onClose();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-black border border-amber-500/30 hover:border-amber-500/60 text-amber-300 text-xs font-mono transition text-center"
              >
                Fire Test Memory Alert
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-mono uppercase rounded bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
            >
              {hasSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{hasSaved ? 'Saved Thresholds!' : 'Save & Arm Thresholds'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
