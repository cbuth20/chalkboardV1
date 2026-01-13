"use client";

// Step icon components (smaller, consistent)
function BookIcon() {
  return (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" 
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" 
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" 
      />
    </svg>
  );
}

// Step data
const steps = [
  {
    step: 1,
    title: "LEARN",
    caption: "Offense, rules, assignments",
    icon: BookIcon,
  },
  {
    step: 2,
    title: "RECOGNIZE",
    caption: "Coverage, fronts, leverage",
    icon: EyeIcon,
  },
  {
    step: 3,
    title: "ANTICIPATE",
    caption: "Predict movement & answers",
    icon: BrainIcon,
  },
  {
    step: 4,
    title: "REACT",
    caption: "Play fast with confidence",
    icon: BoltIcon,
  },
];

interface StepCardProps {
  step: number;
  title: string;
  caption: string;
  icon: React.ComponentType;
  isLast?: boolean;
}

function StepCard({ step, title, caption, icon: Icon, isLast }: StepCardProps) {
  return (
    <div className="relative">
      {/* Step Card - lighter weight, tighter */}
      <div className="group relative flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/20 border border-slate-700/25 transition-all duration-200 hover:bg-slate-800/35 hover:border-slate-600/40">
        {/* Icon Container */}
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-neon-teal/8 text-neon-teal/80 flex items-center justify-center transition-colors duration-200 group-hover:bg-neon-teal/12 group-hover:text-neon-teal">
          <Icon />
        </div>
        
        {/* Content - tighter typography */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-[13px] font-semibold text-white/90 tracking-wide">
              {title}
            </h4>
            <span className="text-[8px] font-medium text-slate-600/60 uppercase tracking-wider">
              {step}
            </span>
          </div>
          <p className="text-[10px] text-slate-500/80 leading-none">
            {caption}
          </p>
        </div>
      </div>
      
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[1.1rem] top-full w-px h-1 bg-slate-700/40" />
      )}
    </div>
  );
}

export default function FootballIQFlow() {
  return (
    <div className="relative p-3.5 rounded-xl bg-slate-900/40 border border-slate-700/20 backdrop-blur-sm overflow-hidden lg:-mt-1">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 246, 229, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 246, 229, 0.015) 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
        }}
      />
      
      {/* Header */}
      <div className="relative mb-2.5">
        <h3 className="text-[13px] font-semibold text-white/90 mb-0.5">
          How Chalkboard Builds Game-Speed Reactions
        </h3>
        <p className="text-[9px] text-slate-500/70 font-medium tracking-wider uppercase">
          Understanding → Anticipation → Reaction
        </p>
      </div>
      
      {/* Steps Stack */}
      <div className="relative space-y-1">
        {steps.map((stepData, index) => (
          <StepCard
            key={stepData.step}
            step={stepData.step}
            title={stepData.title}
            caption={stepData.caption}
            icon={stepData.icon}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
