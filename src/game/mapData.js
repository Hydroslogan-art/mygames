// Battlefield Map Data and Terrain Layouts for Frontline Sandbox

export const MAPS = [
  {
    id: 'crossfire_ruins',
    name: 'Crossfire Ruins',
    theme: 'urban',
    width: 1400,
    height: 900,
    description: 'Shattered city square with concrete barricades, urban choke points, and a contested central Diamond Plaza.',
    bgColor: '#0c101d',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    bases: {
      red: { x: 140, y: 140, radius: 45, maxHp: 1800 },
      blue: { x: 1260, y: 760, radius: 45, maxHp: 1800 },
      green: { x: 140, y: 760, radius: 45, maxHp: 1800 },
      yellow: { x: 1260, y: 140, radius: 45, maxHp: 1800 }
    },
    resourcePoints: [
      { id: 'cp_center', name: 'Diamond Core', x: 700, y: 450, radius: 36, rate: 12, type: 'diamond' },
      { id: 'cp_north', name: 'North Iron Cache', x: 700, y: 200, radius: 28, rate: 6, type: 'iron' },
      { id: 'cp_south', name: 'South Iron Cache', x: 700, y: 700, radius: 28, rate: 6, type: 'iron' },
      { id: 'cp_west', name: 'West Gold Depository', x: 380, y: 450, radius: 28, rate: 8, type: 'gold' },
      { id: 'cp_east', name: 'East Gold Depository', x: 1020, y: 450, radius: 28, rate: 8, type: 'gold' }
    ],
    obstacles: [
      // Central plaza corner blocks
      { x: 580, y: 350, w: 50, h: 50, label: 'Building Ruins' },
      { x: 770, y: 350, w: 50, h: 50, label: 'Building Ruins' },
      { x: 580, y: 500, w: 50, h: 50, label: 'Building Ruins' },
      { x: 770, y: 500, w: 50, h: 50, label: 'Building Ruins' },
      // Quadrant partition walls
      { x: 320, y: 220, w: 30, h: 120, label: 'Concrete Wall' },
      { x: 1050, y: 220, w: 30, h: 120, label: 'Concrete Wall' },
      { x: 320, y: 560, w: 30, h: 120, label: 'Concrete Wall' },
      { x: 1050, y: 560, w: 30, h: 120, label: 'Concrete Wall' },
      // Outpost buildings
      { x: 480, y: 150, w: 90, h: 50, label: 'Depot' },
      { x: 830, y: 150, w: 90, h: 50, label: 'Depot' },
      { x: 480, y: 700, w: 90, h: 50, label: 'Depot' },
      { x: 830, y: 700, w: 90, h: 50, label: 'Depot' }
    ],
    coverZones: [
      // Sandbags / Low walls providing 50% damage reduction
      { x: 650, y: 370, w: 100, h: 14, type: 'sandbag' },
      { x: 650, y: 516, w: 100, h: 14, type: 'sandbag' },
      { x: 620, y: 400, w: 14, h: 100, type: 'sandbag' },
      { x: 766, y: 400, w: 14, h: 100, type: 'sandbag' },
      // Flanking barricades
      { x: 380, y: 360, w: 80, h: 14, type: 'sandbag' },
      { x: 380, y: 526, w: 80, h: 14, type: 'sandbag' },
      { x: 940, y: 360, w: 80, h: 14, type: 'sandbag' },
      { x: 940, y: 526, w: 80, h: 14, type: 'sandbag' }
    ]
  },

  {
    id: 'bunker_trenches',
    name: 'Bunker Trenches',
    theme: 'mud_trenches',
    width: 1400,
    height: 900,
    description: 'Grim trench warfare line with zigzagging trenches, reinforced pillboxes, and central No-Mans-Land.',
    bgColor: '#120f0b',
    gridColor: 'rgba(217, 119, 6, 0.05)',
    bases: {
      red: { x: 130, y: 450, radius: 45, maxHp: 1800 },
      blue: { x: 1270, y: 450, radius: 45, maxHp: 1800 },
      green: { x: 700, y: 800, radius: 45, maxHp: 1800 },
      yellow: { x: 700, y: 100, radius: 45, maxHp: 1800 }
    },
    resourcePoints: [
      { id: 'cp_bunker', name: 'Command Bunker', x: 700, y: 450, radius: 36, rate: 14, type: 'diamond' },
      { id: 'cp_nw_mortar', name: 'NW Ammo Dump', x: 400, y: 260, radius: 28, rate: 7, type: 'gold' },
      { id: 'cp_ne_mortar', name: 'NE Ammo Dump', x: 1000, y: 260, radius: 28, rate: 7, type: 'gold' },
      { id: 'cp_sw_mortar', name: 'SW Fuel Station', x: 400, y: 640, radius: 28, rate: 7, type: 'gold' },
      { id: 'cp_se_mortar', name: 'SE Fuel Station', x: 1000, y: 640, radius: 28, rate: 7, type: 'gold' }
    ],
    obstacles: [
      // Reinforced concrete pillboxes
      { x: 640, y: 390, w: 120, h: 40, label: 'Fortified Bunker' },
      { x: 640, y: 470, w: 120, h: 40, label: 'Fortified Bunker' },
      // Anti-tank teeth / obstacles
      { x: 300, y: 340, w: 40, h: 220, label: 'Tank Traps' },
      { x: 1060, y: 340, w: 40, h: 220, label: 'Tank Traps' },
      // Trench parapets
      { x: 500, y: 150, w: 40, h: 160, label: 'Heavy Pillbox' },
      { x: 860, y: 150, w: 40, h: 160, label: 'Heavy Pillbox' },
      { x: 500, y: 590, w: 40, h: 160, label: 'Heavy Pillbox' },
      { x: 860, y: 590, w: 40, h: 160, label: 'Heavy Pillbox' }
    ],
    coverZones: [
      // Deep trenches (offer heavy cover)
      { x: 420, y: 430, w: 140, h: 20, type: 'trench' },
      { x: 840, y: 430, w: 140, h: 20, type: 'trench' },
      { x: 680, y: 260, w: 20, h: 100, type: 'trench' },
      { x: 680, y: 540, w: 20, h: 100, type: 'trench' },
      { x: 520, y: 340, w: 80, h: 16, type: 'sandbag' },
      { x: 800, y: 340, w: 80, h: 16, type: 'sandbag' },
      { x: 520, y: 544, w: 80, h: 16, type: 'sandbag' },
      { x: 800, y: 544, w: 80, h: 16, type: 'sandbag' }
    ]
  },

  {
    id: 'desert_canyon',
    name: 'Desert Canyon Outpost',
    theme: 'desert',
    width: 1400,
    height: 900,
    description: 'Blistering rocky desert plateau with winding canyon passes and strategic petroleum derricks.',
    bgColor: '#17120a',
    gridColor: 'rgba(245, 158, 11, 0.05)',
    bases: {
      red: { x: 140, y: 140, radius: 45, maxHp: 1800 },
      blue: { x: 1260, y: 760, radius: 45, maxHp: 1800 },
      green: { x: 1260, y: 140, radius: 45, maxHp: 1800 },
      yellow: { x: 140, y: 760, radius: 45, maxHp: 1800 }
    },
    resourcePoints: [
      { id: 'cp_oasis', name: 'Central Refinery', x: 700, y: 450, radius: 36, rate: 12, type: 'diamond' },
      { id: 'cp_north_oil', name: 'North Oil Derrick', x: 700, y: 150, radius: 28, rate: 7, type: 'oil' },
      { id: 'cp_south_oil', name: 'South Oil Derrick', x: 700, y: 750, radius: 28, rate: 7, type: 'oil' },
      { id: 'cp_west_salvage', name: 'West Scrap Hub', x: 300, y: 450, radius: 28, rate: 6, type: 'iron' },
      { id: 'cp_east_salvage', name: 'East Scrap Hub', x: 1100, y: 450, radius: 28, rate: 6, type: 'iron' }
    ],
    obstacles: [
      // Mesa bluffs & rocky escarpments
      { x: 420, y: 240, w: 160, h: 80, label: 'Rocky Mesa' },
      { x: 820, y: 240, w: 160, h: 80, label: 'Rocky Mesa' },
      { x: 420, y: 580, w: 160, h: 80, label: 'Rocky Mesa' },
      { x: 820, y: 580, w: 160, h: 80, label: 'Rocky Mesa' },
      { x: 670, y: 340, w: 60, h: 60, label: 'Refinery Tower' },
      { x: 670, y: 500, w: 60, h: 60, label: 'Refinery Tower' }
    ],
    coverZones: [
      { x: 610, y: 440, w: 16, h: 80, type: 'sandbag' },
      { x: 774, y: 440, w: 16, h: 80, type: 'sandbag' },
      { x: 460, y: 340, w: 80, h: 14, type: 'sandbag' },
      { x: 860, y: 340, w: 80, h: 14, type: 'sandbag' },
      { x: 460, y: 546, w: 80, h: 14, type: 'sandbag' },
      { x: 860, y: 546, w: 80, h: 14, type: 'sandbag' }
    ]
  },

  {
    id: 'neo_islands',
    name: 'Neo-Island Quadrant',
    theme: 'islands',
    width: 1400,
    height: 900,
    description: 'Four fortified tactical islands separated by water moats, connected by narrow tactical bridges.',
    bgColor: '#07151f',
    gridColor: 'rgba(6, 182, 212, 0.05)',
    bases: {
      red: { x: 180, y: 180, radius: 45, maxHp: 1800 },
      blue: { x: 1220, y: 720, radius: 45, maxHp: 1800 },
      green: { x: 180, y: 720, radius: 45, maxHp: 1800 },
      yellow: { x: 1220, y: 180, radius: 45, maxHp: 1800 }
    },
    resourcePoints: [
      { id: 'cp_reactor', name: 'Sub-Zero Reactor', x: 700, y: 450, radius: 38, rate: 15, type: 'diamond' },
      { id: 'cp_bridge_w', name: 'West Causeway Hub', x: 440, y: 450, radius: 26, rate: 7, type: 'gold' },
      { id: 'cp_bridge_e', name: 'East Causeway Hub', x: 960, y: 450, radius: 26, rate: 7, type: 'gold' },
      { id: 'cp_bridge_n', name: 'North Pier Station', x: 700, y: 260, radius: 26, rate: 7, type: 'gold' },
      { id: 'cp_bridge_s', name: 'South Pier Station', x: 700, y: 640, radius: 26, rate: 7, type: 'gold' }
    ],
    obstacles: [
      // Water canal blocks & bulkhead barriers
      { x: 360, y: 0, w: 40, h: 360, label: 'Deep Water Canal' },
      { x: 360, y: 540, w: 40, h: 360, label: 'Deep Water Canal' },
      { x: 1000, y: 0, w: 40, h: 360, label: 'Deep Water Canal' },
      { x: 1000, y: 540, w: 40, h: 360, label: 'Deep Water Canal' },
      { x: 0, y: 430, w: 360, h: 40, label: 'Deep Water Canal' },
      { x: 1040, y: 430, w: 360, h: 40, label: 'Deep Water Canal' },
      { x: 540, y: 430, w: 100, h: 40, label: 'Bulkhead Shield' },
      { x: 760, y: 430, w: 100, h: 40, label: 'Bulkhead Shield' }
    ],
    coverZones: [
      { x: 670, y: 380, w: 60, h: 14, type: 'sandbag' },
      { x: 670, y: 506, w: 60, h: 14, type: 'sandbag' },
      { x: 440, y: 390, w: 14, h: 50, type: 'sandbag' },
      { x: 960, y: 390, w: 14, h: 50, type: 'sandbag' }
    ]
  }
];
