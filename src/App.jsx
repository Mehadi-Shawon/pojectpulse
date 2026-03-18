import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";

// ── helpers ──
const STORAGE_KEY = "projectpulse_projects";
function uid() { return "id" + Date.now() + Math.random().toString(36).slice(2,5); }
function today() { return new Date().toISOString().slice(0,10); }
function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function slugify(s) { return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }
function projStatusLabel(s) { return {active:"Active","on-hold":"On Hold",completed:"Completed"}[s]||s; }
function updStatusLabel(s) { return {completed:"Completed","in-progress":"In Progress",planned:"Planned"}[s]||s; }

const COLORS = ["#e8673a","#3ecf7a","#4fa8e8","#a78bfa","#f5a623","#e85577","#06b6d4","#f0c040"];
const statusColors = {
  completed:{bg:"rgba(62,207,122,0.12)",color:"#3ecf7a"},
  "in-progress":{bg:"rgba(245,166,35,0.12)",color:"#f5a623"},
  planned:{bg:"rgba(79,168,232,0.12)",color:"#4fa8e8"},
  active:{bg:"rgba(62,207,122,0.12)",color:"#3ecf7a"},
  "on-hold":{bg:"rgba(245,166,35,0.12)",color:"#f5a623"},
  "completed-proj":{bg:"rgba(79,168,232,0.12)",color:"#4fa8e8"},
};

const SAMPLE = [
  {
    id:"p1",name:"Website Redesign",client:"Acme Corp",
    desc:"Full redesign and development — modern, fast, conversion-focused.",
    status:"active",color:"#e8673a",start:"2025-03-01",deadline:"2025-04-30",email:"contact@acmecorp.com",
    updates:[
      {id:"u1",title:"Project Kickoff",desc:"Held kickoff meeting. Gathered requirements and defined the sitemap.",status:"completed",date:"2025-03-03",tags:["Planning"],link:""},
      {id:"u2",title:"Wireframes & Design",desc:"Completed wireframes for all 8 pages. Awaiting client feedback.",status:"in-progress",date:"2025-03-14",tags:["Design"],link:""},
    ]
  },
  {
    id:"p2",name:"Mobile App MVP",client:"StartupXYZ",
    desc:"React Native app for iOS & Android.",
    status:"active",color:"#3ecf7a",start:"2025-02-15",deadline:"2025-05-15",email:"hello@startupxyz.io",
    updates:[
      {id:"u3",title:"Architecture Planning",desc:"Finalized tech stack. CI/CD pipeline set up.",status:"completed",date:"2025-02-18",tags:["Backend"],link:""},
    ]
  }
];

// ── shared UI ──
export function Badge({ status, label }) {
  const sc = statusColors[status]||{bg:"#222",color:"#aaa"};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:"0.67rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",padding:"3px 9px",borderRadius:20,background:sc.bg,color:sc.color}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:sc.color,display:"inline-block"}}/>
      {label||updStatusLabel(status)}
    </span>
  );
}

export function Toast({ msg }) {
  return msg ? (
    <div style={{position:"fixed",bottom:28,right:28,background:"#f0efe8",color:"#0c0c0e",padding:"10px 18px",borderRadius:10,fontSize:"0.85rem",fontWeight:600,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
      {msg}
    </div>
  ) : null;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#141416",border:"1px solid #333",borderRadius:16,padding:28,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:"1.15rem"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #333",color:"#888",width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:"0.9rem"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
      <label style={{fontSize:"0.75rem",fontWeight:600,color:"#9b9ba3"}}>{label}</label>
      {children}
    </div>
  );
}

const inp = {fontFamily:"inherit",fontSize:"0.88rem",padding:"9px 12px",border:"1px solid #333",borderRadius:8,background:"#1c1c1f",color:"#f0efe8",outline:"none",width:"100%"};
const inp2 = {...inp,minHeight:80,resize:"vertical"};

function Btn({ onClick, children, variant="primary", size="md", style={} }) {
  const base = {display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",fontWeight:600,cursor:"pointer",border:"none",borderRadius:8};
  const variants = {
    primary:{background:"#e8673a",color:"#fff"},
    ghost:{background:"transparent",color:"#9b9ba3",border:"1px solid #333"},
    danger:{background:"rgba(232,85,85,0.12)",color:"#e85555",border:"1px solid rgba(232,85,85,0.25)"},
  };
  const sizes = {sm:{padding:"6px 12px",fontSize:"0.78rem"},md:{padding:"9px 16px",fontSize:"0.85rem"}};
  return <button onClick={onClick} style={{...base,...variants[variant],...sizes[size],...style}}>{children}</button>;
}

// ── useProjects hook ──
function useProjects() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : SAMPLE;
    } catch { return SAMPLE; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  return [projects, setProjects];
}

// ════════════════════════════════
//   CLIENT VIEW PAGE
// ════════════════════════════════
function ClientPage() {
  const { slug } = useParams();
  const [projects] = useProjects();
  const project = projects.find(p => slugify(p.name) === slug || p.id === slug);

  if (!project) return (
    <div style={{minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:"3rem"}}>🔍</div>
      <div style={{fontWeight:700,fontSize:"1.25rem"}}>Project not found</div>
      <div style={{color:"#6b6b72",fontSize:"0.9rem"}}>This link may be invalid or the project was removed.</div>
    </div>
  );

  const dotColors = {completed:"#3ecf7a","in-progress":"#f5a623",planned:"#4fa8e8"};

  return (
    <div style={{minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8",fontFamily:"system-ui,sans-serif"}}>
      {/* Hero */}
      <div style={{background:"#141416",borderBottom:"1px solid #2a2a2e",padding:"48px 24px 36px"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#ff8a5c",background:"rgba(232,103,58,0.1)",border:"1px solid rgba(232,103,58,0.2)",padding:"4px 12px",borderRadius:20,marginBottom:20}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#e8673a",display:"inline-block"}}/>
            Live Updates
          </div>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:project.color}}/>
          <h1 style={{fontWeight:800,fontSize:"clamp(1.8rem,4vw,2.5rem)",letterSpacing:"-0.04em",marginBottom:10,lineHeight:1.1}}>{project.name}</h1>
          <p style={{fontSize:"0.95rem",color:"#9b9ba3",maxWidth:460,lineHeight:1.6,marginBottom:28}}>{project.desc||""}</p>
          <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
            {[["Client",project.client],["Status",projStatusLabel(project.status)],["Started",fmtDate(project.start)],["Deadline",fmtDate(project.deadline)]].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b6b72"}}>{l}</div>
                <div style={{fontSize:"0.9rem",fontWeight:600,marginTop:3}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{maxWidth:680,margin:"0 auto",padding:"36px 24px 60px"}}>
        <div style={{fontWeight:700,fontSize:"1.05rem",marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
          Project Updates
          <div style={{flex:1,height:1,background:"#2a2a2e"}}/>
          <span style={{fontSize:"0.75rem",color:"#6b6b72",fontWeight:400}}>{project.updates.length} update{project.updates.length!==1?"s":""}</span>
        </div>

        {project.updates.length===0 ? (
          <div style={{textAlign:"center",padding:"4rem",color:"#6b6b72"}}>No updates posted yet. Check back soon!</div>
        ) : (
          [...project.updates].reverse().map((u,i,arr)=>{
            const dc = dotColors[u.status]||"#e8673a";
            return (
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"36px 1fr",gap:"0 16px"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:dc,boxShadow:`0 0 0 3px ${dc}22`,marginTop:20,flexShrink:0}}/>
                  {i!==arr.length-1&&<div style={{flex:1,width:2,background:"#2a2a2e",margin:"4px 0",minHeight:20}}/>}
                </div>
                <div>
                  <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:12,padding:"16px 20px",marginBottom:12,marginTop:10}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                      <div style={{fontWeight:700,fontSize:"1rem"}}>{u.title}</div>
                      <Badge status={u.status}/>
                    </div>
                    <div style={{fontSize:"0.88rem",color:"#9b9ba3",lineHeight:1.65}}>{u.desc}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12,alignItems:"center"}}>
                      <span style={{fontSize:"0.72rem",color:"#6b6b72",marginRight:"auto"}}>{fmtDate(u.date)}</span>
                      {u.tags.map(t=><span key={t} style={{fontSize:"0.68rem",padding:"2px 7px",background:"#1c1c1f",border:"1px solid #333",borderRadius:4,color:"#9b9ba3"}}>{t}</span>)}
                      {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.73rem",color:"#ff8a5c",textDecoration:"none",padding:"2px 8px",background:"rgba(232,103,58,0.08)",border:"1px solid rgba(232,103,58,0.15)",borderRadius:4}}>🔗 View File</a>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{textAlign:"center",padding:"0 0 2rem",fontSize:"0.75rem",color:"#444"}}>
        Powered by <span style={{color:"#e8673a",fontWeight:600}}>ProjectPulse</span>
      </div>
    </div>
  );
}

// ════════════════════════════════
//   ADMIN APP
// ════════════════════════════════
function AdminApp() {
  const navigate = useNavigate();
  const [projects, setProjects] = useProjects();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState("");

  const [projModal, setProjModal] = useState(false);
  const [editingProjId, setEditingProjId] = useState(null);
  const [pm, setPm] = useState({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});

  const [updModal, setUpdModal] = useState(false);
  const [editingUpdId, setEditingUpdId] = useState(null);
  const [um, setUm] = useState({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
  const [tagInput, setTagInput] = useState("");

  const [confirm, setConfirm] = useState(null);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2800); }
  function getP(id) { return projects.find(p=>p.id===id); }

  function goProject(id) { setActiveProjectId(id); setPage("project"); }

  // Project CRUD
  function openNewProject() {
    setEditingProjId(null);
    setPm({name:"",client:"",desc:"",status:"active",color:"#e8673a",start:today(),deadline:"",email:""});
    setProjModal(true);
  }
  function openEditProject() {
    const p=getP(activeProjectId);
    setEditingProjId(p.id);
    setPm({name:p.name,client:p.client,desc:p.desc,status:p.status,color:p.color,start:p.start||"",deadline:p.deadline||"",email:p.email||""});
    setProjModal(true);
  }
  function saveProject() {
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
  function deleteProject(id) {
    setProjects(ps=>ps.filter(p=>p.id!==id));
    setPage("dashboard"); setActiveProjectId(null);
    showToast("Project deleted."); setConfirm(null);
  }

  // Update CRUD
  function openAddUpdate() {
    setEditingUpdId(null);
    setUm({title:"",desc:"",status:"completed",date:today(),link:"",tags:[]});
    setTagInput(""); setUpdModal(true);
  }
  function openEditUpdate(uid_) {
    const u=getP(activeProjectId).updates.find(x=>x.id===uid_);
    setEditingUpdId(uid_);
    setUm({title:u.title,desc:u.desc,status:u.status,date:u.date,link:u.link||"",tags:[...u.tags]});
    setTagInput(""); setUpdModal(true);
  }
  function saveUpdate() {
    if(!um.title.trim()||!um.desc.trim()){showToast("Title and description required.");return;}
    setProjects(ps=>ps.map(p=>{
      if(p.id!==activeProjectId) return p;
      if(editingUpdId) return {...p,updates:p.updates.map(u=>u.id===editingUpdId?{...u,...um}:u)};
      return {...p,updates:[...p.updates,{id:uid(),...um}]};
    }));
    showToast(editingUpdId?"Update saved!":"Update posted!");
    setUpdModal(false);
  }
  function deleteUpdate(uid_) {
    setProjects(ps=>ps.map(p=>p.id!==activeProjectId?p:{...p,updates:p.updates.filter(u=>u.id!==uid_)}));
    showToast("Update deleted."); setConfirm(null);
  }

  function addTag(e) {
    if(e.key==="Enter"&&tagInput.trim()){
      e.preventDefault();
      const t=tagInput.trim();
      if(!um.tags.includes(t)) setUm(u=>({...u,tags:[...u.tags,t]}));
      setTagInput("");
    }
  }
  function removeTag(i){ setUm(u=>({...u,tags:u.tags.filter((_,idx)=>idx!==i)})); }

  function copyClientLink(p) {
    const url = `${window.location.origin}/client/${slugify(p.name)}`;
    navigator.clipboard.writeText(url).then(()=>showToast("Client link copied!")).catch(()=>showToast("Client link copied!"));
  }

  const activeProject = getP(activeProjectId);
  const stats = {
    total:projects.length,
    active:projects.filter(p=>p.status==="active").length,
    onhold:projects.filter(p=>p.status==="on-hold").length,
    updates:projects.reduce((a,p)=>a+p.updates.length,0),
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0c0c0e",color:"#f0efe8",fontFamily:"system-ui,sans-serif"}}>

      {/* SIDEBAR */}
      <aside style={{width:240,flexShrink:0,background:"#141416",borderRight:"1px solid #2a2a2e",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"20px 18px 16px",borderBottom:"1px solid #2a2a2e"}}>
          <div style={{fontWeight:800,fontSize:"1.2rem",letterSpacing:"-0.03em"}}>Project<span style={{color:"#e8673a"}}>Pulse</span></div>
          <div style={{fontSize:"0.68rem",color:"#6b6b72",marginTop:3,letterSpacing:"0.04em"}}>Client Update Manager</div>
        </div>
        <div style={{padding:"14px 12px 6px"}}>
          <div style={{fontSize:"0.67rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#6b6b72",padding:"0 6px",marginBottom:6}}>Menu</div>
          <div onClick={()=>{setPage("dashboard");setActiveProjectId(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:"0.87rem",fontWeight:500,background:page==="dashboard"?"#1c1c1f":"transparent",color:page==="dashboard"?"#f0efe8":"#9b9ba3",border:`1px solid ${page==="dashboard"?"#333":"transparent"}`}}>
            ▦ Dashboard
          </div>
        </div>
        <div style={{padding:"10px 12px 6px",flex:1}}>
          <div style={{fontSize:"0.67rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#6b6b72",padding:"0 6px",marginBottom:6}}>Projects</div>
          {projects.length===0&&<div style={{fontSize:"0.8rem",color:"#6b6b72",padding:"4px 10px"}}>No projects yet</div>}
          {projects.map(p=>(
            <div key={p.id} onClick={()=>goProject(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:"0.85rem",fontWeight:500,marginBottom:2,background:activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.1)":"transparent",color:activeProjectId===p.id&&page!=="dashboard"?"#f0efe8":"#9b9ba3",border:`1px solid ${activeProjectId===p.id&&page!=="dashboard"?"rgba(232,103,58,0.2)":"transparent"}`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/>
              <div style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
              <div style={{fontSize:"0.68rem",background:"#2a2a2e",color:"#9b9ba3",padding:"1px 7px",borderRadius:20}}>{p.updates.length}</div>
            </div>
          ))}
        </div>
        <div style={{padding:12,borderTop:"1px solid #2a2a2e"}}>
          <button onClick={openNewProject} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"#e8673a",color:"#fff",border:"none",borderRadius:8,fontFamily:"inherit",fontSize:"0.85rem",fontWeight:600,cursor:"pointer"}}>
            + New Project
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,overflowX:"hidden"}}>

        {/* DASHBOARD */}
        {page==="dashboard"&&(
          <div>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #2a2a2e",background:"#141416",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
              <div><div style={{fontWeight:700,fontSize:"1.2rem"}}>Dashboard</div><div style={{fontSize:"0.78rem",color:"#6b6b72",marginTop:2}}>All your projects at a glance</div></div>
              <Btn onClick={openNewProject}>+ New Project</Btn>
            </div>
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
                {[{label:"Total Projects",val:stats.total,color:"#f0efe8"},{label:"Active",val:stats.active,color:"#3ecf7a"},{label:"On Hold",val:stats.onhold,color:"#f5a623"},{label:"Updates Posted",val:stats.updates,color:"#e8673a"}].map(s=>(
                  <div key={s.label} style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:12,padding:"18px 16px"}}>
                    <div style={{fontSize:"0.7rem",color:"#6b6b72",letterSpacing:"0.05em",textTransform:"uppercase"}}>{s.label}</div>
                    <div style={{fontWeight:700,fontSize:"1.9rem",letterSpacing:"-0.04em",marginTop:5,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{fontWeight:700,fontSize:"1rem",marginBottom:14}}>All Projects</div>
              {projects.length===0?(
                <div style={{textAlign:"center",padding:"4rem",color:"#6b6b72"}}><div style={{fontSize:"2.5rem",marginBottom:12}}>📂</div><div>No projects yet.</div></div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
                  {projects.map(p=>(
                    <div key={p.id} onClick={()=>goProject(p.id)} style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,padding:"20px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:p.color}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                        <div><div style={{fontWeight:700,fontSize:"0.98rem"}}>{p.name}</div><div style={{fontSize:"0.77rem",color:"#6b6b72",marginTop:2}}>{p.client}</div></div>
                        <Badge status={p.status==="active"?"active":p.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(p.status)}/>
                      </div>
                      <div style={{fontSize:"0.82rem",color:"#9b9ba3",lineHeight:1.5,marginBottom:12,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.desc||"No description."}</div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:"0.75rem",color:"#6b6b72"}}>{p.updates.length} update{p.updates.length!==1?"s":""}</span>
                        {p.deadline&&<span style={{fontSize:"0.72rem",color:"#6b6b72"}}>Due {fmtDate(p.deadline)}</span>}
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
          <div>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #2a2a2e",background:"#141416",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,position:"sticky",top:0,zIndex:50}}>
              <div><div style={{fontWeight:700,fontSize:"1.2rem"}}>{activeProject.name}</div><div style={{fontSize:"0.78rem",color:"#6b6b72",marginTop:2}}>Client: {activeProject.client}</div></div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={()=>copyClientLink(activeProject)} variant="ghost" size="sm">🔗 Copy Client Link</Btn>
                <Btn onClick={openEditProject} variant="ghost" size="sm">✏ Edit</Btn>
                <Btn onClick={openAddUpdate} size="sm">+ Add Update</Btn>
              </div>
            </div>
            <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start"}}>
              <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",borderBottom:"1px solid #2a2a2e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontWeight:700}}>Updates</div>
                  <Btn onClick={openAddUpdate} size="sm">+ Add</Btn>
                </div>
                <div style={{padding:8}}>
                  {activeProject.updates.length===0?(
                    <div style={{padding:"2.5rem",textAlign:"center",color:"#6b6b72",fontSize:"0.85rem"}}>No updates yet.</div>
                  ):(
                    [...activeProject.updates].reverse().map(u=>(
                      <div key={u.id} style={{padding:"12px 14px",borderRadius:10,marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                          <Badge status={u.status}/>
                          <div style={{fontWeight:600,fontSize:"0.92rem",flex:1}}>{u.title}</div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>openEditUpdate(u.id)} style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid #333",background:"transparent",color:"#9b9ba3",cursor:"pointer",fontSize:"0.75rem"}}>✏️</button>
                            <button onClick={()=>setConfirm({title:"Delete Update",msg:`Delete "${u.title}"?`,onOk:()=>deleteUpdate(u.id)})} style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid #333",background:"transparent",color:"#e85555",cursor:"pointer",fontSize:"0.75rem"}}>🗑</button>
                          </div>
                        </div>
                        <div style={{fontSize:"0.83rem",color:"#9b9ba3",lineHeight:1.55}}>{u.desc}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:"0.72rem",color:"#6b6b72",marginRight:"auto"}}>{fmtDate(u.date)}</span>
                          {u.tags.map(t=><span key={t} style={{fontSize:"0.68rem",padding:"2px 7px",background:"#1c1c1f",border:"1px solid #333",borderRadius:4,color:"#9b9ba3"}}>{t}</span>)}
                          {u.link&&<a href={u.link} target="_blank" rel="noreferrer" style={{fontSize:"0.73rem",color:"#ff8a5c",textDecoration:"none",padding:"2px 7px",background:"rgba(232,103,58,0.08)",border:"1px solid rgba(232,103,58,0.15)",borderRadius:4}}>🔗 View File</a>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                {/* Client link box */}
                <div style={{background:"rgba(232,103,58,0.07)",border:"1px solid rgba(232,103,58,0.2)",borderRadius:14,padding:18,marginBottom:16}}>
                  <div style={{fontSize:"0.77rem",fontWeight:600,color:"#ff8a5c",marginBottom:10}}>🔗 Client Share Link</div>
                  <div style={{fontSize:"0.73rem",color:"#9b9ba3",fontFamily:"monospace",wordBreak:"break-all",background:"#1c1c1f",border:"1px solid #333",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                    {window.location.origin}/client/{slugify(activeProject.name)}
                  </div>
                  <Btn onClick={()=>copyClientLink(activeProject)} size="sm" style={{width:"100%",justifyContent:"center"}}>Copy Link</Btn>
                </div>

                {/* Info */}
                <div style={{background:"#141416",border:"1px solid #2a2a2e",borderRadius:14,padding:20,marginBottom:16}}>
                  <div style={{fontSize:"0.7rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"#6b6b72",marginBottom:14,fontWeight:600}}>Project Info</div>
                  {[["Client",activeProject.client],["Status",<Badge key="s" status={activeProject.status==="active"?"active":activeProject.status==="on-hold"?"on-hold":"completed-proj"} label={projStatusLabel(activeProject.status)}/>],["Start",fmtDate(activeProject.start)],["Deadline",fmtDate(activeProject.deadline)],["Email",activeProject.email||"—"],["Updates",activeProject.updates.length]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #2a2a2e"}}>
                      <span style={{fontSize:"0.8rem",color:"#6b6b72"}}>{k}</span>
                      <span style={{fontSize:"0.85rem",fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{background:"rgba(232,85,85,0.05)",border:"1px solid rgba(232,85,85,0.2)",borderRadius:14,padding:18}}>
                  <div style={{fontSize:"0.72rem",fontWeight:600,color:"#e85555",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>⚠ Danger Zone</div>
                  <div style={{fontSize:"0.82rem",color:"#6b6b72",marginBottom:12,lineHeight:1.5}}>Permanently delete this project and all updates.</div>
                  <Btn variant="danger" size="sm" onClick={()=>setConfirm({title:"Delete Project",msg:`Delete "${activeProject.name}"? This cannot be undone.`,onOk:()=>deleteProject(activeProjectId)})}>Delete Project</Btn>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT MODAL */}
      <Modal open={projModal} onClose={()=>setProjModal(false)} title={editingProjId?"Edit Project":"New Project"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Project Name *"><input style={inp} value={pm.name} onChange={e=>setPm(p=>({...p,name:e.target.value}))} placeholder="e.g. Website Redesign"/></Field>
          <Field label="Client Name *"><input style={inp} value={pm.client} onChange={e=>setPm(p=>({...p,client:e.target.value}))} placeholder="e.g. Acme Corp"/></Field>
        </div>
        <Field label="Description"><textarea style={inp2} value={pm.desc} onChange={e=>setPm(p=>({...p,desc:e.target.value}))} placeholder="Brief project overview…"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={inp} value={pm.status} onChange={e=>setPm(p=>({...p,status:e.target.value}))}>
              <option value="active">🟢 Active</option>
              <option value="on-hold">🟡 On Hold</option>
              <option value="completed">🔵 Completed</option>
            </select>
          </Field>
          <Field label="Accent Color">
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",padding:"6px 0"}}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setPm(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${pm.color===c?"#fff":"transparent"}`,transform:pm.color===c?"scale(1.2)":"scale(1)",transition:"all 0.15s"}}/>
              ))}
            </div>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Start Date"><input style={inp} type="date" value={pm.start} onChange={e=>setPm(p=>({...p,start:e.target.value}))}/></Field>
          <Field label="Deadline"><input style={inp} type="date" value={pm.deadline} onChange={e=>setPm(p=>({...p,deadline:e.target.value}))}/></Field>
        </div>
        <Field label="Client Email"><input style={inp} type="email" value={pm.email} onChange={e=>setPm(p=>({...p,email:e.target.value}))} placeholder="client@example.com"/></Field>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
          <Btn onClick={()=>setProjModal(false)} variant="ghost">Cancel</Btn>
          <Btn onClick={saveProject}>Save Project</Btn>
        </div>
      </Modal>

      {/* UPDATE MODAL */}
      <Modal open={updModal} onClose={()=>setUpdModal(false)} title={editingUpdId?"Edit Update":"New Update"}>
        <Field label="Title *"><input style={inp} value={um.title} onChange={e=>setUm(u=>({...u,title:e.target.value}))} placeholder="e.g. Homepage design approved"/></Field>
        <Field label="Description *"><textarea style={inp2} value={um.desc} onChange={e=>setUm(u=>({...u,desc:e.target.value}))} placeholder="What was done, what's next…"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Status">
            <select style={inp} value={um.status} onChange={e=>setUm(u=>({...u,status:e.target.value}))}>
              <option value="completed">✅ Completed</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="planned">📌 Planned</option>
            </select>
          </Field>
          <Field label="Date"><input style={inp} type="date" value={um.date} onChange={e=>setUm(u=>({...u,date:e.target.value}))}/></Field>
        </div>
        <Field label="File / Link (optional)"><input style={inp} type="url" value={um.link} onChange={e=>setUm(u=>({...u,link:e.target.value}))} placeholder="https://figma.com/…"/></Field>
        <Field label="Tags (press Enter to add)">
          <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:8,border:"1px solid #333",borderRadius:8,background:"#1c1c1f",minHeight:44,alignItems:"center"}}>
            {um.tags.map((t,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#2a2a2e",border:"1px solid #333",borderRadius:4,padding:"2px 8px",fontSize:"0.72rem",color:"#9b9ba3"}}>
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

      {/* CONFIRM */}
      <Modal open={!!confirm} onClose={()=>setConfirm(null)} title={confirm?.title||"Confirm"}>
        <div style={{fontSize:"0.9rem",color:"#9b9ba3",marginBottom:24,lineHeight:1.5}}>{confirm?.msg}</div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn onClick={()=>setConfirm(null)} variant="ghost">Cancel</Btn>
          <Btn onClick={confirm?.onOk} variant="danger">Delete</Btn>
        </div>
      </Modal>

      <Toast msg={toast}/>
    </div>
  );
}

// ════════════════════════════════
//   ROOT
// ════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminApp/>}/>
        <Route path="/client/:slug" element={<ClientPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}