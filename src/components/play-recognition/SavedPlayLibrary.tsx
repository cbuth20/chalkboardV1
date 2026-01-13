import React from 'react';

interface SavedPlayLibraryProps {
  onSelectPlay: (id: string) => void;
  onNewScan: () => void;
}

export const SavedPlayLibrary: React.FC<SavedPlayLibraryProps> = ({ onSelectPlay, onNewScan }) => {
  // Mock plays
  const plays = [
    { id: '1', name: 'Trips Right Mesh', date: '2 mins ago', tags: ['Pass', 'Short', 'Man Beater'], type: 'Pass' },
    { id: '2', name: 'Bunch Left Spot', date: 'Yesterday', tags: ['Pass', 'Redzone'], type: 'Pass' },
    { id: '3', name: 'I-Form Iso Lead', date: '2 days ago', tags: ['Run', 'Power'], type: 'Run' },
    { id: '4', name: 'Empty Stick Nod', date: 'Last week', tags: ['Pass', '3rd Down'], type: 'Pass' },
    { id: '5', name: 'Spread 4 Verts', date: 'Last week', tags: ['Pass', 'Deep'], type: 'Pass' },
    { id: '6', name: 'Split Zone Read', date: '2 weeks ago', tags: ['Run', 'RPO'], type: 'Run' },
  ];

  return (
    <div className="h-full w-full bg-[#0A0F12] p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Play Library</h1>
          <p className="text-slate-400">Manage your digitized playbook</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search plays..." 
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[var(--neon-teal)] focus:ring-1 focus:ring-[var(--neon-teal)] transition-all w-64 text-sm"
            />
            <svg className="absolute left-3 top-2.5 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <button 
            onClick={onNewScan}
            className="bg-[var(--neon-teal)] text-black font-bold px-6 py-2.5 rounded-lg hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.3)] flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            NEW SCAN
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plays.map((play) => (
          <div 
            key={play.id} 
            onClick={() => onSelectPlay(play.id)}
            className="group bg-gradient-to-b from-[#151a1e] to-[#0f1215] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--neon-teal)]/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer relative"
          >
            {/* AI Badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-[var(--neon-teal)]/10 border border-[var(--neon-teal)]/30 text-[var(--neon-teal)] text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                AI IMPORT
              </span>
            </div>

            {/* Thumbnail Preview Area */}
            <div className="aspect-video bg-[#0D1117] relative p-4 group-hover:bg-[#11161d] transition-colors">
              {/* Abstract Play Lines */}
              <div className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 100 60">
                  {/* Field Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Play Art */}
                  {play.type === 'Pass' ? (
                     <>
                      <path d="M 50 45 L 50 40 L 45 40" fill="none" stroke={play.id === '1' ? '#00F6E5' : '#3DF3FF'} strokeWidth="1" strokeLinecap="round" />
                      <path d="M 20 40 L 20 20 L 40 10" fill="none" stroke={play.id === '1' ? '#00F6E5' : '#3DF3FF'} strokeWidth="1" strokeDasharray="2 1" strokeLinecap="round" />
                      <path d="M 80 40 L 80 25 L 90 25" fill="none" stroke={play.id === '1' ? '#00F6E5' : '#3DF3FF'} strokeWidth="1" strokeDasharray="2 1" strokeLinecap="round" />
                     </>
                  ) : (
                     <>
                      <path d="M 50 45 L 50 35" fill="none" stroke="#F5C253" strokeWidth="1" strokeLinecap="round" />
                      <path d="M 45 35 L 45 30 L 55 25" fill="none" stroke="#F5C253" strokeWidth="1" strokeLinecap="round" />
                     </>
                  )}
                  
                  {/* Formation Dots */}
                  <circle cx="50" cy="45" r="1.5" fill="#fff" />
                  <circle cx="20" cy="40" r="1.5" fill="#fff" />
                  <circle cx="80" cy="40" r="1.5" fill="#fff" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-bold text-lg group-hover:text-[var(--neon-teal)] transition-colors line-clamp-1">{play.name}</h3>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {play.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-slate-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{play.date}</span>
                <span className="group-hover:translate-x-1 transition-transform">View Play →</span>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <button 
            onClick={onNewScan}
            className="group border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[260px] hover:border-[var(--neon-teal)]/30 hover:bg-white/5 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-[var(--neon-teal)]">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          </div>
          <span className="text-slate-400 font-bold group-hover:text-white">Import New Play</span>
        </button>
      </div>
    </div>
  );
};





