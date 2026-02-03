import React from 'react';
import type { DiagramPlayer } from '@/components/playbook-diagram/types';
import type { RouteTemplate } from '../../types';
import { ROUTE_TEMPLATES } from '../../utils/routeTemplates';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE TEMPLATES PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface RouteTemplatesPanelProps {
  offensePlayers: DiagramPlayer[];
  selectedTemplatePlayer: string | null;
  onSelectTemplatePlayer: (playerId: string) => void;
  onApplyTemplate: (template: RouteTemplate, playerId: string) => void;
}

export const RouteTemplatesPanel: React.FC<RouteTemplatesPanelProps> = ({
  offensePlayers,
  selectedTemplatePlayer,
  onSelectTemplatePlayer,
  onApplyTemplate,
}) => {
  // Filter to skill positions and backfield only
  const routablePlayers = offensePlayers.filter(
    (p) => p.group === 'skill' || p.group === 'backfield'
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-3">
        Select a player, then click a template to apply
      </p>

      {/* Player selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {routablePlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectTemplatePlayer(player.id)}
            className={`px-2 py-1.5 rounded text-xs font-semibold transition ${
              selectedTemplatePlayer === player.id
                ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
            }`}
          >
            {player.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-2 gap-2">
        {ROUTE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() =>
              selectedTemplatePlayer && onApplyTemplate(template, selectedTemplatePlayer)
            }
            disabled={!selectedTemplatePlayer}
            className="p-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{template.icon}</span>
              <span className="text-sm font-semibold text-white">{template.name}</span>
            </div>
            <p className="text-xs text-slate-400">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
