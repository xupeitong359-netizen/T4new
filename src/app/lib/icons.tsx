import React from 'react';
import {
 MilitaryTankIcon,
 MilitaryTankDestroyerIcon,
 MilitarySPArtilleryIcon,
 MilitaryIFVIcon,
 MilitaryArmoredCarIcon,
 MilitaryTruckIcon,
 MilitaryArtilleryIcon,
 MilitaryRifleIcon,
 MilitaryInfantryDivisionIcon,
 MilitaryArmorDivisionIcon,
 MilitarySupportEquipmentIcon,
 MilitaryFighterIcon,
 MilitaryBomberIcon,
 MilitaryHelicopterIcon,
 MilitaryCarrierIcon,
 MilitaryWarshipIcon,
 MilitarySubmarineIcon,
 MilitaryFactoryPlantIcon,
 CivilianFactoryPlantIcon,
 TacticalOilWellIcon,
 StrategicManpowerIcon,
 StrategicTerritoryIcon,
 StrategicTreatyIcon,
 StrategicWarfareIcon,
 StrategicIntelligenceIcon,
 ModuleEngineIcon,
 ModuleCannonIcon,
 ModuleArmorPlateIcon,
 ModuleFCSIcon,
 TacticalIconProps,
} from './tacticalIcons';

// 战略与国徽图腾注册表 (包含军事历史徽标与真实战术实体)
export const TACTICAL_EMBLEMS: Record<string, React.FC<TacticalIconProps>> = {
 tank: MilitaryTankIcon,
 fighter: MilitaryFighterIcon,
 bomber: MilitaryBomberIcon,
 warship: MilitaryWarshipIcon,
 carrier: MilitaryCarrierIcon,
 submarine: MilitarySubmarineIcon,
 artillery: MilitaryArtilleryIcon,
 rifle: MilitaryRifleIcon,
 ifv: MilitaryIFVIcon,
 armored_car: MilitaryArmoredCarIcon,
 sp_artillery: MilitarySPArtilleryIcon,
 tank_destroyer: MilitaryTankDestroyerIcon,
 truck: MilitaryTruckIcon,
 factory: MilitaryFactoryPlantIcon,
 civ_factory: CivilianFactoryPlantIcon,
 oil: TacticalOilWellIcon,
 manpower: StrategicManpowerIcon,
 territory: StrategicTerritoryIcon,
 treaty: StrategicTreatyIcon,
 warfare: StrategicWarfareIcon,
 intelligence: StrategicIntelligenceIcon,
 infantry_div: MilitaryInfantryDivisionIcon,
 armor_div: MilitaryArmorDivisionIcon,
};

export const TACTICAL_EMBLEM_NAMES = Object.keys(TACTICAL_EMBLEMS);

export function renderEmblemIcon(
 name: string,
 props: React.SVGProps<SVGSVGElement> & { size?: number | string; className?: string } = {}
) {
 if (name && (name.startsWith('data:image') || name.startsWith('http'))) {
  return (
   <img
    src={name}
    alt="Emblem"
    className="w-full h-full object-cover block"
    style={{ borderRadius: 'inherit' }}
   />
  );
 }

 // Check tactical emblems first
 const TacticalComp = TACTICAL_EMBLEMS[name?.toLowerCase()];
 if (TacticalComp) {
  return <TacticalComp {...props} />;
 }

 // Fallback to tank or default emblem
 const DefaultIcon = MilitaryTankIcon;
 return <DefaultIcon {...props} />;
}

// 快速根据装备分类或ID渲染真实军事图标
export function renderEquipmentTacticalIcon(
 categoryOrId: string,
 props: React.SVGProps<SVGSVGElement> & { size?: number | string; className?: string } = {}
) {
 const key = categoryOrId.toLowerCase();

 if (key.includes('tank_destroyer') || key.includes('td')) return <MilitaryTankDestroyerIcon {...props} />;
 if (key.includes('sp_artillery') || key.includes('spa') || key.includes('自行火炮') || key.includes('火箭炮')) return <MilitarySPArtilleryIcon {...props} />;
 if (key.includes('tank') || key.includes('armor') || key.includes('坦克') || key.includes('装甲')) return <MilitaryTankIcon {...props} />;
 if (key.includes('fighter') || key.includes('aircraft') || key.includes('air') || key.includes('战机') || key.includes('截击')) return <MilitaryFighterIcon {...props} />;
 if (key.includes('bomber') || key.includes('轰炸')) return <MilitaryBomberIcon {...props} />;
 if (key.includes('helicopter') || key.includes('直升机')) return <MilitaryHelicopterIcon {...props} />;
 if (key.includes('carrier') || key.includes('航母')) return <MilitaryCarrierIcon {...props} />;
 if (key.includes('submarine') || key.includes('潜艇')) return <MilitarySubmarineIcon {...props} />;
 if (key.includes('warship') || key.includes('navy') || key.includes('驱逐') || key.includes('巡洋')) return <MilitaryWarshipIcon {...props} />;
 if (key.includes('artillery') || key.includes('炮') || key.includes('加农')) return <MilitaryArtilleryIcon {...props} />;
 if (key.includes('rifle') || key.includes('infantry') || key.includes('步枪') || key.includes('单兵')) return <MilitaryRifleIcon {...props} />;
 if (key.includes('truck') || key.includes('motorized') || key.includes('卡车') || key.includes('运输')) return <MilitaryTruckIcon {...props} />;
 if (key.includes('ifv') || key.includes('mechanized') || key.includes('步兵战车') || key.includes('人员输送')) return <MilitaryIFVIcon {...props} />;
 if (key.includes('armored_car') || key.includes('侦察车') || key.includes('装甲车')) return <MilitaryArmoredCarIcon {...props} />;
 if (key.includes('support') || key.includes('后勤') || key.includes('工兵')) return <MilitarySupportEquipmentIcon {...props} />;
 if (key.includes('factory') || key.includes('工厂')) return <MilitaryFactoryPlantIcon {...props} />;

 // Default fallback
 return <MilitaryTankIcon {...props} />;
}

export * from './tacticalIcons';
