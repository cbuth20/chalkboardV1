// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL TERMINOLOGY — Comprehensive NFL/NCAA glossary for Chalk Talk
// Real coaching language and terms used at the highest levels
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Term category for organization
 */
export type TermCategory =
  | "general"
  | "passing"
  | "coverage"
  | "route"
  | "protection"
  | "run-game"
  | "defensive"
  | "special-teams"
  | "situational"
  | "signals";

/**
 * Usage context for the term
 */
export type TermUsage = "offense" | "defense" | "special-teams" | "both";

/**
 * Football term definition
 */
export interface FootballTerm {
  id: string;
  term: string;
  aliases: string[];
  category: TermCategory;
  definition: string;
  usage: TermUsage;
  relatedTerms: string[];
  examples: string[];
  coachingPoints: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL TERMS
// ═══════════════════════════════════════════════════════════════════════════

const GENERAL_TERMS: FootballTerm[] = [
  {
    id: "audible",
    term: "Audible",
    aliases: ["check", "kill", "change"],
    category: "general",
    definition: "A change of play called at the line of scrimmage by the quarterback after reading the defense. The QB uses a verbal or signal code to alert teammates to the new play.",
    usage: "offense",
    relatedTerms: ["cadence", "check-with-me", "hot-route"],
    examples: [
      "Manning audibled to a run when he saw single-high safety.",
      "The audible is 'Omaha' for any run play change."
    ],
    coachingPoints: [
      "Everyone must know the audible system cold",
      "The kill word cancels the current play",
      "Live vs dummy audibles keep the defense guessing"
    ]
  },
  {
    id: "cadence",
    term: "Cadence",
    aliases: ["snap count", "rhythm"],
    category: "general",
    definition: "The quarterback's verbal signals and rhythm used to initiate the snap. Includes hard counts to draw the defense offsides and varying snap counts to keep the defense off-balance.",
    usage: "offense",
    relatedTerms: ["audible", "hard-count", "snap"],
    examples: [
      "Go on the second 'hut' in the cadence.",
      "Use a hard count on 4th and short."
    ],
    coachingPoints: [
      "Consistent cadence prevents false starts",
      "Vary the rhythm to catch the defense jumping",
      "The center and QB must be in sync"
    ]
  },
  {
    id: "check-with-me",
    term: "Check-With-Me",
    aliases: ["CWM", "live play"],
    category: "general",
    definition: "A play-calling system where the quarterback comes to the line with two or more plays and chooses the best option based on the defensive look. The team doesn't know which play until the QB makes the call.",
    usage: "offense",
    relatedTerms: ["audible", "run-pass-option"],
    examples: [
      "The check-with-me gives us run or pass based on the box count.",
      "CWM: inside zone or play-action."
    ],
    coachingPoints: [
      "QB must understand defensive indicators",
      "Players prepare for multiple plays in the huddle",
      "Faster than a full audible at the line"
    ]
  },
  {
    id: "tempo",
    term: "Tempo",
    aliases: ["pace", "speed"],
    category: "general",
    definition: "The speed at which the offense operates between plays. Can range from a slow, methodical pace to a no-huddle hurry-up attack designed to tire the defense or prevent substitutions.",
    usage: "offense",
    relatedTerms: ["no-huddle", "two-minute"],
    examples: [
      "We're going tempo here to keep their D-line gassed.",
      "Slow the tempo down and milk the clock."
    ],
    coachingPoints: [
      "Fast tempo prevents defensive substitutions",
      "Tempo can be used to tire a superior defensive line",
      "Must balance tempo with execution quality"
    ]
  },
  {
    id: "personnel",
    term: "Personnel",
    aliases: ["grouping", "package"],
    category: "general",
    definition: "The combination of players on the field, typically expressed as two digits. First digit = number of RBs, second digit = number of TEs. Example: 11 personnel = 1 RB, 1 TE, 3 WR.",
    usage: "both",
    relatedTerms: ["formation", "substitution"],
    examples: [
      "We're in 12 personnel (1 RB, 2 TE).",
      "Their base defense is nickel against our 11 personnel."
    ],
    coachingPoints: [
      "Personnel dictates defensive response",
      "Heavy personnel (21, 22) suggests run",
      "Spread personnel (10, 11) creates matchup advantages"
    ]
  },
  {
    id: "formation",
    term: "Formation",
    aliases: ["set", "alignment"],
    category: "general",
    definition: "The arrangement of offensive players before the snap. Includes the positioning of receivers, tight ends, and backs relative to the offensive line.",
    usage: "offense",
    relatedTerms: ["personnel", "motion", "shift"],
    examples: [
      "Gun Trips Right is our base formation.",
      "The formation tells us where everyone lines up."
    ],
    coachingPoints: [
      "Formation creates numbers advantages",
      "Condensed formations help the run game",
      "Spread formations stress coverage"
    ]
  },
  {
    id: "motion",
    term: "Motion",
    aliases: ["fly", "jet", "orbit"],
    category: "general",
    definition: "Pre-snap movement by a skill player, typically parallel to the line of scrimmage. Used to create mismatches, identify coverage, or gain a numerical advantage at the point of attack.",
    usage: "offense",
    relatedTerms: ["shift", "formation", "jet-sweep"],
    examples: [
      "Put the Z in motion to see if they're in man or zone.",
      "Jet motion for the sweep."
    ],
    coachingPoints: [
      "Man coverage: defender follows the motion",
      "Zone coverage: defenders pass off or ignore motion",
      "Motion can create free releases"
    ]
  },
  {
    id: "shift",
    term: "Shift",
    aliases: ["reset"],
    category: "general",
    definition: "Pre-snap movement where multiple players change their alignment simultaneously. Unlike motion, players must set for one full second before the snap.",
    usage: "offense",
    relatedTerms: ["motion", "formation"],
    examples: [
      "Shift from I-Form to Shotgun Spread.",
      "The shift forces the defense to communicate."
    ],
    coachingPoints: [
      "All shifting players must set for 1 second",
      "Shifts stress defensive communication",
      "Can create late alignment issues for defense"
    ]
  },
  {
    id: "hash",
    term: "Hash",
    aliases: ["hashmarks", "hash marks"],
    category: "general",
    definition: "The lines on the field that run parallel to the sidelines. The ball is spotted on or between the hashes. College hashes are wider than NFL hashes, affecting field position strategy.",
    usage: "both",
    relatedTerms: ["field", "boundary", "ball-placement"],
    examples: [
      "The ball is on the left hash.",
      "NFL hashes are tighter, giving more room to the boundary."
    ],
    coachingPoints: [
      "Hash position affects route combinations",
      "More space to field side in college",
      "Defensive alignment adjusts to hash"
    ]
  },
  {
    id: "field-boundary",
    term: "Field/Boundary",
    aliases: ["wide side", "short side", "strong/weak"],
    category: "general",
    definition: "Field is the wide side of the formation (more space to the sideline). Boundary is the short side (less space to the sideline). Offensive and defensive concepts often differ based on field/boundary.",
    usage: "both",
    relatedTerms: ["hash", "formation"],
    examples: [
      "Run the out route to the field.",
      "The boundary corner plays tighter technique."
    ],
    coachingPoints: [
      "More room for routes to the field",
      "Boundary routes need quicker timing",
      "Some coverages are field/boundary specific"
    ]
  },
  {
    id: "line-of-scrimmage",
    term: "Line of Scrimmage",
    aliases: ["LOS", "the line"],
    category: "general",
    definition: "The imaginary line running from sideline to sideline where the ball is spotted. Seven offensive players must be on the line at the snap, and only the two end players are eligible receivers.",
    usage: "both",
    relatedTerms: ["neutral-zone", "eligible-receiver"],
    examples: [
      "Get set on the line of scrimmage.",
      "The tight end is off the line, making him ineligible."
    ],
    coachingPoints: [
      "Alignment on/off LOS determines eligibility",
      "Receivers need to know legal alignment",
      "Officials watch the LOS for penalties"
    ]
  },
  {
    id: "pre-snap-read",
    term: "Pre-Snap Read",
    aliases: ["presnap look", "before the snap"],
    category: "general",
    definition: "Information gathered by observing the defense before the ball is snapped. Includes coverage indicators, blitz tells, front alignment, and safety depth.",
    usage: "offense",
    relatedTerms: ["post-snap-read", "coverage-id", "blitz-id"],
    examples: [
      "The pre-snap read told me it was Cover 3.",
      "I saw the blitz pre-snap from the nickel."
    ],
    coachingPoints: [
      "Count the box for run/pass decisions",
      "Safety alignment indicates coverage shell",
      "Defender leverage tells route adjustments"
    ]
  },
  {
    id: "post-snap-read",
    term: "Post-Snap Read",
    aliases: ["after the snap", "progression"],
    category: "general",
    definition: "Information gathered by observing defensive movement after the ball is snapped. Confirms or contradicts pre-snap reads and determines where to throw or run.",
    usage: "offense",
    relatedTerms: ["pre-snap-read", "progression"],
    examples: [
      "The safety rotated post-snap, confirming Cover 3.",
      "Post-snap I read the linebacker and threw the dig."
    ],
    coachingPoints: [
      "Pre-snap gives you an idea, post-snap confirms",
      "React to what you see, not what you expect",
      "Safeties and linebackers are primary post-snap keys"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PASSING GAME TERMS
// ═══════════════════════════════════════════════════════════════════════════

const PASSING_TERMS: FootballTerm[] = [
  {
    id: "hot-route",
    term: "Hot Route",
    aliases: ["hot", "sight adjust", "alert"],
    category: "passing",
    definition: "A quick, pre-determined route a receiver runs when the QB identifies an immediate blitz threat. The receiver and QB both recognize the pressure and adjust simultaneously.",
    usage: "offense",
    relatedTerms: ["sight-adjust", "blitz", "max-protect"],
    examples: [
      "When you see Cover 0, the X receiver's hot route is the slant.",
      "The hot is always to the field side against zero coverage."
    ],
    coachingPoints: [
      "Both QB and WR must recognize the same pressure indicator",
      "Hot routes are typically quick-breaking routes: slants, hitches, fades",
      "The 'hot' receiver is usually the one whose defender is blitzing"
    ]
  },
  {
    id: "progression",
    term: "Progression",
    aliases: ["read progression", "reads"],
    category: "passing",
    definition: "The predetermined order in which the quarterback reads receivers. Can be full-field progressions (1-2-3-4) or half-field reads based on a key defender.",
    usage: "offense",
    relatedTerms: ["high-low", "read", "checkdown"],
    examples: [
      "Your progression is post, dig, flat, checkdown.",
      "It's a half-field read: if the safety goes deep, throw the curl."
    ],
    coachingPoints: [
      "Trust your progression, don't lock onto one receiver",
      "Elite QBs get through progressions quickly",
      "Know your hot read before the snap"
    ]
  },
  {
    id: "checkdown",
    term: "Checkdown",
    aliases: ["dump-off", "outlet", "safety valve"],
    category: "passing",
    definition: "A short, safe throw to a running back or tight end when primary receivers are covered. The last option in the progression, designed to gain positive yards.",
    usage: "offense",
    relatedTerms: ["progression", "outlet", "running-back"],
    examples: [
      "When in doubt, take the checkdown.",
      "The RB is your outlet in the flat."
    ],
    coachingPoints: [
      "Checkdowns keep drives alive",
      "Better than a sack or turnover",
      "RBs and TEs must be available as outlets"
    ]
  },
  {
    id: "timing",
    term: "Timing",
    aliases: ["timing throw", "rhythm throw"],
    category: "passing",
    definition: "A pass thrown to a specific spot before the receiver has made his break, based on the timing of the route and the quarterback's drop. Requires precise synchronization.",
    usage: "offense",
    relatedTerms: ["drop", "route", "anticipation"],
    examples: [
      "The out route is a timing throw on the QB's fifth step.",
      "You're late on the timing – the ball should be out."
    ],
    coachingPoints: [
      "Timing throws require practice and trust",
      "QB releases the ball before the break",
      "Anticipation is key to NFL passing"
    ]
  },
  {
    id: "anticipation",
    term: "Anticipation",
    aliases: ["throwing receivers open"],
    category: "passing",
    definition: "Throwing to where the receiver will be, not where he currently is. Requires the quarterback to read coverage and trust the receiver to complete the route.",
    usage: "offense",
    relatedTerms: ["timing", "ball-placement", "window"],
    examples: [
      "Great anticipation on the corner route.",
      "Anticipate the break and let it go."
    ],
    coachingPoints: [
      "Watch the receiver's route stem, not just his current position",
      "Trust your receivers to finish routes",
      "Ball should arrive as the receiver comes out of his break"
    ]
  },
  {
    id: "window",
    term: "Window",
    aliases: ["throwing window", "passing lane"],
    category: "passing",
    definition: "The open space between defenders where the quarterback can deliver the ball to the receiver. Windows can be tight (small) or wide open.",
    usage: "offense",
    relatedTerms: ["anticipation", "ball-placement", "coverage"],
    examples: [
      "Thread it through the window.",
      "The window was tight, but he fit it in."
    ],
    coachingPoints: [
      "Identify your windows pre-snap",
      "Windows open and close quickly",
      "Ball placement within the window is critical"
    ]
  },
  {
    id: "ball-placement",
    term: "Ball Placement",
    aliases: ["placement", "location"],
    category: "passing",
    definition: "Where the quarterback throws the ball relative to the receiver's body. Proper placement keeps the receiver safe, allows for YAC, or protects from defenders.",
    usage: "offense",
    relatedTerms: ["anticipation", "window", "yac"],
    examples: [
      "Put the ball on his back shoulder.",
      "Lead him to the outside for YAC."
    ],
    coachingPoints: [
      "Inside throws go low and inside",
      "Outside routes go high and outside",
      "Back-shoulder throws beat tight coverage"
    ]
  },
  {
    id: "high-low",
    term: "High-Low",
    aliases: ["vertical stretch", "high-low read"],
    category: "passing",
    definition: "A passing concept that places two receivers on different levels (depths) to stretch a single defender vertically. If the defender plays deep, throw short; if he plays short, throw deep.",
    usage: "offense",
    relatedTerms: ["progression", "read", "concept"],
    examples: [
      "Smash is a high-low on the corner.",
      "Read the flat defender for the high-low."
    ],
    coachingPoints: [
      "One defender can't cover two levels",
      "The 'key' defender determines the throw",
      "Smash, curl-flat, and post-dig are high-low concepts"
    ]
  },
  {
    id: "horizontal-stretch",
    term: "Horizontal Stretch",
    aliases: ["width", "spread"],
    category: "passing",
    definition: "A passing concept that places receivers across the field horizontally to stretch the defense from sideline to sideline. Forces defenders to cover more ground laterally.",
    usage: "offense",
    relatedTerms: ["spacing", "levels", "high-low"],
    examples: [
      "Spacing concept gives us horizontal stretch.",
      "Stretch them sideline to sideline."
    ],
    coachingPoints: [
      "Horizontal stretch creates throwing lanes",
      "Defenders can't squeeze gaps as easily",
      "Spacing is key against zone coverage"
    ]
  },
  {
    id: "drop",
    term: "Drop",
    aliases: ["QB drop", "dropback"],
    category: "passing",
    definition: "The quarterback's backward movement from the line of scrimmage after the snap. Common drops include 3-step, 5-step, and 7-step, each timed to specific routes.",
    usage: "offense",
    relatedTerms: ["timing", "pocket", "footwork"],
    examples: [
      "It's a 5-step drop, hitch, and throw.",
      "Quick game is 3-step and fire."
    ],
    coachingPoints: [
      "Drop depth must match route timing",
      "3-step = quick game, 5-step = intermediate, 7-step = deep",
      "Hitching up extends timing for deeper routes"
    ]
  },
  {
    id: "pocket",
    term: "Pocket",
    aliases: ["the pocket", "passing pocket"],
    category: "passing",
    definition: "The protected area created by the offensive line for the quarterback to throw from. A clean pocket allows the QB to step into throws and see the entire field.",
    usage: "offense",
    relatedTerms: ["protection", "drop", "scramble"],
    examples: [
      "Stay in the pocket and deliver.",
      "The pocket collapsed, forcing the scramble."
    ],
    coachingPoints: [
      "QBs must trust the pocket",
      "Climb the pocket when edges collapse",
      "Don't drift unnecessarily"
    ]
  },
  {
    id: "play-action",
    term: "Play-Action",
    aliases: ["play-fake", "PA"],
    category: "passing",
    definition: "A passing play that begins with a fake handoff to freeze linebackers and safeties. Effective when the run game is established and defenders are playing aggressively against the run.",
    usage: "offense",
    relatedTerms: ["run-game", "boot", "naked"],
    examples: [
      "Play-action pass to the tight end.",
      "The linebacker bit on the play-fake."
    ],
    coachingPoints: [
      "Sell the fake with eyes and body",
      "Most effective in short-yardage and goal-line",
      "Linebackers are the target of the fake"
    ]
  },
  {
    id: "boot",
    term: "Boot",
    aliases: ["bootleg", "waggle"],
    category: "passing",
    definition: "A play-action pass where the quarterback fakes a handoff, then rolls out away from the fake. Creates a moving pocket and puts the QB on the edge with run/pass options.",
    usage: "offense",
    relatedTerms: ["play-action", "naked", "rollout"],
    examples: [
      "Boot left with the flat-corner combination.",
      "The bootleg freezes the backside linebacker."
    ],
    coachingPoints: [
      "Boot goes opposite the run fake",
      "QB has run option if coverage is tight",
      "Must sell the fake before rolling"
    ]
  },
  {
    id: "naked",
    term: "Naked",
    aliases: ["naked bootleg", "sprint out"],
    category: "passing",
    definition: "A bootleg with no pulling linemen or lead blockers. The QB is 'naked' and relies on the fake to freeze the defense. High-risk, high-reward play.",
    usage: "offense",
    relatedTerms: ["boot", "play-action"],
    examples: [
      "Naked boot to the boundary.",
      "He's naked – the defense bought the fake."
    ],
    coachingPoints: [
      "Only works if the defense respects the run",
      "QB must be athletic enough to escape",
      "Have a quick throw option"
    ]
  },
  {
    id: "scramble",
    term: "Scramble",
    aliases: ["scramble drill", "backyard football"],
    category: "passing",
    definition: "When the quarterback leaves the pocket to avoid pressure and either runs for yards or looks for open receivers while on the move. Receivers must react to the scramble.",
    usage: "offense",
    relatedTerms: ["pocket", "extend-the-play", "scramble-rules"],
    examples: [
      "Scramble drill – get open!",
      "He scrambled and found the tight end."
    ],
    coachingPoints: [
      "Receivers work to get open when QB scrambles",
      "Deep receivers come back, short receivers go deep",
      "Find open grass in the QB's field of vision"
    ]
  },
  {
    id: "yac",
    term: "YAC",
    aliases: ["yards after catch", "run after catch"],
    category: "passing",
    definition: "Yards gained by the receiver after catching the ball. A measure of both the receiver's ability to create and the ball placement allowing for continuation.",
    usage: "offense",
    relatedTerms: ["ball-placement", "catch-radius"],
    examples: [
      "Great throw for YAC.",
      "He's averaging 6 YAC per reception."
    ],
    coachingPoints: [
      "Ball placement affects YAC potential",
      "Throw receivers into open space",
      "YAC turns short throws into big gains"
    ]
  },
  {
    id: "rpo",
    term: "RPO",
    aliases: ["run-pass option", "packaged play"],
    category: "passing",
    definition: "A play that combines a run play with a pass option. The quarterback reads a defender post-snap to decide whether to hand off, keep, or throw. The offensive line blocks run while the QB makes the decision.",
    usage: "offense",
    relatedTerms: ["read-option", "check-with-me"],
    examples: [
      "RPO based on the MIKE linebacker.",
      "If the linebacker steps up, throw the bubble."
    ],
    coachingPoints: [
      "Read happens post-snap, not pre-snap",
      "OL must stay engaged to avoid illegal man downfield",
      "Quick throw options: bubble, slant, pop pass"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE TERMS
// ═══════════════════════════════════════════════════════════════════════════

const COVERAGE_TERMS: FootballTerm[] = [
  {
    id: "mofc",
    term: "MOFC",
    aliases: ["middle of field closed", "single high"],
    category: "coverage",
    definition: "Middle of Field Closed. A coverage structure with a single safety in the deep middle of the field (Cover 1, Cover 3). The middle third is 'closed' to vertical routes.",
    usage: "both",
    relatedTerms: ["mofo", "cover-1", "cover-3"],
    examples: [
      "MOFC look – expect Cover 1 or Cover 3.",
      "The middle is closed, attack the seams."
    ],
    coachingPoints: [
      "Single high safety = MOFC",
      "Corners often have outside leverage",
      "Attack the deep thirds with four verticals"
    ]
  },
  {
    id: "mofo",
    term: "MOFO",
    aliases: ["middle of field open", "two high"],
    category: "coverage",
    definition: "Middle of Field Open. A coverage structure with two safeties splitting the deep field (Cover 2, Cover 4). The deep middle is 'open' with no dedicated defender.",
    usage: "both",
    relatedTerms: ["mofc", "cover-2", "cover-4"],
    examples: [
      "MOFO shell – probably Cover 2 or Cover 4.",
      "Hit the post route into the open middle."
    ],
    coachingPoints: [
      "Two high safeties = MOFO",
      "Middle of field is vulnerable to posts and seams",
      "Corners may squat on flat routes"
    ]
  },
  {
    id: "bracket",
    term: "Bracket",
    aliases: ["double", "bracket coverage"],
    category: "coverage",
    definition: "Coverage technique where two defenders work together to cover one receiver, typically with one over the top and one underneath. Used against elite receivers.",
    usage: "defense",
    relatedTerms: ["man", "zone", "help"],
    examples: [
      "Bracket the X receiver.",
      "We're bracketing their best guy."
    ],
    coachingPoints: [
      "Usually a corner underneath, safety over top",
      "Eliminates the best receiver from the play",
      "Creates opportunities elsewhere"
    ]
  },
  {
    id: "robber",
    term: "Robber",
    aliases: ["rat in the hole", "lurker"],
    category: "coverage",
    definition: "A defender who abandons his normal assignment to lurk in a zone, looking to intercept passes. Often a safety or linebacker who 'robs' underneath routes.",
    usage: "defense",
    relatedTerms: ["cover-1", "trap", "bait"],
    examples: [
      "The safety is playing robber.",
      "Watch for the robber on the in-cut."
    ],
    coachingPoints: [
      "Robber reads the QB's eyes",
      "Often sits on crossers and digs",
      "Can jump routes for interceptions"
    ]
  },
  {
    id: "trap-coverage",
    term: "Trap Coverage",
    aliases: ["trap", "bait"],
    category: "coverage",
    definition: "A defensive look that intentionally shows one coverage pre-snap but rotates to another post-snap. Designed to bait the QB into a bad throw.",
    usage: "defense",
    relatedTerms: ["disguise", "rotation"],
    examples: [
      "They trapped us with a two-high look.",
      "Don't throw into the trap."
    ],
    coachingPoints: [
      "Read post-snap movement, not just pre-snap",
      "Safety rotation is the key indicator",
      "Patient QBs defeat trap coverage"
    ]
  },
  {
    id: "leverage",
    term: "Leverage",
    aliases: ["inside leverage", "outside leverage"],
    category: "coverage",
    definition: "The position of a defender relative to the receiver. Inside leverage means the defender is aligned to the inside; outside leverage means to the outside. Dictates route adjustments.",
    usage: "both",
    relatedTerms: ["technique", "alignment", "shade"],
    examples: [
      "Corner is in outside leverage – run the slant.",
      "Attack his leverage."
    ],
    coachingPoints: [
      "Outside leverage = inside routes are open",
      "Inside leverage = outside routes are open",
      "Receivers adjust based on leverage"
    ]
  },
  {
    id: "cushion",
    term: "Cushion",
    aliases: ["depth", "off coverage"],
    category: "coverage",
    definition: "The distance between a defensive back and the receiver at the snap. Large cushion means off coverage; no cushion means press coverage.",
    usage: "defense",
    relatedTerms: ["press", "off", "bail"],
    examples: [
      "He's got a 10-yard cushion.",
      "Close the cushion before the break."
    ],
    coachingPoints: [
      "Deep cushion = quick throws underneath",
      "Press means no cushion – physical at line",
      "Eat the cushion with your stem"
    ]
  },
  {
    id: "press",
    term: "Press",
    aliases: ["press coverage", "bump-and-run", "jam"],
    category: "coverage",
    definition: "Coverage technique where the cornerback aligns directly on the receiver and attempts to disrupt his route at the line of scrimmage through physical contact.",
    usage: "defense",
    relatedTerms: ["cushion", "off", "release"],
    examples: [
      "We're playing press on the outside receivers.",
      "Beat the press with a quick release."
    ],
    coachingPoints: [
      "Must disrupt within 5 yards of LOS",
      "High risk, high reward technique",
      "Requires safety help over the top"
    ]
  },
  {
    id: "off",
    term: "Off",
    aliases: ["off coverage", "soft"],
    category: "coverage",
    definition: "Coverage technique where the cornerback aligns 5-10 yards off the receiver, giving up the short throw to prevent deep completions. Also called soft or bail technique.",
    usage: "defense",
    relatedTerms: ["cushion", "press", "bail"],
    examples: [
      "Corners are playing off.",
      "Take the free hitch against off coverage."
    ],
    coachingPoints: [
      "Prevents deep balls",
      "Gives up short throws",
      "Must break on the ball quickly"
    ]
  },
  {
    id: "bail",
    term: "Bail",
    aliases: ["bail technique", "catch"],
    category: "coverage",
    definition: "A technique where a cornerback appears to be in press alignment but turns and runs at the snap, maintaining leverage while retreating. Combines press look with off execution.",
    usage: "defense",
    relatedTerms: ["press", "off", "disguise"],
    examples: [
      "The corner is bailing at the snap.",
      "Bail technique gives a false press look."
    ],
    coachingPoints: [
      "Shows press, plays off",
      "Keeps eyes on receiver while retreating",
      "Used to disguise coverage"
    ]
  },
  {
    id: "trail",
    term: "Trail",
    aliases: ["trail technique", "in-phase"],
    category: "coverage",
    definition: "Man coverage technique where the defender plays slightly behind and to one side of the receiver, positioning to break on the ball. Relies on safety help over the top.",
    usage: "defense",
    relatedTerms: ["man", "phase", "hip"],
    examples: [
      "Trail him inside with help over top.",
      "Stay on his hip in trail technique."
    ],
    coachingPoints: [
      "Inside trail = take inside routes away",
      "Requires help on outside-breaking routes",
      "Stay in-phase – don't lose the receiver"
    ]
  },
  {
    id: "phase",
    term: "Phase",
    aliases: ["in-phase", "out of phase"],
    category: "coverage",
    definition: "The relationship between a defensive back and receiver during the route. 'In-phase' means the DB is in position to defend the catch; 'out of phase' means he's lost position.",
    usage: "defense",
    relatedTerms: ["trail", "hip", "stacked"],
    examples: [
      "He's out of phase – throw it deep.",
      "Stay in phase on the vertical."
    ],
    coachingPoints: [
      "In-phase = hand on hip, eyes on receiver",
      "Out of phase = play the receiver, not the ball",
      "Stack the receiver if you're beat"
    ]
  },
  {
    id: "pattern-match",
    term: "Pattern Match",
    aliases: ["match", "match coverage", "pattern read"],
    category: "coverage",
    definition: "A hybrid coverage that begins as zone but converts to man-to-man based on receiver route distribution. Defenders 'match' specific route patterns rather than covering grass.",
    usage: "defense",
    relatedTerms: ["zone", "man", "quarters"],
    examples: [
      "We're in pattern match quarters.",
      "Match the #2 receiver if he goes vertical."
    ],
    coachingPoints: [
      "Starts zone, becomes man based on routes",
      "Defenders have 'match' rules for each receiver",
      "Eliminates dead zones in pure zone coverage"
    ]
  },
  {
    id: "reroute",
    term: "Reroute",
    aliases: ["collision", "re-route"],
    category: "coverage",
    definition: "A technique where a defender redirects a receiver's route by making contact and forcing them to change direction. Disrupts timing and route spacing.",
    usage: "defense",
    relatedTerms: ["press", "jam", "disrupt"],
    examples: [
      "Reroute the slot receiver.",
      "The reroute threw off the timing."
    ],
    coachingPoints: [
      "Legal within 5 yards of LOS",
      "Disrupts timing throws",
      "Must maintain eye discipline after contact"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TERMS
// ═══════════════════════════════════════════════════════════════════════════

const ROUTE_TERMS: FootballTerm[] = [
  {
    id: "stem",
    term: "Stem",
    aliases: ["route stem", "vertical stem"],
    category: "route",
    definition: "The initial vertical portion of a route before the break point. The stem sells the route and attacks the defender's leverage. A good stem makes all routes look the same.",
    usage: "offense",
    relatedTerms: ["break", "route", "release"],
    examples: [
      "Push your stem to 12 yards before breaking.",
      "All routes need the same stem."
    ],
    coachingPoints: [
      "Sell vertical with your stem",
      "Attack the defender's leverage",
      "Consistent stem makes routes unpredictable"
    ]
  },
  {
    id: "break",
    term: "Break",
    aliases: ["break point", "cut"],
    category: "route",
    definition: "The point in a route where the receiver changes direction. A sharp, efficient break creates separation. The break should be at full speed with sudden change of direction.",
    usage: "offense",
    relatedTerms: ["stem", "burst", "separation"],
    examples: [
      "Break at 14 yards.",
      "Your break needs to be sharper."
    ],
    coachingPoints: [
      "Drop your weight on the plant foot",
      "Accelerate out of the break",
      "Eyes back to QB immediately after break"
    ]
  },
  {
    id: "landmark",
    term: "Landmark",
    aliases: ["target area", "spot"],
    category: "route",
    definition: "A specific point on the field the receiver aims for at the conclusion of his route. Provides consistent spacing and timing for the quarterback.",
    usage: "offense",
    relatedTerms: ["depth", "spacing"],
    examples: [
      "Your landmark is the back pylon.",
      "Settle at the landmark and find the window."
    ],
    coachingPoints: [
      "Every route has a landmark",
      "Landmarks ensure proper spacing",
      "Adjust landmark vs different coverages"
    ]
  },
  {
    id: "depth",
    term: "Depth",
    aliases: ["route depth", "yards"],
    category: "route",
    definition: "How far downfield a receiver runs before making his break. Depth must be consistent for timing with the quarterback's drop.",
    usage: "offense",
    relatedTerms: ["landmark", "stem", "break"],
    examples: [
      "Get your depth before breaking.",
      "Your dig route is at 14 yards depth."
    ],
    coachingPoints: [
      "Depth varies by coverage and concept",
      "Deeper against soft coverage",
      "Consistent depth allows timing throws"
    ]
  },
  {
    id: "release",
    term: "Release",
    aliases: ["release technique", "get-off"],
    category: "route",
    definition: "How a receiver gets off the line of scrimmage. Types include inside release, outside release, vertical release, and speed release. Critical against press coverage.",
    usage: "offense",
    relatedTerms: ["press", "stem", "leverage"],
    examples: [
      "Inside release on the post.",
      "Win your release against press."
    ],
    coachingPoints: [
      "Attack defender's leverage with release",
      "Inside release = post, slant, dig",
      "Outside release = go, out, corner"
    ]
  },
  {
    id: "separation",
    term: "Separation",
    aliases: ["create separation", "space"],
    category: "route",
    definition: "Creating distance between yourself and the defender. Can be achieved through the release, stem, break, or speed. Separation creates throwing windows.",
    usage: "offense",
    relatedTerms: ["break", "release", "burst"],
    examples: [
      "Create separation on the break.",
      "He got good separation at the top."
    ],
    coachingPoints: [
      "Separation is the goal of every route",
      "Sell one route, run another",
      "Burst out of breaks creates separation"
    ]
  },
  {
    id: "settle",
    term: "Settle",
    aliases: ["sit", "find a window"],
    category: "route",
    definition: "When a receiver stops in an open zone area (soft spot) versus zone coverage rather than continuing to run. The receiver 'settles' in the open space for an easy throw.",
    usage: "offense",
    relatedTerms: ["zone", "window", "landmark"],
    examples: [
      "Settle in the hole against zone.",
      "Sit down in the soft spot."
    ],
    coachingPoints: [
      "Only settle vs zone, keep running vs man",
      "Find the window between defenders",
      "Stay alert and work back to the QB"
    ]
  },
  {
    id: "conversion",
    term: "Conversion",
    aliases: ["convert the route", "option"],
    category: "route",
    definition: "When a receiver changes his route based on coverage recognition. For example, converting a curl to a comeback against inside leverage.",
    usage: "offense",
    relatedTerms: ["option-route", "leverage", "read"],
    examples: [
      "Convert the curl against inside leverage.",
      "He converted to the out route."
    ],
    coachingPoints: [
      "Receiver reads coverage and adjusts",
      "Must be on same page as QB",
      "Practice conversions extensively"
    ]
  },
  {
    id: "option-route",
    term: "Option Route",
    aliases: ["choice route", "read route"],
    category: "route",
    definition: "A route where the receiver has multiple options based on the coverage. The receiver reads the defender and chooses the best route. Requires same read by QB and receiver.",
    usage: "offense",
    relatedTerms: ["conversion", "leverage", "coverage-read"],
    examples: [
      "Run the option based on the linebacker.",
      "He ran the option route to the soft spot."
    ],
    coachingPoints: [
      "Receiver and QB must read the same thing",
      "Practice option routes together",
      "Typically vs man = out, vs zone = sit"
    ]
  },
  {
    id: "throttle",
    term: "Throttle",
    aliases: ["throttle down", "gear change"],
    category: "route",
    definition: "Reducing speed on a route to maintain position or timing. Also used to set up a break by changing gears before accelerating into the cut.",
    usage: "offense",
    relatedTerms: ["burst", "break", "sell"],
    examples: [
      "Throttle down before the break.",
      "Change gears and explode out."
    ],
    coachingPoints: [
      "Throttle to set up the defender",
      "Speed changes create separation",
      "Don't give away the break point"
    ]
  },
  {
    id: "stack",
    term: "Stack",
    aliases: ["stacking", "get stacked"],
    category: "route",
    definition: "Positioning your body directly in front of or behind the defender on a vertical route. Creates leverage advantage and makes it difficult for the defender to make a play on the ball.",
    usage: "offense",
    relatedTerms: ["vertical", "go", "position"],
    examples: [
      "Stack the corner on the go route.",
      "He got stacked and couldn't recover."
    ],
    coachingPoints: [
      "Stack inside for back-shoulder throws",
      "Stack outside for high balls to sideline",
      "Maintain stack through the catch point"
    ]
  },
  {
    id: "burst",
    term: "Burst",
    aliases: ["acceleration", "explosion"],
    category: "route",
    definition: "A sudden acceleration, typically out of a route break. Burst creates separation and signals to the QB that the receiver is ready for the ball.",
    usage: "offense",
    relatedTerms: ["break", "separation", "throttle"],
    examples: [
      "Burst out of the break.",
      "Great burst created the separation."
    ],
    coachingPoints: [
      "Save your burst for after the break",
      "Burst signals you're open",
      "Accelerate through the catch"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTION TERMS
// ═══════════════════════════════════════════════════════════════════════════

const PROTECTION_TERMS: FootballTerm[] = [
  {
    id: "slide",
    term: "Slide",
    aliases: ["slide protection", "zone protection"],
    category: "protection",
    definition: "A protection scheme where the offensive line slides together in one direction to pick up a potential overload. The RB typically handles the backside rusher.",
    usage: "offense",
    relatedTerms: ["bob", "man-protection", "gap"],
    examples: [
      "Slide left, RB has the right end.",
      "Slide to the pressure."
    ],
    coachingPoints: [
      "Slide toward the perceived threat",
      "RB picks up backside pressure",
      "Center typically makes the slide call"
    ]
  },
  {
    id: "bob",
    term: "BOB",
    aliases: ["big on big", "man protection"],
    category: "protection",
    definition: "Big-On-Big protection. Offensive linemen block defensive linemen, and backs block linebackers. Each blocker has a specific man assignment regardless of stunt or blitz.",
    usage: "offense",
    relatedTerms: ["slide", "man-protection", "gap"],
    examples: [
      "We're in BOB protection.",
      "Big on big – linemen have linemen."
    ],
    coachingPoints: [
      "Each lineman has a specific assignment",
      "Better against twists and stunts",
      "RB must identify his blitzer"
    ]
  },
  {
    id: "max-protect",
    term: "Max Protect",
    aliases: ["max", "heavy protection"],
    category: "protection",
    definition: "Maximum protection using extra blockers (TE, RB) to handle pressure. Limits receivers in the pattern but provides more time for deep routes to develop.",
    usage: "offense",
    relatedTerms: ["protection", "seven-man", "blitz"],
    examples: [
      "Max protect for the deep shot.",
      "Keep everyone in on max."
    ],
    coachingPoints: [
      "Use against heavy blitzes",
      "Fewer receivers = simpler read",
      "Requires receivers to win 1-on-1"
    ]
  },
  {
    id: "scan",
    term: "Scan",
    aliases: ["RB scan", "check release"],
    category: "protection",
    definition: "The running back's responsibility to check for blitzes before releasing into his route. He 'scans' the defense from inside to outside for free rushers.",
    usage: "offense",
    relatedTerms: ["check-release", "blitz-pickup"],
    examples: [
      "Scan the LBs before you release.",
      "No one comes, you're out."
    ],
    coachingPoints: [
      "Inside-out scanning priority",
      "If clean, release into route",
      "Block the most dangerous threat"
    ]
  },
  {
    id: "chip",
    term: "Chip",
    aliases: ["chip block", "help"],
    category: "protection",
    definition: "A quick block by a receiver or tight end on a pass rusher before releasing into a route. Provides brief help to the offensive line while still getting a receiver into the pattern.",
    usage: "offense",
    relatedTerms: ["release", "help", "protection"],
    examples: [
      "Chip the DE on your release.",
      "Give a chip and get out."
    ],
    coachingPoints: [
      "Make solid contact before releasing",
      "Don't get stuck blocking",
      "Slows down edge rushers"
    ]
  },
  {
    id: "gap",
    term: "Gap",
    aliases: ["A-gap", "B-gap", "C-gap"],
    category: "protection",
    definition: "The spaces between offensive linemen. A-gap is between C and G, B-gap is between G and T, C-gap is outside the tackle. D-gap is outside the TE.",
    usage: "both",
    relatedTerms: ["hole", "run-fit", "protection"],
    examples: [
      "The blitz is coming through the A-gap.",
      "Fit your gap on the run."
    ],
    coachingPoints: [
      "A-gap = between Center and Guard",
      "B-gap = between Guard and Tackle",
      "C-gap = outside Tackle"
    ]
  },
  {
    id: "edge",
    term: "Edge",
    aliases: ["the edge", "outside"],
    category: "protection",
    definition: "The outside area of the offensive line where pass rushers attack. Edge pressure comes from defensive ends and outside linebackers. Protecting the edge is critical.",
    usage: "both",
    relatedTerms: ["tackle", "speed-rush", "contain"],
    examples: [
      "Hold the edge!",
      "The edge rusher got home."
    ],
    coachingPoints: [
      "Tackles protect the edge",
      "Speed rushers attack the edge",
      "Can't let rushers get around the corner"
    ]
  },
  {
    id: "pick-up",
    term: "Pick Up",
    aliases: ["pickup", "block"],
    category: "protection",
    definition: "Identifying and blocking a blitzer. The offense must 'pick up' all rushers, especially unexpected blitzers from the secondary or linebacker level.",
    usage: "offense",
    relatedTerms: ["blitz", "protection", "scan"],
    examples: [
      "Pick up the nickel corner blitz.",
      "Who has the A-gap pickup?"
    ],
    coachingPoints: [
      "Communication is key for pickups",
      "Point and call out blitzers",
      "Don't let anyone come free"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// RUN GAME TERMS
// ═══════════════════════════════════════════════════════════════════════════

const RUN_GAME_TERMS: FootballTerm[] = [
  {
    id: "zone",
    term: "Zone",
    aliases: ["zone blocking", "outside zone", "inside zone"],
    category: "run-game",
    definition: "A blocking scheme where linemen block areas rather than specific defenders. Linemen work in combination to reach the playside and create cutback lanes.",
    usage: "offense",
    relatedTerms: ["gap", "power", "stretch"],
    examples: [
      "Inside zone to the right.",
      "Zone concepts create cutback lanes."
    ],
    coachingPoints: [
      "Work in combos to the second level",
      "Create horizontal movement at the line",
      "RB reads the blocks and cuts"
    ]
  },
  {
    id: "gap-scheme",
    term: "Gap Scheme",
    aliases: ["power", "counter", "trap"],
    category: "run-game",
    definition: "Blocking schemes where linemen block down and a puller comes around to kick out or lead through the hole. Creates defined running lanes through physical blocking.",
    usage: "offense",
    relatedTerms: ["zone", "pull", "kick-out"],
    examples: [
      "Power right with the guard pulling.",
      "Gap scheme gives us a defined hole."
    ],
    coachingPoints: [
      "Down blocks + puller = gap scheme",
      "Defined hole for the RB",
      "Requires physical play"
    ]
  },
  {
    id: "pull",
    term: "Pull",
    aliases: ["pulling", "puller"],
    category: "run-game",
    definition: "When an offensive lineman leaves his position and runs laterally to block a defender at or beyond the point of attack. Common in power, counter, and sweep plays.",
    usage: "offense",
    relatedTerms: ["gap-scheme", "kick-out", "lead"],
    examples: [
      "The guard pulls and kicks out.",
      "Lead with the pulling guard."
    ],
    coachingPoints: [
      "Depth on the pull is critical",
      "Eyes up looking for target",
      "Kick out or lead up based on scheme"
    ]
  },
  {
    id: "kick-out",
    term: "Kick Out",
    aliases: ["kick out block", "log"],
    category: "run-game",
    definition: "A block that takes a defender toward the sideline, creating a lane for the ball carrier. The blocker attacks the defender's inside shoulder to force them outside.",
    usage: "offense",
    relatedTerms: ["pull", "gap-scheme", "lead"],
    examples: [
      "Kick out the DE.",
      "The fullback kicks out the end man."
    ],
    coachingPoints: [
      "Attack inside shoulder",
      "Drive defender toward sideline",
      "Create lane inside your block"
    ]
  },
  {
    id: "cutback",
    term: "Cutback",
    aliases: ["cut back", "backside cut"],
    category: "run-game",
    definition: "When the running back plants and reverses direction away from the play flow, running behind over-pursuing defenders. A key read for zone running plays.",
    usage: "offense",
    relatedTerms: ["zone", "read", "patience"],
    examples: [
      "Great cutback for a 20-yard gain.",
      "The cutback lane was wide open."
    ],
    coachingPoints: [
      "Cutback comes from backside defender over-pursuit",
      "Be patient and let blocks develop",
      "One cut and go"
    ]
  },
  {
    id: "read",
    term: "Read",
    aliases: ["read the block", "run read"],
    category: "run-game",
    definition: "The running back's ability to see blocks develop and choose the best path. Also refers to option plays where the QB reads a defender to determine handoff or keep.",
    usage: "offense",
    relatedTerms: ["cutback", "vision", "patience"],
    examples: [
      "Read the tackle's block.",
      "He's got great reads."
    ],
    coachingPoints: [
      "Eyes on the defenders, not the ball",
      "React to what the defense gives you",
      "Trust your linemen's blocks"
    ]
  },
  {
    id: "press-hole",
    term: "Press the Hole",
    aliases: ["hit the hole", "attack"],
    category: "run-game",
    definition: "Running directly at the intended gap aggressively to set up blocks and force defenders to commit. Allows the RB to make one decisive cut based on how blocks develop.",
    usage: "offense",
    relatedTerms: ["patient", "vision", "cut"],
    examples: [
      "Press the hole, then make one cut.",
      "Don't dance – press it and cut."
    ],
    coachingPoints: [
      "Press the hole to set up blockers",
      "Make defenders commit to a path",
      "One cut and north-south"
    ]
  },
  {
    id: "patient",
    term: "Patient",
    aliases: ["be patient", "let it develop"],
    category: "run-game",
    definition: "Allowing blocks to develop before committing to a running lane. Requires the RB to trust his eyes and linemen rather than immediately hitting the designed hole.",
    usage: "offense",
    relatedTerms: ["vision", "read", "cutback"],
    examples: [
      "Be patient behind the line.",
      "His patience created the big run."
    ],
    coachingPoints: [
      "Let blocks set up before committing",
      "Don't outrun your blockers",
      "Patience doesn't mean slow"
    ]
  },
  {
    id: "downhill",
    term: "Downhill",
    aliases: ["north-south", "vertical"],
    category: "run-game",
    definition: "Running straight upfield toward the end zone rather than laterally. Downhill runners gain tough yards and don't waste steps going east-west.",
    usage: "offense",
    relatedTerms: ["patient", "cut", "physical"],
    examples: [
      "Get downhill and get yards.",
      "He's a north-south downhill runner."
    ],
    coachingPoints: [
      "Make one cut and go downhill",
      "Yards are gained going forward",
      "Don't dance in the backfield"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEFENSIVE TERMS
// ═══════════════════════════════════════════════════════════════════════════

const DEFENSIVE_TERMS: FootballTerm[] = [
  {
    id: "contain",
    term: "Contain",
    aliases: ["set the edge", "force"],
    category: "defensive",
    definition: "The defender responsible for preventing the ball carrier from getting to the outside. Must maintain outside leverage and force the play back inside to pursuit.",
    usage: "defense",
    relatedTerms: ["force", "edge", "spill"],
    examples: [
      "The end has contain.",
      "Don't get reached – maintain contain."
    ],
    coachingPoints: [
      "Force everything back inside",
      "Never get hooked by a blocker",
      "Wrong-arm if you can't squeeze"
    ]
  },
  {
    id: "force",
    term: "Force",
    aliases: ["force player", "alley"],
    category: "defensive",
    definition: "The defender responsible for constricting the running lane from the outside-in. The force player attacks downhill and makes the ball carrier commit to a path.",
    usage: "defense",
    relatedTerms: ["contain", "alley", "fit"],
    examples: [
      "Strong safety is the force.",
      "Force the play to spill."
    ],
    coachingPoints: [
      "Attack downhill aggressively",
      "Make the runner commit",
      "Force depends on coverage (sky vs cloud)"
    ]
  },
  {
    id: "spill",
    term: "Spill",
    aliases: ["spill technique", "wrong-arm"],
    category: "defensive",
    definition: "A technique where the defender takes on a blocker with inside leverage, forcing the ball carrier to bounce outside toward pursuit. The opposite of squeeze.",
    usage: "defense",
    relatedTerms: ["squeeze", "contain", "force"],
    examples: [
      "Spill the pulling guard.",
      "If you can't squeeze, spill it."
    ],
    coachingPoints: [
      "Attack blocker with inside shoulder",
      "Force ball to bounce outside",
      "Requires pursuit to clean up outside"
    ]
  },
  {
    id: "squeeze",
    term: "Squeeze",
    aliases: ["squeeze technique", "close"],
    category: "defensive",
    definition: "A technique where the defender takes on a blocker with outside leverage, forcing the ball carrier to cut back inside toward the pursuit. The opposite of spill.",
    usage: "defense",
    relatedTerms: ["spill", "contain", "fit"],
    examples: [
      "Squeeze and force the cutback.",
      "Squeeze the down block."
    ],
    coachingPoints: [
      "Attack blocker with outside shoulder",
      "Force ball back inside",
      "Inside pursuit makes the play"
    ]
  },
  {
    id: "fit",
    term: "Fit",
    aliases: ["run fit", "fit technique"],
    category: "defensive",
    definition: "How defenders position themselves relative to blockers and gaps in the run game. Proper fits eliminate cutback lanes and force the ball to pursuit.",
    usage: "defense",
    relatedTerms: ["gap", "spill", "squeeze"],
    examples: [
      "Fit your gap correctly.",
      "His fit was off and they hit the cutback."
    ],
    coachingPoints: [
      "Know your gap responsibility",
      "Don't let blockers wash you out",
      "Stay in your fit until the ball declares"
    ]
  },
  {
    id: "pursuit",
    term: "Pursuit",
    aliases: ["pursuit angles", "rally"],
    category: "defensive",
    definition: "How defenders track and run to the ball carrier. Proper pursuit angles cut off the runner; bad angles allow yards after contact or cutbacks.",
    usage: "defense",
    relatedTerms: ["angle", "rally", "finish"],
    examples: [
      "Take a good pursuit angle.",
      "Fast pursuit cuts off the edge."
    ],
    coachingPoints: [
      "Run to where the ball is going, not where it is",
      "Don't over-pursue and get cut back",
      "Effort on pursuit shows up on film"
    ]
  },
  {
    id: "box-count",
    term: "Box Count",
    aliases: ["box", "loaded box"],
    category: "defensive",
    definition: "The number of defenders in the tackle box (between the tackles, within 8 yards of LOS). Used by offenses to determine run/pass calls. 8+ in box = throw, 6 or less = run.",
    usage: "both",
    relatedTerms: ["personnel", "formation", "check-with-me"],
    examples: [
      "They've got 8 in the box.",
      "Light box – we can run it."
    ],
    coachingPoints: [
      "Count the box pre-snap",
      "Loaded box = throw it",
      "Spread formations lighten the box"
    ]
  },
  {
    id: "stack",
    term: "Stack",
    aliases: ["stacked", "stack alignment"],
    category: "defensive",
    definition: "When a linebacker aligns directly behind a defensive lineman, hidden from the offense's view. Makes it harder to identify blitzes and blocking assignments.",
    usage: "defense",
    relatedTerms: ["alignment", "front", "blitz"],
    examples: [
      "The MIKE is stacked behind the nose.",
      "Watch for stack-and-shed."
    ],
    coachingPoints: [
      "Stack hides the LB from blockers",
      "DL protects LB to make plays",
      "Stack-and-shed is key technique"
    ]
  },
  {
    id: "penetration",
    term: "Penetration",
    aliases: ["penetrating", "TFL"],
    category: "defensive",
    definition: "When a defender crosses the line of scrimmage into the backfield before or at the snap. Disrupts timing and can blow up plays in the backfield.",
    usage: "defense",
    relatedTerms: ["gap", "tackle-for-loss"],
    examples: [
      "Great penetration by the tackle.",
      "He penetrated the A-gap."
    ],
    coachingPoints: [
      "Get off on the snap",
      "Penetrate your gap responsibility",
      "Don't penetrate and get washed out"
    ]
  },
  {
    id: "two-gap",
    term: "Two-Gap",
    aliases: ["two-gapping", "read and react"],
    category: "defensive",
    definition: "A technique where a defensive lineman is responsible for two gaps, controlling the blocker and reacting to the ball. Common in 3-4 defenses.",
    usage: "defense",
    relatedTerms: ["one-gap", "control", "read"],
    examples: [
      "The nose tackle is two-gapping.",
      "Two-gap and find the ball."
    ],
    coachingPoints: [
      "Control the blocker, then find ball",
      "Don't get driven off the ball",
      "React to flow, don't guess"
    ]
  },
  {
    id: "one-gap",
    term: "One-Gap",
    aliases: ["one-gapping", "penetrating"],
    category: "defensive",
    definition: "A technique where a defensive lineman is responsible for one specific gap and attacks it aggressively. More aggressive than two-gap technique.",
    usage: "defense",
    relatedTerms: ["two-gap", "penetration", "attack"],
    examples: [
      "Our defense is one-gap aggressive.",
      "One-gap the B-gap and get upfield."
    ],
    coachingPoints: [
      "Attack your one gap responsibility",
      "Get penetration and disrupt",
      "Can be vulnerable to misdirection"
    ]
  },
  {
    id: "blitz",
    term: "Blitz",
    aliases: ["pressure", "bring heat"],
    category: "defensive",
    definition: "Sending more pass rushers than the offense can block. Can come from linebackers, safeties, or corners. High-risk, high-reward strategy.",
    usage: "defense",
    relatedTerms: ["pressure", "zone-blitz", "man-blitz"],
    examples: [
      "We're blitzing the MIKE.",
      "Corner blitz from the boundary."
    ],
    coachingPoints: [
      "Blitz must get home quickly",
      "Creates 1-on-1 coverage situations",
      "Pick your spots wisely"
    ]
  },
  {
    id: "zone-blitz",
    term: "Zone Blitz",
    aliases: ["fire zone", "zone pressure"],
    category: "defensive",
    definition: "A blitz scheme that drops a defensive lineman into coverage while sending a DB or LB. Maintains zone coverage while still creating pressure. Invented by Dick LeBeau.",
    usage: "defense",
    relatedTerms: ["blitz", "fire-zone", "trap"],
    examples: [
      "Zone blitz – the end drops to the flat.",
      "Fire zone with three deep."
    ],
    coachingPoints: [
      "Unexpected rusher, unexpected dropper",
      "Maintains coverage integrity",
      "Confuses offensive line"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SITUATIONAL TERMS
// ═══════════════════════════════════════════════════════════════════════════

const SITUATIONAL_TERMS: FootballTerm[] = [
  {
    id: "two-minute",
    term: "Two-Minute",
    aliases: ["two-minute drill", "hurry-up"],
    category: "situational",
    definition: "An up-tempo offensive strategy used when time is running out. Focus on clock management, sideline routes, and efficient plays. No-huddle operation.",
    usage: "offense",
    relatedTerms: ["tempo", "clock", "hurry-up"],
    examples: [
      "We're in two-minute mode.",
      "Run the two-minute drill."
    ],
    coachingPoints: [
      "Sideline routes stop the clock",
      "Know the timeouts remaining",
      "No penalties – don't give them free time"
    ]
  },
  {
    id: "red-zone",
    term: "Red Zone",
    aliases: ["red area", "scoring area"],
    category: "situational",
    definition: "The area inside the opponent's 20-yard line. Offenses aim for touchdowns, not field goals. The compressed field changes route concepts and play-calling.",
    usage: "both",
    relatedTerms: ["goal-line", "scoring"],
    examples: [
      "We're in the red zone.",
      "Red zone efficiency wins games."
    ],
    coachingPoints: [
      "Field is compressed – routes are shorter",
      "Back shoulder and fade throws are key",
      "Don't settle for field goals"
    ]
  },
  {
    id: "goal-line",
    term: "Goal Line",
    aliases: ["goal-to-go", "short yardage"],
    category: "situational",
    definition: "The area inside the 5-yard line where the end zone compresses the field. Heavy personnel, power running, and play-action are common.",
    usage: "both",
    relatedTerms: ["red-zone", "short-yardage"],
    examples: [
      "First and goal from the 2.",
      "Goal-line package."
    ],
    coachingPoints: [
      "Overpower the defense",
      "Play-action is deadly here",
      "Fade to the back pylon"
    ]
  },
  {
    id: "third-down",
    term: "Third Down",
    aliases: ["money down", "conversion"],
    category: "situational",
    definition: "The most critical down for sustaining drives. Offenses tailor plays to gain exactly the needed yardage. Defenses often bring pressure or play softer coverage.",
    usage: "both",
    relatedTerms: ["conversion", "fourth-down"],
    examples: [
      "Third and long.",
      "Third down is money time."
    ],
    coachingPoints: [
      "Get the first down – don't try for more",
      "Know the sticks",
      "Defense expects pass on 3rd and long"
    ]
  },
  {
    id: "fourth-down",
    term: "Fourth Down",
    aliases: ["fourth-and-go", "go for it"],
    category: "situational",
    definition: "The final down to gain a first down. Teams either punt, kick a field goal, or 'go for it' with a play. Analytics have increased fourth-down aggression.",
    usage: "both",
    relatedTerms: ["conversion", "punt"],
    examples: [
      "Fourth and 1 – we're going for it.",
      "Analytics say go on fourth."
    ],
    coachingPoints: [
      "Field position matters",
      "Know the high-percentage plays",
      "Element of surprise can work"
    ]
  },
  {
    id: "clock-management",
    term: "Clock Management",
    aliases: ["clock", "burn clock"],
    category: "situational",
    definition: "Managing the game clock to your advantage. When leading, you milk the clock; when trailing, you hurry to preserve time.",
    usage: "both",
    relatedTerms: ["two-minute", "timeouts"],
    examples: [
      "Manage the clock.",
      "Burn clock and punt for the win."
    ],
    coachingPoints: [
      "Timeouts are precious late in games",
      "Run plays keep clock moving",
      "Sideline passes stop the clock"
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMBINE ALL TERMS
// ═══════════════════════════════════════════════════════════════════════════

export const FOOTBALL_TERMS: FootballTerm[] = [
  ...GENERAL_TERMS,
  ...PASSING_TERMS,
  ...COVERAGE_TERMS,
  ...ROUTE_TERMS,
  ...PROTECTION_TERMS,
  ...RUN_GAME_TERMS,
  ...DEFENSIVE_TERMS,
  ...SITUATIONAL_TERMS,
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find a term by ID
 */
export function getTermById(id: string): FootballTerm | undefined {
  return FOOTBALL_TERMS.find((t) => t.id === id);
}

/**
 * Search for terms by name or alias
 */
export function searchTerms(query: string): FootballTerm[] {
  const lowerQuery = query.toLowerCase();
  return FOOTBALL_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(lowerQuery) ||
      t.aliases.some((a) => a.toLowerCase().includes(lowerQuery)) ||
      t.definition.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: TermCategory): FootballTerm[] {
  return FOOTBALL_TERMS.filter((t) => t.category === category);
}

/**
 * Get terms by usage
 */
export function getTermsByUsage(usage: TermUsage): FootballTerm[] {
  return FOOTBALL_TERMS.filter((t) => t.usage === usage || t.usage === "both");
}

/**
 * Get related terms
 */
export function getRelatedTerms(termId: string): FootballTerm[] {
  const term = getTermById(termId);
  if (!term) return [];
  return term.relatedTerms
    .map((id) => getTermById(id))
    .filter((t): t is FootballTerm => t !== undefined);
}

/**
 * Get all categories
 */
export function getCategories(): TermCategory[] {
  return [...new Set(FOOTBALL_TERMS.map((t) => t.category))];
}

/**
 * Get random terms for flashcards/quizzes
 */
export function getRandomTerms(count: number): FootballTerm[] {
  const shuffled = [...FOOTBALL_TERMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
