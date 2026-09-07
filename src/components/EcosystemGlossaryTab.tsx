/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Sparkles,
  Shield,
  Layers,
  Terminal
} from 'lucide-react';
import { ECOSYSTEM_GLOSSARY } from '../data/ecosystemData';
import { EcosystemGlossaryItem } from '../types';

export const EcosystemGlossaryTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Directives', 'Cyber Security', 'ACME & TLS', 'Core Concepts', 'Architectures'];

  const filteredItems = ECOSYSTEM_GLOSSARY.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caddyfileExample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-mono">KNOWLEDGE_BASE // ECOSYSTEM_SPEC</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Caddy &amp; Cyber Ecosystem Glossary</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Interactive encyclopedia of Caddy directives, architecture blueprints, OWASP rules, and modern edge patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search directives, syntax, or recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs font-mono rounded bg-black border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded text-xs whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-white text-black font-bold uppercase tracking-tighter shadow-sm'
                : 'bg-black text-gray-400 border border-white/5 hover:text-white font-mono uppercase tracking-wider'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">{item.title}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black text-cyan-400 border border-white/10 uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">{item.category}</span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{item.summary}</p>

              {/* Code Snippet Box */}
              <div className="relative rounded-xl bg-black border border-white/10 p-3.5 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 font-mono">
                  <span className="text-cyan-400 font-bold">Caddyfile Blueprint</span>
                  <button
                    onClick={() => handleCopy(item.id, item.caddyfileExample)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-black border border-white/10 uppercase tracking-wider"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-cyan-200/90 overflow-x-auto p-1 leading-normal">
                  {item.caddyfileExample}
                </pre>
              </div>

              {/* Pro Tip */}
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300 font-mono flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Pro-Tip:</strong> {item.proTip}
                </span>
              </div>
            </div>

            {/* Official Doc link */}
            {item.officialDocUrl && (
              <div className="pt-3 border-t border-white/5 flex items-center justify-end font-mono">
                <a
                  href={item.officialDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  Official Documentation <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
