// High-Performance Interactive Tactical Canvas Renderer for Frontline Sandbox

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TEAMS, UNIT_TYPES, COMMANDER_POWERS } from '../game/constants.js';

export function TacticalCanvas({
  engine,
  selectedTeam,
  selectedUnitType,
  selectedPower,
  onClearPower,
  sandboxMode,
  activeMapId
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Camera viewport pan & zoom
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 0.85,
    isPanning: false,
    panStartX: 0,
    panStartY: 0
  });

  // Box selection & drag
  const selectionRef = useRef({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const [hoveredUnit, setHoveredUnit] = useState(null);
  const mousePosRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0 });

  // Props ref to keep render loop pure and uninterrupted
  const propsRef = useRef({ selectedTeam, selectedUnitType, selectedPower, sandboxMode });
  useEffect(() => {
    propsRef.current = { selectedTeam, selectedUnitType, selectedPower, sandboxMode };
  }, [selectedTeam, selectedUnitType, selectedPower, sandboxMode]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = screenX - rect.left;
    const cy = screenY - rect.top;
    const cam = cameraRef.current;

    const worldX = (cx - canvas.width / 2) / cam.zoom + cam.x;
    const worldY = (cy - canvas.height / 2) / cam.zoom + cam.y;
    return { x: worldX, y: worldY };
  }, []);

  // Main Canvas render loop - dependent ONLY on engine
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const render = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Update engine
      if (engine) {
        engine.update(dt);
      }

      const canvas = canvasRef.current;
      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        const cam = cameraRef.current;
        const map = engine.map;

        // Auto-resize
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
            canvas.width = clientWidth;
            canvas.height = clientHeight;
            // Center camera initially
            if (cam.x === 0 && cam.y === 0) {
              cam.x = map.width / 2;
              cam.y = map.height / 2;
            }
          }
        }

        // Apply screen shake
        let shakeX = 0;
        let shakeY = 0;
        if (engine.screenShake > 0) {
          shakeX = (Math.random() - 0.5) * engine.screenShake;
          shakeY = (Math.random() - 0.5) * engine.screenShake;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill background
        ctx.fillStyle = map.bgColor || '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply camera transform
        ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);

        // 1. Draw Map Boundaries & Tactical Grid
        drawMapBackground(ctx, map);

        // 2. Draw Blast Craters
        drawCraters(ctx, engine.craters);

        // 3. Draw Obstacles (Buildings, Ruins, Water)
        drawObstacles(ctx, map.obstacles);

        // 4. Draw Cover Zones (Sandbags, Trenches)
        drawCoverZones(ctx, map.coverZones);

        // 5. Draw Resource Control Points (Generators)
        drawResourcePoints(ctx, engine.controlPoints, engine.simTime);

        // 6. Draw Nexus Bases (Bedwars Bases)
        drawNexusBases(ctx, engine.map.bases, engine.teamState, engine.simTime);

        // 7. Draw Active Powers in Flight
        drawActivePowers(ctx, engine.activePowers, engine.simTime);

        // 8. Draw Units
        drawUnits(ctx, engine.units, engine.selectedUnitIds, engine.simTime);

        // 9. Draw Projectiles
        drawProjectiles(ctx, engine.projectiles);

        // 10. Draw Particles (Smoke, Sparks, Fire)
        drawParticles(ctx, engine.particles);

        // 11. Draw Floating Combat Text
        drawFloatingTexts(ctx, engine.floatingTexts);

        // 12. Draw Drag Selection Box
        if (selectionRef.current.isSelecting) {
          drawSelectionBox(ctx, selectionRef.current);
        }

        // 13. Draw Target Reticle if Power or Unit selected
        const currentProps = propsRef.current;
        drawTargetReticle(ctx, mousePosRef.current, currentProps.selectedPower, currentProps.selectedUnitType, currentProps.selectedTeam);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Drawing Subroutines
  const drawMapBackground = (ctx, map) => {
    // Map bounds stroke
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, map.width, map.height);

    // Tactical Grid lines
    ctx.strokeStyle = map.gridColor || 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x <= map.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, map.height);
      ctx.stroke();
    }
    for (let y = 0; y <= map.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(map.width, y);
      ctx.stroke();
    }

    // High ground / central plaza subtle glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.beginPath();
    ctx.arc(map.width / 2, map.height / 2, 220, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCraters = (ctx, craters) => {
    craters.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer burn rim
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const drawObstacles = (ctx, obstacles) => {
    obstacles.forEach(obs => {
      ctx.save();
      // Drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      // Base block
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Top bevel border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // Warning stripes or texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.stroke();

      ctx.restore();
    });
  };

  const drawCoverZones = (ctx, coverZones) => {
    coverZones.forEach(cz => {
      ctx.save();
      if (cz.type === 'sandbag') {
        // Sandbag wall (CoH Cover)
        ctx.fillStyle = '#78716c';
        ctx.fillRect(cz.x, cz.y, cz.w, cz.h);
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cz.x, cz.y, cz.w, cz.h);

        // Shield indicator
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.fillText('SHIELD', cz.x + 2, cz.y - 4);
      } else {
        // Trench
        ctx.fillStyle = '#292524';
        ctx.fillRect(cz.x, cz.y, cz.w, cz.h);
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.strokeRect(cz.x, cz.y, cz.w, cz.h);
      }
      ctx.restore();
    });
  };

  const drawResourcePoints = (ctx, points, time) => {
    points.forEach(cp => {
      ctx.save();
      const teamColor = cp.owner !== 'neutral' ? TEAMS[cp.owner].hex : '#94a3b8';

      // Outer capture perimeter
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fill glow
      ctx.fillStyle = cp.owner !== 'neutral' ? TEAMS[cp.owner].glowHex : 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
      ctx.fill();

      // Center Crystal / Generator Icon
      const rot = time * 0.8;
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(rot);

      ctx.fillStyle = cp.type === 'diamond' ? '#38bdf8' : (cp.type === 'gold' ? '#facc15' : '#94a3b8');
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();

      // Progress bar if contesting
      if (cp.progress > 0 && cp.progress < 100) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(cp.x - 25, cp.y + cp.radius + 6, 50, 6);
        ctx.fillStyle = teamColor;
        ctx.fillRect(cp.x - 25, cp.y + cp.radius + 6, (cp.progress / 100) * 50, 6);
      }

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cp.name, cp.x, cp.y - cp.radius - 8);

      ctx.restore();
    });
  };

  const drawNexusBases = (ctx, bases, teamState, time) => {
    Object.keys(bases).forEach(teamKey => {
      const base = bases[teamKey];
      const state = teamState[teamKey];
      if (!base || !state) return;

      const team = TEAMS[teamKey];
      const isAlive = state.nexusAlive;
      const underAttack = state.underAttackTimer > 0;

      ctx.save();

      if (!isAlive) {
        // Destroyed burning wreckage
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEXUS DESTROYED', base.x, base.y);
        ctx.restore();
        return;
      }

      // Pulsing under attack indicator
      if (underAttack) {
        const pulse = Math.sin(time * 12) * 10;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(base.x, base.y, base.radius + 15 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Base Dome Shield
      const grad = ctx.createRadialGradient(base.x, base.y, 10, base.x, base.y, base.radius);
      grad.addColorStop(0, team.glowHex);
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer armor ring
      ctx.strokeStyle = team.hex;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Rotating Radar Dish
      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(time * 1.5);
      ctx.strokeStyle = team.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(base.radius * 0.7, 0);
      ctx.stroke();
      ctx.restore();

      // Auto-turret mounts if upgraded
      if (state.upgrades.nexusDefense > 0) {
        ctx.fillStyle = '#e2e8f0';
        [-base.radius * 0.7, base.radius * 0.7].forEach(offset => {
          ctx.beginPath();
          ctx.arc(base.x + offset, base.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = team.hex;
          ctx.stroke();
        });
      }

      // Health bar ring / Arc
      const hpPct = Math.max(0, state.nexusHp / state.maxNexusHp);
      ctx.strokeStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(base.x, base.y, base.radius + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();

      // Team Label & HP
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${team.shortName} NEXUS`, base.x, base.y + base.radius + 20);
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${Math.round(state.nexusHp)}/${state.maxNexusHp}`, base.x, base.y + base.radius + 32);

      ctx.restore();
    });
  };

  const drawActivePowers = (ctx, powers, time) => {
    powers.forEach(p => {
      ctx.save();

      if (p.type === 'airstrike') {
        // Red carpet bombing flight indicator
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
      } else if (p.type === 'emp') {
        // Expanding EMP blast ring
        const expand = (1 - (p.timer / 0.5)) * p.radius;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, Math.max(10, expand), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'orbitalLaser') {
        // Searing vertical beam
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, p.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const drawUnits = (ctx, units, selectedIds, time) => {
    units.forEach(u => {
      ctx.save();
      const team = TEAMS[u.team];
      const isSelected = selectedIds.has(u.id);

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(u.x, u.y, u.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Commander aura ring
      if (u.isCommander) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(u.x, u.y, 160, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Directional weapon barrel
      ctx.save();
      ctx.translate(u.x, u.y);
      ctx.rotate(u.heading);

      if (u.isVehicle) {
        // Tank / Armored Car Chassis
        ctx.fillStyle = u.type === 'tank' ? '#334155' : '#475569';
        ctx.fillRect(-u.radius, -u.radius * 0.75, u.radius * 2, u.radius * 1.5);
        ctx.strokeStyle = team.hex;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-u.radius, -u.radius * 0.75, u.radius * 2, u.radius * 1.5);

        // Cannon barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -2, u.radius + (u.type === 'tank' ? 12 : 7), 4);
      } else {
        // Infantry Unit
        ctx.fillStyle = team.hex;
        ctx.beginPath();
        ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gun barrel
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(u.radius + 6, 0);
        ctx.stroke();
      }
      ctx.restore();

      // Status Indicators: Cover Shield / Suppressed
      if (u.inCover) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Rajdhani';
        ctx.fillText('🛡️', u.x - 5, u.y - u.radius - 8);
      }

      if (u.isSuppressed) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px Rajdhani';
        ctx.fillText('PINNED', u.x - 12, u.y - u.radius - 12);
      }

      if (u.empDisabledTimer > 0) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 8px Rajdhani';
        ctx.fillText('⚡EMP', u.x - 10, u.y - u.radius - 14);
      }

      // Health bar
      const barW = Math.max(18, u.radius * 2.2);
      const barH = 3;
      const hpRatio = Math.max(0, u.hp / u.maxHp);

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(u.x - barW / 2, u.y + u.radius + 3, barW, barH);

      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillRect(u.x - barW / 2, u.y + u.radius + 3, barW * hpRatio, barH);

      ctx.restore();
    });
  };

  const drawProjectiles = (ctx, projectiles) => {
    projectiles.forEach(p => {
      ctx.save();
      if (p.isRocket) {
        // Rocket body
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.isShell) {
        // Heavy artillery tank shell
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bullet tracer line
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.restore();
    });
  };

  const drawParticles = (ctx, particles) => {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawFloatingTexts = (ctx, texts) => {
    texts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  };

  const drawSelectionBox = (ctx, sel) => {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    const x = Math.min(sel.startX, sel.currentX);
    const y = Math.min(sel.startY, sel.currentY);
    const w = Math.abs(sel.currentX - sel.startX);
    const h = Math.abs(sel.currentY - sel.startY);

    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };

  const drawTargetReticle = (ctx, mouse, power, unitType, teamKey) => {
    const { worldX, worldY } = mouse;
    ctx.save();

    if (power) {
      // Reticle for tactical power
      const powDef = COMMANDER_POWERS.find(p => p.id === power);
      if (powDef) {
        ctx.strokeStyle = powDef.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(worldX, worldY, powDef.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `${powDef.color}22`;
        ctx.fill();
      }
    } else if (unitType) {
      // Unit spawn preview ring
      const proto = UNIT_TYPES[unitType];
      const team = TEAMS[teamKey];
      if (proto && team) {
        ctx.strokeStyle = team.hex;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(worldX, worldY, proto.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Camera drag state
  const dragTrackerRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    camStartX: 0,
    camStartY: 0,
    isDragging: false
  });
  const [isCursorDragging, setIsCursorDragging] = useState(false);

  // Corner Minimap Canvas ref
  const cornerRadarRef = useRef(null);

  // Keyboard camera panning (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const panSpeed = 35 / cameraRef.current.zoom;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        cameraRef.current.y -= panSpeed;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        cameraRef.current.y += panSpeed;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        cameraRef.current.x -= panSpeed;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        cameraRef.current.x += panSpeed;
      } else if (e.code === 'KeyC') {
        // Center camera
        if (engine?.map) {
          cameraRef.current.x = engine.map.width / 2;
          cameraRef.current.y = engine.map.height / 2;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  // Corner Radar Minimap Render Loop
  useEffect(() => {
    let animId;
    const renderRadar = () => {
      const canvas = cornerRadarRef.current;
      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        const map = engine.map;
        const cam = cameraRef.current;
        const mainCanvas = canvasRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const sx = canvas.width / map.width;
        const sy = canvas.height / map.height;

        // Obstacles
        ctx.fillStyle = '#334155';
        map.obstacles.forEach(obs => {
          ctx.fillRect(obs.x * sx, obs.y * sy, obs.w * sx, obs.h * sy);
        });

        // Control Points
        engine.controlPoints.forEach(cp => {
          ctx.fillStyle = cp.owner !== 'neutral' ? TEAMS[cp.owner].hex : '#64748b';
          ctx.beginPath();
          ctx.arc(cp.x * sx, cp.y * sy, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Bases
        Object.keys(map.bases).forEach(k => {
          const b = map.bases[k];
          const st = engine.teamState[k];
          ctx.fillStyle = st?.nexusAlive ? TEAMS[k].hex : '#475569';
          ctx.beginPath();
          ctx.arc(b.x * sx, b.y * sy, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Unit Blips
        engine.units.forEach(u => {
          ctx.fillStyle = TEAMS[u.team].hex;
          ctx.beginPath();
          ctx.arc(u.x * sx, u.y * sy, u.isVehicle ? 2 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Camera Viewport Box on Radar
        if (mainCanvas) {
          const viewW = (mainCanvas.width / cam.zoom) * sx;
          const viewH = (mainCanvas.height / cam.zoom) * sy;
          const viewX = (cam.x * sx) - viewW / 2;
          const viewY = (cam.y * sy) - viewH / 2;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(viewX, viewY, viewW, viewH);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(viewX, viewY, viewW, viewH);
        }
      }
      animId = requestAnimationFrame(renderRadar);
    };

    renderRadar();
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Click on Corner Radar to Jump Camera
  const handleRadarClick = (e) => {
    const canvas = cornerRadarRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const map = engine.map;
    const targetWorldX = (clickX / canvas.width) * map.width;
    const targetWorldY = (clickY / canvas.height) * map.height;

    cameraRef.current.x = targetWorldX;
    cameraRef.current.y = targetWorldY;
  };

  // Mouse & Interaction Handlers
  const handleMouseDown = (e) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    // Right Click: Move/Attack order for selected units
    if (e.button === 2) {
      e.preventDefault();
      if (engine.selectedUnitIds.size > 0) {
        engine.units.forEach(u => {
          if (engine.selectedUnitIds.has(u.id)) {
            u.manualOrder = { x, y };
          }
        });
        engine.addFloatingText(x, y, 'TACTICAL ORDER ISSUED', '#38bdf8');
      }
      return;
    }

    // Left Mouse: Initialize Drag-to-Pan tracker
    dragTrackerRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      camStartX: cameraRef.current.x,
      camStartY: cameraRef.current.y,
      isDragging: false,
      worldClickX: x,
      worldClickY: y
    };
  };

  const handleMouseMove = (e) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    mousePosRef.current = { x: e.clientX, y: e.clientY, worldX: x, worldY: y };

    const tracker = dragTrackerRef.current;
    if (tracker.isDown) {
      const dx = e.clientX - tracker.startX;
      const dy = e.clientY - tracker.startY;

      // When moved more than 4px, trigger smooth map dragging!
      if (Math.hypot(dx, dy) > 4) {
        tracker.isDragging = true;
        setIsCursorDragging(true);

        const cam = cameraRef.current;
        cam.x = tracker.camStartX - (dx / cam.zoom);
        cam.y = tracker.camStartY - (dy / cam.zoom);

        // Clamp camera so map doesn't get lost
        if (engine?.map) {
          cam.x = Math.max(-200, Math.min(engine.map.width + 200, cam.x));
          cam.y = Math.max(-200, Math.min(engine.map.height + 200, cam.y));
        }
      }
    }

    // Check hover
    let found = null;
    if (engine) {
      for (const u of engine.units) {
        if (Math.hypot(u.x - x, u.y - y) <= u.radius + 6) {
          found = u;
          break;
        }
      }
    }
    setHoveredUnit(found);
  };

  const handleMouseUp = (e) => {
    const tracker = dragTrackerRef.current;
    if (!tracker.isDown) return;

    const wasDragging = tracker.isDragging;
    tracker.isDown = false;
    setIsCursorDragging(false);

    // If user dragged to pan the map, finish navigation without spawning or selecting
    if (wasDragging) {
      return;
    }

    // Clean click on spot:
    const clickX = tracker.worldClickX;
    const clickY = tracker.worldClickY;
    const currentProps = propsRef.current;

    // 1. Power trigger
    if (currentProps.selectedPower) {
      engine.triggerPower(currentProps.selectedPower, currentProps.selectedTeam, clickX, clickY);
      if (onClearPower) onClearPower();
      return;
    }

    // 2. Unit deployment
    if (currentProps.selectedUnitType) {
      engine.spawnUnit(currentProps.selectedTeam, currentProps.selectedUnitType, clickX, clickY, currentProps.sandboxMode);
      return;
    }

    // 3. Unit selection
    const clickedUnit = engine.units.find(u => Math.hypot(u.x - clickX, u.y - clickY) <= u.radius + 8);
    engine.selectedUnitIds.clear();
    if (clickedUnit) {
      engine.selectedUnitIds.add(clickedUnit.id);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    cameraRef.current.zoom = Math.max(0.35, Math.min(2.5, cameraRef.current.zoom * zoomFactor));
  };

  const handleCenterMap = () => {
    if (engine?.map) {
      cameraRef.current.x = engine.map.width / 2;
      cameraRef.current.y = engine.map.height / 2;
      cameraRef.current.zoom = 0.85;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${
        isCursorDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating Corner Tactical Radar Navigator */}
      <div className="absolute top-4 right-4 z-20 bg-slate-950/85 border border-slate-700/80 rounded-lg p-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span className="uppercase font-bold tracking-wider text-sky-400">RADAR NAVIGATOR</span>
          <span className="text-[9px] text-slate-500">CLICK TO JUMP</span>
        </div>
        <div className="relative rounded overflow-hidden border border-slate-700 cursor-pointer" onClick={handleRadarClick}>
          <canvas
            ref={cornerRadarRef}
            width={180}
            height={115}
            className="w-[180px] h-[115px] block"
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          <button
            onClick={handleCenterMap}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            [C] Center View
          </button>
          <span>WASD to Pan</span>
        </div>
      </div>

      {/* Hover Unit HUD Card */}
      {hoveredUnit && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-3 rounded-lg shadow-xl text-xs font-tactical min-w-44 text-slate-200">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-700">
            <span className="font-bold text-sm tracking-wide" style={{ color: TEAMS[hoveredUnit.team].hex }}>
              {hoveredUnit.name}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {TEAMS[hoveredUnit.team].shortName}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">HEALTH:</span>
              <span className="text-emerald-400 font-bold">{Math.round(hoveredUnit.hp)} / {hoveredUnit.maxHp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DAMAGE:</span>
              <span>{hoveredUnit.damage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ARMOR:</span>
              <span>{hoveredUnit.armor}</span>
            </div>
            {hoveredUnit.inCover && (
              <div className="text-sky-400 font-bold flex items-center gap-1 mt-1">
                <span>🛡️ IN COVER (50% RESIST)</span>
              </div>
            )}
            {hoveredUnit.isSuppressed && (
              <div className="text-red-400 font-bold animate-pulse mt-1">
                <span>⚠️ PINNED DOWN</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Navigation Help Strip */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-md border border-slate-800 backdrop-blur-sm pointer-events-none">
        <span className="text-sky-400 font-bold">✋ Drag Cursor to Pan</span>
        <span>•</span>
        <span>WASD Pan</span>
        <span>•</span>
        <span>Scroll Zoom</span>
        <span>•</span>
        <span>Right-Click Orders</span>
      </div>
    </div>
  );
}
