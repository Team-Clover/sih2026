export const SLOPE_RULES = [
  { min: 0, max: 15, category: 'VERY LOW', adjustment: 0 },
  { min: 15, max: 25, category: 'LOW', adjustment: 2 },
  { min: 25, max: 35, category: 'MODERATE', adjustment: 5 },
  { min: 35, max: 45, category: 'HIGH', adjustment: 8 },
  { min: 45, max: Infinity, category: 'VERY HIGH', adjustment: 12 },
]

export const ELEVATION_RULES = [
  { min: 0, max: 500, category: 'LOW', adjustment: 0 },
  { min: 500, max: 1500, category: 'MODERATE', adjustment: 1 },
  { min: 1500, max: 2500, category: 'HIGH', adjustment: 3 },
  { min: 2500, max: Infinity, category: 'VERY HIGH', adjustment: 4 },
]

function findRule(value, rules) {
  return rules.find(({ min, max }) => value >= min && value < max) || rules[rules.length - 1]
}

export function getSlopeCategory(slope) {
  return findRule(Number(slope), SLOPE_RULES).category
}

export function getSlopeAdjustment(slope) {
  return findRule(Number(slope), SLOPE_RULES).adjustment
}

export function getElevationCategory(elevation) {
  return findRule(Number(elevation), ELEVATION_RULES).category
}

export function getElevationAdjustment(elevation) {
  return findRule(Number(elevation), ELEVATION_RULES).adjustment
}

export function calculateTerrainAdjustment(slope, elevation) {
  const slopeAdjustment = getSlopeAdjustment(slope)
  const elevationAdjustment = getElevationAdjustment(elevation)
  return { slopeAdjustment, elevationAdjustment, totalAdjustment: slopeAdjustment + elevationAdjustment }
}

export function getAdjustedRiskLevel(probability) {
  if (probability < 30) return 'LOW'
  if (probability < 60) return 'MODERATE'
  if (probability < 80) return 'HIGH'
  return 'VERY HIGH'
}

export function calculateFinalRisk(aiProbability, slope, elevation) {
  const terrain = calculateTerrainAdjustment(slope, elevation)
  const finalProbability = Math.min(100, Math.max(0, Number(aiProbability) + terrain.totalAdjustment))
  return { ...terrain, finalProbability, finalRisk: getAdjustedRiskLevel(finalProbability) }
}
