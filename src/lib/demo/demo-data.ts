// Hardcoded demo data for unauthenticated demo experience

export interface DemoFormation {
  id: string;
  formation_name: string;
  personnel?: string;
  description?: string;
  module: string;
  positions: Record<string, { x: number; y: number }>;
  coaching_notes: Record<string, string>;
  alignments: Record<string, { spot: string; detail: string }>;
  source_pdf_ids: string[];
}

export interface DemoDefender {
  id: string;
  x: number;
  y: number;
  label: string;
  rushing: boolean;
  blitz?: boolean;
  hot?: boolean;
  walked_up?: boolean;
  tb_read?: number;
}

export interface DemoProtectionScenario {
  id: string;
  coverage_name: string;
  coverage_type: string;
  protection_type: string;
  call_side: string;
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
  naked: boolean;
  hoss: boolean;
  scat_release: string | null;
  defensive_positions: Record<string, DemoDefender>;
  correct_block_target: string;
  explanation: string;
  coaching_notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO FORMATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_FORMATIONS: DemoFormation[] = [
  {
    id: "demo-shotgun-spread",
    formation_name: "Shotgun Spread",
    personnel: "10 Personnel (1 RB, 0 TE, 4 WR)",
    description: "Four-wide spread look with TB offset to the call side.",
    module: "Spread Concepts",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 2 },
      T: { x: 57, y: 1 },
      X: { x: 10, y: 5 },
      Z: { x: 90, y: 5 },
      R: { x: 70, y: 5 },
      H: { x: 30, y: 5 },
    },
    coaching_notes: {
      T: "Offset to call side, check LB to safety.",
      X: "Split wide to boundary, outside release.",
      Z: "Split wide to field.",
      R: "Slot field side, 1 yard off LOS.",
      H: "Slot boundary side, 1 yard off LOS.",
    },
    alignments: {
      T: { spot: "Offset right, 5 yards deep", detail: "Align to QB's right hip at shotgun depth. Eyes on MIKE then SAM." },
      X: { spot: "Wide left, on numbers", detail: "Bottom of numbers to the boundary. Outside release." },
      Z: { spot: "Wide right, on numbers", detail: "Bottom of numbers to the field. Stem inside." },
      R: { spot: "Slot right, +1 off LOS", detail: "3 yards outside RT. One yard off the line of scrimmage." },
      H: { spot: "Slot left, +1 off LOS", detail: "3 yards outside LT. One yard off the line of scrimmage." },
    },
    source_pdf_ids: [],
  },
  {
    id: "demo-trips-right",
    formation_name: "Trips Right",
    personnel: "11 Personnel (1 RB, 1 TE, 3 WR)",
    description: "Three receivers to the field with TE attached.",
    module: "Trips Concepts",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 2 },
      T: { x: 43, y: 1 },
      X: { x: 10, y: 5 },
      Y: { x: 62, y: 5 },
      Z: { x: 90, y: 5 },
      R: { x: 75, y: 5 },
    },
    coaching_notes: {
      T: "Offset left. Scan WILL then backside edge.",
      Y: "Attached tight end, inline to the right.",
      Z: "Split wide right, outside shade.",
      R: "Slot right between Y and Z.",
    },
    alignments: {
      T: { spot: "Offset left, 5 yards deep", detail: "Align to QB's left hip. First read is backside WILL, second is edge." },
      X: { spot: "Wide left, on numbers", detail: "Isolated to the boundary. Top of numbers." },
      Y: { spot: "Inline right, on LOS", detail: "Hand-in-dirt next to RT. On the line of scrimmage." },
      Z: { spot: "Wide right, on numbers", detail: "Bottom of numbers to the field." },
      R: { spot: "Slot right, between Y and Z", detail: "Midpoint between Y and Z, one yard off LOS." },
    },
    source_pdf_ids: [],
  },
  {
    id: "demo-i-formation",
    formation_name: "I-Formation",
    personnel: "21 Personnel (2 RB, 1 TE, 2 WR)",
    description: "Traditional I-formation with fullback lead.",
    module: "Under Center",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 4 },
      T: { x: 50, y: 0 },
      X: { x: 10, y: 5 },
      Y: { x: 62, y: 5 },
      Z: { x: 90, y: 5 },
      H: { x: 50, y: 2 },
    },
    coaching_notes: {
      T: "Deep back, 7 yards behind center. Follow FB's block.",
      H: "Fullback, 4 yards deep. Lead block or check release.",
      Y: "Inline TE, right side.",
    },
    alignments: {
      T: { spot: "I-back, 7 yards deep", detail: "Directly behind QB at 7 yards. Eyes up, follow the fullback's block path." },
      X: { spot: "Wide left, on numbers", detail: "Split wide to the boundary." },
      Y: { spot: "Inline right, on LOS", detail: "Attached tight end next to RT." },
      Z: { spot: "Wide right, on numbers", detail: "Split wide to the field." },
      H: { spot: "Fullback, 4 yards deep", detail: "Directly behind QB at 4 yards. Lead blocker on runs, check-release on pass." },
    },
    source_pdf_ids: [],
  },
  {
    id: "demo-pistol",
    formation_name: "Pistol",
    personnel: "11 Personnel (1 RB, 1 TE, 3 WR)",
    description: "Pistol alignment with TB directly behind QB.",
    module: "Pistol Concepts",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 3 },
      T: { x: 50, y: 1 },
      X: { x: 10, y: 5 },
      Y: { x: 38, y: 5 },
      Z: { x: 90, y: 5 },
      R: { x: 75, y: 5 },
    },
    coaching_notes: {
      T: "Directly behind QB, 4 yards deep. Read the playside DE.",
      Y: "Attached left, inline.",
    },
    alignments: {
      T: { spot: "Behind QB, 4 yards deep", detail: "Directly behind the QB in pistol depth. Can go either direction on zone reads." },
      X: { spot: "Wide left, on numbers", detail: "Split wide to the boundary." },
      Y: { spot: "Inline left, on LOS", detail: "Attached tight end next to LT. On the line." },
      Z: { spot: "Wide right, on numbers", detail: "Split wide to the field." },
      R: { spot: "Slot right, +1 off LOS", detail: "Slot receiver to the field, one yard off LOS." },
    },
    source_pdf_ids: [],
  },
  {
    id: "demo-empty",
    formation_name: "Empty",
    personnel: "10 Personnel (1 RB, 0 TE, 4 WR)",
    description: "Empty backfield — TB splits out as a receiver.",
    module: "Empty Concepts",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 2 },
      T: { x: 25, y: 5 },
      X: { x: 10, y: 5 },
      Z: { x: 90, y: 5 },
      R: { x: 75, y: 5 },
      H: { x: 35, y: 5 },
    },
    coaching_notes: {
      T: "Split out to boundary slot. You ARE a receiver here — run your route.",
      X: "Wide left, boundary.",
      H: "Slot left, between X and T.",
    },
    alignments: {
      T: { spot: "Boundary slot, on LOS", detail: "Lined up as a slot receiver to the boundary. Must know the route tree from this position." },
      X: { spot: "Wide left, on numbers", detail: "Bottom of numbers, boundary side." },
      Z: { spot: "Wide right, on numbers", detail: "Bottom of numbers, field side." },
      R: { spot: "Slot right, +1 off LOS", detail: "Field slot, one yard off LOS." },
      H: { spot: "Inner slot left, +1 off LOS", detail: "Between X and T, one yard off the LOS." },
    },
    source_pdf_ids: [],
  },
  {
    id: "demo-singleback",
    formation_name: "Singleback",
    personnel: "11 Personnel (1 RB, 1 TE, 3 WR)",
    description: "One-back set with TE attached right.",
    module: "Singleback Concepts",
    positions: {
      OL: { x: 50, y: 5 },
      Q: { x: 50, y: 3.5 },
      T: { x: 50, y: 1.5 },
      X: { x: 10, y: 5 },
      Y: { x: 62, y: 5 },
      Z: { x: 90, y: 5 },
      R: { x: 75, y: 5 },
    },
    coaching_notes: {
      T: "5.5 yards deep, directly behind QB. Check weak-side LB.",
      Y: "Inline right. Block or release on read.",
    },
    alignments: {
      T: { spot: "Singleback, 5.5 yards deep", detail: "Directly behind QB. Scan protection from MIKE to backside edge." },
      X: { spot: "Wide left, on numbers", detail: "Split wide to the boundary." },
      Y: { spot: "Inline right, on LOS", detail: "Tight end attached to RT." },
      Z: { spot: "Wide right, on numbers", detail: "Split wide to the field." },
      R: { spot: "Slot right, +1 off LOS", detail: "Slot receiver field side, between Y and Z." },
    },
    source_pdf_ids: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEMO PROTECTION SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_PROTECTION_SCENARIOS: DemoProtectionScenario[] = [
  {
    id: "demo-360-over",
    coverage_name: "OVER",
    coverage_type: "zone",
    protection_type: "360",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      DT_3T: { id: "DT_3T", x: 42, y: 55, label: "3T", rushing: true },
      NT_1T: { id: "NT_1T", x: 55, y: 55, label: "1T", rushing: true },
      DE_S: { id: "DE_S", x: 72, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 42, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false },
      SAM: { id: "SAM", x: 68, y: 42, label: "S", rushing: false, walked_up: true },
    },
    correct_block_target: "SAM",
    explanation: "In 360 protection vs OVER front, the OL handles 4 down linemen. TB checks SAM walked up on the edge — he's your man if he comes. If SAM drops, scan back to MIKE.",
  },
  {
    id: "demo-360-under",
    coverage_name: "UNDER",
    coverage_type: "zone",
    protection_type: "360",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      NT_0T: { id: "NT_0T", x: 50, y: 55, label: "0T", rushing: true },
      DT_5T: { id: "DT_5T", x: 65, y: 55, label: "5T", rushing: true },
      DE_S: { id: "DE_S", x: 78, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 35, y: 42, label: "W", rushing: false, walked_up: true },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false },
      SAM: { id: "SAM", x: 70, y: 40, label: "S", rushing: false },
    },
    correct_block_target: "WILL",
    explanation: "Under front shifts strength away from you. WILL is walked up on your side — he's your primary read. If WILL comes, you block him. If he drops, scan to MIKE.",
  },
  {
    id: "demo-350-over",
    coverage_name: "OVER",
    coverage_type: "zone",
    protection_type: "350",
    call_side: "right",
    solid_call: false,
    free_release: true,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      DT_3T: { id: "DT_3T", x: 42, y: 55, label: "3T", rushing: true },
      NT_1T: { id: "NT_1T", x: 55, y: 55, label: "1T", rushing: true },
      DE_S: { id: "DE_S", x: 72, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 42, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false },
      SAM: { id: "SAM", x: 68, y: 42, label: "S", rushing: false },
    },
    correct_block_target: "RELEASE",
    explanation: "350 protection = TB free release. The OL and 5 blockers handle everything. You check for late blitz on your way out — if nobody comes, run your route.",
  },
  {
    id: "demo-64-bear",
    coverage_name: "BEAR",
    coverage_type: "man",
    protection_type: "64",
    call_side: "right",
    solid_call: true,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 25, y: 55, label: "DE", rushing: true },
      DT_4i: { id: "DT_4i", x: 40, y: 55, label: "4i", rushing: true },
      NT_0T: { id: "NT_0T", x: 50, y: 55, label: "0T", rushing: true },
      DT_4iR: { id: "DT_4iR", x: 60, y: 55, label: "4i", rushing: true },
      DE_S: { id: "DE_S", x: 75, y: 55, label: "DE", rushing: true },
      MIKE: { id: "MIKE", x: 50, y: 40, label: "M", rushing: false },
      WILL: { id: "WILL", x: 35, y: 40, label: "W", rushing: false, blitz: true, tb_read: 1 },
    },
    correct_block_target: "WILL",
    explanation: "Bear front with 5 down. In 64 protection with solid call, you have the backside LB (WILL). He's showing blitz — step up and take him. Don't chase the front, trust the line.",
  },
  {
    id: "demo-360-33-stack",
    coverage_name: "3-3 STACK",
    coverage_type: "zone",
    protection_type: "360",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_L: { id: "DE_L", x: 30, y: 55, label: "DE", rushing: true },
      NT: { id: "NT", x: 50, y: 55, label: "NT", rushing: true },
      DE_R: { id: "DE_R", x: 70, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 43, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 43, label: "M", rushing: false },
      SAM: { id: "SAM", x: 70, y: 43, label: "S", rushing: false, walked_up: true },
    },
    correct_block_target: "SAM",
    explanation: "3-3 stack with SAM walked up to your side. In 360, OL has the 3 down linemen. Your eyes go SAM first — he's walked up and most dangerous. If SAM drops, scan MIKE.",
  },
  {
    id: "demo-350-over-blitz",
    coverage_name: "OVER",
    coverage_type: "blitz",
    protection_type: "350",
    call_side: "right",
    solid_call: false,
    free_release: true,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      DT_3T: { id: "DT_3T", x: 42, y: 55, label: "3T", rushing: true },
      NT_1T: { id: "NT_1T", x: 55, y: 55, label: "1T", rushing: true },
      DE_S: { id: "DE_S", x: 72, y: 55, label: "DE", rushing: true },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false, blitz: true },
      SAM: { id: "SAM", x: 70, y: 42, label: "S", rushing: false },
    },
    correct_block_target: "MIKE",
    explanation: "Even though 350 is a free release call, MIKE is showing blitz. You have to check him before releasing. Pick up MIKE if he comes — protect the QB first, route second.",
  },
  {
    id: "demo-64-over-edge",
    coverage_name: "OVER",
    coverage_type: "man",
    protection_type: "64",
    call_side: "left",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      DT_3T: { id: "DT_3T", x: 42, y: 55, label: "3T", rushing: true },
      NT_1T: { id: "NT_1T", x: 55, y: 55, label: "1T", rushing: true },
      DE_S: { id: "DE_S", x: 72, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 42, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false },
      SAM: { id: "SAM", x: 72, y: 42, label: "S", rushing: false, blitz: true, walked_up: true, tb_read: 1 },
    },
    correct_block_target: "SAM",
    explanation: "64 protection, call side left but SAM is walked up and showing blitz on the edge. Even though you're aligned left, SAM on the edge is your primary threat. Pick him up.",
  },
  {
    id: "demo-360-under-double",
    coverage_name: "UNDER",
    coverage_type: "blitz",
    protection_type: "360",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      NT_0T: { id: "NT_0T", x: 50, y: 55, label: "0T", rushing: true },
      DT_5T: { id: "DT_5T", x: 65, y: 55, label: "5T", rushing: true },
      DE_S: { id: "DE_S", x: 78, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 35, y: 42, label: "W", rushing: false, blitz: true, tb_read: 1 },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false, blitz: true },
    },
    correct_block_target: "WILL",
    explanation: "Double LB blitz! WILL and MIKE both coming. OL has to sort the DL. Your read goes inside-out: WILL is closer and more dangerous to the QB. Block WILL, trust the line to handle MIKE with the slide.",
  },
  {
    id: "demo-hoss-over",
    coverage_name: "OVER",
    coverage_type: "zone",
    protection_type: "360",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: true,
    scat_release: null,
    defensive_positions: {
      DE_W: { id: "DE_W", x: 28, y: 55, label: "DE", rushing: true },
      DT_3T: { id: "DT_3T", x: 42, y: 55, label: "3T", rushing: true },
      NT_1T: { id: "NT_1T", x: 55, y: 55, label: "1T", rushing: true },
      DE_S: { id: "DE_S", x: 72, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 42, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 42, label: "M", rushing: false },
      SAM: { id: "SAM", x: 68, y: 42, label: "S", rushing: false },
    },
    correct_block_target: "RELEASE",
    explanation: "HOSS call means the hot receiver has the sight adjustment. TB releases into the flat as the check-down. Scan for late pressure on the way out, but you're free.",
  },
  {
    id: "demo-64-33-sam-blitz",
    coverage_name: "3-3 STACK",
    coverage_type: "blitz",
    protection_type: "64",
    call_side: "right",
    solid_call: false,
    free_release: false,
    play_action: false,
    naked: false,
    hoss: false,
    scat_release: null,
    defensive_positions: {
      DE_L: { id: "DE_L", x: 30, y: 55, label: "DE", rushing: true },
      NT: { id: "NT", x: 50, y: 55, label: "NT", rushing: true },
      DE_R: { id: "DE_R", x: 70, y: 55, label: "DE", rushing: true },
      WILL: { id: "WILL", x: 30, y: 43, label: "W", rushing: false },
      MIKE: { id: "MIKE", x: 50, y: 43, label: "M", rushing: false },
      SAM: { id: "SAM", x: 68, y: 43, label: "S", rushing: false, blitz: true, walked_up: true, tb_read: 1 },
    },
    correct_block_target: "SAM",
    explanation: "3-3 with SAM blitzing off the edge. In 64 protection, the 3 DL are handled by 5 OL. SAM is your guy — he's showing blitz and walked up. Step up and meet him in the hole.",
  },
];
