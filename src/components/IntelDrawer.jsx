// Tactical Intel Drawer with Radar Minimap & Combat Feed for Frontline Sandbox

import React, { useRef, useEffect } from 'react';
import { TEAMS } from '../game/constants.js';
import { X, Activity, Shield, Crosshair, Skull, Flag } from 'lucide-react';

export function IntelDrawer({
  isOpen,
  onClose,
  engine,
  eventLog
}) {
  const minimapRef = useRef(null);

  // Render Minimap
  useEffect(() => {
    if (!isOpen || !engine || !minimapRef.current) return;

    const canvas = minimapRef.current;
    const ctx = canvas.getContext('2d');
    const map = engine.map;

    let animId;
    const drawMinimap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / map.width;
      const scaleY = canvas.height / map.height;

      // Obstacles
      ctx.fillStyle = '#334155';
      map.obstacles.forEach(obs => {
        ctx.fillRect(obs.x * scaleX, obs.y * scaleY, obs.w * scaleX, obs.h * scaleY);
      });

      // Control points
      engine.controlPoints.forEach(cp => {
        ctx.fillStyle = cp.owner !== 'neutral' ? TEAMS[cp.owner].hex : '#94a3b8';
        ctx.beginPath();
        ctx.arc(cp.x * scaleX, cp.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bases
      Object.keys(map.bases).forEach(k => {
        const b = map.bases[k];
        const st = engine.teamState[k];
        ctx.fillStyle = st?.nexusAlive ? TEAMS[k].hex : '#475569';
        ctx.beginPath();
        ctx.arc(b.x * scaleX, b.y * scaleY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Units blips
      engine.units.forEach(u => {
        ctx.fillStyle = TEAMS[u.team].hex;
        ctx.beginPath();
        ctx.arc(u.x * scaleX, u.y * scaleY, u.isVehicle ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(drawMinimap);
    };

    drawMinimap();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, engine]);

  if (!isOpen) return null;

  // Calculate territory control percentage
  const totalCps = engine?.controlPoints?.length || 1;
  const territoryStats = {};
  Object.keys(TEAMS).forEach(k => {
    const owned = engine?.controlPoints?.filter(cp => cp.owner === k).length || 0;
    territoryStats[k] = Math.round((owned / totalCps) * 100);
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col font-tactical backdrop-blur-xl select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold font-heading text-slate-100 tracking-wider uppercase">
            BATTLEFIELD INTEL & RADAR
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Radar Minimap */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>TACTICAL RADAR</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              LIVE
            </span>
          </div>
          <div className="relative rounded overflow-hidden border border-slate-700/60">
            <canvas
              ref={minimapRef}
              width={280}
              height={180}
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* Territory Control */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-amber-400" />
            <span>TERRITORY DOMINANCE</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {Object.entries(TEAMS).map(([key, team]) => (
              <div
                key={key}
                style={{ width: `${territoryStats[key]}%`, backgroundColor: team.hex }}
                className="h-full transition-all duration-300"
                title={`${team.name}: ${territoryStats[key]}%`}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-2 text-center text-[10px] font-mono">
            {Object.entries(TEAMS).map(([key, team]) => (
              <div key={key}>
                <span className="font-bold" style={{ color: team.hex }}>{team.shortName}</span>
                <span className="text-slate-400 block">{territoryStats[key]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Factions Standings */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>FACTION CASUALTIES & KILLS</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {Object.entries(TEAMS).map(([key, team]) => {
              const st = engine?.teamState?.[key] || {};
              const aliveCount = engine?.units?.filter(u => u.team === key).length || 0;

              return (
                <div
                  key={key}
                  className="p-2 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.hex }} />
                    <span className="font-bold uppercase" style={{ color: team.hex }}>
                      {team.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                    <span title="Active Units">UNITS: {aliveCount}</span>
                    <span title="Kills" className="text-emerald-400">K: {st.kills || 0}</span>
                    <span title="Casualties" className="text-red-400">D: {st.casualties || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Event Feed */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-red-400" />
            <span>COMMAND LOG</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs font-mono">
            {eventLog && eventLog.length > 0 ? (
              eventLog.slice(0, 15).map((log, idx) => (
                <div
                  key={idx}
                  className="text-[11px] py-1 border-b border-slate-800/60 leading-tight text-slate-300"
                >
                  <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs italic">No tactical alerts yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
