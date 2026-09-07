/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CyberThreatEvent } from '../types';
import { Shield, Crosshair, AlertTriangle, Globe, MapPin, Eye } from 'lucide-react';

interface ThreatWorldMapProps {
  threatEvents: CyberThreatEvent[];
  onBlockIp?: (ip: string) => void;
}

export const ThreatWorldMap: React.FC<ThreatWorldMapProps> = ({
  threatEvents,
  onBlockIp
}) => {
  const [selectedThreat, setSelectedThreat] = useState<CyberThreatEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Map dimensions
  const mapWidth = 800;
  const mapHeight = 400;

  // Coordinate projection from (lat, lng) to (x, y) on 800x400 SVG
  const project = (lat: number, lng: number) => {
    // Clamping
    const clampedLat = Math.max(-80, Math.min(84, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));
    const x = ((clampedLng + 180) / 360) * mapWidth;
    const y = ((90 - clampedLat) / 180) * mapHeight;
    return { x, y };
  };

  // Protected Caddy Edge Hub (e.g. Frankfurt / Central Cloud Gateway: 50.11, 8.68)
  const edgeHub = project(50.11, 8.68);

  const filteredThreats = threatEvents.filter((t) => {
    if (filterSeverity === 'all') return true;
    return t.severity === filterSeverity;
  });

  return (
    <div className="relative rounded-2xl bg-[#070707] border border-white/10 p-5 space-y-4 overflow-hidden shadow-2xl">
      {/* Background ambient radar glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-mono font-bold">
              GLOBAL THREAT INTERCEPTOR // REAL-TIME GEOMAP
            </span>
          </div>
          <h3 className="text-base font-bold text-white italic flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Active Attack Origin Coordinates</span>
          </h3>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider transition ${
              filterSeverity === 'all'
                ? 'bg-white text-black font-bold'
                : 'bg-black text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            All ({threatEvents.length})
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider transition ${
              filterSeverity === 'critical'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-black text-rose-400/80 border border-rose-500/20 hover:border-rose-500/40'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterSeverity('high')}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider transition ${
              filterSeverity === 'high'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-black text-amber-400/80 border border-amber-500/20 hover:border-amber-500/40'
            }`}
          >
            High
          </button>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[280px] sm:min-h-[340px] bg-black/90 rounded-xl border border-white/10 overflow-hidden select-none">
        {/* Radar concentric sweep overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/10 via-transparent to-transparent pointer-events-none" />

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>
            {/* Trajectory gradient */}
            <linearGradient id="attackBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={mapWidth} height={mapHeight} fill="url(#grid-pattern)" />

          {/* Equator & Tropic Latitude Guide Lines */}
          <line x1="0" y1="200" x2={mapWidth} y2="200" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
          <line x1="0" y1="120" x2={mapWidth} y2="120" stroke="rgba(255,255,255,0.03)" strokeDasharray="2,4" />
          <line x1="0" y1="280" x2={mapWidth} y2="280" stroke="rgba(255,255,255,0.03)" strokeDasharray="2,4" />

          {/* World Landmass Silhouettes (Simplified Stylized Continents) */}
          <g fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8">
            {/* North America */}
            <path d="M 80 50 Q 140 40 220 50 Q 250 80 230 140 Q 210 180 180 180 Q 150 160 120 180 Q 80 140 70 90 Z" />
            <path d="M 120 180 Q 150 200 160 230 Q 140 240 130 220 Z" /> {/* Central America */}
            {/* South America */}
            <path d="M 170 230 Q 250 240 270 300 Q 250 380 210 390 Q 180 340 170 270 Z" />
            {/* Greenland */}
            <path d="M 270 30 Q 320 25 340 50 Q 310 70 270 60 Z" />
            {/* Europe */}
            <path d="M 370 70 Q 440 60 460 100 Q 430 140 380 130 Q 360 100 370 70 Z" />
            <path d="M 350 80 Q 370 70 365 110 Q 345 100 350 80 Z" /> {/* UK */}
            {/* Africa */}
            <path d="M 370 140 Q 460 140 480 210 Q 460 310 410 340 Q 360 270 350 200 Q 360 160 370 140 Z" />
            {/* Asia */}
            <path d="M 460 60 Q 640 40 700 90 Q 720 170 650 190 Q 580 220 540 170 Q 480 160 460 110 Z" />
            <path d="M 520 170 Q 560 180 550 240 Q 520 230 520 170 Z" /> {/* India */}
            <path d="M 680 110 Q 710 110 700 160 Q 670 140 680 110 Z" /> {/* Japan */}
            {/* Australia */}
            <path d="M 630 260 Q 720 250 730 320 Q 680 360 630 330 Z" />
          </g>

          {/* Attack Trajectory Lines (from Threat Coordinate to Protected Edge Hub) */}
          {filteredThreats.map((threat) => {
            const lat = threat.lat ?? 30;
            const lng = threat.lng ?? 0;
            const pt = project(lat, lng);
            const isSelected = selectedThreat?.id === threat.id;

            return (
              <g key={`traj-${threat.id}`}>
                {/* Curved connecting line */}
                <path
                  d={`M ${pt.x} ${pt.y} Q ${(pt.x + edgeHub.x) / 2} ${(pt.y + edgeHub.y) / 2 - 40} ${edgeHub.x} ${edgeHub.y}`}
                  fill="none"
                  stroke={threat.severity === 'critical' ? 'url(#attackBeam)' : 'rgba(244, 63, 94, 0.25)'}
                  strokeWidth={isSelected ? 1.8 : 0.8}
                  strokeDasharray={isSelected ? 'none' : '3,3'}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* Protected Caddy Edge Hub Marker */}
          <g transform={`translate(${edgeHub.x}, ${edgeHub.y})`}>
            <circle r="18" fill="url(#hubGlow)" className="animate-pulse" />
            <circle r="6" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
            <circle r="2" fill="#000000" />
            <text
              y="-12"
              textAnchor="middle"
              className="text-[9px] font-mono font-bold fill-cyan-300 uppercase tracking-widest"
            >
              CADDY PROXY CORE
            </text>
          </g>

          {/* Plotted Threat Nodes */}
          {filteredThreats.map((threat) => {
            const lat = threat.lat ?? 30;
            const lng = threat.lng ?? 0;
            const pt = project(lat, lng);
            const isSelected = selectedThreat?.id === threat.id;

            const color =
              threat.severity === 'critical'
                ? '#f43f5e'
                : threat.severity === 'high'
                ? '#f59e0b'
                : '#06b6d4';

            return (
              <g
                key={`point-${threat.id}`}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={() => setSelectedThreat(threat)}
              >
                {/* Pulsing ring */}
                <circle
                  r="9"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.6"
                  className="animate-ping origin-center"
                />

                {/* Target node dot */}
                <circle
                  r={isSelected ? 5.5 : 3.5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  className="transition-transform group-hover:scale-125"
                />

                {/* Hover label */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x="-40"
                    y="-24"
                    width="80"
                    height="16"
                    rx="3"
                    fill="#0A0A0A"
                    stroke={color}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="-13"
                    textAnchor="middle"
                    className="text-[8px] font-mono fill-white font-bold"
                  >
                    {threat.sourceIp}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Threat Floating Inspector Modal */}
        {selectedThreat && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3.5 rounded-xl bg-[#0A0A0A]/95 border border-white/20 backdrop-blur-md shadow-2xl space-y-2 z-30 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedThreat.severity === 'critical'
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="font-bold text-white uppercase">{selectedThreat.type.toUpperCase()} VECTOR</span>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-gray-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-white/10">
              <div>
                <span className="text-gray-500 block">ORIGIN IP</span>
                <span className="text-cyan-300 font-bold">{selectedThreat.sourceIp}</span>
              </div>
              <div>
                <span className="text-gray-500 block">COUNTRY</span>
                <span className="text-gray-200">{selectedThreat.country} ({selectedThreat.countryCode})</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">TARGET URL</span>
                <span className="text-gray-300 truncate block">{selectedThreat.targetPath}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">DEFENSE RULE</span>
                <span className="text-rose-400 text-[10px] truncate block">{selectedThreat.ruleTriggered}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-bold">
                STATUS: {selectedThreat.action.toUpperCase()}
              </span>
              {onBlockIp && (
                <button
                  onClick={() => onBlockIp(selectedThreat.sourceIp)}
                  className="px-2.5 py-1 rounded bg-white text-black font-bold uppercase tracking-wider hover:bg-slate-200"
                >
                  Block IP Permanently
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Vector Feed in Bottom Right */}
        <div className="absolute top-3 right-3 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-[10px] font-mono text-gray-400 backdrop-blur-sm pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-rose-400 animate-spin" />
          <span>LIVE VECTORS INTERCEPTED: <strong className="text-white">{filteredThreats.length}</strong></span>
        </div>
      </div>
    </div>
  );
};
