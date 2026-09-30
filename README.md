# Frontline Sandbox — Tactical Field Manual

**Frontline Sandbox** is a military-grade 2D tactical battle simulator that synthesizes the squad combat mechanics and cover dynamics of *Company of Heroes* with the 4-team Nexus base destruction and generator economy of *Bedwars*.

---

## 🎖️ Core Gameplay Systems

### 1. Bedwars-Style 4-Faction Nexus Economy
- **4 Distinct Factions**:
  - 🔴 **Crimson Legion**: High-aggression shock assault squads and heavy artillery.
  - 🔵 **Cobalt Vanguard**: Disciplined defensive tactics with fortified ballistic armor.
  - 🟢 **Verdant Corps**: Agile marksmen, guerrilla snipers, and flanking infiltrators.
  - 🟡 **Solar Syndicate**: Mechanized corporate war machine with high fire-rate weapons.
- **Nexus Base & Elimination Rules**:
  - Each faction begins with a fortified Nexus Base (1,800 HP).
  - While the Nexus is alive, the faction automatically generates resources ($8/sec base + captured point yields) and continuously trains combat reinforcements.
  - When a faction's Nexus is destroyed, sirens wail, auto-production halts, and the team enters **Final Stand** (Elimination Mode).
  - When all remaining forces of a dead-nexus faction are wiped out, that faction is officially eliminated!
- **Resource Control Points (Generators)**:
  - Neutral capture points scattered across the battlefield (Diamond Core, Gold Depositories, Iron Mines).
  - Step into their capture radius with squads to neutralize and claim them.
  - Generates bonus credits straight into your team's war chest.

---

### 2. Company of Heroes-Style Tactical Combat

#### Barrier Line-of-Sight (LOS) & Wall Raycasting
- **Solid Obstacles & Buildings Block Sight & Fire**: The AI calculates real-time ray-AABB line-of-sight using the Liang-Barsky algorithm. Units **cannot see, target, or fire through solid walls, ruined buildings, or bulkheads**.
- **Intelligent Corner Steering**: When navigating around walls or advancing towards enemies, the AI automatically calculates waypoints around obstacle corners to flank around barriers rather than bumping into walls.
- **Dynamic Cover Seeking**: Infantry under fire actively detect nearby sandbags or trenches (within 100px) that offer cover from enemy line of fire, maneuvering behind them before returning fire.

#### Cover Mechanics
- Units stationed behind **Sandbag Barricades** or inside **Trenches** gain an active `🛡️ IN COVER` status, reducing all incoming bullet damage by **50%**.

#### Cursor Map Dragging & Radar Navigation
- **Smooth Cursor Dragging**: Click and drag with your cursor anywhere on the battlefield to smoothly pan across the map (with dynamic grab/grabbing cursor states).
- **Interactive Corner Radar Navigator**: A persistent tactical radar overlay on the top-right allows you to click or drag anywhere on the minimap to instantly jump your camera to that exact sector.
- **WASD / Arrow Key Panning**: Use `W`, `A`, `S`, `D` or the arrow keys to pan the battlefield, and press `C` to re-center the view.
- **Tactical Right-Click Orders**: Select squads and right-click anywhere to issue movement or attack orders.
- Sustained fire from **Heavy Machine Gunners (HMG)** or near-miss explosive blasts fills an infantry unit's suppression meter.
- When suppressed, units are **PINNED**: movement speed drops by 60%, weapon fire rate drops by 50%, and units crawl until suppression decays.

#### Tactical AI Behaviors
- **Threat-Prioritized Targeting**: Rocket Bazookas automatically prioritize enemy armored vehicles and bases; Snipers pick off officers and medics; Medics automatically sprint to triage wounded allies.
- **Low-Health Tactical Retreat**: Critical squads (HP < 25%) withdraw towards cover or friendly positions.
- **Squad Separation**: Realistic steering behaviors prevent unit clustering.
- **Direct Tactical Command**: Click or drag-select squads, then **Right-Click** anywhere on the map to issue manual movement or attack-move orders!

---

### 3. Unit Catalog (3 Distinct Tiers)

| Tier | Unit | Cost | Role & Special Abilities |
|---|---|---|---|
| **Tier 1: Infantry** | **Rifleman** | $50 | Balanced mainline soldier. Fast capture speed and reliable rifle fire. |
| **Tier 1: Infantry** | **SMG Infiltrator** | $75 | High-speed flanking squad with 3-round burst submachine gun fire. |
| **Tier 2: Specialists** | **Ghost Sniper** | $130 | Long-range assassin (250px range, 96% accuracy, 90 dmg). |
| **Tier 2: Specialists** | **Heavy Gunner (HMG)** | $150 | High fire-rate suppressive fire specialist. Pins enemy infantry down. |
| **Tier 2: Specialists** | **Rocket Specialist (HEAT)** | $160 | Anti-armor bazooka. Deals 2.5× damage to vehicles and nexus bases. |
| **Tier 2: Specialists** | **Combat Medic** | $120 | Battlefield triage. Beams healing pulses restoring +20 HP per pulse. |
| **Tier 3: Heavy & Command** | **Recon Armored Scout** | $260 | Wheeled combat vehicle. Heavy bullet resistance (18 Armor), twin machine guns. |
| **Tier 3: Heavy & Command** | **Main Battle Tank** | $450 | Armored juggernaut (680 HP, 35 Armor) firing 88mm high-explosive shells. |
| **Tier 3: Heavy & Command** | **Field Commander** | $320 | Battlefield officer with a 160px command aura granting allies +25% DMG and +8 Armor. |

---

### 4. Commander God Powers

- **Airstrike Barrage** ($150): Calls in high-altitude bombers to drop a carpet of cluster bombs.
- **Tactical EMP Strike** ($120): Emits an electromagnetic pulse disabling enemy weapons and vehicles for 6 seconds.
- **Paratrooper Squad** ($200): Air-drops 3 Riflemen and 1 Bazooka directly into designated coordinates.
- **Nano-Repair & Stim Overdrive** ($140): Instantly restores all allies in radius to 100% HP with a 50% fire rate boost.
- **Orbital Particle Cannon** ($350): Searing satellite laser beam vaporizes all units in its path.

---

### 5. Battlefield Wagering (Betting System)
- Start with a **$1,000 Commander Bankroll**.
- Real-time odds dynamically calculated based on live Nexus HP, active army net worth, and upgrades.
- Wager on any faction (Red, Blue, Green, Yellow), whether you are commanding them, controlling another team, or running hands-off simulations.
- Winning payouts are settled automatically when a faction conquers the sandbox, celebrated with confetti and audio fanfare!

---

### 6. Armory Tech Upgrades
1. **Tungsten Munitions**: Up to +54% unit damage (+18%/lvl).
2. **Reinforced Ballistic Plating**: Up to +75% HP and +15 Armor (+25%/lvl).
3. **Automated Resource Drills**: Up to +105% resource income (+35%/lvl).
4. **Nexus Defense Auto-Turrets**: Adds +1,200 Nexus HP and twin auto-firing base laser turrets.
5. **Combat Adrenaline Stims**: Up to +60% unit movement speed.

---

### 7. Maps & Battlegrounds
- **Crossfire Ruins**: Urban ruined plaza with concrete obstacles, sandbag cover, and a central Diamond Core.
- **Bunker Trenches**: Muddy frontline trench networks, anti-tank obstacles, and reinforced pillboxes.
- **Desert Canyon Outpost**: Canyon choke points, rocky mesas, and strategic petroleum derricks.
- **Neo-Island Quadrant**: 4 quadrant island bases connected by tactical bridges and central power reactor.

---

## 🕹️ Controls Quick Reference

- **Left-Click on Canvas**: Deploy selected unit or target Commander Power.
- **Left-Click + Drag**: Box-select squads.
- **Right-Click on Canvas**: Issue move / attack orders to selected squads.
- **Mouse Wheel**: Zoom camera in / out.
- **Shift + Drag** / **Middle-Click Drag**: Pan camera across the battlefield.
- **Spacebar**: Toggle Simulation Pause / Play.
- **B**: Open Tactical Betting & Wagers.
- **S**: Open Tech Upgrades Armory.
- **I**: Toggle Live Radar & Battlefield Intel.
- **Esc**: Clear active power target reticle or close modals.
