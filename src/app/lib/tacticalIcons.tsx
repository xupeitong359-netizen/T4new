import React from 'react';

export interface TacticalIconProps extends React.SVGProps<SVGSVGElement> {
 size?: number | string;
 className?: string;
}

// 1. 陆军装甲与载具 (HOI4 / 军事档案侧视与顶视剪影)
// 主战坦克 (MBT / Heavy Armor Silhouette)
export const MilitaryTankIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Main Battle Tank Silhouette with Gun Barrel, Turret & Tracks */}
  <path d="M22 8.5h-8l-1.5-2.2c-.2-.3-.6-.5-1-.5H7.5c-.6 0-1.1.4-1.3 1L5 8.5H3.5C2.7 8.5 2 9.2 2 10v1.5c0 .3.1.5.3.7l1 1c.2.2.4.3.7.3h16c.3 0 .5-.1.7-.3l1-1c.2-.2.3-.4.3-.7V10c0-.8-.7-1.5-1.5-1.5zM22 9.5h-7.5l.7-1h3.3c.3 0 .5.2.5.5v.5z" />
  <path d="M2.5 15C1.7 15 1 15.7 1 16.5v1C1 18.3 1.7 19 2.5 19h19c.8 0 1.5-.7 1.5-1.5v-1c0-.8-.7-1.5-1.5-1.5h-19zm2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
  <rect x="14" y="8" width="8" height="1.5" rx="0.5" />
  <path d="M22 7.5v2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
 </svg>
);

// 坦克歼击车 (Tank Destroyer - 猎歼突击炮，固定战斗室，长身管)
export const MilitaryTankDestroyerIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Low profile casemate tank destroyer */}
  <path d="M23 9.2h-8.5l-2.8-3.5c-.3-.4-.8-.7-1.3-.7H6c-.7 0-1.3.4-1.6 1.1L2.8 10c-.5.3-.8.8-.8 1.4v2.1c0 .3.2.5.5.5h19c.3 0 .5-.2.5-.5V10c0-.4-.3-.8-.7-.8z" />
  <path d="M2.5 15.5C1.7 15.5 1 16.2 1 17v1.5c0 .8.7 1.5 1.5 1.5h19c.8 0 1.5-.7 1.5-1.5V17c0-.8-.7-1.5-1.5-1.5h-19zm2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
  {/* Muzzle Brake */}
  <rect x="21.5" y="8.2" width="1.5" height="3" rx="0.5" />
 </svg>
);

// 自行火炮 (Self-Propelled Artillery - 履带底盘高仰角身管火炮)
export const MilitarySPArtilleryIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* High elevation heavy howitzer on tracked chassis */}
  <path d="M20.8 4.2l-6.5 4.5-.8-1.2 6.5-4.5c.3-.2.7-.1.9.2.2.3.1.7-.1 1z" />
  <rect x="19.5" y="3" width="2" height="2" rx="0.5" transform="rotate(-35 19.5 3)" />
  <path d="M14.5 9.5l-2.2-2.8c-.3-.4-.8-.7-1.3-.7H5.5c-.7 0-1.3.5-1.5 1.2L2.5 11c-.3.4-.5.8-.5 1.3v1.7h16v-2.5c0-.9-.7-1.7-1.5-2z" />
  <path d="M2.5 15.5C1.7 15.5 1 16.2 1 17v1.5c0 .8.7 1.5 1.5 1.5h19c.8 0 1.5-.7 1.5-1.5V17c0-.8-.7-1.5-1.5-1.5h-19zm2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
 </svg>
);

// 步兵战车 / 履带装甲输送车 (IFV / Mechanized Infantry)
export const MilitaryIFVIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* High troop compartment with autocannon turret */}
  <path d="M18 9h-4V7.5c0-.4-.3-.8-.8-.9l-3.5-.8c-.4-.1-.8.1-1 .4L7 8H4c-.8 0-1.5.7-1.5 1.5v3.5c0 .3.2.5.5.5h18c.3 0 .5-.2.5-.5V10.5C20 9.7 19.1 9 18 9z" />
  <rect x="15" y="8" width="6" height="1.2" rx="0.5" />
  <path d="M2.5 15.5C1.7 15.5 1 16.2 1 17v1.5c0 .8.7 1.5 1.5 1.5h19c.8 0 1.5-.7 1.5-1.5V17c0-.8-.7-1.5-1.5-1.5h-19zm2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
 </svg>
);

// 轮式装甲车 (Wheeled Armored Car - 4x4 / 8x8 侦察车)
export const MilitaryArmoredCarIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Angled chassis and large offroad wheels */}
  <path d="M19.5 9h-5.2l-1.6-2.2c-.3-.4-.7-.6-1.2-.6H6.5c-.7 0-1.3.4-1.6 1.1L3.2 11c-.5.4-.7.9-.7 1.5v2.5c0 .6.4 1 1 1h17c.6 0 1-.4 1-1v-4c0-1.1-.9-2-2-2z" />
  <rect x="16" y="8" width="6" height="1.2" rx="0.5" />
  {/* Wheels */}
  <circle cx="5.5" cy="17.5" r="2.5" />
  <circle cx="5.5" cy="17.5" r="1" fill="#fff" />
  <circle cx="11.5" cy="17.5" r="2.5" />
  <circle cx="11.5" cy="17.5" r="1" fill="#fff" />
  <circle cx="18.5" cy="17.5" r="2.5" />
  <circle cx="18.5" cy="17.5" r="1" fill="#fff" />
 </svg>
);

// 军用运输卡车 (Military Transport Truck - 6x6 军卡)
export const MilitaryTruckIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Heavy cargo bed and cab */}
  <path d="M17 7H3c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1V8h13v8h.5c.3 0 .5-.2.7-.4l2.5-3.3c.2-.3.3-.6.3-1v-2.3c0-.6-.4-1-1-1h-3.5V7z" />
  <circle cx="6" cy="17.5" r="2.5" />
  <circle cx="6" cy="17.5" r="1" fill="#fff" />
  <circle cx="14" cy="17.5" r="2.5" />
  <circle cx="14" cy="17.5" r="1" fill="#fff" />
  <circle cx="19" cy="17.5" r="2.5" />
  <circle cx="19" cy="17.5" r="1" fill="#fff" />
 </svg>
);

// 压制火炮 (Towed Field Artillery / Howitzer - 经典牵引加农炮/榴弹炮)
export const MilitaryArtilleryIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Gun barrel at angle, recoil cradle, shield and trail */}
  <path d="M21.5 4.5l-8 6.5-1.2-1.5 8-6.5c.4-.3 1-.3 1.3.1.4.4.3 1-.1 1.4z" />
  <path d="M11 11l-2.5 1.5v-3L6 8.5v6.5l-4 4.5 1.5 1.5 4-4.5h2.5l2-1.5z" />
  <circle cx="12" cy="16.5" r="3.5" />
  <circle cx="12" cy="16.5" r="1.5" fill="#fff" />
  <rect x="20.5" y="3.5" width="2" height="2.5" rx="0.5" transform="rotate(-38 20.5 3.5)" />
 </svg>
);

// 单兵制式步枪 / 步兵轻兵器 (Infantry Rifle / NATO Small Arms)
export const MilitaryRifleIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Service rifle silhouette with barrel, sight, receiver, magazine, and stock */}
  <path d="M23 8h-3v1h-4.5l-1-1.5h-3l-.5 1.5H8.5l-.8-1.5H6.2l-.5 1.5H4C3.2 9 2.5 9.7 2 10.5L1 12.5v2.5h2.5l1.5-2.5h3v4l2.5 1.5 1-2.5h3l.5-2H23V8z" />
  <rect x="22" y="7.5" width="1" height="2" rx="0.3" />
  <path d="M9 13.5l1.2 4.5 2-.5-1-4z" />
 </svg>
);

// 步兵部队战术符号 (NATO Infantry Cross / Soldier Division)
export const MilitaryInfantryDivisionIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
  <path d="M2 5L22 19M2 19L22 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
 </svg>
);

// 装甲部队战术符号 (NATO Armor Oval)
export const MilitaryArmorDivisionIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
  <ellipse cx="12" cy="12" rx="7" ry="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.4" />
 </svg>
);

// 后勤与工兵战术装备 (Military Engineering & Support)
export const MilitarySupportEquipmentIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Fortification shovel, entrenching tool and radio antenna */}
  <path d="M19 3h-2v3.2l-3 3V11h-1.5l-1-2.5H7.5L6 11H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-1V3zm-1 8h-4.2l2.2-2.2V11zM4 19v-4h16v4H4z" />
  <circle cx="8" cy="17" r="1.5" fill="#fff" />
  <circle cx="16" cy="17" r="1.5" fill="#fff" />
 </svg>
);

// 2. 空军战机与航空器 (Fighter, Bomber, CAS, Helicopter)
// 战斗机 (Jet Fighter Top/Silhouette - 真实三角翼/后掠翼战机轮廓)
export const MilitaryFighterIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Modern Jet Fighter Top-Down Silhouette */}
  <path d="M12 1.5c-.6 0-1 .5-1.2 1.2L9.5 8 2 12v2.5l7.5-2 1 5.5-3 2v1.5l4.5-1 4.5 1V20l-3-2 1-5.5 7.5 2V12L14.5 8l-1.3-5.3c-.2-.7-.6-1.2-1.2-1.2z" />
 </svg>
);

// 轰炸机 (Heavy Strategic Bomber Silhouette - 战略轰炸机)
export const MilitaryBomberIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Large heavy flying wing / strategic bomber silhouette */}
  <path d="M12 2l-1.5 4L1 11v3l9.5-1.5L10 18l-4 2v2l6-1.5 6 1.5v-2l-4-2-.5-5.5L23 14v-3L13.5 6 12 2z" />
 </svg>
);

// 武装直升机 (Attack Helicopter Side Silhouette)
export const MilitaryHelicopterIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Rotor, cockpit, stub wings and tail rotor */}
  <rect x="2" y="4" width="20" height="1.5" rx="0.5" />
  <rect x="11.5" y="5.5" width="1.5" height="2" />
  <path d="M13 7.5H7.5C4.5 7.5 2 10 2 13v1c0 .6.4 1 1 1h8l9 3.5v-2l-6-3.5 6-3v-1.5c0-.6-.4-1-1-1h-6.5V7.5z" />
  <rect x="3" y="17.5" width="10" height="1.5" rx="0.5" />
  <path d="M5 15.5v2M11 15.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  {/* Tail rotor */}
  <rect x="20" y="11.5" width="1.5" height="4" rx="0.5" />
 </svg>
);

// 3. 海军舰艇 (Warship, Carrier, Submarine, Destroyer)
// 航空母舰 (Aircraft Carrier Deck & Island Profile)
export const MilitaryCarrierIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Flight deck, angled deck markings, and superstructure island */}
  <rect x="15" y="5" width="3" height="4" rx="0.5" />
  <path d="M16 3v2M17.5 3v2" stroke="currentColor" strokeWidth="1" />
  <path d="M23 9.5H3.5L1 14.5c-.3.6.1 1.5.8 1.5h19.5c.8 0 1.5-.7 1.7-1.5L24 10.5c0-.6-.5-1-1-1z" />
  <path d="M5 18h14c.6 0 1 .4 1 1s-.4 1-1 1H5c-.6 0-1-.4-1-1s.4-1 1-1z" opacity="0.5" />
 </svg>
);

// 驱逐舰 / 巡洋舰 (Destroyer / Cruiser Silhouette - 现代水面战舰)
export const MilitaryWarshipIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Gun turret, mast, stealth superstructure and hull */}
  <path d="M18 10h-2V7.5L14 6h-2v4H8.5l-1.5 1.5H3.5L1 14c-.3.6.1 1.5.8 1.5h20.5c.8 0 1.5-.7 1.7-1.5L24 11c0-.6-.5-1-1-1h-5z" />
  <rect x="5.5" y="11" width="3.5" height="1.5" rx="0.3" />
  <path d="M13 3v3M14.5 4.5h-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
 </svg>
);

// 潜艇 (Submarine Silhouette - 潜艇指挥塔与雪茄型艇体)
export const MilitarySubmarineIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Periscope, sail, and streamlined hull */}
  <path d="M11 5v3h-1.5V6H8v2H3c-1.1 0-2 .9-2 2v2c0 2.2 1.8 4 4 4h14c2.2 0 4-1.8 4-4v-1c0-1.1-.9-2-2-2h-8V5h-2z" />
  <path d="M22 10.5l2-1.5v4l-2-1.5v-1z" />
 </svg>
);

// 4. 工业、资源与战略地理 (Real Factory Plants, Oil Rigs, Population & Treaties)
// 军事工业厂房 (Military Production Complex - 军工重工业厂房排烟管道)
export const MilitaryFactoryPlantIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Industrial Sawtooth Roof & Smokestacks */}
  <path d="M2 20h20v-7l-6 3.5V11l-6 3.5V8l-6 3.5V6H2v14zm3-11h1v1H5V9zm6 3h1v1h-1v-1zm6 3h1v1h-1v-1zM4 18v-4h2v4H4zm4 0v-4h2v4H8zm4 0v-4h2v4h-2zm4 0v-4h2v4h-2z" />
 </svg>
);

// 民用工厂与造船厂 (Civilian Factory & Infrastructure)
export const CivilianFactoryPlantIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path d="M19 4h-4v4l-5 3V6H6v7l-4 2.5V20h20V8c0-2.2-1.8-4-4-4zM5 18H3v-2h2v2zm5 0H8v-2h2v2zm5 0h-2v-2h2v2zm5 0h-2v-2h2v2zm0-5h-2v-2h2v2z" />
 </svg>
);

// 石油资源与油田 (Oil Derrick / Petroleum Well)
export const TacticalOilWellIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Steel Oil Derrick Rig Structure */}
  <path d="M12 2L6 22M12 2L18 22M8 17H16M9.5 12H14.5M10.5 7H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  <path d="M10 22H14M4 22H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
 </svg>
);

// 战略人力与编制 (Strategic Manpower / NATO Division Cadre)
export const StrategicManpowerIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Steel Helmet Silhouette & Soldier Ranks */}
  <path d="M12 3c-4.4 0-8 2.5-8.5 6.5C3.2 11.2 2 12.5 2 14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2 0-1.5-1.2-2.8-1.5-4.5C20 5.5 16.4 3 12 3z" />
  <path d="M5 18c0 1.5 3.1 3 7 3s7-1.5 7-3H5z" opacity="0.8" />
 </svg>
);

// 领土与沙盘疆域 (Territory Province Border / Morphicon Strategic Map)
export const StrategicTerritoryIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Morphicon Modern Sand Table Map */}
  <path
   d="M3 6.5L8.5 4L15.5 7L21 4.5V17.5L15.5 20L8.5 17L3 19.5V6.5Z"
   stroke="currentColor"
   strokeWidth="1.75"
   strokeLinecap="round"
   strokeLinejoin="round"
   fill="currentColor"
   fillOpacity="0.08"
  />
  <path
   d="M8.5 4V17"
   stroke="currentColor"
   strokeWidth="1.75"
   strokeLinecap="round"
   strokeLinejoin="round"
  />
  <path
   d="M15.5 7V20"
   stroke="currentColor"
   strokeWidth="1.75"
   strokeLinecap="round"
   strokeLinejoin="round"
  />
  <circle cx="12" cy="11.5" r="1.5" fill="currentColor" />
 </svg>
);

// 国牒文书与主权档案 (Nation Dossier / Morphicon Passport)
export const StrategicDossierIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect
   x="4.5"
   y="3"
   width="15"
   height="18"
   rx="2.5"
   stroke="currentColor"
   strokeWidth="1.75"
   strokeLinecap="round"
   strokeLinejoin="round"
   fill="currentColor"
   fillOpacity="0.08"
  />
  <circle
   cx="12"
   cy="9.5"
   r="2.75"
   stroke="currentColor"
   strokeWidth="1.5"
   fill="currentColor"
   fillOpacity="0.15"
  />
  <path
   d="M8 16.5H16"
   stroke="currentColor"
   strokeWidth="1.75"
   strokeLinecap="round"
  />
 </svg>
);

// 外交文书与主权条约 (Diplomatic Treaty & Dual State Pact)
export const StrategicTreatyIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Treaty parchment with sovereign wax seal */}
  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12H8v-2h8v2zm2-4H6V9h12v2zm0-4H6V5h12v2z" />
  <circle cx="16.5" cy="16.5" r="2.5" fill="#f59e0b" />
 </svg>
);

// 战争交战行动 / 前线行动 (Warfare Frontline / Strategic Combat Clashes)
export const StrategicWarfareIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Tactical Arrow Penetration and Clashing Fronts */}
  <path d="M3 12H17M17 12L12 7M17 12L12 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M21 4V20" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
 </svg>
);

// 战略情报与侦察档案 (Military Intelligence Dossier)
export const StrategicIntelligenceIcon: React.FC<TacticalIconProps> = ({ size = 20, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Top Secret Dossier with Recon Crosshair Reticle */}
  <path d="M19 2H5C3.9 2 3 2.9 3 4v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
  <path d="M12 9v6M9 12h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
);

// 5. 装备设计模组图标 (Engine, Armor Plate, Heavy Cannon, Avionics FCS)
// 动力系统 / 大马力发动机 (Military Diesel/Turbine Engine)
export const ModuleEngineIcon: React.FC<TacticalIconProps> = ({ size = 18, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* V-Engine Block with Exhaust Manifolds */}
  <path d="M20 7h-2V5c0-.6-.4-1-1-1h-2V2h-2v2h-2V2H9v2H7c-.6 0-1 .4-1 1v2H4c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h2v3h2v-3h2v3h2v-3h2v3h2v-3h2c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1zm-3 8H7V8h10v7z" />
 </svg>
);

// 重型主炮 / 身管火炮模组 (Heavy Cannon Barrel Module)
export const ModuleCannonIcon: React.FC<TacticalIconProps> = ({ size = 18, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect x="1" y="9" width="18" height="4" rx="0.5" />
  <rect x="19" y="8" width="4" height="6" rx="0.8" />
  <rect x="1" y="7" width="5" height="8" rx="0.5" opacity="0.6" />
 </svg>
);

// 装甲装甲防护板 (Heavy Sloped Armor Plate)
export const ModuleArmorPlateIcon: React.FC<TacticalIconProps> = ({ size = 18, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Layered Composite Armor Slab */}
  <path d="M22 6L14 3 2 7v10l12 4 8-4V6zM13 18.8L4 15.6V8.4l9 3.2v7.2zm1-8.3L5.6 7.4 14 4.5l6.4 2.4-6.4 3.6zm6 5.1l-5 2.5v-7.2l5-2.8v7.5z" />
 </svg>
);

// 火控计算机与战术电子系统 (FCS / Tactical Radar FCS)
export const ModuleFCSIcon: React.FC<TacticalIconProps> = ({ size = 18, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
  <circle cx="12" cy="12" r="2" fill="currentColor" />
  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
 </svg>
);

// 6. 战略建筑精细化战术矢量图标库 (HOI4 Authentic Vector Strategic Building Icons)
// 民用工厂 (Civilian Factory - 双锯齿厂房与排烟管)
export const TacticalCivFactoryIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path
   d="M2 17h16v-6l-5 3V9l-5 3V6L2 9v8z"
   fill="currentColor"
   fillOpacity="0.85"
   stroke="currentColor"
   strokeWidth="1.2"
   strokeLinejoin="round"
  />
  <rect x="4" y="13" width="2" height="3" fill="#090e17" />
  <rect x="9" y="13" width="2" height="3" fill="#090e17" />
  <rect x="14" y="13" width="2" height="3" fill="#090e17" />
 </svg>
);

// 军用工厂 (Military Arms Factory - 交叉刺刀/战刃与工业齿轮)
export const TacticalMilFactoryIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path
   d="M3 17V8l4-3v4l4-3v4l6-3v10H3z"
   fill="currentColor"
   fillOpacity="0.3"
   stroke="currentColor"
   strokeWidth="1.2"
   strokeLinejoin="round"
  />
  {/* Crossed Tactical Sabers */}
  <path d="M4 16L16 4M4 4L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  <path d="M4 14l2 2M16 14l-2 2M4 6l2-2M16 6l-2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
 </svg>
);

// 海军船坞 (Naval Dockyard - 龙门吊架与战舰船体)
export const TacticalDockyardIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Dockyard Crane Gantry */}
  <path d="M3 4h14M7 4v7M13 4v7M10 4v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  {/* Warship Hull */}
  <path d="M2 14l2 3h12l2-3H2z" fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="1.2" />
  <circle cx="10" cy="11" r="1.2" fill="currentColor" />
 </svg>
);

// 基础设施 (Infrastructure - 铁路轨枕与高等级公路网)
export const TacticalInfraIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Parallel Rails */}
  <path d="M5 2L3 18M15 2l2 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  {/* Railway Ties */}
  <path d="M4.5 4.5h11M4 8.5h12M3.5 12.5h13M3 16.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
 </svg>
);

// 空军基地 (Air Base - 现代化后掠翼战机与跑道标线)
export const TacticalAirbaseIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Swept Wing Delta Jet Silhouette */}
  <path d="M10 2l1.5 5.5 6 2.5-1.5 2-4.5-.5L10 18l-1.5-6.5L4 12l-1.5-2 6-2.5L10 2z" />
 </svg>
);

// 雷达站 (Radar Station - 抛物面天线与高频脉冲波)
export const TacticalRadarIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Base Tripod */}
  <path d="M7 18l3-6 3 6M10 12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  {/* Parabolic Dish */}
  <path d="M4 6c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  {/* Broadcast Pulse Arc */}
  <path d="M7 3c1.7-1 4.3-1 6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
 </svg>
);

// 国防要塞与地堡 (Fortress / Bunker - 倾斜重装甲防线与射击孔)
export const TacticalFortressIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path d="M2 17h16l-2.5-8.5-3-1.5h-5L5 8.5 2 17z" fillOpacity="0.85" />
  {/* Pillbox Gun Slit */}
  <rect x="7" y="10" width="6" height="2" rx="0.5" fill="#090e17" />
 </svg>
);

// 防空炮火 (Anti-Air Turret - 双联装高射炮塔)
export const TacticalAntiAirIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* Twin Barrels at High Angle */}
  <path d="M12 2l-3 8M15 3l-3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  {/* Turret Base */}
  <path d="M4 17h12l-2-6H6l-2 6z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
 </svg>
);

// 合成精炼厂 (Synthetic Refinery - 蒸馏塔与石油液滴)
export const TacticalRefineryIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect x="4" y="6" width="5" height="11" rx="1" />
  <rect x="11" y="3" width="5" height="14" rx="1" />
  <rect x="5.5" y="4" width="2" height="2" />
  <rect x="12.5" y="1" width="2" height="2" />
  <path d="M9 10h2M9 14h2" stroke="#090e17" strokeWidth="1.5" />
 </svg>
);

// 火箭发射场 (Rocket Site - 战略弹道火箭发射架)
export const TacticalRocketIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  {/* V-Rocket Silhouette on Launch Rail */}
  <path d="M10 2c-1.5 3-2.5 7-2.5 11l-2 2.5 3-.5.5 2 1-1.5 1 1.5.5-2 3 .5-2-2.5c0-4-1-8-2.5-11z" />
 </svg>
);

// 核反应堆 (Nuclear Reactor - 原子核与轨道粒子)
export const TacticalNuclearIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <circle cx="10" cy="10" r="2.5" fill="currentColor" />
  <ellipse cx="10" cy="10" rx="7" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(30 10 10)" />
  <ellipse cx="10" cy="10" rx="7" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(-30 10 10)" />
  <ellipse cx="10" cy="10" rx="7" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(90 10 10)" />
 </svg>
);

// 战略补给枢纽 (Supply Hub - 集装箱货站与铁路线分支)
export const TacticalSupplyHubIcon: React.FC<TacticalIconProps> = ({ size = 16, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 20 20"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path d="M3 7l7-4 7 4v9l-7 4-7-4V7z" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.4" />
  <path d="M10 3v17M3 7l14 8M17 7L3 15" stroke="currentColor" strokeWidth="1.2" />
 </svg>
);

// 战术极简闪电 (Tactical Vector Lightning - 替代所有Emoji)
export const TacticalLightningIcon: React.FC<TacticalIconProps> = ({ size = 14, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 16 16"
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <path d="M9 1.5L2.5 8.5H7.5L6 14.5L13.5 7.5H8.5L9 1.5Z" />
 </svg>
);

// 槽位矩形框 (Tactical Slot Box)
export const TacticalSlotBoxIcon: React.FC<TacticalIconProps> = ({ size = 14, className = '', ...props }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 16 16"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={`inline-block shrink-0 ${className}`}
  {...props}
 >
  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
  <path d="M2 7h12M7 7v7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
 </svg>
);

