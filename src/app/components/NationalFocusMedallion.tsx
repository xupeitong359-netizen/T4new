import React from 'react';
import { FocusStatus } from '../types';
import { NationalFocusNodeCard } from './NationalFocusNodeCard';

interface NationalFocusMedallionProps {
  iconType: string;
  name: string;
  subtitle?: string;
  status: FocusStatus;
  isSelected?: boolean;
  isHighlighted?: boolean;
  tier?: number;
  size?: number; // legacy size
  progress?: number;
  durationDays?: number;
  costPoints?: number;
  onClick?: () => void;
}

export { NationalFocusNodeCard };

export const NationalFocusMedallion: React.FC<NationalFocusMedallionProps> = ({
  iconType,
  name,
  subtitle,
  status,
  isSelected = false,
  isHighlighted = false,
  tier = 1,
  size = 64,
  durationDays = 70,
  costPoints = 0,
  onClick,
}) => {
  return (
    <NationalFocusNodeCard
      iconType={iconType}
      name={name}
      subtitle={subtitle}
      status={status}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      tier={tier}
      durationDays={durationDays}
      costPoints={costPoints}
      width={Math.max(104, size + 36)}
      onClick={onClick}
    />
  );
};
