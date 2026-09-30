// Armory & Tech Upgrades Modal for Frontline Sandbox

import React, { useState } from 'react';
import { TEAMS, UPGRADES } from '../game/constants.js';
import { 
  X, 
  ShoppingBag, 
  Swords, 
  Shield, 
  TrendingUp, 
  Radio, 
  FastForward, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const UPGRADE_ICONS = {
  Swords,
  Shield,
  TrendingUp,
  Radio,
  FastForward
};

export function ShopModal({
  isOpen,
  onClose,
  engine,
  selectedTeam,
  onSelectTeam
}) {
  const [activeTeamTab, setActiveTeamTab] = useState(selectedTeam);

  if (!isOpen) return null;

  const teamState = engine?.teamState?.[activeTeamTab] || { credits: 0, upgrades: {} };
  const teamDef = TEAMS[activeTeamTab];

  const handlePurchase = (upgradeId) => {
    if (engine) {
      engine.purchaseUpgrade(activeTeamTab, upgradeId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col font-tactical">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-slate-100 tracking-wider">
                TACTICAL TECH & UPGRADE ARMORY
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Research military upgrades to enhance squad combat efficiency and base survivability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faction Selector in Shop */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">UPGRADE FACTION:</span>
            {Object.entries(TEAMS).map(([key, team]) => {
              const isSelected = activeTeamTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTeamTab(key)}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-slate-800 text-white border-blue-500'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                  style={isSelected ? { borderColor: team.hex } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.hex }} />
                  <span>{team.shortName}</span>
                </button>
              );
            })}
          </div>

          <div className="font-mono text-xs text-amber-400 font-bold bg-amber-950/40 px-3 py-1 rounded border border-amber-600/30">
            TREASURY: ${Math.floor(teamState.credits)}
          </div>
        </div>

        {/* Upgrades List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {UPGRADES.map((up) => {
            const Icon = UPGRADE_ICONS[up.icon] || Sparkles;
            const currentLevel = teamState.upgrades?.[up.id] || 0;
            const isMax = currentLevel >= up.maxLevel;
            const cost = Math.round(up.baseCost * Math.pow(up.costMultiplier, currentLevel));
            const canAfford = teamState.credits >= cost && !isMax;

            return (
              <div
                key={up.id}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition flex items-center justify-between gap-4"
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-blue-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{up.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                        {up.statLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {up.description}
                    </p>
                  </div>
                </div>

                {/* Level Indicator & Buy Button */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Pip Levels */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold ${
                          lvl <= currentLevel
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {lvl}
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handlePurchase(up.id)}
                    disabled={!canAfford || isMax}
                    className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 ${
                      isMax
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>MAXED</span>
                      </>
                    ) : (
                      <>
                        <span>UPGRADE</span>
                        <span>(${cost})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Upgrades apply instantly to all active and newly deployed squads.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-tactical font-bold transition"
          >
            Close Armory
          </button>
        </div>
      </div>
    </div>
  );
}
