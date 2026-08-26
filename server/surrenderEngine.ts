import { DBNation, DBDiplomaticRequest, db } from './db';

export function calculateTerritoryOccupiedPressure(ratio: number): number {
  const r = Math.max(0, Math.min(1, ratio));
  if (r <= 0) return 0;
  if (r <= 0.10) return (r / 0.10) * 5;
  if (r <= 0.25) return 5 + ((r - 0.10) / 0.15) * 10;
  if (r <= 0.40) return 15 + ((r - 0.25) / 0.15) * 15;
  if (r <= 0.50) return 30 + ((r - 0.40) / 0.10) * 10;
  if (r <= 0.60) return 40 + ((r - 0.50) / 0.10) * 15;
  if (r <= 0.70) return 55 + ((r - 0.60) / 0.10) * 15;
  if (r <= 0.80) return 70 + ((r - 0.70) / 0.10) * 15;
  if (r <= 0.90) return 85 + ((r - 0.80) / 0.10) * 10;
  return 95 + ((r - 0.90) / 0.10) * 5;
}

export function calculateWarSupportPressure(warSupport: number): number {
  const ws = Math.max(0, Math.min(100, warSupport));
  if (ws >= 80) return 0;
  if (ws >= 60) return ((80 - ws) / 20) * 5;
  if (ws >= 40) return 5 + ((60 - ws) / 20) * 5;
  if (ws >= 20) return 10 + ((40 - ws) / 20) * 10;
  return 20 + ((20 - ws) / 20) * 15;
}

export function calculateNationalResistance(nation: DBNation): number {
  if (nation.surrenderResistance !== undefined) {
    return nation.surrenderResistance;
  }
  let resistance = 0.0;
  if (nation.regime === '军政府/军国主义' || nation.ideology === '激进军国主义') {
    resistance += 0.20;
  } else if (nation.regime === '封建帝国' || nation.ideology === '扩张威权主义') {
    resistance += 0.10;
  } else if (nation.regime === '自由城邦自治' || nation.ideology === '中立和平主义') {
    resistance -= 0.10;
  }

  const stability = nation.stabilityIndex ?? 70;
  if (stability >= 85) resistance += 0.10;
  else if (stability < 30) resistance -= 0.25;
  else if (stability < 50) resistance -= 0.10;

  if (nation.activeDecreeIds?.includes('decree_mandatory_conscription')) {
    resistance += 0.10;
  }

  return Math.max(-0.4, Math.min(0.4, Number(resistance.toFixed(2))));
}

export function computeServerSurrenderProgress(
  nation: DBNation,
  allNations: DBNation[] = db.getNations(),
  allRequests: DBDiplomaticRequest[] = db.getDiplomaticRequests()
) {
  if (nation.isCapitulated) {
    return {
      rawPressure: 100,
      effectiveProgress: 100,
      threshold: nation.surrenderThreshold ?? 100,
      isCapitulated: true,
      topFactors: [{ label: '已签署投降条约', value: 100 }],
      allFactors: [],
    };
  }

  const activeWars = allRequests.filter(
    (r) =>
      r.type === 'war' &&
      r.status === 'active' &&
      (r.senderNationId === nation.id || r.receiverNationId === nation.id)
  );

  const provinces = nation.provinces || [];
  const totalProvincesCount = Math.max(1, provinces.length);
  const occupiedList = nation.occupiedProvinces || [];
  const occupiedRatio = Math.min(1, occupiedList.length / totalProvincesCount);
  const territoryPressure = calculateTerritoryOccupiedPressure(occupiedRatio);

  const isCapitalOccupied =
    nation.capitalOccupied ||
    occupiedList.some((p) => p.toLowerCase().includes(nation.capital?.toLowerCase() || '---'));

  const coreProvinces = provinces.slice(0, Math.ceil(totalProvincesCount / 2));
  const lostCoreCount = coreProvinces.filter((p: any) =>
    occupiedList.includes(typeof p === 'string' ? p : p.name)
  ).length;
  const coreLostRatio = coreProvinces.length > 0 ? lostCoreCount / coreProvinces.length : 0;
  const coreExtraPressure = coreLostRatio > 0.8 ? 20 : coreLostRatio > 0.5 ? 10 : 0;

  let militaryStrength = nation.militaryStrength;
  if (militaryStrength === undefined) {
    const totalMilFactories = provinces.reduce(
      (s: number, p: any) => s + (p.militaryFactories || 0),
      0
    );
    const stockpiles = nation.militaryIndustry?.stockpiles || {};
    let totalEquipments = 0;
    Object.values(stockpiles).forEach((v) => {
      totalEquipments += typeof v === 'number' ? v : 0;
    });
    const expectedBaseFactories = Math.max(3, provinces.length * 2);
    const milFactoryRatio = Math.min(1.2, totalMilFactories / expectedBaseFactories);
    const equipScore = Math.min(1.2, totalEquipments / 2000);
    militaryStrength = Math.round((milFactoryRatio * 0.6 + equipScore * 0.4) * 100);
  }

  let milPressure = 0;
  if (militaryStrength < 10) milPressure = 40;
  else if (militaryStrength < 25) milPressure = 25;
  else if (militaryStrength < 50) milPressure = 10;

  const baseStability = nation.stabilityIndex ?? 70;
  const baseApproval = nation.popularApproval ?? 75;
  let warSupport = baseStability * 0.4 + baseApproval * 0.6;
  if (nation.regime === '军政府/军国主义' || nation.ideology === '激进军国主义') warSupport += 15;
  if (isCapitalOccupied) warSupport -= 25;
  warSupport -= occupiedRatio * 40;
  warSupport = Math.max(0, Math.min(100, Math.round(warSupport)));

  const warSupportPressure = calculateWarSupportPressure(warSupport);
  const defeatPressure = Math.min(30, nation.recentDefeats ?? 0);

  let econPressure = 0;
  const treasury = nation.economy?.baseTreasury ?? 50000;
  if (treasury < -10000) econPressure += 15;
  else if (treasury < 0) econPressure += 5;
  econPressure = Math.min(25, econPressure);

  let allianceModifier = 0;
  if (nation.allianceId) {
    const allyNations = allNations.filter((n) => n.allianceId === nation.allianceId && n.id !== nation.id);
    const activeAllies = allyNations.filter((n) => !n.isCapitulated);
    const capitulatedAllies = allyNations.filter((n) => n.isCapitulated);

    if (allyNations.length > 0) {
      if (activeAllies.length === 0 && capitulatedAllies.length > 0) {
        allianceModifier += 35;
      } else if (capitulatedAllies.length > 0) {
        allianceModifier += Math.min(20, capitulatedAllies.length * 10);
      }
      if (activeAllies.length > 0) {
        allianceModifier -= Math.min(25, activeAllies.length * 8);
      }
    }
  }

  let warDurationPressure = 0;
  if (activeWars.length > 0) {
    const earliestWar = activeWars.reduce((min, w) => {
      const t = new Date(w.createdAt).getTime();
      return t < min ? t : min;
    }, Date.now());
    const days = Math.max(0, Math.floor((Date.now() - earliestWar) / 86400000));
    if (days >= 365) warDurationPressure = 8;
    else if (days >= 180) warDurationPressure = 5;
    else if (days >= 90) warDurationPressure = 3;
    else if (days >= 30) warDurationPressure = 1;
  }

  let rawPressure =
    territoryPressure +
    (isCapitalOccupied ? 30 : 0) +
    coreExtraPressure +
    milPressure +
    warSupportPressure +
    defeatPressure +
    econPressure +
    allianceModifier +
    warDurationPressure;

  rawPressure = Math.max(0, Math.min(150, rawPressure));
  const resistance = calculateNationalResistance(nation);
  const effectiveProgress = Math.max(0, Math.min(100, Math.round(rawPressure * (1 - resistance))));
  const threshold = nation.surrenderThreshold ?? 100;
  const isCapitulated = effectiveProgress >= threshold;

  return {
    rawPressure: Math.round(rawPressure),
    effectiveProgress,
    threshold,
    isCapitulated,
    warSupport,
    militaryStrength,
    resistanceModifier: resistance,
    details: {
      territoryOccupiedPercent: Math.round(occupiedRatio * 100),
      capitalOccupied: isCapitalOccupied,
      coreTerritoryLostPercent: Math.round(coreLostRatio * 100),
      defeatPressure,
      econPressure,
      allianceModifier,
      warDurationPressure,
    },
  };
}
