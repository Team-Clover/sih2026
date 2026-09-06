import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, BarChart3, Bell, Brain, ChevronRight, CloudRain, Gauge as GaugeIcon, Info, Map, Menu, Mountain, Navigation, RefreshCw, Search, ShieldAlert, Thermometer, UserRound, Waves, X } from 'lucide-react'
import './App.css'
import { API_BASE_URL } from './config'
import { checkApiStatus, predictLandslide } from './services/api'
import { getRiskMeta } from './utils/risk'
import { calculateFinalRisk, getElevationCategory, getSlopeCategory } from './utils/terrainRisk'

const states = ['ARUNACHAL PRADESH', 'ASSAM', 'MEGHALAYA', 'MANIPUR', 'MIZORAM', 'NAGALAND', 'SIKKIM', 'TRIPURA']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const initialForm = { state: 'ASSAM', year: '2020', month: '6', rainfall: '390', rainfall_anomaly: '120', rainfall_anomaly_pct: '45', temperature: '27.5', slope: '38', elevation: '1850' }

function Gauge({ probability, level }) {
  const meta = getRiskMeta(level)
  return <div className="gauge" style={{ '--gauge-color': meta.color, '--gauge-progress': `${probability || 0}%` }}><div className="gauge-inner"><span>FINAL RISK</span><strong>{probability == null ? '--' : `${Number(probability).toFixed(2)}%`}</strong><small>{probability == null ? 'NO DATA' : level}</small></div></div>
}

function Metric({ icon: Icon, label, value, unit, tone = '' }) {
  return <div className={`metric-card ${tone}`}><div className="metric-icon"><Icon size={17} /></div><span>{label}</span><strong>{value ?? '--'} <small>{unit}</small></strong></div>
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('landslide-intelligence-history') || '[]'))
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiOnline, setApiOnline] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { checkApiStatus().then(() => setApiOnline(true)).catch(() => setApiOnline(false)) }, [])
  const meta = result ? getRiskMeta(result.finalRisk) : null
  const chartData = useMemo(() => history.slice(0, 7).reverse().map((item) => ({ name: item.state.slice(0, 3), probability: Number(item.finalProbability) || 0 })), [history])
  const analyzedStates = useMemo(() => Object.fromEntries(history.map((item) => [item.state, item])), [history])
  const analytics = useMemo(() => ({ analyzed: history.length, high: history.filter((item) => item.finalRisk === 'HIGH').length, veryHigh: history.filter((item) => item.finalRisk === 'VERY HIGH').length, average: history.length ? history.reduce((sum, item) => sum + Number(item.finalProbability), 0) / history.length : 0 }), [history])

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  async function handleSubmit(event) {
    event.preventDefault(); setError('')
    const payload = { state: form.state, year: Number(form.year), month: Number(form.month), rainfall: Number(form.rainfall), rainfall_anomaly: Number(form.rainfall_anomaly), rainfall_anomaly_pct: Number(form.rainfall_anomaly_pct), temperature: Number(form.temperature), slope: Number(form.slope), elevation: Number(form.elevation), source_id: crypto.randomUUID() }
    const slope = Number(form.slope); const elevation = Number(form.elevation)
    const numericPayload = [payload.year, payload.month, payload.rainfall, payload.rainfall_anomaly, payload.rainfall_anomaly_pct, payload.temperature, payload.slope, payload.elevation]
    if (!payload.state || numericPayload.some((value) => !Number.isFinite(value)) || slope < 0 || slope > 90 || elevation < 0) { setError('Please check the fields. Slope must be 0–90° and elevation cannot be negative.'); return }
    setLoading(true)
    try {
      const response = await predictLandslide(payload)
      if (!response.risk_level || !Number.isFinite(Number(response.landslide_probability))) throw new Error('Invalid response')
      const terrain = calculateFinalRisk(response.landslide_probability, slope, elevation)
      const item = { ...payload, slope, elevation, ...response, aiProbability: Number(response.landslide_probability), ...terrain, createdAt: Date.now() }
      setResult(item); setHistory((current) => { const updated = [item, ...current].slice(0, 20); localStorage.setItem('landslide-intelligence-history', JSON.stringify(updated)); return updated }); setApiOnline(true); setActiveTab('home')
    } catch { setError(`Unable to connect to AI prediction service. Make sure FastAPI is running on port 8001 (${API_BASE_URL}).`); setApiOnline(false) } finally { setLoading(false) }
  }
  function clearHistory() { if (window.confirm('Clear all saved predictions?')) { localStorage.removeItem('landslide-intelligence-history'); setHistory([]); setResult(null) } }
  function go(tab) { setActiveTab(tab); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <PullToRefresh><div className="app-shell">
    <header className="topbar"><div className="topbar-brand"><span className="logo"><Mountain size={18} /></span><div><strong>Bhu Rakshak</strong><small>ADMIN · LANDSLIDE INTELLIGENCE</small></div></div><div className="topbar-actions"><span className={`connection ${apiOnline ? '' : 'offline'}`}><i /> {apiOnline ? 'LIVE' : 'OFFLINE'}</span><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></header>
    {menuOpen && <div className="quick-menu"><button onClick={() => go('about')}><Info size={16} /> About the model</button><button onClick={() => checkApiStatus().then(() => setApiOnline(true)).catch(() => setApiOnline(false))}><RefreshCw size={16} /> Check connection</button></div>}
    <main>
      {activeTab === 'home' && <Home result={result} meta={meta} form={form} history={history} chartData={chartData} analytics={analytics} go={go} />}
      {activeTab === 'predict' && <Predict form={form} update={update} handleSubmit={handleSubmit} loading={loading} error={error} result={result} />}
      {activeTab === 'map' && <MapPage states={states} analyzedStates={analyzedStates} update={update} go={go} />}
      {activeTab === 'alerts' && <Alerts history={history} clearHistory={clearHistory} />}
      {activeTab === 'about' && <About />}
    </main>
    <nav className="bottom-nav">{[[GaugeIcon, 'home', 'Home'], [Activity, 'predict', 'Predict'], [Map, 'map', 'Map'], [Bell, 'alerts', 'Alerts']].map(([Icon, tab, label]) => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => go(tab)}><Icon size={19} /><span>{label}</span></button>)}</nav>
  </div></PullToRefresh>
}

function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const tracking = useRef(false)
  const threshold = 86

  function onTouchStart(event) {
    if (window.scrollY === 0 && !refreshing) {
      startY.current = event.touches[0].clientY
      tracking.current = true
    }
  }

  function onTouchMove(event) {
    if (!tracking.current || startY.current == null) return
    const distance = event.touches[0].clientY - startY.current
    if (distance <= 0) { setPull(0); return }
    setPull(Math.min(distance * 0.48, 118))
  }

  function onTouchEnd() {
    if (!tracking.current) return
    tracking.current = false
    if (pull >= threshold) {
      setRefreshing(true)
      setPull(70)
      window.setTimeout(() => window.location.reload(), 420)
    } else setPull(0)
    startY.current = null
  }

  return <div className="pull-refresh" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}><div className={`pull-refresh-indicator${refreshing ? ' is-refreshing' : ''}`} style={{ '--pull-distance': `${pull}px` }} aria-live="polite"><span className="pull-refresh-orbit" /><strong>{refreshing ? 'Refreshing' : pull >= threshold ? 'Release to refresh' : 'Pull to refresh'}</strong></div>{children}</div>
}

function Home({ result, meta, form, history, chartData, analytics, go }) {
  return <><section className="welcome-row"><div><p className="kicker">ADMIN COMMAND CENTER · NORTH-EAST INDIA</p><h1>Risk intelligence</h1><p className="subheading">A clearer signal for a changing landscape.</p></div><button className="profile-button" aria-label="Admin profile"><UserRound size={19} /></button></section><section className="location-bar"><Navigation size={16} /><div><span>MONITORING LOCATION</span><strong>{result?.state || form.state}</strong><small>North-East India · terrain-aware</small></div><button onClick={() => go('predict')}><ChevronRight size={18} /></button></section><section className="hero-risk" style={{ '--risk-color': meta?.color || '#91d85f', '--risk-soft': meta?.soft || 'rgba(145,216,95,.12)' }}><div className="hero-risk-copy"><span className="kicker">FINAL ESTIMATED RISK</span><h2>{result ? result.finalRisk : 'No prediction'}</h2><p>{result ? 'ML probability adjusted by experimental terrain weighting' : 'Run an analysis to reveal the current signal'}</p><div className="hero-status"><span className="status-dot" /> {result ? 'MODEL ASSESSMENT READY' : 'AWAITING INPUT'}</div></div><Gauge probability={result?.finalProbability} level={result?.finalRisk || 'LOW'} /></section>{result ? <><section className="risk-breakdown"><div><span>AI MODEL</span><strong>{result.aiProbability.toFixed(2)}%</strong><small>{result.risk_level}</small></div><div><span>TERRAIN ADJUSTMENT</span><strong>+{result.totalAdjustment}%</strong><small>Slope +{result.slopeAdjustment}% · Elevation +{result.elevationAdjustment}%</small></div><div><span>FINAL ESTIMATE</span><strong>{result.finalProbability.toFixed(2)}%</strong><small>{result.finalRisk}</small></div></section><section className="insight-card"><div className="insight-icon"><Brain size={20} /></div><div><span className="kicker">WHY IS THE RISK THIS HIGH?</span><p>{meta.message}</p><small>These factors contribute to the estimated risk; they do not establish causal certainty.</small></div></section></> : <button className="empty-cta" onClick={() => go('predict')}><div className="empty-icon"><GaugeIcon size={20} /></div><div><strong>Generate your first prediction</strong><span>Select conditions and run the AI model</span></div><ChevronRight size={18} /></button>}<section className="section-block"><div className="section-title"><div><span className="kicker">CONDITION SIGNALS</span><h2>Environmental pulse</h2></div><button className="tiny-button" onClick={() => go('predict')}>Edit <ChevronRight size={14} /></button></div><div className="metric-grid"><Metric icon={CloudRain} label="Rainfall" value={result?.rainfall} unit="mm" tone="rain" /><Metric icon={Waves} label="Anomaly" value={result?.rainfall_anomaly} unit="mm" tone="amber" /><Metric icon={Thermometer} label="Temperature" value={result?.temperature} unit="°C" tone="coral" /><Metric icon={Mountain} label="Slope" value={result?.slope} unit="°" tone="violet" /><Metric icon={Navigation} label="Elevation" value={result?.elevation} unit="m" tone="rain" /><Metric icon={Activity} label="Anomaly %" value={result?.rainfall_anomaly_pct} unit="%" tone="amber" /></div></section>{result && <section className="explain-card"><div className="section-title"><div><span className="kicker">EXPLAINABILITY</span><h2>Terrain risk adjustment</h2></div></div><p className="muted">Experimental terrain weighting, not a scientifically validated threshold.</p><div className="factor-grid"><Factor label="Rainfall" value={`${result.rainfall} mm`} category="HIGH" /><Factor label="Slope" value={`${result.slope}°`} category={getSlopeCategory(result.slope)} /><Factor label="Elevation" value={`${result.elevation} m`} category={getElevationCategory(result.elevation)} /><Factor label="Temperature" value={`${result.temperature}°C`} category="MODERATE" /></div></section>}<section className="analytics-strip"><div><BarChart3 size={16} /><strong>{analytics.analyzed}</strong><span>States analyzed</span></div><div><AlertTriangle size={16} /><strong>{analytics.high}</strong><span>High-risk</span></div><div><ShieldAlert size={16} /><strong>{analytics.veryHigh}</strong><span>Very high</span></div><div><Activity size={16} /><strong>{analytics.average.toFixed(1)}%</strong><span>Average risk</span></div></section><section className="chart-card"><div className="section-title"><div><span className="kicker">RECENT ANALYSES</span><h2>Risk trajectory</h2></div><span className="chart-badge">{history.length} SAVED</span></div>{chartData.length ? <ResponsiveContainer width="100%" height={170}><AreaChart data={chartData} margin={{ top: 10, right: 2, left: -25, bottom: 0 }}><defs><linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ff815c" stopOpacity=".42" /><stop offset="100%" stopColor="#ff815c" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="#ffffff12" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b959f', fontSize: 10 }} /><YAxis domain={[0, 100]} hide /><Tooltip contentStyle={{ background: '#20262c', border: '1px solid #ffffff18', borderRadius: 10, color: '#fff', fontSize: 11 }} /><Area type="monotone" dataKey="probability" stroke="#ff815c" strokeWidth={3} fill="url(#riskFill)" /></AreaChart></ResponsiveContainer> : <div className="chart-empty"><BarChart3 size={21} /><span>Predictions will appear here after analysis.</span></div>}</section></>
}

function Factor({ label, value, category }) { return <div className="factor"><span>{label}</span><strong>{value}</strong><b>{category}</b></div> }

function Predict({ form, update, handleSubmit, loading, error, result }) {
  return <section className="page-section"><div className="page-heading"><span className="kicker">AI MODEL + TERRAIN LAYER</span><h1>Predict landslide risk</h1><p>Send only ML-compatible fields to FastAPI. Slope and elevation are applied locally as transparent terrain adjustments.</p></div><form className="prediction-form" onSubmit={handleSubmit}><label><span>State</span><select value={form.state} onChange={(event) => update('state', event.target.value)}>{states.map((state) => <option key={state}>{state}</option>)}</select></label><div className="form-row"><Field label="Year" value={form.year} onChange={(value) => update('year', value)} min="1900" max="2100" /><label><span>Month</span><select value={form.month} onChange={(event) => update('month', event.target.value)}>{months.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</select></label></div><div className="form-row"><Field label="Rainfall" unit="mm" value={form.rainfall} onChange={(value) => update('rainfall', value)} min="0" /><Field label="Rainfall anomaly" unit="mm" value={form.rainfall_anomaly} onChange={(value) => update('rainfall_anomaly', value)} /></div><div className="form-row"><Field label="Anomaly percentage" unit="%" value={form.rainfall_anomaly_pct} onChange={(value) => update('rainfall_anomaly_pct', value)} /><Field label="Temperature" unit="°C" value={form.temperature} onChange={(value) => update('temperature', value)} /></div><div className="terrain-form-row"><Field label="Slope" unit="degrees · 0–90" value={form.slope} onChange={(value) => update('slope', value)} min="0" max="90" /><Field label="Elevation" unit="meters" value={form.elevation} onChange={(value) => update('elevation', value)} min="0" /></div>{error && <div className="form-error"><AlertTriangle size={16} /> {error}</div>}<button className="analyze-button" disabled={loading}>{loading ? <><RefreshCw className="spin" size={18} /> Analyzing environmental conditions...</> : <><GaugeIcon size={18} /> Analyze risk</>}</button><p className="form-note"><ShieldAlert size={14} /> AI-generated risk estimate. Follow official local advisories.</p></form>{result && <div className="last-result"><Gauge probability={result.finalProbability} level={result.finalRisk} /><div><span className="kicker">LATEST RESULT</span><h3>{result.state} · {result.finalRisk}</h3><p>AI {result.aiProbability.toFixed(2)}% + terrain {result.totalAdjustment}% = {result.finalProbability.toFixed(2)}%</p></div></div>}</section>
}
function Field({ label, unit, value, onChange, ...props }) { return <label><span>{label} {unit && <em>{unit}</em>}</span><input type="number" value={value} onChange={(event) => onChange(event.target.value)} required {...props} /></label> }

function MapPage({ states, analyzedStates, update, go }) { return <section className="page-section"><div className="page-heading"><span className="kicker">REGIONAL VIEW</span><h1>North-East risk map</h1><p>Only states analyzed on this device show a risk signal.</p></div><div className="regional-map"><div className="map-lines" /><div className="map-land" />{states.map((state, index) => { const item = analyzedStates[state]; const tone = item ? getRiskMeta(item.finalRisk).color : '#5b6670'; return <button className="state-pin" key={state} style={{ '--x': `${22 + (index % 4) * 18}%`, '--y': `${25 + Math.floor(index / 4) * 35}%`, '--pin': tone }} onClick={() => { update('state', state); go('predict') }}><span><Map size={14} /></span><b>{state.slice(0, 3)}</b><small>{item ? `${Number(item.finalProbability).toFixed(0)}%` : 'N/A'}</small></button> })}<div className="map-center-label">NORTH-EAST<br /><small>Tap a state to analyze</small></div></div><div className="map-legend"><span><i className="low" /> Low</span><span><i className="moderate" /> Moderate</span><span><i className="high" /> High</span><span><i className="very-high" /> Very high</span></div><div className="state-list">{states.map((state) => { const item = analyzedStates[state]; return <button key={state} onClick={() => { update('state', state); go('predict') }}><span>{state}</span><b style={{ color: item ? getRiskMeta(item.finalRisk).color : '#8b959f' }}>{item ? item.finalRisk : 'Not analyzed'}</b><ChevronRight size={15} /></button> })}</div></section> }

function Alerts({ history, clearHistory }) { return <section className="page-section"><div className="page-heading"><span className="kicker">MONITORING CENTER</span><h1>Alerts & history</h1><p>Local analysis history from this device.</p></div><div className="alert-summary"><div><Bell size={18} /><strong>{history.filter((item) => ['HIGH', 'VERY HIGH'].includes(item.finalRisk)).length}</strong><span>elevated signals</span></div><div><Activity size={18} /><strong>{history.length}</strong><span>total analyses</span></div></div>{history.length ? <div className="history-cards">{history.map((item) => { const itemMeta = getRiskMeta(item.finalRisk); return <article key={item.createdAt} className="history-card" style={{ '--item-color': itemMeta.color }}><div><span className="history-state">{item.state}</span><small>{new Date(item.createdAt).toLocaleString()}</small></div><strong>{item.risk_level} → {item.finalRisk}</strong><b>{Number(item.finalProbability).toFixed(2)}%</b><p>AI {Number(item.aiProbability).toFixed(2)}% · slope +{item.slopeAdjustment}% · elevation +{item.elevationAdjustment}%</p></article> })}</div> : <div className="empty-panel"><Bell size={22} /><strong>No active alerts</strong><p>Run a prediction to monitor a location.</p></div>}<button className="clear-button" onClick={clearHistory} disabled={!history.length}>Clear history</button></section> }
function About() { return <section className="page-section about-page"><div className="page-heading"><span className="kicker">SYSTEM INFORMATION</span><h1>Built for clearer decisions.</h1><p>Bhu Rakshak uses an existing ML model plus a transparent experimental terrain adjustment to estimate landslide risk.</p></div><div className="about-card"><Brain size={22} /><h2>Hybrid architecture</h2><div className="about-list">{['FastAPI returns the AI model probability', 'Slope adds a bounded terrain adjustment', 'Elevation adds a smaller context adjustment', 'Final risk remains an estimate, not a warning'].map((item) => <span key={item}><i />{item}</span>)}</div></div><div className="disclaimer"><Info size={18} /><p>AI-generated risk estimate. This system is not an official emergency warning system. Follow instructions from local authorities and disaster-management agencies.</p></div></section> }
export default App
