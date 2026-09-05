export const riskOrder = { 'VERY HIGH': 4, HIGH: 3, MODERATE: 2, LOW: 1 }
export const riskColor = (level) => ({ LOW: '#83d39a', MODERATE: '#efc765', HIGH: '#f38b59', 'VERY HIGH': '#f05f69' }[level] || '#8795a5')
