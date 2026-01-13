import React, { useState, useMemo } from 'react';
import { ROUTE_LIBRARY, RouteDef, ROUTE_TREES, RouteTree, getDepthForLevel } from '@/domain/football/routes';

export type RoutePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  playerLabel?: string;
  onSelect: (routeId: string, customDepth?: number) => void;
  currentRouteId?: string;
  currentDepth?: number;
  level?: 'youth' | 'nfl';
};

type FilterType = 'All' | 'Quick' | 'Intermediate' | 'Deep' | 'Screen' | 'Backfield' | 'Double-Move';

const FILTER_TO_FAMILIES: Record<FilterType, RouteDef['family'][]> = {
  'All': [],
  'Quick': ['quick'],
  'Intermediate': ['intermediate'],
  'Deep': ['deep'],
  'Screen': ['screen'],
  'Backfield': ['backfield'],
  'Double-Move': ['double-move', 'choice'],
};

export function RoutePicker({
  isOpen,
  onClose,
  playerLabel,
  onSelect,
  currentRouteId,
  currentDepth,
  level = 'nfl',
}: RoutePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [activeTree, setActiveTree] = useState<RouteTree | 'all'>('all');
  const [customDepthMap, setCustomDepthMap] = useState<Record<string, number>>({});

  // Get route counts per tree
  const treeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ROUTE_LIBRARY.length };
    ROUTE_TREES.forEach(tree => {
      counts[tree.id] = ROUTE_LIBRARY.filter(r => r.tree === tree.id).length;
    });
    return counts;
  }, []);

  const filteredRoutes = useMemo(() => {
    return ROUTE_LIBRARY.filter((route) => {
      // Tree filter
      if (activeTree !== 'all' && route.tree !== activeTree) {
        return false;
      }

      // Search filter - check label, family, aliases, and tags
      const matchesSearch =
        route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.aliases?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        route.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Family filter
      if (activeFilter !== 'All') {
        const allowedFamilies = FILTER_TO_FAMILIES[activeFilter];
        if (!allowedFamilies.includes(route.family)) return false;
      }

      return true;
    });
  }, [searchTerm, activeFilter, activeTree]);

  const getDepthLabel = (route: RouteDef) => {
    const depth = getDepthForLevel(route, level);
    if (depth.min === depth.max) {
      return `${depth.min} yards`;
    }
    return `${depth.min}–${depth.max} yards`;
  };

  const getDepthBand = (route: RouteDef) => {
    const depth = getDepthForLevel(route, level);
    if (depth.max <= 6) return { label: 'SHORT', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (depth.max <= 14) return { label: 'INT', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { label: 'DEEP', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  };

  const getFamilyBadge = (family: RouteDef['family']) => {
    const badges: Record<RouteDef['family'], { label: string; color: string }> = {
      'quick': { label: 'QUICK', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      'intermediate': { label: 'INT', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      'deep': { label: 'DEEP', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      'screen': { label: 'SCREEN', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      'backfield': { label: 'RB', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      'double-move': { label: 'DBL', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      'choice': { label: 'OPT', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    };
    return badges[family];
  };

  const handleDepthChange = (routeId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomDepthMap((prev) => {
      const route = ROUTE_LIBRARY.find(r => r.id === routeId);
      if (!route) return prev;
      const depth = getDepthForLevel(route, level);
      const current = prev[routeId] ?? depth.min;
      return { ...prev, [routeId]: Math.max(-5, current + delta) }; // Allow negative for screens behind LOS
    });
  };

  const getEffectiveDepth = (route: RouteDef) => {
    const depth = getDepthForLevel(route, level);
    return customDepthMap[route.id] ?? depth.min;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] bg-[#0A0A0A] border-t border-[#1B1E20] shadow-2xl shadow-black/50 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B1E20] bg-gradient-to-b from-[#1B1E20]/50 to-transparent">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-white">
            {playerLabel ? `Routes for ${playerLabel}` : 'Choose Route'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {level === 'youth' ? 'Youth depths (12-18 y/o)' : 'NFL depths (Pro landmarks)'} • {filteredRoutes.length} routes
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1B1E20] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Route Tree Tabs */}
      <div className="flex border-b border-[#1B1E20] bg-[#0d1117]">
        <button
          onClick={() => setActiveTree('all')}
          className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTree === 'all'
              ? 'text-[#00F6E5] border-[#00F6E5] bg-[#00F6E5]/5'
              : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-[#1B1E20]/30'
          }`}
        >
          All
          <span className="ml-1.5 text-[10px] opacity-60">{treeCounts.all}</span>
        </button>
        {ROUTE_TREES.map((tree) => (
          <button
            key={tree.id}
            onClick={() => setActiveTree(tree.id)}
            className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTree === tree.id
                ? 'text-[#00F6E5] border-[#00F6E5] bg-[#00F6E5]/5'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-[#1B1E20]/30'
            }`}
          >
            {tree.shortName}
            <span className="ml-1.5 text-[10px] opacity-60">{treeCounts[tree.id]}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3 bg-[#0A0A0A] border-b border-[#1B1E20]/50">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search routes, aliases, or tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1B1E20] border border-[#1B1E20] rounded-lg text-sm text-white focus:outline-none focus:border-[#00F6E5] focus:ring-1 focus:ring-[#00F6E5] placeholder-slate-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['All', 'Quick', 'Intermediate', 'Deep', 'Screen', 'Backfield', 'Double-Move'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-[#00F6E5]/20 text-[#00F6E5] shadow-[0_0_12px_rgba(0,246,229,0.2)]'
                  : 'bg-[#1B1E20] text-slate-400 hover:bg-[#1B1E20]/80 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Route List */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {filteredRoutes.map((route) => {
          const depthBand = getDepthBand(route);
          const familyBadge = getFamilyBadge(route.family);
          const isSelected = currentRouteId === route.id;
          const effectiveDepth = getEffectiveDepth(route);
          const isCustomDepth = customDepthMap[route.id] !== undefined;

          return (
            <div
              key={route.id}
              onClick={() => onSelect(route.id, isCustomDepth ? effectiveDepth : undefined)}
              className={`group flex items-center justify-between px-5 py-4 border-b border-[#1B1E20]/50 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#00F6E5]/10 border-l-4 border-l-[#00F6E5]'
                  : 'hover:bg-[#1B1E20]/50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-semibold ${isSelected ? 'text-[#00F6E5]' : 'text-white'}`}>
                    {route.label}
                  </h3>
                  {route.aliases && route.aliases.length > 0 && (
                    <span className="text-xs text-slate-500">
                      ({route.aliases.slice(0, 2).join(', ')})
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] text-[#00F6E5] font-bold uppercase tracking-wide">• Selected</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-slate-500">
                    {isCustomDepth ? (
                      <span className="text-[#00F6E5]">{effectiveDepth} yds (custom)</span>
                    ) : (
                      getDepthLabel(route)
                    )}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {route.positionGroup}
                  </span>
                </div>

                {/* Tags */}
                {route.tags && route.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {route.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500 bg-[#1B1E20] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes (shown when selected) */}
                {isSelected && (
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {level === 'youth' ? route.notesYouth : route.notesNFL}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                {/* Depth Controls (visible on hover or selected) */}
                <div className={`flex items-center bg-[#0A0A0A] rounded-lg p-1 border border-[#1B1E20] opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                  <button
                    onClick={(e) => handleDepthChange(route.id, -1, e)}
                    className="p-1.5 hover:bg-[#1B1E20] rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <span className="mx-2 text-xs font-mono text-white min-w-[2ch] text-center">
                    {effectiveDepth}
                  </span>
                  <button
                    onClick={(e) => handleDepthChange(route.id, 1, e)}
                    className="p-1.5 hover:bg-[#1B1E20] rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>

                {/* Family Badge */}
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${familyBadge.color}`}
                >
                  {familyBadge.label}
                </span>

                {/* Depth Band Badge */}
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${depthBand.color}`}
                >
                  {depthBand.label}
                </span>
              </div>
            </div>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <p className="text-sm font-medium">No routes found</p>
            <p className="text-xs mt-1">Try a different search term or filter</p>
          </div>
        )}
      </div>

      {/* Footer with route count */}
      <div className="px-5 py-3 border-t border-[#1B1E20] bg-[#0A0A0A]/95 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {filteredRoutes.length} of {ROUTE_LIBRARY.length} routes
        </span>
        <span className="text-xs text-slate-600">
          Tap a route to assign • Use +/- to adjust depth
        </span>
      </div>
    </div>
  );
}
