import mapGeoData from '../assets/hoi4_fixed_map.json';
import { Nation, ProvinceData } from '../types';
import { initMapIndex, findGeoFeature, FeatureMeta } from './mapAdjacency';
import { getProvinceChineseName } from './provinceTranslations';

/**
 * 领土区块内单个 State 的详细信息
 */
export interface TerritoryStateDetail {
  id: string;
  name: string;
  chineseName: string;
  manpower: number;
  population?: number;
  provinceCount: number;
  civilianFactories: number;
  militaryFactories: number;
  isCore?: boolean;
  owner?: string;
}

/**
 * 单个连续领土区块的详细信息
 */
export interface TerritoryComponentDetail {
  /** 区块索引编号 (0 通常为面积/省份数最大的主体领土) */
  index: number;
  /** 区块包含的 State ID 列表 */
  stateIds: string[];
  /** 区块包含的 State 数量 */
  stateCount: number;
  /** 是否为该国最大的核心主体陆块 (Mainland) */
  isMainland: boolean;
  /** 该区块内的 State 详情列表 */
  states: TerritoryStateDetail[];
  /** 聚合总人力 / 人口 */
  totalManpower: number;
  /** 聚合总民用工厂 */
  totalCivilianFactories: number;
  /** 聚合总军用工厂 */
  totalMilitaryFactories: number;
  /** 代表地名（通常取该区块内最大/首个省份名称） */
  representativeName: string;
}

/**
 * 国家领土连通性分析结果
 */
export interface TerritoryComponentsResult {
  /** 目标国家标识 (如 ISO 3字母代码 "ETH"、"GER"，或自定义国家 ID/名称) */
  countryId: string;
  /** 国家拥有的总 State 数量 */
  stateCount: number;
  /** 连通陆地区块总数 (1 表示全境陆地连通，>1 表示存在飞地、海外领地或海岛) */
  componentCount: number;
  /** 领土区块列表，每个元素为互相连通的 State ID 字符串数组 (按区块规模从大到小排序) */
  components: string[][];
  /** 是否全境陆地完全连通 (componentCount === 1) */
  isConnected: boolean;
  /** 最大核心主体领土区块包含的 State ID 列表 */
  largestComponent: string[];
  /** 最大主体领土区块在 components 列表中的索引 (默认为 0) */
  largestComponentIndex: number;
  /** 飞地 / 海外孤立领土区块列表 (即除最大主体区块外的所有次级陆块) */
  enclaves: string[][];
  /** 各领土区块的结构化详细指标 */
  componentDetails: TerritoryComponentDetail[];
}

/**
 * 领土分析选项参数
 */
export interface TerritoryAnalysisOptions {
  /** 运行时自定义国家数据列表 (优先从中匹配领土，实现与游戏运行态完美同步) */
  nations?: Nation[];
  /** 显式指定所属关系字典 Map<stateId, countryId> 或 Record<stateId, countryId> */
  customOwnerMap?: Map<string, string> | Record<string, string>;
  /** 是否允许通过近岸海峡/短距离跳板判定连通 (默认 false，即必须为严格陆地边界接触) */
  includeStraits?: boolean;
}

// 运行时 LRU 结果缓存
const componentsCache = new Map<string, TerritoryComponentsResult>();

/**
 * 清除领土连通性计算缓存（当游戏领土发生占领、割让或建国变更时调用）
 */
export function clearTerritoryComponentCache(): void {
  componentsCache.clear();
}

/**
 * 获取指定国家名下所有的 State ID 列表
 * 支持从 customOwnerMap、Nation[] 运行时数据或 GeoJSON 原始 properties.owner 解析
 */
export function getCountryStates(
  countryId: string,
  options?: TerritoryAnalysisOptions
): string[] {
  if (!countryId) return [];
  const normalizedTarget = countryId.trim().toLowerCase();
  const stateIdSet = new Set<string>();
  const { featureMetas, featureById, featureByName } = initMapIndex();

  // 1. 从 customOwnerMap 读取
  if (options?.customOwnerMap) {
    if (options.customOwnerMap instanceof Map) {
      for (const [sid, owner] of options.customOwnerMap.entries()) {
        if (owner && owner.trim().toLowerCase() === normalizedTarget) {
          stateIdSet.add(String(sid));
        }
      }
    } else if (typeof options.customOwnerMap === 'object') {
      for (const [sid, owner] of Object.entries(options.customOwnerMap)) {
        if (owner && String(owner).trim().toLowerCase() === normalizedTarget) {
          stateIdSet.add(String(sid));
        }
      }
    }
    if (stateIdSet.size > 0) {
      return Array.from(stateIdSet);
    }
  }

  // 2. 从 options.nations 读取 (游戏运行态)
  if (options?.nations && options.nations.length > 0) {
    const matchedNation = options.nations.find(
      (n) =>
        n.id === countryId ||
        n.id.toLowerCase() === normalizedTarget ||
        n.name.toLowerCase() === normalizedTarget ||
        n.ownerId.toLowerCase() === normalizedTarget
    );

    if (matchedNation && matchedNation.provinces) {
      for (const p of matchedNation.provinces) {
        const meta = findGeoFeature(p.id, p.name);
        if (meta) {
          stateIdSet.add(meta.stateId);
        } else if (p.id !== undefined && p.id !== null) {
          stateIdSet.add(String(p.id));
        }
      }
      if (stateIdSet.size > 0) {
        return Array.from(stateIdSet);
      }
    }
  }

  // 3. 从原始 GeoJSON features 的 properties.owner 读取
  const rawFeatures = (mapGeoData as any)?.features || [];
  for (const f of rawFeatures) {
    const props = f.properties || {};
    const owner = props.owner;
    const sid = String(props.stateId ?? props.id ?? '');
    if (owner && String(owner).trim().toLowerCase() === normalizedTarget && sid) {
      stateIdSet.add(sid);
    }
  }

  return Array.from(stateIdSet);
}

/**
 * 核心函数：计算指定国家的领土由多少个互相连通的陆地区块组成
 *
 * @param countryId 国家标识（如 "ETH"、"GER"、"ENG" 或自定义国家 ID）
 * @param options 可选配置（支持传入当前游戏内的 Nation[] 或指定海峡判定）
 * @returns TerritoryComponentsResult
 */
export function getCountryTerritoryComponents(
  countryId: string,
  options?: TerritoryAnalysisOptions
): TerritoryComponentsResult {
  if (!countryId) {
    return {
      countryId: '',
      stateCount: 0,
      componentCount: 0,
      components: [],
      isConnected: true,
      largestComponent: [],
      largestComponentIndex: -1,
      enclaves: [],
      componentDetails: [],
    };
  }

  const { adjacencyMap, featureById, featureByName } = initMapIndex();
  const states = getCountryStates(countryId, options);

  // 构造缓存 Key
  const cacheKey = `${countryId.trim().toUpperCase()}_${states.slice().sort().join(',')}_${Boolean(options?.includeStraits)}`;
  const cached = componentsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (states.length === 0) {
    const emptyResult: TerritoryComponentsResult = {
      countryId,
      stateCount: 0,
      componentCount: 0,
      components: [],
      isConnected: true,
      largestComponent: [],
      largestComponentIndex: -1,
      enclaves: [],
      componentDetails: [],
    };
    componentsCache.set(cacheKey, emptyResult);
    return emptyResult;
  }

  // 领土连通分量 (Connected Components) 图遍历算法
  const stateSet = new Set<string>(states);
  const visited = new Set<string>();
  const rawComponents: string[][] = [];

  for (const startState of states) {
    if (visited.has(startState)) continue;

    const component: string[] = [];
    const queue: string[] = [startState];
    visited.add(startState);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      const neighbors = adjacencyMap.get(current);
      if (neighbors) {
        for (const neighborId of neighbors) {
          if (stateSet.has(neighborId) && !visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        }
      }
    }

    rawComponents.push(component);
  }

  // 按照区块所含地块数量从多到少排序
  rawComponents.sort((a, b) => b.length - a.length);

  // 构建各个区块的详细指标
  const componentDetails: TerritoryComponentDetail[] = rawComponents.map((compStateIds, idx) => {
    let totalManpower = 0;
    let totalCiv = 0;
    let totalMil = 0;

    const stateDetails: TerritoryStateDetail[] = compStateIds.map((sid) => {
      const meta = featureById.get(sid);
      const props = meta?.feature?.properties || {};

      // 提取人口/人力
      const manpower = typeof props.manpower === 'number' ? props.manpower : 0;
      const provinceCount = Array.isArray(props.provinceIds) ? props.provinceIds.length : (props.provinceCount || 1);

      // 从游戏国家数据中查找工厂数与建筑状态 (若有)
      let civCount = 0;
      let milCount = 0;
      let isCore = false;

      if (options?.nations) {
        for (const n of options.nations) {
          const prov = n.provinces?.find((p) => String(p.id) === sid || p.name === meta?.name || p.name === meta?.chineseName);
          if (prov) {
            civCount = prov.civilianFactories || 0;
            milCount = prov.militaryFactories || 0;
            isCore = Boolean(prov.isCore);
            break;
          }
        }
      }

      totalManpower += manpower;
      totalCiv += civCount;
      totalMil += milCount;

      return {
        id: sid,
        name: meta?.name || props.name || `State ${sid}`,
        chineseName: meta?.chineseName || getProvinceChineseName(meta?.name || props.name, sid) || `地块 #${sid}`,
        manpower,
        provinceCount,
        civilianFactories: civCount,
        militaryFactories: milCount,
        isCore,
        owner: props.owner || countryId,
      };
    });

    const representativeName = stateDetails[0]?.chineseName || stateDetails[0]?.name || `领土区块 ${idx + 1}`;

    return {
      index: idx,
      stateIds: compStateIds,
      stateCount: compStateIds.length,
      isMainland: idx === 0,
      states: stateDetails,
      totalManpower,
      totalCivilianFactories: totalCiv,
      totalMilitaryFactories: totalMil,
      representativeName,
    };
  });

  const largestComponent = rawComponents.length > 0 ? rawComponents[0] : [];
  const enclaves = rawComponents.slice(1);

  const result: TerritoryComponentsResult = {
    countryId,
    stateCount: states.length,
    componentCount: rawComponents.length,
    components: rawComponents,
    isConnected: rawComponents.length <= 1,
    largestComponent,
    largestComponentIndex: rawComponents.length > 0 ? 0 : -1,
    enclaves,
    componentDetails,
  };

  componentsCache.set(cacheKey, result);
  return result;
}

/**
 * 获取指定国家的最大连续领土区块 (Mainland Territory)
 */
export function getLargestTerritoryComponent(
  countryId: string,
  options?: TerritoryAnalysisOptions
): string[] {
  const result = getCountryTerritoryComponents(countryId, options);
  return result.largestComponent;
}

/**
 * 获取指定国家的全部飞地 / 海外领土区块 (Exclaves / Overseas Territories)
 */
export function getCountryEnclaves(
  countryId: string,
  options?: TerritoryAnalysisOptions
): string[][] {
  const result = getCountryTerritoryComponents(countryId, options);
  return result.enclaves;
}

/**
 * 判断指定 State 是否属于指定国家，且是否连接到该国的主体核心领土（或指定目标 State）
 */
export function isStateConnectedToCountry(
  stateId: string | number,
  countryId: string,
  options?: TerritoryAnalysisOptions & { targetStateId?: string | number }
): boolean {
  if (stateId === undefined || stateId === null) return false;
  const sid = String(stateId).trim();
  const result = getCountryTerritoryComponents(countryId, options);

  if (result.componentCount === 0) return false;

  // 如果指定了 targetStateId，检查是否处于同一连通块
  if (options?.targetStateId !== undefined && options?.targetStateId !== null) {
    const targetSid = String(options.targetStateId).trim();
    for (const comp of result.components) {
      if (comp.includes(sid) && comp.includes(targetSid)) {
        return true;
      }
    }
    return false;
  }

  // 默认检查是否属于最大主体领土
  return result.largestComponent.includes(sid);
}

/**
 * 判断两个 State 是否在指定国家的同一连通领土区块内（可通过连续陆地领土互相到达）
 */
export function areStatesInSameComponent(
  stateIdA: string | number,
  stateIdB: string | number,
  countryId?: string,
  options?: TerritoryAnalysisOptions
): boolean {
  if (stateIdA === undefined || stateIdB === undefined) return false;
  const sidA = String(stateIdA).trim();
  const sidB = String(stateIdB).trim();
  if (sidA === sidB) return true;

  if (countryId) {
    const result = getCountryTerritoryComponents(countryId, options);
    for (const comp of result.components) {
      if (comp.includes(sidA) && comp.includes(sidB)) {
        return true;
      }
    }
    return false;
  }

  // 若未指定 countryId，自动从 State 所属国家推断
  const { featureById } = initMapIndex();
  const metaA = featureById.get(sidA);
  const ownerA = metaA?.feature?.properties?.owner;
  if (!ownerA) return false;

  const result = getCountryTerritoryComponents(ownerA, options);
  for (const comp of result.components) {
    if (comp.includes(sidA) && comp.includes(sidB)) {
      return true;
    }
  }
  return false;
}

/**
 * 查询指定 State 在国家领土中的区块归属信息
 */
export function getStateComponentInfo(
  stateId: string | number,
  countryId?: string,
  options?: TerritoryAnalysisOptions
): { componentIndex: number; isMainland: boolean; componentStateIds: string[]; totalComponents: number } | null {
  if (stateId === undefined || stateId === null) return null;
  const sid = String(stateId).trim();

  let targetCountry = countryId;
  if (!targetCountry) {
    const { featureById } = initMapIndex();
    const meta = featureById.get(sid);
    targetCountry = meta?.feature?.properties?.owner;
  }
  if (!targetCountry) return null;

  const result = getCountryTerritoryComponents(targetCountry, options);
  for (let idx = 0; idx < result.components.length; idx++) {
    const comp = result.components[idx];
    if (comp.includes(sid)) {
      return {
        componentIndex: idx,
        isMainland: idx === 0,
        componentStateIds: comp,
        totalComponents: result.componentCount,
      };
    }
  }

  return null;
}

/**
 * 快速获取某个 State 在预计算拓扑图中的直接相邻邻居 State ID 列表
 */
export function getStateNeighbors(stateId: string | number): string[] {
  if (stateId === undefined || stateId === null) return [];
  const { adjacencyMap } = initMapIndex();
  const sid = String(stateId).trim();
  const neighbors = adjacencyMap.get(sid);
  return neighbors ? Array.from(neighbors) : [];
}

/**
 * 快速判断两个 State 是否共享陆地边界（是否物理相邻）
 */
export function checkTerritoryAdjacency(
  stateIdA: string | number,
  stateIdB: string | number
): boolean {
  if (stateIdA === undefined || stateIdB === undefined) return false;
  const sidA = String(stateIdA).trim();
  const sidB = String(stateIdB).trim();
  if (sidA === sidB) return true;

  const { adjacencyMap } = initMapIndex();
  const neighbors = adjacencyMap.get(sidA);
  return Boolean(neighbors && neighbors.has(sidB));
}

/**
 * 批量计算并获取所有国家的领土连通性指标字典
 */
export function getAllNationsTerritoryComponents(
  options?: TerritoryAnalysisOptions
): Map<string, TerritoryComponentsResult> {
  const results = new Map<string, TerritoryComponentsResult>();
  const rawFeatures = (mapGeoData as any)?.features || [];
  const owners = new Set<string>();

  // 收集所有 GeoJSON 国家代码
  for (const f of rawFeatures) {
    const owner = f.properties?.owner;
    if (owner) owners.add(String(owner));
  }

  // 收集自定义国家
  if (options?.nations) {
    for (const n of options.nations) {
      if (n.id) owners.add(n.id);
      if (n.name) owners.add(n.name);
    }
  }

  for (const owner of owners) {
    const res = getCountryTerritoryComponents(owner, options);
    results.set(owner, res);
  }

  return results;
}
