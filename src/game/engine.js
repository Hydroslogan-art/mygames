// Tactical Combat Engine for Frontline Sandbox
// Fixed combat hitboxes, stable AI state machine (no twitch/looping), and robust physics

import { TEAMS, UNIT_TYPES, COMMANDER_POWERS, UPGRADES } from './constants.js';
import { MAPS } from './mapData.js';
import { sounds } from '../utils/audio.js';

// High-performance Liang-Barsky Ray-AABB Line of Sight algorithm
export function lineIntersectsBox(x1, y1, x2, y2, box) {
  // If either endpoint is inside the obstacle, it's blocked
  if (x1 >= box.x && x1 <= box.x + box.w && y1 >= box.y && y1 <= box.y + box.h) return true;
  if (x2 >= box.x && x2 <= box.x + box.w && y2 >= box.y && y2 <= box.y + box.h) return true;

  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - box.x, (box.x + box.w) - x1, y1 - box.y, (box.y + box.h) - y1];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

export class BattleEngine {
  constructor(mapId = 'crossfire_ruins', onEvent = () => {}) {
    this.onEvent = onEvent;
    this.map = MAPS.find(m => m.id === mapId) || MAPS[0];

    // Core simulation state
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.craters = [];
    this.floatingTexts = [];
    this.activePowers = [];

    this.simSpeed = 1.0;
    this.isPaused = false;
    this.simTime = 0;
    this.unitIdCounter = 1;
    this.screenShake = 0;

    // Team economy & upgrade states
    this.teamState = {};
    Object.keys(TEAMS).forEach(teamKey => {
      this.teamState[teamKey] = {
        credits: 250,
        upgrades: {
          weapons: 0,
          armor: 0,
          logistics: 0,
          nexusDefense: 0,
          mobility: 0
        },
        casualties: 0,
        kills: 0,
        unitsSpawned: 0,
        aiTimer: 2.0 + Math.random() * 2.0,
        nexusHp: this.map.bases[teamKey]?.maxHp || 1800,
        maxNexusHp: this.map.bases[teamKey]?.maxHp || 1800,
        nexusAlive: true,
        underAttackTimer: 0,
        turretCooldown: 0
      };
    });

    // Control points capture state
    this.controlPoints = this.map.resourcePoints.map(cp => ({
      ...cp,
      owner: 'neutral',
      progress: 0,
      capturingTeam: null
    }));

    // Match status
    this.winner = null;
    this.eliminatedTeams = new Set();
    this.selectedUnitIds = new Set();

    // Default pre-population
    this.populateInitialSkirmish();
  }

  // Populate map with initial troops so combat starts immediately
  populateInitialSkirmish() {
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.craters = [];
    this.floatingTexts = [];
    this.activePowers = [];
    this.winner = null;
    this.eliminatedTeams.clear();

    const redBase = this.map.bases.red;
    const blueBase = this.map.bases.blue;
    const greenBase = this.map.bases.green;
    const yellowBase = this.map.bases.yellow;

    // Red Frontline Squad (North-West)
    this.spawnUnit('red', 'rifleman', redBase.x + 90, redBase.y + 40);
    this.spawnUnit('red', 'rifleman', redBase.x + 70, redBase.y + 80);
    this.spawnUnit('red', 'assault', redBase.x + 110, redBase.y + 60);
    this.spawnUnit('red', 'hmg', redBase.x + 50, redBase.y + 100);
    this.spawnUnit('red', 'armoredCar', redBase.x + 40, redBase.y + 40);

    // Blue Frontline Squad (South-East)
    this.spawnUnit('blue', 'rifleman', blueBase.x - 90, blueBase.y - 40);
    this.spawnUnit('blue', 'rifleman', blueBase.x - 70, blueBase.y - 80);
    this.spawnUnit('blue', 'bazooka', blueBase.x - 110, blueBase.y - 60);
    this.spawnUnit('blue', 'medic', blueBase.x - 50, blueBase.y - 100);
    this.spawnUnit('blue', 'armoredCar', blueBase.x - 40, blueBase.y - 40);

    // Green Squad (South-West)
    this.spawnUnit('green', 'rifleman', greenBase.x + 80, greenBase.y - 50);
    this.spawnUnit('green', 'sniper', greenBase.x + 50, greenBase.y - 80);
    this.spawnUnit('green', 'assault', greenBase.x + 100, greenBase.y - 70);

    // Yellow Squad (North-East)
    this.spawnUnit('yellow', 'rifleman', yellowBase.x - 80, yellowBase.y + 50);
    this.spawnUnit('yellow', 'sniper', yellowBase.x - 50, yellowBase.y + 80);
    this.spawnUnit('yellow', 'assault', yellowBase.x - 100, yellowBase.y + 70);
  }

  changeMap(newMapId) {
    const found = MAPS.find(m => m.id === newMapId);
    if (!found) return;
    this.map = found;

    Object.keys(TEAMS).forEach(k => {
      const base = this.map.bases[k];
      if (base) {
        this.teamState[k].nexusHp = base.maxHp;
        this.teamState[k].maxNexusHp = base.maxHp;
        this.teamState[k].nexusAlive = true;
      }
    });

    this.controlPoints = this.map.resourcePoints.map(cp => ({
      ...cp,
      owner: 'neutral',
      progress: 0,
      capturingTeam: null
    }));

    this.populateInitialSkirmish();
  }

  spawnUnit(teamKey, unitTypeId, x, y, isFree = true) {
    const proto = UNIT_TYPES[unitTypeId];
    if (!proto) return null;

    const team = this.teamState[teamKey];
    if (!isFree && team.credits < proto.cost) {
      return null;
    }

    if (!isFree) {
      team.credits -= proto.cost;
    }

    // Apply team upgrade bonuses
    const weaponUpgrade = team.upgrades.weapons || 0;
    const armorUpgrade = team.upgrades.armor || 0;
    const mobilityUpgrade = team.upgrades.mobility || 0;

    const damageBonus = 1 + (weaponUpgrade * 0.18);
    const hpBonus = 1 + (armorUpgrade * 0.25);
    const flatArmorBonus = armorUpgrade * 5;
    const speedBonus = 1 + (mobilityUpgrade * 0.20);

    const maxHp = Math.round(proto.hp * hpBonus);

    const unit = {
      id: this.unitIdCounter++,
      team: teamKey,
      type: unitTypeId,
      name: proto.name,
      tier: proto.tier,
      isVehicle: proto.isVehicle,
      isCommander: proto.isCommander,
      isHealer: proto.isHealer,
      x: x + (Math.random() * 16 - 8),
      y: y + (Math.random() * 16 - 8),
      vx: 0,
      vy: 0,
      radius: proto.radius,
      hp: maxHp,
      maxHp: maxHp,
      speed: proto.speed * speedBonus,
      damage: Math.round(proto.damage * damageBonus),
      range: proto.range,
      fireRate: proto.fireRate,
      accuracy: proto.accuracy,
      armor: proto.armor + flatArmorBonus,
      antiArmorMult: proto.antiArmorMult || 1.0,
      splashRadius: proto.splashRadius || 0,
      healAmount: proto.healAmount || 0,
      healRange: proto.healRange || 0,
      burstCount: proto.burstCount || 1,
      cooldown: 0.1 + Math.random() * 0.3,
      burstRemaining: 0,
      burstTimer: 0,

      // Tactical state machine
      inCover: false,
      coverType: null,
      suppression: 0,
      isSuppressed: false,
      empDisabledTimer: 0,
      stimBuffTimer: 0,
      commanderBuffTimer: 0,
      retreatTimer: 0, // Stable retreat timer (prevents twitching)

      // Target persistence
      lockedTargetId: null,
      manualOrder: null,
      heading: Math.random() * Math.PI * 2
    };

    this.units.push(unit);
    team.unitsSpawned++;
    sounds.playDeploy();

    return unit;
  }

  triggerPower(powerId, teamKey, targetX, targetY) {
    const power = COMMANDER_POWERS.find(p => p.id === powerId);
    if (!power) return;

    this.activePowers.push({
      id: Math.random(),
      type: powerId,
      team: teamKey,
      targetX,
      targetY,
      radius: power.radius,
      color: power.color,
      timer: power.delay || 0.1,
      duration: power.duration || 0,
      executed: false
    });

    if (powerId === 'airstrike') sounds.playAirstrike();
    if (powerId === 'orbitalLaser') sounds.playOrbitalBeam();
    if (powerId === 'emp') sounds.playDeploy();
    if (powerId === 'fieldHeal') sounds.playHeal();
    if (powerId === 'paratroopers') sounds.playDeploy();

    this.addFloatingText(targetX, targetY, `${power.name.toUpperCase()} INBOUND`, '#f59e0b');
  }

  purchaseUpgrade(teamKey, upgradeId) {
    const team = this.teamState[teamKey];
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!team || !upgrade) return false;

    const currentLevel = team.upgrades[upgradeId] || 0;
    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    if (team.credits < cost) return false;

    team.credits -= cost;
    team.upgrades[upgradeId] = currentLevel + 1;

    if (upgradeId === 'nexusDefense') {
      team.maxNexusHp += 400;
      team.nexusHp = Math.min(team.maxNexusHp, team.nexusHp + 400);
    }

    this.units.forEach(u => {
      if (u.team === teamKey) {
        if (upgradeId === 'weapons') {
          const proto = UNIT_TYPES[u.type];
          u.damage = Math.round(proto.damage * (1 + team.upgrades.weapons * 0.18));
        } else if (upgradeId === 'armor') {
          const proto = UNIT_TYPES[u.type];
          const newMax = Math.round(proto.hp * (1 + team.upgrades.armor * 0.25));
          u.hp = Math.min(newMax, u.hp + 25);
          u.maxHp = newMax;
          u.armor = proto.armor + team.upgrades.armor * 5;
        } else if (upgradeId === 'mobility') {
          const proto = UNIT_TYPES[u.type];
          u.speed = proto.speed * (1 + team.upgrades.mobility * 0.20);
        }
      }
    });

    sounds.playWinPayout();
    return true;
  }

  update(rawDt) {
    if (this.isPaused) return;

    const dt = Math.min(rawDt, 0.04) * this.simSpeed;
    this.simTime += dt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    this.updateEconomy(dt);
    this.updateTeamAI(dt);
    this.updateActivePowers(dt);
    this.updateUnits(dt);
    this.updateProjectiles(dt);
    this.updateBaseTurrets(dt);
    this.updateParticles(dt);
    this.checkMatchStatus();
  }

  updateEconomy(dt) {
    Object.keys(TEAMS).forEach(k => {
      const team = this.teamState[k];
      if (team.nexusAlive) {
        const mult = 1 + (team.upgrades.logistics * 0.35);
        team.credits += 8 * mult * dt;
        if (team.underAttackTimer > 0) {
          team.underAttackTimer -= dt;
        }
      }
    });

    this.controlPoints.forEach(cp => {
      const teamsInRadius = {};
      this.units.forEach(u => {
        const dx = u.x - cp.x;
        const dy = u.y - cp.y;
        if (dx * dx + dy * dy <= cp.radius * cp.radius) {
          teamsInRadius[u.team] = (teamsInRadius[u.team] || 0) + 1;
        }
      });

      const contestingTeams = Object.keys(teamsInRadius);

      if (contestingTeams.length === 1) {
        const teamKey = contestingTeams[0];
        if (cp.owner === teamKey) {
          cp.progress = Math.min(100, cp.progress + 30 * dt);
        } else {
          if (cp.progress > 0) {
            cp.progress -= 40 * dt;
            if (cp.progress <= 0) {
              cp.owner = 'neutral';
              cp.progress = 0;
            }
          } else {
            cp.progress += 35 * dt;
            if (cp.progress >= 100) {
              cp.owner = teamKey;
              cp.progress = 100;
              this.addFloatingText(cp.x, cp.y - 20, `${TEAMS[teamKey].name.toUpperCase()} CAPTURED!`, TEAMS[teamKey].hex);
            }
          }
        }
      }

      if (cp.owner !== 'neutral') {
        const team = this.teamState[cp.owner];
        if (team && team.nexusAlive) {
          const logMult = 1 + (team.upgrades.logistics * 0.35);
          team.credits += (cp.rate * logMult * dt);
        }
      }
    });
  }

  updateTeamAI(dt) {
    Object.keys(TEAMS).forEach(teamKey => {
      const team = this.teamState[teamKey];
      if (!team.nexusAlive) return;

      team.aiTimer -= dt;
      if (team.aiTimer <= 0) {
        team.aiTimer = 3.0 + Math.random() * 2.5;

        const myUnits = this.units.filter(u => u.team === teamKey);
        // Team population cap: maximum 16 units per team to prevent lag & infinite clutter
        if (myUnits.length >= 16) return;

        const myBases = this.map.bases[teamKey];

        let unitToSpawn = 'rifleman';
        const rand = Math.random();

        if (team.credits >= 450 && rand < 0.3) {
          unitToSpawn = 'tank';
        } else if (team.credits >= 260 && rand < 0.5) {
          unitToSpawn = 'armoredCar';
        } else if (team.credits >= 160 && rand < 0.7) {
          unitToSpawn = rand < 0.5 ? 'bazooka' : 'hmg';
        } else if (team.credits >= 130 && rand < 0.82) {
          unitToSpawn = 'sniper';
        } else if (team.credits >= 120 && myUnits.length >= 3 && rand < 0.9) {
          unitToSpawn = 'medic';
        } else if (team.credits >= 75 && rand < 0.95) {
          unitToSpawn = 'assault';
        }

        if (team.credits > 550) {
          const upKeys = ['weapons', 'armor', 'logistics', 'nexusDefense'];
          const chosenUp = upKeys[Math.floor(Math.random() * upKeys.length)];
          this.purchaseUpgrade(teamKey, chosenUp);
        }

        if (myBases && team.credits >= UNIT_TYPES[unitToSpawn].cost) {
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = myBases.radius + 15;
          const sx = myBases.x + Math.cos(angle) * spawnDist;
          const sy = myBases.y + Math.sin(angle) * spawnDist;
          this.spawnUnit(teamKey, unitToSpawn, sx, sy, false);
        }
      }
    });
  }

  updateActivePowers(dt) {
    for (let i = this.activePowers.length - 1; i >= 0; i--) {
      const p = this.activePowers[i];
      p.timer -= dt;

      if (p.timer <= 0 && !p.executed) {
        p.executed = true;

        if (p.type === 'airstrike') {
          this.screenShake = 16;
          sounds.playExplosion();
          for (let b = 0; b < 6; b++) {
            const bx = p.targetX + (Math.random() - 0.5) * p.radius * 1.4;
            const by = p.targetY + (Math.random() - 0.5) * p.radius * 1.4;
            this.createExplosion(bx, by, 55, 175, p.team);
          }
        } else if (p.type === 'emp') {
          sounds.playExplosion();
          this.units.forEach(u => {
            if (u.team !== p.team) {
              const dist = Math.hypot(u.x - p.targetX, u.y - p.targetY);
              if (dist <= p.radius) {
                u.empDisabledTimer = 6.0;
                this.addFloatingText(u.x, u.y - 12, 'EMP DISABLED', '#06b6d4');
              }
            }
          });
        } else if (p.type === 'paratroopers') {
          sounds.playDeploy();
          this.spawnUnit(p.team, 'rifleman', p.targetX - 25, p.targetY, true);
          this.spawnUnit(p.team, 'rifleman', p.targetX + 25, p.targetY, true);
          this.spawnUnit(p.team, 'assault', p.targetX, p.targetY - 25, true);
          this.spawnUnit(p.team, 'bazooka', p.targetX, p.targetY + 25, true);
        } else if (p.type === 'fieldHeal') {
          sounds.playHeal();
          this.units.forEach(u => {
            if (u.team === p.team) {
              const dist = Math.hypot(u.x - p.targetX, u.y - p.targetY);
              if (dist <= p.radius) {
                u.hp = u.maxHp;
                u.stimBuffTimer = 8.0;
                this.addFloatingText(u.x, u.y - 12, 'NANO-STIM 100%', '#ec4899');
              }
            }
          });
        } else if (p.type === 'orbitalLaser') {
          this.screenShake = 24;
          sounds.playOrbitalBeam();
          sounds.playExplosion();
          this.createExplosion(p.targetX, p.targetY, p.radius, 550, p.team);
        }
      }

      if (p.executed && p.timer <= -1.2) {
        this.activePowers.splice(i, 1);
      }
    }
  }

  updateUnits(dt) {
    const commanderUnits = this.units.filter(u => u.isCommander && u.hp > 0);

    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];

      if (u.hp <= 0) {
        this.createBloodOrDebris(u.x, u.y, u.isVehicle);
        this.teamState[u.team].casualties++;
        this.units.splice(i, 1);
        continue;
      }

      if (u.empDisabledTimer > 0) u.empDisabledTimer = Math.max(0, u.empDisabledTimer - dt);
      if (u.stimBuffTimer > 0) u.stimBuffTimer = Math.max(0, u.stimBuffTimer - dt);
      if (u.commanderBuffTimer > 0) u.commanderBuffTimer = Math.max(0, u.commanderBuffTimer - dt);
      if (u.retreatTimer > 0) u.retreatTimer = Math.max(0, u.retreatTimer - dt);

      commanderUnits.forEach(cmd => {
        if (cmd.team === u.team && cmd.id !== u.id) {
          const dist = Math.hypot(u.x - cmd.x, u.y - cmd.y);
          if (dist <= 160) {
            u.commanderBuffTimer = 1.0;
          }
        }
      });

      if (u.suppression > 0) {
        u.suppression = Math.max(0, u.suppression - dt * 18);
      }
      u.isSuppressed = u.suppression >= 45;

      // Cover check
      let nearestCover = null;
      let minCoverDist = 28;
      this.map.coverZones.forEach(cz => {
        const cx = cz.x + cz.w / 2;
        const cy = cz.y + cz.h / 2;
        const dist = Math.hypot(u.x - cx, u.y - cy);
        if (dist < minCoverDist) {
          minCoverDist = dist;
          nearestCover = cz.type;
        }
      });
      u.inCover = !!nearestCover;
      u.coverType = nearestCover;

      // Fire cooldowns
      if (u.cooldown > 0) u.cooldown -= dt;
      if (u.burstRemaining > 0) {
        u.burstTimer -= dt;
        if (u.burstTimer <= 0) {
          this.fireWeapon(u);
          u.burstRemaining--;
          u.burstTimer = 0.08;
        }
      }

      // Tactical AI
      if (u.isHealer) {
        this.updateMedicAI(u, dt);
      } else {
        this.updateCombatAI(u, dt);
      }

      this.applyUnitMovement(u, dt);
    }
  }

  updateMedicAI(u, dt) {
    if (u.empDisabledTimer > 0) {
      u.vx *= 0.8;
      u.vy *= 0.8;
      return;
    }

    let woundedAlly = null;
    let lowestHpPct = 0.85;

    this.units.forEach(other => {
      if (other.team === u.team && other.id !== u.id && other.hp < other.maxHp * lowestHpPct) {
        const dist = Math.hypot(u.x - other.x, u.y - other.y);
        if (dist < 280) {
          woundedAlly = other;
          lowestHpPct = other.hp / other.maxHp;
        }
      }
    });

    if (woundedAlly) {
      const dist = Math.hypot(u.x - woundedAlly.x, u.y - woundedAlly.y);
      const angle = Math.atan2(woundedAlly.y - u.y, woundedAlly.x - u.x);
      u.heading = angle;

      if (dist > u.healRange * 0.7) {
        u.vx = Math.cos(angle) * u.speed;
        u.vy = Math.sin(angle) * u.speed;
      } else {
        u.vx *= 0.6;
        u.vy *= 0.6;
      }

      if (u.cooldown <= 0 && dist <= u.healRange) {
        woundedAlly.hp = Math.min(woundedAlly.maxHp, woundedAlly.hp + u.healAmount);
        u.cooldown = 1.0 / u.fireRate;
        sounds.playHeal();
        this.addFloatingText(woundedAlly.x, woundedAlly.y - 10, `+${u.healAmount} HP`, '#10b981');
      }
    } else {
      this.moveToTacticalObjective(u, dt);
    }
  }

  // Check if a direct line between two coordinates is clear of walls / obstacles
  hasLineOfSight(x1, y1, x2, y2) {
    if (!this.map.obstacles || this.map.obstacles.length === 0) return true;
    for (const obs of this.map.obstacles) {
      if (lineIntersectsBox(x1, y1, x2, y2, obs)) {
        return false; // Obstructed by wall/building!
      }
    }
    return true;
  }

  // Calculate intelligent steering waypoint around blocking obstacles
  getSteeringWaypoint(startX, startY, targetX, targetY, unitRadius = 8) {
    let blockingObs = null;
    let minObsDist = Infinity;

    for (const obs of this.map.obstacles) {
      if (lineIntersectsBox(startX, startY, targetX, targetY, obs)) {
        const obsCenterX = obs.x + obs.w / 2;
        const obsCenterY = obs.y + obs.h / 2;
        const d = Math.hypot(obsCenterX - startX, obsCenterY - startY);
        if (d < minObsDist) {
          minObsDist = d;
          blockingObs = obs;
        }
      }
    }

    if (!blockingObs) {
      return { x: targetX, y: targetY };
    }

    // Generate 4 obstacle corner waypoints with unit clearance buffer
    const buffer = unitRadius + 16;
    const corners = [
      { x: blockingObs.x - buffer, y: blockingObs.y - buffer },
      { x: blockingObs.x + blockingObs.w + buffer, y: blockingObs.y - buffer },
      { x: blockingObs.x + blockingObs.w + buffer, y: blockingObs.y + blockingObs.h + buffer },
      { x: blockingObs.x - buffer, y: blockingObs.y + blockingObs.h + buffer }
    ];

    let bestCorner = null;
    let bestDist = Infinity;

    for (const c of corners) {
      if (this.hasLineOfSight(startX, startY, c.x, c.y)) {
        const dTotal = Math.hypot(c.x - startX, c.y - startY) + Math.hypot(targetX - c.x, targetY - c.y);
        if (dTotal < bestDist) {
          bestDist = dTotal;
          bestCorner = c;
        }
      }
    }

    return bestCorner || { x: targetX, y: targetY };
  }

  updateCombatAI(u, dt) {
    if (u.empDisabledTimer > 0) {
      u.vx *= 0.8;
      u.vy *= 0.8;
      return;
    }

    // Manual player orders override
    if (u.manualOrder) {
      const dist = Math.hypot(u.manualOrder.x - u.x, u.manualOrder.y - u.y);
      if (dist > 18) {
        const wp = this.getSteeringWaypoint(u.x, u.y, u.manualOrder.x, u.manualOrder.y, u.radius);
        const angle = Math.atan2(wp.y - u.y, wp.x - u.x);
        const curSpeed = u.isSuppressed ? u.speed * 0.4 : u.speed;
        u.vx = Math.cos(angle) * curSpeed;
        u.vy = Math.sin(angle) * curSpeed;
        u.heading = angle;
      } else {
        u.manualOrder = null;
        u.vx *= 0.5;
        u.vy *= 0.5;
      }
      return;
    }

    // Stable Tactical Retreat: if health < 25%, withdraw for 3 seconds continuously
    if (u.hp < u.maxHp * 0.25 && !u.isVehicle) {
      if (u.retreatTimer <= 0) {
        u.retreatTimer = 3.0;
      }
    }

    if (u.retreatTimer > 0) {
      const myBase = this.map.bases[u.team];
      if (myBase) {
        const wp = this.getSteeringWaypoint(u.x, u.y, myBase.x, myBase.y, u.radius);
        const angle = Math.atan2(wp.y - u.y, wp.x - u.x);
        const curSpeed = u.isSuppressed ? u.speed * 0.4 : u.speed;
        u.vx = Math.cos(angle) * curSpeed * 0.85;
        u.vy = Math.sin(angle) * curSpeed * 0.85;
        u.heading = angle;
        return;
      }
    }

    // Find or preserve target with Line of Sight (LOS) check
    let target = null;

    // Check if previously locked target is still alive and has line of sight
    if (u.lockedTargetId) {
      const prevTarget = this.units.find(cand => cand.id === u.lockedTargetId && cand.hp > 0 && cand.team !== u.team);
      if (prevTarget) {
        const d = Math.hypot(prevTarget.x - u.x, prevTarget.y - u.y);
        // Unit can only keep target if it has line of sight (not behind a solid wall!)
        if (d <= u.range * 1.8 && this.hasLineOfSight(u.x, u.y, prevTarget.x, prevTarget.y)) {
          target = { type: 'unit', ref: prevTarget, x: prevTarget.x, y: prevTarget.y, dist: d };
        } else {
          u.lockedTargetId = null; // Lost line of sight behind wall!
        }
      }
    }

    // If no target, scan for visible enemies (CANNOT see or target through walls!)
    if (!target) {
      let bestScore = Infinity;
      const visionRange = Math.max(300, u.range * 1.5);

      for (const enemy of this.units) {
        if (enemy.team === u.team || enemy.hp <= 0) continue;

        const dist = Math.hypot(enemy.x - u.x, enemy.y - u.y);
        if (dist > visionRange) continue;

        // CRITICAL: Barrier Line-of-Sight check!
        if (!this.hasLineOfSight(u.x, u.y, enemy.x, enemy.y)) continue;

        let priorityWeight = 1.0;
        if (u.type === 'bazooka' && enemy.isVehicle) priorityWeight = 0.3;
        if (u.type === 'sniper' && (enemy.isHealer || enemy.isCommander || enemy.type === 'hmg')) priorityWeight = 0.35;

        const score = dist * priorityWeight;
        if (score < bestScore) {
          bestScore = score;
          target = { type: 'unit', ref: enemy, x: enemy.x, y: enemy.y, dist };
          u.lockedTargetId = enemy.id;
        }
      }
    }

    // Check enemy bases if no visible units
    if (!target) {
      u.lockedTargetId = null;
      let bestBaseScore = Infinity;
      Object.keys(TEAMS).forEach(k => {
        if (k !== u.team && this.teamState[k].nexusAlive) {
          const base = this.map.bases[k];
          if (base) {
            const dist = Math.hypot(base.x - u.x, base.y - u.y);
            if (dist < bestBaseScore) {
              bestBaseScore = dist;
              target = { type: 'base', teamKey: k, x: base.x, y: base.y, dist };
            }
          }
        }
      });
    }

    // Smart Tactical Cover Seeking:
    // If engaging an enemy and not in cover, seek nearby sandbags/trenches within 100px
    if (target && !u.inCover && !u.isVehicle) {
      let bestCoverZone = null;
      let bestCoverDist = 100;
      this.map.coverZones.forEach(cz => {
        const cx = cz.x + cz.w / 2;
        const cy = cz.y + cz.h / 2;
        const d = Math.hypot(cx - u.x, cy - u.y);
        if (d < bestCoverDist && this.hasLineOfSight(cx, cy, target.x, target.y)) {
          bestCoverDist = d;
          bestCoverZone = { x: cx, y: cy };
        }
      });
      if (bestCoverZone && bestCoverDist > 15) {
        const angle = Math.atan2(bestCoverZone.y - u.y, bestCoverZone.x - u.x);
        u.vx = Math.cos(angle) * u.speed * 0.9;
        u.vy = Math.sin(angle) * u.speed * 0.9;
        u.heading = angle;
      }
    }

    // Engage target or advance
    if (target) {
      const dist = target.dist;
      const hasClearShot = this.hasLineOfSight(u.x, u.y, target.x, target.y);

      // Only fire if within range AND has clear line of sight!
      if (dist <= u.range && hasClearShot) {
        const angle = Math.atan2(target.y - u.y, target.x - u.x);
        u.heading = angle;
        u.vx *= 0.6;
        u.vy *= 0.6;

        if (u.cooldown <= 0) {
          u.burstRemaining = u.burstCount;
          u.burstTimer = 0;
          const rateMult = (u.stimBuffTimer > 0 ? 1.5 : 1.0) * (u.isSuppressed ? 0.6 : 1.0);
          u.cooldown = (1.0 / (u.fireRate * rateMult));
          u.targetRef = target;
        }
      } else {
        // Wall in the way or out of range: steer around obstacles to get line of sight!
        const wp = this.getSteeringWaypoint(u.x, u.y, target.x, target.y, u.radius);
        const angle = Math.atan2(wp.y - u.y, wp.x - u.x);
        u.heading = angle;

        const curSpeed = u.isSuppressed ? u.speed * 0.4 : u.speed;
        u.vx = Math.cos(angle) * curSpeed;
        u.vy = Math.sin(angle) * curSpeed;
      }
    } else {
      this.moveToTacticalObjective(u, dt);
    }
  }

  moveToTacticalObjective(u, dt) {
    let nearestCp = null;
    let minCpDist = Infinity;
    this.controlPoints.forEach(cp => {
      if (cp.owner !== u.team) {
        const dist = Math.hypot(cp.x - u.x, cp.y - u.y);
        if (dist < minCpDist) {
          minCpDist = dist;
          nearestCp = cp;
        }
      }
    });

    let targetX = 700;
    let targetY = 450;

    if (nearestCp) {
      targetX = nearestCp.x;
      targetY = nearestCp.y;
    } else {
      const enemyBaseKey = Object.keys(TEAMS).find(k => k !== u.team && this.teamState[k].nexusAlive);
      if (enemyBaseKey && this.map.bases[enemyBaseKey]) {
        targetX = this.map.bases[enemyBaseKey].x;
        targetY = this.map.bases[enemyBaseKey].y;
      }
    }

    // Steer intelligently around obstacles toward objective
    const wp = this.getSteeringWaypoint(u.x, u.y, targetX, targetY, u.radius);
    const angle = Math.atan2(wp.y - u.y, wp.x - u.x);
    const curSpeed = u.isSuppressed ? u.speed * 0.4 : u.speed;
    u.vx = Math.cos(angle) * curSpeed * 0.85;
    u.vy = Math.sin(angle) * curSpeed * 0.85;
    u.heading = angle;
  }

  fireWeapon(u) {
    if (!u.targetRef) return;
    const target = u.targetRef;

    const proto = UNIT_TYPES[u.type];
    if (proto && proto.sound && sounds[proto.sound]) {
      sounds[proto.sound]();
    }

    const cmdDamageMult = u.commanderBuffTimer > 0 ? 1.25 : 1.0;
    const finalDamage = Math.round(u.damage * cmdDamageMult);

    if (u.type === 'bazooka' || u.type === 'tank') {
      this.projectiles.push({
        id: Math.random(),
        team: u.team,
        startX: u.x,
        startY: u.y,
        x: u.x,
        y: u.y,
        targetX: target.x + (Math.random() - 0.5) * 8,
        targetY: target.y + (Math.random() - 0.5) * 8,
        speed: u.type === 'bazooka' ? 280 : 420,
        damage: finalDamage,
        antiArmorMult: u.antiArmorMult,
        splashRadius: u.splashRadius,
        isRocket: u.type === 'bazooka',
        isShell: u.type === 'tank',
        color: TEAMS[u.team].hex
      });
    } else {
      // High-velocity bullet with active tracking target ID
      this.projectiles.push({
        id: Math.random(),
        team: u.team,
        startX: u.x,
        startY: u.y,
        x: u.x,
        y: u.y,
        targetX: target.x + (Math.random() - 0.5) * 6,
        targetY: target.y + (Math.random() - 0.5) * 6,
        targetUnitId: target.type === 'unit' && target.ref ? target.ref.id : null,
        targetType: target.type,
        targetTeamKey: target.teamKey,
        speed: 850,
        damage: finalDamage,
        suppression: proto.suppression || 0,
        isBullet: true,
        color: TEAMS[u.team].hex
      });
    }

    this.particles.push({
      x: u.x + Math.cos(u.heading) * (u.radius + 4),
      y: u.y + Math.sin(u.heading) * (u.radius + 4),
      vx: Math.cos(u.heading) * 30,
      vy: Math.sin(u.heading) * 30,
      radius: u.isVehicle ? 6 : 3.5,
      color: '#fbbf24',
      alpha: 1.0,
      life: 0.08
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (p.isRocket) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          radius: Math.random() * 3 + 2,
          color: '#94a3b8',
          alpha: 0.6,
          life: 0.2
        });
      }

      // Check collision with enemy units along flight path
      let hit = false;
      for (const u of this.units) {
        if (u.team !== p.team && u.hp > 0) {
          const d = Math.hypot(u.x - p.x, u.y - p.y);
          if (d <= u.radius + 6) {
            if (p.splashRadius > 0) {
              this.createExplosion(p.x, p.y, p.splashRadius, p.damage, p.team, p.antiArmorMult);
            } else {
              this.damageUnit(u, p.damage, p.team, p.suppression);
              this.createSparks(p.x, p.y, 3, u.isVehicle ? '#f59e0b' : '#ef4444');
            }
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Projectile reached target endpoint
      if (dist < p.speed * dt || dist < 12) {
        if (p.splashRadius > 0) {
          this.createExplosion(p.targetX, p.targetY, p.splashRadius, p.damage, p.team, p.antiArmorMult);
          this.screenShake = Math.max(this.screenShake, p.isShell ? 7 : 4);
        } else {
          // Resolve bullet hit at endpoint
          this.resolveBulletHit(p);
        }
        this.projectiles.splice(i, 1);
      } else {
        const step = p.speed * dt;
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;

        let blocked = false;
        for (const obs of this.map.obstacles) {
          if (p.x >= obs.x && p.x <= obs.x + obs.w && p.y >= obs.y && p.y <= obs.y + obs.h) {
            blocked = true;
            this.createSparks(p.x, p.y, 4, '#cbd5e1');
            break;
          }
        }
        if (blocked) {
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  resolveBulletHit(p) {
    // If targeted a specific unit and it's near
    if (p.targetUnitId) {
      const targetUnit = this.units.find(u => u.id === p.targetUnitId && u.hp > 0);
      if (targetUnit) {
        const d = Math.hypot(targetUnit.x - p.targetX, targetUnit.y - p.targetY);
        if (d <= 35) {
          this.damageUnit(targetUnit, p.damage, p.team, p.suppression);
          this.createSparks(targetUnit.x, targetUnit.y, 3, targetUnit.isVehicle ? '#f59e0b' : '#ef4444');
          return;
        }
      }
    }

    // Check hit on any enemy unit near endpoint
    let hitUnit = null;
    let minD = 24;

    for (const u of this.units) {
      if (u.team === p.team || u.hp <= 0) continue;
      const d = Math.hypot(u.x - p.targetX, u.y - p.targetY);
      if (d < u.radius + 12 && d < minD) {
        minD = d;
        hitUnit = u;
      }
    }

    if (hitUnit) {
      this.damageUnit(hitUnit, p.damage, p.team, p.suppression);
      this.createSparks(p.targetX, p.targetY, 3, hitUnit.isVehicle ? '#f59e0b' : '#ef4444');
      return;
    }

    // Check hit on enemy base
    Object.keys(TEAMS).forEach(k => {
      if (k !== p.team && this.teamState[k].nexusAlive) {
        const base = this.map.bases[k];
        if (base) {
          const d = Math.hypot(base.x - p.targetX, base.y - p.targetY);
          if (d <= base.radius + 10) {
            this.damageBase(k, p.damage, p.team);
          }
        }
      }
    });
  }

  damageUnit(u, rawDamage, attackerTeam, suppressionAmount = 0) {
    let finalDamage = rawDamage;
    if (u.inCover) {
      finalDamage = Math.round(finalDamage * 0.5);
      this.addFloatingText(u.x, u.y - 14, 'COVER RESIST', '#38bdf8');
    }

    const effectiveArmor = Math.max(0, u.armor);
    finalDamage = Math.max(3, Math.round(finalDamage * (100 / (100 + effectiveArmor))));

    u.hp -= finalDamage;

    if (suppressionAmount > 0) {
      u.suppression = Math.min(100, u.suppression + suppressionAmount * 35);
      if (u.suppression > 50 && !u.isSuppressed) {
        this.addFloatingText(u.x, u.y - 12, 'SUPPRESSED!', '#f87171');
      }
    }

    this.addFloatingText(u.x, u.y - 6, `-${finalDamage}`, '#fb7185');

    if (u.hp <= 0 && attackerTeam) {
      this.teamState[attackerTeam].kills++;
      this.teamState[attackerTeam].credits += Math.round(UNIT_TYPES[u.type]?.cost * 0.35 || 25);
    }
  }

  damageBase(teamKey, rawDamage, attackerTeam) {
    const team = this.teamState[teamKey];
    if (!team || !team.nexusAlive) return;

    team.nexusHp -= rawDamage;
    team.underAttackTimer = 3.5;
    sounds.playNexusAlarm();

    this.addFloatingText(this.map.bases[teamKey].x, this.map.bases[teamKey].y - 20, `BASE -${rawDamage}`, '#f43f5e');

    if (team.nexusHp <= 0) {
      team.nexusHp = 0;
      team.nexusAlive = false;
      this.screenShake = 22;
      sounds.playExplosion();

      const base = this.map.bases[teamKey];
      this.createExplosion(base.x, base.y, 80, 0, attackerTeam);
      this.craters.push({ x: base.x, y: base.y, radius: 45, color: '#18181b' });

      this.addFloatingText(base.x, base.y - 40, `${TEAMS[teamKey].name.toUpperCase()} NEXUS DESTROYED!`, '#ef4444', 32);
      this.addFloatingText(base.x, base.y - 15, 'FINAL STAND - NO RESPAWNS', '#f59e0b', 22);

      if (this.onEvent) {
        this.onEvent({
          type: 'NEXUS_DESTROYED',
          team: teamKey,
          message: `${TEAMS[teamKey].name}'s Nexus destroyed! Faction in final stand.`
        });
      }
    }
  }

  updateBaseTurrets(dt) {
    Object.keys(TEAMS).forEach(k => {
      const team = this.teamState[k];
      if (!team.nexusAlive) return;

      const turretLevel = team.upgrades.nexusDefense;
      if (turretLevel <= 0) return;

      team.turretCooldown = Math.max(0, team.turretCooldown - dt);
      if (team.turretCooldown <= 0) {
        const base = this.map.bases[k];
        const defenseRange = base.radius + 150;
        let intruder = null;
        for (const u of this.units) {
          if (u.team !== k && u.hp > 0) {
            const d = Math.hypot(u.x - base.x, u.y - base.y);
            if (d <= defenseRange) {
              intruder = u;
              break;
            }
          }
        }

        if (intruder) {
          team.turretCooldown = 0.7;
          this.projectiles.push({
            id: Math.random(),
            team: k,
            startX: base.x,
            startY: base.y,
            x: base.x,
            y: base.y,
            targetX: intruder.x,
            targetY: intruder.y,
            speed: 700,
            damage: 28 + turretLevel * 10,
            isBullet: true,
            color: TEAMS[k].hex
          });
          sounds.playRifle();
        }
      }
    });
  }

  createExplosion(x, y, radius, damage, attackerTeam, antiArmorMult = 1.0) {
    sounds.playExplosion();

    this.units.forEach(u => {
      if (u.team !== attackerTeam && u.hp > 0) {
        const d = Math.hypot(u.x - x, u.y - y);
        if (d <= radius) {
          const falloff = 1 - (d / radius) * 0.5;
          let blastDmg = Math.round(damage * falloff);
          if (u.isVehicle) blastDmg = Math.round(blastDmg * antiArmorMult);
          this.damageUnit(u, blastDmg, attackerTeam, 1.0);

          const angle = Math.atan2(u.y - y, u.x - x);
          const push = (1 - d / radius) * 90;
          u.vx += Math.cos(angle) * push;
          u.vy += Math.sin(angle) * push;
        }
      }
    });

    Object.keys(TEAMS).forEach(k => {
      if (k !== attackerTeam && this.teamState[k].nexusAlive) {
        const base = this.map.bases[k];
        if (base) {
          const d = Math.hypot(base.x - x, base.y - y);
          if (d <= radius + base.radius) {
            this.damageBase(k, Math.round(damage * antiArmorMult * 0.75), attackerTeam);
          }
        }
      }
    });

    this.craters.push({ x, y, radius: radius * 0.45, color: '#1a1917' });
    if (this.craters.length > 50) this.craters.shift();

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 110 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 6 + 3,
        color: i % 2 === 0 ? '#f97316' : '#ef4444',
        alpha: 1.0,
        life: Math.random() * 0.35 + 0.2
      });
    }
  }

  applyUnitMovement(u, dt) {
    // Integrate velocity with smooth damping
    u.x += u.vx * dt * 45;
    u.y += u.vy * dt * 45;

    // Gradual drag damping
    u.vx *= 0.88;
    u.vy *= 0.88;

    // Boundaries
    u.x = Math.max(u.radius + 6, Math.min(this.map.width - u.radius - 6, u.x));
    u.y = Math.max(u.radius + 6, Math.min(this.map.height - u.radius - 6, u.y));

    // Obstacle collision resolution
    this.map.obstacles.forEach(obs => {
      const closestX = Math.max(obs.x, Math.min(u.x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(u.y, obs.y + obs.h));

      const dx = u.x - closestX;
      const dy = u.y - closestY;
      const dist = Math.hypot(dx, dy);

      if (dist < u.radius && dist > 0) {
        const overlap = u.radius - dist;
        u.x += (dx / dist) * overlap;
        u.y += (dy / dist) * overlap;
        u.vx *= 0.5;
        u.vy *= 0.5;
      }
    });

    // Friendly soft separation
    for (const other of this.units) {
      if (other.id !== u.id) {
        const dx = u.x - other.x;
        const dy = u.y - other.y;
        const dist = Math.hypot(dx, dy);
        const minDist = u.radius + other.radius + 3;
        if (dist < minDist && dist > 0) {
          const push = (minDist - dist) * 0.12;
          u.x += (dx / dist) * push;
          u.y += (dy / dist) * push;
        }
      }
    }
  }

  createBloodOrDebris(x, y, isVehicle) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 70,
        vy: (Math.random() - 0.5) * 70,
        radius: isVehicle ? Math.random() * 3.5 + 2 : Math.random() * 2 + 1.5,
        color: isVehicle ? '#cbd5e1' : '#b91c1c',
        alpha: 0.9,
        life: 0.4
      });
    }
  }

  createSparks(x, y, count, color = '#facc15') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        radius: Math.random() * 2 + 1,
        color,
        alpha: 1.0,
        life: 0.18
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffffff', fontSize = 13) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1.0,
      life: 1.1
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life * 2.2);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 24;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.1);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  checkMatchStatus() {
    Object.keys(TEAMS).forEach(k => {
      const team = this.teamState[k];
      if (!team.nexusAlive && !this.eliminatedTeams.has(k)) {
        const remainingUnits = this.units.filter(u => u.team === k).length;
        if (remainingUnits === 0) {
          this.eliminatedTeams.add(k);
          this.addFloatingText(700, 450, `FACTION ${TEAMS[k].name.toUpperCase()} ELIMINATED!`, TEAMS[k].hex, 28);
          if (this.onEvent) {
            this.onEvent({
              type: 'TEAM_ELIMINATED',
              team: k,
              message: `${TEAMS[k].name} completely eliminated!`
            });
          }
        }
      }
    });

    const standingTeams = Object.keys(TEAMS).filter(k => !this.eliminatedTeams.has(k));
    if (standingTeams.length === 1 && !this.winner) {
      this.winner = standingTeams[0];
      sounds.playWinPayout();
      if (this.onEvent) {
        this.onEvent({
          type: 'MATCH_VICTORY',
          winner: this.winner,
          message: `${TEAMS[this.winner].name} CONQUERED THE SANDBOX!`
        });
      }
    }
  }
}
