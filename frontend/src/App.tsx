
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2,
  CloudSun, FileImage, HardHat, Home, MessageSquare, Send, ShieldCheck,
  UploadCloud, X, MapPin, LoaderCircle,  RefreshCw
} from "lucide-react";
import "./App.css";


const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


type Module = "Dashboard" | "Site Safety" | "Crack Analysis" | "Project Planning" | "Real Estate Valuation" | "AI Assistant" | "Weather Advisory";

type Finding = {
  hazard?: string;
  defect?: string;
  severity: string;
  description: string;
  recommendation?: string;
  location_in_image?: string;
  recommended_next_step?: string;
};

type ImageResult = { message: string; filename: string; size_bytes: number; analysis: any; disclaimer: string };

const modules: { name: Module; desc: string; icon: typeof ShieldCheck }[] = [
  { name: "Site Safety", desc: "Identify visible safety hazards and corrective actions.", icon: ShieldCheck },
  { name: "Crack Analysis", desc: "Review visible cracks and surface defects.", icon: Activity },
  { name: "Project Planning", desc: "Generate a starter phase schedule and budget split.", icon: CalendarDays },
  { name: "Real Estate Valuation", desc: "Estimate a property value from your inputs.", icon: Building2 },
  { name: "AI Assistant", desc: "Ask construction and project questions.", icon: MessageSquare },
  { name: "Weather Advisory", desc: "Review weather conditions relevant to site work.", icon: CloudSun },
];

function App() {
  const [active, setActive] = useState<Module>("Dashboard");
  const [health, setHealth] = useState<any>(null);

  async function checkHealth() {
    try {
      const res = await fetch(`${API}/api/health`);
      setHealth(await res.json());
    } catch {
      setHealth({ status: "offline", gemini_configured: false });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><HardHat size={25}/></div><div><strong>ConstructIQ</strong><small>INTELLIGENCE PLATFORM</small></div></div>
        <div className="nav-label">WORKSPACE</div>
        <button className={`nav-item ${active === "Dashboard" ? "active" : ""}`} onClick={() => setActive("Dashboard")}><Home size={18}/>Dashboard</button>
        {modules.map((m) => { const Icon = m.icon; return <button key={m.name} className={`nav-item ${active === m.name ? "active" : ""}`} onClick={() => setActive(m.name)}><Icon size={18}/>{m.name}</button>; })}
        <div className="sidebar-bottom"><div className="help-card"><strong>Need assistance?</strong><p>Use the AI assistant for construction questions.</p><button onClick={() => setActive("AI Assistant")}>Open assistant →</button></div><button className="health-button" onClick={checkHealth}><RefreshCw size={15}/> Check system status</button>{health && <small className={health.status === "healthy" ? "status-good" : "status-bad"}>API: {health.status} · Gemini: {health.gemini_configured ? "configured" : "not configured"}</small>}</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div><span>Workspace</span><span className="slash">/</span><strong>{active}</strong></div><span className="system-pill"><i/> Local demo</span></header>
        <div className="page">
          {active === "Dashboard" ? <Dashboard onOpen={setActive}/> :
            active === "Site Safety" ? (
  <ImageModule
    key="site-safety"
    kind="safety"
    onBack={() => setActive("Dashboard")}
  />
) :
active === "Crack Analysis" ? (
  <ImageModule
    key="crack-analysis"
    kind="cracks"
    onBack={() => setActive("Dashboard")}
  />
) :
            active === "Project Planning" ? <Planning onBack={() => setActive("Dashboard")}/> :
            active === "Real Estate Valuation" ? <Valuation onBack={() => setActive("Dashboard")}/> :
            active === "AI Assistant" ? <Assistant onBack={() => setActive("Dashboard")}/> :
            <Weather onBack={() => setActive("Dashboard")}/>}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: (m: Module) => void }) {
  return <><div className="hero"><div><div className="eyebrow">CONSTRUCTION INTELLIGENCE WORKSPACE</div><h1>Build with better insight.</h1><p>One workspace for visual site reviews, planning, valuation and weather-aware decisions.</p></div><div className="hero-icon"><HardHat size={48}/></div></div><div className="section-heading"><div><h2>Intelligence modules</h2><p>Choose a module to get started.</p></div><span className="count-tag">06 MODULES</span></div><div className="module-grid">{modules.map(m => {const Icon = m.icon; return <button className="module-card" key={m.name} onClick={() => onOpen(m.name)}><div className="module-icon"><Icon size={22}/></div><h3>{m.name}</h3><p>{m.desc}</p><span className="module-link">Open module <span>→</span></span></button>;})}</div><div className="notice"><InfoIcon/><p><strong>Important:</strong> AI image outputs and valuation/planning calculations are preliminary demo aids. Confirm safety-critical, structural, financial and schedule decisions with qualified professionals.</p></div></>;
}

function InfoIcon() { return <AlertTriangle size={19}/>; }

function PageHeading({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <><button className="back-link" onClick={onBack}>← Back to dashboard</button><div className="page-heading"><div className="page-heading-icon"><ShieldCheck size={25}/></div><div><div className="eyebrow">INTELLIGENCE MODULE</div><h1>{title}</h1><p>{subtitle}</p></div></div></>;
}

function ImageModule({ kind, onBack }: { kind: "safety" | "cracks"; onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const title = kind === "safety" ? "Site Safety Analysis" : "Crack Analysis";
  const endpoint = kind === "safety" ? "analyze-safety" : "analyze-cracks";

  function choose(f?: File) {
    setError("");
    setResult(null);
    if (!f) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("Maximum image size is 10 MB.");
      return;
    }

    setFile(f);
  }

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  async function submit() {
    if (!file) { setError("Select an image first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData(); fd.append("image", file);
      const response = await fetch(`${API}/api/${endpoint}`, { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed.");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to the backend."); }
    finally { setLoading(false); }
  }

  const a = result?.analysis ?? {};
  const findings: Finding[] = kind === "safety" ? (a.findings ?? []) : (a.observations ?? []);

  return <><PageHeading title={title} subtitle={kind === "safety" ? "Review visible construction hazards and practical corrective actions." : "Review visible cracks and surface defects. This is not a structural diagnosis."} onBack={onBack}/><div className="two-column"><section className="panel"><div className="panel-title"><h2>Construction site image</h2><span>JPEG · PNG · WebP</span></div>{!file ? <label className="dropzone"><input className="file-input-overlay" type="file" aria-label={`Choose image for ${title}`} accept="image/jpeg,image/png,image/webp" onChange={e => { choose(e.target.files?.[0]); e.currentTarget.value = ""; }}/><UploadCloud size={32}/><strong>Choose an image to upload</strong><span>Browse your device for a site photo</span><small>Maximum file size: 10 MB</small></label> : <div className="preview-wrap"><img src={preview} alt="Selected site"/><div className="file-row"><FileImage size={19}/><div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KB</small></div><button className="icon-button" onClick={() => {setFile(null); setResult(null); setError("");}} aria-label="Remove image"><X size={18}/></button></div><label className="change-file">Choose another image<input className="change-file-input" type="file" aria-label={`Choose another image for ${title}`} accept="image/jpeg,image/png,image/webp" onChange={e => { choose(e.target.files?.[0]); e.currentTarget.value = ""; }}/></label></div>}{error && <div className="error-box">{error}</div>}<button className="primary-button" disabled={!file || loading} onClick={submit}>{loading ? <><LoaderCircle className="spin" size={17}/> Analyzing image…</> : <><UploadCloud size={17}/> Analyze {kind === "safety" ? "site safety" : "cracks"}</>}</button><p className="fine-print">AI findings are preliminary visual observations. Verify them with a qualified professional.</p></section><section className="panel result-panel"><div className="panel-title"><h2>Assessment results</h2></div>{loading ? <div className="empty-state"><LoaderCircle className="spin" size={30}/><h3>Analyzing image</h3><p>The model is reviewing your image. Please wait.</p></div> : !result ? <div className="empty-state"><ShieldCheck size={32}/><h3>No analysis yet</h3><p>Choose an image and run the analysis to see findings here.</p></div> : <><div className="success-line"><CheckCircle2 size={23}/><div><strong>Analysis completed</strong><p>{result.message}</p></div></div><div className="risk-box"><span>{kind === "safety" ? "Overall risk" : "Overall visible severity"}</span><strong className={`risk ${String(a.overall_risk ?? a.overall_severity ?? "Unknown").toLowerCase()}`}>{a.overall_risk ?? a.overall_severity ?? "Unable to determine"}</strong><p>{a.summary}</p></div><h3 className="subheading">{kind === "safety" ? "Detected hazards" : "Visible defects"} ({findings.length})</h3>{findings.length === 0 ? <p className="muted">No clear findings were reported by the model.</p> : findings.map((f, i) => <article className="finding" key={i}><div className="finding-head"><strong>{f.hazard ?? f.defect ?? "Observation"}</strong><span className={`severity ${String(f.severity).toLowerCase()}`}>{f.severity}</span></div>{f.location_in_image && <small>Location: {f.location_in_image}</small>}<p>{f.description}</p><div className="recommendation"><strong>{kind === "safety" ? "Recommended action" : "Recommended next step"}</strong><p>{f.recommendation ?? f.recommended_next_step}</p></div></article>)}{(a.positive_observations ?? []).length > 0 && <div className="extra-section"><h3>Positive observations</h3><ul>{a.positive_observations.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>}{(a.limitations ?? []).length > 0 && <div className="extra-section"><h3>Limitations</h3><ul>{a.limitations.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>}{a.professional_inspection_recommended && <div className="notice"><AlertTriangle size={18}/><p>Professional inspection is recommended for confirmation.</p></div>}<p className="fine-print">{result.disclaimer}</p></>}</section></div></>;
}

function Planning({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ project_name: "Residential Build", project_type: "Residential building", duration_weeks: 12, team_size: 8, budget: 5000000 });
  const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); setError(""); setData(null); try { const r = await fetch(`${API}/api/plan`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || "Plan generation failed"); setData(d); } catch (x) { setError(x instanceof Error ? x.message : "Request failed"); } finally { setLoading(false); } }
  return <><PageHeading title="Project Planning" subtitle="Create an illustrative project phase schedule and budget allocation." onBack={onBack}/><div className="two-column"><form className="panel form-panel" onSubmit={submit}><h2>Project inputs</h2><Field label="Project name"><input value={form.project_name} onChange={e => setForm({...form, project_name:e.target.value})} required/></Field><Field label="Project type"><select value={form.project_type} onChange={e => setForm({...form, project_type:e.target.value})}><option>Residential building</option><option>Commercial building</option><option>Renovation</option><option>Warehouse</option><option>Infrastructure</option></select></Field><Field label={`Duration: ${form.duration_weeks} weeks`}><input type="range" min="1" max="52" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks:Number(e.target.value)})}/></Field><Field label="Team size"><input type="number" min="1" max="500" value={form.team_size} onChange={e => setForm({...form, team_size:Number(e.target.value)})}/></Field><Field label="Estimated total budget (₹)"><input type="number" min="0" value={form.budget} onChange={e => setForm({...form, budget:Number(e.target.value)})}/></Field><button className="primary-button" disabled={loading}>{loading ? "Building plan…" : "Generate starter plan"}</button>{error && <div className="error-box">{error}</div>}</form><section className="panel"><div className="panel-title"><h2>Starter schedule</h2>{data && <span>{data.duration_weeks} weeks</span>}</div>{!data ? <div className="empty-state"><CalendarDays size={32}/><h3>Your plan will appear here</h3><p>Enter project inputs and generate a starter schedule.</p></div> : <><div className="summary-strip"><div><small>Project</small><strong>{data.project_name}</strong></div><div><small>Team</small><strong>{data.team_size}</strong></div><div><small>Budget</small><strong>{money(data.budget)}</strong></div></div><div className="timeline">{data.tasks.map((t:any, i:number) => <div className="timeline-item" key={i}><div className="timeline-dot">{String(i+1).padStart(2,"0")}</div><div className="timeline-content"><strong>{t.task}</strong><small>Weeks {t.start_week}–{t.end_week} · {t.duration_weeks} week(s)</small><div className="bar"><span style={{width:`${Math.max(8,t.duration_weeks / data.duration_weeks * 100)}%`}}/></div><small>Budget allocation: {money(t.budget_estimate)}</small></div></div>)}</div><ul className="caveats">{data.notes.map((n:string,i:number)=><li key={i}>{n}</li>)}</ul></>}</section></div></>;
}

function Valuation({ onBack }: { onBack: () => void }) {
  const [form,setForm] = useState({location:"Indore, Madhya Pradesh", area_sqft:1200, property_type:"Residential", age_years:5, rate_per_sqft:4500, condition:"Good"});
  const [data,setData] = useState<any>(null); const [error,setError] = useState(""); const [loading,setLoading] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); setError(""); setData(null); try { const r=await fetch(`${API}/api/valuation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); const d=await r.json(); if(!r.ok) throw new Error(d.detail||"Estimate failed"); setData(d); } catch(x) {setError(x instanceof Error?x.message:"Request failed");} finally{setLoading(false);} }
  return <><PageHeading title="Real Estate Valuation" subtitle="Estimate a property value using your local rate assumptions." onBack={onBack}/><div className="two-column"><form className="panel form-panel" onSubmit={submit}><h2>Property details</h2><Field label="Location"><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required/></Field><Field label="Property type"><select value={form.property_type} onChange={e=>setForm({...form,property_type:e.target.value})}><option>Residential</option><option>Commercial</option><option>Land</option><option>Industrial</option></select></Field><Field label="Area (sq ft)"><input type="number" min="1" value={form.area_sqft} onChange={e=>setForm({...form,area_sqft:Number(e.target.value)})}/></Field><Field label="Local base rate per sq ft (₹)"><input type="number" min="1" value={form.rate_per_sqft} onChange={e=>setForm({...form,rate_per_sqft:Number(e.target.value)})}/></Field><Field label="Property age (years)"><input type="number" min="0" value={form.age_years} onChange={e=>setForm({...form,age_years:Number(e.target.value)})}/></Field><Field label="Condition"><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}><option>Excellent</option><option>Good</option><option>Average</option><option>Needs repair</option></select></Field><button className="primary-button" disabled={loading}>{loading?"Calculating…":"Estimate property value"}</button>{error&&<div className="error-box">{error}</div>}</form><section className="panel">{!data?<div className="empty-state"><Building2 size={32}/><h3>Valuation estimate</h3><p>Enter the property details and a rate you have verified locally.</p></div>:<><div className="valuation-result"><span>Illustrative estimated value</span><strong>{money(data.estimated_value)}</strong><p>{data.location} · {data.property_type}</p></div><div className="summary-strip"><div><small>Area</small><strong>{data.area_sqft.toLocaleString()} sq ft</strong></div><div><small>Rate</small><strong>{money(data.base_rate_per_sqft)}/sq ft</strong></div></div><div className="extra-section"><h3>Method</h3><p>{data.method}</p><p>{data.disclaimer}</p></div></>}</section></div></>;
}

function Assistant({ onBack }: { onBack: () => void }) {
  const [message,setMessage] = useState(""); const [messages,setMessages] = useState<{role:string,text:string}[]>([{role:"assistant",text:"Hi! I’m ConstructIQ Assistant. Ask me about construction planning, materials, site safety, or project estimation."}]); const [loading,setLoading] = useState(false); const [error,setError] = useState("");
  async function send(e?:FormEvent) { e?.preventDefault(); const q=message.trim(); if(!q||loading)return; setMessages(m=>[...m,{role:"user",text:q}]); setMessage(""); setLoading(true); setError(""); try {const r=await fetch(`${API}/api/assistant`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Assistant failed");setMessages(m=>[...m,{role:"assistant",text:d.answer}]);}catch(x){setError(x instanceof Error?x.message:"Request failed");}finally{setLoading(false);}}
  return <><PageHeading title="AI Assistant" subtitle="Ask practical questions about construction work and project decisions." onBack={onBack}/><section className="panel chat-panel"><div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-bubble ${m.role}`}><strong>{m.role==="assistant"?"ConstructIQ":"You"}</strong><p>{m.text}</p></div>)}{loading&&<div className="chat-bubble assistant"><LoaderCircle className="spin" size={17}/> Thinking…</div>}</div>{error&&<div className="error-box">{error}</div>}<form className="chat-form" onSubmit={send}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask a construction question…" maxLength={4000}/><button className="primary-button" disabled={loading||!message.trim()}><Send size={17}/> Send</button></form><p className="fine-print">Do not rely on AI alone for structural, legal, safety-critical, or financial decisions.</p></section></>;
}

function Weather({ onBack }: { onBack: () => void }) {
  const [city,setCity] = useState("Indore"); const [data,setData] = useState<any>(null); const [error,setError] = useState(""); const [loading,setLoading] = useState(false);
  async function submit(e?:FormEvent) {e?.preventDefault();setLoading(true);setError("");setData(null);try{const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);const gd=await geo.json();const place=gd.results?.[0];if(!place)throw new Error("Location not found. Try a larger nearby city.");const r=await fetch(`${API}/api/weather?latitude=${place.latitude}&longitude=${place.longitude}`);const d=await r.json();if(!r.ok)throw new Error(d.detail||"Weather lookup failed");setData({...d,place});}catch(x){setError(x instanceof Error?x.message:"Weather request failed");}finally{setLoading(false);}}
  return <><PageHeading title="Weather Advisory" subtitle="Review current weather and short-range conditions for construction planning." onBack={onBack}/><div className="two-column"><form className="panel form-panel" onSubmit={submit}><h2>Site location</h2><Field label="City or town"><div className="input-with-icon"><MapPin size={17}/><input value={city} onChange={e=>setCity(e.target.value)} required placeholder="Enter city"/></div></Field><button className="primary-button" disabled={loading}>{loading?"Checking weather…":"Get weather advisory"}</button>{error&&<div className="error-box">{error}</div>}<p className="fine-print">Weather is fetched from Open-Meteo. Confirm severe weather using official local alerts and site procedures.</p></form><section className="panel">{!data?<div className="empty-state"><CloudSun size={34}/><h3>Weather conditions</h3><p>Enter a city to load current conditions and a three-day outlook.</p></div>:<><div className="weather-current"><CloudSun size={30}/><div><span>{data.place.name}, {data.place.country}</span><strong>{data.current.temperature_2m}°C</strong><small>Humidity {data.current.relative_humidity_2m}% · Wind {data.current.wind_speed_10m} km/h</small></div></div><h3 className="subheading">Construction advisory</h3>{data.construction_advisory.map((x:string,i:number)=><div className="advisory" key={i}><AlertTriangle size={18}/><p>{x}</p></div>)}<h3 className="subheading">Next 3 days</h3><div className="forecast">{data.daily.time.map((date:string,i:number)=><div key={date}><strong>{date}</strong><span>{data.daily.temperature_2m_min[i]}°–{data.daily.temperature_2m_max[i]}°C</span><small>Rain chance: {data.daily.precipitation_probability_max[i]}%</small><small>Max wind: {data.daily.wind_speed_10m_max[i]} km/h</small></div>)}</div><p className="fine-print">{data.disclaimer}</p></>}</section></div></>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function money(n:number) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n ?? 0); }

export default App;