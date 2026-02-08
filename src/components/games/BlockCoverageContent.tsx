"use client";

import React from 'react';

export function BlockCoverageContent() {
  const startBlockCoverageTrainer = () => {
    alert('🚧 Block Coverage Trainer is coming soon! The infrastructure is ready - we just need to add the coverage scenarios and blocking rules. Check back soon!');
  };

  return (
    <div className="space-y-6">
      {/* Block Coverage Trainer Card */}
      <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-700/50 rounded-xl p-8">
        <div className="flex items-start gap-6">
          <div className="text-6xl">🛡️</div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-3">Block Coverage Trainer</h2>
            <p className="text-gray-300 mb-4">
              Master blocking assignments against different defensive coverages. Learn to quickly
              identify who to block based on defensive alignments and coverages.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Position</div>
                <div className="font-bold text-white">Running Back</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Format</div>
                <div className="font-bold text-white">Multiple Choice</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Coverages</div>
                <div className="font-bold text-white">Zone, Man, Blitz</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="font-bold text-yellow-400">Coming Soon</div>
              </div>
            </div>

            <button
              onClick={startBlockCoverageTrainer}
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
            >
              Start Block Coverage Training →
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1B1E20] border border-[#2A2F33] rounded-lg p-6">
          <div className="text-3xl mb-3">👁️</div>
          <h3 className="text-lg font-bold text-white mb-2">Defensive Recognition</h3>
          <p className="text-sm text-gray-400">
            See defensive alignments and quickly identify coverage shells and blitz threats.
          </p>
        </div>

        <div className="bg-[#1B1E20] border border-[#2A2F33] rounded-lg p-6">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-white mb-2">Assignment Accuracy</h3>
          <p className="text-sm text-gray-400">
            Choose the correct defender to block or release into your route based on the coverage.
          </p>
        </div>

        <div className="bg-[#1B1E20] border border-[#2A2F33] rounded-lg p-6">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-bold text-white mb-2">Game Speed Decisions</h3>
          <p className="text-sm text-gray-400">
            Practice making split-second blocking decisions with instant feedback and coaching
            notes.
          </p>
        </div>
      </div>

      {/* Coverage Types Preview */}
      <div className="bg-[#1B1E20] border border-[#2A2F33] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Coverage Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'All Types', icon: '🌟', description: 'Mixed coverages' },
            { name: 'Zone', icon: '🟦', description: 'Zone coverage reads' },
            { name: 'Man', icon: '👤', description: 'Man coverage blocks' },
            { name: 'Blitz', icon: '⚡', description: 'Pressure pickups' },
          ].map(type => (
            <div
              key={type.name}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center"
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-semibold text-white mb-1">{type.name}</div>
              <div className="text-xs text-gray-400">{type.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🚧</div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Under Development</h3>
            <p className="text-gray-300 mb-3">
              The Block Coverage Trainer is currently being built. This feature will help running
              backs master their protection assignments against various defensive looks.
            </p>
            <p className="text-sm text-gray-400">
              <strong>Coming features:</strong> Interactive defensive diagrams, RELEASE vs BLOCK
              decisions, situational drills (1st down, 3rd down), and personalized coaching notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
