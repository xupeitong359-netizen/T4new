import { Nation } from '../types';

export type PixelPoint = [number, number];

export interface NationLabelSpine {
  nationId: string;
  nationName: string;
  flagColor: string;
  totalArea: number;
  mainLandmassArea: number;
  center: PixelPoint;
  clearance: number;
  spinePoints: PixelPoint[];
  pathD: string;
  curveLength: number;
  curvature: number; // Max deviation from chord / chord length
  aspectRatio: number;
  dominantAngleDeg: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  territoryHash: string;
}

export interface RenderableCountryLabel {
  nation: Nation;
  pathId: string;
  pathD: string;
  displayText: string;
  center: PixelPoint;
  fontSize: number;
  letterSpacing: number;
  opacity: number;
  curveLength: number;
  curvature: number;
}

/**
 * Checks if a 2D point is inside a polygon ring using ray-casting.
 */
export function isPointInRing(point: PixelPoint, ring: PixelPoint[]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Calculates Euclidean distance from a point to a 2D line segment.
 */
export function distanceToSegment(point: PixelPoint, a: PixelPoint, b: PixelPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy || 0.000001;
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSq));
  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.hypot(point[0] - projX, point[1] - projY);
}

export interface PolygonRings {
  exterior: PixelPoint[];
  holes: PixelPoint[][];
}

/**
 * Extracts projected 2D rings from GeoJSON feature geometry, preserving polygon structures.
 */
export function extractProjectedPolygons(feature: any, projection: any): PolygonRings[] {
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) return [];
  const polygons: PolygonRings[] = [];

  const processPolygon = (polyCoords: any[]) => {
    if (!polyCoords.length) return;
    const rings = polyCoords.map(ringCoords => 
      ringCoords.map((coord: any) => projection(coord)).filter(Boolean) as PixelPoint[]
    ).filter(ring => ring.length >= 3);
    
    if (rings.length > 0) {
      polygons.push({
        exterior: rings[0],
        holes: rings.slice(1)
      });
    }
  };

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(processPolygon);
  }

  return polygons;
}

/**
 * Calculates minimum distance from a point to any boundary segment in the polygons.
 */
export function distanceToPolygons(point: PixelPoint, polygons: PolygonRings[]): number {
  let minDist = Infinity;
  for (let p = 0; p < polygons.length; p++) {
    const poly = polygons[p];
    const allRings = [poly.exterior, ...poly.holes];
    for (let r = 0; r < allRings.length; r++) {
      const ring = allRings[r];
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % n];
        const d = distanceToSegment(point, p1, p2);
        if (d < minDist) minDist = d;
      }
    }
  }
  return minDist;
}

/**
 * Checks if a point is inside a collection of polygons.
 */
export function isPointInPolygons(pt: PixelPoint, polygons: PolygonRings[]): boolean {
  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    if (isPointInRing(pt, poly.exterior)) {
      let inHole = false;
      for (let j = 0; j < poly.holes.length; j++) {
        if (isPointInRing(pt, poly.holes[j])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/**
 * Calculates Pole of Inaccessibility (PIA) approximation for the central anchor.
 */
export function calculatePoleOfInaccessibility(
  polygons: PolygonRings[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  initialCentroid?: PixelPoint | null
): { point: PixelPoint; clearance: number } {
  if (!polygons.length) {
    const fallback: PixelPoint = initialCentroid || [
      bounds.minX + bounds.width / 2,
      bounds.minY + bounds.height / 2,
    ];
    return { point: fallback, clearance: 0 };
  }

  const isInside = (pt: PixelPoint) => isPointInPolygons(pt, polygons);

  let bestPoint: PixelPoint = initialCentroid && isInside(initialCentroid)
    ? initialCentroid
    : [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
  let bestClearance = isInside(bestPoint) ? distanceToPolygons(bestPoint, polygons) : -Infinity;

  const steps = [
    { rows: 5, cols: 7 },
    { rows: 9, cols: 11 },
  ];

  for (let s = 0; s < steps.length; s++) {
    const { rows, cols } = steps[s];
    const dx = bounds.width / (cols + 1);
    const dy = bounds.height / (rows + 1);

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const candidate: PixelPoint = [
          bounds.minX + c * dx,
          bounds.minY + r * dy,
        ];
        if (isInside(candidate)) {
          const clearance = distanceToPolygons(candidate, polygons);
          if (clearance > bestClearance) {
            bestClearance = clearance;
            bestPoint = candidate;
          }
        }
      }
    }
  }

  if (bestClearance <= 0 && initialCentroid) {
    bestPoint = initialCentroid;
    bestClearance = Math.max(0.5, distanceToPolygons(initialCentroid, polygons));
  }

  return { point: bestPoint, clearance: Math.max(0, bestClearance) };
}

/**
 * Extracts a dynamic geometric spine / centerline curve from the polygon rings of a nation.
 */
export function extractTerritorySpinePath(
  polygons: PolygonRings[],
  samplePoints: PixelPoint[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  centroid: PixelPoint,
  centerPole: PixelPoint,
  clearance: number
): {
  pathD: string;
  spinePoints: PixelPoint[];
  curveLength: number;
  curvature: number;
  dominantAngleDeg: number;
  aspectRatio: number;
} {
  if (!polygons.length) {
    // Fallback: horizontal segment
    const startX = centerPole[0] - Math.max(4, bounds.width * 0.25);
    const endX = centerPole[0] + Math.max(4, bounds.width * 0.25);
    const y = centerPole[1];
    return {
      pathD: `M ${startX.toFixed(2)} ${y.toFixed(2)} L ${endX.toFixed(2)} ${y.toFixed(2)}`,
      spinePoints: [[startX, y], [endX, y]],
      curveLength: Math.max(8, endX - startX),
      curvature: 0,
      dominantAngleDeg: 0,
      aspectRatio: 1,
    };
  }

  const isInside = (pt: PixelPoint) => isPointInPolygons(pt, polygons);

  // 1. Calculate PCA covariance to determine principal elongation direction
  let meanX = 0;
  let meanY = 0;
  const n = samplePoints.length;
  for (let i = 0; i < n; i++) {
    meanX += samplePoints[i][0];
    meanY += samplePoints[i][1];
  }
  meanX /= n || 1;
  meanY /= n || 1;

  let covXX = 0;
  let covYY = 0;
  let covXY = 0;
  for (let i = 0; i < n; i++) {
    const dx = samplePoints[i][0] - meanX;
    const dy = samplePoints[i][1] - meanY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  }
  covXX /= n || 1;
  covYY /= n || 1;
  covXY /= n || 1;

  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const diff = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lambda1 = trace / 2 + diff;
  const lambda2 = Math.max(0.0001, trace / 2 - diff);
  const aspectRatio = Math.sqrt(lambda1 / lambda2);

  // Principal major direction vector u
  let theta = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
  let ux = Math.cos(theta);
  let uy = Math.sin(theta);

  // Normal vector v (perpendicular to major axis)
  let vx = -uy;
  let vy = ux;

  // 2. Project sample points onto u to get longitudinal bounds
  let tMin = Infinity;
  let tMax = -Infinity;
  for (let i = 0; i < samplePoints.length; i++) {
    const pt = samplePoints[i];
    const t = (pt[0] - centerPole[0]) * ux + (pt[1] - centerPole[1]) * uy;
    if (t < tMin) tMin = t;
    if (t > tMax) tMax = t;
  }

  const spanLength = Math.max(2, tMax - tMin);

  // 3. Slice across the territory at 7 stations along the major axis
  // Trim outer 15% on both sides to avoid unstable peninsulas/fringes
  const innerStart = tMin + spanLength * 0.15;
  const innerEnd = tMax - spanLength * 0.15;
  const sliceCount = 7;
  const rawSpine: PixelPoint[] = [];

  const sliceThickness = (spanLength * 0.7) / sliceCount * 1.5;

  for (let s = 0; s < sliceCount; s++) {
    const frac = s / (sliceCount - 1);
    const targetT = innerStart + (innerEnd - innerStart) * frac;

    // Find the center of mass (average V) for all sample points within this slice
    let sumV = 0;
    let countV = 0;

    for (let i = 0; i < samplePoints.length; i++) {
      const pt = samplePoints[i];
      const t = (pt[0] - centerPole[0]) * ux + (pt[1] - centerPole[1]) * uy;
      if (Math.abs(t - targetT) <= sliceThickness) {
        const v = (pt[0] - centerPole[0]) * vx + (pt[1] - centerPole[1]) * vy;
        sumV += v;
        countV++;
      }
    }

    if (countV > 0) {
      const avgV = sumV / countV;
      rawSpine.push([
        centerPole[0] + targetT * ux + avgV * vx,
        centerPole[1] + targetT * uy + avgV * vy,
      ]);
    }
  }

  // If slicing yielded too few points, build fallback chord through centerPole
  if (rawSpine.length < 3) {
    const halfSpan = Math.min(bounds.width, spanLength) * 0.35;
    const pStart: PixelPoint = [centerPole[0] - halfSpan * ux, centerPole[1] - halfSpan * uy];
    const pEnd: PixelPoint = [centerPole[0] + halfSpan * ux, centerPole[1] + halfSpan * uy];
    rawSpine.length = 0;
    rawSpine.push(pStart, centerPole, pEnd);
  }

  // 4. Ensure left-to-right (or top-to-bottom) path direction so text is never upside-down
  const startPt = rawSpine[0];
  const endPt = rawSpine[rawSpine.length - 1];
  const dx = endPt[0] - startPt[0];
  const dy = endPt[1] - startPt[1];

  // If path goes right-to-left, or is near vertical and goes bottom-to-top, reverse it
  if (dx < -0.1 || (Math.abs(dx) <= 0.1 && dy < 0)) {
    rawSpine.reverse();
  }

  // 5. Construct smooth Quadratic Bézier curve
  const P0 = rawSpine[0];
  const Pn = rawSpine[rawSpine.length - 1];
  const midIndex = Math.floor(rawSpine.length / 2);
  const Pmid = rawSpine[midIndex];

  // Distance from midpoint to the straight baseline P0-Pn determines natural territory curvature
  const baselineLength = Math.hypot(Pn[0] - P0[0], Pn[1] - P0[1]) || 1;
  const midBaselineDist = distanceToSegment(Pmid, P0, Pn);
  const curvature = midBaselineDist / baselineLength;

  // Dominant orientation angle in degrees
  let dominantAngleDeg = (Math.atan2(Pn[1] - P0[1], Pn[0] - P0[0]) * 180) / Math.PI;

  let pathD = '';
  let curveLength = baselineLength;

  // If the territory curvature is subtle (< 0.02), use a clean straight baseline
  if (curvature < 0.02) {
    pathD = `M ${P0[0].toFixed(2)} ${P0[1].toFixed(2)} L ${Pn[0].toFixed(2)} ${Pn[1].toFixed(2)}`;
    curveLength = baselineLength;
  } else {
    // Quadratic Bézier control point: Q = 2*Pmid - 0.5*(P0 + Pn)
    const rawQx = 2 * Pmid[0] - 0.5 * (P0[0] + Pn[0]);
    const rawQy = 2 * Pmid[1] - 0.5 * (P0[1] + Pn[1]);
    
    // High weight (0.8) to rawQ ensures the curve robustly follows the country's shape
    const Qx = Pmid[0] * 0.2 + rawQx * 0.8;
    const Qy = Pmid[1] * 0.2 + rawQy * 0.8;

    pathD = `M ${P0[0].toFixed(2)} ${P0[1].toFixed(2)} Q ${Qx.toFixed(2)} ${Qy.toFixed(2)} ${Pn[0].toFixed(2)} ${Pn[1].toFixed(2)}`;
    
    // Approximate curve length
    const chord1 = Math.hypot(Qx - P0[0], Qy - P0[1]);
    const chord2 = Math.hypot(Pn[0] - Qx, Pn[1] - Qy);
    curveLength = (baselineLength + chord1 + chord2) / 2;
  }

  return {
    pathD,
    spinePoints: rawSpine,
    curveLength,
    curvature,
    dominantAngleDeg,
    aspectRatio,
  };
}

// In-memory geometry cache to avoid recomputing unchanged country shapes
const labelMetricsCache = new Map<string, NationLabelSpine>();

/**
 * Groups features into the main contiguous/proximate landmass to exclude far-flung islands/colonies.
 */
function getMainLandmassFeatures(ownedFeatures: any[]): any[] {
  if (ownedFeatures.length <= 1) return ownedFeatures;
  
  // Sort by area descending
  const sorted = [...ownedFeatures].sort((a, b) => b.area - a.area);
  const primary = sorted[0];
  
  const mainCluster = [primary];
  const clusterBounds = {
    minX: primary.bounds[0][0],
    minY: primary.bounds[0][1],
    maxX: primary.bounds[1][0],
    maxY: primary.bounds[1][1],
  };

  // Expand cluster by including features that are "close" to the current cluster bounds
  let added = true;
  while (added) {
    added = false;
    for (let i = 0; i < sorted.length; i++) {
      const feat = sorted[i];
      if (mainCluster.includes(feat)) continue;
      
      const b = feat.bounds;
      // Allow a gap of roughly 15% of the cluster's current dimension
      const gapX = (clusterBounds.maxX - clusterBounds.minX) * 0.15 + 2;
      const gapY = (clusterBounds.maxY - clusterBounds.minY) * 0.15 + 2;
      
      const overlaps = !(
        b[1][0] < clusterBounds.minX - gapX ||
        b[0][0] > clusterBounds.maxX + gapX ||
        b[1][1] < clusterBounds.minY - gapY ||
        b[0][1] > clusterBounds.maxY + gapY
      );
      
      if (overlaps) {
        mainCluster.push(feat);
        clusterBounds.minX = Math.min(clusterBounds.minX, b[0][0]);
        clusterBounds.minY = Math.min(clusterBounds.minY, b[0][1]);
        clusterBounds.maxX = Math.max(clusterBounds.maxX, b[1][0]);
        clusterBounds.maxY = Math.max(clusterBounds.maxY, b[1][1]);
        added = true;
      }
    }
  }
  
  return mainCluster;
}

/**
 * Calculates or retrieves cached geometry metrics for a single nation.
 */
export function getNationLabelSpine(
  nation: Nation,
  ownedFeatures: Array<{
    feature: any;
    stateId: any;
    name: string;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
  }>,
  projection: any
): NationLabelSpine | null {
  if (!ownedFeatures.length) return null;

  const territoryKey = ownedFeatures
    .map((f) => String(f.stateId))
    .sort()
    .join(',');
  const cacheKey = `${nation.id}:${territoryKey}:${nation.name}`;

  const cached = labelMetricsCache.get(cacheKey);
  if (cached) return cached;

  const totalArea = ownedFeatures.reduce((sum, f) => sum + f.area, 0);

  // Identify the primary core landmass (largest continuous province cluster)
  const mainLandmass = getMainLandmassFeatures(ownedFeatures);
  const mainLandmassArea = mainLandmass.reduce((sum, f) => sum + f.area, 0);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const samplePoints: PixelPoint[] = [];
  const allMainPolygons: PolygonRings[] = [];

  mainLandmass.forEach((feat) => {
    const [tl, br] = feat.bounds;
    if (tl[0] < minX) minX = tl[0];
    if (tl[1] < minY) minY = tl[1];
    if (br[0] > maxX) maxX = br[0];
    if (br[1] > maxY) maxY = br[1];

    const polygons = extractProjectedPolygons(feat.feature, projection);
    polygons.forEach((poly) => {
      allMainPolygons.push(poly);
    });
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const bounds = { minX, minY, maxX, maxY, width, height };

  // Generate an area-based point cloud for accurate PCA (representing mass, not perimeter)
  const resolution = 30;
  const stepX = Math.max(0.5, bounds.width / resolution);
  const stepY = Math.max(0.5, bounds.height / resolution);
  
  for (let x = bounds.minX; x <= bounds.maxX; x += stepX) {
    for (let y = bounds.minY; y <= bounds.maxY; y += stepY) {
      if (isPointInPolygons([x, y], allMainPolygons)) {
        samplePoints.push([x, y]);
      }
    }
  }

  // Fallback to perimeter vertices if the area grid missed (e.g. extremely thin territories)
  if (samplePoints.length < 10) {
    allMainPolygons.forEach(poly => {
      poly.exterior.forEach(pt => samplePoints.push(pt));
    });
  }

  const { point: center, clearance } = calculatePoleOfInaccessibility(
    allMainPolygons,
    bounds,
    mainLandmass[0].centroid // Initial guess from the largest province
  );

  const {
    pathD,
    spinePoints,
    curveLength,
    curvature,
    dominantAngleDeg,
    aspectRatio,
  } = extractTerritorySpinePath(
    allMainPolygons,
    samplePoints,
    bounds,
    mainLandmass[0].centroid || center,
    center,
    clearance
  );

  const metrics: NationLabelSpine = {
    nationId: nation.id,
    nationName: nation.name,
    flagColor: nation.flagColor || '#64748b',
    totalArea,
    mainLandmassArea,
    center,
    clearance,
    spinePoints,
    pathD,
    curveLength,
    curvature,
    aspectRatio,
    dominantAngleDeg,
    bounds,
    territoryHash: territoryKey,
  };

  labelMetricsCache.set(cacheKey, metrics);
  return metrics;
}

/**
 * Computes dynamic country labels that truly respond to territory geometry:
 * Width expands across territory span, characters bend along curved spines,
 * tracking adapts gracefully, and small states smoothly scale/hide.
 */
export function computeDynamicCountryLabels(
  nations: Nation[],
  precalculatedFeatures: Array<{
    feature: any;
    stateId: any;
    name: string;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
  }>,
  provinceOwnership: Map<number | string, Nation>,
  projection: any,
  zoom: number
): RenderableCountryLabel[] {
  if (!nations.length || !precalculatedFeatures.length) return [];

  const featuresByNation = new Map<string, typeof precalculatedFeatures>();
  precalculatedFeatures.forEach((feat) => {
    const owner = provinceOwnership.get(feat.stateId) || provinceOwnership.get(feat.name);
    if (owner) {
      let list = featuresByNation.get(owner.id);
      if (!list) {
        list = [];
        featuresByNation.set(owner.id, list);
      }
      list.push(feat);
    }
  });

  const labels: RenderableCountryLabel[] = [];

  nations.forEach((nation) => {
    const owned = featuresByNation.get(nation.id);
    if (!owned || !owned.length) return;
    
    const spine = getNationLabelSpine(nation, owned, projection);
    if (!spine) return;

    const { center, clearance, pathD, curveLength, curvature, dominantAngleDeg, totalArea, bounds, mainLandmassArea } = spine;
    
    const cleanName = (nation.name || '').trim();
    if (!cleanName) return;

    // HOI4 Grand Strategy Map: All-caps uppercase display text
    const displayText = cleanName.toUpperCase();
    const hasCJK = /[\u4e00-\u9fa5\u3040-\u30ff]/.test(displayText);
    const charCount = Math.max(1, displayText.length);
    const provCount = owned.length;

    // Condensed font character width proportion (Oswald / Barlow Condensed: narrower horizontal ratio)
    const charWidthRatio = hasCJK ? 1.05 : 0.62;

    // Dimension metrics for territory scaling
    const diagonal = Math.hypot(bounds.width, bounds.height);
    const minDim = Math.min(bounds.width, bounds.height);
    const areaRadius = Math.sqrt(mainLandmassArea / Math.PI);

    // Calculate maximum permitted font height based on regional clearance and corridor width
    // In multi-province empires, the spine transverses across multiple provinces, allowing grander scale
    const effectiveCorridor = Math.max(
      clearance * 1.7,
      areaRadius * 0.60,
      minDim * 0.36
    );
    const maxFontSizeByHeight = Math.max(1.5, effectiveCorridor * 0.72);

    // Calculate maximum permitted font width to ensure condensed characters + base spacing fit within the spine length
    const maxFontSizeByWidth = Math.max(
      1.4,
      (curveLength * 0.82) / Math.max(1, charCount * (charWidthRatio + 0.18))
    );

    // Dynamic grand strategy sizing strictly driven by territory area, province count, and geographic span:
    // - Micro-states / 1 province (e.g. city states, small islands): ~1.6 - 2.4 (clean, non-intrusive)
    // - Mid-sized nations (3-7 provinces): ~3.4 - 5.8
    // - Major regional powers (8-15 provinces): ~6.5 - 10.5 (prominent, authoritative)
    // - Superpowers / Vast continental empires (16+ provinces): ~11.0 - 18.0 (grand, refined HOI4 map feel)
    const areaScale = Math.sqrt(mainLandmassArea) * 0.085;
    const provinceScale = Math.sqrt(provCount) * 1.65 + (provCount >= 8 ? (provCount - 8) * 0.35 : 0);
    const spanScale = (curveLength / Math.max(1, charCount * charWidthRatio)) * 0.56;
    const targetGrandSize = Math.max(1.6 + provinceScale, areaScale, spanScale, diagonal * 0.055);

    // Constrain font size within fitting territory geometry
    let fontSize = Math.min(targetGrandSize, maxFontSizeByHeight, maxFontSizeByWidth);

    // Ensure safe bounds (moderately compact scale)
    fontSize = Math.max(1.5, Math.min(18.0, fontSize));

    // Subtle scale-up on zoom to maintain readability
    fontSize *= (1.0 + Math.log2(Math.max(1, zoom)) * 0.035);
    fontSize = Math.min(fontSize, 20.0);

    // Phase 3: Letter spacing calculation for solemn military grand strategy map feel
    // Moderate, balanced tracking (not overly tight, not absurdly disjointed)
    const baseTrackingRatio = hasCJK ? 0.22 : 0.28;
    const baseSpacing = Math.max(0.3, fontSize * baseTrackingRatio);
    const compactTextWidth = charCount * (fontSize * charWidthRatio) + (charCount - 1) * baseSpacing;
    const extraSpace = Math.max(0, curveLength * 0.85 - compactTextWidth);

    // Gracefully distribute remaining curve corridor between letters without over-stretching
    const distributedExtra = charCount > 1 ? extraSpace / (charCount - 1) : 0;
    const maxTrackingLimit = fontSize * (hasCJK ? 0.45 : 0.60);
    const letterSpacing = charCount > 1
      ? Math.min(maxTrackingLimit, baseSpacing + distributedExtra * 0.55)
      : 0;
      
    // Phase 4 & 6: Curvature and path
    // Fallback if path is invalid or zero-length
    let finalPathD = pathD;
    const totalLabelSpan = charCount * (fontSize * charWidthRatio) + (charCount - 1) * letterSpacing;
    if (!finalPathD || curveLength < fontSize) {
      // Fallback to simple horizontal text
      const halfW = totalLabelSpan / 2;
      finalPathD = `M ${center[0] - halfW} ${center[1]} L ${center[0] + halfW} ${center[1]}`;
    }

    const sanitizedId = nation.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    labels.push({
      nation,
      pathId: `label-spine-${sanitizedId}`,
      pathD: finalPathD,
      displayText,
      center,
      fontSize,
      letterSpacing,
      opacity: 1,
      curveLength,
      curvature,
    });
  });

  return labels;
}
