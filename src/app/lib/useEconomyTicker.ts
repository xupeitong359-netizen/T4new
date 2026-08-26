import { useState, useEffect, useRef } from 'react';
import { Nation } from '../types';
import { calculateNationalEconomy, NationalEconomyStats } from './economyEngine';

export function useEconomyTicker(nation: Partial<Nation> | null | undefined, isLive: boolean = true) {
 const [stats, setStats] = useState<NationalEconomyStats>(() => calculateNationalEconomy(nation, Date.now()));
 const rafRef = useRef<number | null>(null);
 const lastStateUpdateRef = useRef<number>(0);
 const nationRef = useRef(nation);

 nationRef.current = nation;

 useEffect(() => {
  if (!isLive) {
   setStats(calculateNationalEconomy(nationRef.current, Date.now()));
   return;
  }

  let isRunning = true;

  const tick = () => {
   if (!isRunning) return;

   const now = Date.now();
   // 节流 state 更新至大约 30~60fps (约每 20ms 一次刷新)，保证极致平滑同时杜绝无谓 CPU 占用
   if (now - lastStateUpdateRef.current >= 24) {
    lastStateUpdateRef.current = now;
    setStats(calculateNationalEconomy(nationRef.current, now));
   }

   rafRef.current = requestAnimationFrame(tick);
  };

  rafRef.current = requestAnimationFrame(tick);

  return () => {
   isRunning = false;
   if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
   }
  };
 }, [isLive, nation?.id, nation?.updatedAt]);

 return stats;
}
