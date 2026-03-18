import { useState, useEffect, useRef } from "react";

/* ─── CREDENTIALS (change these) ─── */
const ADMIN_EMAIL = "write.shawon@gmail.com";
const ADMIN_PASSWORD = "A123456a";

/* ─── COLORS ─── */
const COLORS = ["#e8673a","#3ecf7a","#4fa8e8","#a78bfa","#f5a623","#e85577","#06b6d4","#f0c040"];

/* ─── SAMPLE DATA ─── */
const initialProjects = [
  {
    id:"p1", name:"Website Redesign", client:"Acme Corp",
    desc:"Full redesign and development — modern, fast, conversion-focused.",
    status:"active", color:"#e8673a", start:"2025-03-01", deadline:"2025-04-30", email:"contact@acmecorp.com",
    updates:[
      {id:"u1",title:"Project Kickoff",desc:"Held kickoff meeting. Gathered requirements, branding assets, and defined the sitemap and user flows.",status:"completed",date:"2025-03-03",tags:["Planning"],link:""},
      {id:"u2",title:"Wireframes & Design System",desc:"Completed wireframes for all 8 pages. Built the component library. Awaiting client feedback on hero concepts.",status:"in-progress",date:"2025-03-14",tags:["Design","UI/UX"],link:"https://figma.com"},
      {id:"u3",title:"Frontend Development",desc:"Dev starts once designs are approved. Using Next.js + Tailwind. Estimated 3 weeks for full build.",status:"planned",date:"2025-03-28",tags:["Dev","Next.js"],link:""}
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

/* ─── HELPERS ─── */
function uid() { return "id"+Date.now()+Math.random().toString(36).slice(2,5); }
function today() { return new Date().toISOString().slice(0,10); }
function fmtDate(s) {
  if(!s) return "—";
  const d = new Date(s+"T00:00:00");
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function slugify(s) { return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }
function projStatusLabel(s) { return {active:"Active","on-hold":"On Hold",completed:"Completed"}[s]||s; }
function updStatusLabel(s) { return {completed:"Completed","in-progress":"In Progress",planned:"Planned"}[s]||s; }

const statusColors = {
  completed:{bg:"rgba(62,207,122,0.13)",color:"#3ecf7a"},
  "in-progress":{bg:"rgba(245,166,35,0.13)",color:"#f5a623"},
  planned:{bg:"rgba(79,168,232,0.13)",color:"#4fa8e8"},
  active:{bg:"rgba(62,207,122,0.13)",color:"#3ecf7a"},
  "on-hold":{bg:"rgba(245,166,35,0.13)",color:"#f5a623"},
  "completed-proj":{bg:"rgba(79,168,232,0.13)",color:"#4fa8e8"},
};

/* ─── KEYFRAMES injected once ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Figtree:wght@300;400;500;600&display=swap');
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes slideLeft{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(232,103,58,0.3)}50%{box-shadow:0 0 40px rgba(232,103,58,0.6)}}
@keyframes borderPulse{0%,100%{border-color:rgba(232,103,58,0.3)}50%{border-color:rgba(232,103,58,0.8)}}
* { box-sizing: border-box; margin:0; padding:0; }
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#0c0c0e}
::-webkit-scrollbar-thumb{background:#2a2a2e;border-radius:3px}
body{font-family:'Figtree',sans-serif;background:#0c0c0e;color:#f0efe8}
`;

/* ─── REUSABLE COMPONENTS ─── */

function StyleInjector() {
  useEffect(()=>{
    if(document.getElementById("pp-styles")) return;
    const s = document.createElement("style");
    s.id = "pp-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
  },[]);
  return null;
}

function Badge({status,label}){
  const sc=statusColors[status]||{bg:"#222",color:"#aaa"};
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",padding:"3px 9px",borderRadius:20,background:sc.bg,color:sc.color,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:sc.color,display:"inline-block",flexShrink:0}}/>
      {label||updStatusLabel(status)}
    </span>
  );
}

function Btn({onClick,children,variant="primary",size="md",style={},disabled=false}){
  const base={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'Figtree',sans-serif",fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:9,transition:"all 0.18s",opacity:disabled?0.5:1};
  const variants={
    primary:{background:"#e8673a",color:"#fff"},
    ghost:{background:"transparent",color:"#9b9ba3",border:"1px solid #2a2a2e"},
    danger:{background:"rgba(232,85,85,0.12)",color:"#e85555",border:"1px solid rgba(232,85,85,0.25)"},
  };
  const sizes={sm:{padding:"6px 13px",fontSize:"0.78rem"},md:{padding:"10px 18px",fontSize:"0.86rem"},lg:{padding:"13px 24px",fontSize:"0.95rem"}};
  return(
    <button disabled={disabled} onClick={onClick} style={{...base,...variants[variant],...sizes[size],...style}}>
      {children}
    </button>
  );
}

function Field({label,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
      <label style={{fontSize:"0.75rem",fontWeight:600,color:"#9b9ba3",letterSpacing:"0.03em"}}>{label}</label>
      {children}
    </div>
  );
}

const INP = {fontFamily:"'Figtree',sans-serif",fontSize:"0.88rem",padding:"10px 13px",border:"1px solid #2a2a2e",borderRadius:9,background:"#1c1c1f",color:"#f0efe8",outline:"none",width:"100%",transition:"border-color 0.2s"};
const TEXTAREA = {...INP,minHeight:88,resize:"vertical"};

function Modal({open,onClose,title,children,maxWidth=500}){
  useEffect(()=>{
    if(open) document.body.style.overflow="hidden";
    else document.body.style.overflow="";
    return()=>{document.body.style.overflow=""};
  },[open]);
  if(!open) return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn 0.2s ease"}}>
      <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:18,padding:28,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto",animation:"scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.15rem"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #2a2a2e",color:"#6b6b72",width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({msg}){
  if(!msg) return null;
  return(
    <div style={{position:"fixed",bottom:24,right:24,background:"#f0efe8",color:"#0c0c0e",padding:"11px 20px",borderRadius:12,fontSize:"0.85rem",fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"fadeUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
      {msg}
    </div>
  );
}

/* ─── LOGIN PAGE ─── */
function LoginPage({onLogin}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [showPass,setShowPass]=useState(false);
  const [focused,setFocused]=useState("");

  function handleLogin(e){
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(()=>{
      if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD){
        onLogin();
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    },900);
  }

  return(
    <div style={{minHeight:"100vh",background:"#0c0c0e",display:"flex",alignItems:"center",justifyContent:"center",padding:16,position:"relative",overflow:"hidden"}}>
      {/* BG blobs */}
      <div style={{position:"absolute",top:-120,left:-120,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,103,58,0.12),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-100,right:-100,width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,168,232,0.08),transparent 70%)",pointerEvents:"none"}}/>
      {/* Grid texture */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:420,animation:"fadeUp 0.6s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:54,height:54,background:"linear-gradient(135deg,#e8673a,#ff8a5c)",borderRadius:16,marginBottom:16,boxShadow:"0 8px 32px rgba(232,103,58,0.35)",animation:"glow 3s ease infinite"}}>
            <span style={{fontSize:"1.4rem"}}>⚡</span>
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.6rem",letterSpacing:"-0.04em"}}>
            Project<span style={{color:"#e8673a"}}>Pulse</span>
          </div>
          <div style={{fontSize:"0.82rem",color:"#6b6b72",marginTop:6}}>Admin Portal — Authorized access only</div>
        </div>

        {/* Card */}
        <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:20,padding:32,boxShadow:"0 24px 64px rgba(0,0,0,0.5)",animation:"borderPulse 4s ease infinite"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",marginBottom:6}}>Welcome back 👋</div>
          <div style={{fontSize:"0.82rem",color:"#6b6b72",marginBottom:24}}>Sign in to manage your projects</div>

          <form onSubmit={handleLogin}>
            <Field label="Email Address">
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")}
                placeholder="admin@projectpulse.com" required
                style={{...INP,borderColor:focused==="email"?"#e8673a":"#2a2a2e"}}
              />
            </Field>
            <Field label="Password">
              <div style={{position:"relative"}}>
                <input
                  type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setFocused("pass")} onBlur={()=>setFocused("")}
                  placeholder="••••••••" required
                  style={{...INP,borderColor:focused==="pass"?"#e8673a":"#2a2a2e",paddingRight:44}}
                />
                <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6b6b72",cursor:"pointer",fontSize:"0.9rem",padding:4}}>
                  {showPass?"🙈":"👁"}
                </button>
              </div>
            </Field>

            {error && (
              <div style={{background:"rgba(232,85,85,0.1)",border:"1px solid rgba(232,85,85,0.25)",borderRadius:9,padding:"10px 14px",fontSize:"0.82rem",color:"#e85555",marginBottom:16,animation:"fadeUp 0.2s ease"}}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{width:"100%",padding:"12px",background:loading?"#333":"linear-gradient(135deg,#e8673a,#d4542a)",color:"#fff",border:"none",borderRadius:10,fontFamily:"'Figtree',sans-serif",fontSize:"0.92rem",fontWeight:700,cursor:loading?"not-allowed":"pointer",transition:"all 0.2s",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading ? (
                <><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/> Signing in…</>
              ) : "Sign In →"}
            </button>
          </form>

          <div style={{marginTop:20,padding:"14px",background:"#1c1c1f",borderRadius:10,border:"1px solid #2a2a2e"}}>
            <div style={{fontSize:"0.72rem",color:"#6b6b72",marginBottom:6,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>Demo Credentials</div>
            <div style={{fontSize:"0.78rem",color:"#9b9ba3"}}>📧 {ADMIN_EMAIL}</div>
            <div style={{fontSize:"0.78rem",color:"#9b9ba3",marginTop:3}}>🔑 {ADMIN_PASSWORD}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function App(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [projects,setProjects]=useState(initialProjects);
  const [activeProjectId,setActiveProjectId]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [toast,setToast]=useState("");
  const [sidebarOpen,setSidebarOpen]=useState(false);

  const [projModal,setProjModal]=useState(false);
  const [editingProjId,setEditingProjId]=useState(null);
  const [pm,setPm]=useState({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});

  const [updModal,setUpdModal]=useState(false);
  const [editingUpdId,setEditingUpdId]=useState(null);
  const [um,setUm]=useState({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
  const [tagInput,setTagInput]=useState("");

  const [confirm,setConfirm]=useState(null);

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2800);}
  function getP(id){return projects.find(p=>p.id===id);}

  function logout(){setLoggedIn(false);setPage("dashboard");setActiveProjectId(null);}

  function goProject(id){setActiveProjectId(id);setPage("project");setSidebarOpen(false);}
  function goDashboard(){setPage("dashboard");setActiveProjectId(null);setSidebarOpen(false);}
  function goClient(){setPage("client");}

  /* Project CRUD */
  function openNewProject(){
    setEditingProjId(null);
    setPm({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});
    setProjModal(true);
  }
  function openEditProject(){
    const p=getP(activeProjectId);
    setEditingProjId(p.id);
    setPm({name:p.name,client:p.client,desc:p.desc,status:p.status,color:p.color,start:p.start||"",deadline:p.deadline||"",email:p.email||""});
    setProjModal(true);
  }
  function saveProject(){
    if(!pm.name.trim()||!pm.client.trim()){showToast("Name and client required.");return;}
    if(editingProjId){
      setProjects(ps=>ps.map(p=>p.id===editingProjId?{...p,...pm}:p));
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

  /* Update CRUD */
  function openAddUpdate(){
    setEditingUpdId(null);
    setUm({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
    setTagInput("");setUpdModal(true);
  }
  function openEditUpdate(uid_){
    const p=getP(activeProjectId);
    const u=p.updates.find(x=>x.id===uid_);
    setEditingUpdId(uid_);
    setUm({title:u.title,desc:u.desc,status:u.status,date:u.date,link:u.link||"",tags:[...u.tags]});
    setTagInput("");setUpdModal(true);
  }
  function saveUpdate(){
    if(!um.title.trim()||!um.desc.trim()){showToast("Title and description required.");return;}
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId) return p;
      if(editingUpdId) return{...p,updates:p.updates.map(u=>u.id===editingUpdId?{...u,...um}:u)};
      return{...p,updates:[...p.updates,{id:uid(),...um}]};
    }));
    showToast(editingUpdId?"Update saved!":"Update posted!");setUpdModal(false);
  }
  function deleteUpdate(uid_){
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,updates:p.updates.filter(u=>u.id!==uid_)}));
    showToast("Update deleted.");setConfirm(null);
  }
  function addTag(e){
    if(e.key==="Enter"&&tagInput.trim()){e.preventDefault();const t=tagInput.trim();if(!um.tags.includes(t))setUm(u=>({...u,tags:[...u.tags,t]}));setTagInput("");}
  }
  function removeTag(i){setUm(u=>({...u,tags:u.tags.filter((_,idx)=>idx!==i)}));}

  const activeProject=getP(activeProjectId);
  const stats={
    total:projects.length,
    active:projects.filter(p=>p.status==="active").length,
    onhold:projects.filter(p=>p.status==="on-hold").length,
    updates:projects.reduce((a,p)=>a+p.updates.length,0),
  };

  if(!loggedIn) return(<><StyleInjector/><LoginPage onLogin={()=>setLoggedIn(true)}/></>);

  /* ── SIDEBAR ── */
  const Sidebar = (
    <aside style={{width:240,flexShrink:0,background:"#141416",borderRight:"1px solid #2a2a2e",display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto",position:"relative",zIndex:10}}>
      <div style={{padding:"20px 16px 16px",borderBottom:"1px solid #2a2a2e"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#e8673a,#ff8a5c)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.05rem",letterSpacing:"-0.03em"}}>Project<span style={{color:"#e8673a"}}>Pulse</span></div>
            <div style={{fontSize:"0.65rem",color:"#6b6b72",marginTop:1}}>Admin Panel</div>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 10px 6px"}}>
        <div style={{fontSize:"0.64rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#4a4a52",padding:"0 8px",marginBottom:6,fontWeight:600}}>Menu</div>
        <NavItem icon="▦" label="Dashboard" active={page==="dashboard"} onClick={goDashboard}/>
      </div>

      <div style={{padding:"10px 10px 6px",flex:1}}>
        <div style={{fontSize:"0.64rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#4a4a52",padding:"0 8px",marginBottom:6,fontWeight:600}}>Projects ({projects.length})</div>
        {projects.length===0&&<div style={{fontSize:"0.8rem",color:"#6b6b72",padding:"4px 10px"}}>No projects yet</div>}
        {projects.map((p,i)=>(
          <div key={p.id} onClick={()=>goProject(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,cursor:"pointer",fontSize:"0.84rem",fontWeight:500,marginBottom:2,background:activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.1)":"transparent",color:activeProjectId===p.id&&page!=="dashboard"?"#f0efe8":"#9b9ba3",border:`1px solid ${activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.25)":"transparent"}`,transition:"all 0.15s",animation:`fadeUp 0.4s ease ${i*0.05}s both`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 6px ${p.color}66`}}/>
            <div style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:"0.67rem",background:"#1c1c1f",border:"1px solid #2a2a2e",color:"#6b6b72",padding:"1px 7px",borderRadius:20}}>{p.updates.length}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"10px 10px 16px",borderTop:"1px solid #2a2a2e"}}>
        <button onClick={openNewProject} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"linear-gradient(135deg,#e8673a,#d4542a)",color:"#fff",border:"none",borderRadius:9,fontFamily:"'Figtree',sans-serif",fontSize:"0.84rem",fontWeight:700,cursor:"pointer",marginBottom:8,transition:"all 0.2s",boxShadow:"0 4px 16px rgba(232,103,58,0.3)"}}>
          + New Project
        </button>
        <button onClick={logout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px",background:"transparent",color:"#6b6b72",border:"1px solid #2a2a2e",borderRadius:9,fontFamily:"'Figtree',sans-serif",fontSize:"0.8rem",fontWeight:500,cursor:"pointer",transition:"all 0.2s"}}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );

  return(
    <>
      <StyleInjector/>
      <div style={{display:"flex",minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8",fontFamily:"'Figtree',sans-serif"}}>

        {/* Desktop Sidebar */}
        <div style={{display:"none"}} className="desktop-sidebar">
          {Sidebar}
        </div>
        <div style={{width:240,flexShrink:0,background:"#141416",borderRight:"1px solid #2a2a2e",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
          {Sidebar}
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen&&(
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"none"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:260,height:"100%",background:"#141416",borderRight:"1px solid #2a2a2e",overflowY:"auto"}}>
              {Sidebar}
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{flex:1,overflowX:"hidden",minWidth:0}}>

          {/* DASHBOARD */}
          {page==="dashboard"&&(
            <div style={{animation:"fadeIn 0.4s ease"}}>
              <Topbar title="Dashboard" subtitle="All your projects at a glance" onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={openNewProject} size="sm">+ New Project</Btn>
              </Topbar>
              <div style={{padding:"24px 20px"}}>
                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:28}}>
                  {[
                    {label:"Projects",val:stats.total,color:"#f0efe8",icon:"📁"},
                    {label:"Active",val:stats.active,color:"#3ecf7a",icon:"🟢"},
                    {label:"On Hold",val:stats.onhold,color:"#f5a623",icon:"⏸"},
                    {label:"Updates",val:stats.updates,color:"#e8673a",icon:"📝"},
                  ].map((s,i)=>(
                    <div key={s.label} style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,padding:"18px 16px",animation:`fadeUp 0.5s ease ${i*0.07}s both`,transition:"transform 0.2s,border-color 0.2s",cursor:"default"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{fontSize:"0.7rem",color:"#6b6b72",letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:600}}>{s.label}</div>
                        <span style={{fontSize:"1rem"}}>{s.icon}</span>
                      </div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"2rem",letterSpacing:"-0.04em",color:s.color}}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                {projects.some(p=>p.updates.length>0)&&(
                  <div style={{marginBottom:28}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.95rem",marginBottom:14,color:"#9b9ba3",letterSpacing:"-0.01em"}}>Recent Activity</div>
                    <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,overflow:"hidden"}}>
                      {projects.flatMap(p=>p.updates.map(u=>({...u,projectName:p.name,projectColor:p.color,projectId:p.id}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map((u,i)=>(
                        <div key={u.id} onClick={()=>goProject(u.projectId)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<3?"1px solid #1c1c1f":"none",cursor:"pointer",transition:"background 0.15s",animation:`slideLeft 0.4s ease ${i*0.06}s both`}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:u.projectColor,flexShrink:0,boxShadow:`0 0 8px ${u.projectColor}88`}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"0.85rem",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.title}</div>
                            <div style={{fontSize:"0.73rem",color:"#6b6b72",marginTop:2}}>{u.projectName} · {fmtDate(u.date)}</div>
                          </div>
                          <Badge status={u.status}/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects grid */}
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.95rem",marginBottom:14,color:"#9b9ba3"}}>All Projects</div>
                {projects.length===0?(
                  <div style={{textAlign:"center",padding:"4rem 2rem",color:"#6b6b72",animation:"fadeUp 0.5s ease"}}>
                    <div style={{fontSize:"3rem",marginBottom:14}}>📂</div>
                    <div style={{fontWeight:600,marginBottom:6}}>No projects yet</div>
                    <div style={{fontSize:"0.83rem",marginBottom:20}}>Create your first project to get started</div>
                    <Btn onClick={openNewProject}>+ Create Project</Btn>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                    {projects.map((p,i)=>(
                      <div key={p.id} onClick={()=>goProject(p.id)} style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:16,padding:"20px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden",animation:`fadeUp 0.5s ease ${i*0.07}s both`}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${p.color},${p.color}88)`,borderRadius:"16px 16px 0 0"}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.97rem"}}>{p.name}</div>
                            <div style={{fontSize:"0.76rem",color:"#6b6b72",marginTop:3}}>👤 {p.client}</div>
                          </div>
                          <Badge status={p.status==="active"?"active":p.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(p.status)}/>
                        </div>
                        <div style={{fontSize:"0.81rem",color:"#9b9ba3",lineHeight:1.55,marginBottom:14,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.desc||"No description."}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #1c1c1f"}}>
                          <span style={{fontSize:"0.73rem",color:"#6b6b72"}}>📝 {p.updates.length} update{p.updates.length!==1?"s":""}</span>
                          {p.deadline&&<span style={{fontSize:"0.71rem",color:"#6b6b72"}}>📅 {fmtDate(p.deadline)}</span>}
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
            <div style={{animation:"fadeIn 0.35s ease"}}>
              <Topbar title={activeProject.name} subtitle={`Client: ${activeProject.client}`} onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={goClient} variant="ghost" size="sm">👁 Client View</Btn>
                <Btn onClick={openEditProject} variant="ghost" size="sm">✏ Edit</Btn>
                <Btn onClick={openAddUpdate} size="sm">+ Update</Btn>
              </Topbar>
              <div style={{padding:"20px",display:"grid",gridTemplateColumns:"1fr",gap:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:20,alignItems:"start"}}>
                  {/* Updates */}
                  <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:16,overflow:"hidden"}}>
                    <div style={{padding:"16px 20px",borderBottom:"1px solid #2a2a2e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.95rem"}}>Updates <span style={{fontSize:"0.75rem",fontWeight:400,color:"#6b6b72",marginLeft:4}}>{activeProject.updates.length}</span></div>
                      <Btn onClick={openAddUpdate} size="sm">+ Add</Btn>
                    </div>
                    <div style={{padding:8}}>
                      {activeProject.updates.length===0?(
                        <div style={{padding:"3rem",textAlign:"center",color:"#6b6b72",fontSize:"0.85rem"}}>
                          <div style={{fontSize:"2rem",marginBottom:10}}>📭</div>
                          No updates yet. Add your first one!
                        </div>
                      ):(
                        [...activeProject.updates].reverse().map((u,ri)=>(
                          <div key={u.id} style={{padding:"13px 14px",borderRadius:11,marginBottom:4,transition:"background 0.15s",animation:`fadeUp 0.35s ease ${ri*0.05}s both`,cursor:"default"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                              <Badge status={u.status}/>
                              <div style={{fontWeight:600,fontSize:"0.91rem",flex:1}}>{u.title}</div>
                              <div style={{display:"flex",gap:4,flexShrink:0}}>
                                <button onClick={()=>openEditUpdate(u.id)} title="Edit" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7,border:"1px solid #2a2a2e",background:"transparent",color:"#9b9ba3",cursor:"pointer",fontSize:"0.78rem",transition:"all 0.15s"}}>✏️</button>
                                <button onClick={()=>setConfirm({title:"Delete Update",msg:`Delete "${u.title}"?`,onOk:()=>deleteUpdate(u.id)})} title="Delete" style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7,border:"1px solid rgba(232,85,85,0.2)",background:"rgba(232,85,85,0.06)",color:"#e85555",cursor:"pointer",fontSize:"0.78rem",transition:"all 0.15s"}}>🗑</button>
                              </div>
                            </div>
                            <div style={{fontSize:"0.83rem",color:"#9b9ba3",lineHeight:1.6}}>{u.desc}</div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:9,flexWrap:"wrap"}}>
                              <span style={{fontSize:"0.71rem",color:"#6b6b72",marginRight:"auto"}}>📅 {fmtDate(u.date)}</span>
                              {u.tags.map(t=><span key={t} style={{fontSize:"0.67rem",padding:"2px 7px",background:"#1c1c1f",border:"1px solid #2a2a2e",borderRadius:4,color:"#9b9ba3"}}>{t}</span>)}
                              {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.73rem",color:"#ff8a5c",textDecoration:"none",padding:"2px 8px",background:"rgba(232,103,58,0.08)",border:"1px solid rgba(232,103,58,0.15)",borderRadius:5}}>🔗 View</a>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right panel */}
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {/* Share */}
                    <div style={{background:"rgba(232,103,58,0.06)",border:"1px solid rgba(232,103,58,0.18)",borderRadius:14,padding:18}}>
                      <div style={{fontSize:"0.75rem",fontWeight:700,color:"#ff8a5c",marginBottom:10,letterSpacing:"0.03em"}}>🔗 Client Share Link</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",background:"#141416",border:"1px solid #2a2a2e",borderRadius:9,padding:"8px 10px"}}>
                        <div style={{flex:1,fontSize:"0.7rem",color:"#9b9ba3",fontFamily:"monospace",wordBreak:"break-all"}}>projectpulse.app/p/{slugify(activeProject.name)}-{activeProject.id.slice(-4)}</div>
                        <button onClick={()=>showToast("Link copied!")} style={{background:"#e8673a",color:"#fff",border:"none",padding:"4px 10px",borderRadius:6,fontSize:"0.71rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>Copy</button>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,padding:18}}>
                      <div style={{fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#6b6b72",marginBottom:14,fontWeight:700}}>Project Info</div>
                      {[
                        ["Client",activeProject.client],
                        ["Status",<Badge key="s" status={activeProject.status==="active"?"active":activeProject.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(activeProject.status)}/>],
                        ["Start",fmtDate(activeProject.start)],
                        ["Deadline",fmtDate(activeProject.deadline)],
                        ["Email",activeProject.email||"—"],
                        ["Updates",`${activeProject.updates.length} posted`],
                        ["Completed",`${activeProject.updates.filter(u=>u.status==="completed").length} done`],
                      ].map(([k,v],i)=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<6?"1px solid #1c1c1f":"none",gap:8}}>
                          <span style={{fontSize:"0.78rem",color:"#6b6b72",flexShrink:0}}>{k}</span>
                          <span style={{fontSize:"0.83rem",fontWeight:500,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Danger */}
                    <div style={{background:"rgba(232,85,85,0.04)",border:"1px solid rgba(232,85,85,0.18)",borderRadius:14,padding:18}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#e85555",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>⚠ Danger Zone</div>
                      <div style={{fontSize:"0.8rem",color:"#6b6b72",marginBottom:12,lineHeight:1.5}}>Permanently delete this project and all updates.</div>
                      <Btn variant="danger" size="sm" onClick={()=>setConfirm({title:"Delete Project",msg:`Delete "${activeProject.name}" and all its updates? This cannot be undone.`,onOk:()=>deleteProject(activeProjectId)})}>Delete Project</Btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENT VIEW */}
          {page==="client"&&activeProject&&(
            <div style={{animation:"fadeIn 0.4s ease"}}>
              <Topbar title="Client View" subtitle="What your client sees" onMenu={()=>setSidebarOpen(true)}>
                <Btn onClick={()=>setPage("project")} variant="ghost" size="sm">← Back</Btn>
              </Topbar>
              {/* Hero */}
              <div style={{background:"#141416",borderBottom:"1px solid #2a2a2e",padding:"48px 24px 36px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${activeProject.color}22,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
                <div style={{maxWidth:660,margin:"0 auto",position:"relative"}}>
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:activeProject.color,background:`${activeProject.color}18`,border:`1px solid ${activeProject.color}33`,padding:"4px 12px",borderRadius:20,marginBottom:20,animation:"fadeUp 0.5s ease"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:activeProject.color,display:"inline-block",animation:"pulse 2s infinite"}}/>
                    Live Updates
                  </div>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(1.7rem,4vw,2.6rem)",letterSpacing:"-0.04em",marginBottom:10,lineHeight:1.1,animation:"fadeUp 0.5s ease 0.05s both"}}>{activeProject.name}</h1>
                  <p style={{fontSize:"0.93rem",color:"#9b9ba3",maxWidth:440,lineHeight:1.65,marginBottom:28,animation:"fadeUp 0.5s ease 0.1s both"}}>{activeProject.desc||""}</p>
                  <div style={{display:"flex",gap:24,flexWrap:"wrap",animation:"fadeUp 0.5s ease 0.15s both"}}>
                    {[["👤 Client",activeProject.client],["📊 Status",projStatusLabel(activeProject.status)],["📅 Started",fmtDate(activeProject.start)],["⏰ Deadline",fmtDate(activeProject.deadline)]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{fontSize:"0.67rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b6b72"}}>{l}</div>
                        <div style={{fontSize:"0.88rem",fontWeight:600,marginTop:4}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Timeline */}
              <div style={{maxWidth:660,margin:"0 auto",padding:"32px 20px 60px"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1rem",marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
                  Project Updates
                  <div style={{flex:1,height:1,background:"#2a2a2e"}}/>
                  <span style={{fontSize:"0.73rem",color:"#6b6b72",fontWeight:400,fontFamily:"'Figtree',sans-serif"}}>{activeProject.updates.length} total</span>
                </div>
                {activeProject.updates.length===0?(
                  <div style={{textAlign:"center",padding:"3rem",color:"#6b6b72"}}>No updates posted yet. Check back soon!</div>
                ):(
                  [...activeProject.updates].reverse().map((u,i,arr)=>{
                    const dc={completed:"#3ecf7a","in-progress":"#f5a623",planned:"#4fa8e8"}[u.status]||"#e8673a";
                    return(
                      <div key={u.id} style={{display:"grid",gridTemplateColumns:"32px 1fr",gap:"0 14px",animation:`fadeUp 0.5s ease ${i*0.08}s both`}}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                          <div style={{width:12,height:12,borderRadius:"50%",background:dc,boxShadow:`0 0 0 3px ${dc}22`,marginTop:20,flexShrink:0}}/>
                          {i!==arr.length-1&&<div style={{flex:1,width:2,background:"linear-gradient(#2a2a2e,#1c1c1f)",margin:"4px 0",minHeight:24}}/>}
                        </div>
                        <div>
                          <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:13,padding:"15px 18px",marginBottom:12,marginTop:10,transition:"border-color 0.2s"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:9,flexWrap:"wrap"}}>
                              <div style={{fontWeight:600,fontSize:"0.93rem"}}>{u.title}</div>
                              <Badge status={u.status}/>
                            </div>
                            <div style={{fontSize:"0.84rem",color:"#9b9ba3",lineHeight:1.65}}>{u.desc}</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:11,alignItems:"center"}}>
                              <span style={{fontSize:"0.71rem",color:"#6b6b72",marginRight:"auto"}}>📅 {fmtDate(u.date)}</span>
                              {u.tags.map(t=><span key={t} style={{fontSize:"0.67rem",padding:"2px 7px",background:"#1c1c1f",border:"1px solid #2a2a2e",borderRadius:4,color:"#9b9ba3"}}>{t}</span>)}
                              {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.73rem",color:"#ff8a5c",textDecoration:"none",padding:"2px 8px",background:"rgba(232,103,58,0.08)",border:"1px solid rgba(232,103,58,0.15)",borderRadius:5}}>🔗 View File</a>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROJECT MODAL */}
      <Modal open={projModal} onClose={()=>setProjModal(false)} title={editingProjId?"Edit Project":"New Project"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Project Name *"><input style={INP} value={pm.name} onChange={e=>setPm(p=>({...p,name:e.target.value}))} placeholder="e.g. Website Redesign"/></Field>
          <Field label="Client Name *"><input style={INP} value={pm.client} onChange={e=>setPm(p=>({...p,client:e.target.value}))} placeholder="e.g. Acme Corp"/></Field>
        </div>
        <Field label="Description"><textarea style={TEXTAREA} value={pm.desc} onChange={e=>setPm(p=>({...p,desc:e.target.value}))} placeholder="Brief project overview…"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={INP} value={pm.status} onChange={e=>setPm(p=>({...p,status:e.target.value}))}>
              <option value="active">🟢 Active</option>
              <option value="on-hold">🟡 On Hold</option>
              <option value="completed">🔵 Completed</option>
            </select>
          </Field>
          <Field label="Accent Color">
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",paddingTop:6}}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setPm(p=>({...p,color:c}))} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${pm.color===c?"#fff":"transparent"}`,transform:pm.color===c?"scale(1.25)":"scale(1)",transition:"all 0.15s",boxShadow:pm.color===c?`0 0 10px ${c}88`:""}}/>
              ))}
            </div>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Start Date"><input style={INP} type="date" value={pm.start} onChange={e=>setPm(p=>({...p,start:e.target.value}))}/></Field>
          <Field label="Deadline"><input style={INP} type="date" value={pm.deadline} onChange={e=>setPm(p=>({...p,deadline:e.target.value}))}/></Field>
        </div>
        <Field label="Client Email"><input style={INP} type="email" value={pm.email} onChange={e=>setPm(p=>({...p,email:e.target.value}))} placeholder="client@example.com"/></Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
          <Btn onClick={()=>setProjModal(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveProject}>Save Project</Btn>
        </div>
      </Modal>

      {/* UPDATE MODAL */}
      <Modal open={updModal} onClose={()=>setUpdModal(false)} title={editingUpdId?"Edit Update":"New Update"}>
        <Field label="Title *"><input style={INP} value={um.title} onChange={e=>setUm(u=>({...u,title:e.target.value}))} placeholder="e.g. Homepage design approved"/></Field>
        <Field label="Description *"><textarea style={TEXTAREA} value={um.desc} onChange={e=>setUm(u=>({...u,desc:e.target.value}))} placeholder="What was done, what's next, any blockers…"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={INP} value={um.status} onChange={e=>setUm(u=>({...u,status:e.target.value}))}>
              <option value="completed">✅ Completed</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="planned">📌 Planned</option>
            </select>
          </Field>
          <Field label="Date"><input style={INP} type="date" value={um.date} onChange={e=>setUm(u=>({...u,date:e.target.value}))}/></Field>
        </div>
        <Field label="File / Link (optional)"><input style={INP} type="url" value={um.link} onChange={e=>setUm(u=>({...u,link:e.target.value}))} placeholder="https://figma.com/…"/></Field>
        <Field label="Tags (press Enter)">
          <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:8,border:"1px solid #2a2a2e",borderRadius:9,background:"#1c1c1f",cursor:"text",minHeight:44,alignItems:"center"}}>
            {um.tags.map((t,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#2a2a2e",border:"1px solid #333",borderRadius:5,padding:"2px 8px",fontSize:"0.72rem",color:"#9b9ba3"}}>
                {t}<button onClick={()=>removeTag(i)} style={{background:"none",border:"none",color:"#6b6b72",cursor:"pointer",fontSize:"0.85rem",padding:0,lineHeight:1}}>×</button>
              </span>
            ))}
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Add tag…" style={{border:"none",background:"transparent",color:"#f0efe8",fontSize:"0.83rem",outline:"none",flex:1,minWidth:80,fontFamily:"inherit"}}/>
          </div>
        </Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
          <Btn onClick={()=>setUpdModal(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveUpdate}>Save Update</Btn>
        </div>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal open={!!confirm} onClose={()=>setConfirm(null)} title={confirm?.title||"Confirm"} maxWidth={400}>
        <div style={{fontSize:"0.88rem",color:"#9b9ba3",marginBottom:22,lineHeight:1.6}}>{confirm?.msg}</div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn onClick={()=>setConfirm(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirm?.onOk} variant="danger">Delete</Btn>
        </div>
      </Modal>

      <Toast msg={toast}/>
    </>
  );
}

/* ─── TOPBAR COMPONENT ─── */
function NavItem({icon,label,active,onClick}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,cursor:"pointer",fontSize:"0.85rem",fontWeight:500,background:active?"#1c1c1f":"transparent",color:active?"#f0efe8":"#9b9ba3",border:`1px solid ${active?"#2a2a2e":"transparent"}`,transition:"all 0.15s",marginBottom:2}}>
      <span>{icon}</span>{label}
    </div>
  );
}

function Topbar({title,subtitle,children,onMenu}){
  return(
    <div style={{padding:"14px 20px",borderBottom:"1px solid #2a2a2e",background:"rgba(20,20,22,0.95)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</div>
          {subtitle&&<div style={{fontSize:"0.76rem",color:"#6b6b72",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>{children}</div>
    </div>
  );
}