import { useState } from 'react'
import { Activity, Menu, X } from 'lucide-react'

export default function Navbar({ apiOnline }) {
  const [open, setOpen] = useState(false)
  return <header className="navbar"><a className="brand" href="#top"><span className="brand-mark"><Activity size={18} /></span><span>Bhu Rakshak<small>NER early warning system</small></span></a><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button><nav className={open ? 'nav-links open' : 'nav-links'}><a href="#assessment" onClick={() => setOpen(false)}>Dashboard</a><a href="#assessment" onClick={() => setOpen(false)}>Risk analysis</a><a href="#monitoring" onClick={() => setOpen(false)}>Monitoring</a><a href="#about" onClick={() => setOpen(false)}>About</a></nav><div className="api-badge"><span className={apiOnline ? 'status-dot' : 'status-dot offline'} /> API {apiOnline ? 'online' : 'offline'}</div></header>
}
