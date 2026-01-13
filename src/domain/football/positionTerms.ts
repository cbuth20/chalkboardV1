// ═══════════════════════════════════════════════════════════════════════════
// POSITION TERMS — Position-specific coaching terminology
// Real NFL coaching language for each position group
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Position group identifier
 */
export type PositionGroupId =
  | "qb"
  | "rb"
  | "wr"
  | "te"
  | "ol"
  | "dl"
  | "lb"
  | "db"
  | "special-teams";

/**
 * A position-specific term
 */
export interface PositionTerm {
  id: string;
  term: string;
  definition: string;
  usage: string[];
  coachingCues: string[];
}

/**
 * Complete position group definition
 */
export interface PositionGroup {
  id: PositionGroupId;
  name: string;
  shortName: string;
  positions: string[];
  keySkills: string[];
  terms: PositionTerm[];
}

// ═══════════════════════════════════════════════════════════════════════════
// QUARTERBACK TERMS
// ═══════════════════════════════════════════════════════════════════════════

const QB_GROUP: PositionGroup = {
  id: "qb",
  name: "Quarterback",
  shortName: "QB",
  positions: ["QB"],
  keySkills: [
    "Pre-snap reads",
    "Post-snap processing",
    "Footwork",
    "Ball placement",
    "Decision making",
    "Leadership",
  ],
  terms: [
    {
      id: "qb-progression",
      term: "Progression",
      definition: "The predetermined sequence of receivers the QB reads through. Can be full-field (1-2-3-4) or half-field based on a key defender.",
      usage: [
        "Trust your progression",
        "He's quick through his progressions",
        "Work through the progression, don't lock on",
      ],
      coachingCues: [
        "Eyes dictate where you throw",
        "Move your feet with your eyes",
        "Don't stare down receivers",
      ],
    },
    {
      id: "qb-platform",
      term: "Platform",
      definition: "The stable base from which a QB throws. Feet should be shoulder-width apart, balanced, with weight ready to transfer into the throw.",
      usage: [
        "Get your platform set",
        "He threw from a bad platform",
        "Establish your platform before throwing",
      ],
      coachingCues: [
        "Feet set, hips loaded",
        "Balanced base for accurate throws",
        "Rebuild platform after moving",
      ],
    },
    {
      id: "qb-hitching",
      term: "Hitch",
      definition: "A small step forward in the pocket to reset timing and prepare for a deeper throw. Used when the first read isn't open.",
      usage: [
        "Hitch up and let it go",
        "Good hitch to extend the play",
        "Hitch and reset your eyes",
      ],
      coachingCues: [
        "Hitch creates time for deeper routes",
        "Small steps, stay in the pocket",
        "Eyes should move with the hitch",
      ],
    },
    {
      id: "qb-climb",
      term: "Climb",
      definition: "Moving forward in the pocket to avoid edge pressure and create throwing lanes. Staying tall in the pocket rather than flushing.",
      usage: [
        "Climb the pocket",
        "He climbed and found the window",
        "Don't bail – climb!",
      ],
      coachingCues: [
        "Step up, not out",
        "Trust your interior linemen",
        "Climbing extends plays",
      ],
    },
    {
      id: "qb-pocket-presence",
      term: "Pocket Presence",
      definition: "The quarterback's awareness of pressure and ability to avoid it while keeping eyes downfield. Knowing where rushers are without seeing them.",
      usage: [
        "Great pocket presence",
        "He felt the pressure coming",
        "Pocket presence is instinct",
      ],
      coachingCues: [
        "Feel the rush, don't see it",
        "Keep eyes downfield",
        "Small movements avoid big hits",
      ],
    },
    {
      id: "qb-ball-security",
      term: "Ball Security",
      definition: "Keeping the ball protected from strips and fumbles. Two hands on the ball when scrambling or under duress.",
      usage: [
        "Protect the ball",
        "High and tight with ball security",
        "Two hands in traffic",
      ],
      coachingCues: [
        "Ball in throwing position, not exposed",
        "Two hands when moving",
        "Protect the rock",
      ],
    },
    {
      id: "qb-key",
      term: "Key",
      definition: "The defender the QB reads to determine where to throw. Often a linebacker or safety whose movement dictates the progression.",
      usage: [
        "Key the MIKE linebacker",
        "Your key is the flat defender",
        "Read your key post-snap",
      ],
      coachingCues: [
        "Identify key pre-snap",
        "Key moves one way, throw the other",
        "Key tells you coverage",
      ],
    },
    {
      id: "qb-touch",
      term: "Touch",
      definition: "The ability to vary ball velocity and trajectory based on the throw. Soft touch over linebackers, zip on intermediate routes, loft on deep balls.",
      usage: [
        "Nice touch on that throw",
        "Put some touch on it",
        "He's got great touch",
      ],
      coachingCues: [
        "Not every throw is max velocity",
        "Touch beats tight coverage",
        "Layered throws need touch",
      ],
    },
    {
      id: "qb-anticipation",
      term: "Anticipation",
      definition: "Throwing to where the receiver will be, not where they are. The ball should arrive as the receiver comes out of his break.",
      usage: [
        "Great anticipation throw",
        "Anticipate the break",
        "Trust your guys and anticipate",
      ],
      coachingCues: [
        "Throw before the break",
        "Trust the route",
        "See it before it happens",
      ],
    },
    {
      id: "qb-command",
      term: "Command",
      definition: "The QB's leadership at the line of scrimmage. Setting protections, making calls, commanding the offense with presence and confidence.",
      usage: [
        "Great command at the line",
        "Take command of the huddle",
        "Command presence matters",
      ],
      coachingCues: [
        "Be decisive and loud",
        "Everyone looks to you",
        "Confidence is contagious",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// RUNNING BACK TERMS
// ═══════════════════════════════════════════════════════════════════════════

const RB_GROUP: PositionGroup = {
  id: "rb",
  name: "Running Back",
  shortName: "RB",
  positions: ["RB", "FB", "HB"],
  keySkills: [
    "Vision",
    "Patience",
    "Burst",
    "Pass protection",
    "Ball security",
    "Receiving",
  ],
  terms: [
    {
      id: "rb-vision",
      term: "Vision",
      definition: "The ability to see blocks developing and identify the best running lane. Reading defenders, not blockers, to find cutback lanes and creases.",
      usage: [
        "He's got elite vision",
        "Trust your vision",
        "Vision is instinct",
      ],
      coachingCues: [
        "See the whole picture",
        "Read defenders, not blockers",
        "Find the crease",
      ],
    },
    {
      id: "rb-patience",
      term: "Patience",
      definition: "Waiting for blocks to develop before committing to a lane. Not forcing plays that aren't there. Letting the run come to you.",
      usage: [
        "Be patient behind the line",
        "His patience created the big run",
        "Patient runners gain tough yards",
      ],
      coachingCues: [
        "Let blocks set up",
        "Don't outrun your blockers",
        "Patience isn't slow",
      ],
    },
    {
      id: "rb-one-cut",
      term: "One Cut",
      definition: "Making one decisive cut and getting north-south. Not dancing in the backfield or wasting steps. Press the hole, make one cut, go.",
      usage: [
        "One cut and go",
        "Stop dancing – one cut!",
        "He's a one-cut runner",
      ],
      coachingCues: [
        "Press, cut, explode",
        "Extra cuts cost yards",
        "Be decisive",
      ],
    },
    {
      id: "rb-north-south",
      term: "North-South",
      definition: "Running straight upfield toward the end zone. Minimizing lateral movement and gaining vertical yards. Downhill running style.",
      usage: [
        "Get north-south",
        "He's a north-south runner",
        "Stop going east-west",
      ],
      coachingCues: [
        "Yards are gained going forward",
        "Attack downhill",
        "Vertical yards matter",
      ],
    },
    {
      id: "rb-press-hole",
      term: "Press the Hole",
      definition: "Running aggressively toward the intended gap to set up blocks and force defenders to commit. Attacking the line of scrimmage.",
      usage: [
        "Press the hole",
        "Attack the crease",
        "Press it to set up blocks",
      ],
      coachingCues: [
        "Make defenders commit",
        "Set up your blockers",
        "Aggressive feet at the line",
      ],
    },
    {
      id: "rb-cutback",
      term: "Cutback",
      definition: "Planting and reversing direction away from play flow when backside defenders over-pursue. A key read in zone running schemes.",
      usage: [
        "Great cutback lane",
        "Read the cutback",
        "Cutback for a touchdown",
      ],
      coachingCues: [
        "Feel the backside defender",
        "One hard plant and go",
        "Don't telegraph the cut",
      ],
    },
    {
      id: "rb-blitz-pickup",
      term: "Blitz Pickup",
      definition: "Identifying and blocking blitzing defenders in pass protection. Scanning the defense for unblocked rushers and taking them on.",
      usage: [
        "Great blitz pickup",
        "Scan for the blitzer",
        "You've got the A-gap",
      ],
      coachingCues: [
        "Scan inside to outside",
        "Square up and anchor",
        "Be physical at the point of attack",
      ],
    },
    {
      id: "rb-ball-security",
      term: "Ball Security",
      definition: "Protecting the football from fumbles. High and tight carrying technique, especially in traffic. Switching hands to protect from defenders.",
      usage: [
        "Secure the ball",
        "High and tight",
        "Ball security is job security",
      ],
      coachingCues: [
        "Five points of contact",
        "Cover up in traffic",
        "Switch hands at the sideline",
      ],
    },
    {
      id: "rb-burst",
      term: "Burst",
      definition: "Explosive acceleration through the hole. The ability to go from patient to explosive in one step. Getting to top speed quickly.",
      usage: [
        "Great burst through the hole",
        "Hit it with burst",
        "His burst is elite",
      ],
      coachingCues: [
        "Explode through the crease",
        "Zero to top speed fast",
        "Burst creates separation",
      ],
    },
    {
      id: "rb-stacking",
      term: "Stacking",
      definition: "Getting vertical on a linebacker in a route, positioning to make a play on the ball. Beating the LB upfield on wheel routes.",
      usage: [
        "Stack the linebacker",
        "Great stack on the wheel",
        "He got stacked",
      ],
      coachingCues: [
        "Vertical release vs LBs",
        "Get on top of the defender",
        "Stack = leverage",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDE RECEIVER TERMS
// ═══════════════════════════════════════════════════════════════════════════

const WR_GROUP: PositionGroup = {
  id: "wr",
  name: "Wide Receiver",
  shortName: "WR",
  positions: ["WR", "X", "Z", "Slot", "F"],
  keySkills: [
    "Route running",
    "Release",
    "Hands",
    "Separation",
    "Body control",
    "YAC ability",
  ],
  terms: [
    {
      id: "wr-release",
      term: "Release",
      definition: "Getting off the line of scrimmage against press coverage. Using footwork, hands, and body positioning to defeat the jam and start the route.",
      usage: [
        "Win your release",
        "Clean release",
        "His release is elite",
      ],
      coachingCues: [
        "Attack defender's leverage",
        "Quick feet at the line",
        "Violent hands",
      ],
    },
    {
      id: "wr-stem",
      term: "Stem",
      definition: "The vertical portion of a route before the break. A good stem sells vertical threat and sets up the break. All routes should look the same off the stem.",
      usage: [
        "Push your stem",
        "Vertical stem before the break",
        "Sell the 9 on your stem",
      ],
      coachingCues: [
        "Vertical push creates space",
        "Make every route look like a go",
        "Stem to set up break",
      ],
    },
    {
      id: "wr-break",
      term: "Break",
      definition: "The point where the receiver changes direction on a route. A crisp, efficient break creates separation. Plant and drive out of the break.",
      usage: [
        "Sharp break",
        "Break at 12 yards",
        "Get in and out of your break",
      ],
      coachingCues: [
        "Drop your weight",
        "Accelerate out of break",
        "Eyes to QB immediately",
      ],
    },
    {
      id: "wr-separation",
      term: "Separation",
      definition: "Creating space between yourself and the defender. Achieved through releases, stems, breaks, and speed. The goal of every route.",
      usage: [
        "Create separation",
        "He got great separation",
        "Separation is the goal",
      ],
      coachingCues: [
        "Win at every level",
        "Stack the defender",
        "Sell one route, run another",
      ],
    },
    {
      id: "wr-catch-radius",
      term: "Catch Radius",
      definition: "The area around a receiver where they can make a catch. Elite receivers expand their catch radius through body control and hand-eye coordination.",
      usage: [
        "Great catch radius",
        "He caught that outside his radius",
        "Expand your catch radius",
      ],
      coachingCues: [
        "Attack the ball at its highest point",
        "Go get it",
        "Make the difficult look easy",
      ],
    },
    {
      id: "wr-tracking",
      term: "Tracking",
      definition: "Following the ball in flight and adjusting your path to make the catch. The ability to track deep balls over the shoulder without losing speed.",
      usage: [
        "Track the ball",
        "Great tracking ability",
        "Keep tracking it",
      ],
      coachingCues: [
        "Find it early",
        "Adjust to the ball",
        "Don't lose track over the shoulder",
      ],
    },
    {
      id: "wr-hand-placement",
      term: "Hand Placement",
      definition: "How the receiver positions hands to catch the ball. Diamond for high balls, basket for low balls. Thumbs in for catches above the chest.",
      usage: [
        "Hands in the right position",
        "Diamond your hands",
        "Bad hand placement",
      ],
      coachingCues: [
        "Thumbs together above chest",
        "Pinkies together below chest",
        "Catch with hands, not body",
      ],
    },
    {
      id: "wr-contested-catch",
      term: "Contested Catch",
      definition: "Making a catch with a defender in position to contest. High-pointing the ball, body positioning, and strong hands through contact.",
      usage: [
        "Contested catch",
        "He wins contested catches",
        "50-50 ball",
      ],
      coachingCues: [
        "High point the ball",
        "Be physical",
        "Create separation at the catch point",
      ],
    },
    {
      id: "wr-scramble-rules",
      term: "Scramble Rules",
      definition: "How receivers react when the QB scrambles. Deep receivers work back to the ball, short receivers go deep, everyone works to get open.",
      usage: [
        "Scramble rules!",
        "Work back on scramble",
        "Know your scramble rules",
      ],
      coachingCues: [
        "Be available for the QB",
        "Find open grass",
        "Stay in QB's vision",
      ],
    },
    {
      id: "wr-stacking",
      term: "Stack",
      definition: "Getting your body directly in front of or behind the defender on vertical routes. Creates leverage for back-shoulder or over-the-top throws.",
      usage: [
        "Stack the corner",
        "Great stack on the 9",
        "Stack and locate",
      ],
      coachingCues: [
        "Get on top of the defender",
        "Maintain stack to catch point",
        "Stack inside for back shoulder",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TIGHT END TERMS
// ═══════════════════════════════════════════════════════════════════════════

const TE_GROUP: PositionGroup = {
  id: "te",
  name: "Tight End",
  shortName: "TE",
  positions: ["TE", "Y", "U", "F"],
  keySkills: [
    "Blocking",
    "Route running",
    "Releases",
    "YAC",
    "Versatility",
    "Red zone threat",
  ],
  terms: [
    {
      id: "te-inline",
      term: "Inline",
      definition: "The tight end aligned on the line of scrimmage next to the offensive tackle. Traditional TE alignment for run blocking.",
      usage: [
        "Y is inline",
        "Stay inline for the run",
        "Inline blocking",
      ],
      coachingCues: [
        "On the line, hand in the dirt",
        "Part of the blocking unit",
        "First step matters",
      ],
    },
    {
      id: "te-flexed",
      term: "Flexed",
      definition: "The tight end split out from the formation, creating space and matchup advantages. Not on the line of scrimmage.",
      usage: [
        "Flex the tight end",
        "Y is flexed",
        "Flexed alignment",
      ],
      coachingCues: [
        "Creates space for routes",
        "Matches up vs LBs",
        "Release is cleaner",
      ],
    },
    {
      id: "te-chip",
      term: "Chip",
      definition: "A quick block on a pass rusher before releasing into a route. Provides help to the offensive line while still getting into the pattern.",
      usage: [
        "Chip and release",
        "Give a chip and get out",
        "Nice chip on the edge",
      ],
      coachingCues: [
        "Make solid contact",
        "Don't get stuck",
        "Help the tackle, then go",
      ],
    },
    {
      id: "te-seam",
      term: "Seam",
      definition: "The vertical path between the numbers and hash marks. TEs attack the seam to stress Cover 2 and find windows against zone coverage.",
      usage: [
        "Push the seam",
        "Seam route for a TD",
        "Attack the seam vs Cover 2",
      ],
      coachingCues: [
        "Vertical threat in the middle",
        "Find the window",
        "Sit vs zone, run vs man",
      ],
    },
    {
      id: "te-angle",
      term: "Angle Block",
      definition: "A block where the TE comes down at an angle to block a defender lined up inside of them. Key block for outside zone and toss plays.",
      usage: [
        "Angle the end",
        "Good angle block",
        "Seal the edge with an angle",
      ],
      coachingCues: [
        "Get your head across",
        "Seal and drive",
        "Inside shoulder through",
      ],
    },
    {
      id: "te-sit",
      term: "Sit",
      definition: "Stopping and settling in an open zone area instead of continuing to run. TEs must read zone coverage and find soft spots.",
      usage: [
        "Sit in the zone",
        "Find the window and sit",
        "Sit vs zone, run vs man",
      ],
      coachingCues: [
        "Read the coverage",
        "Settle in the opening",
        "Work back to the QB",
      ],
    },
    {
      id: "te-cross",
      term: "Cross",
      definition: "A route where the TE crosses the formation, typically at intermediate depth. Often paired with shallow drags from the opposite side.",
      usage: [
        "Y cross",
        "Over the ball",
        "Cross behind the linebackers",
      ],
      coachingCues: [
        "Get depth before crossing",
        "Find the window",
        "Work through trash",
      ],
    },
    {
      id: "te-mismatch",
      term: "Mismatch",
      definition: "Creating favorable matchups against slower linebackers or smaller defensive backs. TEs are often mismatches due to their size and athleticism.",
      usage: [
        "TE on LB mismatch",
        "Create the mismatch",
        "Exploit the matchup",
      ],
      coachingCues: [
        "Know who's covering you",
        "Attack their weakness",
        "Win your 1-on-1s",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// OFFENSIVE LINE TERMS
// ═══════════════════════════════════════════════════════════════════════════

const OL_GROUP: PositionGroup = {
  id: "ol",
  name: "Offensive Line",
  shortName: "OL",
  positions: ["C", "G", "T", "OL", "LT", "RT", "LG", "RG"],
  keySkills: [
    "Pass protection",
    "Run blocking",
    "Communication",
    "Technique",
    "Footwork",
    "Hand placement",
  ],
  terms: [
    {
      id: "ol-set",
      term: "Set",
      definition: "The initial pass protection move. A kick set goes backward and out to cut off the edge; a vertical set goes straight back to handle bull rushes.",
      usage: [
        "Kick set on the edge",
        "Vertical set vs power",
        "Get your set right",
      ],
      coachingCues: [
        "Hands ready, eyes on target",
        "Don't lunge",
        "Mirror the rusher",
      ],
    },
    {
      id: "ol-anchor",
      term: "Anchor",
      definition: "The ability to stop a bull rush by keeping your base, lowering your pad level, and driving back against the rusher. Not getting pushed into the pocket.",
      usage: [
        "Anchor down",
        "Good anchor",
        "He needs a better anchor",
      ],
      coachingCues: [
        "Sink your hips",
        "Wide base",
        "Don't give ground",
      ],
    },
    {
      id: "ol-punch",
      term: "Punch",
      definition: "The violent strike with the hands to jolt a defender and establish control. Timing, placement, and power are critical for an effective punch.",
      usage: [
        "Punch and reset",
        "Violent punch",
        "Get your punch off first",
      ],
      coachingCues: [
        "Thumbs up, elbows in",
        "Strike through the breastplate",
        "Re-punch if you lose",
      ],
    },
    {
      id: "ol-combo",
      term: "Combo",
      definition: "A double-team block where two linemen work together, then one comes off to the linebacker. Key technique for zone running schemes.",
      usage: [
        "Combo to the mike",
        "Stay on the combo",
        "Work the combo together",
      ],
      coachingCues: [
        "Hip to hip, four hands",
        "Move together",
        "Feel when to come off",
      ],
    },
    {
      id: "ol-reach",
      term: "Reach",
      definition: "Getting your head and body playside of a defender to seal them from the running lane. Essential for outside zone schemes.",
      usage: [
        "Reach the 3-tech",
        "Get the reach block",
        "Can't let him cross your face",
      ],
      coachingCues: [
        "Flat first step",
        "Head across",
        "Seal and run your feet",
      ],
    },
    {
      id: "ol-down",
      term: "Down",
      definition: "A block where the lineman steps inside and blocks a defender in the adjacent inside gap. Creates kick-out opportunities for pullers.",
      usage: [
        "Guard down",
        "Down on the A-gap",
        "Down and seal",
      ],
      coachingCues: [
        "Inside shoulder through",
        "Seal the gap",
        "Create the lane",
      ],
    },
    {
      id: "ol-pull",
      term: "Pull",
      definition: "When a lineman leaves his position and runs laterally to block a defender. Used in power, counter, and sweep schemes.",
      usage: [
        "Guard pulls",
        "Pull and kick",
        "Pull and lead",
      ],
      coachingCues: [
        "Depth on the pull",
        "Eyes up for target",
        "Run to block, don't walk",
      ],
    },
    {
      id: "ol-wash",
      term: "Wash",
      definition: "Driving a defender laterally out of the play. Taking them wherever they want to go, just further. Clearing running lanes.",
      usage: [
        "Wash him down",
        "Good wash by the tackle",
        "Wash him to the sideline",
      ],
      coachingCues: [
        "Let him go where he wants",
        "Just take him further",
        "Create movement",
      ],
    },
    {
      id: "ol-mirror",
      term: "Mirror",
      definition: "Staying in front of a pass rusher by matching their movements. Mirroring side to side while maintaining proper technique and position.",
      usage: [
        "Mirror the edge",
        "Keep mirroring",
        "Don't stop your feet",
      ],
      coachingCues: [
        "Stay square",
        "Quick feet",
        "Don't overset",
      ],
    },
    {
      id: "ol-stunt",
      term: "Stunt",
      definition: "Coordinated movements by defensive linemen to cross and confuse blocking assignments. TED (Tackle-End) and GET (Guard-End) are common stunts.",
      usage: [
        "Pick up the stunt",
        "TEX stunt",
        "Watch for the twist",
      ],
      coachingCues: [
        "Communicate!",
        "Feel the games",
        "Pass off and pick up",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFENSIVE LINE TERMS
// ═══════════════════════════════════════════════════════════════════════════

const DL_GROUP: PositionGroup = {
  id: "dl",
  name: "Defensive Line",
  shortName: "DL",
  positions: ["DE", "DT", "NT", "DL", "Edge"],
  keySkills: [
    "Get-off",
    "Hand usage",
    "Pass rush moves",
    "Run defense",
    "Gap control",
    "Motor",
  ],
  terms: [
    {
      id: "dl-get-off",
      term: "Get-Off",
      definition: "The explosive first step off the snap. Winning the initial movement to gain penetration or set the edge.",
      usage: [
        "Great get-off",
        "Win the get-off",
        "His get-off is elite",
      ],
      coachingCues: [
        "First step wins",
        "Low pad level",
        "Explode on the snap",
      ],
    },
    {
      id: "dl-hand-placement",
      term: "Hand Placement",
      definition: "Where and how a defensive lineman strikes the offensive lineman. Hands inside the framework controls the block.",
      usage: [
        "Hands inside",
        "Get your hands on him",
        "Win with hand placement",
      ],
      coachingCues: [
        "Inside the framework",
        "Violent hands",
        "Lock out and control",
      ],
    },
    {
      id: "dl-rip",
      term: "Rip",
      definition: "A pass rush move where the rusher dips under the blocker's punch and rips through with the inside arm. Creates edge pressure.",
      usage: [
        "Rip move",
        "Nice rip to the inside",
        "Set up the rip",
      ],
      coachingCues: [
        "Dip the shoulder",
        "Rip through",
        "Accelerate to the QB",
      ],
    },
    {
      id: "dl-swim",
      term: "Swim",
      definition: "A pass rush move where the rusher swims over the blocker's arm to get by them. Quick, athletic move for edge rushers.",
      usage: [
        "Swim move",
        "Great swim",
        "Inside swim",
      ],
      coachingCues: [
        "Set it up with speed",
        "Over the top",
        "Violent arm action",
      ],
    },
    {
      id: "dl-bull",
      term: "Bull",
      definition: "A power pass rush move where the rusher drives straight into the blocker, trying to walk them back into the QB's lap.",
      usage: [
        "Bull rush",
        "He bullied the tackle",
        "Convert to bull",
      ],
      coachingCues: [
        "Power through the hands",
        "Low pad level wins",
        "Drive your feet",
      ],
    },
    {
      id: "dl-spin",
      term: "Spin",
      definition: "A pass rush move where the rusher spins away from the blocker's pressure to get free. Counter move when initial rush is stopped.",
      usage: [
        "Spin move",
        "Nice counter spin",
        "Set up the spin",
      ],
      coachingCues: [
        "Spin tight",
        "Don't lose ground",
        "Locate the QB",
      ],
    },
    {
      id: "dl-two-gap",
      term: "Two-Gap",
      definition: "Controlling the offensive lineman and being responsible for two gaps. Read and react based on where the ball goes.",
      usage: [
        "Two-gap technique",
        "Control and read",
        "Two-gap the A and B",
      ],
      coachingCues: [
        "Control the blocker",
        "Read and react",
        "Don't get washed",
      ],
    },
    {
      id: "dl-penetration",
      term: "Penetration",
      definition: "Getting into the backfield past the line of scrimmage. Disrupting plays before they develop.",
      usage: [
        "Good penetration",
        "Penetrate your gap",
        "Get upfield",
      ],
      coachingCues: [
        "Attack your gap",
        "Vertical push",
        "Don't run around blocks",
      ],
    },
    {
      id: "dl-contain",
      term: "Contain",
      definition: "The edge defender's responsibility to not let the ball carrier get outside. Set the edge and force the play back inside.",
      usage: [
        "Hold your contain",
        "Contain the QB",
        "Don't get reached",
      ],
      coachingCues: [
        "Outside shoulder free",
        "Force it back inside",
        "Squeeze down the line",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// LINEBACKER TERMS
// ═══════════════════════════════════════════════════════════════════════════

const LB_GROUP: PositionGroup = {
  id: "lb",
  name: "Linebacker",
  shortName: "LB",
  positions: ["LB", "MLB", "ILB", "OLB", "MIKE", "WILL", "SAM"],
  keySkills: [
    "Run fits",
    "Zone coverage",
    "Man coverage",
    "Blitzing",
    "Tackling",
    "Reading keys",
  ],
  terms: [
    {
      id: "lb-fill",
      term: "Fill",
      definition: "Attacking and fitting your assigned gap in run defense. Getting downhill to make plays at or behind the line of scrimmage.",
      usage: [
        "Fill your gap",
        "Great fill",
        "Downhill fill",
      ],
      coachingCues: [
        "Attack your gap",
        "Don't hesitate",
        "Be physical in the hole",
      ],
    },
    {
      id: "lb-scrape",
      term: "Scrape",
      definition: "Working laterally behind the defensive line to get to the point of attack. Keeping leverage while pursuing.",
      usage: [
        "Scrape to the ball",
        "Scrape over the top",
        "Backside scrape",
      ],
      coachingCues: [
        "Stay behind the line",
        "Don't get washed",
        "Shuffle, don't turn and run",
      ],
    },
    {
      id: "lb-spill",
      term: "Spill",
      definition: "Taking on a blocker with inside leverage to force the ball carrier to bounce outside toward pursuit help.",
      usage: [
        "Spill the kickout",
        "Wrong arm and spill",
        "Force the bounce",
      ],
      coachingCues: [
        "Inside shoulder through",
        "Force ball outside",
        "Pursuit cleans up",
      ],
    },
    {
      id: "lb-stack-shed",
      term: "Stack and Shed",
      definition: "Engaging a blocker, controlling them, then disengaging to make a tackle. Taking on blocks rather than avoiding them.",
      usage: [
        "Stack and shed",
        "Shed the block",
        "Get off and tackle",
      ],
      coachingCues: [
        "Strike first",
        "Keep your feet moving",
        "Disengage and find ball",
      ],
    },
    {
      id: "lb-hook-curl",
      term: "Hook/Curl",
      definition: "A zone coverage responsibility covering the area behind the linebackers and in front of the safeties. Key zone for intermediate routes.",
      usage: [
        "Hook to curl",
        "Carry vertical in hook",
        "Sit in the curl",
      ],
      coachingCues: [
        "Eyes on QB",
        "Depth based on release",
        "Don't get out-levered",
      ],
    },
    {
      id: "lb-wall",
      term: "Wall",
      definition: "Maintaining inside leverage on a receiver to wall off inside routes. Forcing everything outside.",
      usage: [
        "Wall off the crosser",
        "Stay on his inside",
        "Wall technique",
      ],
      coachingCues: [
        "Inside leverage",
        "Funnel outside",
        "Don't let him cross your face",
      ],
    },
    {
      id: "lb-carry",
      term: "Carry",
      definition: "Following a receiver vertically in zone coverage when they push upfield. Passing them off to a deeper defender.",
      usage: [
        "Carry the seam",
        "Carry him to the safety",
        "Carry vertical",
      ],
      coachingCues: [
        "Match his depth",
        "Don't let him run by you",
        "Pass off at landmark",
      ],
    },
    {
      id: "lb-trigger",
      term: "Trigger",
      definition: "The moment a linebacker recognizes run and attacks downhill. Fast trigger = quick recognition; slow trigger = getting blocked.",
      usage: [
        "Fast trigger",
        "Trigger on the mesh",
        "Pull the trigger",
      ],
      coachingCues: [
        "Read your key",
        "Trust your eyes",
        "Don't false step",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFENSIVE BACK TERMS
// ═══════════════════════════════════════════════════════════════════════════

const DB_GROUP: PositionGroup = {
  id: "db",
  name: "Defensive Back",
  shortName: "DB",
  positions: ["CB", "S", "FS", "SS", "NB", "DB"],
  keySkills: [
    "Coverage technique",
    "Ball skills",
    "Tackling",
    "Run support",
    "Communication",
    "Recovery speed",
  ],
  terms: [
    {
      id: "db-backpedal",
      term: "Backpedal",
      definition: "The backward running technique used to maintain vision on both the receiver and quarterback while retreating in coverage.",
      usage: [
        "Smooth backpedal",
        "Don't rush the backpedal",
        "Pedal and read",
      ],
      coachingCues: [
        "Weight forward",
        "Quick feet",
        "Don't open hips early",
      ],
    },
    {
      id: "db-break",
      term: "Break",
      definition: "The moment a DB transitions from backpedaling to driving on the ball. Breaking at the right time prevents completions.",
      usage: [
        "Break on the ball",
        "Good break",
        "Late break",
      ],
      coachingCues: [
        "Drive through the receiver",
        "Plant and go",
        "Be aggressive",
      ],
    },
    {
      id: "db-flip",
      term: "Flip",
      definition: "Turning the hips to run with a receiver going vertical or changing direction. Smooth hip transitions allow full-speed coverage.",
      usage: [
        "Flip your hips",
        "Late flip",
        "Clean flip",
      ],
      coachingCues: [
        "Don't open early",
        "Smooth transition",
        "Maintain leverage after flip",
      ],
    },
    {
      id: "db-phase",
      term: "Phase",
      definition: "Your position relative to the receiver during the route. 'In phase' means you're in position; 'out of phase' means you're beat.",
      usage: [
        "Stay in phase",
        "He's out of phase",
        "In-phase coverage",
      ],
      coachingCues: [
        "Hip to hip",
        "Hand on receiver",
        "Don't panic if you're out",
      ],
    },
    {
      id: "db-trail",
      term: "Trail",
      definition: "Coverage technique where you're slightly behind the receiver, relying on safety help over the top. Defends comeback routes.",
      usage: [
        "Trail technique",
        "Trail him with help",
        "Inside trail",
      ],
      coachingCues: [
        "Stay on hip",
        "Know your help",
        "Break on in-cuts",
      ],
    },
    {
      id: "db-click-close",
      term: "Click and Close",
      definition: "The technique of driving downhill to tackle after making a play on the ball. Clicking your feet and closing the distance.",
      usage: [
        "Click and close",
        "Close on the catch",
        "Good click",
      ],
      coachingCues: [
        "Chop your feet",
        "Break down for tackle",
        "Don't overrun",
      ],
    },
    {
      id: "db-play-the-ball",
      term: "Play the Ball",
      definition: "Locating and attacking the ball at the catch point. High-pointing, raking, or intercepting instead of just covering.",
      usage: [
        "Play the ball!",
        "Be a ball player",
        "Find the ball",
      ],
      coachingCues: [
        "Track through receiver's hands",
        "High point",
        "Strong hands through",
      ],
    },
    {
      id: "db-bail",
      term: "Bail",
      definition: "Showing press alignment then retreating at the snap. Disguises coverage while maintaining cushion against vertical threats.",
      usage: [
        "Bail technique",
        "Press-bail",
        "He's bailing",
      ],
      coachingCues: [
        "Show press",
        "Turn and run at snap",
        "Maintain leverage",
      ],
    },
    {
      id: "db-force",
      term: "Force",
      definition: "Coming down to support the run from the secondary. Setting the edge from the outside-in as a safety or corner.",
      usage: [
        "Force the run",
        "Strong safety force",
        "Play force",
      ],
      coachingCues: [
        "Attack downhill",
        "Set the edge",
        "Don't let it bounce",
      ],
    },
    {
      id: "db-robber",
      term: "Robber",
      definition: "A coverage technique where a safety plays zone while reading the QB's eyes, looking to jump routes for interceptions.",
      usage: [
        "Playing robber",
        "Robber in the middle",
        "Rat in the hole",
      ],
      coachingCues: [
        "Read the QB",
        "Break on the throw",
        "Jump the route",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBINE ALL POSITION GROUPS
// ═══════════════════════════════════════════════════════════════════════════

export const POSITION_GROUPS: PositionGroup[] = [
  QB_GROUP,
  RB_GROUP,
  WR_GROUP,
  TE_GROUP,
  OL_GROUP,
  DL_GROUP,
  LB_GROUP,
  DB_GROUP,
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a position group by ID
 */
export function getPositionGroupById(id: PositionGroupId): PositionGroup | undefined {
  return POSITION_GROUPS.find((g) => g.id === id);
}

/**
 * Get all terms for a position
 */
export function getTermsForPosition(position: string): PositionTerm[] {
  const group = POSITION_GROUPS.find(
    (g) =>
      g.id === position.toLowerCase() ||
      g.positions.some((p) => p.toLowerCase() === position.toLowerCase())
  );
  return group?.terms ?? [];
}

/**
 * Search all position terms
 */
export function searchPositionTerms(query: string): { group: string; term: PositionTerm }[] {
  const lowerQuery = query.toLowerCase();
  const results: { group: string; term: PositionTerm }[] = [];
  
  for (const group of POSITION_GROUPS) {
    for (const term of group.terms) {
      if (
        term.term.toLowerCase().includes(lowerQuery) ||
        term.definition.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ group: group.name, term });
      }
    }
  }
  
  return results;
}

/**
 * Get all position group names
 */
export function getPositionGroupNames(): { id: PositionGroupId; name: string; shortName: string }[] {
  return POSITION_GROUPS.map((g) => ({ id: g.id, name: g.name, shortName: g.shortName }));
}

/**
 * Get term by ID across all groups
 */
export function getPositionTermById(termId: string): { group: string; term: PositionTerm } | undefined {
  for (const group of POSITION_GROUPS) {
    const term = group.terms.find((t) => t.id === termId);
    if (term) {
      return { group: group.name, term };
    }
  }
  return undefined;
}
