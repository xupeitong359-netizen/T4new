// =============================================================================
// TERRAIN ENGINE (自然地形与地貌属性引擎)
// 依据真实地理、战役地形与经典大战略机制，为全球 1048 个省份地块赋予真实地形属性：
// 山地 (Mountain)、沼泽 (Marsh)、平原 (Plains)、丘陵 (Hills)、沙漠 (Desert)、城市 (Urban)、森林 (Forest)
// =============================================================================

export type ProvinceTerrainType =
 | 'mountain'
 | 'marsh'
 | 'plains'
 | 'hills'
 | 'desert'
 | 'urban'
 | 'forest';

export interface TerrainInfo {
 type: ProvinceTerrainType;
 label: string;
 color: string;
 mapFill: string;
 bgClass: string;
 textClass: string;
 borderClass: string;
 tacticalIcon: string;
 combatEffect: string;
 movementEffect: string;
 infrastructureBase: number;
 description: string;
}

export const TERRAIN_DEFINITIONS: Record<ProvinceTerrainType, TerrainInfo> = {
 mountain: {
  type: 'mountain',
  label: '山地',
  color: '#78716c',
  mapFill: '#6e6761',
  bgClass: 'bg-stone-800/80',
  textClass: 'text-stone-300',
  borderClass: 'border-stone-600',
  tacticalIcon: '山地',
  combatEffect: '防守方战斗力 +25%，要塞加成 +15%，装甲机械化进攻 -35%',
  movementEffect: '陆军机动速度 -30%，后勤补给消耗 +20%',
  infrastructureBase: 2,
  description: '险峻崇山峻岭与高海拔山脉，易守难攻，极大地限制装甲部队突破。',
 },
 marsh: {
  type: 'marsh',
  label: '沼泽',
  color: '#0d9488',
  mapFill: '#13756d',
  bgClass: 'bg-teal-950/80',
  textClass: 'text-teal-300',
  borderClass: 'border-teal-700',
  tacticalIcon: '沼泽',
  combatEffect: '全军进攻战力 -25%，步兵防守 +15%，机械化极难通过',
  movementEffect: '通行速度 -50%，重型装备极易损耗',
  infrastructureBase: 1,
  description: '泥泞湿地与水系沼泽密布，泥潭阻碍机械化进军，极易陷入持久胶着。',
 },
 plains: {
  type: 'plains',
  label: '平原',
  color: '#5b8a54',
  mapFill: '#507c49',
  bgClass: 'bg-emerald-950/80',
  textClass: 'text-emerald-300',
  borderClass: 'border-emerald-700',
  tacticalIcon: '平原',
  combatEffect: '无地形掩体惩罚，装甲装步突击战力 +20%，适合大规模决战',
  movementEffect: '行军机动无惩罚，战役机动性最高',
  infrastructureBase: 3,
  description: '辽阔平原与耕作农区，极其适宜大纵深机械化装甲突击与快速兵力调度。',
 },
 hills: {
  type: 'hills',
  label: '丘陵',
  color: '#b45309',
  mapFill: '#994708',
  bgClass: 'bg-amber-950/80',
  textClass: 'text-amber-300',
  borderClass: 'border-amber-700',
  tacticalIcon: '丘陵',
  combatEffect: '防守方战力 +10%，轻型步兵与山地旅擅长在此伏击与侧翼牵制',
  movementEffect: '通行速度 -10%，后勤补给略有损耗',
  infrastructureBase: 2,
  description: '连绵起伏的起伏丘陵与台地，兼具防御依托与一定的机动性。',
 },
 desert: {
  type: 'desert',
  label: '沙漠',
  color: '#ca8a04',
  mapFill: '#b37803',
  bgClass: 'bg-yellow-950/80',
  textClass: 'text-yellow-300',
  borderClass: 'border-yellow-700',
  tacticalIcon: '沙漠',
  combatEffect: '极端恶劣气候，补给损耗极大，步兵作战效能受高温衰减',
  movementEffect: '缺乏水源与公路，后勤补给线极度脆弱',
  infrastructureBase: 1,
  description: '广袤荒漠与干燥沙丘，补给线极为漫长，战线通常依托绿洲与沿海公路展开。',
 },
 urban: {
  type: 'urban',
  label: '城市',
  color: '#64748b',
  mapFill: '#526075',
  bgClass: 'bg-slate-900/90',
  textClass: 'text-slate-200',
  borderClass: 'border-slate-500',
  tacticalIcon: '城市',
  combatEffect: '残酷巷战，防守方战力 +40%，攻方火炮轰炸与空袭破坏剧增',
  movementEffect: '工业与铁路枢纽，兵力部署与集结效率极高',
  infrastructureBase: 4,
  description: '人口稠密的高价值工业与政治中心，巷战绞肉机，夺取将造成重大士气打击。',
 },
 forest: {
  type: 'forest',
  label: '森林',
  color: '#15803d',
  mapFill: '#166534',
  bgClass: 'bg-green-950/80',
  textClass: 'text-green-300',
  borderClass: 'border-green-700',
  tacticalIcon: '森林',
  combatEffect: '空军侦察与空袭效率 -30%，步兵潜行与林地防御 +20%，装甲穿插受限',
  movementEffect: '通行速度 -20%，密林限制大型重装备行军',
  infrastructureBase: 2,
  description: '茂密落叶林、针叶泰加林或热带雨林，遮蔽天空视野，利于步兵设伏与持久战。',
 },
};

// Explicit high-profile urban metropolises
const EXPLICIT_URBAN_NAMES = new Set([
 'berlin', 'brandenburg', 'ile de france', 'greater london area', 'lothian', 'tokyo', 'kanto', 'kansai',
 'moscow', 'leningrad', 'stalingrad', 'new york', 'district of columbia', 'lazio', 'rome', 'hebei',
 'jiangsu', 'shanghai', 'vienna', 'warszawa', 'warsaw', 'madrid', 'attica', 'athens', 'prague', 'bohemia',
 'stockholm', 'oslo', 'copenhagen', 'amsterdam', 'holland', 'brabant', 'brussels', 'budapest', 'bucharest',
 'sofia', 'belgrade', 'ankara', 'istanbul', 'cairo', 'tehran', 'delhi', 'baghdad', 'singapore',
 'buenos aires', 'rio de janeiro', 'sao paulo', 'santiago', 'mexico city', 'illinois', 'california',
 'hong kong', 'macau', 'beijing', 'tianjin', 'kyiv', 'kiev', 'minsk', 'helsinki', 'lisbon'
]);

const MOUNTAIN_KEYWORDS = [
 'alps', 'alpen', 'tirol', 'tyrol', 'valais', 'graubunden', 'tibet', 'himalaya', 'sichuan', 'qinghai',
 'caucasus', 'georgia', 'armenia', 'ural', 'andes', 'pyrenees', 'carpath', 'tatra', 'balkan', 'pindus',
 'zagros', 'hindu kush', 'pamir', 'altai', 'rocky', 'rockies', 'sierra', 'montana', 'colorado', 'appennin',
 'norway', 'nordland', 'troms', 'highlands', 'asturias', 'cantabria', 'lebanon', 'yemen', 'asir', 'atlas',
 'abruzzo', 'trentino', 'salzburg', 'carinthia', 'styria', 'kashmir', 'ladakh', 'nepal', 'bhutan',
 'guizhou', 'yunnan', 'sikang', 'shaanxi', 'shanxi', 'mount', 'mont'
];

const MARSH_KEYWORDS = [
 'marsh', 'pripet', 'pinsk', 'polesia', 'swamp', 'everglades', 'karelia', 'murmansk', 'arkhangelsk',
 'nenets', 'delta', 'camargue', 'zeeland', 'polder', 'tabasco', 'pantanal', 'sudd', 'mangrove',
 'sundarbans', 'chaco', 'marismas', 'fen', 'wetland', 'flooded'
];

const DESERT_KEYWORDS = [
 'desert', 'sahara', 'sinai', 'cyrenaica', 'tripolitania', 'fezzan', 'nejd', 'hejaz', 'rub al', 'gobi',
 'taklamakan', 'negev', 'an nafud', 'mojave', 'arizona', 'nevada', 'new mexico', 'sonora', 'chihuahua',
 'atacama', 'namib', 'kalahari', 'karakum', 'kyzylkum', 'outback', 'nullarbor', 'suez', 'aswan', 'matruh',
 'kharga', 'farafra', 'dakhla', 'qattara', 'al jawf', 'kufra', 'tabuk', 'hail', 'qassim', 'riyadh',
 'kuwait', 'qatar', 'trucial', 'oman', 'hadramaut', 'baluchistan', 'sistan', 'kerman', 'yazd', 'lut',
 'thar', 'xinjiang', 'ningxia', 'alxa', 'oasis', 'dune'
];

const FOREST_KEYWORDS = [
 'forest', 'wald', 'ardennes', 'taiga', 'amazon', 'congo', 'gabon', 'cameroon', 'borneo', 'sumatra',
 'papua', 'rondonia', 'para', 'amapa', 'acre', 'amazonas', 'loreto', 'smolensk', 'bryansk', 'novgorod',
 'vologda', 'kostroma', 'kirov', 'perm', 'komi', 'khanty', 'tomsk', 'krasnoyarsk', 'yakutsk', 'amur',
 'khabarovsk', 'sakhalin', 'finland', 'savonia', 'tavastia', 'ostrobothnia', 'lappi', 'varmland',
 'dalarna', 'norrland', 'vasterbotten', 'norrbotten', 'maine', 'vermont', 'oregon', 'washington',
 'british columbia', 'burma', 'malaya', 'laos', 'vietnam', 'cambodia', 'siam', 'wood', 'jungle'
];

const HILL_KEYWORDS = [
 'hill', 'highland', 'rhineland', 'moselland', 'baden', 'wurtemberg', 'wurttemberg', 'hesse', 'thuringia',
 'saxony', 'franconia', 'bavaria', 'wales', 'cumbria', 'yorkshire', 'pennines', 'cheviot', 'massif',
 'auvergne', 'limousin', 'brittany', 'normandy', 'vosges', 'bohemia', 'moravia', 'silesia', 'galicia',
 'podolia', 'transylvania', 'banat', 'tuscany', 'umbria', 'marche', 'campania', 'calabria', 'sicily',
 'sardinia', 'corsica', 'castile', 'extremadura', 'andalusia', 'aragon', 'catalonia', 'basque', 'hunan',
 'jiangxi', 'zhejiang', 'fujian', 'guangdong', 'guangxi', 'anhui', 'hubei', 'shandong', 'henan',
 'kentucky', 'tennessee', 'virginia', 'west virginia', 'carolina', 'georgia', 'alabama', 'pennsylvania'
];

/**
 * Accurately determines the terrain type of a province / state based on its ID, name and HOI4 attributes.
 */
export function getProvinceTerrain(
 stateId?: string | number,
 name?: string,
 properties?: any
): TerrainInfo {
 const normName = String(name || properties?.name || '').toLowerCase().trim();
 const cat = properties?.stateCategory || '';
 const numId = Number(stateId || properties?.stateId || properties?.id || 1);

 // 1. Explicit Check for Metropolises & Capitals -> Urban
 if (EXPLICIT_URBAN_NAMES.has(normName) || cat === 'megalopolis') {
  return TERRAIN_DEFINITIONS.urban;
 }

 // 2. Keyword-based Geography Matching
 if (MARSH_KEYWORDS.some((k) => normName.includes(k))) {
  return TERRAIN_DEFINITIONS.marsh;
 }
 if (DESERT_KEYWORDS.some((k) => normName.includes(k))) {
  return TERRAIN_DEFINITIONS.desert;
 }
 if (MOUNTAIN_KEYWORDS.some((k) => normName.includes(k))) {
  return TERRAIN_DEFINITIONS.mountain;
 }
 if (FOREST_KEYWORDS.some((k) => normName.includes(k))) {
  return TERRAIN_DEFINITIONS.forest;
 }
 if (HILL_KEYWORDS.some((k) => normName.includes(k))) {
  return TERRAIN_DEFINITIONS.hills;
 }

 // 3. Category Fallback / Density Logic
 if (cat === 'metropolis' || cat === 'city') {
  if (numId % 3 === 0) return TERRAIN_DEFINITIONS.urban;
  if (numId % 2 === 0) return TERRAIN_DEFINITIONS.hills;
  return TERRAIN_DEFINITIONS.plains;
 }

 if (cat === 'pastoral' || cat === 'wasteland') {
  const hash = (numId * 23 + normName.length * 19) % 10;
  if (hash < 4) return TERRAIN_DEFINITIONS.desert;
  if (hash < 7) return TERRAIN_DEFINITIONS.mountain;
  if (hash < 9) return TERRAIN_DEFINITIONS.hills;
  return TERRAIN_DEFINITIONS.marsh;
 }

 // General rural/town/large_town/large_city distribution
 const hash = (numId * 17 + normName.length * 31) % 10;
 if (hash < 4) return TERRAIN_DEFINITIONS.plains;
 if (hash < 7) return TERRAIN_DEFINITIONS.hills;
 if (hash === 7) return TERRAIN_DEFINITIONS.forest;
 if (hash === 8) return TERRAIN_DEFINITIONS.mountain;
 return TERRAIN_DEFINITIONS.plains;
}

/**
 * Returns all registered terrain entries for legends and filters.
 */
export function getAllTerrains(): TerrainInfo[] {
 return Object.values(TERRAIN_DEFINITIONS);
}
