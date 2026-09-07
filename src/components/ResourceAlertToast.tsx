/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, X, Sliders, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface ResourceAlertToastProps {
  alert: {
    id: string;
    type: 'cpu' | 'memory';
    title: string;
    message: string;
    value: number;
    threshold: number;
    timestamp: string;
  } | null;
  onDismiss: () => void;
  onConfigureThresholds: () => void;
}

export const ResourceAlertToast: React.FC<ResourceAlertToastProps> = ({
  alert,
  onDismiss,
  onConfigureThresholds
}) => {
  if (!alert) return null;

  const isCpu = alert.type === 'cpu';

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-3 fade-in duration-200">
      <div className={`p-4 rounded-2xl bg-[#0F0505] border ${
        isCpu ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)]' : 'border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
      } backdrop-blur-xl space-y-3 relative overflow-hidden`}>
        {/* Animated warning pulse background line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isCpu ? 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-600 animate-pulse' : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse'
        }`} />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              isCpu ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            } animate-bounce`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">
                  CRITICAL RESOURCE BREACH
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <h4 className="text-sm font-bold font-mono text-white tracking-tight">
                {alert.title}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 font-mono leading-relaxed pl-1">
          {alert.message}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono border-t border-white/10">
          <div className="flex items-center gap-2 text-gray-400">
            <span>Observed: <strong className="text-white font-bold">{alert.value}{isCpu ? '%' : ' MB'}</strong></span>
            <span>|</span>
            <span>Limit: <strong className="text-rose-300">{alert.threshold}{isCpu ? '%' : ' MB'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onConfigureThresholds}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition text-[11px] font-mono"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>Adjust</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold transition text-[11px] font-mono shadow-sm"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
