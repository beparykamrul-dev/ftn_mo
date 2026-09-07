/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Copy,
  Download,
  Check,
  RotateCw,
  AlertCircle,
  Sparkles,
  Layers,
  Code2
} from 'lucide-react';

interface CaddyfileEditorTabProps {
  initialCaddyfile: string;
  onReloadCaddy: () => void;
  isReloading: boolean;
}

export const CaddyfileEditorTab: React.FC<CaddyfileEditorTabProps> = ({
  initialCaddyfile,
  onReloadCaddy,
  isReloading
}) => {
  const [caddyfileContent, setCaddyfileContent] = useState(initialCaddyfile);
  const [copied, setCopied] = useState(false);
  const [syntaxValid, setSyntaxValid] = useState(true);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  // Synchronize when initial changes
  useEffect(() => {
    setCaddyfileContent(initialCaddyfile);
  }, [initialCaddyfile]);

  // Fast client-side syntax validator
  useEffect(() => {
    const lines = caddyfileContent.split('\n');
    let openBraces = 0;
    let error: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || !line) continue;

      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }

      if (openBraces < 0) {
        error = `Unmatched closing brace '}' at line ${i + 1}`;
        break;
      }
    }

    if (!error && openBraces !== 0) {
      error = `Unclosed block! Missing ${openBraces} closing brace(s) '}'`;
    }

    setSyntaxValid(!error);
    setSyntaxError(error);
  }, [caddyfileContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(caddyfileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([caddyfileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Caddyfile';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">CONFIG_ENGINE // DIRECTIVES</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <span>Caddyfile Engine &amp; Visual Configuration</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Edit, validate, and hot-reload production Caddyfiles via the Caddy Admin REST API (POST /load).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded bg-black border border-white/10 text-gray-300 hover:text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded bg-black border border-white/10 text-gray-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={onReloadCaddy}
            disabled={isReloading || !syntaxValid}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-tighter rounded bg-white hover:bg-slate-200 text-black shadow-sm transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>Apply &amp; Reload</span>
          </button>
        </div>
      </div>

      {/* Syntax Status Bar */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
          syntaxValid
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {syntaxValid ? (
            <Check className="w-4 h-4 text-cyan-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-bold">
            {syntaxValid ? 'Caddyfile Syntax Validated — Zero-Downtime Reload Ready' : syntaxError}
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-500">
          Format: Caddy v2.9 Native Adapter
        </span>
      </div>

      {/* Interactive Code Editor */}
      <div className="relative rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl">
        <div className="h-10 px-4 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">/etc/caddy/Caddyfile</span>
          </div>
          <span className="text-[11px] text-gray-500">UTF-8 • Unix (LF)</span>
        </div>

        <textarea
          value={caddyfileContent}
          onChange={(e) => setCaddyfileContent(e.target.value)}
          spellCheck={false}
          className="w-full h-[520px] p-5 bg-black text-cyan-200/90 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-none selection:bg-cyan-500/30 selection:text-white"
        />
      </div>
    </div>
  );
};
