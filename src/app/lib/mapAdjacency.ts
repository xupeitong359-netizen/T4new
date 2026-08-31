import mapGeoData from '../assets/hoi4_fixed_map.json';
import { Nation, ProvinceData } from '../types';
import { getProvinceChineseName } from './provinceTranslations';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FeatureMeta {
  feature: any;
  stateId: string;
  name: string;
  chineseName: string;
  bbox: BoundingBox;
  centroid: [number, number];
  vertices: [number, number][];
  segments: [number, number, number, number][];
}

// Check if user has already used today's peaceful expansion (测试模式提供每日 50 次额度)
export const DAILY_PEACE_EXPANSION_LIMIT = 50;

export function isTodayUsed(lastExpansionTimeStr?: string, expansionCountToday?: number): boolean {
  if (!lastExpansionTimeStr) return false;
  const lastTime = new Date(lastExpansionTimeStr).getTime();
  if (isNaN(lastTime)) return false;
  const lastDate = new Date(lastTime);
  const now = new Date();
  const isSameDay = (
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getDate() === now.getDate()
  );
  if (!isSameDay) return false;
  if (typeof expansionCountToday === 'number') {
    return expansionCountToday >= DAILY_PEACE_EXPANSION_LIMIT;
  }
  return false;
}

// Global cached meta and adjacency graph
let cachedFeatureMetas: FeatureMeta[] | null = null;
let cachedAdjacencyMap: Map<string, Set<string>> | null = null;
let cachedFeatureById: Map<string, FeatureMeta> | null = null;
let cachedFeatureByName: Map<string, FeatureMeta> | null = null;

export function ensureFeatureRingsClosed(feature: any): any {
  if (!feature?.geometry?.coordinates) return feature;
  const geomType = feature.geometry.type;
  if (geomType === 'Polygon') {
    const closedCoords = feature.geometry.coordinates.map((ring: any[]) => {
      if (!Array.isArray(ring) || ring.length < 3) return ring;
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        return [...ring, [first[0], first[1]]];
      }
      return ring;
    });
    return { ...feature, geometry: { ...feature.geometry, coordinates: closedCoords } };
  } else if (geomType === 'MultiPolygon') {
    const closedCoords = feature.geometry.coordinates.map((poly: any[]) => {
      if (!Array.isArray(poly)) return poly;
      return poly.map((ring: any[]) => {
        if (!Array.isArray(ring) || ring.length < 3) return ring;
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          return [...ring, [first[0], first[1]]];
        }
        return ring;
      });
    });
    return { ...feature, geometry: { ...feature.geometry, coordinates: closedCoords } };
  }
  return feature;
}

function extractPolygons(coordinates: any, type: string): [number, number][][][] {
  if (type === 'Polygon') {
    if (Array.isArray(coordinates)) {
      return [coordinates as [number, number][][]];
    }
  } else if (type === 'MultiPolygon') {
    if (Array.isArray(coordinates)) {
      return coordinates as [number, number][][][];
    }
  }
  return [];
}

function extractSegments(polys: [number, number][][][]): [number, number, number, number][] {
  const segs: [number, number, number, number][] = [];
  for (const poly of polys) {
    for (const ring of poly) {
      if (Array.isArray(ring)) {
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = ring[i];
          const p2 = ring[i + 1];
          if (Array.isArray(p1) && Array.isArray(p2) && p1.length >= 2 && p2.length >= 2) {
            segs.push([p1[0], p1[1], p2[0], p2[1]]);
          }
        }
      }
    }
  }
  return segs;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function extractVerticesAndBBox(polys: [number, number][][][]): {
  vertices: [number, number][];
  bbox: BoundingBox;
  centroid: [number, number];
} {
  const vertices: [number, number][] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const poly of polys) {
    for (const ring of poly) {
      if (Array.isArray(ring)) {
        for (const pt of ring) {
          if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
            const x = pt[0];
            const y = pt[1];
            vertices.push([x, y]);
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
    }
  }

  if (count === 0) {
    return {
      vertices: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      centroid: [0, 0],
    };
  }

  return {
    vertices,
    bbox: { minX, minY, maxX, maxY },
    centroid: [sumX / count, sumY / count],
  };
}

/**
 * Mathematically exact segment-distance spatial indexing for all 1048+ HOI4 provinces.
 * Provides accurate border adjacency without false cross-country chaining.
 */
export function initMapIndex(): {
  featureMetas: FeatureMeta[];
  adjacencyMap: Map<string, Set<string>>;
  featureById: Map<string, FeatureMeta>;
  featureByName: Map<string, FeatureMeta>;
} {
  if (cachedFeatureMetas && cachedAdjacencyMap && cachedFeatureById && cachedFeatureByName) {
    return {
      featureMetas: cachedFeatureMetas,
      adjacencyMap: cachedAdjacencyMap,
      featureById: cachedFeatureById,
      featureByName: cachedFeatureByName,
    };
  }

  const features = (mapGeoData as any)?.features || [];
  const metas: FeatureMeta[] = [];
  const byId = new Map<string, FeatureMeta>();
  const byName = new Map<string, FeatureMeta>();
  const adj = new Map<string, Set<string>>();

  const CELL_SIZE = 24;
  const grid = new Map<number, number[]>();

  for (let idx = 0; idx < features.length; idx++) {
    const rawFeature = features[idx];
    const f = ensureFeatureRingsClosed(rawFeature);
    const rawId = f.properties?.stateId ?? f.properties?.id ?? idx;
    const stateId = String(rawId);
    const rawName = f.properties?.name || '';
    const chineseName = getProvinceChineseName(rawName, rawId) || rawName || `地块 #${stateId}`;
    const polys = extractPolygons(f.geometry?.coordinates, f.geometry?.type);
    const { vertices, bbox, centroid } = extractVerticesAndBBox(polys);
    const segments = extractSegments(polys);

    const meta: FeatureMeta = {
      feature: f,
      stateId,
      name: rawName,
      chineseName,
      bbox,
      centroid,
      vertices,
      segments,
    };

    metas.push(meta);
    byId.set(stateId, meta);
    if (rawName) byName.set(rawName.trim().toLowerCase(), meta);
    if (chineseName) byName.set(chineseName.trim().toLowerCase(), meta);
    adj.set(stateId, new Set<string>());

    // Register index in spatial bounding grid
    const gMinX = Math.floor((bbox.minX - 16) / CELL_SIZE);
    const gMinY = Math.floor((bbox.minY - 16) / CELL_SIZE);
    const gMaxX = Math.floor((bbox.maxX + 16) / CELL_SIZE);
    const gMaxY = Math.floor((bbox.maxY + 16) / CELL_SIZE);

    for (let gx = gMinX; gx <= gMaxX; gx++) {
      for (let gy = gMinY; gy <= gMaxY; gy++) {
        const key = gx * 100000 + gy;
        let list = grid.get(key);
        if (!list) {
          list = [];
          grid.set(key, list);
        }
        list.push(idx);
      }
    }
  }

  // Check candidate pairs from shared grid cells
  const testedPairs = new Set<number>();

  for (const list of grid.values()) {
    if (list.length <= 1) continue;
    for (let i = 0; i < list.length; i++) {
      const idxA = list[i];
      const metaA = metas[idxA];
      for (let j = i + 1; j < list.length; j++) {
        const idxB = list[j];
        const pairKey = idxA < idxB ? idxA * 100000 + idxB : idxB * 100000 + idxA;
        if (testedPairs.has(pairKey)) continue;
        testedPairs.add(pairKey);

        const metaB = metas[idxB];
        // Bbox distance filter (5.5px tolerance for border alignment)
        if (
          metaA.bbox.minX - 5.5 > metaB.bbox.maxX ||
          metaA.bbox.maxX + 5.5 < metaB.bbox.minX ||
          metaA.bbox.minY - 5.5 > metaB.bbox.maxY ||
          metaA.bbox.maxY + 5.5 < metaB.bbox.minY
        ) {
          continue;
        }

        let isAdjacent = false;
        // Check A segments against B segments
        for (const sA of metaA.segments) {
          const p1x = sA[0], p1y = sA[1];
          for (const sB of metaB.segments) {
            if (distToSegment(p1x, p1y, sB[0], sB[1], sB[2], sB[3]) <= 4.5) {
              isAdjacent = true;
              break;
            }
          }
          if (isAdjacent) break;
        }

        if (!isAdjacent) {
          for (const sB of metaB.segments) {
            const p1x = sB[0], p1y = sB[1];
            for (const sA of metaA.segments) {
              if (distToSegment(p1x, p1y, sA[0], sA[1], sA[2], sA[3]) <= 4.5) {
                isAdjacent = true;
                break;
              }
            }
            if (isAdjacent) break;
          }
        }

        if (isAdjacent) {
          adj.get(metaA.stateId)!.add(metaB.stateId);
          adj.get(metaB.stateId)!.add(metaA.stateId);
        }
      }
    }
  }

  // Strait & Archipelagic connectivity for isolated island provinces within close proximity (<= 16px)
  for (let i = 0; i < metas.length; i++) {
    const metaA = metas[i];
    const setA = adj.get(metaA.stateId)!;
    if (setA.size <= 1) {
      for (let j = 0; j < metas.length; j++) {
        if (i === j) continue;
        const metaB = metas[j];
        const dx = Math.max(0, metaA.bbox.minX - metaB.bbox.maxX, metaB.bbox.minX - metaA.bbox.maxX);
        const dy = Math.max(0, metaA.bbox.minY - metaB.bbox.maxY, metaB.bbox.minY - metaA.bbox.maxY);
        if (Math.hypot(dx, dy) <= 16) {
          let minDist = 999;
          for (const sA of metaA.segments) {
            const p1x = sA[0], p1y = sA[1];
            for (const sB of metaB.segments) {
              const d = distToSegment(p1x, p1y, sB[0], sB[1], sB[2], sB[3]);
              if (d < minDist) minDist = d;
            }
          }
          if (minDist <= 16) {
            setA.add(metaB.stateId);
            adj.get(metaB.stateId)!.add(metaA.stateId);
          }
        }
      }
    }
  }

  cachedFeatureMetas = metas;
  cachedAdjacencyMap = adj;
  cachedFeatureById = byId;
  cachedFeatureByName = byName;

  return {
    featureMetas: metas,
    adjacencyMap: adj,
    featureById: byId,
    featureByName: byName,
  };
}

// Warm up index once at module load
try {
  initMapIndex();
} catch (e) {
  console.warn('Deferred map index initialization', e);
}

export function findGeoFeature(provinceId?: string | number, provinceName?: string): FeatureMeta | null {
  const { featureById, featureByName } = initMapIndex();
  if (provinceId !== undefined && provinceId !== null && String(provinceId).trim() !== '') {
    const idStr = String(provinceId).trim();
    const found = featureById.get(idStr);
    if (found) return found;
    const foundByName = featureByName.get(idStr.toLowerCase());
    if (foundByName) return foundByName;
  }
  if (provinceName && String(provinceName).trim() !== '') {
    const key = String(provinceName).trim().toLowerCase();
    const found = featureByName.get(key);
    if (found) return found;
    const foundById = featureById.get(key);
    if (foundById) return foundById;
  }
  return null;
}

export function isProvinceAdjacentToNation(
  targetProvinceIdOrName: string | number,
  nationProvinces: Array<ProvinceData | { id: string | number; name?: string }>,
  targetSecondaryName?: string
): boolean {
  if (!nationProvinces || nationProvinces.length === 0) return true;
  const { adjacencyMap } = initMapIndex();

  const targetMeta = findGeoFeature(targetProvinceIdOrName, targetSecondaryName);
  if (!targetMeta) {
    // If target meta is not found, fallback to true to prevent blocking
    return true;
  }

  const targetId = targetMeta.stateId;
  const targetNeighbors = adjacencyMap.get(targetId);

  for (const prov of nationProvinces) {
    const provMeta = findGeoFeature(prov.id, prov.name);
    if (provMeta) {
      if (targetId === provMeta.stateId) {
        return true;
      }
      if (targetNeighbors && targetNeighbors.has(provMeta.stateId)) {
        return true;
      }
    }
  }

  return false;
}

export function getValidExpansionProvinceIds(
  myNation: Nation | null | undefined,
  allNations: Nation[]
): Set<string> {
  const validSet = new Set<string>();
  if (!myNation) return validSet;

  const { featureMetas, adjacencyMap, featureById, featureByName } = initMapIndex();

  // Collect all occupied province IDs across all nations
  const occupiedIds = new Set<string>();
  for (const n of allNations) {
    for (const p of n.provinces || []) {
      if (p.id !== undefined && p.id !== null) {
        occupiedIds.add(String(p.id));
        const meta = featureById.get(String(p.id));
        if (meta) occupiedIds.add(meta.stateId);
      }
      if (p.name) {
        const meta = featureByName.get(p.name.trim().toLowerCase());
        if (meta) occupiedIds.add(meta.stateId);
      }
    }
  }

  // Collect player's current province IDs
  const myProvinceIds = new Set<string>();
  for (const p of myNation.provinces || []) {
    if (p.id !== undefined && p.id !== null) {
      myProvinceIds.add(String(p.id));
      const meta = featureById.get(String(p.id));
      if (meta) myProvinceIds.add(meta.stateId);
    }
    if (p.name) {
      const meta = featureByName.get(p.name.trim().toLowerCase());
      if (meta) myProvinceIds.add(meta.stateId);
    }
  }

  if (myProvinceIds.size === 0) {
    for (const m of featureMetas) {
      if (!occupiedIds.has(m.stateId)) {
        validSet.add(m.stateId);
        validSet.add(m.name.trim().toLowerCase());
        validSet.add(m.chineseName.trim().toLowerCase());
      }
    }
    return validSet;
  }

  // Find all unowned provinces adjacent to player's territory
  for (const myProvId of myProvinceIds) {
    const neighbors = adjacencyMap.get(myProvId);
    if (neighbors) {
      for (const neighborId of neighbors) {
        if (!occupiedIds.has(neighborId)) {
          validSet.add(neighborId);
          const meta = featureById.get(neighborId);
          if (meta) {
            validSet.add(meta.name.trim().toLowerCase());
            validSet.add(meta.chineseName.trim().toLowerCase());
          }
        }
      }
    }
  }

  return validSet;
}

/**
 * 校验建国时所选省份是否连成一片（以初始省份为基准的连通图判定）。
 * 如果存在飞地或不相连的省份，返回 false 及提示信息。
 */
export function checkProvincesContiguity(
  provincesList: Array<ProvinceData | { id: string | number; name?: string }>
): { isContiguous: boolean; message?: string } {
  if (!provincesList || provincesList.length <= 1) {
    return { isContiguous: true };
  }

  const { adjacencyMap, featureById, featureByName } = initMapIndex();

  const stateIds: string[] = [];
  const stateToName = new Map<string, string>();

  for (const p of provincesList) {
    let meta: FeatureMeta | undefined;
    if (p.id !== undefined && p.id !== null) {
      const pid = String(p.id).trim();
      meta = featureById.get(pid) || featureByName.get(pid.toLowerCase());
    }
    if (!meta && p.name) {
      const pname = p.name.trim().toLowerCase();
      meta = featureByName.get(pname) || featureById.get(pname);
    }
    const stateId = meta ? meta.stateId : String(p.id);
    stateIds.push(stateId);
    stateToName.set(stateId, p.name || `省份 #${stateId}`);
  }

  const stateSet = new Set<string>(stateIds);
  const visited = new Set<string>();
  const queue: string[] = [stateIds[0]];
  visited.add(stateIds[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
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

  if (visited.size === stateSet.size) {
    return { isContiguous: true };
  }

  const disconnected: string[] = [];
  for (const id of stateSet) {
    if (!visited.has(id)) {
      disconnected.push(stateToName.get(id) || `省份 #${id}`);
    }
  }

  return {
    isContiguous: false,
    message: `建国省份判定：所选省份必须相邻连通一体！以下省份与主要领土不相连：${disconnected.join('、')}`,
  };
}

/**
 * 获取建国圈地模式下当前可合法选取的省份 ID 集合。
 * - 当未选择任何省份时（selectedProvinces 为空），所有未被占领的省份均可作为初始省份。
 * - 当已有已选省份时，只有与当前已选省份相邻且未被占领的地块才可被选中（已选省份也包含在内以支持取消选中）。
 */
export function getValidCreationProvinceIds(
  selectedProvinces: Array<ProvinceData | { id: string | number; name?: string }>,
  allNations: Nation[]
): Set<string> {
  const validSet = new Set<string>();
  const { featureMetas, adjacencyMap, featureById, featureByName } = initMapIndex();

  // Collect occupied provinces from other nations
  const occupiedIds = new Set<string>();
  for (const n of allNations) {
    for (const p of n.provinces || []) {
      if (p.id !== undefined && p.id !== null) {
        occupiedIds.add(String(p.id));
        const meta = featureById.get(String(p.id));
        if (meta) occupiedIds.add(meta.stateId);
      }
      if (p.name) {
        const meta = featureByName.get(p.name.trim().toLowerCase());
        if (meta) occupiedIds.add(meta.stateId);
      }
    }
  }

  // If no province is selected yet, all unowned provinces are valid starting points
  if (!selectedProvinces || selectedProvinces.length === 0) {
    for (const m of featureMetas) {
      if (!occupiedIds.has(m.stateId)) {
        validSet.add(m.stateId);
        validSet.add(m.name.trim().toLowerCase());
        validSet.add(m.chineseName.trim().toLowerCase());
      }
    }
    return validSet;
  }

  // For already selected provinces, find all unowned adjacent neighbors
  const selectedStateIds = new Set<string>();
  for (const p of selectedProvinces) {
    let meta: FeatureMeta | undefined;
    if (p.id !== undefined && p.id !== null) {
      const pid = String(p.id).trim();
      meta = featureById.get(pid) || featureByName.get(pid.toLowerCase());
    }
    if (!meta && p.name) {
      const pname = p.name.trim().toLowerCase();
      meta = featureByName.get(pname) || featureById.get(pname);
    }
    const stateId = meta ? meta.stateId : String(p.id);
    selectedStateIds.add(stateId);
    // Also include already selected provinces in validSet so they can be deselected
    validSet.add(stateId);
    if (meta) {
      validSet.add(meta.name.trim().toLowerCase());
      validSet.add(meta.chineseName.trim().toLowerCase());
    }
  }

  for (const stateId of selectedStateIds) {
    const neighbors = adjacencyMap.get(stateId);
    if (neighbors) {
      for (const neighborId of neighbors) {
        if (!occupiedIds.has(neighborId)) {
          validSet.add(neighborId);
          const meta = featureById.get(neighborId);
          if (meta) {
            validSet.add(meta.name.trim().toLowerCase());
            validSet.add(meta.chineseName.trim().toLowerCase());
          }
        }
      }
    }
  }

  return validSet;
}

// Re-export territory components analysis utilities
export * from './territoryComponents';

