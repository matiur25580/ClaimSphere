import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, ArrowUpRight, FilePlus2, RefreshCw } from "lucide-react";

type Policy={_id:string;policyNumber:string;productLine:string;currency:string;coverageLimitMinor:number;status:string};
type Claim={_id:string;claimNumber:string;policyId:Policy|string;lossType:string;severity:string;status:string;estimatedLossMinor:number;currency:string;reportedAt:string};
type PageData<T>={items:T[];pagination:{total:number}};
async function request<T>(path:string,token:string,init:RequestInit={}):Promise<T>{
 const response=await fetch((import.meta.env.VITE_API_URL??"http://localhost:4000/api/v1").replace(/\/$/,"")+path,{...init,credentials:"include",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...init.headers}});
 const body=await response.json() as {data?:T;error?:{message?:string}};
 if(!response.ok||body.data===undefined)throw new Error(body.error?.message??"The request could not be completed.");
 return body.data;
}
const money=(minor:number,currency:string)=>new Intl.NumberFormat(undefined,{style:"currency",currency}).format(minor/100);
const title=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());

export function ClaimsWorkspace({accessToken,role}:{accessToken:string;role:string}){
 const [claims,setClaims]=useState<Claim[]>([]),[policies,setPolicies]=useState<Policy[]>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [form,setForm]=useState({policyId:"",lossDate:new Date().toISOString().slice(0,10),lossType:"collision",lossDescription:"",estimatedLoss:"",severity:"medium"});
 const canCreate=["organization_admin","claims_manager","claims_adjuster","policyholder"].includes(role);
 const refresh=useCallback(async()=>{
  const [claimData,policyData]=await Promise.all([
   request<{claims:Claim[];pagination:{total:number}}>("/claims?limit=50",accessToken),
   request<{policies:Policy[]}>("/policies?limit=100",accessToken)
  ]);
  setClaims(claimData.claims);setPolicies(policyData.policies.filter(p=>p.status==="active"));
  setForm(current=>({...current,policyId:current.policyId||policyData.policies.find(p=>p.status==="active")?._id||""}));
 },[accessToken]);
 useEffect(()=>{setLoading(true);void refresh().catch(e=>setError(e instanceof Error?e.message:"Unable to load claims.")).finally(()=>setLoading(false));},[refresh]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const amount=Math.round(Number(form.estimatedLoss)*100);
  if(!Number.isSafeInteger(amount)||amount<0){setError("Enter a valid estimated loss amount.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   await request("/claims",accessToken,{method:"POST",body:JSON.stringify({policyId:form.policyId,lossDate:new Date(form.lossDate+"T12:00:00.000Z").toISOString(),lossType:form.lossType,lossDescription:form.lossDescription,estimatedLossMinor:amount,severity:form.severity})});
   setNotice("First Notice of Loss submitted. The claim is now in the triage queue.");
   setForm(current=>({...current,lossDescription:"",estimatedLoss:""}));await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit claim.");}
  finally{setBusy(false);}
 }
 const count=(status:string)=>claims.filter(c=>c.status===status).length;
 return <section className="claims-live">
  <div className="live-heading"><div><span className="eyebrow">LIVE CLAIMS OPERATIONS</span><h2>Claims intake & triage</h2><p>Real tenant data from the policy and claims APIs. No sample claims are mixed into this queue.</p></div><button className="live-refresh" onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div>
  {error&&<div className="live-alert error" role="alert">{error}</div>}{notice&&<div className="live-alert success" role="status">{notice}</div>}
  <div className="live-metrics">
   <article><span>Total claims</span><strong>{claims.length}</strong></article><article><span>Submitted</span><strong>{count("submitted")}</strong></article><article><span>Under investigation</span><strong>{count("investigation")}</strong></article><article><span>Awaiting documents</span><strong>{count("awaiting_documents")}</strong></article>
  </div>
  <div className="live-grid">
   <article className="live-panel"><div className="live-panel-head"><div><span className="eyebrow">FNOL REGISTER</span><h3>Recent claims</h3></div><span className="live-count">{claims.length} loaded</span></div>
    {loading?<div className="live-empty">Loading claims…</div>:claims.length===0?<div className="live-empty"><AlertTriangle size={22}/><strong>No claims yet</strong><span>Submit the first loss notice to start the workflow.</span></div>:<div className="live-table-wrap"><table className="live-table"><thead><tr><th>CLAIM</th><th>LOSS TYPE</th><th>SEVERITY</th><th>STATUS</th><th>ESTIMATED LOSS</th></tr></thead><tbody>{claims.map(claim=><tr key={claim._id}><td><strong>{claim.claimNumber}</strong><small>{new Date(claim.reportedAt).toLocaleDateString()}</small></td><td>{title(claim.lossType)}</td><td><span className={"live-severity "+claim.severity}>{title(claim.severity)}</span></td><td><span className="live-status">{title(claim.status)}</span></td><td>{money(claim.estimatedLossMinor,claim.currency)}</td></tr>)}</tbody></table></div>}
   </article>
   <article className="live-panel live-form-panel"><div className="live-panel-head"><div><span className="eyebrow">FIRST NOTICE OF LOSS</span><h3>Report a loss</h3></div><FilePlus2 size={19}/></div>
    {canCreate?<form className="live-form" onSubmit={submit}>
     <label>Covered policy<select required value={form.policyId} onChange={e=>setForm({...form,policyId:e.target.value})}><option value="">Select an active policy</option>{policies.map(p=><option key={p._id} value={p._id}>{p.policyNumber} · {title(p.productLine)} · {money(p.coverageLimitMinor,p.currency)}</option>)}</select></label>
     <label>Date of loss<input type="date" required value={form.lossDate} onChange={e=>setForm({...form,lossDate:e.target.value})}/></label>
     <label>Loss type<select value={form.lossType} onChange={e=>setForm({...form,lossType:e.target.value})}><option value="collision">Collision</option><option value="theft">Theft</option><option value="property_damage">Property damage</option><option value="water_damage">Water damage</option><option value="fire">Fire</option><option value="medical">Medical</option><option value="travel_disruption">Travel disruption</option><option value="liability">Liability</option><option value="other">Other</option></select></label>
     <label>Estimated loss amount<input type="number" min="0" step="0.01" required value={form.estimatedLoss} onChange={e=>setForm({...form,estimatedLoss:e.target.value})} placeholder="Estimated amount"/></label>
     <label>Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
     <label>Incident description<textarea required minLength={10} maxLength={5000} rows={4} value={form.lossDescription} onChange={e=>setForm({...form,lossDescription:e.target.value})} placeholder="Describe when and how the loss occurred, known circumstances and immediate impact."/></label>
     <button className="primary-button" disabled={busy||!policies.length}>{busy?"Submitting…":"Submit first notice"} <ArrowUpRight size={15}/></button>
     {!policies.length&&<small>No active policies are available in this organization. A claims manager must register and activate a policy first.</small>}
    </form>:<p className="live-empty">Your role can review claims but cannot submit a new notice.</p>}
   </article>
  </div>
 </section>;
}
