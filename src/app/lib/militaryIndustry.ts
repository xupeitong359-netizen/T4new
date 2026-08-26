import { CustomEquipmentDesign, MilitaryProductionLine, Nation, ProvinceData } from '../types';

export const CAPACITY_PER_MILITARY_FACTORY_24H = 500;

/**
 * 获取单个省份的军工厂数量 (统一优先读取 detailedBuildings.military_factory，其次读取 militaryFactories)
 */
export function getProvinceMilitaryFactories(province: Partial<ProvinceData> | null | undefined): number {
 if (!province) return 0;
 const detailed = province.detailedBuildings?.military_factory;
 if (typeof detailed === 'number' && Number.isFinite(detailed)) {
  return Math.max(0, Math.min(30, Math.floor(detailed)));
 }
 const direct = province.militaryFactories;
 if (typeof direct === 'number' && Number.isFinite(direct)) {
  return Math.max(0, Math.min(30, Math.floor(direct)));
 }
 return 0;
}

/**
 * 计算国家所有省份的军工厂总数
 */
export function getTotalMilitaryFactories(nation: Partial<Nation> | null | undefined): number {
 if (!nation || !nation.provinces || !Array.isArray(nation.provinces)) {
  return 0;
 }
 return nation.provinces.reduce((total, prov) => total + getProvinceMilitaryFactories(prov), 0);
}

export interface StandardEquipmentTemplate {
 id: string;
 name: string;
 category: 'infantry' | 'artillery' | 'support' | 'motorized' | 'armor' | 'mechanized' | 'aviation';
 baseCost: number; // IC per unit
 baseCostDisplay: string;
 description: string;
 outputFormula: string;
 unitName: string;
 iconName: string;
 tiers: {
  tier: number;
  name: string;
  addedCost: number;
  totalCost: number;
  costDisplay: string;
  outputPerFactory24h: number;
  description: string;
 }[];
}

export const STANDARD_EQUIPMENT_TEMPLATES: StandardEquipmentTemplate[] = [
 {
  id: 'eq_rifle',
  name: '制式步枪 / 步兵装备',
  category: 'infantry',
  baseCost: 0.1, // 10 rifles per 1 IC
  baseCostDisplay: '0.1 产能 (每10把需要1点)',
  description: '陆军部队核心单兵制式步枪与轻兵器装备。',
  outputFormula: '单厂24h产出 5,000 把',
  unitName: '把',
  iconName: 'Crosshair',
  tiers: [
   {
    tier: 1,
    name: 'Type I 基础栓动步枪 (基准型)',
    addedCost: 0,
    totalCost: 0.1,
    costDisplay: '0.1 产能 / 把 (10把/点)',
    outputPerFactory24h: 5000,
    description: '经典可靠的栓动制式步枪，造价低廉，易于大规模量产。',
   },
   {
    tier: 2,
    name: 'Type II 半自动步枪 (改良型)',
    addedCost: 0.05,
    totalCost: 0.15,
    costDisplay: '0.15 产能 / 把 (6.67把/点)',
    outputPerFactory24h: 3333,
    description: '装配半自动连发击发机构与导气式活塞，步兵压制火力显著增强。',
   },
   {
    tier: 3,
    name: 'Type III 全自动突击步枪 (现代化)',
    addedCost: 0.1,
    totalCost: 0.2,
    costDisplay: '0.2 产能 / 把 (5把/点)',
    outputPerFactory24h: 2500,
    description: '通用中间威力弹与可折叠枪托，近中距离综合战术效能极高。',
   },
  ],
 },
 {
  id: 'eq_artillery',
  name: '压制火炮 / 野战重炮',
  category: 'artillery',
  baseCost: 2.5, // 2.5 IC per gun
  baseCostDisplay: '2.5 产能 / 门',
  description: '为前线部队提供火力支援与战场纵深轰炸的压制性火炮。',
  outputFormula: '单厂24h产出 200 门',
  unitName: '门',
  iconName: 'Bomb',
  tiers: [
   {
    tier: 1,
    name: 'Type I 野战轻加农炮 (基准型)',
    addedCost: 0,
    totalCost: 2.5,
    costDisplay: '2.5 产能 / 门',
    outputPerFactory24h: 200,
    description: '75mm~105mm 轻型野战牵引加农炮，反应迅速，阵地转移便捷。',
   },
   {
    tier: 2,
    name: 'Type II 重型榴弹加农炮 (强化型)',
    addedCost: 1.5,
    totalCost: 4.0,
    costDisplay: '4.0 产能 / 门',
    outputPerFactory24h: 125,
    description: '152mm~155mm 重型压制榴弹炮，高毁伤弹丸覆盖整片阵地。',
   },
   {
    tier: 3,
    name: 'Type III 远程精确火箭炮 (现代化)',
    addedCost: 3.5,
    totalCost: 6.0,
    costDisplay: '6.0 产能 / 门',
    outputPerFactory24h: 83,
    description: '多管大口径齐射火箭系统，配备增程精确制导弹药。',
   },
  ],
 },
 {
  id: 'eq_support',
  name: '后勤支援装备 / 工兵套件',
  category: 'support',
  baseCost: 3.0, // 3 IC per item
  baseCostDisplay: '3.0 产能 / 套',
  description: '包含无线电战地通讯、医疗器械、防化与野战工兵成套装备。',
  outputFormula: '单厂24h产出 166.7 个',
  unitName: '套',
  iconName: 'Wrench',
  tiers: [
   {
    tier: 1,
    name: 'Type I 基础工兵与战地后勤套件 (基准型)',
    addedCost: 0,
    totalCost: 3.0,
    costDisplay: '3.0 产能 / 套',
    outputPerFactory24h: 166.7,
    description: '战壕挖掘工具、基础急救箱、有线电话与后勤维修工具箱。',
   },
   {
    tier: 2,
    name: 'Type II 无线电台与专业侦察医疗套件',
    addedCost: 1.5,
    totalCost: 4.5,
    costDisplay: '4.5 产能 / 套',
    outputPerFactory24h: 111.1,
    description: '背负式高频战术电台、野战手术器械包与先进光学测距观测仪。',
   },
   {
    tier: 3,
    name: 'Type III 数字化战场终端与侦察无人机套件',
    addedCost: 3.0,
    totalCost: 6.0,
    costDisplay: '6.0 产能 / 套',
    outputPerFactory24h: 83.3,
    description: '前沿微型侦察无人机、战术平板终端与夜视全天候传感器。',
   },
  ],
 },
 {
  id: 'eq_truck',
  name: '军用卡车 / 摩托化运输车辆',
  category: 'motorized',
  baseCost: 2.5, // 2.5 IC per truck
  baseCostDisplay: '2.5 产能 / 辆',
  description: '实现陆军摩托化推进、物资给养运输与牵引火炮的机动卡车。',
  outputFormula: '单厂24h产出 200 辆',
  unitName: '辆',
  iconName: 'Truck',
  tiers: [
   {
    tier: 1,
    name: 'Type I 基础野战运输卡车 (基准型)',
    addedCost: 0,
    totalCost: 2.5,
    costDisplay: '2.5 产能 / 辆',
    outputPerFactory24h: 200,
    description: '后驱标准货箱卡车，提供基础的公路补给机动能力。',
   },
   {
    tier: 2,
    name: 'Type II 全驱重型越野军用卡车',
    addedCost: 1.5,
    totalCost: 4.0,
    costDisplay: '4.0 产能 / 辆',
    outputPerFactory24h: 125,
    description: '6x6 全轮驱动越野底盘，可在泥泞与复杂山地从容通行。',
   },
   {
    tier: 3,
    name: 'Type III 重型特种越野牵引车',
    addedCost: 3.0,
    totalCost: 5.5,
    costDisplay: '5.5 产能 / 辆',
    outputPerFactory24h: 90.9,
    description: '高马力重载底盘，专为牵引超重型火炮与雷达挂车设计。',
   },
  ],
 },
 {
  id: 'eq_armored_car',
  name: '装甲车 / 轮式侦察车',
  category: 'armor',
  baseCost: 5.0, // 5 IC per car
  baseCostDisplay: '5.0 产能 / 辆',
  description: '高速轮式轻装甲车辆，专精于战场前沿侦察与侧翼袭扰。',
  outputFormula: '单厂24h产出 100 辆',
  unitName: '辆',
  iconName: 'Shield',
  tiers: [
   {
    tier: 1,
    name: 'Type I 轮式轻型装甲侦察车 (基准型)',
    addedCost: 0,
    totalCost: 5.0,
    costDisplay: '5.0 产能 / 辆',
    outputPerFactory24h: 100,
    description: '4x4 轮式轻装甲车身，装配重机枪，行进速度极快。',
   },
   {
    tier: 2,
    name: 'Type II 防雷反伏击轮式装甲车 (MRAP)',
    addedCost: 2.5,
    totalCost: 7.5,
    costDisplay: '7.5 产能 / 辆',
    outputPerFactory24h: 66.7,
    description: 'V型防雷底盘与重型防弹装甲，大幅提升乘员生还率。',
   },
   {
    tier: 3,
    name: 'Type III 轮式重火力突击炮车',
    addedCost: 5.0,
    totalCost: 10.0,
    costDisplay: '10.0 产能 / 辆',
    outputPerFactory24h: 50,
    description: '8x8 底盘搭载 105mm 低后坐力主炮，具备坦克级别的直射火力。',
   },
  ],
 },
 {
  id: 'eq_mechanized',
  name: '机械化步兵装备 / 步兵战车',
  category: 'mechanized',
  baseCost: 7.0, // 7 IC per vehicle
  baseCostDisplay: '7.0 产能 / 辆',
  description: '履带/轮式高防护步兵载具，伴随装甲集群提供突击与协同作战。',
  outputFormula: '单厂24h产出 71.4 辆',
  unitName: '辆',
  iconName: 'Boxes',
  tiers: [
   {
    tier: 1,
    name: 'Type I 履带式装甲人员输送车 APC (基准型)',
    addedCost: 0,
    totalCost: 7.0,
    costDisplay: '7.0 产能 / 辆',
    outputPerFactory24h: 71.4,
    description: '全履带式防弹装甲乘员舱，可护送一个完整步兵班穿过火线。',
   },
   {
    tier: 2,
    name: 'Type II 步兵战车 IFV (加装机关炮)',
    addedCost: 3.5,
    totalCost: 10.5,
    costDisplay: '10.5 产能 / 辆',
    outputPerFactory24h: 47.6,
    description: '搭载 30mm 自动机关炮与反坦克导弹发射筒，可独立对抗敌方工事。',
   },
   {
    tier: 3,
    name: 'Type III 重装甲现代化步兵战车 (复合装甲)',
    addedCost: 7.0,
    totalCost: 14.0,
    costDisplay: '14.0 产能 / 辆',
    outputPerFactory24h: 35.7,
    description: '主战坦克级重型底盘与数字化火控系统，攻防一体。',
   },
  ],
 },
 // 默认坦克体系（彻底免除设计器开销，极致性能与标准配装）
 {
  id: 'eq_tank_medium',
  name: '中型坦克 / 主战坦克 (主力标准型)',
  category: 'armor',
  baseCost: 12.0,
  baseCostDisplay: '12.0 产能 / 辆',
  description: '装甲集群核心主力中坚，装甲、机动与火力的完美平衡标准战车。',
  outputFormula: '单厂24h产出 41.7 辆',
  unitName: '辆',
  iconName: 'MilitaryTankIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 基础中型坦克 (标准主力型)',
    addedCost: 0,
    totalCost: 12.0,
    costDisplay: '12.0 产能 / 辆',
    outputPerFactory24h: 41.7,
    description: '75mm 加农炮与倾斜轧制均质装甲，帝国装甲师中坚突击力量。',
   },
   {
    tier: 2,
    name: 'Type II 改良强化中型坦克',
    addedCost: 4.0,
    totalCost: 16.0,
    costDisplay: '16.0 产能 / 辆',
    outputPerFactory24h: 31.3,
    description: '88mm~105mm 高倍径主炮与附加装甲裙板，穿深与生存能力跃升。',
   },
   {
    tier: 3,
    name: 'Type III 现代化主战坦克 MBT',
    addedCost: 8.0,
    totalCost: 20.0,
    costDisplay: '20.0 产能 / 辆',
    outputPerFactory24h: 25.0,
    description: '120/125mm 滑膛重炮、陶瓷复合装甲与猎歼双向火控计算机。',
   },
  ],
 },
 {
  id: 'eq_tank_light',
  name: '轻型坦克 / 快速巡洋坦克',
  category: 'armor',
  baseCost: 8.0,
  baseCostDisplay: '8.0 产能 / 辆',
  description: '高速机动与越野突击装甲车辆，专精于大纵深穿插与侧翼合围。',
  outputFormula: '单厂24h产出 62.5 辆',
  unitName: '辆',
  iconName: 'MilitaryTankIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 早期轻型巡洋战车',
    addedCost: 0,
    totalCost: 8.0,
    costDisplay: '8.0 产能 / 辆',
    outputPerFactory24h: 62.5,
    description: '轻质钢装甲配 37-45mm 速射炮，公路与越野机动性极佳。',
   },
   {
    tier: 2,
    name: 'Type II 快速突击轻型坦克',
    addedCost: 3.0,
    totalCost: 11.0,
    costDisplay: '11.0 产能 / 辆',
    outputPerFactory24h: 45.5,
    description: '大马力柴油机与长身管 57mm 穿甲炮，机动撕扯敌方阵线。',
   },
   {
    tier: 3,
    name: 'Type III 现代化空降轻型主战车',
    addedCost: 6.0,
    totalCost: 14.0,
    costDisplay: '14.0 产能 / 辆',
    outputPerFactory24h: 35.7,
    description: '铝合金减重车体搭载 105mm 低后坐力炮，支持空投战略部署。',
   },
  ],
 },
 {
  id: 'eq_tank_heavy',
  name: '重型坦克 / 突破攻坚坦克',
  category: 'armor',
  baseCost: 20.0,
  baseCostDisplay: '20.0 产能 / 辆',
  description: '极其坚固的正面装甲与毁灭级火炮，专为突破敌军重设防阵地打造。',
  outputFormula: '单厂24h产出 25.0 辆',
  unitName: '辆',
  iconName: 'MilitaryTankIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 突破重型坦克',
    addedCost: 0,
    totalCost: 20.0,
    costDisplay: '20.0 产能 / 辆',
    outputPerFactory24h: 25.0,
    description: '超厚装甲堡垒配合 122mm 重炮，正面硬抗常规野战火炮。',
   },
   {
    tier: 2,
    name: 'Type II 攻坚重装坦克',
    addedCost: 6.0,
    totalCost: 26.0,
    costDisplay: '26.0 产能 / 辆',
    outputPerFactory24h: 19.2,
    description: '正面装甲等效 200mm 以上，移动的钢铁工事。',
   },
   {
    tier: 3,
    name: 'Type III 超重型要塞突破车',
    addedCost: 12.0,
    totalCost: 32.0,
    costDisplay: '32.0 产能 / 辆',
    outputPerFactory24h: 15.6,
    description: '百吨级要塞决战兵器，装配重型大口径攻坚滑膛炮。',
   },
  ],
 },
 {
  id: 'eq_tank_destroyer',
  name: '坦克歼击车 / 猎歼突击炮',
  category: 'armor',
  baseCost: 10.0,
  baseCostDisplay: '10.0 产能 / 辆',
  description: '固定战斗室搭载大口径长身管反装甲火炮，防御伏击与反击主力。',
  outputFormula: '单厂24h产出 50.0 辆',
  unitName: '辆',
  iconName: 'MilitaryTankDestroyerIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 突击反坦克炮',
    addedCost: 0,
    totalCost: 10.0,
    costDisplay: '10.0 产能 / 辆',
    outputPerFactory24h: 50.0,
    description: '低矮车身无炮塔结构，隐蔽伏击敌方坦克集群。',
   },
   {
    tier: 2,
    name: 'Type II 猎歼重型坦克歼击车',
    addedCost: 4.0,
    totalCost: 14.0,
    costDisplay: '14.0 产能 / 辆',
    outputPerFactory24h: 35.7,
    description: '88mm~105mm 超长管反坦克炮，千米外正面撕裂主力装甲。',
   },
   {
    tier: 3,
    name: 'Type III 现代化反坦克导弹发射车 (ATGM)',
    addedCost: 8.0,
    totalCost: 18.0,
    costDisplay: '18.0 产能 / 辆',
    outputPerFactory24h: 27.8,
    description: '多联装激光/红外制导重型重型反坦克导弹发射系统。',
   },
  ],
 },
 {
  id: 'eq_sp_artillery',
  name: '自行火炮 / 自行火箭炮',
  category: 'artillery',
  baseCost: 9.5,
  baseCostDisplay: '9.5 产能 / 辆',
  description: '履带底盘搭载大口径榴弹炮或火箭炮，伴随装甲兵团快打快撤。',
  outputFormula: '单厂24h产出 52.6 辆',
  unitName: '辆',
  iconName: 'MilitarySPArtilleryIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 轻型自行榴弹炮',
    addedCost: 0,
    totalCost: 9.5,
    costDisplay: '9.5 产能 / 辆',
    outputPerFactory24h: 52.6,
    description: '122mm 履带式自行榴弹炮，迅速占领阵地并转移。',
   },
   {
    tier: 2,
    name: 'Type II 155mm 履带重型自行榴弹炮',
    addedCost: 4.5,
    totalCost: 14.0,
    costDisplay: '14.0 产能 / 辆',
    outputPerFactory24h: 35.7,
    description: '52倍径长身管与半自动装填，压倒性纵深火力覆盖。',
   },
   {
    tier: 3,
    name: 'Type III 300mm 重型远程自行多管火箭炮 (MLRS)',
    addedCost: 8.5,
    totalCost: 18.0,
    costDisplay: '18.0 产能 / 辆',
    outputPerFactory24h: 27.8,
    description: '数字化弹道指挥与密集火箭齐射，大面积工事毁灭。',
   },
  ],
 },
 {
  id: 'eq_aircraft',
  name: '军用战机 / 航空兵器',
  category: 'aviation',
  baseCost: 15.0,
  baseCostDisplay: '15.0 产能 / 架',
  description: '争夺制空权、对地近距空中支援与战略空中压制战机。',
  outputFormula: '单厂24h产出 33.3 架',
  unitName: '架',
  iconName: 'MilitaryFighterIcon',
  tiers: [
   {
    tier: 1,
    name: 'Type I 螺旋桨空优截击机',
    addedCost: 0,
    totalCost: 15.0,
    costDisplay: '15.0 产能 / 架',
    outputPerFactory24h: 33.3,
    description: '大马力单发活塞动力与 20mm 机炮，争夺战区前线制空权。',
   },
   {
    tier: 2,
    name: 'Type II 喷气式多用途战机',
    addedCost: 7.0,
    totalCost: 22.0,
    costDisplay: '22.0 产能 / 架',
    outputPerFactory24h: 22.7,
    description: '跨音速涡轮喷气动力，加装红外制导空空导弹与火箭挂架。',
   },
   {
    tier: 3,
    name: 'Type III 第四代隐身重型制空战机',
    addedCost: 15.0,
    totalCost: 30.0,
    costDisplay: '30.0 产能 / 架',
    outputPerFactory24h: 16.7,
    description: '相控阵雷达、超音速巡航、超视距空空导弹与雷达隐身机身。',
   },
  ],
 },
];

export function createDefaultProductionLines(militaryFactoriesCount: number): MilitaryProductionLine[] {
 const lines: MilitaryProductionLine[] = [
  {
   id: 'line_rifle',
   equipmentId: 'eq_rifle',
   equipmentName: 'Type I 基础栓动步枪',
   category: 'infantry',
   unitCost: 0.1,
   unitCostDisplay: '0.1 产能 (10把/点)',
   assignedFactories: Math.max(0, Math.min(2, militaryFactoriesCount)),
   dailyCapacity: Math.max(0, Math.min(2, militaryFactoriesCount)) * CAPACITY_PER_MILITARY_FACTORY_24H,
   dailyOutput: (Math.max(0, Math.min(2, militaryFactoriesCount)) * CAPACITY_PER_MILITARY_FACTORY_24H) / 0.1,
  },
  {
   id: 'line_artillery',
   equipmentId: 'eq_artillery',
   equipmentName: 'Type I 野战轻加农炮',
   category: 'artillery',
   unitCost: 2.5,
   unitCostDisplay: '2.5 产能 / 门',
   assignedFactories: militaryFactoriesCount >= 3 ? 1 : 0,
   dailyCapacity: (militaryFactoriesCount >= 3 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H,
   dailyOutput: ((militaryFactoriesCount >= 3 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H) / 2.5,
  },
  {
   id: 'line_support',
   equipmentId: 'eq_support',
   equipmentName: 'Type I 基础工兵与战地后勤套件',
   category: 'support',
   unitCost: 3.0,
   unitCostDisplay: '3.0 产能 / 套',
   assignedFactories: militaryFactoriesCount >= 4 ? 1 : 0,
   dailyCapacity: (militaryFactoriesCount >= 4 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H,
   dailyOutput: ((militaryFactoriesCount >= 4 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H) / 3.0,
  },
  {
   id: 'line_truck',
   equipmentId: 'eq_truck',
   equipmentName: 'Type I 基础野战运输卡车',
   category: 'motorized',
   unitCost: 2.5,
   unitCostDisplay: '2.5 产能 / 辆',
   assignedFactories: militaryFactoriesCount >= 5 ? 1 : 0,
   dailyCapacity: (militaryFactoriesCount >= 5 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H,
   dailyOutput: ((militaryFactoriesCount >= 5 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H) / 2.5,
  },
  {
   id: 'line_tank_medium',
   equipmentId: 'eq_tank_medium',
   equipmentName: 'Type I 基础中型坦克 (标准主力型)',
   category: 'armor',
   unitCost: 12.0,
   unitCostDisplay: '12.0 产能 / 辆',
   assignedFactories: militaryFactoriesCount >= 6 ? 1 : 0,
   dailyCapacity: (militaryFactoriesCount >= 6 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H,
   dailyOutput: ((militaryFactoriesCount >= 6 ? 1 : 0) * CAPACITY_PER_MILITARY_FACTORY_24H) / 12.0,
  },
 ];

 return lines;
}

/**
 * 实时计算与结算军工产出：
 * 修复军事工厂制造装备不增长的核心 Bug，根据上次结算时间与现实/游戏时间流逝，精确累加各产线产出的装备至国家战备库存。
 */
export function settleMilitaryProduction(
 nation: Partial<Nation> | null | undefined,
 targetTimestamp: number = Date.now()
): {
 updatedStockpiles: Record<string, number>;
 elapsedDays: number;
 lastUpdated: string;
 hasProduced: boolean;
 productionDeltas: Record<string, number>;
} {
 const currentIndustry = nation?.militaryIndustry;
 const currentStockpiles = { ...(currentIndustry?.stockpiles || {}) };
 const lines = currentIndustry?.productionLines || [];

 // 默认初始战备基础
 if (Object.keys(currentStockpiles).length === 0) {
  currentStockpiles.eq_rifle = 15000;
  currentStockpiles.eq_artillery = 350;
  currentStockpiles.eq_support = 400;
  currentStockpiles.eq_truck = 300;
  currentStockpiles.eq_armored_car = 120;
  currentStockpiles.eq_mechanized = 80;
  currentStockpiles.eq_tank_medium = 60;
 }

 const lastTime = currentIndustry?.lastUpdated
  ? Date.parse(currentIndustry.lastUpdated)
  : targetTimestamp - 60_000; // 首次默认计算 1 分钟

 const elapsedMs = Math.max(0, targetTimestamp - (isNaN(lastTime) ? targetTimestamp - 60_000 : lastTime));
 // 1 天 = 24 * 3600 * 1000 毫秒
 const elapsedDays = elapsedMs / (24 * 3600 * 1000);

 const productionDeltas: Record<string, number> = {};
 let hasProduced = false;

 if (elapsedDays > 0 && lines.length > 0) {
  for (const line of lines) {
   if (line.assignedFactories > 0 && line.dailyOutput > 0) {
    // 精确增量
    const produced = line.dailyOutput * elapsedDays;
    if (produced > 0) {
     hasProduced = true;
     const key = line.equipmentId;
     const currentVal = Number(currentStockpiles[key]) || 0;
     currentStockpiles[key] = Math.round((currentVal + produced) * 100) / 100;
     productionDeltas[key] = (productionDeltas[key] || 0) + produced;
    }
   }
  }
 }

 return {
  updatedStockpiles: currentStockpiles,
  elapsedDays,
  lastUpdated: new Date(targetTimestamp).toISOString(),
  hasProduced,
  productionDeltas,
 };
}

export interface StockpileItemBreakdown {
 id: string;
 name: string;
 category: 'infantry' | 'artillery' | 'support' | 'motorized' | 'armor' | 'mechanized' | 'aviation';
 categoryLabel: string;
 unitName: string;
 currentStock: number;
 armyDemand: number;
 balance: number; // currentStock - armyDemand (>0 盈余, <0 亏空)
 isDeficit: boolean;
 deficitAmount: number;
 surplusAmount: number;
 dailyOutput: number;
 assignedFactories: number;
 fulfillmentPercent: number;
 daysToBalance: number | null; // 补齐亏空所需天数
 productionLineCount: number;
}

/**
 * 国家后备仓库全景明细统计：
 * 汇总国家所有武器的库存、在役军队编制总需求、每日工厂产出速率、盈余/亏空状态与平衡周期。
 */
export function calculateNationalStockpileBreakdown(
 nation: Partial<Nation> | null | undefined
): {
 items: StockpileItemBreakdown[];
 totalStockpileCount: number;
 totalArmyDemandCount: number;
 totalDeficitCount: number;
 totalSurplusCount: number;
 deficitItemCount: number;
 surplusItemCount: number;
 totalAssignedMilitaryFactories: number;
} {
 const stockpiles = nation?.militaryIndustry?.stockpiles || {};
 const lines = nation?.militaryIndustry?.productionLines || [];
 const divisions = nation?.army?.divisions || [];

 // 计算陆军全部编制的装备总需求
 const armyDemands: Record<string, number> = {
  eq_rifle: 0,
  eq_artillery: 0,
  eq_support: 0,
  eq_truck: 0,
  eq_tank_medium: 0,
  eq_tank_light: 0,
  eq_tank_heavy: 0,
  eq_tank_destroyer: 0,
  eq_sp_artillery: 0,
  eq_armored_car: 0,
  eq_mechanized: 0,
  eq_aircraft: 0,
 };

 for (const div of divisions) {
  if (div.type === '步兵师') {
   armyDemands.eq_rifle += 9000;
   armyDemands.eq_artillery += 72;
   armyDemands.eq_support += 180;
   armyDemands.eq_truck += 20;
  } else if (div.type === '摩托化师') {
   armyDemands.eq_rifle += 6500;
   armyDemands.eq_artillery += 60;
   armyDemands.eq_support += 220;
   armyDemands.eq_truck += 650;
  } else if (div.type === '装甲师') {
   armyDemands.eq_rifle += 4000;
   armyDemands.eq_artillery += 54;
   armyDemands.eq_support += 260;
   armyDemands.eq_truck += 350;
   armyDemands.eq_tank_medium += 320; // 默认中型主战坦克需求
  } else {
   // 容错与自定义师
   const t = div.template || { infantry: 9, artillery: 2, support: 1, armor: 0 };
   armyDemands.eq_rifle += (t.infantry || 0) * 1000;
   armyDemands.eq_artillery += (t.artillery || 0) * 36;
   armyDemands.eq_support += (t.support || 0) * 180;
   if (t.armor && t.armor > 0) {
    armyDemands.eq_tank_medium += t.armor * 80;
   }
  }
 }

 // 整理产线数据
 const linesByEquipment: Record<string, { dailyOutput: number; factories: number; count: number }> = {};
 for (const line of lines) {
  const eqId = line.equipmentId;
  if (!linesByEquipment[eqId]) {
   linesByEquipment[eqId] = { dailyOutput: 0, factories: 0, count: 0 };
  }
  linesByEquipment[eqId].dailyOutput += line.assignedFactories > 0 ? (line.dailyOutput || 0) : 0;
  linesByEquipment[eqId].factories += line.assignedFactories || 0;
  linesByEquipment[eqId].count += 1;
 }

 const categoryLabels: Record<string, string> = {
  infantry: '步兵轻武器',
  artillery: '压制火炮',
  support: '战地后勤',
  motorized: '摩托化车辆',
  armor: '装甲战车与坦克',
  mechanized: '机械化载具',
  aviation: '航空飞行器',
 };

 const items: StockpileItemBreakdown[] = STANDARD_EQUIPMENT_TEMPLATES.map((tmpl) => {
  // 兼容旧版 tank id / des_default_tank
  let currentStock = Number(stockpiles[tmpl.id]) || 0;
  if (tmpl.id === 'eq_tank_medium') {
   currentStock += Number(stockpiles.eq_tank || 0) + Number(stockpiles.des_default_tank || 0);
  }

  const armyDemand = armyDemands[tmpl.id] || 0;
  const balance = currentStock - armyDemand;
  const isDeficit = balance < 0;
  const deficitAmount = isDeficit ? Math.abs(balance) : 0;
  const surplusAmount = !isDeficit ? balance : 0;

  const lineInfo = linesByEquipment[tmpl.id] || { dailyOutput: 0, factories: 0, count: 0 };
  const fulfillmentPercent = armyDemand > 0 ? Math.min(100, Math.round((currentStock / armyDemand) * 100)) : 100;

  let daysToBalance: number | null = null;
  if (isDeficit) {
   if (lineInfo.dailyOutput > 0) {
    daysToBalance = Math.ceil(deficitAmount / lineInfo.dailyOutput);
   }
  }

  return {
   id: tmpl.id,
   name: tmpl.name,
   category: tmpl.category,
   categoryLabel: categoryLabels[tmpl.category] || tmpl.category,
   unitName: tmpl.unitName,
   currentStock: Math.floor(currentStock),
   armyDemand,
   balance: Math.floor(balance),
   isDeficit,
   deficitAmount: Math.floor(deficitAmount),
   surplusAmount: Math.floor(surplusAmount),
   dailyOutput: Math.round(lineInfo.dailyOutput * 10) / 10,
   assignedFactories: lineInfo.factories,
   fulfillmentPercent,
   daysToBalance,
   productionLineCount: lineInfo.count,
  };
 });

 let totalStockpileCount = 0;
 let totalArmyDemandCount = 0;
 let totalDeficitCount = 0;
 let totalSurplusCount = 0;
 let deficitItemCount = 0;
 let surplusItemCount = 0;
 let totalAssignedMilitaryFactories = 0;

 for (const item of items) {
  totalStockpileCount += item.currentStock;
  totalArmyDemandCount += item.armyDemand;
  if (item.isDeficit) {
   totalDeficitCount += item.deficitAmount;
   deficitItemCount += 1;
  } else {
   totalSurplusCount += item.surplusAmount;
   surplusItemCount += 1;
  }
  totalAssignedMilitaryFactories += item.assignedFactories;
 }

 return {
  items,
  totalStockpileCount,
  totalArmyDemandCount,
  totalDeficitCount,
  totalSurplusCount,
  deficitItemCount,
  surplusItemCount,
  totalAssignedMilitaryFactories,
 };
}
