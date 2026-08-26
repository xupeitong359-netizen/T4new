import React from 'react';

export type NationStatusType = 'peace' | 'tension' | 'war' | 'truce' | 'unrest' | 'treaty';

interface NationStateCoreProps {
  type?: NationStatusType;
  label?: string;
  className?: string;
}

const STATE_CONFIG: Record<NationStatusType, { dotColor: string; haloColor: string; defaultLabel: string }> = {
  peace: {
    dotColor: 'bg-emerald-500',
    haloColor: 'bg-emerald-500',
    defaultLabel: '和平',
  },
  tension: {
    dotColor: 'bg-amber-500',
    haloColor: 'bg-amber-500',
    defaultLabel: '紧张',
  },
  war: {
    dotColor: 'bg-rose-500',
    haloColor: 'bg-rose-500',
    defaultLabel: '战争中',
  },
  truce: {
    dotColor: 'bg-sky-500',
    haloColor: 'bg-sky-500',
    defaultLabel: '停战',
  },
  unrest: {
    dotColor: 'bg-orange-500',
    haloColor: 'bg-orange-500',
    defaultLabel: '内乱',
  },
  treaty: {
    dotColor: 'bg-indigo-500',
    haloColor: 'bg-indigo-500',
    defaultLabel: '条约缔结',
  },
};

export const NationStateCore: React.FC<NationStateCoreProps> = ({
  type = 'peace',
  label,
  className = '',
}) => {
  const config = STATE_CONFIG[type] || STATE_CONFIG.peace;
  const displayLabel = label || config.defaultLabel;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Dynamic State Core with subtle breathing halo */}
      <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0" aria-hidden="true">
        {/* Soft breathing halo with low opacity */}
        <span
          className={`absolute inset-0 rounded-full ${config.haloColor} animate-state-breathe pointer-events-none`}
        />
        {/* Solid stable inner core */}
        <span
          className={`relative w-1.5 h-1.5 rounded-full ${config.dotColor} ring-1 ring-white/80`}
        />
      </span>
      {/* Clean high-contrast state label */}
      <span className="text-xs font-medium text-slate-700 tracking-tight whitespace-nowrap">
        {displayLabel}
      </span>
    </div>
  );
};
