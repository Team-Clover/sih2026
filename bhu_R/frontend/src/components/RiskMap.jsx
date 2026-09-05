import { MapPin } from 'lucide-react'

const markers = [
  ['LOW', 'Sikkim', 'low'],
  ['MODERATE', 'Assam', 'moderate'],
  ['HIGH', 'Meghalaya', 'high'],
  ['CRITICAL', 'Arunachal Pradesh', 'critical'],
]

export default function RiskMap() {
  return (
    <section className="panel map-panel" id="monitoring">
      <div className="section-heading"><div><span className="eyebrow">FIELD VIEW</span><h2>Regional risk monitoring</h2></div><span className="demo-tag">Demo monitoring data</span></div>
      <p className="muted">Prototype monitoring view for the North Eastern Region. Locations shown are illustrative.</p>
      <div className="map-canvas" aria-label="Illustrative map of North Eastern India">
        <div className="map-grid" />
        <div className="map-shape" />
        {markers.map(([level, place, tone], index) => <div className={`map-marker ${tone}`} style={{ '--i': index }} key={place}><span><MapPin size={14} /></span><strong>{place}</strong><small>{level}</small></div>)}
        <div className="map-label">NORTH EASTERN REGION<br /><small>Illustrative coverage</small></div>
      </div>
    </section>
  )
}
