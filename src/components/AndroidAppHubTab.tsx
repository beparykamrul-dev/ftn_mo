/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Bell,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAppHubTabProps {
  onSwitchToAndroidFrame: () => void;
}

export const AndroidAppHubTab: React.FC<AndroidAppHubTabProps> = ({
  onSwitchToAndroidFrame
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [notificationActive, setNotificationActive] = useState(false);
  const [copiedCapacitor, setCopiedCapacitor] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const capacitorConfig = `{
  "appId": "io.caddydash.pro",
  "appName": "CaddyDash Pro",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true
  }
}`;

  const requestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationActive(true);
        new Notification('🛡️ CaddyDash Security Guard', {
          body: 'Android Push Alerts Active! Zero-Downtime monitoring engaged.',
          icon: '/icon.svg'
        });
        setNotificationToast('Notification permission granted! Test notification sent to your device.');
      } else {
        setNotificationToast('Notification permission was dismissed or blocked in browser settings.');
      }
    } else {
      setNotificationToast('Web Notifications not supported in this iframe/browser context.');
    }
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const copyCapacitor = () => {
    navigator.clipboard.writeText(capacitorConfig);
    setCopiedCapacitor(true);
    setTimeout(() => setCopiedCapacitor(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notificationToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-cyan-500/60 text-cyan-300 text-xs font-mono shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">MOBILE_CLIENT // ANDROID_PWA</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <span>Android Mobile App &amp; Companion Suite</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Install directly on Android devices as a Progressive Web App (PWA) or build a native Android APK with Capacitor.
          </p>
        </div>

        <button
          onClick={onSwitchToAndroidFrame}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-tighter rounded bg-white hover:bg-slate-200 text-black shadow-sm transition"
        >
          <Smartphone className="w-4 h-4 text-black" />
          <span>Launch Pixel 8 Simulator</span>
        </button>
      </div>

      {/* Grid: PWA Install & Android Native APK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: PWA Instant Install */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isInstalled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-gray-300 border border-white/10'
                }`}
              >
                {isInstalled ? 'Installed as App' : 'Ready for Install'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white font-mono">Direct Android PWA Installation</h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Install CaddyDash onto your Android home screen or app drawer with full offline support, standalone fullscreen windowing, and app launcher integration.
            </p>

            <div className="space-y-2 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Zero download footprint — updates seamlessly in background</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>ServiceWorker caching with offline resilience</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Maskable adaptive Android icons compliant with Material You</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            {isInstalled ? (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>CaddyDash is currently running in standalone Android App mode!</span>
              </div>
            ) : isInstallable ? (
              <button
                id="pwa-install-main-btn"
                onClick={install}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-white hover:bg-slate-200 text-black font-bold uppercase tracking-tighter text-xs transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Install CaddyDash to Android</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-black border border-white/10 text-gray-400 text-xs font-mono">
                To install on your mobile device: tap your browser's <strong className="text-white">Menu (⋮)</strong> &gt; <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install App</strong>.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Remote Push Notifications */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Bell className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Push Alerts
              </span>
            </div>

            <h2 className="text-lg font-bold text-white font-mono">Mobile Security Push Alerts</h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Get notified immediately on your Android lock screen when Caddy detects high-severity cyber attacks, upstream 5xx outages, or TLS renewal warnings.
            </p>

            <div className="space-y-2 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Alert on DDoS rate limit spike or Coraza SQLi intercept</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Alert on upstream node failure or latency degradation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Auto-renewal certificate notifications</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={requestNotification}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-black border border-white/15 hover:border-purple-500/60 text-white font-bold uppercase tracking-wider text-xs transition"
            >
              <Bell className="w-4 h-4 text-purple-400" />
              <span>{notificationActive ? 'Trigger Test Alert' : 'Enable Mobile Push Alerts'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Native Android APK Build Guide (Capacitor / TWA) */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">NATIVE_WRAPPER // CAPACITOR</div>
            <h2 className="text-base font-bold text-white italic flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Build Native Standalone Android APK (.apk)</span>
            </h2>
            <p className="text-xs text-gray-400">
              Convert CaddyDash into a production signed APK or Google Play Android App Bundle using Capacitor.
            </p>
          </div>

          <button
            onClick={copyCapacitor}
            className="flex items-center gap-1 text-xs font-mono text-gray-300 px-3 py-1.5 rounded bg-black border border-white/10 hover:text-white uppercase tracking-wider"
          >
            {copiedCapacitor ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCapacitor ? 'Copied' : 'Copy config'}</span>
          </button>
        </div>

        {/* Step-by-step CLI commands */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <span className="text-cyan-400 font-bold block text-xs">Step 1: Install Capacitor</span>
            <p className="text-gray-300 select-all">npm install @capacitor/core @capacitor/cli @capacitor/android</p>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <span className="text-cyan-400 font-bold block text-xs">Step 2: Add Android Project</span>
            <p className="text-gray-300 select-all">npx cap init &amp;&amp; npx cap add android</p>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <span className="text-cyan-400 font-bold block text-xs">Step 3: Compile APK</span>
            <p className="text-gray-300 select-all">npm run build &amp;&amp; npx cap sync &amp;&amp; npx cap run android</p>
          </div>
        </div>

        {/* Capacitor config snippet */}
        <div className="rounded-xl bg-black border border-white/10 p-4 font-mono text-xs text-cyan-200/90 overflow-x-auto">
          <pre>{capacitorConfig}</pre>
        </div>
      </div>
    </div>
  );
};
