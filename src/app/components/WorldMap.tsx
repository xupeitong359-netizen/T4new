import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import mapGeoData from '../assets/hoi4_fixed_map.json';
import { motion, AnimatePresence } from 'motion/react';
import {
 Globe,
 ZoomIn,
 ZoomOut,
 RotateCcw,
 MapPin,
 Landmark,
 Swords,
 Crown,
 Layers,
 Eye,
 Hammer,
 ChevronUp,
 ChevronDown,
 Info,
 AlertTriangle,
 Shield,
 Crosshair,
 Zap,
 Flame,
 Navigation,
 Clock3,
 Compass,
 CheckCircle2,
 LandPlot,
 ShieldCheck,
 Sparkles,
 X,
 Sun,
 Moon,
 Contrast,
 Boxes,
} from 'lucide-react';
import * as d3Geo from 'd3-geo';
import { Nation } from '../types';
import { renderEmblemIcon } from '../lib/icons';
import { api } from '../services/api';
import { isTodayUsed, isProvinceAdjacentToNation, getValidExpansionProvinceIds, getValidCreationProvinceIds, initMapIndex } from '../lib/mapAdjacency';
import {
 MAP_THEMES,
 MapVisualTheme,
 MapThemeConfig,
 getSavedMapTheme,
 saveMapTheme,
 toModernMapColor,
} from '../lib/mapThemes';
import { computeDynamicCountryLabels } from '../lib/countryLabelEngine';
import { computeNationalBorders } from '../lib/nationalBorderEngine';
import {
 STRATEGIC_RESOURCES,
 StrategicResourceType,
 getProvinceResourceDeposits,
 calculateNationResourceOverview,
} from '../lib/strategicCommandEngine';
import {
 TacticalCivFactoryIcon,
 TacticalMilFactoryIcon,
 TacticalDockyardIcon,
 TacticalInfraIcon,
 TacticalAirbaseIcon,
 TacticalRadarIcon,
 TacticalFortressIcon,
 TacticalAntiAirIcon,
 TacticalRefineryIcon,
 TacticalRocketIcon,
 TacticalNuclearIcon,
 TacticalSupplyHubIcon,
 TacticalLightningIcon,
 TacticalSlotBoxIcon,
} from '../lib/tacticalIcons';
import { ProvinceDetailPanel } from './ProvinceDetailPanel';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { getProvinceTerrain } from '../lib/terrainEngine';
import { getProvinceCivilianFactories, getTotalCivilianFactories } from '../lib/economyEngine';
import { getProvinceMilitaryFactories } from '../lib/militaryIndustry';
import { remoteState } from '../services/remoteState';
import { GeopoliticalFactionsSidebar } from './GeopoliticalFactionsSidebar';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 calculateBuildingUpgradeCost,
 getMaxLevelForBuilding,
 getInfrastructureBonus,
 getTotalBuildingsInProvince,
 MAX_BUILDINGS_PER_PROVINCE,
 RADAR_TECH_TIERS,
 getBuildingLevelAndPercentage,
 getConstructionHeatmapColor,
} from '../lib/constructionRules';

interface WorldMapProps {
 nations: Nation[];
 onSelectNation: (nation: Nation) => void;
 onOpenDiplomacy: (nation: Nation) => void;
 targetNationToFocus?: Nation | null;
 clearTargetNationFocus?: () => void;
 onOpenConstruction?: () => void;
 constructionPlacementBuilding?: StrategicBuildingType | null;
 onCancelConstructionPlacement?: () => void;
 onChangeConstructionBuilding?: (b: StrategicBuildingType) => void;
 myNation?: Nation | null;
 onBuildInProvince?: (provinceId: string | number, provinceName: string, buildingType: StrategicBuildingType) => void;
 onOpenDispute?: (targetNation: Nation, provinceName: string) => void;
 onOpenArmyCommand?: () => void;
 onOpenResources?: () => void;
}

// Built-in simplified world landmasses GeoJSON coordinates for fallback
const DEFAULT_WORLD_GEOJSON: any = {
 type: 'FeatureCollection',
 features: [
  {
   type: 'Feature',
   properties: { name: 'Eurasia & Africa', region: 'World' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-10, 35], [0, 40], [10, 45], [30, 42], [40, 45], [60, 40], [80, 50], [120, 55], [140, 50], [140, 30],
      [120, 20], [105, 10], [90, 22], [75, 10], [60, 25], [50, 15], [45, 12], [40, 0], [35, -20], [20, -34],
      [15, -30], [10, -5], [-15, 12], [-17, 20], [-10, 35]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'North America', region: 'Americas' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-165, 65], [-140, 70], [-90, 75], [-60, 50], [-70, 40], [-80, 25], [-90, 18], [-105, 22], [-120, 35],
      [-130, 50], [-165, 65]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'South America', region: 'Americas' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-80, 10], [-60, 5], [-35, -5], [-40, -22], [-55, -38], [-70, -55], [-75, -45], [-70, -20], [-80, 10]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'Australia', region: 'Oceania' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [115, -22], [130, -12], [145, -15], [150, -25], [145, -38], [130, -35], [115, -34], [115, -22]
     ],
    ],
   },
  },
 ],
};

// Low-saturation historical map pigments. National source colors remain untouched in data.
function toMilitaryMapColor(color?: string) {
 const value = (color || '#687381').replace('#', '');
 if (!/^[0-9a-fA-F]{6}$/.test(value)) return '#5d6874';
 const r = parseInt(value.slice(0, 2), 16) / 255;
 const g = parseInt(value.slice(2, 4), 16) / 255;
 const b = parseInt(value.slice(4, 6), 16) / 255;
 const max = Math.max(r, g, b);
 const min = Math.min(r, g, b);
 const delta = max - min;
 let hue = 0;
 if (delta) {
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
 }
 const lightness = (max + min) / 2;
 const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
 // Pigments deliberately compress both saturation and highlights into an archival military palette.
 return `hsl(${Math.round(hue)} ${Math.round(Math.min(42, saturation * 100 * 0.46))}% ${Math.round(Math.min(52, Math.max(28, lightness * 100 * 0.78)))}%)`;
}

type PixelPoint = [number, number];
const projectedRingCache = new WeakMap<object, { projection: any; rings: PixelPoint[][] }>();

function pointInRing(point: PixelPoint, ring: PixelPoint[]) {
 let inside = false;
 for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
  const [xi, yi] = ring[i];
  const [xj, yj] = ring[j];
  const intersects = ((yi > point[1]) !== (yj > point[1])) && point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 0.000001) + xi;
  if (intersects) inside = !inside;
 }
 return inside;
}

function distanceToSegment(point: PixelPoint, a: PixelPoint, b: PixelPoint) {
 const dx = b[0] - a[0];
 const dy = b[1] - a[1];
 const lengthSquared = dx * dx + dy * dy || 1;
 const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
 return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function projectedRings(feature: any, projection: any): PixelPoint[][] {
 const geometry = feature?.geometry;
 if (!geometry?.coordinates) return [];
 const cached = projectedRingCache.get(geometry);
 if (cached?.projection === projection) return cached.rings;
 const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
 const rings = polygons.map((ring: any[]) => ring.map((coordinate) => projection(coordinate)).filter(Boolean) as PixelPoint[]).filter((ring) => ring.length > 2);
 projectedRingCache.set(geometry, { projection, rings });
 return rings;
}

function pointInsideFeature(point: PixelPoint, feature: any, projection: any) {
 const rings = projectedRings(feature, projection);
 if (!rings.length || !pointInRing(point, rings[0])) return false;
 // Additional rings are treated as holes for the usual polygon case.
 return !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function interiorDistance(point: PixelPoint, feature: any, projection: any) {
 const rings = projectedRings(feature, projection);
 let nearest = Infinity;
 rings.forEach((ring) => ring.forEach((vertex, index) => {
  nearest = Math.min(nearest, distanceToSegment(point, vertex, ring[(index + 1) % ring.length]));
 }));
 return nearest;
}

// High-performance memoized province path renderer for 1000+ features
export type MapModeType = 'political' | 'industrial' | 'resources' | 'population' | 'terrain' | 'diplomatic' | 'military';

interface ProvincePathProps {
 pathD: string;
 stateId: any;
 name: string;
 properties: any;
 ownerNation?: Nation | null;
 isPreviewed: boolean;
 isCapitalPreview: boolean;
 previewFlagColor?: string;
 isHovered: boolean;
 isSelected?: boolean;
 mapTheme: MapVisualTheme;
 themeConfig: MapThemeConfig;
 isMyProvince?: boolean;
 isConstructionMode?: boolean;
 isUnderConstruction?: boolean;
 constructionPercent?: number;
 constructionHeatColor?: string;
 constructionColor?: string;
 mapMode?: MapModeType;
 isPeacefulExpansionMode?: boolean;
 isValidExpansionTarget?: boolean;
 isCreationMode?: boolean;
 isValidCreationTarget?: boolean;
 isNonCore?: boolean;
 onHover: (id: any, props: any) => void;
 onUnhover: () => void;
 onClick: (id: any, name: string, properties: any) => void;
}

const MemoizedProvincePath = memo(function MemoizedProvincePath({
 pathD,
 stateId,
 name,
 properties,
 ownerNation,
 isPreviewed,
 isCapitalPreview,
 previewFlagColor = '#6366f1',
 isHovered,
 isSelected = false,
 mapTheme,
 themeConfig,
 isMyProvince = false,
 isConstructionMode = false,
 isUnderConstruction = false,
 constructionPercent = 0,
 constructionHeatColor,
 constructionColor = '#f59e0b',
 mapMode = 'political',
 isPeacefulExpansionMode = false,
 isValidExpansionTarget = false,
 isCreationMode = false,
 isValidCreationTarget = false,
 isNonCore = false,
 onHover,
 onUnhover,
 onClick,
}: ProvincePathProps) {
 let fill = themeConfig.land;
 let stroke = themeConfig.provinceBorder;
 let strokeWidth = 0.58;
 let strokeOpacity = 0.95;
 let fillOpacity = 1;

 const provRecord = ownerNation?.provinces?.find(
  (p) =>
   String(p.id) === String(stateId) ||
   (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
 );

 if (isCapitalPreview) {
  fill = previewFlagColor;
  stroke = '#ffffff';
  strokeWidth = 1.6;
  strokeOpacity = 1;
 } else if (isPreviewed) {
  fill = `${previewFlagColor}D9`;
  stroke = '#ffffff';
  strokeWidth = 1.0;
  strokeOpacity = 0.85;
 } else if (isSelected) {
  // Clear, elegant selection highlight
  fill = themeConfig.selectionHighlight;
  stroke = themeConfig.selectionStroke;
  strokeWidth = 1.8;
  strokeOpacity = 1;
 } else if (isPeacefulExpansionMode) {
  if (isMyProvince) {
   fill = toModernMapColor(ownerNation?.flagColor || '#4f46e5', mapTheme);
   stroke = '#10b981';
   strokeWidth = 0.8;
   strokeOpacity = 0.9;
   fillOpacity = 0.95;
  } else if (isValidExpansionTarget) {
   fill = isHovered ? 'rgba(52, 211, 153, 0.75)' : 'rgba(16, 185, 129, 0.35)';
   stroke = isHovered ? '#ffffff' : '#10b981';
   strokeWidth = isHovered ? 2.0 : 1.2;
   strokeOpacity = 1;
  } else if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}60`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 1.0 : 0.4;
   strokeOpacity = 0.6;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.2)';
   stroke = '#f87171';
   strokeWidth = 1.0;
   strokeOpacity = 0.9;
  }
 } else if (isCreationMode) {
  if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}50`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 1.0 : 0.4;
   strokeOpacity = 0.6;
  } else if (isValidCreationTarget) {
   fill = isHovered ? `${previewFlagColor}4D` : 'rgba(99, 102, 241, 0.15)';
   stroke = isHovered ? '#ffffff' : `${previewFlagColor}B3`;
   strokeWidth = isHovered ? 1.8 : 0.85;
   strokeOpacity = 0.95;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.18)';
   stroke = '#f87171';
   strokeWidth = 1.2;
   strokeOpacity = 0.9;
  }
 } else if (isConstructionMode) {
  if (isMyProvince) {
   if (isUnderConstruction) {
    fill = 'url(#construction-green-stripes)';
    stroke = '#22c55e';
    strokeWidth = isHovered ? 2.2 : 1.6;
    strokeOpacity = 1;
   } else {
    const baseHeatColor = constructionHeatColor || getConstructionHeatmapColor(constructionPercent);
    fill = isHovered ? '#fef08a' : baseHeatColor;
    stroke = isHovered ? '#ffffff' : (constructionColor || '#38bdf8');
    strokeWidth = isHovered ? 1.8 : 1.0;
    strokeOpacity = 1;
   }
  } else if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}60`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 1.0 : 0.45;
   strokeOpacity = 0.6;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.15)';
   stroke = '#f87171';
   strokeWidth = 0.9;
   strokeOpacity = 0.85;
  }
 } else if (mapMode === 'population') {
  // 人口专题地图：无论是否建国，全图所有省份均统一按人口规模阶梯着色
  const pop =
   (provRecord?.population as number) ??
   (provRecord?.manpower as number) ??
   (properties?.manpower as number) ??
   (properties?.population as number) ??
   1500000;

  if (pop >= 6000000) {
   fill = '#064e3b'; // 极高/超大城市 (Emerald-900)
  } else if (pop >= 3500000) {
   fill = '#047857'; // 高人口稠密区 (Emerald-700)
  } else if (pop >= 1800000) {
   fill = '#059669'; // 中高密度 (Emerald-600)
  } else if (pop >= 900000) {
   fill = '#10b981'; // 中等人口 (Emerald-500)
  } else if (pop >= 400000) {
   fill = '#34d399'; // 低密度 (Emerald-400)
  } else if (pop >= 150000) {
   fill = '#6ee7b7'; // 稀疏地块 (Emerald-300)
  } else {
   fill = '#a7f3d0'; // 极低/旷野 (Emerald-200)
  }
  fillOpacity = isHovered ? 1 : 0.88;
  stroke = isHovered ? themeConfig.hoverLandStroke : '#047857';
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'industrial') {
  // 工业产能专题地图：统计民用与军工总产能
  const civ = provRecord ? getProvinceCivilianFactories(provRecord) : (properties?.civilianFactories || 0);
  const mil = provRecord ? getProvinceMilitaryFactories(provRecord) : (properties?.militaryFactories || 0);
  const totalIC = civ + mil;
  if (totalIC >= 6) {
   fill = '#15803d'; // 重工业枢纽: 饱满绿
  } else if (totalIC >= 3) {
   fill = '#2563eb'; // 中型工业区: 工业蓝
  } else if (totalIC >= 1) {
   fill = '#d97706'; // 初级工业: 琥珀金
  } else {
   fill = mapTheme === 'white' ? '#e2e8f0' : '#1e293b'; // 无工业产能
  }
  fillOpacity = isHovered ? 1 : 0.88;
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'resources') {
  // 战略资源专题地图：根据省份主导战略资源类型与储量着色
  const rawDeposits = (provRecord?.resources && Object.keys(provRecord.resources).length > 0)
   ? provRecord.resources
   : getProvinceResourceDeposits(stateId, name, properties);
  const activeDeposits = (Object.keys(rawDeposits) as StrategicResourceType[])
   .filter((k) => Boolean(rawDeposits[k] && rawDeposits[k]! > 0))
   .map((k) => ({ type: k, amount: rawDeposits[k]! }));
  const totalAmount = activeDeposits.reduce((s, r) => s + (r.amount || 0), 0);
  const primaryRes = activeDeposits.length > 0
   ? [...activeDeposits].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]
   : null;

  if (totalAmount > 0 && primaryRes) {
   const resDef = STRATEGIC_RESOURCES[primaryRes.type];
   fill = resDef?.color || '#3b82f6';
   fillOpacity = isHovered ? 1 : Math.min(0.85, 0.4 + (totalAmount / 70) * 0.45);
  } else {
   fill = mapTheme === 'white' ? '#f1f5f9' : '#141c2b';
   fillOpacity = 0.85;
  }
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'terrain') {
  // 自然地理地形专题地图
  const terrain = getProvinceTerrain(stateId, name, properties);
  fill = terrain.mapFill;
  fillOpacity = isHovered ? 0.96 : 0.82;
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (ownerNation) {
  // 经典政务/主权/战线地图模式：建国领土按主权国旗底色渲染
  fill = toModernMapColor(ownerNation.flagColor, mapTheme);
  // HOI4 半透明自然涂层：透出底色质感
  fillOpacity = isHovered
   ? (mapTheme === 'white' ? 0.88 : 0.95)
   : isNonCore
   ? (mapTheme === 'white' ? 0.52 : 0.65)
   : (mapTheme === 'white' ? 0.64 : 0.82);
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (isHovered) {
  fill = themeConfig.hoverLandFill;
  stroke = themeConfig.hoverLandStroke;
  strokeWidth = 1.0;
  strokeOpacity = 0.95;
 }

 return (
  <g>
   {/* If under construction, draw base heat color first so stripes overlay on top */}
   {isConstructionMode && isMyProvince && isUnderConstruction && (
    <path
     d={pathD}
     fill={constructionHeatColor || '#059669'}
     stroke="none"
     vectorEffect="non-scaling-stroke"
    />
   )}
   <path
    d={pathD}
    fill={fill}
    fillOpacity={fillOpacity}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeOpacity={strokeOpacity}
    fillRule="evenodd"
    strokeLinejoin="round"
    strokeLinecap="round"
    vectorEffect="non-scaling-stroke"
    className="cursor-pointer"
    style={{
     transition: 'fill 400ms cubic-bezier(0.4, 0, 0.2, 1), stroke 400ms cubic-bezier(0.4, 0, 0.2, 1), fill-opacity 200ms ease',
    }}
    onMouseEnter={() => onHover(stateId, properties)}
    onMouseLeave={onUnhover}
    onClick={() => onClick(stateId, name, properties)}
   />
  </g>
 );
});

function getFeaturePixelCenter(feature: any, pathGenerator: any, projection: any): [number, number] | null {
 if (!feature) return null;
 try {
  if (pathGenerator) {
   const c = pathGenerator.centroid(feature);
   if (c && !isNaN(c[0]) && !isNaN(c[1]) && isFinite(c[0]) && isFinite(c[1])) {
    return [c[0], c[1]];
   }
   const b = pathGenerator.bounds(feature);
   if (b && !isNaN(b[0][0]) && !isNaN(b[1][0])) {
    return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
   }
  }
  if (projection) {
   const geoC = d3Geo.geoCentroid(feature);
   if (geoC && !isNaN(geoC[0]) && !isNaN(geoC[1])) {
    const pt = projection(geoC);
    if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
     return [pt[0], pt[1]];
    }
   }
  }
 } catch {
  // ignore
 }
 return null;
}

function fallbackHashCoordinate(nation: Nation, width: number, height: number) {
 let hash = 0;
 const seed = (nation.capital || nation.name || 'nation').trim();
 for (let i = 0; i < seed.length; i++) {
  hash = (hash << 5) - hash + seed.charCodeAt(i);
  hash |= 0;
 }
 const x = width * 0.25 + (Math.abs(hash) % (width * 0.5));
 const y = height * 0.25 + (Math.abs(hash * 31) % (height * 0.5));
 return { x, y, provinceName: nation.capital };
}

function findNationCapitalPoint(
 nation: Nation,
 geoData: any,
 pathGenerator: any,
 projection: any,
 width: number,
 height: number
): { x: number; y: number; provinceName?: string } {
 if (!geoData?.features || !pathGenerator) {
  return fallbackHashCoordinate(nation, width, height);
 }

 const features: any[] = geoData.features;
 const capitalStr = (nation.capital || '').trim().toLowerCase();
 const rawCapId = capitalStr.replace(/\D/g, '');

 // 1. Direct match with nation.capital against GeoJSON features
 if (capitalStr) {
  const directMatch = features.find((f: any) => {
   const name = String(f.properties?.name || '').trim().toLowerCase();
   const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
   const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
   return (
    name === capitalStr ||
    cnName === capitalStr ||
    (rawCapId && stateId === rawCapId) ||
    name.includes(capitalStr) ||
    capitalStr.includes(name) ||
    (cnName && (cnName.includes(capitalStr) || capitalStr.includes(cnName)))
   );
  });

  if (directMatch) {
   const pt = getFeaturePixelCenter(directMatch, pathGenerator, projection);
   if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(directMatch.properties?.name) || directMatch.properties?.name };
  }
 }

 // 2. Search nation.provinces list
 if (Array.isArray(nation.provinces) && nation.provinces.length > 0) {
  // Find designated capital province or matching province in the nation's owned provinces
  const matchingProv = nation.provinces.find(
   (p) =>
    String(p.name || '').trim().toLowerCase() === capitalStr ||
    String(getProvinceChineseName(p.name) || '').trim().toLowerCase() === capitalStr ||
    String(p.id) === capitalStr ||
    (rawCapId && String(p.id) === rawCapId)
  );

  if (matchingProv) {
   const provFeature = features.find((f: any) => {
    const name = String(f.properties?.name || '').trim().toLowerCase();
    const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
    const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
    return (
     (matchingProv.id && stateId === String(matchingProv.id)) ||
     (matchingProv.name && (name === String(matchingProv.name).trim().toLowerCase() || cnName === String(matchingProv.name).trim().toLowerCase()))
    );
   });

   if (provFeature) {
    const pt = getFeaturePixelCenter(provFeature, pathGenerator, projection);
    if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(provFeature.properties?.name) || matchingProv.name };
   }
  }

  // 3. Fallback to the first sovereign province (the core/founding state)
  const firstProv = nation.provinces[0];
  const firstFeature = features.find((f: any) => {
   const name = String(f.properties?.name || '').trim().toLowerCase();
   const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
   const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
   return (
    (firstProv.id && stateId === String(firstProv.id)) ||
    (firstProv.name && (name === String(firstProv.name).trim().toLowerCase() || cnName === String(firstProv.name).trim().toLowerCase()))
   );
  });

  if (firstFeature) {
   const pt = getFeaturePixelCenter(firstFeature, pathGenerator, projection);
   if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(firstFeature.properties?.name) || firstProv.name };
  }
 }

 // 4. If mapCoordinates [lng, lat] is specified
 if (
  Array.isArray(nation.mapCoordinates) &&
  nation.mapCoordinates.length === 2 &&
  typeof nation.mapCoordinates[0] === 'number' &&
  typeof nation.mapCoordinates[1] === 'number' &&
  !isNaN(nation.mapCoordinates[0]) &&
  !isNaN(nation.mapCoordinates[1])
 ) {
  try {
   const pt = projection(nation.mapCoordinates);
   if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
    return { x: pt[0], y: pt[1], provinceName: nation.capital };
   }
  } catch {
   // ignore
  }
 }

 return fallbackHashCoordinate(nation, width, height);
}

const GAME_DAYS_PER_REAL_DAY = 365;
const MS_PER_HOUR = 60 * 60 * 1000;

function formatCampaignTime(realStartMs: number, nowMs: number) {
 const elapsedGameHours = Math.max(0, Math.floor(((nowMs - realStartMs) / MS_PER_HOUR) * GAME_DAYS_PER_REAL_DAY));
 const year = 1936 + Math.floor(elapsedGameHours / (365 * 24));
 const hourOfYear = elapsedGameHours % (365 * 24);
 let daysLeft = Math.floor(hourOfYear / 24);
 const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
 let month = 0;
 while (month < monthDays.length - 1 && daysLeft >= monthDays[month]) {
  daysLeft -= monthDays[month];
  month += 1;
 }
 const m = String(month + 1).padStart(2, '0');
 const d = String(daysLeft + 1).padStart(2, '0');
 return `${year}.${m}.${d}`;
}

const DEFAULT_EUROPE_VIEW = { zoom: 2.8, pan: { x: -920, y: -270 } };

function deepenColor(color: string): string {
  if (!color) return '#000000';
  
  let h = 0, s = 0, l = 0;
  
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\(([^,]+),\s*([^%]+)%,\s*([^%]+)%\)/);
    if (match) {
      h = parseFloat(match[1]);
      s = parseFloat(match[2]) / 100;
      l = parseFloat(match[3]) / 100;
    }
  } else {
    let cleanHex = color.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
      h *= 360;
    }
  }

  // Just slightly boost saturation and keep lightness close to original.
  // The 'multiply' blend mode will naturally darken it against the background.
  s = Math.min(1.0, s * 1.15 + 0.1);
  l = Math.max(0.35, l * 0.82);

  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export const WorldMap: React.FC<WorldMapProps> = ({
 nations,
 onSelectNation,
 onOpenDiplomacy,
 targetNationToFocus,
 clearTargetNationFocus,
 onOpenConstruction,
 constructionPlacementBuilding,
 onCancelConstructionPlacement,
 onChangeConstructionBuilding,
 myNation,
 onBuildInProvince,
 onOpenDispute,
 onOpenArmyCommand,
 onOpenResources,
}) => {
 const [geoData, setGeoData] = useState<any>(null);
 const [mapTheme, setMapTheme] = useState<MapVisualTheme>(() => getSavedMapTheme());
 const currentTheme = MAP_THEMES[mapTheme];
 const [mapMode, setMapMode] = useState<MapModeType>('political');
 const [isPeacefulExpansion, setIsPeacefulExpansion] = useState(false);
 const [showExpansionInfo, setShowExpansionInfo] = useState(false);
 const [expansionSuccessData, setExpansionSuccessData] = useState<{ provinceName: string; isCore: boolean } | null>(null);
 const [expansionError, setExpansionError] = useState<string | null>(null);
 const [isExpanding, setIsExpanding] = useState(false);
 const [view, setView] = useState(DEFAULT_EUROPE_VIEW);
 const { zoom, pan } = view;

 const [isDragging, setIsDragging] = useState(false);
 const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
 const [hoveredNation, setHoveredNation] = useState<Nation | null>(null);
 const [showNationsDrawer, setShowNationsDrawer] = useState(false);
 const [worldClockStart, setWorldClockStart] = useState<number | null>(null);
 const [campaignNow, setCampaignNow] = useState(() => Date.now());

 // Listen to peaceful expansion toggle events dispatched from mobile bar or other components
 useEffect(() => {
  const handleToggle = () => {
   if (!myNation) {
    setExpansionError('您尚未创建或统治国家，无法执行和平扩张');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (isTodayUsed(myNation.lastPeaceExpansionAt, myNation.peaceExpansionCount)) {
    setExpansionError('今日和平扩张次数已用完，请于明日再试');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   setIsPeacefulExpansion((prev) => !prev);
  };
  window.addEventListener('map-toggle-peaceful-expansion', handleToggle);
  return () => window.removeEventListener('map-toggle-peaceful-expansion', handleToggle);
 }, [myNation]);

 // Synchronize peaceful expansion state to other components outside render phase
 useEffect(() => {
  const timer = window.setTimeout(() => {
   window.dispatchEvent(new CustomEvent('map-peaceful-expansion-state', { detail: { active: isPeacefulExpansion } }));
  }, 0);
  return () => window.clearTimeout(timer);
 }, [isPeacefulExpansion]);

 useEffect(() => {
  let mounted = true;
  void remoteState.readSection<number>('worldClockStartedAt')
   .then((startedAt) => {
    if (mounted && typeof startedAt === 'number') setWorldClockStart(startedAt);
   })
   .catch(() => undefined);
  const timer = window.setInterval(() => setCampaignNow(Date.now()), 1000);
  return () => {
   mounted = false;
   window.clearInterval(timer);
  };
 }, []);

 const [hoveredProvinceId, setHoveredProvinceId] = useState<string | number | null>(null);
 const [hoveredProvinceData, setHoveredProvinceData] = useState<any | null>(null);
 const [selectedProvince, setSelectedProvince] = useState<{
  id: string | number;
  name: string;
  properties: any;
  ownerNation: Nation | null;
 } | null>(null);

 // Dynamic Grand Strategy Army & Construction status figures
 const totalArmyManpower = useMemo(() => {
  if (!myNation) return 128000;
  const divManpower = myNation.army?.divisions?.reduce((acc, d) => acc + (d.manpower || 0), 0) || 0;
  const reserve = myNation.army?.manpowerReserve || 0;
  const total = divManpower + reserve;
  return total > 0 ? total : 128000;
 }, [myNation]);

 const formattedArmyManpower = useMemo(() => {
  if (totalArmyManpower >= 1000000) {
   return `${(totalArmyManpower / 1000000).toFixed(1)}M`;
  }
  if (totalArmyManpower >= 1000) {
   return `${(totalArmyManpower / 1000).toFixed(0)}K`;
  }
  return `${totalArmyManpower}`;
 }, [totalArmyManpower]);

 const totalCivFactories = useMemo(() => {
  if (!myNation) return 24;
  const total = getTotalCivilianFactories(myNation);
  return total > 0 ? total : 24;
 }, [myNation]);

 const nationalPrestigeOrCount = useMemo(() => {
  if (!myNation) return nations.length || 5;
  return typeof myNation.stability === 'number' ? myNation.stability : (nations.length || 5);
 }, [myNation, nations]);

 // Navigate between provinces (prev / next in precalculatedFeatures)
 const handleNavigateProvince = (direction: 'prev' | 'next') => {
  if (!selectedProvince || precalculatedFeatures.length === 0) return;
  const currentIndex = precalculatedFeatures.findIndex(
   (f) =>
    String(f.stateId) === String(selectedProvince.id) ||
    String(f.name).toLowerCase() === String(selectedProvince.name).toLowerCase()
  );
  if (currentIndex === -1) return;
  const nextIndex =
   direction === 'next'
    ? (currentIndex + 1) % precalculatedFeatures.length
    : (currentIndex - 1 + precalculatedFeatures.length) % precalculatedFeatures.length;
  const targetFeature = precalculatedFeatures[nextIndex];
  if (targetFeature) {
   const ownerNation =
    provinceOwnership.get(targetFeature.stateId) || provinceOwnership.get(targetFeature.name);
   setSelectedProvince({
    id: targetFeature.stateId,
    name: targetFeature.name,
    properties: targetFeature.properties,
    ownerNation: ownerNation || null,
   });
  }
 };

 const [previewState, setPreviewState] = useState<{
  provinces: any[];
  flagColor: string;
  mode: 'territory' | 'capital' | null;
  capital?: string;
 } | null>(null);

 useEffect(() => {
  const handlePreview = (e: any) => {
   setPreviewState(e.detail);
   if (e.detail?.mode === 'territory' || e.detail?.mode === 'capital') {
    setSelectedProvince(null);
   }
  };
  window.addEventListener('map-preview', handlePreview);
  return () => window.removeEventListener('map-preview', handlePreview);
 }, []);

 const svgRef = useRef<SVGSVGElement>(null);

 useEffect(() => {
  // Direct import prevents a missing static resource from returning Vite's HTML fallback.
  setGeoData((mapGeoData as any)?.features ? (mapGeoData as any) : DEFAULT_WORLD_GEOJSON);
 }, []);

 const width = 900;
 const height = 500;

 // D3 Geo Projection for Pixel Coordinates
 const projection = useMemo(() => {
  if (!geoData) {
   return d3Geo.geoIdentity().translate([width / 2, height / 2]);
  }
  return d3Geo
   .geoIdentity()
   .reflectY(true)
   .fitSize([width, height], geoData);
 }, [width, height, geoData]);

 const pathGenerator = useMemo(() => {
  return d3Geo.geoPath().projection(projection);
 }, [projection]);

 const [clickedConstructionProvinces, setClickedConstructionProvinces] = useState<Set<string>>(new Set());

 // Ephemeral warning shown when a player tries to claim an already-occupied province.
 const [occupiedWarning, setOccupiedWarning] = useState<string | null>(null);
 const occupiedWarningTimer = useRef<number | null>(null);
 useEffect(() => () => {
  if (occupiedWarningTimer.current) window.clearTimeout(occupiedWarningTimer.current);
 }, []);

 useEffect(() => {
  setClickedConstructionProvinces(new Set());
 }, [constructionPlacementBuilding]);

 const containerRef = useRef<HTMLDivElement>(null);
 const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 900, height: 500 });

 useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver((entries) => {
   for (const entry of entries) {
    if (entry.contentRect.width && entry.contentRect.height) {
     setContainerSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
     });
    }
   }
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
 }, []);

 function ensureFeatureRingsClosed(feature: any): any {
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

// Pre-calculate all 1000+ path strings ONCE for instant 60fps rendering
 const precalculatedFeatures = useMemo(() => {
  if (!geoData?.features || !pathGenerator) return [];
  return geoData.features
   .map((rawFeature: any, idx: number) => {
    const feature = ensureFeatureRingsClosed(rawFeature);
    const pathD = pathGenerator(feature);
    if (!pathD) return null;
    const stateId = feature.properties?.stateId ?? feature.properties?.id ?? idx;
    const rawName = feature.properties?.name || '';
    const name = getProvinceChineseName(rawName, stateId) || rawName || `地块 #${stateId}`;
    const centroid = getFeaturePixelCenter(feature, pathGenerator, projection);
    const bounds = pathGenerator.bounds(feature);
    const area = Math.abs(pathGenerator.area(feature));
    return {
     feature,
     idx,
     pathD,
     stateId,
     name,
     properties: feature.properties || {},
     centroid,
     bounds,
     area,
    };
   })
   .filter(Boolean) as {
    feature: any;
    idx: number;
    pathD: string;
    stateId: any;
    name: string;
    properties: any;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
   }[];
 }, [geoData, pathGenerator, projection]);

 const hoveredFeature = useMemo(() => {
  if (hoveredProvinceId === null && !hoveredProvinceData) return null;
  return precalculatedFeatures.find(
   (f) =>
    (hoveredProvinceId !== null && String(f.stateId) === String(hoveredProvinceId)) ||
    (hoveredProvinceData?.name &&
     String(f.name).trim().toLowerCase() === String(hoveredProvinceData.name).trim().toLowerCase())
  );
 }, [hoveredProvinceId, hoveredProvinceData, precalculatedFeatures]);

 const hoveredScreenPos = useMemo(() => {
  if (!hoveredFeature || !hoveredFeature.centroid) return null;
  const [cx, cy] = hoveredFeature.centroid;
  return {
   x: cx * zoom + pan.x,
   y: cy * zoom + pan.y,
  };
 }, [hoveredFeature, zoom, pan]);

 const [isPinching, setIsPinching] = useState(false);
 const pinchStartDistRef = useRef<number | null>(null);
 const dragStartCoordRef = useRef<{ x: number; y: number } | null>(null);
 const hasDraggedRef = useRef<boolean>(false);
 const wheelFrameRef = useRef<number | null>(null);
 const wheelRatioRef = useRef(1);
 const wheelPointRef = useRef<{ x: number; y: number } | null>(null);

 useEffect(() => () => {
  if (wheelFrameRef.current !== null) cancelAnimationFrame(wheelFrameRef.current);
 }, []);

 const getSvgPoint = (clientX: number, clientY: number) => {
  if (!svgRef.current) return { x: clientX, y: clientY };
  const svg = svgRef.current;
  let pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
   pt = pt.matrixTransform(ctm.inverse());
  }
  return { x: pt.x, y: pt.y };
 };

 const applyZoom = (zoomRatio: number, clientX?: number, clientY?: number) => {
  setView((prevView) => {
   const clampedZoom = Math.min(Math.max(prevView.zoom * zoomRatio, 0.2), 40);
   if (clampedZoom === prevView.zoom) return prevView;

   let svgX = width / 2;
   let svgY = height / 2;

   if (svgRef.current) {
    if (clientX !== undefined && clientY !== undefined) {
     const pt = getSvgPoint(clientX, clientY);
     svgX = pt.x;
     svgY = pt.y;
    } else {
     const rect = svgRef.current.getBoundingClientRect();
     const pt = getSvgPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
     svgX = pt.x;
     svgY = pt.y;
    }
   }

   return {
    zoom: clampedZoom,
    pan: {
     x: svgX - (svgX - prevView.pan.x) * (clampedZoom / prevView.zoom),
     y: svgY - (svgY - prevView.pan.y) * (clampedZoom / prevView.zoom),
    },
   };
  });
 };

 const handleTouchStart = (e: React.TouchEvent) => {
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, button, input, select, textarea')) {
   return;
  }

  if (e.touches.length === 1) {
   setIsDragging(true);
   dragStartCoordRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
   hasDraggedRef.current = false;
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setDragStart({ x: pt.x - pan.x, y: pt.y - pan.y });
  } else if (e.touches.length === 2) {
   setIsDragging(false);
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   pinchStartDistRef.current = dist;
   setIsPinching(true);
  }
 };

 const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 1 && isDragging) {
   if (dragStartCoordRef.current) {
    const dist = Math.hypot(
     e.touches[0].clientX - dragStartCoordRef.current.x,
     e.touches[0].clientY - dragStartCoordRef.current.y
    );
    if (dist > 6) {
     hasDraggedRef.current = true;
    }
   }
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setView((prev) => ({
    ...prev,
    pan: { x: pt.x - dragStart.x, y: pt.y - dragStart.y },
   }));
  } else if (e.touches.length === 2 && isPinching && pinchStartDistRef.current) {
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   const ratio = dist / pinchStartDistRef.current;
   if (Math.abs(ratio - 1) > 0.02) {
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    applyZoom(ratio, midX, midY);
    pinchStartDistRef.current = dist;
   }
  }
 };

 const handleTouchEnd = () => {
  setIsDragging(false);
  setIsPinching(false);
  pinchStartDistRef.current = null;
  setTimeout(() => {
   hasDraggedRef.current = false;
   dragStartCoordRef.current = null;
  }, 120);
 };

 const handleMouseDown = (e: React.MouseEvent) => {
  if (e.button !== 0) return;
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, button, input, select, textarea')) {
   return;
  }
  setIsDragging(true);
  dragStartCoordRef.current = { x: e.clientX, y: e.clientY };
  hasDraggedRef.current = false;
  const pt = getSvgPoint(e.clientX, e.clientY);
  setDragStart({ x: pt.x - pan.x, y: pt.y - pan.y });
 };

 const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging) return;
  if (dragStartCoordRef.current) {
   const dist = Math.hypot(
    e.clientX - dragStartCoordRef.current.x,
    e.clientY - dragStartCoordRef.current.y
   );
   if (dist > 6) {
    hasDraggedRef.current = true;
   }
  }
  const pt = getSvgPoint(e.clientX, e.clientY);
  setView((prev) => ({
   ...prev,
   pan: { x: pt.x - dragStart.x, y: pt.y - dragStart.y },
  }));
 };

 const handleMouseUp = () => {
  setIsDragging(false);
  setTimeout(() => {
   hasDraggedRef.current = false;
   dragStartCoordRef.current = null;
  }, 120);
 };

 const handleWheel = (e: React.WheelEvent) => {
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, .overflow-y-auto, .overflow-x-auto')) {
   return;
  }
  e.preventDefault();
  // Trackpads can dispatch far more wheel events than the display can paint. Coalesce their
  // camera updates to one requestAnimationFrame while preserving the accumulated zoom amount.
  wheelRatioRef.current *= e.deltaY < 0 ? 1.15 : 0.85;
  wheelPointRef.current = { x: e.clientX, y: e.clientY };
  if (wheelFrameRef.current !== null) return;
  wheelFrameRef.current = requestAnimationFrame(() => {
   const point = wheelPointRef.current;
   const ratio = wheelRatioRef.current;
   wheelFrameRef.current = null;
   wheelRatioRef.current = 1;
   if (point) applyZoom(ratio, point.x, point.y);
  });
 };

 const handleResetView = () => {
  setView(DEFAULT_EUROPE_VIEW);
 };

 const handleNationJump = (nation: Nation) => {
  const pt = findNationCapitalPoint(nation, geoData, pathGenerator, projection, width, height);
  const targetX = pt.x;
  const targetY = pt.y;

  const targetZoom = 3.5;
  setView({
   zoom: targetZoom,
   pan: {
    x: width / 2 - targetX * targetZoom,
    y: height / 2 - targetY * targetZoom,
   },
  });
 };

 useEffect(() => {
  if (targetNationToFocus) {
   handleNationJump(targetNationToFocus);
   clearTargetNationFocus?.();
  }
 }, [targetNationToFocus]);

 // Province ownership map
 const provinceOwnership = useMemo(() => {
  const map = new Map<number | string, Nation>();
  nations.forEach((nation) => {
   (nation.provinces || []).forEach((prov) => {
    if (prov.id) map.set(prov.id, nation);
    if (prov.name) map.set(prov.name, nation);
   });
  });
  return map;
 }, [nations]);

 // 已正式部署的陆军以省份为锚点；训练中与待部署单位不显示在世界地图上。
 const armyProvinceMarkers = useMemo(() => {
  const featureByKey = new Map<string, { centroid: [number, number] | null }>();
  precalculatedFeatures.forEach((feature) => {
   featureByKey.set(String(feature.stateId), feature);
   featureByKey.set(String(feature.name).trim().toLowerCase(), feature);
   if (feature.properties?.originalName) {
    featureByKey.set(String(feature.properties.originalName).trim().toLowerCase(), feature);
   }
  });
  const grouped = new Map<string, { x: number; y: number; divisionCount: number; fightingCount: number; nationName: string }>();

  nations.forEach((nation) => {
   (nation.army?.divisions || []).forEach((division) => {
    if (division.status === 'training' || division.status === 'deploying' || !division.provinceId) return;
    const feature = featureByKey.get(String(division.provinceId)) || featureByKey.get(String(division.provinceName).trim().toLowerCase());
    if (!feature?.centroid) return;
    const key = `${nation.id}:${String(division.provinceId)}`;
    const current = grouped.get(key);
    if (current) {
     current.divisionCount += 1;
     if (division.status === 'fighting') current.fightingCount += 1;
     return;
    }
    grouped.set(key, {
     x: feature.centroid[0],
     y: feature.centroid[1],
     divisionCount: 1,
     fightingCount: division.status === 'fighting' ? 1 : 0,
     nationName: nation.name,
    });
   });
  });
  return [...grouped.values()];
 }, [nations, precalculatedFeatures]);

 const previewedIdsSet = useMemo(() => {
  if (previewState?.mode !== 'territory' || !Array.isArray(previewState.provinces)) {
   return new Set<string>();
  }
  return new Set(previewState.provinces.map((p: any) => String(p.id)));
 }, [previewState]);

 // Nation markers with accurate centroid calculation
 const nationMarkers = useMemo(() => {
  return nations
   .map((nation) => {
    const pt = findNationCapitalPoint(nation, geoData, pathGenerator, projection, width, height);
    return {
     nation,
     x: pt.x,
     y: pt.y,
     provinceName: pt.provinceName,
    };
   })
   .filter(Boolean) as Array<{ nation: Nation; x: number; y: number; provinceName?: string }>;
 }, [nations, geoData, pathGenerator, projection, width, height]);

 // Adaptive Country Label System (HOI4 Grand Strategy Cartographic Labels)
 const countryLabels = useMemo(() => {
  return computeDynamicCountryLabels(
   nations,
   precalculatedFeatures,
   provinceOwnership,
   projection,
   zoom
  );
 }, [nations, precalculatedFeatures, provinceOwnership, projection, zoom]);

 // HOI4-Style Layered 3D Sovereign National Borders
 const nationalBorders = useMemo(() => {
  return computeNationalBorders(
   nations,
   precalculatedFeatures,
   provinceOwnership,
   projection
  );
 }, [nations, precalculatedFeatures, provinceOwnership, projection]);

 // 战区集团军编制与战术进攻矛头推演态势
 const [armyGroupPosture, setArmyGroupPosture] = useState<'aggressive' | 'balanced' | 'defensive'>('balanced');
 const [activeOffensiveLaunched, setActiveOffensiveLaunched] = useState<boolean>(false);

 // 提取计算当前所有的交战双方真实接壤边境与前线特效数据 (True Border Contact Zones & Combat Frontlines)
 const activeFrontlines = useMemo(() => {
  const lines: Array<{
   id: string;
   attackerNation: Nation;
   defenderNation: Nation;
   isLandBorder: boolean;
   frontlineProvinceIds: string[];
   contactPairs: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    midX: number;
    midY: number;
   }>;
   focusPos: { x: number; y: number };
   isPlayerInvolved: boolean;
   isPlayerAttacker: boolean;
   attackerDivisions: number;
   defenderDivisions: number;
  }> = [];

  if (!nations || nations.length === 0) return lines;
  const mapIdx = initMapIndex();
  const adj = mapIdx.adjacencyMap;

  // 建立国家拥有的省份列表快速索引
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

  const linesByPair = new Map<string, (typeof lines)[number]>();

  nations.forEach((nation) => {
   if (!nation.activeWars || nation.activeWars.length === 0) return;
   nation.activeWars.forEach((war) => {
    const defender = nations.find((n) => n.id === war.withNationId);
    if (!defender) return;

    const pairId = [nation.id, defender.id].sort().join('::');
    if (linesByPair.has(pairId)) return;

    const provsA = provincesByNation.get(nation.id) || [];
    const provsB = provincesByNation.get(defender.id) || [];
    if (provsA.length === 0 || provsB.length === 0) return;

    const provsBMap = new Map<string, (typeof provsB)[number]>();
    provsB.forEach((p) => {
     provsBMap.set(String(p.stateId), p);
     if (p.name) provsBMap.set(String(p.name).trim().toLowerCase(), p);
    });

    const frontlineProvinceSet = new Set<string>();
    const contactPairs: Array<{
     fromX: number;
     fromY: number;
     toX: number;
     toY: number;
     midX: number;
     midY: number;
    }> = [];

    provsA.forEach((pa) => {
     if (!pa.centroid) return;
     const neighbors = adj.get(String(pa.stateId));
     if (!neighbors) return;
     neighbors.forEach((nbrId) => {
      const pb = provsBMap.get(nbrId);
      if (pb && pb.centroid) {
       frontlineProvinceSet.add(String(pa.stateId));
       frontlineProvinceSet.add(String(pb.stateId));
       contactPairs.push({
        fromX: pa.centroid[0],
        fromY: pa.centroid[1],
        toX: pb.centroid[0],
        toY: pb.centroid[1],
        midX: (pa.centroid[0] + pb.centroid[0]) / 2,
        midY: (pa.centroid[1] + pb.centroid[1]) / 2,
       });
      }
     });
    });

    const isLandBorder = contactPairs.length > 0;
    let focusPos = { x: 0, y: 0 };

    if (isLandBorder) {
     const sumX = contactPairs.reduce((acc, c) => acc + c.midX, 0);
     const sumY = contactPairs.reduce((acc, c) => acc + c.midY, 0);
     focusPos = { x: sumX / contactPairs.length, y: sumY / contactPairs.length };
    } else {
     // 双方无直接陆地接壤（跨海或远征战争）：寻找距离最近的一对沿海前哨领土
     let minDist = Infinity;
     let bestA = provsA[0];
     let bestB = provsB[0];
     for (const pa of provsA) {
      if (!pa.centroid) continue;
      for (const pb of provsB) {
       if (!pb.centroid) continue;
       const d = Math.hypot(pa.centroid[0] - pb.centroid[0], pa.centroid[1] - pb.centroid[1]);
       if (d < minDist) {
        minDist = d;
        bestA = pa;
        bestB = pb;
       }
      }
     }
     if (bestA?.centroid && bestB?.centroid) {
      frontlineProvinceSet.add(String(bestA.stateId));
      frontlineProvinceSet.add(String(bestB.stateId));
      contactPairs.push({
       fromX: bestA.centroid[0],
       fromY: bestA.centroid[1],
       toX: bestB.centroid[0],
       toY: bestB.centroid[1],
       midX: (bestA.centroid[0] + bestB.centroid[0]) / 2,
       midY: (bestA.centroid[1] + bestB.centroid[1]) / 2,
      });
      focusPos = {
       x: (bestA.centroid[0] + bestB.centroid[0]) / 2,
       y: (bestA.centroid[1] + bestB.centroid[1]) / 2,
      };
     }
    }

    const isPlayerInvolved = Boolean(
     myNation && (nation.id === myNation.id || defender.id === myNation.id)
    );
    const isPlayerAttacker = Boolean(myNation && nation.id === myNation.id);

    const candidate = {
     id: pairId,
     attackerNation: nation,
     defenderNation: defender,
     isLandBorder,
     frontlineProvinceIds: Array.from(frontlineProvinceSet),
     contactPairs: contactPairs.slice(0, 12),
     focusPos,
     isPlayerInvolved,
     isPlayerAttacker,
     attackerDivisions: Math.max(12, Math.round(nation.territory.split(',').length * 4)),
     defenderDivisions: Math.max(8, Math.round(defender.territory.split(',').length * 3.5)),
    };

    linesByPair.set(pairId, candidate);
   });
  });

  return [...linesByPair.values()].sort((a, b) => {
   if (a.isPlayerInvolved !== b.isPlayerInvolved) return a.isPlayerInvolved ? -1 : 1;
   return a.id.localeCompare(b.id);
  });
 }, [nations, precalculatedFeatures, provinceOwnership, myNation]);

 // 地图默认保留优先战线，前线特效在接壤边境与省份边界上集中呈现
 const displayedFrontlines = useMemo(() => {
  const relevant = mapMode === 'military'
   ? activeFrontlines
   : activeFrontlines.filter((front) => front.isPlayerInvolved || activeFrontlines.length <= 6);
  return relevant.slice(0, mapMode === 'military' ? 10 : 6);
 }, [activeFrontlines, mapMode]);

 // Avoid O(provinces × (queue + owned provinces)) work during every zoom frame.
 // The map paths read this indexed snapshot, so only genuine construction changes rebuild it.
 const constructionByProvince = useMemo(() => {
  const result = new Map<string, { isMyProvince: boolean; isQueued: boolean; percent: number }>();
  if (!myNation) return result;
  const ownByKey = new Map<string, any>();
  (myNation.provinces || []).forEach((province) => {
   if (province.id !== undefined && province.id !== null) ownByKey.set(String(province.id), province);
   if (province.name) ownByKey.set(String(province.name).trim().toLowerCase(), province);
  });
  const queuedKeys = new Set<string>();
  if (constructionPlacementBuilding) {
   (myNation.constructionQueue || []).forEach((queue) => {
    if (queue.buildingType !== constructionPlacementBuilding) return;
    if (queue.provinceId !== undefined && queue.provinceId !== null) queuedKeys.add(String(queue.provinceId));
    if (queue.provinceName) queuedKeys.add(String(queue.provinceName).trim().toLowerCase());
   });
  }
  precalculatedFeatures.forEach(({ stateId, name }) => {
   const idKey = String(stateId);
   const nameKey = String(name).trim().toLowerCase();
   const province = ownByKey.get(idKey) || ownByKey.get(nameKey);
   if (!province) return;
   const percent = constructionPlacementBuilding
    ? getBuildingLevelAndPercentage(constructionPlacementBuilding, province.detailedBuildings || {}, myNation.radarTech || 'decimeter').percent
    : 0;
   result.set(idKey, { isMyProvince: true, isQueued: queuedKeys.has(idKey) || queuedKeys.has(nameKey), percent });
  });
  return result;
 }, [constructionPlacementBuilding, myNation, precalculatedFeatures]);

 const handleProvinceHover = useCallback((id: any, props: any) => {
  setHoveredProvinceId(id);
  setHoveredProvinceData(props);
 }, []);

 const handleProvinceUnhover = useCallback(() => {
  setHoveredProvinceId(null);
  setHoveredProvinceData(null);
 }, []);

 const handleProvinceClick = useCallback((id: any, name: string, properties: any) => {
  // If the user was dragging/panning the map, ignore the click
  if (hasDraggedRef.current) return;

  const ownerNation = provinceOwnership.get(id) || provinceOwnership.get(name) || null;

  // First-come-first-served: while selecting territory/capital for a new nation,
  // block provinces already owned by another nation and warn the player.
  const isSelectingForCreation = previewState?.mode === 'territory' || previewState?.mode === 'capital';
  const isOwnedByOther = ownerNation && (!myNation || ownerNation.id !== myNation.id);
  if (isSelectingForCreation && isOwnedByOther) {
   setOccupiedWarning(`省份【${name}】已被【${ownerNation!.name}】占领,先来后到,请另选未被占领的疆域!`);
   if (occupiedWarningTimer.current) window.clearTimeout(occupiedWarningTimer.current);
   occupiedWarningTimer.current = window.setTimeout(() => setOccupiedWarning(null), 3500);
   return;
  }

  // 建国初始领土相邻判定：
  // 当已有选定初始省份时，点击的新省份必须与当前已选领土（所有已圈选省份）相邻连通（已选省份点击则为取消选中）
  if (previewState?.mode === 'territory' && previewState.provinces && previewState.provinces.length > 0) {
   const isAlreadySelected = previewState.provinces.some(
    (p) => String(p.id) === String(id) || (p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase())
   );
   if (!isAlreadySelected) {
    const isAdjacent = isProvinceAdjacentToNation(id, previewState.provinces, name) || isProvinceAdjacentToNation(name, previewState.provinces);
    if (!isAdjacent) {
     setOccupiedWarning(`建国判定：省份【${name}】与当前已选领土不相邻！建国省份必须相邻连通。`);
     if (occupiedWarningTimer.current) window.clearTimeout(occupiedWarningTimer.current);
     occupiedWarningTimer.current = window.setTimeout(() => setOccupiedWarning(null), 3500);
     return;
    }
   }
  }

  // Peaceful expansion mode click handler
  if (isPeacefulExpansion) {
   if (!myNation) {
    setExpansionError('您尚未创建或统治国家，无法执行和平扩张');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (isTodayUsed(myNation.lastPeaceExpansionAt, myNation.peaceExpansionCount)) {
    setExpansionError('今日和平扩张次数已用完，请于明日再试');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   const isMine = (myNation.provinces || []).some(
    (p) => String(p.id) === String(id) || (p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase())
   );
   if (isMine) {
    setExpansionError('该省份已经属于你的国家');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (ownerNation && ownerNation.id !== myNation.id) {
    setExpansionError(`无法通过和平扩张获得其他国家【${ownerNation.name}】的领土`);
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   const isAdjacent = isProvinceAdjacentToNation(id, myNation.provinces || [], name) || isProvinceAdjacentToNation(name, myNation.provinces || []);
   if (!isAdjacent) {
    setExpansionError('和平扩张必须与本国现有领土相邻接壤，该省份不满足接壤条件');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }

   setIsExpanding(true);
   api.nations.peaceExpansion({ provinceId: id, provinceName: name })
    .then((res: any) => {
     setIsPeacefulExpansion(false);
     if (res?.nation) {
      window.dispatchEvent(new CustomEvent('nation-updated', { detail: { nation: res.nation } }));
     }
     setExpansionSuccessData({
      provinceName: res?.province?.name || name,
      isCore: Boolean(res?.province?.isCore),
     });
    })
    .catch((err: any) => {
     setExpansionError(err.message || '和平扩张失败');
     setTimeout(() => setExpansionError(null), 4000);
    })
    .finally(() => {
     setIsExpanding(false);
    });
   return;
  }
  
  if (id && name) {
   const event = new CustomEvent('map-province-click', {
    detail: { id, name, properties },
   });
   window.dispatchEvent(event);
  }

  if (constructionPlacementBuilding && onBuildInProvince) {
   if (ownerNation && myNation && ownerNation.id === myNation.id) {
    setClickedConstructionProvinces((prev) => {
     const next = new Set(prev);
     if (id !== undefined && id !== null) next.add(String(id));
     if (name) next.add(String(name).trim().toLowerCase());
     return next;
    });
    onBuildInProvince(id, name, constructionPlacementBuilding);
   }
   return;
  }

  // Do NOT open province details card when selecting territory or choosing capital during nation creation
  if (previewState?.mode === 'territory' || previewState?.mode === 'capital') {
   return;
  }

  // Set selected province so detailed panel opens with all construction & garrison data
  setSelectedProvince({
   id,
   name,
   properties,
   ownerNation,
  });
 }, [constructionPlacementBuilding, isPeacefulExpansion, myNation, onBuildInProvince, previewState, provinceOwnership]);

 const validExpansionIds = useMemo(() => {
  if (!isPeacefulExpansion || !myNation) return new Set<string>();
  return getValidExpansionProvinceIds(myNation, nations);
 }, [isPeacefulExpansion, myNation, nations]);

 const validCreationIds = useMemo(() => {
  if (previewState?.mode !== 'territory') {
   return null;
  }
  return getValidCreationProvinceIds(previewState.provinces || [], nations);
 }, [previewState?.mode, previewState?.provinces, nations]);

 // Keep the 1000+ province React subtree referentially stable while the camera changes.
 // SVG then only receives a transform update; province prop comparison/reconciliation is skipped per zoom tick.
 const provincePathElements = useMemo(() => precalculatedFeatures.map((item) => {
 const { stateId, pathD, name, properties, idx } = item;
 const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
 const isPreviewed = previewedIdsSet.has(String(stateId));
 const isCapitalPreview =
  previewState?.mode === 'capital' &&
  previewState?.capital &&
  (String(name) === String(previewState.capital) ||
   String(stateId) === String(previewState.capital));
 const isHovered =
  hoveredProvinceId !== null && String(hoveredProvinceId) === String(stateId);
 const isSelected = Boolean(
  selectedProvince &&
   (String(selectedProvince.id) === String(stateId) ||
    String(selectedProvince.name) === String(name))
 );

 const constructionSnapshot = constructionByProvince.get(String(stateId));
 const isMyProvince = Boolean(myNation && ownerNation?.id === myNation.id && constructionSnapshot?.isMyProvince);
 const isConstructionMode = Boolean(constructionPlacementBuilding);
 const constructionColor = constructionPlacementBuilding
  ? STRATEGIC_BUILDINGS[constructionPlacementBuilding]?.color
  : undefined;
 const isClicked =
  clickedConstructionProvinces.has(String(stateId)) ||
  clickedConstructionProvinces.has(String(name).trim().toLowerCase());
 const isUnderConstruction = Boolean(constructionSnapshot?.isQueued) || isClicked;
 const provPercent = constructionSnapshot?.percent || 0;
 const constructionHeatColor = getConstructionHeatmapColor(provPercent, constructionColor);

 const provinceRecord = ownerNation?.provinces?.find(
  (p) => String(p.id) === String(stateId) || (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
 );
 const isNonCore = Boolean(ownerNation && provinceRecord && provinceRecord.isCore === false);
 const isValidExpansionTarget = Boolean(
  isPeacefulExpansion &&
  (validExpansionIds.has(String(stateId)) || validExpansionIds.has(String(name).trim().toLowerCase()))
 );
 const isCreationMode = previewState?.mode === 'territory';
 const isValidCreationTarget = Boolean(
  validCreationIds &&
  (validCreationIds.has(String(stateId)) ||
   validCreationIds.has(String(name).trim().toLowerCase()) ||
   (properties?.name && validCreationIds.has(String(properties.name).trim().toLowerCase())))
 );

 return (
  <MemoizedProvincePath
   key={`prov-${stateId ?? idx}`}
   pathD={pathD}
   stateId={stateId}
   name={name}
   properties={properties}
   ownerNation={ownerNation}
   isPreviewed={isPreviewed}
   isCapitalPreview={Boolean(isCapitalPreview)}
   previewFlagColor={previewState?.flagColor}
   isHovered={isHovered}
   isSelected={isSelected}
   mapTheme={mapTheme}
   themeConfig={currentTheme}
   isMyProvince={isMyProvince}
   isConstructionMode={isConstructionMode}
   isUnderConstruction={isUnderConstruction}
   constructionPercent={provPercent}
   constructionHeatColor={constructionHeatColor}
   constructionColor={constructionColor}
   mapMode={mapMode}
   isPeacefulExpansionMode={isPeacefulExpansion}
   isValidExpansionTarget={isValidExpansionTarget}
   isCreationMode={isCreationMode}
   isValidCreationTarget={isValidCreationTarget}
   isNonCore={isNonCore}
   onHover={handleProvinceHover}
   onUnhover={handleProvinceUnhover}
   onClick={handleProvinceClick}
  />
 ); }), [
  clickedConstructionProvinces,
  constructionByProvince,
  constructionPlacementBuilding,
  currentTheme,
  handleProvinceClick,
  handleProvinceHover,
  handleProvinceUnhover,
  hoveredProvinceId,
  isPeacefulExpansion,
  mapMode,
  mapTheme,
  myNation,
  precalculatedFeatures,
  previewState,
  previewedIdsSet,
  provinceOwnership,
  selectedProvince,
  validExpansionIds,
  validCreationIds,
 ]);

 return (
  <div
   id="world-map-container"
   ref={containerRef}
   className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
   style={{
    backgroundColor: currentTheme.containerBg,
    transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
   }}
  >
   {/* Occupied-province warning (first-come-first-served) */}
   <AnimatePresence>
    {occupiedWarning && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-md bg-rose-950/95 text-rose-50 backdrop-blur-xl border border-rose-500/60 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 text-sm font-semibold pointer-events-auto"
     >
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
      <span className="leading-snug">{occupiedWarning}</span>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Expansion Error Toast */}
   <AnimatePresence>
    {expansionError && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-md bg-rose-950/95 text-rose-50 backdrop-blur-xl border border-rose-500/60 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2.5 text-xs font-bold pointer-events-auto"
     >
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
      <span className="leading-snug">{expansionError}</span>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Tactical Top Construction Placement Planning Banner */}
   <AnimatePresence>
    {constructionPlacementBuilding && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-2xl bg-slate-950/95 text-white backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto"
     >
      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
       <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md"
        style={{
         backgroundColor: `${STRATEGIC_BUILDINGS[constructionPlacementBuilding].color}25`,
         borderColor: STRATEGIC_BUILDINGS[constructionPlacementBuilding].color,
         color: STRATEGIC_BUILDINGS[constructionPlacementBuilding].color,
        }}
       >
        <Hammer className="w-5 h-5 animate-pulse" />
       </div>
       <div className="min-w-0">
        <div className="flex items-center gap-2">
         <span className="text-xs font-black text-amber-400">地图建造规划:</span>
         <strong className="text-sm font-black text-white truncate">
          {STRATEGIC_BUILDINGS[constructionPlacementBuilding].name}
         </strong>
         <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
          {STRATEGIC_BUILDINGS[constructionPlacementBuilding].costFormulaDescription}
         </span>
        </div>
        <p className="text-[11px] text-slate-300 truncate mt-0.5">
         请在地图上点击属于【{myNation?.name || '您'}】的高亮主权省份以加入建造队列
        </p>
       </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
       {onOpenConstruction && (
        <button
         type="button"
         onClick={onOpenConstruction}
         className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
        >
         切换工程
        </button>
       )}
       {onCancelConstructionPlacement && (
        <button
         type="button"
         onClick={onCancelConstructionPlacement}
         className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
        >
         <span>退出选点</span>
        </button>
       )}
      </div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* TOP COMMAND HUD: 日期 → 核心行动 → 国家资源 */}
   <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-3.5 sm:right-3.5 z-30 flex items-center justify-between pointer-events-none gap-2">
    {/* Left: Campaign Clock + Strategic Action Modules (嵌入式大战略 HUD) */}
    <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
     {/* Campaign Date & Threat Status Instrument Module */}
     <div className="px-2.5 py-1 rounded bg-slate-950/85 text-slate-100 border border-white/10 backdrop-blur-md shadow flex flex-col justify-center shrink-0 select-none">
      <div className="flex items-center gap-1.5 leading-none">
       <Clock3 className="h-3 w-3 shrink-0 text-amber-400/90" />
       <time className="font-mono text-xs font-black tracking-tight tabular-nums text-white leading-none">
        {worldClockStart ? formatCampaignTime(worldClockStart, campaignNow) : '1936.01.01'}
       </time>
      </div>
      <div className="flex items-center gap-1 mt-0.5 leading-none">
       <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
         myNation?.activeWars && myNation.activeWars.length > 0
          ? 'bg-rose-500 animate-pulse'
          : 'bg-emerald-400'
        }`}
       />
       <span className="text-[9px] text-slate-400 font-sans tracking-wide leading-none select-none">
        {myNation?.activeWars && myNation.activeWars.length > 0 ? '战时紧急' : '和平时期'}
       </span>
      </div>
     </div>

     {/* HUD System Module 1: Army (陆军) */}
     {onOpenArmyCommand && (
      <button
       id="map-army-command-btn"
       type="button"
       onClick={(e) => {
        e.stopPropagation();
        onOpenArmyCommand();
       }}
       className="px-2.5 py-1 rounded bg-slate-950/80 hover:bg-rose-950/40 text-rose-100 border border-rose-500/25 backdrop-blur-md shadow flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer group active:scale-95"
       title="进入陆军最高指挥部"
      >
       <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
       <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] text-rose-300/80 font-semibold tracking-wider leading-none">
         陆军
        </span>
        <span className="font-mono text-xs font-black text-rose-100 tabular-nums mt-0.5 leading-none">
         {formattedArmyManpower}
        </span>
       </div>
      </button>
     )}

     {/* HUD System Module 2: Construction (建设) */}
     {onOpenConstruction && (
      <button
       id="map-floating-construction-btn"
       type="button"
       onClick={(e) => {
        e.stopPropagation();
        onOpenConstruction();
       }}
       className="px-2.5 py-1 rounded bg-slate-950/80 hover:bg-amber-950/40 text-amber-100 border border-amber-500/25 backdrop-blur-md shadow flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer group active:scale-95"
       title="进入国家战略筑造中心"
      >
       <Hammer className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
       <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] text-amber-300/80 font-semibold tracking-wider leading-none">
         建设
        </span>
        <span className="font-mono text-xs font-black text-amber-100 tabular-nums mt-0.5 leading-none">
         {totalCivFactories}
        </span>
       </div>
      </button>
     )}

     {/* HUD System Module 3: Strategic Resources (战略资源) */}
     {onOpenResources && (
      <button
       id="map-floating-resources-btn"
       type="button"
       onClick={(e) => {
        e.stopPropagation();
        onOpenResources();
       }}
       className="px-2.5 py-1 rounded bg-slate-950/80 hover:bg-sky-950/40 text-sky-100 border border-sky-500/25 backdrop-blur-md shadow flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer group active:scale-95"
       title="进入国家战略资源储备中枢"
      >
       <Boxes className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
       <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] text-sky-300/80 font-semibold tracking-wider leading-none">
         战略资源
        </span>
        <span className="font-mono text-xs font-black text-sky-100 tabular-nums mt-0.5 leading-none">
         {Object.values(calculateNationResourceOverview(myNation)).reduce((s, r) => s + r.stockpile, 0).toLocaleString()}
        </span>
       </div>
      </button>
     )}
    </div>

    {/* Right: National Core Resource / Faction Power ( 5) */}
    <div className="pointer-events-auto flex items-center gap-1 shrink-0">
     <button
      type="button"
      onClick={(e) => {
       e.stopPropagation();
       setShowNationsDrawer(!showNationsDrawer);
      }}
      className={`px-2.5 py-1.5 rounded border backdrop-blur-md shadow flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95 ${
       showNationsDrawer
        ? 'bg-purple-950/90 border-purple-400 text-purple-100 ring-1 ring-purple-400/50'
        : 'bg-slate-950/80 hover:bg-purple-950/50 border-purple-500/25 text-purple-200 hover:border-purple-400/50'
      }`}
      title="国家战略威望与世界势力清册"
     >
      <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      <span className="font-mono text-xs font-black text-purple-100 tabular-nums leading-none">
       {nationalPrestigeOrCount}
      </span>
     </button>
    </div>
   </div>

    {/* SECONDARY ROW: Map Modes Tactical Selector (政务 / 工业 / 资源 / 人口 / 地貌 / 战线) */}
    <div className="absolute top-[44px] sm:top-[48px] left-2 sm:left-3.5 z-30 flex flex-col gap-1 max-w-[calc(100vw-4rem)] pointer-events-none">
     <div className="pointer-events-auto flex items-center p-0.5 bg-slate-950/85 text-white backdrop-blur-md border border-white/10 rounded shadow-md transition-all flex-wrap sm:flex-nowrap gap-0.5">
      {/* Tactical Map Modes List */}
      <div className="flex items-center">
       {[
        { id: 'political', label: '政务' },
        { id: 'industrial', label: '工业' },
        { id: 'resources', label: '资源' },
        { id: 'population', label: '人口' },
        { id: 'terrain', label: '地貌' },
        { id: 'military', label: '战线' },
       ].map((mode) => (
        <button
         key={mode.id}
         type="button"
         onClick={() => setMapMode(mode.id as MapModeType)}
         className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer shrink-0 relative ${
          mapMode === mode.id
           ? 'text-white after:absolute after:bottom-0 after:left-1.5 after:right-1.5 after:h-[2px] after:bg-amber-400 after:rounded-full after:shadow-[0_0_6px_rgba(251,191,36,0.6)]'
           : 'text-slate-400 hover:text-slate-200'
         }`}
        >
         {mode.label}
        </button>
       ))}
      </div>

     {/* Integrated Peaceful Expansion Status Module */}
     <AnimatePresence>
      {isPeacefulExpansion && (
       <motion.div
        key="hud-peaceful-expansion-segment"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="flex items-center gap-1.5 pl-2 border-l border-white/15 shrink-0"
       >
        <div className="flex items-center gap-1 shrink-0">
         <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
         </span>
         <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">
          和平扩张
         </span>
        </div>

        {/* Limit/Adjacency Info Badge */}
        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium whitespace-nowrap">
         <span className="font-mono font-bold">1次/日</span>
         <span className="text-emerald-500">·</span>
         <span>与本土接壤</span>
        </div>

        {/* Collapsible Info Button (ⓘ) */}
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          setShowExpansionInfo((prev) => !prev);
         }}
         className={`p-1 rounded transition cursor-pointer flex items-center justify-center shrink-0 ${
          showExpansionInfo
           ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60'
           : 'text-slate-400 hover:text-white hover:bg-white/10'
         }`}
         title={showExpansionInfo ? '收起说明' : '点击查看详细操作说明'}
        >
         <Info className="w-3.5 h-3.5" />
        </button>

        {/* Compact Exit Button */}
        <button
         type="button"
         disabled={isExpanding}
         onClick={(e) => {
          e.stopPropagation();
          setIsPeacefulExpansion(false);
          setShowExpansionInfo(false);
         }}
         className="flex items-center gap-1 px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
         title="退出和平扩张模式"
        >
         {isExpanding ? (
          <Compass className="w-3 h-3 animate-spin text-emerald-400" />
         ) : (
          <X className="w-3 h-3 text-rose-400" />
         )}
         <span>{isExpanding ? '签署中...' : '退出'}</span>
        </button>
       </motion.div>
      )}
     </AnimatePresence>
    </div>

    {/* Expandable Instruction Tooltip Card */}
    <AnimatePresence>
     {isPeacefulExpansion && showExpansionInfo && (
      <motion.div
       initial={{ opacity: 0, y: -6, scale: 0.96 }}
       animate={{ opacity: 1, y: 0, scale: 1 }}
       exit={{ opacity: 0, y: -6, scale: 0.96 }}
       transition={{ type: 'spring', stiffness: 480, damping: 28 }}
       className="pointer-events-auto w-full max-w-sm px-3 py-2 bg-slate-950/95 text-slate-200 border border-emerald-500/40 rounded-xl shadow-2xl backdrop-blur-xl text-left text-xs leading-relaxed"
      >
       <div className="flex items-center justify-between font-bold text-emerald-400 mb-1 text-[11px]">
        <span>和平领土归并指引</span>
        <button
         type="button"
         onClick={() => setShowExpansionInfo(false)}
         className="text-slate-400 hover:text-white cursor-pointer"
        >
         <X className="w-3.5 h-3.5" />
        </button>
       </div>
       <p className="text-slate-300 text-[11px]">
        点击地图上与本国领土接壤的<span className="text-emerald-400 font-bold">绿色高亮中立省份</span>即可完成和平归并。
       </p>
       <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
        <span>每日限 1 次 · 00:00 刷新</span>
        <span className="text-emerald-400 font-mono">1/1 今日剩余</span>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {/* Population Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'population' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-slate-950/85 text-white backdrop-blur-md border border-white/10 rounded shadow text-[10px] flex-wrap"
      >
       <span className="text-slate-400 font-bold mr-0.5">人口阶梯:</span>
       {[
        { label: '<40万', color: '#a7f3d0' },
        { label: '40-90万', color: '#34d399' },
        { label: '90-180万', color: '#10b981' },
        { label: '180-350万', color: '#059669' },
        { label: '350-600万', color: '#047857' },
        { label: '>600万', color: '#064e3b' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-300 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Industrial Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'industrial' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-slate-950/85 text-white backdrop-blur-md border border-white/10 rounded shadow text-[10px] flex-wrap"
      >
       <span className="text-slate-400 font-bold mr-0.5">总产能:</span>
       {[
        { label: '0 工厂', color: '#64748b' },
        { label: '1-2 工厂', color: '#d97706' },
        { label: '3-5 工厂', color: '#2563eb' },
        { label: '6+ 工厂', color: '#15803d' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-300 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Strategic Resources Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'resources' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-slate-950/85 text-white backdrop-blur-md border border-white/10 rounded shadow text-[10px] flex-wrap"
      >
       <span className="text-slate-400 font-bold mr-0.5">战略资源:</span>
       {Object.values(STRATEGIC_RESOURCES).map((res) => (
        <span key={res.id} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: res.color }} />
         <span className="text-slate-300 font-medium">{res.name}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Terrain Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'terrain' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-slate-950/85 text-white backdrop-blur-md border border-white/10 rounded shadow text-[10px] flex-wrap"
      >
       <span className="text-slate-400 font-bold mr-0.5">地形:</span>
       {[
        { label: '平原', color: '#507c49' },
        { label: '山地', color: '#6e6761' },
        { label: '丘陵', color: '#994708' },
        { label: '沙漠', color: '#b37803' },
        { label: '沼泽', color: '#13756d' },
        { label: '城市', color: '#526075' },
        { label: '森林', color: '#166534' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-300 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>
   </div>

   {/* Floating Vertical HUD Toolbar: Theme Switch + Zoom Controls */}
   <motion.div
    key="map-zoom-controls"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    transition={{
     type: 'spring',
     stiffness: 400,
     damping: 24,
     delay: 0.1,
    }}
    className="absolute top-14 right-2 sm:top-16 sm:right-3.5 z-20 flex flex-col bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-md overflow-hidden shadow-lg select-none"
   >
    {/* Theme Switcher Button */}
    <button
     id="map-theme-toggle-btn"
     type="button"
     onClick={() => {
      const nextTheme: MapVisualTheme = mapTheme === 'white' ? 'grey' : 'white';
      setMapTheme(nextTheme);
      saveMapTheme(nextTheme);
     }}
     className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95 group relative"
     title={`地图主题: ${mapTheme === 'white' ? '明亮模式 (点击切换为战术深色模式)' : '战术深色模式 (点击切换为明亮模式)'} · 350ms 平滑材质过渡`}
     aria-label="切换地图视觉主题"
    >
     {mapTheme === 'white' ? (
      <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
     ) : (
      <Moon className="w-3.5 h-3.5 text-indigo-300 group-hover:-rotate-12 transition-transform duration-300" />
     )}
    </button>
    <div className="w-full h-[1px] bg-white/10" />

    <button
     type="button"
     onClick={() => applyZoom(1.3)}
     className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:bg-white/15"
     title="放大视角 (Zoom In)"
    >
     <span className="font-mono text-xs font-bold leading-none">＋</span>
    </button>
    <div className="w-full h-[1px] bg-white/10" />
    <button
     type="button"
     onClick={() => applyZoom(0.7)}
     className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:bg-white/15"
     title="缩小视角 (Zoom Out)"
    >
     <span className="font-mono text-xs font-bold leading-none">－</span>
    </button>
    <div className="w-full h-[1px] bg-white/10" />
    <button
     type="button"
     onClick={handleResetView}
     className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:bg-white/15"
     title="重置全图中心 (Reset View)"
    >
     <RotateCcw className="w-3 h-3" />
    </button>
   </motion.div>

   {/* Main Interactive SVG Map Viewport */}
   <div
    className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onWheel={handleWheel}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    style={{ touchAction: 'none' }}
   >
    <svg
     ref={svgRef}
     viewBox={`0 0 ${width} ${height}`}
     className="w-full h-full block"
     style={{
      backgroundColor: currentTheme.ocean,
      transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      shapeRendering: 'geometricPrecision',
     }}
    >
     {/* Construction Patterns and Gradients & Spearhead Markers */}
     <defs>
      <pattern id="archival-sea-hatch" width="26" height="26" patternUnits="userSpaceOnUse">
       <path d="M 0 13 H 26 M 13 0 V 26" stroke={currentTheme.seaHatchStroke} strokeOpacity="0.4" strokeWidth="0.5" />
       <path d="M -4 24 L 24 -4 M 2 30 L 30 2" stroke={currentTheme.seaHatchStroke} strokeOpacity="0.25" strokeWidth="0.4" />
      </pattern>
      <filter id="selection-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
       <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#38bdf8" floodOpacity="0.55" />
      </filter>
      <pattern
       id="construction-green-stripes"
       width="12"
       height="12"
       patternTransform="rotate(45 0 0)"
       patternUnits="userSpaceOnUse"
      >
       <line
        x1="0"
        y1="0"
        x2="0"
        y2="12"
        stroke="#22c55e"
        strokeWidth="5"
        strokeOpacity="0.85"
       />
      </pattern>

      <pattern
       id="non-core-stripes"
       width="8"
       height="8"
       patternTransform="rotate(45 0 0)"
       patternUnits="userSpaceOnUse"
      >
       <line
        x1="0"
        y1="0"
        x2="0"
        y2="8"
        stroke={mapTheme === 'white' ? '#0f172a' : '#cbd5e1'}
        strokeWidth="2.2"
        strokeOpacity={mapTheme === 'white' ? 0.35 : 0.45}
       />
      </pattern>

      {/* Tactical Spearhead Arrow Markers */}
      <marker id="spearhead-red" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#fb7185" />
      </marker>
      <marker id="spearhead-player" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#38bdf8" />
      </marker>
      <marker id="spearhead-amber" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#fbbf24" />
      </marker>

      {/* Frontline Combat Visual FX Filters & Glows */}
      <filter id="war-frontline-glow" x="-30%" y="-30%" width="160%" height="160%">
       <feGaussianBlur stdDeviation="2.2" result="blur" />
       <feFlood floodColor="#ef4444" floodOpacity="0.85" />
       <feComposite in2="blur" operator="in" />
       <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
       </feMerge>
      </filter>
      <filter id="war-player-glow" x="-30%" y="-30%" width="160%" height="160%">
       <feGaussianBlur stdDeviation="2.5" result="blur" />
       <feFlood floodColor="#38bdf8" floodOpacity="0.9" />
       <feComposite in2="blur" operator="in" />
       <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
       </feMerge>
      </filter>

      {/* HOI4 Subtle Natural National Border Shadow */}
      <filter id="hoi4-border-subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
       <feGaussianBlur stdDeviation="0.45" />
       <feColorMatrix type="matrix" values="0 0 0 0 0.04  0 0 0 0 0.07  0 0 0 0 0.11  0 0 0 0.22 0" />
      </filter>
      <style>{`
       @keyframes warFrontlinePulse {
        0%, 100% { opacity: 0.75; stroke-width: 2.2px; }
        50% { opacity: 1; stroke-width: 3.4px; }
       }
       @keyframes warDashFlow {
        to { stroke-dashoffset: -28; }
       }
       @keyframes warRadarRipple {
        0% { r: 6; opacity: 0.9; }
        100% { r: 24; opacity: 0; }
       }
      `}</style>
     </defs>

     <rect
      width={width}
      height={height}
      fill="url(#archival-sea-hatch)"
      pointerEvents="none"
      style={{ transition: 'opacity 400ms ease' }}
     />
     {/* Main Geo Transformed Group */}
     <g
      style={{
       transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
       transformOrigin: '0 0',
       transition: isDragging || isPinching ? 'none' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
       willChange: 'transform',
      }}
     >
      {/* Coordinate Grid lines */}
      <g
       stroke={currentTheme.grid}
       strokeWidth={0.5}
       strokeDasharray="3 3"
       style={{ transition: 'stroke 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
       {[1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6].map((ratio, idx) => {
        const y = ratio * height;
        return <line key={`h-grid-${idx}`} x1={0} y1={y} x2={width} y2={y} />;
       })}
       {[1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8].map((ratio, idx) => {
        const x = ratio * width;
        return <line key={`v-grid-${idx}`} x1={x} y1={0} x2={x} y2={height} />;
       })}
      </g>

      {/* High-performance 1000+ Provinces Rendering */}
      <g id="provinces-layer">{provincePathElements}</g>

      {/* HOI4 Restrained Natural Sovereign National Borders (Single thin dark line + subtle soft shadow) */}
      <g id="hoi4-national-borders-layer" className="pointer-events-none select-none">
       {/* 1. 单一极其轻柔的暗色微扩散阴影 (Subtle Soft Outer Shadow - low opacity, embedded into terrain) */}
       {nationalBorders.map((b) => (
        <path
         key={`border-shadow-${b.nationId}`}
         d={b.outerBorderPathD}
         fill="none"
         stroke="#050a12"
         strokeWidth={1.1}
         strokeOpacity={0.18}
         filter="url(#hoi4-border-subtle-shadow)"
         strokeLinejoin="round"
         strokeLinecap="round"
        />
       ))}

       {/* 2. 单一精细国界线 (明亮模式为深色边界，深色模式为白银/亮色边界) */}
       {nationalBorders.map((b) => (
        <path
         key={`border-main-${b.nationId}`}
         d={b.outerBorderPathD}
         fill="none"
         stroke={currentTheme.countryBorder}
         strokeWidth={mapTheme === 'white' ? 0.52 : 0.65}
         strokeOpacity={mapTheme === 'white' ? 0.78 : 0.88}
         strokeLinejoin="round"
         strokeLinecap="round"
        />
       ))}
      </g>

      {/* War Frontlines Border Glow & Hazard Flow Layer (交战双方边境接壤省份特殊战火光晕与流动警戒线) */}
      {displayedFrontlines.length > 0 && (
       <g id="war-frontlines-border-layer" className="pointer-events-none">
        {displayedFrontlines.flatMap((front) => {
         return front.frontlineProvinceIds.map((pid) => {
          const feat = precalculatedFeatures.find((f) => String(f.stateId) === pid);
          if (!feat?.pathD) return null;
          const isPlayer = front.isPlayerInvolved;
          return (
           <g key={`war-border-effect-${front.id}-${pid}`}>
            {/* 呼吸发光底晕 */}
            <path
             d={feat.pathD}
             fill={isPlayer ? 'rgba(239, 68, 68, 0.12)' : 'rgba(249, 115, 22, 0.08)'}
             stroke={isPlayer ? '#ef4444' : '#f97316'}
             strokeWidth={2.8}
             strokeOpacity={0.9}
             filter="url(#war-frontline-glow)"
             style={{
              animation: 'warFrontlinePulse 2s ease-in-out infinite',
             }}
             vectorEffect="non-scaling-stroke"
            />
            {/* 警戒流动虚线 */}
            <path
             d={feat.pathD}
             fill="none"
             stroke={isPlayer ? (front.isPlayerAttacker ? '#38bdf8' : '#fbbf24') : '#fca5a5'}
             strokeWidth={1.3}
             strokeDasharray="5 3"
             strokeOpacity={0.95}
             style={{
              animation: 'warDashFlow 1.2s linear infinite',
             }}
             vectorEffect="non-scaling-stroke"
            />
           </g>
          );
         });
        })}
       </g>
      )}

      {/* Construction Mode Active Queued Indicators (只标记正在施工的省份，绝不全屏大批量卡牌堆叠撞车) */}
      {Boolean(constructionPlacementBuilding) && (
       <g id="construction-placards-layer" className="pointer-events-none">
        {precalculatedFeatures.map((item) => {
         const { stateId, name, centroid } = item;
         if (!centroid) return null;
         const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
         const constructionSnapshot = constructionByProvince.get(String(stateId));
         const isMyProv = Boolean(myNation && ownerNation?.id === myNation.id && constructionSnapshot?.isMyProvince);
         if (!isMyProv) return null;

         const isClicked =
          clickedConstructionProvinces.has(String(stateId)) ||
          clickedConstructionProvinces.has(String(name).trim().toLowerCase());
         const isBuilding = Boolean(constructionSnapshot?.isQueued) || isClicked;

         if (!isBuilding) return null;

         const [cx, cy] = centroid;

         return (
          <g
           key={`const-active-badge-${stateId}`}
           transform={`translate(${cx}, ${cy})`}
           className="select-none"
          >
           {/* Active Construction Pulse Ring */}
           <circle
            r={2.2}
            fill="rgba(34, 197, 94, 0.25)"
            stroke="#22c55e"
            strokeWidth={0.35}
            strokeDasharray="0.8 0.6"
           />
           <circle
            r={1.2}
            fill="#15803d"
           />
           {/* Micro Wrench / Hammer Vector */}
           <path
            d="M -0.5,-0.5 L 0.5,0.5 M -0.4,0.4 L 0.4,-0.4"
            stroke="#ffffff"
            strokeWidth={0.25}
            strokeLinecap="round"
           />
          </g>
         );
        })}
       </g>
      )}

      {/* Province Army Glyphs: compact, non-interactive markers for formally deployed divisions. */}
      {armyProvinceMarkers.length > 0 && (
       <g id="province-army-glyphs-layer" className="pointer-events-none">
        {armyProvinceMarkers.map((marker, index) => {
         const alert = marker.fightingCount > 0;
         return (
          <g key={`army-glyph-${index}`} transform={`translate(${marker.x}, ${marker.y})`}>
           <title>{`${marker.nationName} · ${marker.divisionCount} 个陆军师${alert ? ' · 交战中' : ''}`}</title>
           <circle r={2.25} fill={alert ? 'rgba(127, 29, 29, 0.92)' : 'rgba(5, 22, 18, 0.92)'} stroke={alert ? '#fb7185' : '#6ee7b7'} strokeWidth={0.28} />
           <path d="M -1.05,-0.55 H 1.05 V 0.72 H -1.05 Z M -0.62,-1.18 V -0.55 M 0,-1.18 V -0.55 M 0.62,-1.18 V -0.55" fill="none" stroke={alert ? '#fecdd3' : '#d1fae5'} strokeWidth={0.25} strokeLinecap="round" />
           {marker.divisionCount > 1 && <text x={1.75} y={-1.15} fill="#fef3c7" fontSize={1.5} fontWeight="bold" className="font-mono">{marker.divisionCount}</text>}
          </g>
         );
        })}
       </g>
      )}

      {/* Combat & Occupation Markers */}
      <g id="combat-markers-layer" className="pointer-events-none select-none">
       {nations.flatMap(n => n.provinces || []).filter(p => (p as any).occupationValue > 0).map(prov => {
        const featureItem = precalculatedFeatures.find(f => String(f.stateId) === String(prov.id) || f.name === prov.name);
        if (!featureItem) return null;
        const pt = getFeaturePixelCenter(featureItem.feature, pathGenerator, projection);
        if (!pt) return null;
        const occ = (prov as any).occupationValue;
        const isCombat = (prov as any).occupationStatus === 'combat';
        return (
         <g key={`combat-${prov.id}`} transform={`translate(${pt[0]}, ${pt[1]})`}>
          <rect x={-4} y={-1.5} width={8} height={1.5} fill="#1e293b" opacity={0.8} rx={0.5} />
          <rect x={-4} y={-1.5} width={8 * (occ / 100)} height={1.5} fill={isCombat ? "#ef4444" : "#f59e0b"} rx={0.5} />
          <text x={0} y={-2.2} fontSize={1.6} textAnchor="middle" fill="#fca5a5" fontWeight="bold">
           {isCombat ? '' : ''} {Math.round(occ)}%
          </text>
         </g>
        );
       })}
      </g>

      {/* Strategic Resources Tactical Overlay Layer */}
      {mapMode === 'resources' && (
       <g id="strategic-resources-overlay-layer" className="pointer-events-none select-none">
        {precalculatedFeatures.map((item) => {
         const { stateId, name, centroid, properties } = item;
         if (!centroid) return null;
         const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
         const provRecord = ownerNation?.provinces?.find(
          (p) => String(p.id) === String(stateId) || (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
         );
         const rawDeposits = (provRecord?.resources && Object.keys(provRecord.resources).length > 0)
          ? provRecord.resources
          : getProvinceResourceDeposits(stateId, name, properties);
         const deposits = (Object.keys(rawDeposits) as StrategicResourceType[])
          .filter((k) => Boolean(rawDeposits[k] && rawDeposits[k]! > 0))
          .map((k) => ({ type: k, amount: rawDeposits[k]! }));

         if (!deposits || deposits.length === 0) return null;

         const [cx, cy] = centroid;
         const badgeWidth = Math.min(22, 4.5 + deposits.length * 7.5);
         const badgeHeight = 3.6;

         return (
          <g key={`res-overlay-${stateId}`} transform={`translate(${cx}, ${cy})`}>
           <rect
            x={-badgeWidth / 2}
            y={-badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={badgeHeight / 2}
            fill="rgba(15, 23, 42, 0.9)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth={0.25}
           />
           {deposits.map((dep, idx) => {
            const resDef = STRATEGIC_RESOURCES[dep.type];
            if (!resDef) return null;
            const offsetX = -badgeWidth / 2 + 2.8 + idx * 7.5;
            return (
             <g key={`dep-${dep.type}-${idx}`} transform={`translate(${offsetX}, 0)`}>
              <circle cx={-0.6} cy={0} r={1.0} fill={resDef.color} stroke="#ffffff" strokeWidth={0.2} />
              <text
               x={1.0}
               y={0.7}
               fontSize={1.9}
               fontWeight="bold"
               fill="#f8fafc"
               fontFamily="monospace"
              >
               {dep.amount}
              </text>
             </g>
            );
           })}
          </g>
         );
        })}
       </g>
      )}

      {/* Dynamic Country Name Labels (HOI4-inspired Grand Strategy Map Typography) */}
      <g id="adaptive-country-labels-layer" className="pointer-events-none select-none">
       <defs>
        <filter id="country-label-subtle-shadow" x="-30%" y="-30%" width="160%" height="160%">
         <feDropShadow dx="0.1" dy="0.15" stdDeviation="0.25" floodColor="#000000" floodOpacity="0.28" />
        </filter>
        {countryLabels.map((label) => (
         <path
          key={`spine-def-${label.pathId}`}
          id={label.pathId}
          d={label.pathD}
          fill="none"
          stroke="none"
         />
        ))}
       </defs>
       {countryLabels.map((label) => {
        return (
         <text
          key={`country-label-${label.nation.id}`}
          dominantBaseline="central"
          textAnchor="middle"
          fill={currentTheme.labelColor}
          fillOpacity={label.opacity}
          filter="url(#country-label-subtle-shadow)"
          style={{
           fontFamily: '"Barlow Condensed", "Cinzel", "Oswald", "Noto Sans SC", "PingFang SC", "Heiti SC", sans-serif',
           fontStretch: 'condensed',
           textTransform: 'uppercase',
           transition: 'fill-opacity 240ms ease',
          }}
          stroke={currentTheme.labelStroke}
          strokeWidth={Math.max(0.18, label.fontSize * 0.042)}
          strokeOpacity={0.92}
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
          fontSize={label.fontSize}
          fontWeight="700"
          letterSpacing={`${label.letterSpacing}px`}
          className="select-none pointer-events-none"
         >
          <textPath
           href={`#${label.pathId}`}
           startOffset="50%"
           textAnchor="middle"
          >
           {label.displayText}
          </textPath>
         </text>
        );
       })}
      </g>

      {/* Plotted Nation Capital Markers & Tactical Capital Hubs (纯矢量极简随地图缩放) */}
      <g id="nation-markers-layer">
       {/* Capital Preview Beacon when picking capital in CreateNationModal */}
       {previewState?.mode === 'capital' && previewState.capital && (() => {
        const dummyNation = {
         id: 'preview',
         name: '新立帝国',
         capital: previewState.capital,
         territory: '',
         ownerId: '',
         ownerUsername: '',
         regime: '君主立宪制',
         ideology: '中立和平主义',
         flagColor: previewState.flagColor || '#6366f1',
         provinces: previewState.provinces || [],
         createdAt: new Date().toISOString(),
        } as unknown as Nation;
        const pt = findNationCapitalPoint(dummyNation, geoData, pathGenerator, projection, width, height);

        return (
         <g
          key="capital-preview-marker"
          transform={`translate(${pt.x}, ${pt.y})`}
          className="pointer-events-none"
         >
          <circle
           r={3.2}
           fill="none"
           stroke="#f59e0b"
           strokeWidth={0.4}
           strokeDasharray="1.2 0.8"
          />
          <circle
           r={1.8}
           fill="#0f172a"
           stroke="#f59e0b"
           strokeWidth={0.3}
          />
          <circle
           r={1.1}
           fill={previewState.flagColor || '#6366f1'}
           stroke="#ffffff"
           strokeWidth={0.2}
          />
          <path
           d="M 0,-0.8 L 0.22,-0.22 L 0.8,-0.22 L 0.32,0.15 L 0.5,0.7 L 0,0.35 L -0.5,0.7 L -0.32,0.15 L -0.8,-0.22 L -0.22,-0.22 Z"
           fill="#fef08a"
           stroke="#ca8a04"
           strokeWidth={0.08}
           strokeLinejoin="round"
          />
         </g>
        );
       })()}

       {nationMarkers.map(({ nation, x, y }) => {
        const isAtWar = (nation.activeWars || []).length > 0;
        const isHovered = hoveredNation?.id === nation.id;
        // Capital names are strictly interaction-only. Province/city strings never enter the default map label layer.
        const showCapitalName = isHovered;
        return (
         <g
          key={`marker-${nation.id}`}
          transform={`translate(${x}, ${y})`}
          className="cursor-pointer select-none"
          onClick={(e) => { e.stopPropagation(); onSelectNation(nation); }}
          onMouseEnter={() => setHoveredNation(nation)}
          onMouseLeave={() => setHoveredNation(null)}
         >
          <title>{`${nation.name} · 首都 ${nation.capital || '未设定'}`}</title>
          {isAtWar && isHovered && <circle r={0.82} fill="none" stroke="#8f554d" strokeWidth={0.13} strokeDasharray="0.28 0.26" />}
          <circle r={0.18} fill="#e7ddbd" stroke="#2a3131" strokeWidth={0.09} />
          <path d="M 0,-0.48 L 0.11,-0.11 L 0.48,-0.11 L 0.17,0.09 L 0.28,0.42 L 0,0.21 L -0.28,0.42 L -0.17,0.09 L -0.48,-0.11 L -0.11,-0.11 Z" fill="#b9a36b" stroke="#443d2e" strokeWidth={0.045} />
          {showCapitalName && (
           <text x={1.15} y={0.38} fill="#ded7c8" stroke="#1d2729" strokeWidth={0.16} paintOrder="stroke" fontSize={1.15} fontWeight="600" className="pointer-events-none font-serif">
            {nation.capital || nation.name}
           </text>
          )}
         </g>
        );
       })}
      </g>

      {/* Dynamic Border Clashes & Tactical Frontline Badges Layer (双方边境接触火线与前线交锋焦点勋章) */}
      {(mapMode === 'military' || displayedFrontlines.length > 0) && (
       <g id="military-frontlines-layer">
        {/* 1. 双方接壤边境短距交火矛头与阻绝线 */}
        {displayedFrontlines.map((front) => {
         const {
          contactPairs,
          isPlayerInvolved,
          isPlayerAttacker,
          isLandBorder,
         } = front;

         const strokeColor = isPlayerAttacker ? '#38bdf8' : '#ef4444';
         const markerId = isPlayerAttacker ? 'url(#spearhead-player)' : 'url(#spearhead-red)';

         return (
          <g key={`frontline-clashes-${front.id}`}>
           {contactPairs.map((pair, idx) => {
            const dx = pair.toX - pair.fromX;
            const dy = pair.toY - pair.fromY;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const barrierHalfWidth = 10;
            const bx1 = pair.midX - nx * barrierHalfWidth;
            const by1 = pair.midY - ny * barrierHalfWidth;
            const bx2 = pair.midX + nx * barrierHalfWidth;
            const by2 = pair.midY + ny * barrierHalfWidth;

            return (
             <g key={`clash-node-${front.id}-${idx}`}>
              {/* 防守接触阻绝线 */}
              <line
               x1={bx1}
               y1={by1}
               x2={bx2}
               y2={by2}
               stroke="#0a0f1d"
               strokeWidth={2.4}
               strokeOpacity={0.6}
               strokeLinecap="round"
               vectorEffect="non-scaling-stroke"
              />
              <line
               x1={bx1}
               y1={by1}
               x2={bx2}
               y2={by2}
               stroke={isPlayerInvolved ? '#fbbf24' : '#fb7185'}
               strokeWidth={1.2}
               strokeOpacity={0.88}
               strokeDasharray="2.5 2.5"
               strokeLinecap="round"
               vectorEffect="non-scaling-stroke"
              />

              {/* 短距离进攻突破矛头 */}
              <line
               x1={pair.fromX + dx * 0.15}
               y1={pair.fromY + dy * 0.15}
               x2={pair.toX - dx * 0.15}
               y2={pair.toY - dy * 0.15}
               stroke={strokeColor}
               strokeWidth={isPlayerAttacker ? 2.0 : 1.5}
               strokeDasharray={activeOffensiveLaunched ? '3 2' : (isLandBorder ? 'none' : '4 3')}
               markerEnd={markerId}
               opacity={isPlayerInvolved ? 0.95 : 0.75}
               vectorEffect="non-scaling-stroke"
              />
             </g>
            );
           })}
          </g>
         );
        })}

        {/* 2. 前线核心交火焦点战况徽章 (带雷达波纹与即时战略信息，点击平滑聚焦) */}
        {displayedFrontlines.map((front) => {
         const {
          focusPos,
          id,
          attackerNation,
          defenderNation,
          attackerDivisions,
          defenderDivisions,
          isPlayerInvolved,
          isPlayerAttacker,
          isLandBorder,
         } = front;

         if (!focusPos.x || !focusPos.y) return null;
         const badgeScale = Math.max(0.38, 0.92 / Math.pow(zoom, 0.55));

         return (
          <g
           key={`frontline-focal-badge-${id}`}
           transform={`translate(${focusPos.x}, ${focusPos.y}) scale(${badgeScale})`}
           className="cursor-pointer"
           onClick={(e) => {
            e.stopPropagation();
            // 点击战火徽标快速聚焦该战线
            setView((prev) => ({
             zoom: Math.max(prev.zoom, 2.6),
             pan: {
              x: width / 2 - focusPos.x * Math.max(prev.zoom, 2.6),
              y: height / 2 - focusPos.y * Math.max(prev.zoom, 2.6),
             },
            }));
           }}
          >
           {/* 雷达探测扫描脉冲环 */}
           <circle
            cx={0}
            cy={0}
            r={8}
            fill="none"
            stroke={isPlayerInvolved ? '#f43f5e' : '#f97316'}
            strokeWidth={1.5}
            style={{ animation: 'warRadarRipple 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite' }}
           />

           {/* 战火核心标牌底板 */}
           <rect
            x={-34}
            y={-9}
            width={68}
            height={18}
            rx={4}
            fill="#090d16"
            fillOpacity={0.95}
            stroke={isPlayerInvolved ? (isPlayerAttacker ? '#38bdf8' : '#f43f5e') : '#fbbf24'}
            strokeWidth={1.0}
            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
           />

           {/* 战火与交锋图标 */}
           <g transform="translate(-29, -5.5) scale(0.6)">
            <Flame className={isPlayerInvolved ? 'text-rose-400' : 'text-amber-400'} />
           </g>

           {/* 状态与兵力标签 */}
           <text
            x={-16}
            y={-0.5}
            fill="#ffffff"
            fontSize={5.4}
            fontWeight="900"
            className="pointer-events-none select-none font-sans"
           >
            {isPlayerInvolved
             ? (isPlayerAttacker ? `⚔ 战线攻势: ${attackerNation.name}` : `⚔ 防线激战: ${attackerNation.name}`)
             : `⚔ 边境交火: ${attackerNation.name}`}
           </text>
           <text
            x={-16}
            y={5.8}
            fill="#94a3b8"
            fontSize={4.3}
            fontWeight="bold"
            className="pointer-events-none select-none font-mono"
           >
            {`${attackerDivisions}师 ⚔ ${defenderDivisions}师 (${isLandBorder ? '边境接壤' : '跨海远征'})`}
           </text>
          </g>
         );
        })}
       </g>
      )}
     </g>
    </svg>
   </div>

   {/* Floating Tactical Theater High Command & Stance Controls Panel (左下角战术姿态面板，避开底部中央地球按钮与和平扩张) */}
   {(mapMode === 'military' || (myNation?.activeWars && myNation.activeWars.length > 0)) && (
     <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="absolute bottom-3 left-2 sm:bottom-4 sm:left-4 z-20 w-[calc(100vw-1.5rem)] sm:w-auto sm:max-w-md bg-slate-950/90 backdrop-blur-xl border border-rose-500/30 rounded-lg shadow-2xl p-2.5 text-slate-100 flex flex-col gap-2 pointer-events-auto select-none"
     >
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
         <Swords className="w-4 h-4" />
        </div>
        <div className="min-w-0">
         <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-white tracking-wide">战区统帅部 · 作战姿态</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono">
           {displayedFrontlines.length}/{activeFrontlines.length} 前线
          </span>
         </div>
        </div>
       </div>

       {/* General Offensive Trigger Button */}
       <button
        type="button"
        onClick={() => {
         setActiveOffensiveLaunched(!activeOffensiveLaunched);
        }}
        className={`px-2.5 py-1 rounded text-[11px] font-black transition cursor-pointer flex items-center gap-1 border shrink-0 ${
         activeOffensiveLaunched
          ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
        }`}
       >
        <Zap className="w-3 h-3" />
        <span>{activeOffensiveLaunched ? '执行总攻中' : '下达总攻'}</span>
       </button>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
       <p className="text-[10px] text-slate-400 truncate flex-1">
        {armyGroupPosture === 'aggressive'
         ? '激进突破：战力+25%，推进极快，战损+15%'
         : armyGroupPosture === 'balanced'
         ? '均衡推进：稳扎稳打，战损平衡'
         : '堑壕固守：防御+35%，依托要塞极大减少人员伤亡'}
       </p>

       {/* Stance Selector */}
       <div className="flex bg-slate-900 p-0.5 rounded border border-slate-700/80 text-[11px] shrink-0">
        {(
         [
          { id: 'aggressive', label: '突击', icon: Flame },
          { id: 'balanced', label: '均衡', icon: Navigation },
          { id: 'defensive', label: '固守', icon: Shield },
         ] as const
        ).map((st) => (
         <button
          key={st.id}
          type="button"
          onClick={() => setArmyGroupPosture(st.id)}
          className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition cursor-pointer ${
           armyGroupPosture === st.id
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white'
          }`}
         >
          <st.icon className="w-3 h-3" />
          <span>{st.label}</span>
         </button>
        ))}
       </div>
      </div>
     </motion.div>
    )}

    {/* Click-Selected Province Tactical Details & Construction Panel */}
    <AnimatePresence>
     {selectedProvince && !previewState?.mode && !constructionPlacementBuilding && (
      <ProvinceDetailPanel
       provinceData={{
        id: selectedProvince.id,
        name: selectedProvince.name,
        properties: selectedProvince.properties,
       }}
       ownerNation={selectedProvince.ownerNation}
       myNation={myNation || null}
       onClose={() => setSelectedProvince(null)}
       onOpenConstruction={onOpenConstruction}
       onBuildInProvince={(pId, pName, bType) => {
        onBuildInProvince?.(pId, pName, bType);
       }}
       onSelectNation={onSelectNation}
       onNavigateProvince={handleNavigateProvince}
       onOpenDispute={onOpenDispute}
      />
     )}
    </AnimatePresence>

    {/* Hover Nation Tooltip Card */}
    {hoveredNation && (
     <div className="absolute top-16 left-4 sm:top-20 sm:left-6 z-30 w-72 p-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl animate-fadeIn pointer-events-none text-slate-900">
      <div className="flex items-center gap-3 mb-3">
       <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: hoveredNation.flagColor }}
       >
        {renderEmblemIcon(hoveredNation.emblemIcon, { className: 'w-5 h-5' })}
       </div>
       <div className="min-w-0">
        <h4 className="font-bold text-base text-slate-900 truncate">
         {hoveredNation.name}
        </h4>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
         <Landmark className="w-3.5 h-3.5 text-indigo-500" /> 首都：
         {hoveredNation.capital}
        </p>
       </div>
      </div>

      <div className="text-xs space-y-1.5 text-slate-600 border-t border-slate-100 pt-3">
       <p>
        <span className="text-slate-400">疆域：</span>
        <span className="font-medium text-slate-700">{hoveredNation.territory}</span>
       </p>
       <p>
        <span className="text-slate-400">领主：</span>
        <span className="font-medium text-slate-700">
         {hoveredNation.ownerUsername}
        </span>{' '}
        <span className="text-slate-400">
         (抖音：{hoveredNation.ownerDouyinName})
        </span>
       </p>
       <p>
        <span className="text-slate-400">政体：</span>
        <span className="font-medium text-slate-700">
         {hoveredNation.regime} · {hoveredNation.ideology}
        </span>
       </p>
      </div>
     </div>
    )}

    {/* Peaceful Expansion Success Formal Ratification Card / Modal */}
    <AnimatePresence>
     {expansionSuccessData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
       <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
       >
        {/* Header with emerald highlight */}
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-5 py-4 flex items-center gap-3">
         <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <CheckCircle2 className="w-6 h-6" />
         </div>
         <div>
          <h3 className="text-base font-black text-white tracking-wide">和平扩张成功</h3>
          <p className="text-xs text-emerald-300/80">疆域勘界确认，已载入国家主权名册</p>
         </div>
        </div>

        {/* Body with crisp key-values */}
        <div className="p-5 space-y-4">
         <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">获得领土</span>
          <strong className="text-sm font-black text-emerald-300">
           「{expansionSuccessData.provinceName}」
          </strong>
         </div>

         <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
           <span className="text-slate-400">领土状态</span>
           <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            非核心领土
           </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
           <span className="text-slate-400">核心状态</span>
           <span className="text-slate-300 font-medium">未整合 (需要日后行政整编)</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
           <span className="text-slate-400">资源产出</span>
           <span className="text-slate-400 font-medium">暂不可使用</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
           <span className="text-slate-400">今日和平扩张</span>
           <span className="text-emerald-400 font-bold">已使用 (明日 00:00 刷新)</span>
          </div>
         </div>
        </div>

        {/* Footer Action */}
        <div className="bg-slate-950/80 px-5 py-3.5 border-t border-white/10 flex justify-end">
         <button
          type="button"
          onClick={() => setExpansionSuccessData(null)}
          className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50 cursor-pointer"
         >
          确定并查看地图
         </button>
        </div>
       </motion.div>
      </div>
     )}
    </AnimatePresence>

    {/* Geopolitical Factions Tactical Sidebar (Non-blocking docked overlay) */}
    <GeopoliticalFactionsSidebar
     isOpen={showNationsDrawer}
     onClose={() => setShowNationsDrawer(false)}
     nations={nations}
     myNation={myNation}
     onJumpToNation={(n) => {
      handleNationJump(n);
      setHoveredNation(n);
      setTimeout(() => setHoveredNation(null), 3000);
     }}
     onViewNationDetail={(n) => {
      onSelectNation(n);
     }}
     onOpenDiplomacy={(n) => {
      onOpenDiplomacy(n);
     }}
    />
   </div>
  );
 };
