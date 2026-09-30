// Tactical Betting & Wager Exchange for Frontline Sandbox

import React, { useState } from 'react';
import { TEAMS } from '../game/constants.js';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Trophy
} from 'lucide-react';
import { sounds } from '../utils/audio.js';

export function BettingModal({
  isOpen,
  onClose,
  engine,
  bankroll,
  onPlaceBet,
  activeBets
}) {
  const [selectedTeam, setSelectedTeam] = useState('red');
  const [betAmount, setBetAmount] = useState(100);

  if (!isOpen) return null;

  // Calculate live dynamic odds for all teams based on current battlefield standing
  const calculateOdds = () => {
    const oddsMap = {};
    if (!engine) return oddsMap;

    let totalScore = 0;
    const scores = {};

    Object.keys(TEAMS).forEach(k => {
      const state = engine.teamState[k];
      if (!state || !state.nexusAlive) {
        scores[k] = 0;
        return;
      }

      // Base HP weight
      const hpWeight = (state.nexusHp / state.maxNexusHp) * 40;

      // Unit strength weight
      const units = engine.units.filter(u => u.team === k);
      let armyWeight = 0;
      units.forEach(u => {
        armyWeight += (u.tier === 1 ? 5 : (u.tier === 2 ? 12 : 25));
      });

      // Upgrades weight
      let upWeight = 0;
      Object.values(state.upgrades || {}).forEach(lvl => {
        upWeight += lvl * 6;
      });

      // Captured points weight
      const cpCount = engine.controlPoints.filter(cp => cp.owner === k).length;
      const cpWeight = cpCount * 15;

      const score = Math.max(1, hpWeight + armyWeight + upWeight + cpWeight);
      scores[k] = score;
      totalScore += score;
    });

    Object.keys(TEAMS).forEach(k => {
      const state = engine.teamState[k];
      if (!state || !state.nexusAlive || scores[k] <= 0) {
        oddsMap[k] = null; // Eliminated or 0 odds
      } else {
        const prob = Math.max(0.05, Math.min(0.85, scores[k] / (totalScore || 1)));
        // Fair odds with slight house margin: 0.95 / prob
        const rawOdds = 0.92 / prob;
        oddsMap[k] = Math.max(1.15, Math.min(12.0, parseFloat(rawOdds.toFixed(2))));
      }
    });

    return oddsMap;
  };

  const dynamicOdds = calculateOdds();
  const currentTeamOdds = dynamicOdds[selectedTeam] || 2.0;
  const potentialPayout = Math.round(betAmount * currentTeamOdds);
  const canBet = betAmount > 0 && betAmount <= bankroll && dynamicOdds[selectedTeam] !== null;

  const handleConfirmBet = () => {
    if (!canBet) return;
    onPlaceBet({
      id: Math.random().toString(36).substr(2, 9),
      team: selectedTeam,
      amount: betAmount,
      odds: currentTeamOdds,
      potentialPayout,
      timestamp: Date.now(),
      status: 'active'
    });
    sounds.playDeploy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col font-tactical">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-slate-100 tracking-wider">
                TACTICAL BATTLEFIELD WAGERING
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Wager Commander Bankroll credits on match victory. Dynamic odds adjust with real-time army strength!
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

        {/* Bankroll Hero Bar */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs text-slate-400">COMMANDER BANKROLL:</span>
            <span className="text-lg font-bold text-amber-400">${bankroll}</span>
          </div>
          <div className="text-xs text-amber-300/80 font-sans flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Payouts delivered automatically when a team wins!</span>
          </div>
        </div>

        {/* Odds Grid */}
        <div className="p-5">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
            CHOOSE WINNING FACTION & LIVE ODDS:
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {Object.entries(TEAMS).map(([key, team]) => {
              const odds = dynamicOdds[key];
              const isSelected = selectedTeam === key;
              const isDead = odds === null;

              return (
                <button
                  key={key}
                  onClick={() => !isDead && setSelectedTeam(key)}
                  disabled={isDead}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition relative ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-md shadow-amber-500/20'
                      : isDead
                      ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                  style={isSelected ? { borderColor: team.hex } : {}}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase" style={{ color: team.hex }}>
                      {team.shortName}
                    </span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.hex }} />
                  </div>
                  <div className="font-mono">
                    <span className="text-[10px] text-slate-400 block">MULTIPLIER</span>
                    <span className="text-base font-bold text-slate-100">
                      {isDead ? 'ELIMINATED' : `${odds}x`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bet Slip Controls */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">BET AMOUNT ($):</span>
              <div className="flex items-center gap-1.5 font-mono">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    +${amt}
                  </button>
                ))}
                <button
                  onClick={() => setBetAmount(bankroll)}
                  className="px-2 py-0.5 rounded text-[11px] bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition font-bold"
                >
                  ALL-IN
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  min="1"
                  max={bankroll}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">EST. PAYOUT</span>
                  <span className="text-sm font-bold text-emerald-400">${potentialPayout}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">PROFIT</span>
                  <span className="text-xs text-emerald-300">+${potentialPayout - betAmount}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmBet}
                disabled={!canBet}
                className={`px-5 py-2.5 rounded-lg font-mono font-bold text-xs transition shrink-0 ${
                  canBet
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                PLACE WAGER
              </button>
            </div>
          </div>

          {/* Active Wagers Table */}
          {activeBets.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                YOUR ACTIVE WAGERS:
              </h4>
              <div className="space-y-1.5 max-h-28 overflow-y-auto font-mono text-xs">
                {activeBets.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-950/40 border border-slate-800 text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAMS[b.team].hex }} />
                      <span className="font-bold uppercase">{TEAMS[b.team].name}</span>
                    </div>
                    <div>STAKE: ${b.amount}</div>
                    <div>ODDS: {b.odds}x</div>
                    <div className="text-emerald-400 font-bold">PAYS: ${b.potentialPayout}</div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>You can bet on any team, even while commanding one or running hands-off simulations.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-tactical font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
