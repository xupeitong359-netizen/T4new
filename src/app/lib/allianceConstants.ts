import React from 'react';
import { Shield, Swords, Coins, Landmark, Globe, Handshake } from 'lucide-react';
import { AllianceType } from '../types';

export const ALLIANCE_TYPE_CONFIG: Record<
 AllianceType,
 {
  label: string;
  englishLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgBadge: string;
  borderBadge: string;
  textColor: string;
 }
> = {
 defensive: {
  label: '共同防御同盟',
  englishLabel: 'DEFENSIVE COALITION',
  desc: '以边境安全与集体自卫为核心宗旨，任一成员遭侵略自动触发全员参战。',
  icon: Shield,
  color: '#0284c7',
  bgBadge: 'bg-sky-950/60',
  borderBadge: 'border-sky-500/40',
  textColor: 'text-sky-400',
 },
 military: {
  label: '多边战略公约',
  englishLabel: 'MILITARY AXIS PACT',
  desc: '高度一体化的军事同盟与指挥体系，协同实施联合军事行动与多边协同防务。',
  icon: Swords,
  color: '#e11d48',
  bgBadge: 'bg-rose-950/60',
  borderBadge: 'border-rose-500/40',
  textColor: 'text-rose-400',
 },
 economic: {
  label: '关税同盟与贸易圈',
  englishLabel: 'CUSTOMS & ECONOMIC UNION',
  desc: '废除内部关税壁垒，统一贸易清算体系，促进各成员国经济要素自由流通。',
  icon: Coins,
  color: '#d97706',
  bgBadge: 'bg-amber-950/60',
  borderBadge: 'border-amber-500/40',
  textColor: 'text-amber-400',
 },
 federation: {
  label: '主权联邦同盟',
  englishLabel: 'GRAND FEDERATION',
  desc: '深度一体化联盟，涵盖多边协调、共同立法议事与统一防务协作。',
  icon: Landmark,
  color: '#8b5cf6',
  bgBadge: 'bg-purple-950/60',
  borderBadge: 'border-purple-500/40',
  textColor: 'text-purple-400',
 },
 entente: {
  label: '战略互保协定组织',
  englishLabel: 'MUTUAL ENTENTE',
  desc: '主权国家协调机制，保留成员自主宣战权与独立对外外交权。',
  icon: Globe,
  color: '#10b981',
  bgBadge: 'bg-emerald-950/60',
  borderBadge: 'border-emerald-500/40',
  textColor: 'text-emerald-400',
 },
};
