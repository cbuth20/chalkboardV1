"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TAG SELECTOR — Value Selection for Tag Categories
// Football-specific options for each tag type
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { TagCategory } from '../types';

interface TagSelectorProps {
  category: TagCategory;
  onSelect: (value: string) => void;
  onClose: () => void;
}

// Football-specific tag options
const TAG_OPTIONS: Record<TagCategory, string[]> = {
  formation: [
    '2x2', '3x1', 'Trips', 'Empty', 'Bunch', 'Stack', 'Twins',
    'Pro', 'Ace', 'I-Form', 'Offset I', 'Pistol', 'Gun', 'Singleback',
    '21 Personnel', '11 Personnel', '12 Personnel', '10 Personnel', '20 Personnel',
    'Wing', 'Flex', 'Slot', 'Split', 'Jumbo', 'Goal Line',
  ],
  personnel: [
    '11 (1RB, 1TE)', '12 (1RB, 2TE)', '21 (2RB, 1TE)', '22 (2RB, 2TE)',
    '10 (1RB, 0TE)', '13 (1RB, 3TE)', '20 (2RB, 0TE)', '23 (2RB, 3TE)',
    'Empty', '00 Personnel', 'Jumbo', 'Heavy',
  ],
  playName: [
    // Common route concepts
    'Mesh', 'Smash', 'Flood', 'Four Verticals', 'Sail', 'Drive',
    'Y-Cross', 'Dagger', 'Spot', 'Curl-Flat', 'Scissors', 'Double Slant',
    // Run plays
    'Inside Zone', 'Outside Zone', 'Power', 'Counter', 'Duo', 'Toss',
    'Sweep', 'Trap', 'Draw', 'Stretch', 'Pin & Pull',
    // PA & Screens
    'Play Action', 'Bootleg', 'Naked', 'Bubble Screen', 'Tunnel Screen', 'Jailbreak Screen',
  ],
  motion: [
    'Jet Motion', 'Orbit Motion', 'Shift', 'Trade', 'Return Motion',
    'Fly Motion', 'Flash Motion', 'Push Motion', 'Pull Motion',
    'No Motion', 'Pre-Snap Shift', 'Post-Snap Motion',
  ],
  playType: [
    'Run', 'Pass', 'Play Action', 'RPO', 'Screen', 'Draw', 'Trick Play',
    'QB Run', 'Designed QB Run', 'Scramble',
  ],
  front: [
    '4-3 Over', '4-3 Under', '3-4 Odd', '3-4 Even',
    'Nickel', 'Dime', 'Quarter', 'Bear', 'Eagle', 'Okie',
    '4-2-5', '3-3-5', '4-4', '5-2', '6-2', 'Goal Line',
    'Tite', 'Wide', 'Reduced', 'Plus', 'Mint',
  ],
  coverage: [
    'Cover 0', 'Cover 1', 'Cover 2', 'Cover 3', 'Cover 4', 'Cover 6',
    'Cover 2 Man', 'Tampa 2', 'Cover 3 Cloud', 'Cover 3 Sky',
    'Quarters', 'Quarter-Quarter-Half', 'Man Free', 'Robber',
    'Pattern Match', 'Bracket', 'Double Team', 'Zone Blitz',
    '2-Read', '3-Read', 'Palms', 'Clamp', 'Solo',
  ],
  routeConcept: [
    // Basic Routes
    'Go / Fly', 'Post', 'Corner', 'Dig / In', 'Out', 'Curl', 'Comeback',
    'Slant', 'Hitch', 'Flat', 'Wheel', 'Seam', 'Option',
    // Concepts
    'Mesh', 'Shallow Cross', 'Y-Cross', 'Smash', 'Sail', 'Flood',
    'Four Verticals', 'Dagger', 'Drive', 'Spot', 'Stick', 'Snag',
    'Mills', 'Levels', 'Hoss', 'China', 'Yankee', 'Double Post',
  ],
  assignment: [
    // OL Assignments
    'Base Block', 'Combo Block', 'Down Block', 'Pull', 'Pass Pro',
    'Reach Block', 'Zone Step', 'Climb to LB', 'Chip & Release',
    // Skill Position
    'Route', 'Block', 'Check Release', 'Motion', 'Fake', 'Lead Block',
    'Pass Protect', 'Swing', 'Delay', 'Stem',
    // QB
    'Read Progression', 'Hot Route', 'Checkdown', 'Scramble', 'Throw Away',
  ],
  downDistance: [
    '1st & 10', '2nd & Short', '2nd & Medium', '2nd & Long',
    '3rd & Short', '3rd & Medium', '3rd & Long',
    '4th & Short', '4th & Medium', '4th & Long',
    'Goal Line', 'Red Zone', '2-Point Conversion',
  ],
  hash: [
    'Left Hash', 'Right Hash', 'Middle',
    'Wide Side Left', 'Wide Side Right',
    'Boundary', 'Field',
  ],
  result: [
    'Completion', 'Incompletion', 'Touchdown', 'First Down',
    'Interception', 'Sack', 'Scramble Gain', 'Penalty',
    'Run Gain', 'Run Loss', 'No Gain', 'Fumble',
    'Short Gain', 'Medium Gain', 'Explosive Play',
  ],
};

export function TagSelector({ category, onSelect, onClose }: TagSelectorProps) {
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');

  const options = TAG_OPTIONS[category] || [];
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      onSelect(customValue.trim());
      setCustomValue('');
    }
  };

  return (
    <div className="rounded-xl bg-[#0A0A0A] border border-[#00F6E5]/20 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1B1E20]">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#00F6E5]">
          Select {category}
        </span>
        <button
          onClick={onClose}
          className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-colors"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[#1B1E20]">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/30"
          />
        </div>
      </div>

      {/* Options */}
      <div className="max-h-48 overflow-y-auto p-2">
        {filteredOptions.length > 0 ? (
          <div className="grid grid-cols-2 gap-1">
            {filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className="px-3 py-2 rounded-lg text-left text-sm text-slate-300 hover:bg-[#00F6E5]/15 hover:text-[#00F6E5] transition-colors truncate"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 py-4">
            No matches found
          </p>
        )}
      </div>

      {/* Custom Input */}
      <form onSubmit={handleCustomSubmit} className="p-2 border-t border-[#1B1E20]">
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Custom value..."
            className="flex-1 px-3 py-2 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/30"
          />
          <button
            type="submit"
            disabled={!customValue.trim()}
            className="px-3 py-2 rounded-lg bg-[#00F6E5]/15 text-[#00F6E5] text-sm font-semibold hover:bg-[#00F6E5]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default TagSelector;








