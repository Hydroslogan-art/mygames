// Top Command Navigation Bar for Frontline Sandbox

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Volume2, 
  VolumeX, 
  DollarSign, 
  ShoppingBag, 
  Radio, 
  MapPin, 
  Zap,
  FastForward,
  Activity
} from 'lucide-react';
import { MAPS } from '../game/mapData.js';
import { sounds } from '../utils/audio.js';

export function TopBar({
  isPaused,
  onTogglePause,
  simSpeed,
  onChangeSpeed,
  onResetSkirmish,
  onClearSandbox,
  activeMapId,
  onChangeMap,
  bankroll,
  onOpenBetting,
  onOpenShop,
  onOpenIntel,
  isMuted,
  onToggleMute,
  simTime
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/40">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-heading tracking-wider text-slate-100 uppercase">
              FRONTLINE <span className="text-red-500">SANDBOX</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
              CoH × Bedwars
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span>TIME: <span className="text-slate-200">{formatTime(simTime)}</span></span>
          </div>
        </div>
      </div>

      {/* Map Selector */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-400" />
        <select
          value={activeMapId}
          onChange={(e) => onChangeMap(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs font-tactical text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
        >
          {MAPS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Simulation Controls (Play, Pause, Speed, Clear, Reset) */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={onTogglePause}
          title={isPaused ? "Resume Simulation" : "Pause Simulation"}
          className={`p-1.5 rounded transition ${
            isPaused
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Speed Toggles */}
        {[0.5, 1.0, 2.0, 3.0].map((spd) => (
          <button
            key={spd}
            onClick={() => onChangeSpeed(spd)}
            className={`px-2 py-0.5 text-xs font-mono rounded transition ${
              simSpeed === spd
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {spd}x
          </button>
        ))}

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Reset Skirmish */}
        <button
          onClick={onResetSkirmish}
          title="Reset to Default Skirmish"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-tactical text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Skirmish</span>
        </button>

        {/* Clear Sandbox */}
        <button
          onClick={onClearSandbox}
          title="Clear all units and projectiles from battlefield"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-tactical text-slate-300 hover:text-red-400 hover:bg-red-950/40 rounded transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Clear</span>
        </button>
      </div>

      {/* Commander Hub: Bankroll, Betting, Shop, Intel, Sound */}
      <div className="flex items-center gap-2.5">
        {/* Bankroll */}
        <button
          onClick={onOpenBetting}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-lg text-amber-300 transition group"
        >
          <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          <div className="text-left font-mono">
            <span className="text-[10px] text-amber-400/80 block leading-none">BANKROLL</span>
            <span className="text-xs font-bold leading-none">${bankroll}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 ml-1">
            Wager
          </span>
        </button>

        {/* Armory Shop */}
        <button
          onClick={onOpenShop}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg text-slate-200 transition text-xs font-tactical"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Shop & Upgrades</span>
        </button>

        {/* Intel Drawer */}
        <button
          onClick={onOpenIntel}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg text-slate-200 transition text-xs font-tactical"
          title="Battle Intel & Minimap"
        >
          <Activity className="w-4 h-4 text-sky-400" />
          <span>Intel</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? "Unmute Tactical SFX" : "Mute SFX"}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
}
