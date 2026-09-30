// Frontline Sandbox - Main Application Root
// Tactical 2D Squad & Bedwars-Style Nexus Battle Simulator

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BattleEngine } from './game/engine.js';
import { TEAMS } from './game/constants.js';
import { TacticalCanvas } from './components/TacticalCanvas.jsx';
import { TopBar } from './components/TopBar.jsx';
import { ControlDeck } from './components/ControlDeck.jsx';
import { ShopModal } from './components/ShopModal.jsx';
import { BettingModal } from './components/BettingModal.jsx';
import { IntelDrawer } from './components/IntelDrawer.jsx';
import { VictoryModal } from './components/VictoryModal.jsx';
import { sounds } from './utils/audio.js';

export default function App() {
  // Application & Simulation State
  const [activeMapId, setActiveMapId] = useState('crossfire_ruins');
  const [engine, setEngine] = useState(null);
  const [simTime, setSimTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [sandboxMode, setSandboxMode] = useState(false); // War Economy vs Free Sandbox

  // Faction & Deployment Selection
  const [selectedTeam, setSelectedTeam] = useState('red');
  const [selectedUnitType, setSelectedUnitType] = useState('rifleman');
  const [selectedPower, setSelectedPower] = useState(null);

  // Modals & Panels
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isBettingOpen, setIsBettingOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);

  // Wagering & Bankroll System
  const [bankroll, setBankroll] = useState(1000);
  const [activeBets, setActiveBets] = useState([]);
  const [eventLog, setEventLog] = useState([
    { time: '00:00', message: 'Frontline Sandbox deployed. All 4 factions initialized.' },
    { time: '00:01', message: 'Crimson Legion and Cobalt Vanguard engaged in active skirmish!' }
  ]);

  const simTimeRef = useRef(0);

  // Event dispatcher from engine - STABLE, does NOT recreate on state changes
  const handleEngineEvent = useCallback((event) => {
    const sTime = simTimeRef.current;
    const timeFormatted = `${Math.floor(sTime / 60).toString().padStart(2, '0')}:${Math.floor(sTime % 60).toString().padStart(2, '0')}`;

    if (event.type === 'MATCH_VICTORY') {
      setWinnerTeam(event.winner);
      setEventLog((prev) => [{ time: timeFormatted, message: event.message }, ...prev.slice(0, 30)]);
    } else if (event.type === 'NEXUS_DESTROYED') {
      setEventLog((prev) => [{ time: timeFormatted, message: event.message }, ...prev.slice(0, 30)]);
    } else if (event.type === 'TEAM_ELIMINATED') {
      setEventLog((prev) => [{ time: timeFormatted, message: event.message }, ...prev.slice(0, 30)]);
    }
  }, []);

  // Initialize engine once on component mount - NEVER recreated in a loop!
  useEffect(() => {
    const eng = new BattleEngine('crossfire_ruins', handleEngineEvent);
    setEngine(eng);
  }, [handleEngineEvent]);

  // Periodic HUD state sync (every 200ms)
  useEffect(() => {
    if (!engine) return;
    const interval = setInterval(() => {
      simTimeRef.current = engine.simTime;
      setSimTime(engine.simTime);
      if (engine.winner && !winnerTeam) {
        setWinnerTeam(engine.winner);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [engine, winnerTeam]);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'KeyB') {
        setIsBettingOpen((prev) => !prev);
      } else if (e.code === 'KeyS') {
        setIsShopOpen((prev) => !prev);
      } else if (e.code === 'KeyI') {
        setIsIntelOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        setSelectedPower(null);
        setIsShopOpen(false);
        setIsBettingOpen(false);
        setIsIntelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  // Control Actions
  const handleTogglePause = () => {
    if (!engine) return;
    engine.isPaused = !engine.isPaused;
    setIsPaused(engine.isPaused);
  };

  const handleChangeSpeed = (spd) => {
    if (!engine) return;
    engine.simSpeed = spd;
    setSimSpeed(spd);
  };

  const handleResetSkirmish = () => {
    if (!engine) return;
    engine.populateInitialSkirmish();
    setWinnerTeam(null);
    sounds.playDeploy();
  };

  const handleClearSandbox = () => {
    if (!engine) return;
    engine.units = [];
    engine.projectiles = [];
    engine.particles = [];
    engine.floatingTexts = [];
    engine.activePowers = [];
    engine.selectedUnitIds.clear();
    setWinnerTeam(null);
  };

  const handleChangeMap = (mapId) => {
    if (!engine) return;
    setActiveMapId(mapId);
    engine.changeMap(mapId);
    setWinnerTeam(null);
    sounds.playDeploy();
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Betting Actions
  const handlePlaceBet = (bet) => {
    if (bankroll < bet.amount) return;
    setBankroll((prev) => prev - bet.amount);
    setActiveBets((prev) => [bet, ...prev]);
    setIsBettingOpen(false);
  };

  const handleSettleBets = (winningTeamKey) => {
    let payoutTotal = 0;
    const updated = activeBets.map((b) => {
      if (b.status === 'active') {
        if (b.team === winningTeamKey) {
          payoutTotal += b.potentialPayout;
          return { ...b, status: 'won' };
        } else {
          return { ...b, status: 'lost' };
        }
      }
      return b;
    });

    if (payoutTotal > 0) {
      setBankroll((prev) => prev + payoutTotal);
    }
    setActiveBets(updated);
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Tactical Command Bar */}
      <TopBar
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        simSpeed={simSpeed}
        onChangeSpeed={handleChangeSpeed}
        onResetSkirmish={handleResetSkirmish}
        onClearSandbox={handleClearSandbox}
        activeMapId={activeMapId}
        onChangeMap={handleChangeMap}
        bankroll={bankroll}
        onOpenBetting={() => setIsBettingOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenIntel={() => setIsIntelOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        simTime={simTime}
      />

      {/* Main Interactive Battlefield Canvas */}
      <main className="flex-1 relative overflow-hidden">
        {engine && (
          <TacticalCanvas
            engine={engine}
            selectedTeam={selectedTeam}
            selectedUnitType={selectedUnitType}
            selectedPower={selectedPower}
            onClearPower={() => setSelectedPower(null)}
            sandboxMode={sandboxMode}
            activeMapId={activeMapId}
          />
        )}
      </main>

      {/* Bottom Control Deck */}
      <ControlDeck
        engine={engine}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
        selectedUnitType={selectedUnitType}
        onSelectUnitType={setSelectedUnitType}
        selectedPower={selectedPower}
        onSelectPower={setSelectedPower}
        sandboxMode={sandboxMode}
        onToggleSandboxMode={() => setSandboxMode(!sandboxMode)}
      />

      {/* Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        engine={engine}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
      />

      {/* Betting Modal */}
      <BettingModal
        isOpen={isBettingOpen}
        onClose={() => setIsBettingOpen(false)}
        engine={engine}
        bankroll={bankroll}
        onPlaceBet={handlePlaceBet}
        activeBets={activeBets}
      />

      {/* Intel & Radar Drawer */}
      <IntelDrawer
        isOpen={isIntelOpen}
        onClose={() => setIsIntelOpen(false)}
        engine={engine}
        eventLog={eventLog}
      />

      {/* Match Victory Modal */}
      <VictoryModal
        winnerTeamKey={winnerTeam}
        onClose={() => setWinnerTeam(null)}
        onRestart={handleResetSkirmish}
        activeBets={activeBets}
        onSettleBets={handleSettleBets}
      />
    </div>
  );
}
