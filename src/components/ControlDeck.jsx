// Bottom Tactical Control Deck for Unit Deployment, Faction Selection & Powers

import React, { useState } from 'react';
import { 
  TEAMS, 
  UNIT_TYPES, 
  UNIT_TIERS, 
  COMMANDER_POWERS 
} from '../game/constants.js';
import { 
  Users, 
  ShieldAlert, 
  Truck, 
  Crosshair, 
  HeartPulse, 
  Target, 
  Zap, 
  Shield, 
  Award, 
  UserCheck,
  Bomb,
  Activity,
  Flame,
  Navigation,
  Layers,
  Sparkles
} from 'lucide-react';

const ICON_MAP = {
  UserCheck,
  Zap,
  Crosshair,
  ShieldAlert,
  Target,
  HeartPulse,
  Truck,
  Shield,
  Award,
  Bomb,
  Navigation,
  Activity,
  Flame
};

export function ControlDeck({
  engine,
  selectedTeam,
  onSelectTeam,
  selectedUnitType,
  onSelectUnitType,
  selectedPower,
  onSelectPower,
  sandboxMode,
  onToggleSandboxMode
}) {
  const [activeTierTab, setActiveTierTab] = useState(1);
  const activeTeamDef = TEAMS[selectedTeam];
  const teamState = engine?.teamState?.[selectedTeam] || { credits: 0, nexusHp: 0, maxNexusHp: 1800, nexusAlive: true };
  const teamUnitCount = engine?.units?.filter(u => u.team === selectedTeam).length || 0;

  // Filter units by tier
  const currentTierUnits = Object.values(UNIT_TYPES).filter(u => u.tier === activeTierTab);

  return (
    <footer className="h-44 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl flex flex-col z-30 select-none">
      {/* Top Strip: Team Selection, Economy readout & Sandbox Mode toggle */}
      <div className="h-11 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        {/* 4 Team Selectors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">FACTION:</span>
          {Object.entries(TEAMS).map(([key, team]) => {
            const st = engine?.teamState?.[key];
            const isAlive = st?.nexusAlive ?? true;
            const isSelected = selectedTeam === key;

            return (
              <button
                key={key}
                onClick={() => onSelectTeam(key)}
                className={`relative px-3 py-1 rounded text-xs font-tactical font-bold uppercase transition flex items-center gap-2 border ${
                  isSelected
                    ? `${team.borderCol} bg-slate-800 text-white shadow-lg`
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                style={isSelected ? { borderColor: team.hex, boxShadow: `0 0 12px ${team.glowHex}` } : {}}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: team.hex }}
                />
                <span>{team.shortName}</span>

                {/* Status indicator */}
                <span className={`text-[10px] font-mono px-1 rounded ${isAlive ? 'bg-slate-900 text-slate-400' : 'bg-red-950 text-red-400'}`}>
                  {isAlive ? `$${Math.floor(st?.credits || 0)}` : 'NEXUS DEAD'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Team HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">NEXUS:</span>
            <span className={`font-bold ${teamState.nexusAlive ? 'text-emerald-400' : 'text-red-500'}`}>
              {teamState.nexusAlive ? `${Math.round(teamState.nexusHp)}/${teamState.maxNexusHp} HP` : 'DESTROYED'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">UNITS:</span>
            <span className="text-sky-400 font-bold">{teamUnitCount}</span>
          </div>

          {/* Sandbox Free Spawn Toggle */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <button
              onClick={onToggleSandboxMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tactical font-semibold border transition ${
                sandboxMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{sandboxMode ? 'SANDBOX: UNLIMITED' : 'WAR ECONOMY'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bottom Deck: Tiers, Units Catalog, and Commander Powers */}
      <div className="flex-1 px-4 py-2 flex items-center justify-between gap-4 overflow-hidden">
        {/* Tier Tabs (Vertical or Horizontal) */}
        <div className="flex flex-col gap-1 w-36 shrink-0">
          {[1, 2, 3].map((tierNum) => {
            const tierDef = UNIT_TIERS[`TIER_${tierNum}`];
            const isActive = activeTierTab === tierNum;
            return (
              <button
                key={tierNum}
                onClick={() => setActiveTierTab(tierNum)}
                className={`w-full py-1.5 px-2 rounded text-left text-xs font-tactical font-bold transition border ${
                  isActive
                    ? 'bg-slate-800 text-white border-blue-500/60 shadow-md'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider">{tierDef.label}</div>
              </button>
            );
          })}
        </div>

        {/* Units Cards in Active Tier */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
          {currentTierUnits.map((unit) => {
            const Icon = ICON_MAP[unit.iconName] || Users;
            const isSelected = selectedUnitType === unit.id && !selectedPower;
            const canAfford = sandboxMode || teamState.credits >= unit.cost;

            return (
              <button
                key={unit.id}
                onClick={() => {
                  onSelectUnitType(unit.id);
                  if (onSelectPower) onSelectPower(null);
                }}
                disabled={!canAfford && !sandboxMode}
                className={`relative flex-1 min-w-[150px] max-w-[190px] h-[95px] p-2.5 rounded-lg border text-left flex flex-col justify-between transition group ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-400 ring-1 ring-blue-400/50 shadow-lg shadow-blue-950/60'
                    : canAfford
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
                    : 'bg-slate-950/50 border-slate-900 opacity-45 cursor-not-allowed'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded bg-slate-800/80 text-blue-400 group-hover:scale-105 transition">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-tactical font-bold text-xs text-slate-100 truncate">
                      {unit.name}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                    ${unit.cost}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 font-tactical line-clamp-2 leading-tight">
                  {unit.role}
                </p>

                {/* Stat pills */}
                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-300">
                  <span>HP: {unit.hp}</span>
                  <span>•</span>
                  <span>DMG: {unit.damage}</span>
                  {unit.armor > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-sky-400">ARM: {unit.armor}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-[1px] h-20 bg-slate-800/80" />

        {/* Commander Powers Bar */}
        <div className="flex flex-col gap-1 w-64 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>COMMANDER POWERS</span>
            <span className="text-amber-400">TACTICAL AIR & ORBITAL</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {COMMANDER_POWERS.map((pow) => {
              const Icon = ICON_MAP[pow.icon] || Bomb;
              const isSelected = selectedPower === pow.id;

              return (
                <button
                  key={pow.id}
                  onClick={() => {
                    if (isSelected) {
                      onSelectPower(null);
                    } else {
                      onSelectPower(pow.id);
                    }
                  }}
                  title={`${pow.name}: ${pow.description}`}
                  className={`relative p-2 rounded-lg border flex flex-col items-center justify-center transition group h-[74px] ${
                    isSelected
                      ? 'bg-amber-950/60 border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                  style={isSelected ? { borderColor: pow.color } : {}}
                >
                  <Icon
                    className="w-5 h-5 mb-1 group-hover:scale-110 transition"
                    style={{ color: pow.color }}
                  />
                  <span className="text-[9px] font-tactical font-bold text-slate-200 text-center leading-tight truncate w-full">
                    {pow.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-mono text-amber-400">
                    ${pow.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
