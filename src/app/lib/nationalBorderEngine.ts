import { Nation } from '../types';

export type PixelPoint = [number, number];

export interface NationalBorderData {
  nationId: string;
  flagColor: string;
  /** 合并后的国家外边界连续 SVG Path 字符串列表 (一条或多条闭合环) */
  outerBorderPathD: string;
  /** 内侧晕染渐变裁剪用的整个领土聚合 Path 字符串 */
  territoryPathD: string;
}

/**
 * 坐标量化，消除微小浮点误差，确保共享边界顶点的精准匹配
 */
function quantizeCoord(coord: number, precision = 10): number {
  return Math.round(coord * precision) / precision;
}

function pointKey(p: PixelPoint, precision = 10): string {
  return `${quantizeCoord(p[0], precision)},${quantizeCoord(p[1], precision)}`;
}

function parsePointKey(key: string): PixelPoint {
  const parts = key.split(',');
  return [parseFloat(parts[0]), parseFloat(parts[1])];
}

interface SegmentEdge {
  p1: PixelPoint;
  p2: PixelPoint;
  p1Key: string;
  p2Key: string;
}

/**
 * 从 GeoJSON feature 中提取投影后的二维环形坐标点序列
 */
function extractRingsFromFeature(feature: any, projection: any): PixelPoint[][] {
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) return [];
  const rings: PixelPoint[][] = [];

  const processRings = (polyCoords: any[]) => {
    if (!Array.isArray(polyCoords)) return;
    polyCoords.forEach((ringCoords: any[]) => {
      if (!Array.isArray(ringCoords) || ringCoords.length < 3) return;
      const ring: PixelPoint[] = [];
      for (const coord of ringCoords) {
        const pt = projection(coord);
        if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
          ring.push([pt[0], pt[1]]);
        }
      }
      if (ring.length >= 3) {
        rings.push(ring);
      }
    });
  };

  if (geometry.type === 'Polygon') {
    processRings(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly: any[]) => processRings(poly));
  }

  return rings;
}

/**
 * 将散乱的无向外边线段连接闭合为顺畅的 SVG Path 字符串 (M ... L ... Z)
 */
function assembleSegmentsToSvgPaths(edges: SegmentEdge[]): string {
  if (edges.length === 0) return '';

  // 构建邻接表: pointKey -> list of { nextKey, edge }
  const adj = new Map<string, { toKey: string; edge: SegmentEdge }[]>();
  const addAdj = (fromKey: string, toKey: string, edge: SegmentEdge) => {
    let list = adj.get(fromKey);
    if (!list) {
      list = [];
      adj.set(fromKey, list);
    }
    list.push({ toKey, edge });
  };

  edges.forEach((edge) => {
    addAdj(edge.p1Key, edge.p2Key, edge);
    addAdj(edge.p2Key, edge.p1Key, edge);
  });

  const visitedEdges = new Set<SegmentEdge>();
  const pathStrings: string[] = [];

  for (const startEdge of edges) {
    if (visitedEdges.has(startEdge)) continue;

    const chain: PixelPoint[] = [startEdge.p1, startEdge.p2];
    visitedEdges.add(startEdge);

    let currentKey = startEdge.p2Key;
    let prevKey = startEdge.p1Key;

    // 向前追踪
    while (true) {
      const neighbors = adj.get(currentKey) || [];
      let foundNext = false;
      for (const item of neighbors) {
        if (!visitedEdges.has(item.edge)) {
          visitedEdges.add(item.edge);
          const nextPt = item.toKey === currentKey ? item.edge.p1 : parsePointKey(item.toKey);
          chain.push(nextPt);
          prevKey = currentKey;
          currentKey = item.toKey;
          foundNext = true;
          break;
        }
      }
      if (!foundNext || currentKey === startEdge.p1Key) {
        break;
      }
    }

    if (chain.length >= 2) {
      let d = `M ${chain[0][0].toFixed(2)} ${chain[0][1].toFixed(2)}`;
      for (let i = 1; i < chain.length; i++) {
        d += ` L ${chain[i][0].toFixed(2)} ${chain[i][1].toFixed(2)}`;
      }
      // 如果首尾距离很近，闭合环
      const first = chain[0];
      const last = chain[chain.length - 1];
      if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 4) {
        d += ' Z';
      }
      pathStrings.push(d);
    }
  }

  return pathStrings.join(' ');
}

// 缓存计算结果，在领土未变更时瞬间复用
const bordersCache = new Map<string, NationalBorderData[]>();

/**
 * 高性能计算所有国家的《钢铁雄心4》风格立体外边界拓扑网格
 */
export function computeNationalBorders(
  nations: Nation[],
  precalculatedFeatures: Array<{
    feature: any;
    stateId: any;
    name: string;
    pathD: string;
  }>,
  provinceOwnership: Map<number | string, Nation>,
  projection: any
): NationalBorderData[] {
  if (!nations || nations.length === 0 || !precalculatedFeatures || precalculatedFeatures.length === 0) {
    return [];
  }

  // 生成指纹缓存 Key
  const cacheKey = nations
    .map((n) => `${n.id}:${(n.provinces || []).map((p) => p.id || p.name).sort().join(',')}`)
    .sort()
    .join('|');

  if (bordersCache.has(cacheKey)) {
    return bordersCache.get(cacheKey)!;
  }

  // 1. 将省份按国家归类
  const provincesByNation = new Map<string, typeof precalculatedFeatures>();
  precalculatedFeatures.forEach((feat) => {
    const owner = provinceOwnership.get(feat.stateId) || provinceOwnership.get(feat.name);
    if (owner) {
      let list = provincesByNation.get(owner.id);
      if (!list) {
        list = [];
        provincesByNation.set(owner.id, list);
      }
      list.push(feat);
    }
  });

  const results: NationalBorderData[] = [];

  nations.forEach((nation) => {
    const provs = provincesByNation.get(nation.id);
    if (!provs || provs.length === 0) return;

    // 整个领土的所有省份 pathD 拼接（用于内侧晕染裁切或底衬）
    const territoryPathD = provs.map((p) => p.pathD).filter(Boolean).join(' ');

    // 2. 提取该国所有省份的投影坐标多边形线段
    // 统计每条线段出现的频次：若出现 2 次（被两个本国内部省份共享），则是内部省界；若出现 1 次，则是国家外边界！
    const edgeCounts = new Map<string, { count: number; edge: SegmentEdge }>();

    provs.forEach((prov) => {
      const rings = extractRingsFromFeature(prov.feature, projection);
      rings.forEach((ring) => {
        const n = ring.length;
        for (let i = 0; i < n; i++) {
          const p1 = ring[i];
          const p2 = ring[(i + 1) % n];
          const k1 = pointKey(p1);
          const k2 = pointKey(p2);
          if (k1 === k2) continue;

          // 规范化无向边 Key
          const normKey = k1 < k2 ? `${k1}___${k2}` : `${k2}___${k1}`;
          const existing = edgeCounts.get(normKey);
          if (existing) {
            existing.count += 1;
          } else {
            edgeCounts.set(normKey, {
              count: 1,
              edge: {
                p1,
                p2,
                p1Key: k1,
                p2Key: k2,
              },
            });
          }
        }
      });
    });

    // 3. 筛选出现频次为 1 的外边线段 (国界外边缘)
    const outerEdges: SegmentEdge[] = [];
    edgeCounts.forEach(({ count, edge }) => {
      if (count === 1) {
        outerEdges.push(edge);
      }
    });

    // 4. 将外边线段连成闭合/平滑的外边界 Path 字符串
    const outerBorderPathD = assembleSegmentsToSvgPaths(outerEdges);

    results.push({
      nationId: nation.id,
      flagColor: nation.flagColor || '#6366f1',
      outerBorderPathD: outerBorderPathD || territoryPathD,
      territoryPathD,
    });
  });

  // 缓存最多 20 个态势
  if (bordersCache.size > 20) {
    bordersCache.clear();
  }
  bordersCache.set(cacheKey, results);

  return results;
}
