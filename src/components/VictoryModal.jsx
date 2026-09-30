// Match Conclusion & Wager Settlement Modal for Frontline Sandbox

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TEAMS } from '../game/constants.js';
import { Trophy, DollarSign, RotateCcw, X, Award, CheckCircle } from 'lucide-react';
import { sounds } from '../utils/audio.js';

export function VictoryModal({
  winnerTeamKey,
  onClose,
  onRestart,
  activeBets,
  onSettleBets
}) {
  const winner = TEAMS[winnerTeamKey];

  useEffect(() => {
    if (winnerTeamKey) {
      sounds.playWinPayout();

      // Launch victory fireworks / confetti
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      // Settle bets
      if (onSettleBets) {
        onSettleBets(winnerTeamKey);
      }
    }
  }, [winnerTeamKey]);

  if (!winnerTeamKey || !winner) return null;

  // Calculate winnings
  const winningBets = activeBets.filter(b => b.team === winnerTeamKey && b.status === 'active');
  const totalWon = winningBets.reduce((acc, b) => acc + b.potentialPayout, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden text-center font-tactical"
        style={{ borderColor: winner.hex, boxShadow: `0 0 40px ${winner.glowHex}` }}>
        {/* Banner */}
        <div className="py-6 px-4 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-xl"
            style={{ backgroundColor: `${winner.hex}22`, border: `2px solid ${winner.hex}` }}>
            <Trophy className="w-8 h-8" style={{ color: winner.hex }} />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            WARFRONT DECISIVE VICTORY
          </span>
          <h2 className="text-3xl font-black font-heading tracking-wide uppercase mt-1" style={{ color: winner.hex }}>
            {winner.name} TRIUMPHS!
          </h2>
          <p className="text-xs text-slate-300 font-sans max-w-md mt-2">
            Enemy Nexuses obliterated and remaining hostile forces neutralized. Tactical dominance secured across all sectors.
          </p>
        </div>

        {/* Betting Results Section */}
        <div className="p-6 space-y-4">
          {totalWon > 0 ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/50 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-300 uppercase tracking-wide">
                    WAGER PAYOUT SECURED!
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Your tactical prediction on {winner.name} proved victorious!
                  </p>
                </div>
              </div>
              <div className="font-mono text-xl font-bold text-emerald-400">
                +${totalWon}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-400 font-mono">
              No active wagers placed on the winning faction. Better luck next engagement!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/40 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>START NEW BATTLE</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
            >
              INSPECT BATTLEFIELD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
