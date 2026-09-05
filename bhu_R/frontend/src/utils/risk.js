const riskMeta = {
  LOW: { color: '#91d85f', soft: 'rgba(145, 216, 95, .15)', message: 'Current conditions indicate relatively low landslide risk.' },
  MODERATE: { color: '#f3c85b', soft: 'rgba(243, 200, 91, .15)', message: 'Current conditions indicate moderate landslide risk. Continue monitoring.' },
  HIGH: { color: '#ff815c', soft: 'rgba(255, 129, 92, .16)', message: 'Current conditions indicate elevated landslide risk. Increased monitoring is recommended.' },
  'VERY HIGH': { color: '#ff5366', soft: 'rgba(255, 83, 102, .16)', message: 'Current conditions indicate very high landslide risk. Follow local authorities.' },
  CRITICAL: { color: '#ff5366', soft: 'rgba(255, 83, 102, .16)', message: 'Critical prototype risk level detected. Further expert assessment is required.' },
}

export function getRiskMeta(level = 'LOW') {
  return riskMeta[level] || riskMeta.LOW
}

export function getRiskLevel(probability) {
  if (probability < 30) return 'LOW'
  if (probability < 60) return 'MODERATE'
  if (probability < 80) return 'HIGH'
  return 'CRITICAL'
}
