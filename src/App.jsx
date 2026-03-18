import { useState, useEffect } from "react";

const ADMIN_EMAIL = "write.shawon@gmail.com";
const ADMIN_PASSWORD = "A123456a";

const COLORS = ["#e8673a","#3ecf7a","#4fa8e8","#a78bfa","#f5a623","#e85577","#06b6d4","#f0c040"];

const initialProjects = [
  {
    id:"p1", name:"Website Redesign", client:"Acme Corp",
    desc:"Full redesign and development — modern, fast, conversion-focused.",
    status:"active", color:"#e8673a", start:"2025-03-01", deadline:"2025-04-30", email:"contact@acmecorp.com",
    updates:[
      {id:"u1",title:"Project Kickoff",desc:"Held kickoff meeting. Gathered requirements, branding assets, and defined the sitemap and user flows.",status:"completed",date:"2025-03-03",tags:["Planning"],link:""},
      {id:"u2",title:"Wireframes & Design System",desc:"Completed wireframes for all 8 pages. Built the component library. Awaiting client feedback on hero concepts.",status:"in-progress",date:"2025-03-14",tags:["Design","UI/UX"],link:"https://figma.com"},
      {id:"u3",title:"Frontend Development",desc:"Dev starts once designs are approved. Using Next.js. Estimated 3 weeks for full build.",status:"planned",date:"2025-03-28",tags:["Dev","Next.js"],link:""}
    ]
  },
  {
    id:"p2", name:"Mobile App MVP", client:"StartupXYZ",
    desc:"React Native app for iOS & Android. Auth, dashboard, notifications.",
    status:"active", color:"#3ecf7a", start:"2025-02-15", deadline:"2025-05-15", email:"hello@startupxyz.io",
    updates:[
      {id:"u4",title:"Architecture Planning",desc:"Finalized tech stack and repo structure. CI/CD pipeline fully set up.",status:"completed",date:"2025-02-18",tags:["Backend","DevOps"],link:""},
      {id:"u5",title:"Auth & Onboarding Screens",desc:"Login, sign-up, and onboarding flow complete on both platforms. Pending QA review.",status:"in-progress",date:"2025-03-10",tags:["React Native"],link:""}
    ]
  }
];

function uid(){ return "id"+Date.now()+Math.random().toString(36).slice(2,5); }
function today(){ return new Date().toISOString().slice(0,10); }
function fmtDate(s){
  if(!s) return "—";
  const d=new Date(s+"T00:00:00");
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function slugify(s){ return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }
function projStatusLabel(s){ return {active:"Active","on-hold":"On Hold",completed:"Completed"}[s]||s; }
function updStatusLabel(s){ return {completed:"Completed","in-progress":"In Progress",planned:"Planned"}[s]||s; }

const statusColors={
  completed:{bg:"rgba(62,207,122,0.13)",color:"#3ecf7a"},
  "in-progress":{bg:"rgba(245,166,35,0.13)",color:"#f5a623"},
  planned:{bg:"rgba(79,168,232,0.13)",color:"#4fa8e8"},
  active:{bg:"rgba(62,207,122,0.13)",color:"#3ecf7a"},
  "on-hold":{bg:"rgba(245,166,35,0.13)",color:"#f5a623"},
  "completed-proj":{bg:"rgba(79,168,232,0.13)",color:"#4fa8e8"},
};

const Icon={
  dashboard:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  plus:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  eye:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  logout:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  link:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  copy:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrowLeft:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrowRight:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  eyeOff:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  folder:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  activity:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  calendar:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  tag:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  menu:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  x:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  lock:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  mail:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  warning:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  externalLink:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  pulse:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const STYLES=`
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 24px rgba(232,103,58,0.25)}50%{box-shadow:0 0 44px rgba(232,103,58,0.5)}}
@keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.6)}}
*{box-sizing:border-box;margin:0;padding:0;}
*,input,textarea,select,button{font-family:'Open Sans',sans-serif;}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#2a2a2e;border-radius:4px}
body{background:#0c0c0e;color:#f0efe8}
input,textarea,select{color:#f0efe8}
input::placeholder,textarea::placeholder{color:#4a4a55}
@media(max-width:768px){
  .sidebar-desktop{display:none!important}
  .mobile-topbar-btn{display:flex!important}
  .detail-grid{grid-template-columns:1fr!important}
  .form-row{grid-template-columns:1fr!important}
  .stats-grid{grid-template-columns:repeat(2,1fr)!important}
}
@media(min-width:769px){
  .mobile-overlay{display:none!important}
  .mobile-topbar-btn{display:none!important}
}
`;

function StyleInjector(){
  useEffect(()=>{
    if(document.getElementById("pp-styles")) return;
    const s=document.createElement("style");
    s.id="pp-styles";s.textContent=STYLES;
    document.head.appendChild(s);
  },[]);
  return null;
}

function Badge({status,label}){
  const sc=statusColors[status]||{bg:"#222",color:"#aaa"};
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",padding:"3px 9px",borderRadius:20,background:sc.bg,color:sc.color,whiteSpace:"nowrap",flexShrink:0}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:sc.color,flexShrink:0}}/>
      {label||updStatusLabel(status)}
    </span>
  );
}

function Btn({onClick,children,variant="primary",size="md",style={},disabled=false,type="button"}){
  const base={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:9,transition:"all 0.18s",opacity:disabled?0.5:1,letterSpacing:"0.01em"};
  const v={
    primary:{background:"#e8673a",color:"#fff"},
    ghost:{background:"transparent",color:"#9b9ba3",border:"1px solid #2a2a2e"},
    danger:{background:"rgba(232,85,85,0.1)",color:"#e85555",border:"1px solid rgba(232,85,85,0.22)"},
    subtle:{background:"#1c1c1f",color:"#9b9ba3",border:"1px solid #2a2a2e"},
  };
  const sz={sm:{padding:"6px 12px",fontSize:"0.78rem"},md:{padding:"9px 16px",fontSize:"0.84rem"},lg:{padding:"12px 22px",fontSize:"0.9rem"}};
  return <button type={type} disabled={disabled} onClick={onClick} style={{...base,...v[variant],...sz[size],...style}}>{children}</button>;
}

function Field({label,children,hint}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
      <label style={{fontSize:"0.73rem",fontWeight:600,color:"#9b9ba3",letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</label>
      {children}
      {hint&&<div style={{fontSize:"0.71rem",color:"#4a4a55"}}>{hint}</div>}
    </div>
  );
}

const INP={fontSize:"0.87rem",padding:"10px 13px",border:"1px solid #2a2a2e",borderRadius:9,background:"#1a1a1d",color:"#f0efe8",outline:"none",width:"100%",transition:"border-color 0.2s"};
const TEXTAREA={...INP,minHeight:90,resize:"vertical"};

function Modal({open,onClose,title,children,maxWidth=500}){
  useEffect(()=>{
    document.body.style.overflow=open?"hidden":"";
    return()=>{document.body.style.overflow="";};
  },[open]);
  if(!open) return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn 0.18s ease"}}>
      <div style={{background:"#111113",border:"1px solid #252528",borderRadius:18,padding:28,width:"100%",maxWidth,maxHeight:"92vh",overflowY:"auto",animation:"scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontWeight:700,fontSize:"1.05rem",letterSpacing:"-0.01em"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #252528",color:"#6b6b72",width:30,height:30,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({msg}){
  if(!msg) return null;
  return(
    <div style={{position:"fixed",bottom:24,right:24,background:"#f0efe8",color:"#0c0c0e",padding:"11px 18px",borderRadius:12,fontSize:"0.83rem",fontWeight:700,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:"#3ecf7a",display:"flex"}}>{Icon.check}</span>{msg}
    </div>
  );
}

function Topbar({title,subtitle,children,onMenu}){
  return(
    <div style={{padding:"13px 20px",borderBottom:"1px solid #1e1e21",background:"rgba(17,17,19,0.97)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <button className="mobile-topbar-btn" onClick={onMenu} style={{display:"none",background:"none",border:"1px solid #2a2a2e",color:"#9b9ba3",width:34,height:34,borderRadius:8,cursor:"pointer",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Icon.menu}</button>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:700,fontSize:"1.05rem",letterSpacing:"-0.01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</div>
          {subtitle&&<div style={{fontSize:"0.73rem",color:"#6b6b72",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>{children}</div>
    </div>
  );
}

function InfoRow({label,value,icon,last}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:last?"none":"1px solid #1e1e21",gap:8}}>
      <span style={{fontSize:"0.77rem",color:"#6b6b72",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>{icon&&<span style={{opacity:0.6}}>{icon}</span>}{label}</span>
      <span style={{fontSize:"0.82rem",fontWeight:600,textAlign:"right"}}>{value}</span>
    </div>
  );
}

/* ════ CLIENT PUBLIC VIEW (no login needed) ════ */
function ClientPublicView({project}){
  return(
    <div style={{minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8",animation:"fadeIn 0.4s ease"}}>
      {/* Minimal header */}
      <div style={{padding:"16px 24px",borderBottom:"1px solid #1e1e21",background:"#111113",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:28,height:28,background:"linear-gradient(135deg,#e8673a,#c4512a)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{Icon.pulse}</div>
        <div style={{fontWeight:800,fontSize:"0.95rem",letterSpacing:"-0.03em"}}>Project<span style={{color:"#e8673a"}}>Pulse</span></div>
      </div>

      {/* Hero */}
      <div style={{background:"#111113",borderBottom:"1px solid #1e1e21",padding:"44px 24px 34px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-100,right:-60,width:340,height:340,borderRadius:"50%",background:`radial-gradient(circle,${project.color}18,transparent 68%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)",backgroundSize:"36px 36px",pointerEvents:"none"}}/>
        <div style={{maxWidth:640,margin:"0 auto",position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:"0.67rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:project.color,background:`${project.color}16`,border:`1px solid ${project.color}30`,padding:"4px 12px",borderRadius:20,marginBottom:18,animation:"fadeUp 0.45s ease"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:project.color,display:"inline-block",animation:"pulseDot 2s ease infinite"}}/>
            Live Updates
          </div>
          <h1 style={{fontWeight:800,fontSize:"clamp(1.6rem,4vw,2.5rem)",letterSpacing:"-0.04em",marginBottom:10,lineHeight:1.1,animation:"fadeUp 0.45s ease 0.05s both"}}>{project.name}</h1>
          <p style={{fontSize:"0.91rem",color:"#9b9ba3",maxWidth:420,lineHeight:1.68,marginBottom:26,animation:"fadeUp 0.45s ease 0.1s both"}}>{project.desc||""}</p>
          <div style={{display:"flex",gap:22,flexWrap:"wrap",animation:"fadeUp 0.45s ease 0.15s both"}}>
            {[["Client",project.client,Icon.user],["Status",projStatusLabel(project.status),Icon.activity],["Started",fmtDate(project.start),Icon.calendar],["Deadline",fmtDate(project.deadline),Icon.calendar]].map(([l,v,ic])=>(
              <div key={l}>
                <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#4a4a55",display:"flex",alignItems:"center",gap:4,marginBottom:4}}>{ic}{l}</div>
                <div style={{fontSize:"0.87rem",fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{maxWidth:640,margin:"0 auto",padding:"30px 20px 60px"}}>
        <div style={{fontWeight:700,fontSize:"0.82rem",marginBottom:20,display:"flex",alignItems:"center",gap:10,color:"#6b6b72",letterSpacing:"0.04em",textTransform:"uppercase"}}>
          {Icon.activity} Project Updates
          <div style={{flex:1,height:1,background:"#1e1e21"}}/>
          <span style={{fontWeight:400,color:"#3a3a42"}}>{project.updates.length} total</span>
        </div>
        {project.updates.length===0?(
          <div style={{textAlign:"center",padding:"3rem",color:"#4a4a55",fontSize:"0.84rem"}}>No updates posted yet. Check back soon!</div>
        ):(
          [...project.updates].reverse().map((u,i,arr)=>{
            const dc={completed:"#3ecf7a","in-progress":"#f5a623",planned:"#4fa8e8"}[u.status]||"#e8673a";
            return(
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"28px 1fr",gap:"0 14px",animation:`fadeUp 0.45s ease ${i*0.07}s both`}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:11,height:11,borderRadius:"50%",background:dc,boxShadow:`0 0 0 3px ${dc}22`,marginTop:22,flexShrink:0}}/>
                  {i!==arr.length-1&&<div style={{flex:1,width:2,background:"linear-gradient(#1e1e21,#161618)",margin:"4px 0",minHeight:22}}/>}
                </div>
                <div>
                  <div style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:13,padding:"15px 18px",marginBottom:11,marginTop:10}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:9,flexWrap:"wrap"}}>
                      <div style={{fontWeight:700,fontSize:"0.91rem"}}>{u.title}</div>
                      <Badge status={u.status}/>
                    </div>
                    <div style={{fontSize:"0.83rem",color:"#9b9ba3",lineHeight:1.65}}>{u.desc}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:11,alignItems:"center"}}>
                      <span style={{fontSize:"0.7rem",color:"#4a4a55",marginRight:"auto",display:"flex",alignItems:"center",gap:4}}>{Icon.calendar} {fmtDate(u.date)}</span>
                      {u.tags.map(t=>(
                        <span key={t} style={{fontSize:"0.65rem",padding:"2px 7px",background:"#1a1a1d",border:"1px solid #1e1e21",borderRadius:4,color:"#6b6b72",display:"flex",alignItems:"center",gap:3}}>{Icon.tag} {t}</span>
                      ))}
                      {u.link&&(
                        <a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.72rem",color:"#e8673a",textDecoration:"none",padding:"2px 8px",background:"rgba(232,103,58,0.07)",border:"1px solid rgba(232,103,58,0.18)",borderRadius:5,display:"flex",alignItems:"center",gap:4}}>
                          {Icon.externalLink} View File
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ════ LOGIN ════ */
function LoginPage({onLogin}){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const [focused,setFocused]=useState("");

  function handle(e){
    e.preventDefault();
    setLoading(true);setErr("");
    setTimeout(()=>{
      if(email.trim()===ADMIN_EMAIL&&pw===ADMIN_PASSWORD){onLogin();}
      else{setErr("Incorrect email or password. Please try again.");setLoading(false);}
    },800);
  }

  return(
    <div style={{minHeight:"100vh",background:"#0c0c0e",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-160,left:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,103,58,0.09),transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-120,right:-80,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,168,232,0.07),transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:400,animation:"fadeUp 0.55s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:52,height:52,background:"linear-gradient(135deg,#e8673a,#c4512a)",borderRadius:15,marginBottom:16,animation:"glow 3s ease infinite"}}>
            <span style={{color:"#fff",display:"flex"}}>{Icon.pulse}</span>
          </div>
          <div style={{fontWeight:800,fontSize:"1.55rem",letterSpacing:"-0.04em"}}>Project<span style={{color:"#e8673a"}}>Pulse</span></div>
          <div style={{fontSize:"0.78rem",color:"#4a4a55",marginTop:6,letterSpacing:"0.02em"}}>Admin Portal</div>
        </div>
        <div style={{background:"#111113",border:"1px solid #222225",borderRadius:20,padding:30,boxShadow:"0 24px 72px rgba(0,0,0,0.6)"}}>
          <div style={{fontWeight:700,fontSize:"1.05rem",marginBottom:4,letterSpacing:"-0.01em"}}>Sign in to your account</div>
          <div style={{fontSize:"0.79rem",color:"#6b6b72",marginBottom:24}}>Authorized personnel only</div>
          <form onSubmit={handle}>
            <Field label="Email">
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#4a4a55",display:"flex",pointerEvents:"none"}}>{Icon.mail}</span>
                <input type="email" value={email} required onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused("e")} onBlur={()=>setFocused("")} placeholder="Enter your email" style={{...INP,paddingLeft:38,borderColor:focused==="e"?"#e8673a":"#2a2a2e"}}/>
              </div>
            </Field>
            <Field label="Password">
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#4a4a55",display:"flex",pointerEvents:"none"}}>{Icon.lock}</span>
                <input type={showPw?"text":"password"} value={pw} required onChange={e=>setPw(e.target.value)} onFocus={()=>setFocused("p")} onBlur={()=>setFocused("")} placeholder="Enter your password" style={{...INP,paddingLeft:38,paddingRight:42,borderColor:focused==="p"?"#e8673a":"#2a2a2e"}}/>
                <button type="button" onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#4a4a55",cursor:"pointer",display:"flex",padding:3}}>{showPw?Icon.eyeOff:Icon.eye}</button>
              </div>
            </Field>
            {err&&(
              <div style={{background:"rgba(232,85,85,0.08)",border:"1px solid rgba(232,85,85,0.2)",borderRadius:9,padding:"10px 13px",fontSize:"0.8rem",color:"#e85555",marginBottom:14,display:"flex",alignItems:"center",gap:7,animation:"fadeUp 0.2s ease"}}>
                {Icon.warning} {err}
              </div>
            )}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"12px",background:loading?"#252528":"linear-gradient(135deg,#e8673a,#c4512a)",color:loading?"#6b6b72":"#fff",border:"none",borderRadius:10,fontSize:"0.88rem",fontWeight:700,cursor:loading?"not-allowed":"pointer",transition:"all 0.2s",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:9,letterSpacing:"0.02em"}}>
              {loading?(<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.25)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/> Signing in...</>):<>Sign In {Icon.arrowRight}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ════ MAIN APP ════ */
export default function App(){
  const [projects,setProjects]=useState(initialProjects);

  /* ── Check URL for public client view ── */
  const params=new URLSearchParams(window.location.search);
  const isClientView=params.get("view")==="client";
  const clientProjectId=params.get("project");
  const publicProject=isClientView ? projects.find(p=>p.id===clientProjectId) : null;

  /* If URL is a public client link → render client view directly, no login */
  if(isClientView && publicProject){
    return(<><StyleInjector/><ClientPublicView project={publicProject}/></>);
  }
  if(isClientView && !publicProject){
    return(
      <><StyleInjector/>
      <div style={{minHeight:"100vh",background:"#0c0c0e",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b6b72",flexDirection:"column",gap:12}}>
        <div style={{opacity:0.3}}>{Icon.folder}</div>
        <div style={{fontWeight:600}}>Project not found</div>
        <div style={{fontSize:"0.8rem"}}>This link may be invalid or the project was deleted.</div>
      </div>
      </>
    );
  }

  return <AdminApp projects={projects} setProjects={setProjects}/>;
}

/* ════ ADMIN APP (login protected) ════ */
function AdminApp({projects,setProjects}){
  const [loggedIn,setLoggedIn]=useState(false);
  const [activeProjectId,setActiveProjectId]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [toast,setToast]=useState("");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [projModal,setProjModal]=useState(false);
  const [editProjId,setEditProjId]=useState(null);
  const [pm,setPm]=useState({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});
  const [updModal,setUpdModal]=useState(false);
  const [editUpdId,setEditUpdId]=useState(null);
  const [um,setUm]=useState({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
  const [tagInput,setTagInput]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [copied,setCopied]=useState(false);

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2600);}
  function getP(id){return projects.find(p=>p.id===id);}
  function logout(){setLoggedIn(false);setPage("dashboard");setActiveProjectId(null);}
  function goProject(id){setActiveProjectId(id);setPage("project");setSidebarOpen(false);}
  function goDashboard(){setPage("dashboard");setActiveProjectId(null);setSidebarOpen(false);}

  function openNewProject(){
    setEditProjId(null);
    setPm({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});
    setProjModal(true);
  }
  function openEditProject(){
    const p=getP(activeProjectId);
    setEditProjId(p.id);
    setPm({name:p.name,client:p.client,desc:p.desc,status:p.status,color:p.color,start:p.start||"",deadline:p.deadline||"",email:p.email||""});
    setProjModal(true);
  }
  function saveProject(){
    if(!pm.name.trim()||!pm.client.trim()){showToast("Name and client required.");return;}
    if(editProjId){
      setProjects(ps=>ps.map(p=>p.id===editProjId?{...p,...pm}:p));
      showToast("Project updated!");
    } else {
      setProjects(ps=>[...ps,{id:uid(),updates:[],...pm}]);
      showToast("Project created!");
    }
    setProjModal(false);
  }
  function deleteProject(id){
    setProjects(ps=>ps.filter(p=>p.id!==id));
    goDashboard();showToast("Project deleted.");setConfirm(null);
  }
  function openAddUpdate(){
    setEditUpdId(null);
    setUm({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
    setTagInput("");setUpdModal(true);
  }
  function openEditUpdate(uid_){
    const p=getP(activeProjectId);
    const u=p.updates.find(x=>x.id===uid_);
    setEditUpdId(uid_);
    setUm({title:u.title,desc:u.desc,status:u.status,date:u.date,link:u.link||"",tags:[...u.tags]});
    setTagInput("");setUpdModal(true);
  }
  function saveUpdate(){
    if(!um.title.trim()||!um.desc.trim()){showToast("Title and description required.");return;}
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId) return p;
      if(editUpdId) return{...p,updates:p.updates.map(u=>u.id===editUpdId?{...u,...um}:u)};
      return{...p,updates:[...p.updates,{id:uid(),...um}]};
    }));
    showToast(editUpdId?"Update saved!":"Update posted!");setUpdModal(false);
  }
  function deleteUpdate(uid_){
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,updates:p.updates.filter(u=>u.id!==uid_)}));
    showToast("Update deleted.");setConfirm(null);
  }
  function addTag(e){
    if(e.key==="Enter"&&tagInput.trim()){
      e.preventDefault();
      const t=tagInput.trim();
      if(!um.tags.includes(t)) setUm(u=>({...u,tags:[...u.tags,t]}));
      setTagInput("");
    }
  }
  function removeTag(i){setUm(u=>({...u,tags:u.tags.filter((_,idx)=>idx!==i)}));}

  /* Copy share link — builds ?view=client&project=ID URL */
  function copyShareLink(){
    const p=getP(activeProjectId);
    const base=window.location.href.split("?")[0];
    const shareUrl=`${base}?view=client&project=${p.id}`;
    navigator.clipboard.writeText(shareUrl).catch(()=>{});
    setCopied(true);
    showToast("Client link copied!");
    setTimeout(()=>setCopied(false),2200);
  }

  const activeProject=getP(activeProjectId);
  const stats={
    total:projects.length,
    active:projects.filter(p=>p.status==="active").length,
    onhold:projects.filter(p=>p.status==="on-hold").length,
    updates:projects.reduce((a,p)=>a+p.updates.length,0),
  };

  function SidebarContent(){
    return(
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid #1e1e21"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#e8673a,#c4512a)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0,boxShadow:"0 4px 14px rgba(232,103,58,0.3)"}}>{Icon.pulse}</div>
            <div>
              <div style={{fontWeight:800,fontSize:"1rem",letterSpacing:"-0.03em"}}>Project<span style={{color:"#e8673a"}}>Pulse</span></div>
              <div style={{fontSize:"0.63rem",color:"#4a4a55",marginTop:1,letterSpacing:"0.04em",textTransform:"uppercase"}}>Admin Panel</div>
            </div>
          </div>
        </div>
        <div style={{padding:"12px 10px 6px"}}>
          <div style={{fontSize:"0.62rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#3a3a42",padding:"0 8px",marginBottom:6,fontWeight:700}}>Menu</div>
          <div onClick={goDashboard} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:9,cursor:"pointer",fontSize:"0.84rem",fontWeight:600,background:page==="dashboard"?"#1e1e21":"transparent",color:page==="dashboard"?"#f0efe8":"#6b6b72",border:`1px solid ${page==="dashboard"?"#2a2a2e":"transparent"}`,transition:"all 0.15s",marginBottom:2}}>
            {Icon.dashboard} Dashboard
          </div>
        </div>
        <div style={{padding:"8px 10px",flex:1,overflowY:"auto"}}>
          <div style={{fontSize:"0.62rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#3a3a42",padding:"0 8px",marginBottom:6,fontWeight:700}}>Projects <span style={{color:"#4a4a55"}}>{projects.length}</span></div>
          {projects.length===0&&<div style={{fontSize:"0.78rem",color:"#4a4a55",padding:"6px 10px"}}>No projects yet</div>}
          {projects.map((p,i)=>(
            <div key={p.id} onClick={()=>goProject(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,cursor:"pointer",fontSize:"0.83rem",fontWeight:600,marginBottom:2,background:activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.08)":"transparent",color:activeProjectId===p.id&&page!=="dashboard"?"#f0efe8":"#6b6b72",border:`1px solid ${activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.2)":"transparent"}`,transition:"all 0.15s",animation:`slideInLeft 0.35s ease ${i*0.04}s both`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 7px ${p.color}77`}}/>
              <div style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
              <div style={{fontSize:"0.65rem",background:"#1a1a1d",border:"1px solid #2a2a2e",color:"#4a4a55",padding:"1px 7px",borderRadius:20,flexShrink:0}}>{p.updates.length}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 10px 14px",borderTop:"1px solid #1e1e21"}}>
          <button onClick={openNewProject} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",background:"linear-gradient(135deg,#e8673a,#c4512a)",color:"#fff",border:"none",borderRadius:9,fontSize:"0.83rem",fontWeight:700,cursor:"pointer",marginBottom:8,boxShadow:"0 4px 16px rgba(232,103,58,0.28)",transition:"all 0.2s"}}>
            {Icon.plus} New Project
          </button>
          <button onClick={logout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"8px",background:"transparent",color:"#4a4a55",border:"1px solid #1e1e21",borderRadius:9,fontSize:"0.79rem",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
            {Icon.logout} Sign Out
          </button>
        </div>
      </div>
    );
  }

  if(!loggedIn) return(<><StyleInjector/><LoginPage onLogin={()=>setLoggedIn(true)}/></>);

  return(
    <>
      <StyleInjector/>
      <div style={{display:"flex",minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8"}}>
        <aside className="sidebar-desktop" style={{width:240,flexShrink:0,background:"#111113",borderRight:"1px solid #1e1e21",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <SidebarContent/>
        </aside>
        {sidebarOpen&&(
          <div className="mobile-overlay" onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,animation:"fadeIn 0.2s ease"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:250,height:"100%",background:"#111113",borderRight:"1px solid #1e1e21",overflowY:"auto",animation:"slideInLeft 0.25s ease"}}>
              <SidebarContent/>
            </div>
          </div>
        )}

        <div style={{flex:1,overflowX:"hidden",minWidth:0}}>

          {/* DASHBOARD */}
          {page==="dashboard"&&(
            <div style={{animation:"fadeIn 0.35s ease"}}>
              <Topbar title="Dashboard" subtitle="All projects at a glance" onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={openNewProject} size="sm">{Icon.plus} New Project</Btn>
              </Topbar>
              <div style={{padding:"22px 20px"}}>
                <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:26}}>
                  {[
                    {label:"Total Projects",val:stats.total,color:"#f0efe8",icon:Icon.folder},
                    {label:"Active",val:stats.active,color:"#3ecf7a",icon:Icon.activity},
                    {label:"On Hold",val:stats.onhold,color:"#f5a623",icon:Icon.warning},
                    {label:"Updates Posted",val:stats.updates,color:"#e8673a",icon:Icon.edit},
                  ].map((s,i)=>(
                    <div key={s.label} style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:14,padding:"18px 16px",animation:`fadeUp 0.45s ease ${i*0.07}s both`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:"0.69rem",color:"#4a4a55",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{s.label}</div>
                        <span style={{color:"#3a3a42",display:"flex"}}>{s.icon}</span>
                      </div>
                      <div style={{fontWeight:800,fontSize:"2rem",letterSpacing:"-0.05em",color:s.color,lineHeight:1}}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {projects.some(p=>p.updates.length>0)&&(
                  <div style={{marginBottom:26}}>
                    <div style={{fontWeight:700,fontSize:"0.82rem",marginBottom:12,color:"#6b6b72",letterSpacing:"0.04em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:7}}>{Icon.activity} Recent Activity</div>
                    <div style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:14,overflow:"hidden"}}>
                      {projects.flatMap(p=>p.updates.map(u=>({...u,pName:p.name,pColor:p.color,pId:p.id}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map((u,i,arr)=>(
                        <div key={u.id} onClick={()=>goProject(u.pId)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:i<arr.length-1?"1px solid #161618":"none",cursor:"pointer",transition:"background 0.15s",animation:`slideInRight 0.35s ease ${i*0.05}s both`}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:u.pColor,flexShrink:0,boxShadow:`0 0 8px ${u.pColor}66`}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"0.84rem",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.title}</div>
                            <div style={{fontSize:"0.71rem",color:"#6b6b72",marginTop:2,display:"flex",alignItems:"center",gap:5}}>{Icon.folder}<span>{u.pName}</span><span style={{color:"#3a3a42"}}>·</span>{Icon.calendar}<span>{fmtDate(u.date)}</span></div>
                          </div>
                          <Badge status={u.status}/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{fontWeight:700,fontSize:"0.82rem",marginBottom:12,color:"#6b6b72",letterSpacing:"0.04em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:7}}>{Icon.folder} All Projects</div>
                {projects.length===0?(
                  <div style={{textAlign:"center",padding:"4rem 2rem",color:"#4a4a55",animation:"fadeUp 0.5s ease"}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:14,opacity:0.3}}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                    <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:6,color:"#6b6b72"}}>No projects yet</div>
                    <div style={{fontSize:"0.8rem",marginBottom:20}}>Create your first project to get started</div>
                    <Btn onClick={openNewProject}>{Icon.plus} Create Project</Btn>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:13}}>
                    {projects.map((p,i)=>(
                      <div key={p.id} onClick={()=>goProject(p.id)} style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:15,padding:"20px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden",animation:`fadeUp 0.45s ease ${i*0.07}s both`}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${p.color},${p.color}55)`,borderRadius:"15px 15px 0 0"}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:"0.95rem",letterSpacing:"-0.01em"}}>{p.name}</div>
                            <div style={{fontSize:"0.74rem",color:"#6b6b72",marginTop:3,display:"flex",alignItems:"center",gap:4}}>{Icon.user} {p.client}</div>
                          </div>
                          <Badge status={p.status==="active"?"active":p.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(p.status)}/>
                        </div>
                        <div style={{fontSize:"0.8rem",color:"#6b6b72",lineHeight:1.55,marginBottom:14,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.desc||"No description."}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #161618"}}>
                          <span style={{fontSize:"0.72rem",color:"#4a4a55",display:"flex",alignItems:"center",gap:4}}>{Icon.edit} {p.updates.length} update{p.updates.length!==1?"s":""}</span>
                          {p.deadline&&<span style={{fontSize:"0.71rem",color:"#4a4a55",display:"flex",alignItems:"center",gap:4}}>{Icon.calendar} {fmtDate(p.deadline)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECT DETAIL */}
          {page==="project"&&activeProject&&(
            <div style={{animation:"fadeIn 0.3s ease"}}>
              <Topbar title={activeProject.name} subtitle={`Client: ${activeProject.client}`} onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={()=>setPage("client")} variant="ghost" size="sm">{Icon.eye} Client View</Btn>
                <Btn onClick={openEditProject} variant="subtle" size="sm">{Icon.edit} Edit</Btn>
                <Btn onClick={openAddUpdate} size="sm">{Icon.plus} Update</Btn>
              </Topbar>
              <div style={{padding:20}}>
                <div className="detail-grid" style={{display:"grid",gridTemplateColumns:"1fr 288px",gap:18,alignItems:"start"}}>
                  <div style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:15,overflow:"hidden"}}>
                    <div style={{padding:"15px 18px",borderBottom:"1px solid #1e1e21",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontWeight:700,fontSize:"0.9rem"}}>Updates <span style={{fontSize:"0.72rem",fontWeight:400,color:"#4a4a55",marginLeft:8}}>{activeProject.updates.length} total</span></div>
                      <Btn onClick={openAddUpdate} size="sm">{Icon.plus} Add</Btn>
                    </div>
                    <div style={{padding:8}}>
                      {activeProject.updates.length===0?(
                        <div style={{padding:"3rem",textAlign:"center",color:"#4a4a55",fontSize:"0.83rem"}}>
                          <div style={{display:"flex",justifyContent:"center",marginBottom:12,opacity:0.4}}>{Icon.edit}</div>
                          No updates yet. Add your first one!
                        </div>
                      ):(
                        [...activeProject.updates].reverse().map((u,ri)=>(
                          <div key={u.id} style={{padding:"13px 14px",borderRadius:11,marginBottom:3,animation:`fadeUp 0.3s ease ${ri*0.04}s both`}}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                              <Badge status={u.status}/>
                              <div style={{fontWeight:700,fontSize:"0.88rem",flex:1,lineHeight:1.3}}>{u.title}</div>
                              <div style={{display:"flex",gap:4,flexShrink:0}}>
                                <button onClick={()=>openEditUpdate(u.id)} style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7,border:"1px solid #1e1e21",background:"transparent",color:"#6b6b72",cursor:"pointer"}}>{Icon.edit}</button>
                                <button onClick={()=>setConfirm({title:"Delete Update",msg:`Delete "${u.title}"? This cannot be undone.`,onOk:()=>deleteUpdate(u.id)})} style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7,border:"1px solid rgba(232,85,85,0.18)",background:"rgba(232,85,85,0.06)",color:"#e85555",cursor:"pointer"}}>{Icon.trash}</button>
                              </div>
                            </div>
                            <div style={{fontSize:"0.82rem",color:"#9b9ba3",lineHeight:1.62}}>{u.desc}</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:9,flexWrap:"wrap"}}>
                              <span style={{fontSize:"0.7rem",color:"#4a4a55",marginRight:"auto",display:"flex",alignItems:"center",gap:4}}>{Icon.calendar} {fmtDate(u.date)}</span>
                              {u.tags.map(t=><span key={t} style={{fontSize:"0.65rem",padding:"2px 7px",background:"#1a1a1d",border:"1px solid #1e1e21",borderRadius:4,color:"#6b6b72",display:"flex",alignItems:"center",gap:3}}>{Icon.tag} {t}</span>)}
                              {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.72rem",color:"#e8673a",textDecoration:"none",padding:"2px 8px",background:"rgba(232,103,58,0.07)",border:"1px solid rgba(232,103,58,0.18)",borderRadius:5,display:"flex",alignItems:"center",gap:4}}>{Icon.externalLink} View File</a>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {/* Share link panel */}
                    <div style={{background:"rgba(232,103,58,0.05)",border:"1px solid rgba(232,103,58,0.15)",borderRadius:14,padding:16}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:"#e8673a",marginBottom:8,letterSpacing:"0.05em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>{Icon.link} Client Share Link</div>
                      <div style={{fontSize:"0.71rem",color:"#6b6b72",marginBottom:10,lineHeight:1.5}}>Share this link with your client. They can view updates without logging in.</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",background:"#0c0c0e",border:"1px solid #1e1e21",borderRadius:9,padding:"8px 10px",marginBottom:8}}>
                        <div style={{flex:1,fontSize:"0.68rem",color:"#6b6b72",fontFamily:"monospace",wordBreak:"break-all",lineHeight:1.4}}>
                          {window.location.href.split("?")[0]}?view=client&project={activeProject.id}
                        </div>
                        <button onClick={copyShareLink} style={{background:copied?"#3ecf7a":"#e8673a",color:"#fff",border:"none",padding:"5px 10px",borderRadius:7,fontSize:"0.71rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                          {copied?Icon.check:Icon.copy}{copied?"Copied!":"Copy"}
                        </button>
                      </div>
                      <button onClick={()=>setPage("client")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid rgba(232,103,58,0.2)",borderRadius:8,color:"#e8673a",fontSize:"0.77rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.2s"}}>
                        {Icon.eye} Preview Client View
                      </button>
                    </div>

                    <div style={{background:"#111113",border:"1px solid #1e1e21",borderRadius:14,padding:16}}>
                      <div style={{fontSize:"0.69rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#3a3a42",marginBottom:12,fontWeight:700}}>Project Info</div>
                      <InfoRow label="Client" icon={Icon.user} value={activeProject.client}/>
                      <InfoRow label="Status" value={<Badge status={activeProject.status==="active"?"active":activeProject.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(activeProject.status)}/>}/>
                      <InfoRow label="Start" icon={Icon.calendar} value={fmtDate(activeProject.start)}/>
                      <InfoRow label="Deadline" icon={Icon.calendar} value={fmtDate(activeProject.deadline)}/>
                      <InfoRow label="Email" icon={Icon.mail} value={<span style={{fontSize:"0.78rem"}}>{activeProject.email||"—"}</span>}/>
                      <InfoRow label="Updates" value={`${activeProject.updates.length} posted`}/>
                      <InfoRow label="Completed" value={`${activeProject.updates.filter(u=>u.status==="completed").length} done`} last/>
                    </div>

                    <div style={{background:"rgba(232,85,85,0.04)",border:"1px solid rgba(232,85,85,0.15)",borderRadius:14,padding:16}}>
                      <div style={{fontSize:"0.69rem",fontWeight:700,color:"#e85555",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Icon.warning} Danger Zone</div>
                      <div style={{fontSize:"0.78rem",color:"#6b6b72",marginBottom:12,lineHeight:1.5}}>Permanently delete this project and all its updates.</div>
                      <Btn variant="danger" size="sm" onClick={()=>setConfirm({title:"Delete Project",msg:`Delete "${activeProject.name}" and all its updates? This cannot be undone.`,onOk:()=>deleteProject(activeProjectId)})}>
                        {Icon.trash} Delete Project
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENT VIEW (preview inside admin) */}
          {page==="client"&&activeProject&&(
            <div style={{animation:"fadeIn 0.4s ease"}}>
              <Topbar title="Client View Preview" subtitle="This is exactly what your client sees" onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={()=>setPage("project")} variant="ghost" size="sm">{Icon.arrowLeft} Back to Admin</Btn>
              </Topbar>
              <ClientPublicView project={activeProject}/>
            </div>
          )}
        </div>
      </div>

      {/* PROJECT MODAL */}
      <Modal open={projModal} onClose={()=>setProjModal(false)} title={editProjId?"Edit Project":"New Project"}>
        <div className="form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Project Name *"><input style={INP} value={pm.name} onChange={e=>setPm(p=>({...p,name:e.target.value}))} placeholder="e.g. Website Redesign"/></Field>
          <Field label="Client Name *"><input style={INP} value={pm.client} onChange={e=>setPm(p=>({...p,client:e.target.value}))} placeholder="e.g. Acme Corp"/></Field>
        </div>
        <Field label="Description"><textarea style={TEXTAREA} value={pm.desc} onChange={e=>setPm(p=>({...p,desc:e.target.value}))} placeholder="Brief project overview…"/></Field>
        <div className="form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={INP} value={pm.status} onChange={e=>setPm(p=>({...p,status:e.target.value}))}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Accent Color">
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",paddingTop:4}}>
              {COLORS.map(c=><div key={c} onClick={()=>setPm(p=>({...p,color:c}))} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${pm.color===c?"#fff":"transparent"}`,transform:pm.color===c?"scale(1.25)":"scale(1)",transition:"all 0.15s",boxShadow:pm.color===c?`0 0 10px ${c}88`:""}}/>)}
            </div>
          </Field>
        </div>
        <div className="form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Start Date"><input style={INP} type="date" value={pm.start} onChange={e=>setPm(p=>({...p,start:e.target.value}))}/></Field>
          <Field label="Deadline"><input style={INP} type="date" value={pm.deadline} onChange={e=>setPm(p=>({...p,deadline:e.target.value}))}/></Field>
        </div>
        <Field label="Client Email" hint="For reference only"><input style={INP} type="email" value={pm.email} onChange={e=>setPm(p=>({...p,email:e.target.value}))} placeholder="client@example.com"/></Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:6}}>
          <Btn onClick={()=>setProjModal(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveProject}>Save Project</Btn>
        </div>
      </Modal>

      {/* UPDATE MODAL */}
      <Modal open={updModal} onClose={()=>setUpdModal(false)} title={editUpdId?"Edit Update":"New Update"}>
        <Field label="Title *"><input style={INP} value={um.title} onChange={e=>setUm(u=>({...u,title:e.target.value}))} placeholder="e.g. Homepage design approved"/></Field>
        <Field label="Description *"><textarea style={TEXTAREA} value={um.desc} onChange={e=>setUm(u=>({...u,desc:e.target.value}))} placeholder="What was done, what's next, any blockers…"/></Field>
        <div className="form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={INP} value={um.status} onChange={e=>setUm(u=>({...u,status:e.target.value}))}>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>
          </Field>
          <Field label="Date"><input style={INP} type="date" value={um.date} onChange={e=>setUm(u=>({...u,date:e.target.value}))}/></Field>
        </div>
        <Field label="File / Link" hint="Optional — Figma, Google Drive, etc."><input style={INP} type="url" value={um.link} onChange={e=>setUm(u=>({...u,link:e.target.value}))} placeholder="https://figma.com/…"/></Field>
        <Field label="Tags" hint="Press Enter after each tag">
          <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"7px 8px",border:"1px solid #2a2a2e",borderRadius:9,background:"#1a1a1d",cursor:"text",minHeight:44,alignItems:"center"}}>
            {um.tags.map((t,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#252528",border:"1px solid #2a2a2e",borderRadius:5,padding:"2px 8px",fontSize:"0.72rem",color:"#9b9ba3"}}>
                {t}<button onClick={()=>removeTag(i)} style={{background:"none",border:"none",color:"#4a4a55",cursor:"pointer",display:"flex",alignItems:"center",padding:0}}>{Icon.x}</button>
              </span>
            ))}
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Add tag…" style={{border:"none",background:"transparent",color:"#f0efe8",fontSize:"0.82rem",outline:"none",flex:1,minWidth:80}}/>
          </div>
        </Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:6}}>
          <Btn onClick={()=>setUpdModal(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveUpdate}>Save Update</Btn>
        </div>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal open={!!confirm} onClose={()=>setConfirm(null)} title={confirm?.title||"Confirm"} maxWidth={400}>
        <div style={{fontSize:"0.86rem",color:"#9b9ba3",marginBottom:22,lineHeight:1.65}}>{confirm?.msg}</div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn onClick={()=>setConfirm(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirm?.onOk} variant="danger">{Icon.trash} Delete</Btn>
        </div>
      </Modal>

      <Toast msg={toast}/>
    </>
  );
}