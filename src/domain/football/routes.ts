// ═══════════════════════════════════════════════════════════════════════════
// ROUTE LIBRARY - Comprehensive football route definitions
// ═══════════════════════════════════════════════════════════════════════════

export type DepthRange = { min: number; max: number };

export type LevelDepths = {
  youth: DepthRange; // 12–18 y/o simplified
  nfl: DepthRange;   // full-size field, pro landmarks
};

// Position groups for route assignment
export type PositionGroup = 'WR' | 'WR-Outside' | 'WR-Slot' | 'TE' | 'RB' | 'Any';

// Route families by timing/concept
export type RouteFamily = 'quick' | 'intermediate' | 'deep' | 'screen' | 'backfield' | 'double-move' | 'choice';

// Route trees for organizational grouping
export type RouteTree = 'wr-outside' | 'wr-slot' | 'te' | 'rb' | 'any';

export type RouteDef = {
  id: string;                         // canonical key, never changes
  label: string;                      // primary name: "Curl"
  positionGroup: PositionGroup;
  family: RouteFamily;
  tree?: RouteTree;                   // which route tree this belongs to
  side: 'inside' | 'outside' | 'slot' | 'backfield' | 'any';
  depth: LevelDepths;
  notesYouth: string;
  notesNFL: string;
  aliases?: string[];                 // "speed out", "hook", etc.
  tags?: string[];                    // ["break-out","three-step","red-zone"]
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TREE METADATA
// ═══════════════════════════════════════════════════════════════════════════

export type RouteTreeMeta = {
  id: RouteTree;
  name: string;
  shortName: string;
  description: string;
  positionGroups: PositionGroup[];
};

export const ROUTE_TREES: RouteTreeMeta[] = [
  {
    id: 'wr-outside',
    name: 'WR Outside Route Tree',
    shortName: 'Outside',
    description: 'Routes for X and Z receivers (split ends)',
    positionGroups: ['WR', 'WR-Outside'],
  },
  {
    id: 'wr-slot',
    name: 'WR Slot Route Tree',
    shortName: 'Slot',
    description: 'Routes for slot receivers and inside WRs',
    positionGroups: ['WR', 'WR-Slot'],
  },
  {
    id: 'te',
    name: 'TE Route Tree',
    shortName: 'TE',
    description: 'Tight end routes from inline or flexed alignments',
    positionGroups: ['TE', 'Any'],
  },
  {
    id: 'rb',
    name: 'RB Route Tree',
    shortName: 'RB',
    description: 'Running back routes from backfield',
    positionGroups: ['RB'],
  },
];

export const ROUTE_LIBRARY: RouteDef[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // VERTICAL / GO FAMILY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'go',
    label: 'Go',
    positionGroup: 'Any',
    family: 'deep',
    side: 'any',
    depth: {
      youth: { min: 14, max: 18 },
      nfl: { min: 18, max: 40 },
    },
    notesYouth: 'Run fast, stay on your line, look for ball around 15–18 yds.',
    notesNFL: 'Vertical release. Landmarks vs. press/soft; adjust to coverage.',
    aliases: ['Streak', 'Fly', '9'],
    tags: ['vertical', 'deep']
  },
  {
    id: 'fade_outside',
    label: 'Fade (Outside)',
    positionGroup: 'WR',
    family: 'deep',
    side: 'outside',
    depth: {
      youth: { min: 12, max: 18 },
      nfl: { min: 18, max: 35 },
    },
    notesYouth: 'Outside release, fade to sideline; expect ball high and outside.',
    notesNFL: 'Outside release, stack or widen. Red-zone back-shoulder friendly.',
    aliases: ['Back-shoulder Fade'],
    tags: ['vertical', 'sideline', 'red-zone']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK GAME – SLANT / HITCH / OUT / IN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'slant',
    label: 'Slant',
    positionGroup: 'WR',
    family: 'quick',
    side: 'any',
    depth: {
      youth: { min: 3, max: 5 },
      nfl: { min: 5, max: 6 },
    },
    notesYouth: "Three steps then 45° inside, cross LB's face.",
    notesNFL: '3-step or now step; inside at 3–5 yds, flatten vs. zone.',
    aliases: ['1-step Slant'],
    tags: ['quick', 'inside', 'RPO']
  },
  {
    id: 'speed_out',
    label: 'Speed Out',
    positionGroup: 'WR',
    family: 'quick',
    side: 'outside',
    depth: {
      youth: { min: 4, max: 6 },
      nfl: { min: 5, max: 6 },
    },
    notesYouth: 'Five yards then break flat to sideline.',
    notesNFL: '3-step or 5-step timing from outside. Stay flat to sideline.',
    aliases: ['Quick Out'],
    tags: ['quick', 'out', 'sideline']
  },
  {
    id: 'hitch',
    label: 'Hitch',
    positionGroup: 'WR',
    family: 'quick',
    side: 'any',
    depth: {
      youth: { min: 4, max: 6 },
      nfl: { min: 5, max: 6 },
    },
    notesYouth: 'Run to 5 yards, stop, turn back to QB.',
    notesNFL: 'Vertical push to 5–6, sit down and work back to ball.',
    aliases: ['Stop', 'Hook'],
    tags: ['quick', 'stop']
  },
  {
    id: 'quick_in',
    label: 'Quick In',
    positionGroup: 'WR',
    family: 'quick',
    side: 'any',
    depth: {
      youth: { min: 4, max: 6 },
      nfl: { min: 5, max: 6 },
    },
    notesYouth: 'Five yards then 90° cut inside.',
    notesNFL: 'Quick in / jerk vs. man or zone, sharp 90° break.',
    aliases: ['Quick Dig'],
    tags: ['quick', 'inside']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERMEDIATE OUT / IN / CURL / DIG / COMEBACK / CORNER / POST
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'curl_10',
    label: 'Curl (10)',
    positionGroup: 'WR',
    family: 'intermediate',
    side: 'any',
    depth: {
      youth: { min: 8, max: 10 },
      nfl: { min: 10, max: 12 },
    },
    notesYouth: 'Push to 10 yards, turn back to QB.',
    notesNFL: 'Vertical to 10–12, drop hips and work back downhill.',
    aliases: ['Hook'],
    tags: ['inside', 'stop']
  },
  {
    id: 'curl_14',
    label: 'Curl (14)',
    positionGroup: 'WR',
    family: 'intermediate',
    side: 'any',
    depth: {
      youth: { min: 10, max: 12 },
      nfl: { min: 14, max: 15 },
    },
    notesYouth: 'Deeper curl for older kids or big cushions.',
    notesNFL: 'Deeper stem vs. soft zone; 14–15 and back to ball.',
    tags: ['inside', 'stop', 'vs-zone']
  },
  {
    id: 'dig_12',
    label: 'Dig (In 12–15)',
    positionGroup: 'WR',
    family: 'intermediate',
    side: 'any',
    depth: {
      youth: { min: 10, max: 12 },
      nfl: { min: 12, max: 15 },
    },
    notesYouth: 'Run 10–12 yards then hard in across field.',
    notesNFL: '12–15 yard in; flatten vs. middle closed, sit vs. zone.',
    aliases: ['Basic', 'Square In'],
    tags: ['inside', 'cross-field']
  },
  {
    id: 'corner_12',
    label: 'Corner',
    positionGroup: 'WR',
    family: 'intermediate',
    side: 'any',
    depth: {
      youth: { min: 10, max: 12 },
      nfl: { min: 12, max: 14 },
    },
    notesYouth: '10–12 yards, break 45° to back pylon.',
    notesNFL: '12–14 vertical then 45° to sideline/deep third.',
    tags: ['deep-out', 'sideline']
  },
  {
    id: 'post_12',
    label: 'Post',
    positionGroup: 'WR',
    family: 'deep',
    side: 'any',
    depth: {
      youth: { min: 10, max: 14 },
      nfl: { min: 12, max: 18 },
    },
    notesYouth: '10–14 then angle to goalpost.',
    notesNFL: '12–18, inside lean; landmark varies vs. MOFC/MOFO.',
    tags: ['deep', 'middle']
  },
  {
    id: 'comeback_15',
    label: 'Comeback (15)',
    positionGroup: 'WR',
    family: 'deep',
    side: 'outside',
    depth: {
      youth: { min: 12, max: 14 },
      nfl: { min: 15, max: 15 },
    },
    notesYouth: 'Run hard to 12–14, plant and come back to sideline.',
    notesNFL: 'Vertical to 15, hard outside break back to sideline.',
    tags: ['deep', 'sideline', 'timing']
  },
  {
    id: 'comeback_18_20',
    label: 'Comeback (18–20)',
    positionGroup: 'WR',
    family: 'deep',
    side: 'outside',
    depth: {
      youth: { min: 14, max: 16 },
      nfl: { min: 18, max: 20 },
    },
    notesYouth: 'Use only for strong older kids or big cushions.',
    notesNFL: 'Big-boy comeback vs. off coverage; timing and arm strength.',
    tags: ['deep', 'sideline', 'arm-talent']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG / CROSS FAMILY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'shallow_drag',
    label: 'Shallow Drag',
    positionGroup: 'Any',
    family: 'quick',
    side: 'any',
    depth: {
      youth: { min: 2, max: 4 },
      nfl: { min: 3, max: 5 },
    },
    notesYouth: 'Cross field behind LB depth, stay running.',
    notesNFL: 'Cross at 3–5 yds; vs. man keep running, vs. zone sit in window.',
    aliases: ['Shallow Cross'],
    tags: ['underneath', 'vs-man']
  },
  {
    id: 'intermediate_over',
    label: 'Over Route',
    positionGroup: 'WR',
    family: 'intermediate',
    side: 'any',
    depth: {
      youth: { min: 8, max: 12 },
      nfl: { min: 12, max: 18 },
    },
    notesYouth: 'Deeper cross behind LBs, in front of safeties.',
    notesNFL: 'Crosser behind hook/curl defenders; adjust vs. MOFC/MOFO.',
    tags: ['cross-field', 'vs-boot']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOUBLE MOVES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sluggo',
    label: 'Sluggo (Slant & Go)',
    positionGroup: 'WR',
    family: 'double-move',
    side: 'any',
    depth: {
      youth: { min: 10, max: 18 },
      nfl: { min: 14, max: 30 },
    },
    notesYouth: 'Sell slant for 3–5 yds, then turn upfield.',
    notesNFL: 'Full slant stem, re-accelerate vertical. Great vs. aggressive CB.',
    tags: ['double-move', 'shot-play']
  },
  {
    id: 'hitch_go',
    label: 'Hitch & Go',
    positionGroup: 'WR',
    family: 'double-move',
    side: 'any',
    depth: {
      youth: { min: 10, max: 18 },
      nfl: { min: 14, max: 30 },
    },
    notesYouth: 'Show hitch at 5, then turn and sprint.',
    notesNFL: 'Sell hitch with eyes and hands, then climb vertical.',
    tags: ['double-move']
  },
  {
    id: 'post_corner',
    label: 'Post-Corner',
    positionGroup: 'WR',
    family: 'double-move',
    side: 'any',
    depth: {
      youth: { min: 12, max: 16 },
      nfl: { min: 14, max: 20 },
    },
    notesYouth: 'Angle toward goalpost, then break back to corner.',
    notesNFL: 'Sell post hard, then snap head/shoulders to corner.',
    tags: ['double-move', 'red-zone']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SLOT / WHIP / PIVOT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'whip',
    label: 'Whip / Pivot',
    positionGroup: 'WR',
    family: 'quick',
    side: 'slot',
    depth: {
      youth: { min: 3, max: 5 },
      nfl: { min: 3, max: 5 },
    },
    notesYouth: 'Sell shallow in, then whip back out.',
    notesNFL: 'Inside jab, pivot back out vs. man / choice vs. zone.',
    tags: ['man-beater', 'change-direction']
  },
  {
    id: 'option_choice',
    label: 'Option / Choice',
    positionGroup: 'WR',
    family: 'choice',
    side: 'slot',
    depth: {
      youth: { min: 4, max: 6 },
      nfl: { min: 5, max: 8 },
    },
    notesYouth: 'Simple version: sit vs. zone, slant vs. man.',
    notesNFL: 'Read leverage/space; convert to slant, out, sit, or seam.',
    tags: ['read-route', 'advanced']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREENS – WR & RB
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'wr_bubble',
    label: 'Bubble Screen',
    positionGroup: 'WR',
    family: 'screen',
    side: 'slot',
    depth: {
      youth: { min: -2, max: 2 },   // at or behind LOS
      nfl: { min: -2, max: 2 },
    },
    notesYouth: 'Bubble back behind LOS, catch and get upfield.',
    notesNFL: 'Flat or slight backward bubble; timing with OL/RB blocks.',
    tags: ['screen', 'RPO']
  },
  {
    id: 'wr_now',
    label: 'Now Screen',
    positionGroup: 'WR',
    family: 'screen',
    side: 'outside',
    depth: {
      youth: { min: 0, max: 1 },
      nfl: { min: 0, max: 1 },
    },
    notesYouth: 'Take one step, turn and catch immediately.',
    notesNFL: 'Look-now or gift throw vs. soft corner.',
    tags: ['screen', 'access']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RB ROUTES – FLAT / SWING / ANGLE / WHEEL / CHECK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rb_flat',
    label: 'Flat (RB)',
    positionGroup: 'RB',
    family: 'backfield',
    side: 'any',
    depth: {
      youth: { min: 1, max: 3 },
      nfl: { min: 1, max: 3 },
    },
    notesYouth: 'Release to flat at 1–3 yds, eyes around quickly.',
    notesNFL: 'Fast to the flat; landmark midway between numbers and sideline.',
    tags: ['checkdown', 'sideline']
  },
  {
    id: 'rb_swing',
    label: 'Swing',
    positionGroup: 'RB',
    family: 'backfield',
    side: 'any',
    depth: {
      youth: { min: 0, max: 3 },
      nfl: { min: 0, max: 4 },
    },
    notesYouth: 'Bubble behind LOS and out, catch on the move.',
    notesNFL: 'Wheel-like arc behind QB, aiming for width; good vs. man.',
    tags: ['checkdown', 'screen-ish']
  },
  {
    id: 'rb_angle',
    label: 'Angle / Texas',
    positionGroup: 'RB',
    family: 'backfield',
    side: 'any',
    depth: {
      youth: { min: 4, max: 6 },
      nfl: { min: 5, max: 7 },
    },
    notesYouth: 'Start to flat, then cut back inside over ball.',
    notesNFL: 'Sell swing, plant, cross face of LB; catch between hashes.',
    aliases: ['Texas'],
    tags: ['inside', 'man-beater']
  },
  {
    id: 'rb_wheel',
    label: 'Wheel (RB)',
    positionGroup: 'RB',
    family: 'deep',
    side: 'any',
    depth: {
      youth: { min: 10, max: 18 },
      nfl: { min: 14, max: 25 },
    },
    notesYouth: 'Flat then turn up sideline.',
    notesNFL: 'Flat to numbers, then vertical up sideline vs. LB.',
    tags: ['shot-play', 'sideline']
  },
  {
    id: 'rb_check_release',
    label: 'Check-Release',
    positionGroup: 'RB',
    family: 'backfield',
    side: 'any',
    depth: {
      youth: { min: 0, max: 5 },
      nfl: { min: 0, max: 5 },
    },
    notesYouth: 'Look for blitz first, then leak to flat.',
    notesNFL: 'Scan protection, then outlet to flat/hook.',
    tags: ['protection', 'checkdown']
  },
  {
    id: 'rb_middle_screen',
    label: 'Middle Screen',
    positionGroup: 'RB',
    family: 'screen',
    side: 'backfield',
    depth: {
      youth: { min: -1, max: 4 },
      nfl: { min: -1, max: 5 },
    },
    notesYouth: 'Let rush come, then slide inside OL and catch.',
    notesNFL: 'Delay, then release inside with OL escorts.',
    tags: ['screen', 'timing']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RB ROUTES – EAGLES ROUTE TREE
  // Advanced RB route concepts with zone/man reads
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rb_wide',
    label: 'Wide',
    positionGroup: 'RB',
    family: 'screen',
    side: 'any',
    depth: {
      youth: { min: -1, max: 0 },
      nfl: { min: -1, max: 0 },
    },
    notesYouth: 'Check wide outside the numbers. Quick catch at or behind LOS.',
    notesNFL: 'Check wide outside of #\'s (Flat responsible). Lose a yard. Quick access route.',
    aliases: ['Wide Check'],
    tags: ['checkdown', 'flat', 'quick-access']
  },
  {
    id: 'rb_flat_eagles',
    label: 'Flat (Speed)',
    positionGroup: 'RB',
    family: 'backfield',
    side: 'any',
    depth: {
      youth: { min: 2, max: 4 },
      nfl: { min: 3, max: 5 },
    },
    notesYouth: 'Get to flat fast, work outside while gaining yards.',
    notesNFL: 'Go to flat NOW, gain width with depth. End at 3-5 yards. Get there fast.',
    aliases: ['Speed Flat'],
    tags: ['flat', 'checkdown', 'sideline']
  },
  {
    id: 'rb_spat',
    label: 'Spat',
    positionGroup: 'RB',
    family: 'choice',
    side: 'any',
    depth: {
      youth: { min: 3, max: 4 },
      nfl: { min: 4, max: 5 },
    },
    notesYouth: 'Curl up at 4-5 yards outside the TE. Sit vs zone.',
    notesNFL: 'Curl responsible v. zone – Sit 4-5 yards, 1 yard outside TE. v. Man = flat.',
    aliases: ['Spat Route', 'Spot'],
    tags: ['zone-read', 'curl', 'option']
  },
  {
    id: 'rb_middle_option',
    label: 'Middle Op',
    positionGroup: 'RB',
    family: 'choice',
    side: 'backfield',
    depth: {
      youth: { min: 3, max: 4 },
      nfl: { min: 4, max: 4 },
    },
    notesYouth: 'Push 4 yards inside. Stop vs zone, keep running vs man.',
    notesNFL: '4 yard inside option route. Sit v. zone, run v. man. Work inside the tackles.',
    aliases: ['Middle Option', 'Inside Option'],
    tags: ['option', 'inside', 'zone-read']
  },
  {
    id: 'rb_rail',
    label: 'Rail',
    positionGroup: 'RB',
    family: 'deep',
    side: 'any',
    depth: {
      youth: { min: 12, max: 18 },
      nfl: { min: 15, max: 25 },
    },
    notesYouth: 'Run straight up the sideline. No reads, just go.',
    notesNFL: 'No read wheel route. Must stay on move. Used with Mesh/Pivot/Mixer concepts.',
    aliases: ['Rail Route', 'Speed Wheel'],
    tags: ['vertical', 'sideline', 'no-read', 'shot-play']
  },
  {
    id: 'rb_spin',
    label: 'Spin',
    positionGroup: 'RB',
    family: 'choice',
    side: 'backfield',
    depth: {
      youth: { min: 3, max: 4 },
      nfl: { min: 4, max: 4 },
    },
    notesYouth: 'Push 4 yards then burst toward the ball. Sit vs zone.',
    notesNFL: 'Push up 4 yards, burst in toward ball. Sit v. zone (Tackle area), run v. man.',
    aliases: ['Spin Route'],
    tags: ['option', 'inside', 'zone-read', 'tackle-area']
  },
  {
    id: 'rb_blow',
    label: 'Blow/Brees/Gust',
    positionGroup: 'RB',
    family: 'choice',
    side: 'any',
    depth: {
      youth: { min: 3, max: 5 },
      nfl: { min: 5, max: 5 },
    },
    notesYouth: 'Outside release, push to 5 yards. Sit vs zone, run vs man.',
    notesNFL: 'Outside release trash, push vertical to 5, sit v. zone, run v. man. If hot = flat now.',
    aliases: ['Brees', 'Gust', 'Blow Route'],
    tags: ['option', 'outside-release', 'hot-read', 'zone-read']
  },
  {
    id: 'rb_wheel_landmark',
    label: 'Wheel (Landmark)',
    positionGroup: 'RB',
    family: 'deep',
    tree: 'rb',
    side: 'any',
    depth: {
      youth: { min: 8, max: 10 },
      nfl: { min: 8, max: 10 },
    },
    notesYouth: 'Get to the sideline landmark at 8-10 yards. Read the LB.',
    notesNFL: 'Get to "Red Line" landmark, stop at 8-10 yards. LB underneath = run, LB over top = Stop.',
    aliases: ['Landmark Wheel', 'Read Wheel'],
    tags: ['wheel', 'read-route', 'sideline', 'lb-read']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TE / SLOT ROUTE TREE (Eagles)
  // Routes for tight ends and slot receivers
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'te_cross_hash_mofc',
    label: 'Cross Hash (MOFC)',
    positionGroup: 'TE',
    family: 'deep',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 14, max: 18 }, nfl: { min: 18, max: 22 } },
    notesYouth: 'Post route to the far hash. Run to the hash marks.',
    notesNFL: 'Post to far hash vs Middle of Field Closed. Attack the single high safety.',
    aliases: ['Hash Post'],
    tags: ['post', 'mofc', 'deep', 'seam']
  },
  {
    id: 'te_cross_hash_mofo',
    label: 'Cross Hash (MOFO)',
    positionGroup: 'TE',
    family: 'deep',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 14, max: 18 }, nfl: { min: 18, max: 22 } },
    notesYouth: 'Post route splitting the safeties.',
    notesNFL: 'Post splitting safeties vs Middle of Field Open. Find the window.',
    aliases: ['Split Post'],
    tags: ['post', 'mofo', 'deep', 'split-safety']
  },
  {
    id: 'te_seam_sit',
    label: 'Seam-Sit',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Push vertical on seam, sit vs zone coverage.',
    notesNFL: 'Vertical seam, sit at 12-16 vs zone. vs Man = keep running.',
    aliases: ['Seam Read'],
    tags: ['seam', 'zone-read', 'option']
  },
  {
    id: 'te_switch_seam_sit',
    label: 'Switch Seam-Sit',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Motion into seam, sit vs zone.',
    notesNFL: 'Switch/motion release into seam. Sit vs zone at 12-16.',
    aliases: ['Motion Seam'],
    tags: ['seam', 'motion', 'zone-read']
  },
  {
    id: 'te_line',
    label: 'Line',
    positionGroup: 'TE',
    family: 'intermediate',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 8, max: 12 }, nfl: { min: 10, max: 14 } },
    notesYouth: 'Run straight across field at intermediate depth.',
    notesNFL: 'Cross field at 10-14 yards. Stay on the line, find windows vs zone.',
    aliases: ['Cross', 'Drive'],
    tags: ['cross', 'intermediate', 'vs-zone']
  },
  {
    id: 'te_middle_read',
    label: 'Middle Read',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Read the middle linebacker and find open grass.',
    notesNFL: 'Read MLB - sit inside vs zone, break away from man.',
    aliases: ['Read'],
    tags: ['option', 'read-route', 'middle']
  },
  {
    id: 'te_flag',
    label: 'Flag',
    positionGroup: 'TE',
    family: 'deep',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 12, max: 16 }, nfl: { min: 15, max: 20 } },
    notesYouth: 'Corner route to the flag/pylon.',
    notesNFL: 'Stem vertical 10-12, break to corner at 45°. Target back pylon.',
    aliases: ['Corner', '7 Route'],
    tags: ['corner', 'deep', 'sideline']
  },
  {
    id: 'te_corner_post',
    label: 'Corner-Post',
    positionGroup: 'TE',
    family: 'double-move',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 14, max: 18 }, nfl: { min: 16, max: 22 } },
    notesYouth: 'Fake corner, then break back to post.',
    notesNFL: 'Sell corner at 12-14, snap to post. Great vs Cover 2/4.',
    aliases: ['7-8'],
    tags: ['double-move', 'post', 'cover-2-beater']
  },
  {
    id: 'te_flag_stop',
    label: 'Flag-Stop',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Start corner route, stop and come back.',
    notesNFL: 'Stem to corner, stop at 12-16 and work back to sideline.',
    aliases: ['Flag Comeback'],
    tags: ['corner', 'comeback', 'sideline']
  },
  {
    id: 'te_nod',
    label: 'Nod',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 6, max: 10 }, nfl: { min: 8, max: 12 } },
    notesYouth: 'Head fake one way, break the other.',
    notesNFL: 'Nod/head fake inside, break outside (or vice versa). Read coverage.',
    aliases: ['Head Fake'],
    tags: ['option', 'fake', 'man-beater']
  },
  {
    id: 'te_corner',
    label: 'Corner (TE)',
    positionGroup: 'TE',
    family: 'intermediate',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 10, max: 12 }, nfl: { min: 12, max: 14 } },
    notesYouth: 'Break to corner of end zone.',
    notesNFL: 'Standard corner route at 12-14. Good vs Cover 3.',
    tags: ['corner', 'intermediate', 'cover-3-beater']
  },
  {
    id: 'te_basic',
    label: 'Basic/Dig',
    positionGroup: 'TE',
    family: 'intermediate',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 10, max: 12 }, nfl: { min: 12, max: 15 } },
    notesYouth: 'Push vertical then break inside.',
    notesNFL: 'Stem 10-12, hard 90° inside. Flatten vs zone.',
    aliases: ['Square In', 'Dig'],
    tags: ['in', 'intermediate', 'dig']
  },
  {
    id: 'te_drag',
    label: 'Drag',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 3, max: 5 }, nfl: { min: 4, max: 6 } },
    notesYouth: 'Run across field under the linebackers.',
    notesNFL: 'Shallow cross at 4-6 yards. Stay running vs man, sit vs zone.',
    aliases: ['Shallow', 'Under'],
    tags: ['shallow', 'cross', 'quick']
  },
  {
    id: 'te_turn',
    label: 'Turn',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 5, max: 7 }, nfl: { min: 6, max: 8 } },
    notesYouth: 'Push 5-7 yards, turn and face the QB.',
    notesNFL: 'Turn route at 6-8. Sit in zone window, work back to QB.',
    aliases: ['Turn Around'],
    tags: ['quick', 'turn', 'zone-sit']
  },
  {
    id: 'te_banana',
    label: 'Banana',
    positionGroup: 'TE',
    family: 'intermediate',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 8, max: 12 }, nfl: { min: 10, max: 14 } },
    notesYouth: 'Curved route bending to the outside.',
    notesNFL: 'Arcing out-breaking route. Bends to sideline at 10-14.',
    aliases: ['Bend'],
    tags: ['out', 'curved', 'intermediate']
  },
  {
    id: 'te_otb',
    label: 'OTB (Over the Ball)',
    positionGroup: 'TE',
    family: 'intermediate',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 8, max: 12 }, nfl: { min: 10, max: 14 } },
    notesYouth: 'Cross over the ball to the other side.',
    notesNFL: 'Over the ball crosser. Find window between LBs.',
    aliases: ['Over'],
    tags: ['cross', 'over', 'intermediate']
  },
  {
    id: 'te_jerk',
    label: 'Jerk',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 4, max: 6 }, nfl: { min: 5, max: 7 } },
    notesYouth: 'Sharp jerk move inside.',
    notesNFL: 'Quick inside jerk at 5-7 yards. Sharp break.',
    aliases: ['Jerk In'],
    tags: ['quick', 'inside', 'sharp-break']
  },
  {
    id: 'te_stick',
    label: 'Stick',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 5, max: 6 }, nfl: { min: 5, max: 6 } },
    notesYouth: 'Push 5-6 yards and stop.',
    notesNFL: 'Stick at 5-6 yards. High percentage throw vs zone.',
    aliases: ['Stop'],
    tags: ['quick', 'stop', 'high-percentage']
  },
  {
    id: 'te_juke',
    label: 'Juke',
    positionGroup: 'TE',
    family: 'choice',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 5, max: 8 }, nfl: { min: 6, max: 10 } },
    notesYouth: 'Juke one way, break the other.',
    notesNFL: 'Juke inside, break outside (or opposite). Read defender.',
    aliases: ['Option'],
    tags: ['option', 'choice', 'man-beater']
  },
  {
    id: 'te_center',
    label: 'Center',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 5, max: 8 }, nfl: { min: 6, max: 10 } },
    notesYouth: 'Settle in the middle of the field.',
    notesNFL: 'Center field settle route. Find window between LBs.',
    aliases: ['Middle'],
    tags: ['quick', 'middle', 'zone-sit']
  },
  {
    id: 'te_strike',
    label: 'Strike',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 4, max: 6 }, nfl: { min: 5, max: 7 } },
    notesYouth: 'Quick strike inside.',
    notesNFL: 'Quick inside strike at 5-7. Sharp angle break.',
    aliases: ['Quick Strike'],
    tags: ['quick', 'inside', 'slant']
  },
  {
    id: 'te_drive',
    label: 'Drive',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 6, max: 8 }, nfl: { min: 7, max: 10 } },
    notesYouth: 'Drive route inside.',
    notesNFL: 'Drive inside at 7-10. Push through the zone.',
    aliases: ['In Drive'],
    tags: ['quick', 'inside', 'drive']
  },
  {
    id: 'te_shallow',
    label: 'Shallow',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'inside',
    depth: { youth: { min: 2, max: 4 }, nfl: { min: 3, max: 5 } },
    notesYouth: 'Shallow cross under linebackers.',
    notesNFL: 'Shallow cross at 3-5 yards. Stay running vs man.',
    aliases: ['Shallow Cross'],
    tags: ['shallow', 'cross', 'underneath']
  },
  {
    id: 'te_park',
    label: 'Park',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'any',
    depth: { youth: { min: 4, max: 6 }, nfl: { min: 5, max: 7 } },
    notesYouth: 'Park and sit in open space.',
    notesNFL: 'Park in zone window at 5-7 yards. Find grass.',
    aliases: ['Sit'],
    tags: ['quick', 'zone-sit', 'settle']
  },
  {
    id: 'te_arrow',
    label: 'Arrow',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 2, max: 4 }, nfl: { min: 3, max: 5 } },
    notesYouth: 'Arrow to the flat.',
    notesNFL: 'Arrow release to flat at 3-5 yards.',
    aliases: ['Flat'],
    tags: ['flat', 'quick', 'outside']
  },
  {
    id: 'te_slam_arrow',
    label: 'Slam Arrow',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 2, max: 4 }, nfl: { min: 3, max: 5 } },
    notesYouth: 'Block then release to flat (3 count).',
    notesNFL: 'Chip/slam for 3 count then arrow to flat.',
    aliases: ['Chip Arrow'],
    tags: ['flat', 'protection', 'delay']
  },
  {
    id: 'te_slam_sideview',
    label: 'Slam Sideview',
    positionGroup: 'TE',
    family: 'quick',
    tree: 'te',
    side: 'outside',
    depth: { youth: { min: 3, max: 5 }, nfl: { min: 4, max: 6 } },
    notesYouth: 'Block then release outside (5 count).',
    notesNFL: 'Slam for 5 count then release to sideline.',
    aliases: ['Chip Release'],
    tags: ['flat', 'protection', 'delay']
  },
  {
    id: 'te_skim',
    label: 'Skim',
    positionGroup: 'TE',
    family: 'screen',
    tree: 'te',
    side: 'backfield',
    depth: { youth: { min: -2, max: 2 }, nfl: { min: -2, max: 3 } },
    notesYouth: 'Slip behind the line for screen.',
    notesNFL: 'Skim action behind LOS for screen/slip.',
    aliases: ['Slip Screen'],
    tags: ['screen', 'backfield', 'slip']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WR OUTSIDE ROUTE TREE (Eagles)
  // Routes for X and Z (split end) receivers
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'wr_jet',
    label: 'Jet',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 16, max: 25 }, nfl: { min: 20, max: 40 } },
    notesYouth: 'Straight vertical go route.',
    notesNFL: 'Pure vertical. Win at the line and stack the DB.',
    aliases: ['Go', 'Fly', '9'],
    tags: ['vertical', 'deep', 'speed']
  },
  {
    id: 'wr_home_run',
    label: 'Home Run',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 16, max: 25 }, nfl: { min: 20, max: 40 } },
    notesYouth: 'Deep post for a big play.',
    notesNFL: 'Deep post targeting the middle of the field. Big play route.',
    aliases: ['Post', 'Shot'],
    tags: ['post', 'deep', 'big-play']
  },
  {
    id: 'wr_shake',
    label: 'Shake',
    positionGroup: 'WR-Outside',
    family: 'double-move',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 14, max: 20 }, nfl: { min: 18, max: 30 } },
    notesYouth: 'Stutter step then go deep.',
    notesNFL: 'Shake/stutter at 5-7, then vertical. Freezes press coverage.',
    aliases: ['Stutter Go'],
    tags: ['double-move', 'vertical', 'press-beater']
  },
  {
    id: 'wr_thick',
    label: 'Thick',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 12, max: 16 }, nfl: { min: 15, max: 18 } },
    notesYouth: 'Deep out route with width.',
    notesNFL: 'Deep out at 15-18 yards. Get width to sideline.',
    aliases: ['Deep Out', 'Comeback'],
    tags: ['out', 'deep', 'sideline']
  },
  {
    id: 'wr_lunch_go',
    label: 'Lunch & Go',
    positionGroup: 'WR-Outside',
    family: 'double-move',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 14, max: 20 }, nfl: { min: 18, max: 30 } },
    notesYouth: 'Fake the stop route then go deep.',
    notesNFL: 'Sell hitch/stop at 5, then explode vertical.',
    aliases: ['Hitch & Go', 'Stop & Go'],
    tags: ['double-move', 'vertical']
  },
  {
    id: 'wr_thin',
    label: 'Thin',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 12, max: 18 }, nfl: { min: 16, max: 25 } },
    notesYouth: 'Skinny post, not as sharp.',
    notesNFL: 'Skinny/thin post. Less angle than standard post.',
    aliases: ['Skinny Post'],
    tags: ['post', 'deep', 'skinny']
  },
  {
    id: 'wr_orbit',
    label: 'Orbit',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 12, max: 16 }, nfl: { min: 15, max: 20 } },
    notesYouth: 'Corner route to the sideline.',
    notesNFL: 'Corner/orbit route at 15-20. Break to sideline.',
    aliases: ['Corner', '7'],
    tags: ['corner', 'deep', 'sideline']
  },
  {
    id: 'wr_hook',
    label: 'Hook',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 8, max: 10 }, nfl: { min: 10, max: 12 } },
    notesYouth: 'Run 10 yards and hook back to QB.',
    notesNFL: 'Hook at 10-12. Settle in zone, work back to ball.',
    aliases: ['Curl'],
    tags: ['curl', 'hook', 'intermediate']
  },
  {
    id: 'wr_skinny',
    label: 'Skinny',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 12, max: 18 }, nfl: { min: 16, max: 25 } },
    notesYouth: 'Skinny post between safeties.',
    notesNFL: 'Skinny post splitting safeties. Subtle inside lean.',
    aliases: ['Skinny Post', 'Thin'],
    tags: ['post', 'deep', 'seam']
  },
  {
    id: 'wr_slant_outside',
    label: 'Slant',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 4, max: 6 }, nfl: { min: 5, max: 7 } },
    notesYouth: '3 steps then break inside.',
    notesNFL: '3-step slant. Quick inside break at 5-7.',
    aliases: ['3-Step'],
    tags: ['slant', 'quick', 'inside']
  },
  {
    id: 'wr_lunch',
    label: 'Lunch',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 5, max: 6 }, nfl: { min: 5, max: 6 } },
    notesYouth: 'Quick stop/hitch route.',
    notesNFL: 'Hitch/lunch at 5-6 yards. Timing throw.',
    aliases: ['Hitch', 'Stop'],
    tags: ['hitch', 'quick', 'timing']
  },
  {
    id: 'wr_scout',
    label: 'Scout',
    positionGroup: 'WR-Outside',
    family: 'choice',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 5, max: 8 }, nfl: { min: 6, max: 10 } },
    notesYouth: 'Read the defender and react.',
    notesNFL: 'Option route - read coverage and break accordingly.',
    aliases: ['Read', 'Option'],
    tags: ['option', 'choice', 'read-route']
  },
  {
    id: 'wr_snap',
    label: 'Snap',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 3, max: 5 }, nfl: { min: 4, max: 6 } },
    notesYouth: 'Quick snap out to the sideline.',
    notesNFL: 'Quick out/snap at 4-6 yards. Sharp break to sideline.',
    aliases: ['Quick Out', 'Speed Out'],
    tags: ['out', 'quick', 'sideline']
  },
  {
    id: 'wr_1_step',
    label: '1 Step',
    positionGroup: 'WR-Outside',
    family: 'screen',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 0, max: 1 }, nfl: { min: 0, max: 1 } },
    notesYouth: 'One step and catch.',
    notesNFL: 'One-step screen/now throw. Immediate delivery.',
    aliases: ['Now', 'Flash'],
    tags: ['screen', 'quick', 'now']
  },
  {
    id: 'wr_shallow_cross',
    label: 'Shallow Cross',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 3, max: 5 }, nfl: { min: 4, max: 6 } },
    notesYouth: 'Cross shallow under the linebackers.',
    notesNFL: 'Shallow cross at 4-6. Drive concept. Stay running.',
    aliases: ['Drive', 'Under'],
    tags: ['shallow', 'cross', 'underneath']
  },
  {
    id: 'wr_switch_seam',
    label: 'Switch Seam',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 14, max: 20 }, nfl: { min: 18, max: 25 } },
    notesYouth: 'Cross into the seam.',
    notesNFL: 'Switch/cross release into seam. Attack between safeties.',
    aliases: ['Seam Switch'],
    tags: ['seam', 'deep', 'switch']
  },
  {
    id: 'wr_chief',
    label: 'Chief',
    positionGroup: 'WR-Outside',
    family: 'deep',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 16, max: 20 }, nfl: { min: 18, max: 22 } },
    notesYouth: 'Deep comeback to the sideline.',
    notesNFL: 'Deep comeback at 18-22. Come back to sideline.',
    aliases: ['Comeback'],
    tags: ['comeback', 'deep', 'sideline']
  },
  {
    id: 'wr_deep_in',
    label: 'Deep In',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 14, max: 18 }, nfl: { min: 16, max: 20 } },
    notesYouth: 'Deep crossing route.',
    notesNFL: 'Deep in at 16-20 yards. Find space behind LBs.',
    aliases: ['Deep Dig', 'Deep Cross'],
    tags: ['in', 'deep', 'cross']
  },
  {
    id: 'wr_comet',
    label: 'Comet',
    positionGroup: 'WR-Outside',
    family: 'double-move',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 14, max: 18 }, nfl: { min: 16, max: 22 } },
    notesYouth: 'Double-move to corner.',
    notesNFL: 'Double-move - sell in/post then break to corner.',
    aliases: ['Post-Corner'],
    tags: ['double-move', 'corner']
  },
  {
    id: 'wr_curl_outside',
    label: 'Curl',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Push vertical then curl back.',
    notesNFL: 'Curl at 12-16. Come back to the ball vs zone.',
    aliases: ['Hook', 'Comeback'],
    tags: ['curl', 'intermediate']
  },
  {
    id: 'wr_in',
    label: 'In',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Push vertical then break inside.',
    notesNFL: 'In route at 12-16. Sharp 90° break.',
    aliases: ['Dig', 'Square In'],
    tags: ['in', 'intermediate', 'dig']
  },
  {
    id: 'wr_stow_mars',
    label: 'Stow/Mars',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'outside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Intermediate out route.',
    notesNFL: 'Out at 12-16 yards. Stow = sit, Mars = keep running.',
    aliases: ['Out', 'Sail'],
    tags: ['out', 'intermediate', 'sideline']
  },
  {
    id: 'wr_basic_outside',
    label: 'Basic',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 10, max: 14 }, nfl: { min: 12, max: 16 } },
    notesYouth: 'Standard in-breaking route.',
    notesNFL: 'Basic in/dig at 12-16. Clean break inside.',
    aliases: ['Dig'],
    tags: ['in', 'intermediate', 'basic']
  },
  {
    id: 'wr_switch_sit',
    label: 'Switch Sit',
    positionGroup: 'WR-Outside',
    family: 'choice',
    tree: 'wr-outside',
    side: 'inside',
    depth: { youth: { min: 8, max: 12 }, nfl: { min: 10, max: 14 } },
    notesYouth: 'Cross and sit in zone.',
    notesNFL: 'Switch release, sit at 10-14 vs zone.',
    aliases: ['Sit'],
    tags: ['zone-sit', 'switch', 'option']
  },
  {
    id: 'wr_venus',
    label: 'Venus',
    positionGroup: 'WR-Outside',
    family: 'intermediate',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 8, max: 12 }, nfl: { min: 10, max: 14 } },
    notesYouth: 'Option route concept.',
    notesNFL: 'Venus route - option at 10-14 based on coverage.',
    aliases: ['Option'],
    tags: ['option', 'intermediate']
  },
  {
    id: 'wr_mercury',
    label: 'Mercury',
    positionGroup: 'WR-Outside',
    family: 'choice',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 6, max: 10 }, nfl: { min: 8, max: 12 } },
    notesYouth: 'Quick option route.',
    notesNFL: 'Mercury - quick option at 8-12. Read and react.',
    aliases: ['Quick Option'],
    tags: ['option', 'quick', 'choice']
  },
  {
    id: 'wr_joker',
    label: 'Joker',
    positionGroup: 'WR-Outside',
    family: 'choice',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 6, max: 10 }, nfl: { min: 8, max: 12 } },
    notesYouth: 'Multiple option route.',
    notesNFL: 'Joker - multiple options based on coverage look.',
    aliases: ['Choice'],
    tags: ['option', 'choice', 'multiple']
  },
  {
    id: 'wr_hitch_outside',
    label: 'Hitch',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 5, max: 6 }, nfl: { min: 5, max: 6 } },
    notesYouth: 'Quick stop at 5-6 yards.',
    notesNFL: 'Hitch at 5-6. Timing throw. Work back to ball.',
    aliases: ['Stop'],
    tags: ['hitch', 'quick', 'timing']
  },
  {
    id: 'wr_bar',
    label: 'Bar',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 5, max: 8 }, nfl: { min: 6, max: 10 } },
    notesYouth: 'Settle in the zone window.',
    notesNFL: 'Bar - settle in zone window at 6-10.',
    aliases: ['Settle'],
    tags: ['zone-sit', 'quick', 'settle']
  },
  {
    id: 'wr_fog',
    label: 'Fog',
    positionGroup: 'WR-Outside',
    family: 'quick',
    tree: 'wr-outside',
    side: 'any',
    depth: { youth: { min: 4, max: 7 }, nfl: { min: 5, max: 8 } },
    notesYouth: 'Zone sit route.',
    notesNFL: 'Fog - zone sit concept at 5-8 yards. Find window.',
    aliases: ['Zone Sit'],
    tags: ['zone-sit', 'quick', 'settle']
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER TYPES & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type AssignedRoute = {
  routeId: string;        // references ROUTE_LIBRARY.id
  customDepth?: number;   // optional override
};

// Get all unique route families
export const ROUTE_FAMILIES = [...new Set(ROUTE_LIBRARY.map(r => r.family))] as const;

// Get all unique tags across all routes
export const ALL_ROUTE_TAGS = [...new Set(ROUTE_LIBRARY.flatMap(r => r.tags ?? []))];

// Helper to find a route definition by ID
export function findRouteDefById(id: string): RouteDef | undefined {
  return ROUTE_LIBRARY.find(r => r.id === id);
}

// Helper to get route definitions by family
export function filterRouteDefsByFamily(family: RouteFamily): RouteDef[] {
  return ROUTE_LIBRARY.filter(r => r.family === family);
}

// Helper to get route definitions by position group
export function filterRouteDefsByPosition(positionGroup: PositionGroup): RouteDef[] {
  return ROUTE_LIBRARY.filter(r => 
    r.positionGroup === positionGroup || 
    r.positionGroup === 'Any' ||
    (positionGroup === 'WR' && (r.positionGroup === 'WR-Outside' || r.positionGroup === 'WR-Slot'))
  );
}

// Helper to get route definitions by tree
export function filterRouteDefsByTree(tree: RouteTree): RouteDef[] {
  return ROUTE_LIBRARY.filter(r => r.tree === tree);
}

// Helper to get route tree metadata by ID
export function getRouteTreeMeta(tree: RouteTree): RouteTreeMeta | undefined {
  return ROUTE_TREES.find(t => t.id === tree);
}

// Helper to get depth range for a given level
export function getDepthForLevel(route: RouteDef, level: 'youth' | 'nfl' = 'nfl'): DepthRange {
  return route.depth[level];
}

// Helper to search route definitions by name, aliases, or tags
export function searchRouteDefs(query: string): RouteDef[] {
  const lowerQuery = query.toLowerCase();
  return ROUTE_LIBRARY.filter(r => 
    r.label.toLowerCase().includes(lowerQuery) ||
    r.family.toLowerCase().includes(lowerQuery) ||
    r.aliases?.some(a => a.toLowerCase().includes(lowerQuery)) ||
    r.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

// Helper to get route count by tree
export function getRouteCountByTree(): Record<RouteTree, number> {
  const counts: Record<string, number> = {};
  for (const tree of ROUTE_TREES) {
    counts[tree.id] = ROUTE_LIBRARY.filter(r => r.tree === tree.id).length;
  }
  // Add routes without a tree assigned
  counts['any'] = ROUTE_LIBRARY.filter(r => !r.tree).length;
  return counts as Record<RouteTree, number>;
}