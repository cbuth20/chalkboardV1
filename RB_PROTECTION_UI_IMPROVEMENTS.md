# RB Protection Trainer — UI Improvements

## Field Realism

### Hash marks & yard numbers
- Add hash marks (short horizontal ticks) at standard positions across yard lines
- Add yard line numbers (10, 20, 30, etc.) along the sideline edges
- Makes the field feel like a real football field instead of a flat green rectangle

### Line of Scrimmage
- Currently a faint teal line that's easy to miss
- Make it thicker, dashed, or add a subtle glow — it's the most important reference point on the field

### Sideline borders
- Add sideline markings along left/right edges of the field

### Field depth
- Add a subtle vertical gradient (slightly darker at edges) for depth
- Consider a subtle grass texture (CSS noise pattern or repeating SVG) — adds visual richness without distraction

---

## Helmet Contrast & Readability

### OL helmets too dark
- Navy fill on dark green field makes OL nearly invisible
- Lighten the fill or add a brighter stroke for contrast

### Defender overlap
- Blitzing CB overlaps with the E below it — hard to read either label
- Add overlap avoidance or z-index layering for stacked defenders

### Hot defender indicator
- The tiny 🔥 emoji is easy to miss
- Use a larger pulsing glow, brighter badge, or more prominent visual to make the free runner obvious at a glance

---

## Interaction Clarity

### Defensive helmets don't look clickable
- No hover state or visual affordance telling the player to tap a defender
- Add a subtle idle pulse, brighter border, or "Pick the hot defender" prompt
- Consider a cursor change on hover

### Release button
- Floating below TB looks disconnected from the game
- Style as a more prominent action button or integrate closer to the TB helmet

---

## Space Usage

### Dead space at top of field
- Top ~25% is empty (secondary at y:20-30 leaves a big gap)
- Compress the y-range slightly or fill with field markings

### Legend
- Bottom legend is small and takes extra vertical space
- Could integrate into the header bar or show as a first-time tooltip instead

---

## Polish

### Helmet depth
- Add drop shadows on helmets to separate them from the field

### Progress bar
- Show play results (correct/incorrect dots or icons) instead of a plain bar

### Animations
- Subtle idle animations on clickable elements to convey interactivity
