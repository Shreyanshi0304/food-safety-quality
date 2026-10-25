import { useCallback, useEffect, useState } from "react";
import "./styles.css";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || `Request failed (${res.status})`);
  return data;
}
const categories = [
  ["food_quality", "◉", "Food quality", "Spoilage, unusual smell, texture or appearance"],
  ["contamination", "✳", "Possible contamination", "Foreign object or suspected contamination"],
  ["labelling", "▤", "Labelling & packaging", "Incorrect label, damaged seal or expiry concern"],
  ["hygiene", "⌁", "Hygiene concern", "Handling, storage or preparation conditions"],
  ["adulteration", "◇", "Suspected adulteration", "Concern about ingredients or authenticity"],
  ["other", "＋", "Something else", "A food safety concern not listed above"],
];
const blank = { category: "food_quality", product_name: "", place_name: "", location: "", description: "", incident_date: "", reporter_name: "", reporter_contact: "" };
const caseNo = c => c?.case_number || c?.case_id || c?.id || c?.reference_number || "—";
const status = c => c?.status || c?.current_status || "Submitted";
const titleCase = x => String(x || "—").replaceAll("_", " ").replace(/\b\w/g, a => a.toUpperCase());

function Field({ label, className = "", children }) {
  return <label className={className}>{label}{children}</label>;
}
function Notice({ notice, close }) {
  if (!notice) return null;
  return <div className={`notice ${notice.kind || "info"}`} role="status">{notice.text}<button onClick={close} aria-label="Dismiss">×</button></div>;
}

export default function App() {
  const [tab, setTab] = useState("report");
  const [form, setForm] = useState(blank);
  const [category, setCategory] = useState("food_quality");
  const [cases, setCases] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [tracking, setTracking] = useState("");
  const [tracked, setTracked] = useState(null);
  const [review, setReview] = useState({ ref: "", decision: "needs_review", notes: "" });
  const [workflow, setWorkflow] = useState({ ref: "", action: "assign_authority", notes: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const load = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([api("/cases"), api("/dashboard")]);
      setCases(Array.isArray(c) ? c : c.cases || c.items || []);
      setDashboard(d || {});
    } catch (e) {
      setNotice({ kind: "warn", text: `Could not load backend data: ${e.message}. Check the API URL and backend status.` });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      const result = await api("/cases", { method: "POST", body: JSON.stringify({ ...form, category }) });
      const ref = caseNo(result);
      setNotice({ kind: "success", text: `Report submitted. Save this case reference: ${ref}` });
      setTracking(String(ref)); setForm(blank); setCategory("food_quality"); await load(); setTab("track");
    } catch (e) { setNotice({ kind: "error", text: `Could not submit report: ${e.message}` }); }
    finally { setBusy(false); }
  }
  async function findCase(e) {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      const data = await api("/cases");
      const list = Array.isArray(data) ? data : data.cases || data.items || [];
      setCases(list);
      const match = list.find(c => String(caseNo(c)).toLowerCase() === tracking.trim().toLowerCase());
      setTracked(match || null);
      if (!match) setNotice({ kind: "warn", text: "No matching case found. Check the reference and try again." });
    } catch (e) { setNotice({ kind: "error", text: `Could not track case: ${e.message}` }); }
    finally { setBusy(false); }
  }
  async function saveReview(e) {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      await api(`/cases/${encodeURIComponent(review.ref)}/review`, { method: "POST", body: JSON.stringify({ decision: review.decision, notes: review.notes }) });
      setNotice({ kind: "success", text: "Demo review decision saved." }); setReview(p => ({ ...p, notes: "" })); await load();
    } catch (e) { setNotice({ kind: "error", text: `Could not save review: ${e.message}` }); }
    finally { setBusy(false); }
  }
  async function saveWorkflow(e) {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      await api(`/cases/${encodeURIComponent(workflow.ref)}/workflow`, { method: "POST", body: JSON.stringify({ action: workflow.action, notes: workflow.notes }) });
      setNotice({ kind: "success", text: "Demo workflow action recorded. No authority or laboratory was contacted." }); setWorkflow(p => ({ ...p, notes: "" })); await load();
    } catch (e) { setNotice({ kind: "error", text: `Could not record workflow action: ${e.message}` }); }
    finally { setBusy(false); }
  }

  const tabs = [["report", "Submit a report"], ["track", "Track a case"], ["review", "Human review"], ["workflow", "Authority & lab"], ["overview", "National overview"]];
  const field = (key, placeholder = "", required = false, type = "text") => <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={placeholder} required={required} />;

  return <div className="shell">
    <header className="topbar">
      <button className="brand" onClick={() => setTab("report")}><span className="brand-mark">FS</span>Food Safety <b>& Quality</b></button>
      <span className="prototype"><i /> HACKATHON PROTOTYPE</span>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow light">NOTICE SOMETHING? MAKE IT VISIBLE.</p>
          <h1>Food concerns deserve a <em>clear next step.</em></h1>
          <p className="hero-text">Report a concern, keep the case reference, and follow the demo workflow from one place.</p>
          <button className="btn btn-light" onClick={() => setTab("report")}>Start a report <span>↗</span></button>
          <p className="hero-foot">A reporting prototype built around clarity, traceability and follow-up.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="plate"><span>✓</span></div><b className="sticker sticker-a">REPORT<br/>IT.</b><b className="sticker sticker-b">ONE CASE.<br/>CLEARER STEPS.</b></div>
      </section>
      <section className="trust"><div><b>01</b> Tell us what happened</div><span>→</span><div><b>02</b> Get a case reference</div><span>→</span><div><b>03</b> Track the next step</div></section>
      <Notice notice={notice} close={() => setNotice(null)} />
      <nav className="tabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>

      {tab === "report" && <section className="layout">
        <div className="panel"><p className="eyebrow">01 / YOUR REPORT</p><h2>What would you like to report?</h2><p className="muted">Choose the closest category, then add the details you know.</p>
          <form onSubmit={submit}>
            <div className="categories">{categories.map(([id, icon, name, desc]) => <button type="button" key={id} onClick={() => setCategory(id)} className={`category ${category === id ? "chosen" : ""}`}><span className="cat-icon">{icon}</span><b>{name}</b><small>{desc}</small></button>)}</div>
            <div className="fields">
              <Field label="Product / food name">{field("product_name", "e.g. packaged juice", true)}</Field>
              <Field label="Shop / outlet name">{field("place_name", "Where did you get it?")}</Field>
              <Field label="Location" className="wide">{field("location", "Area, city or landmark")}</Field>
              <Field label="Date noticed">{field("incident_date", "", false, "date")}</Field>
              <Field label="Your name (optional)">{field("reporter_name", "Name")}</Field>
              <Field label="What happened?" className="wide"><textarea value={form.description} onChange={e => setF("description", e.target.value)} rows="4" placeholder="Describe what you observed, not assumptions." required /></Field>
              <Field label="Contact detail (optional)" className="wide">{field("reporter_contact", "Email or phone, if you want to be contacted")}</Field>
            </div>
            <div className="form-end"><p><b>Selected:</b> {categories.find(c => c[0] === category)?.[2]}<br/><small>Share only information you're comfortable providing.</small></p><button className="btn btn-dark" disabled={busy}>{busy ? "Submitting…" : "Submit report"} ↗</button></div>
          </form>
        </div>
        <aside className="aside"><span className="aside-icon">✳</span><p className="eyebrow">A QUICK NOTE</p><h3>Details help. Certainty isn't required.</h3><p>If something seems wrong, describe what you observed and where. Avoid putting yourself at risk to collect evidence.</p><hr/><small>This demo does not send reports to government authorities or trigger real laboratory testing.</small></aside>
      </section>}

      {tab === "track" && <section className="panel standalone"><p className="eyebrow">02 / FOLLOW YOUR CASE</p><h2>Find your report</h2><p className="muted">Enter the case reference shown after submission.</p>
        <form className="search-form" onSubmit={findCase}><Field label="Case reference"><input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. FS-2026-0001" required /></Field><button className="btn btn-dark" disabled={busy}>{busy ? "Searching…" : "Track case"}</button></form>
        {tracked && <div className="result"><div className="result-head"><div><small>CASE REFERENCE</small><h3>{caseNo(tracked)}</h3></div><span className="status">{titleCase(status(tracked))}</span></div><div className="details"><div><small>Product</small><b>{tracked.product_name || tracked.food_name || "Not provided"}</b></div><div><small>Category</small><b>{titleCase(tracked.category)}</b></div><div><small>Location</small><b>{tracked.location || "Not provided"}</b></div><div><small>Description</small><b>{tracked.description || "—"}</b></div></div></div>}
        <p className="footnote">Tracking displays records available from this prototype's backend. It is not an official case-status service.</p>
      </section>}

      {tab === "review" && <section className="panel standalone"><p className="eyebrow">03 / INTERNAL DEMO</p><h2>Human review</h2><p className="muted">Record a demonstration review decision for an existing case.</p>
        <form className="fields" onSubmit={saveReview}>
          <Field label="Case reference"><input value={review.ref} onChange={e => setReview(p => ({...p, ref:e.target.value}))} placeholder="Enter case reference" required /></Field>
          <Field label="Review decision"><select value={review.decision} onChange={e => setReview(p => ({...p, decision:e.target.value}))}><option value="needs_review">Needs further review</option><option value="information_requested">More information requested</option><option value="referred">Marked for referral (demo)</option><option value="closed_demo">Closed in demo</option></select></Field>
          <Field label="Reviewer notes" className="wide"><textarea rows="4" value={review.notes} onChange={e => setReview(p => ({...p, notes:e.target.value}))} placeholder="Briefly explain the demo decision" /></Field>
          <div className="wide form-end"><p><small>Reviewer actions are simulated and are not official findings.</small></p><button className="btn btn-dark" disabled={busy}>{busy ? "Saving…" : "Save demo review"} ↗</button></div>
        </form>
      </section>}

      {tab === "workflow" && <section className="panel standalone"><p className="eyebrow">04 / DEMO ROUTING</p><h2>Authority & lab workflow</h2><p className="muted">Show how a case could be routed in a future connected system.</p>
        <div className="workflow-cards"><div><b>1</b><strong>Report received</strong><small>Case exists in prototype</small></div><div><b>2</b><strong>Human review</strong><small>Reviewer records demo decision</small></div><div><b>3</b><strong>Potential referral</strong><small>Demo workflow action only</small></div></div>
        <form className="fields" onSubmit={saveWorkflow}>
          <Field label="Case reference"><input value={workflow.ref} onChange={e => setWorkflow(p => ({...p, ref:e.target.value}))} placeholder="Enter case reference" required /></Field>
          <Field label="Demo action"><select value={workflow.action} onChange={e => setWorkflow(p => ({...p, action:e.target.value}))}><option value="assign_authority">Assign demo food safety authority</option><option value="lab_referral">Mark for demo laboratory referral</option><option value="vendor_followup">Record demo vendor follow-up</option><option value="request_information">Request more information (demo)</option></select></Field>
          <Field label="Notes (optional)" className="wide"><textarea rows="3" value={workflow.notes} onChange={e => setWorkflow(p => ({...p, notes:e.target.value}))} placeholder="Add a short note about the simulated next step" /></Field>
          <div className="wide form-end"><p><small>No real authority is notified and no lab test is ordered.</small></p><button className="btn btn-dark" disabled={busy}>{busy ? "Recording…" : "Record demo action"} ↗</button></div>
        </form>
      </section>}

      {tab === "overview" && <section className="panel standalone"><p className="eyebrow">05 / NATIONAL OVERVIEW</p><h2>A wider view of reported concerns</h2><p className="muted">A simple overview of demo data returned by the backend.</p>
        <div className="stats"><div className="stat featured"><small>Cases in this demo</small><strong>{dashboard.total_cases ?? dashboard.total ?? cases.length}</strong><span>Available prototype records</span></div><div className="stat"><small>Needs review</small><strong>{dashboard.pending_cases ?? cases.filter(c => /pending|review|submitted/i.test(status(c))).length}</strong><span>Based on case status</span></div><div className="stat"><small>Locations represented</small><strong>{dashboard.locations_count ?? new Set(cases.map(c => c.location).filter(Boolean)).size}</strong><span>Where a location was provided</span></div></div>
        <div className="table-wrap"><table><thead><tr><th>Case reference</th><th>Product</th><th>Category</th><th>Location</th><th>Status</th></tr></thead><tbody>{cases.length ? cases.map((c,i) => <tr key={c.id || caseNo(c) || i}><td>{caseNo(c)}</td><td>{c.product_name || c.food_name || "—"}</td><td>{titleCase(c.category)}</td><td>{c.location || "—"}</td><td><span className="status">{titleCase(status(c))}</span></td></tr>) : <tr><td colSpan="5" className="empty">No cases returned yet. Submit a test report to populate the demo.</td></tr>}</tbody></table></div>
        <button className="btn btn-outline" onClick={load}>Refresh overview ↻</button><p className="footnote">This is a prototype overview, not a verified national surveillance dashboard.</p>
      </section>}
    </main>
    <footer><span><b className="brand-mark mini">FS</b> Food Safety & Quality Reporter</span><small>Clarity first. Follow-up matters.</small></footer>
  </div>;
}
