import { Activity, Clock3 } from 'lucide-react'
import { getRiskMeta } from '../utils/risk'

export default function RiskResult({ result }) {
  if (!result) return <div className="result-empty"><Activity size={22} /><div><strong>No risk assessment yet</strong><p>Enter environmental conditions and analyze the area.</p></div></div>
  const meta = getRiskMeta(result.risk_level)
  return <div className="result-card" style={{ '--risk-color': meta.color, '--risk-soft': meta.soft }}><div className="result-top"><span className="eyebrow">CURRENT PROTOTYPE ASSESSMENT</span><span className="risk-pill">{result.risk_level}</span></div><div className="result-body"><div className="risk-ring" style={{ '--progress': `${result.risk_probability}%` }}><div><strong>{Number(result.risk_probability).toFixed(1)}%</strong><small>probability</small></div></div><div><h3>{result.risk_level} risk detected</h3><p>AI-assisted estimation from your manual inputs.</p><div className="timestamp"><Clock3 size={14} /> {new Date(result.createdAt).toLocaleString()}</div></div></div></div>
}
