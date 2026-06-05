import { useState, useEffect } from "react";

/* ─── API ──────────────────────────────────────────────────── */
async function ask(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "";
}
function parseJSON(raw) {
  try { return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]); } catch { return null; }
}

/* ─── TOKENS ───────────────────────────────────────────────── */
const T = {
  bg: "#FFFFFF", surf: "#F9FAFB", hover: "#F3F4F6",
  line: "#E5E7EB", lined: "#D1D5DB",
  ink: "#111827", sub: "#6B7280", ghost: "#9CA3AF",
  blue: "#2563EB", green: "#059669", amber: "#D97706",
  red: "#DC2626", violet: "#7C3AED",
};

/* ─── ATOMS ────────────────────────────────────────────────── */
const Pill = ({ t, c = T.blue }) => (
  <span style={{ fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:99, border:`1px solid ${c}30`, color:c, background:c+"0d", whiteSpace:"nowrap", letterSpacing:"0.02em" }}>{t}</span>
);
const Spin = ({ size=13 }) => (
  <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", border:`2px solid ${T.line}`, borderTopColor:T.ink, animation:"spin .6s linear infinite", flexShrink:0 }} />
);
const Dot = ({ c=T.ghost, size=6 }) => (
  <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:c, flexShrink:0 }} />
);
const Lbl = ({ children, c }) => (
  <div style={{ fontSize:10, fontWeight:600, color:c||T.ghost, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:3 }}>{children}</div>
);
const Hr = () => <div style={{ height:1, background:T.line, margin:"16px 0" }} />;

function Btn({ children, onClick, disabled, variant="primary", size="md" }) {
  const pad = size==="sm" ? "5px 12px" : "9px 20px";
  const fs  = size==="sm" ? 12 : 13;
  const styles = {
    primary: { background:T.ink,  color:"#fff",  border:"none" },
    ghost:   { background:"none", color:T.sub,   border:`1px solid ${T.line}` },
    blue:    { background:"none", color:T.blue,  border:`1px solid ${T.blue}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], borderRadius:7, fontFamily:"inherit", fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.4:1, transition:"opacity .1s", fontSize:fs, padding:pad }}>
      {children}
    </button>
  );
}
function Input({ label, value, onChange, placeholder, type="text", suffix }) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{ width:"100%", padding:suffix?"8px 36px 8px 10px":"8px 10px", border:`1px solid ${T.line}`, borderRadius:6, fontSize:13, color:T.ink, fontFamily:"inherit", background:T.bg, outline:"none" }}
          onFocus={e=>e.target.style.borderColor=T.ink} onBlur={e=>e.target.style.borderColor=T.line}
        />
        {suffix && <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:T.ghost, pointerEvents:"none" }}>{suffix}</span>}
      </div>
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows=5 }) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:"100%", padding:"10px 12px", border:`1px solid ${T.line}`, borderRadius:7, fontSize:13, color:T.ink, fontFamily:"inherit", background:T.surf, outline:"none", resize:"vertical", lineHeight:1.7 }}
        onFocus={e=>e.target.style.borderColor=T.ink} onBlur={e=>e.target.style.borderColor=T.line}
      />
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", padding:"8px 10px", border:`1px solid ${T.line}`, borderRadius:6, fontSize:13, color:T.ink, fontFamily:"inherit", background:T.bg, outline:"none" }}>
        {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </div>
  );
}
function Section({ id, title, count, loading, children, topBorder=true }) {
  return (
    <div id={id} style={{ paddingTop:24, borderTop:topBorder?`1px solid ${T.line}`:"none" }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:14 }}>
        <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>{title}</h2>
        {count != null && <span style={{ fontSize:12, color:T.ghost }}>{count}</span>}
        {loading && <Spin />}
      </div>
      {children}
    </div>
  );
}

/* ─── PROMPTS ──────────────────────────────────────────────── */
const P = {
  core: `Senior WMM performance strategist. Return ONLY valid JSON, no markdown:
{"brand":"","tagline":"6-word tagline","valueProposition":"one sentence","saturation":[{"angle":"","level":"HIGH|MED|LOW","note":""}],"gaps":[{"gap":"","why":""}],"angles":[{"id":1,"name":"3-5 words","belief":"belief attacked","counter":"new belief","emotion":"","rational":"","funnel":"TOF|MOF|BOF","risk":"LOW|MED|HIGH","proposition":"one sentence","formats":[""]}]}`,

  tactics: `Senior WMM creative director + media buyer. Return ONLY valid JSON, no markdown:
{"hooks":[{"angleId":1,"text":"max 15 words","pattern":"contrarian|diagnosis|mechanism|proof-first|identity|curiosity|social-proof","format":"video|static|search"}],"channels":[{"name":"","pct":"","objective":"","formats":[""],"kpi":""}],"lp":{"hero":"","sub":"","sections":[{"n":1,"name":"","headline":"","copy":"","cta":"","proof":"","objection":""}]},"ads":[{"id":"AD1","angleId":1,"format":"UGC|Founder|POV|Comparison|Story","funnel":"TOF|MOF|BOF","hook":"","prop":"","beats":["","","","",""],"cta":"","duration":"15s|30s|60s"}]}`,

  journey: `Senior WMM conversion architect. Return ONLY valid JSON, no markdown:
{"stages":[{"id":"s1","name":"","channel":"","type":"AD|PAGE|EMAIL|CALL|SMS","emotion":"","thought":"","message":"","cta":"","friction":[""],"next":"s2","drop":"LOW|MED|HIGH","kpi":""}],"path":["s1","s2"]}`,

  financials: `WMM financial strategist. Return ONLY valid JSON, no markdown:
{"viable":true,"summary":"2-sentence verdict","breakEvenCAC":0,"targetCAC":0,"maxCAC":0,"revenuePerLead":0,"leadsNeeded":0,"alerts":[{"level":"warning|critical","message":""}],"budgetBreakdown":[{"channel":"","amount":0,"pct":"","objective":"","expectedLeads":0,"expectedCPL":0}],"scenarios":[{"name":"Conservative|Base|Optimistic","leadsPerMonth":0,"cpl":0,"closedDeals":0,"revenue":0,"roas":0}],"recommendations":[""],"readinessChecks":[{"item":"","status":"ok|warning|critical","note":""}]}`,

  // Email Flows
  emailFlow: `You are a senior WMM email strategist and copywriter expert in GoHighLevel automations.
Given the trigger, objective, brand context and ICP, generate a complete email automation flow.
Return ONLY valid JSON, no markdown, no fences:
{
  "flowName": "",
  "trigger": "",
  "objective": "",
  "totalDuration": "e.g. 14 days",
  "summary": "2-sentence description of the flow logic",
  "steps": [
    {
      "stepNum": 1,
      "type": "email|sms|wait|condition|action",
      "waitDelay": "e.g. Immediately|1 hour|1 day|3 days",
      "conditionLogic": "only if type=condition: e.g. Opened email? Yes/No branch",
      "ghlAction": "only if type=action: e.g. Add tag, Move pipeline stage, Assign to user",
      "email": {
        "subjectLine": "",
        "previewText": "",
        "body": "full HTML-ready plain text body with [FIRST NAME] [BRAND] placeholders. Use line breaks. Include a clear CTA link as [CTA_LINK].",
        "ctaText": "",
        "tone": "warm|urgent|educational|social-proof|direct"
      },
      "sms": {
        "message": "max 160 chars. Use [FIRST NAME] [BRAND] [CTA_LINK].",
        "tone": ""
      },
      "purpose": "one line — what this step does strategically"
    }
  ],
  "ghlSetupNotes": ["setup tip 1 for GoHighLevel", "setup tip 2"],
  "tagsNeeded": ["tag1", "tag2"],
  "pipelineStages": ["stage name 1", "stage name 2"]
}`,

  // Creative Request: generates full WMM Creative Request format
  creativeRequest: `You are a WMM senior media buyer and creative director filling out the official WMM Creative Request template.
Given the campaign context and angles, return ONLY valid JSON, no markdown, no fences.
Generate complete, production-ready copy for every field.
Schema:
{
  "campaignInfo": {
    "client": "",
    "campaignName": "",
    "dateCreated": "",
    "platform": "Meta|Google|Meta + Google",
    "objective": "Leads|Sales|Traffic|Awareness|Retargeting",
    "funnelStage": "Cold|Warm|Hot"
  },
  "conversionPoint": {
    "type": "Landing Page|Lead Form|Call|Booking|Checkout",
    "url": "",
    "primaryCTA": ""
  },
  "context": {
    "icp": "",
    "concept": ""
  },
  "formats": {
    "static": ["1:1","4:5","9:16"],
    "video": ["9:16","1:1"],
    "carousel": [],
    "gdn": []
  },
  "staticAngles": [
    {
      "angleNum": "ANGLE01",
      "theme": "T-HOOK|T-CTA|T-VIS|S-HOOK|S-CTA",
      "copyIn": { "headline": "", "subheadline": "", "ctaText": "" },
      "copyOut": { "primaryText": "", "headline": "", "description": "" }
    }
  ],
  "videoAngles": [
    {
      "angleNum": "ANGLE01",
      "theme": "T-HOOK|T-CTA|T-VIS|S-HOOK|S-CTA",
      "estimatedLength": "30s",
      "format": "UGC|Founder|POV|Comparison|Story",
      "hook": "",
      "beats": [
        { "beatNum": 1, "onScreen": "", "vo": "" },
        { "beatNum": 2, "onScreen": "", "vo": "" },
        { "beatNum": 3, "onScreen": "", "vo": "" },
        { "beatNum": 4, "onScreen": "", "vo": "" }
      ],
      "finalCTAFrame": "",
      "copyOut": { "primaryText": "", "headline": "", "description": "" }
    }
  ],
  "carouselAngles": [],
  "landingPage": {
    "include": true,
    "conversionAction": "",
    "primaryCTA": "",
    "hero": { "h1": "", "sub": "", "cta": "", "scrollText": "" },
    "benefits": ["","",""],
    "proof": { "type": "", "notes": "" },
    "finalCTA": { "line": "", "button": "", "reassurance": "" }
  },
  "fileNaming": {
    "clientCode": "",
    "campShort": "",
    "files": [
      { "type": "Static", "name": "" },
      { "type": "Video",  "name": "" }
    ]
  }
}`,
};

/* ─── STRATEGY DISPLAY COMPONENTS ─────────────────────────── */
const FC = { TOF:T.blue, MOF:T.amber, BOF:T.green };
const RISK = { LOW:T.green, MED:T.amber, HIGH:T.red };
const PAT = { contrarian:T.red, diagnosis:T.amber, mechanism:T.blue, "proof-first":T.green, identity:T.violet, curiosity:"#F97316", "social-proof":T.green };
const CHAN_C = { Meta:T.blue, Google:T.green, Email:T.amber, YouTube:T.red, TikTok:T.violet };
const FMT_C = { UGC:T.green, Founder:T.blue, POV:T.violet, Comparison:T.amber, Story:"#F97316" };

function SatView({ core }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
      <div>
        <Lbl c={T.red}>Saturated</Lbl>
        {core.saturation?.map((s,i) => (
          <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.line}` }}>
            <Pill t={s.level} c={RISK[s.level]||T.ghost} />
            <div><div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{s.angle}</div><div style={{ fontSize:12, color:T.sub, marginTop:1 }}>{s.note}</div></div>
          </div>
        ))}
      </div>
      <div>
        <Lbl c={T.green}>Gaps → Opportunities</Lbl>
        {core.gaps?.map((g,i) => (
          <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${T.line}` }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{g.gap}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:1 }}>{g.why}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function AnglesView({ angles }) {
  return (
    <div>
      {angles?.map((a,i) => {
        const fc = FC[a.funnel]||T.blue;
        return (
          <div key={a.id} style={{ display:"grid", gridTemplateColumns:"28px 1fr", gap:"0 16px", padding:"14px 0", borderBottom:i<angles.length-1?`1px solid ${T.line}`:"none" }}>
            <span style={{ fontSize:12, fontWeight:700, color:T.ghost, paddingTop:2 }}>{String(a.id).padStart(2,"0")}</span>
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>{a.name}</span>
                <Pill t={a.funnel} c={fc} /><Pill t={`risk ${a.risk}`} c={RISK[a.risk]||T.ghost} />
              </div>
              <div style={{ fontSize:13, color:fc, marginBottom:8, lineHeight:1.5 }}>{a.proposition}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"6px 16px" }}>
                {[["Belief out",a.belief,T.red],["Belief in",a.counter,T.green],["Emotion",a.emotion,T.sub],["Rational",a.rational,T.sub]].map(([l,v,c]) => (
                  <div key={l}><Lbl>{l}</Lbl><div style={{ fontSize:12, color:c, lineHeight:1.4 }}>{v}</div></div>
                ))}
              </div>
              {a.formats?.length>0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>{a.formats.map((f,j)=><Pill key={j} t={f} c={T.sub}/>)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function HooksView({ hooks, angles }) {
  const by = {};
  hooks?.forEach(h=>{ (by[h.angleId]=by[h.angleId]||[]).push(h); });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {Object.entries(by).map(([aid,hs]) => {
        const ang = angles?.find(a=>a.id==aid);
        return (
          <div key={aid}>
            <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>{ang?.name}</div>
            {hs.map((h,i)=>(
              <div key={i} style={{ display:"flex", gap:12, alignItems:"baseline", padding:"7px 0", borderBottom:`1px solid ${T.line}` }}>
                <span style={{ fontSize:11, color:T.ghost, minWidth:16, fontWeight:600 }}>{i+1}</span>
                <span style={{ fontSize:13, color:T.ink, flex:1, lineHeight:1.5 }}>"{h.text}"</span>
                <Pill t={h.pattern} c={PAT[h.pattern]||T.ghost}/><Pill t={h.format} c={T.ghost}/>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
function ChannelsView({ channels }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
      {channels?.map((ch,i) => {
        const cc = Object.entries(CHAN_C).find(([k])=>ch.name?.includes(k))?.[1]||T.blue;
        return (
          <div key={i} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:700 }}>{ch.name}</span>
              <span style={{ fontSize:18, fontWeight:800, color:cc, fontFamily:"monospace" }}>{ch.pct}</span>
            </div>
            <div style={{ fontSize:12, color:T.sub, lineHeight:1.5, marginBottom:8 }}>{ch.objective}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>{ch.formats?.map((f,j)=><Pill key={j} t={f} c={cc}/>)}</div>
            <div style={{ fontSize:11, fontWeight:600, color:cc }}>KPI: {ch.kpi}</div>
          </div>
        );
      })}
    </div>
  );
}
function LPView({ lp }) {
  return (
    <div>
      <div style={{ padding:"18px 0 14px", borderBottom:`1px solid ${T.line}`, marginBottom:14 }}>
        <div style={{ fontSize:22, fontWeight:800, color:T.ink, lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:6 }}>{lp.hero}</div>
        <div style={{ fontSize:14, color:T.sub, lineHeight:1.6 }}>{lp.sub}</div>
      </div>
      {lp.sections?.map((s,i)=>(
        <div key={i} style={{ display:"grid", gridTemplateColumns:"100px 1fr", gap:"0 24px", padding:"11px 0", borderBottom:i<lp.sections.length-1?`1px solid ${T.line}`:"none" }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.ghost, textTransform:"uppercase", letterSpacing:"0.05em", paddingTop:2 }}>{String(s.n).padStart(2,"0")} {s.name}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:3 }}>{s.headline}</div>
            <div style={{ fontSize:12, color:T.sub, marginBottom:8, lineHeight:1.5 }}>{s.copy}</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {s.cta&&<div><Lbl>CTA</Lbl><div style={{ fontSize:12, color:T.green, fontWeight:600 }}>{s.cta}</div></div>}
              {s.proof&&<div><Lbl>Proof</Lbl><div style={{ fontSize:12, color:T.sub }}>{s.proof}</div></div>}
              {s.objection&&<div><Lbl>Objection handled</Lbl><div style={{ fontSize:12, color:T.sub }}>{s.objection}</div></div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function AdsView({ ads, angles }) {
  return (
    <div>
      {ads?.map((ad,i)=>{
        const ang = angles?.find(a=>a.id==ad.angleId);
        const fc = FC[ad.funnel]||T.blue;
        return (
          <div key={i} style={{ padding:"16px 0", borderBottom:i<ads.length-1?`1px solid ${T.line}`:"none" }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.ghost }}>{ad.id}</span>
              <Pill t={ad.format} c={FMT_C[ad.format]||T.blue}/><Pill t={ad.funnel} c={fc}/><Pill t={ad.duration} c={T.ghost}/>
              {ang&&<span style={{ fontSize:11, color:T.ghost }}>→ {ang.name}</span>}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontStyle:"italic", marginBottom:5, lineHeight:1.4 }}>"{ad.hook}"</div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:12, lineHeight:1.5 }}>{ad.prop}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:8 }}>
              {ad.beats?.map((b,bi)=>(
                <div key={bi} style={{ background:T.surf, borderRadius:6, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:T.ghost, marginBottom:3 }}>BEAT {bi+1}</div>
                  <div style={{ fontSize:11, color:T.sub, lineHeight:1.4 }}>{b}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:T.green }}>→ {ad.cta}</div>
          </div>
        );
      })}
    </div>
  );
}
function JourneyView({ journey }) {
  if (!journey?.stages?.length) return null;
  const path = journey.path?.length ? journey.path : journey.stages.map(s=>s.id);
  const stages = path.map(id=>journey.stages.find(s=>s.id===id)).filter(Boolean);
  const CC = { Meta:T.blue, Google:T.green, "Landing Page":T.violet, LP:T.violet, Email:T.amber, WhatsApp:T.green, Phone:T.red, SMS:T.amber };
  const getC = ch => Object.entries(CC).find(([k])=>ch?.includes(k))?.[1]||T.blue;
  return (
    <div>
      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ display:"flex", minWidth:stages.length*200 }}>
          {stages.map((s,i)=>{
            const cc=getC(s.channel);
            return (
              <div key={s.id} style={{ display:"flex", alignItems:"flex-start" }}>
                <div style={{ width:188, flexShrink:0 }}>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}><Dot c={cc}/><span style={{ fontSize:10, fontWeight:700, color:T.ghost, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.type}</span></div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{s.name}</div>
                    <Pill t={s.channel} c={cc}/>
                  </div>
                  <div style={{ background:T.surf, borderRadius:6, padding:"8px 10px", marginBottom:8 }}>
                    <Lbl>Feels</Lbl>
                    <div style={{ fontSize:12, color:T.ink }}>{s.emotion}</div>
                    <div style={{ fontSize:11, color:T.sub, fontStyle:"italic" }}>"{s.thought}"</div>
                  </div>
                  <div style={{ fontSize:12, color:T.sub, lineHeight:1.5, marginBottom:5 }}>{s.message}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:cc, marginBottom:5 }}>→ {s.cta}</div>
                  {s.friction?.filter(Boolean).length>0 && <div style={{ marginBottom:5 }}>{s.friction.filter(Boolean).map((f,fi)=><div key={fi} style={{ fontSize:10, color:T.green }}>✓ {f}</div>)}</div>}
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, color:T.ghost }}>{s.kpi}</span>
                    <Pill t={`drop ${s.drop}`} c={{LOW:T.green,MED:T.amber,HIGH:T.red}[s.drop]||T.ghost}/>
                  </div>
                </div>
                {i<stages.length-1&&(
                  <div style={{ display:"flex", alignItems:"center", width:24, paddingTop:26, flexShrink:0 }}>
                    <div style={{ width:16, height:1, background:T.lined }}/><span style={{ fontSize:8, color:T.ghost }}>▶</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display:"flex", gap:24, marginTop:14, paddingTop:12, borderTop:`1px solid ${T.line}` }}>
        {[["Touchpoints",stages.length],["Channels",[...new Set(stages.map(s=>s.channel))].length],["High drop risk",stages.filter(s=>s.drop==="HIGH").length]].map(([l,v])=>(
          <div key={l}><div style={{ fontSize:20, fontWeight:800, color:T.ink }}>{v}</div><div style={{ fontSize:11, color:T.ghost }}>{l}</div></div>
        ))}
      </div>
    </div>
  );
}

/* ─── MODE 1: STRATEGY ─────────────────────────────────────── */
const STRAT_EX = `BRIEF — NeoBuild, Premium Outdoor Remodeling, Florida
Offer: Custom patios, decks, pergolas for $500K+ homes. Range: $35K–$150K. Decision: 2–6 weeks.
USP: Free 3D design, 10-year guarantee, max 8 projects/month.
Proof: Before/after photos, "+12-18% home value ROI", client testimonials.
Target: Homeowners 40-60, HHI $200K+, South Florida. Budget: $8K/month. KPI: leads ≥$30K.

COMPETITORS
- SunState: cheap angle, no 3D, generic materials
- FloriScape Pro: founder authority, long before/after videos
- TerraLux: luxury but no guarantee, staged testimonials
- Outdoor Living Co: strong Google, "best ROI" angle
- Local contractors: referral-heavy, no paid, trust angle`;

const SNAV = [["sat","Saturation"],["ang","Angles"],["hks","Hooks"],["chn","Channels"],["lp","Web/LP"],["ads","Ads"],["jrn","Journey"]];

// Strategy exposes its data via onData callback so Creative Request can consume it
function StrategyMode({ onData }) {
  const [phase,setPhase] = useState("input");
  const [brief,setBrief] = useState("");
  const [steps,setSteps] = useState(["idle","idle","idle"]);
  const [core,setCore]   = useState(null);
  const [tact,setTact]   = useState(null);
  const [jrn,setJrn]     = useState(null);
  const [nav,setNav]     = useState("sat");

  const setStep = (i,v)=>setSteps(s=>{const n=[...s];n[i]=v;return n;});
  const allDone = !!core&&!!tact&&!!jrn;
  const done = {sat:!!core,ang:!!core,hks:!!tact,chn:!!tact,lp:!!tact,ads:!!tact,jrn:!!jrn};

  async function generate() {
    setPhase("loading"); setCore(null); setTact(null); setJrn(null);
    setSteps(["run","idle","idle"]);
    let coreData=null;
    try {
      coreData=parseJSON(await ask(P.core,`Brief + competitors:\n\n${brief}`));
      if(coreData){setCore(coreData);setPhase("results");onData&&onData({core:coreData,tact:null,jrn:null,brief});}
      setStep(0,"done");
    } catch{setStep(0,"done");}
    if(!coreData){setPhase("results");return;}
    setStep(1,"run");setStep(2,"run");
    const [t,j]=await Promise.allSettled([
      ask(P.tactics,`Brief:\n${brief}\n\nAngles:\n${JSON.stringify(coreData.angles)}`),
      ask(P.journey,`Brief:\n${brief}\n\nAngles:\n${JSON.stringify(coreData.angles)}`),
    ]);
    let tactData=null,jrnData=null;
    if(t.status==="fulfilled"){tactData=parseJSON(t.value);if(tactData)setTact(tactData);}
    if(j.status==="fulfilled"){jrnData=parseJSON(j.value);if(jrnData)setJrn(jrnData);}
    setStep(1,"done");setStep(2,"done");
    onData&&onData({core:coreData,tact:tactData,jrn:jrnData,brief});
  }

  useEffect(()=>{
    if(!core)return;
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setNav(e.target.id);}),{threshold:0.2,rootMargin:"-50px 0px 0px 0px"});
    SNAV.forEach(([id])=>{const el=document.getElementById(id);if(el)obs.observe(el);});
    return()=>obs.disconnect();
  },[core]);

  if(phase==="input"||(phase==="loading"&&!core)) return (
    <div style={{ maxWidth:640, padding:"0 24px" }}>
      {phase==="input"?(
        <>
          <div style={{ fontSize:13, color:T.sub, lineHeight:1.6, marginBottom:16 }}>Paste brief + competitor intelligence. Generates angles, hooks, channels, LP, ads and journey map.</div>
          <Textarea value={brief} onChange={setBrief} placeholder={STRAT_EX} rows={10}/>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <Btn onClick={generate} disabled={!brief.trim()}>Generate strategy →</Btn>
            <Btn onClick={()=>setBrief(STRAT_EX)} variant="ghost">Load example</Btn>
          </div>
        </>
      ):(
        <div style={{ paddingTop:20 }}>
          <div style={{ fontSize:13, color:T.sub, marginBottom:20 }}>Generating strategy…</div>
          {["Angles & saturation","Hooks, channels, LP, ads","Journey map"].map((l,i)=>(
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
              {steps[i]==="run"?<Spin/>:steps[i]==="done"?<Dot c={T.green}/>:<Dot c={T.line}/>}
              <span style={{ fontSize:13, color:steps[i]==="run"?T.ink:steps[i]==="done"?T.green:T.ghost }}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", borderBottom:`1px solid ${T.line}`, overflowX:"auto", background:T.bg }}>
        {SNAV.map(([id,label])=>(
          <a key={id} href={`#${id}`} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", fontSize:12, fontWeight:nav===id?600:400, color:nav===id?T.ink:T.sub, borderBottom:nav===id?`2px solid ${T.ink}`:"2px solid transparent", textDecoration:"none", whiteSpace:"nowrap" }}>
            {done[id]&&<Dot c={T.green}/>}{label}
          </a>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"0 14px" }}>
          {!allDone&&<><Spin size={11}/><span style={{ fontSize:11, color:T.ghost }}>generating…</span></>}
          {allDone&&<span style={{ fontSize:11, color:T.green, fontWeight:600 }}>✓ complete</span>}
          <Btn size="sm" variant="ghost" onClick={()=>{setPhase("input");setCore(null);setTact(null);setJrn(null);setSteps(["idle","idle","idle"]);onData&&onData(null);}}>New brief</Btn>
          {allDone&&<Btn size="sm" variant="ghost" onClick={()=>{const b=new Blob([JSON.stringify({core,tact,jrn},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${(core?.brand||"strategy").replace(/\s+/g,"_")}.json`;a.click();}}>Export</Btn>}
        </div>
      </div>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
        {core&&(
          <div style={{ paddingBottom:20 }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", marginBottom:3 }}>{core.brand}</div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:6 }}>{core.tagline}</div>
            <div style={{ fontSize:13, color:T.sub, maxWidth:560, lineHeight:1.6 }}><span style={{ fontWeight:600, color:T.ink }}>Value prop: </span>{core.valueProposition}</div>
          </div>
        )}
        {!allDone&&core&&<div style={{ display:"flex", gap:8, alignItems:"center", padding:"9px 12px", background:T.surf, borderRadius:7, marginBottom:12, border:`1px solid ${T.line}` }}><Spin/><span style={{ fontSize:12, color:T.sub }}>{!tact?"Generating hooks, channels, LP and ads…":"Building journey map…"}</span></div>}
        {core&&<><Section id="sat" title="Saturation" count={`${core.saturation?.length||0} saturated · ${core.gaps?.length||0} gaps`}><SatView core={core}/></Section><Section id="ang" title="Angles" count={core.angles?.length}><AnglesView angles={core.angles}/></Section></>}
        <Section id="hks" title="Hooks" count={tact?.hooks?.length} loading={!tact&&steps[1]==="run"}>{tact?.hooks?<HooksView hooks={tact.hooks} angles={core?.angles}/>:steps[1]==="run"?<div style={{ height:40, display:"flex", alignItems:"center", gap:8, color:T.ghost, fontSize:12 }}><Spin/>Writing hooks…</div>:null}</Section>
        <Section id="chn" title="Channel Strategy" count={tact?.channels?.length} loading={!tact&&steps[1]==="run"}>{tact?.channels?<ChannelsView channels={tact.channels}/>:steps[1]==="run"?<div style={{ height:40, display:"flex", alignItems:"center", gap:8, color:T.ghost, fontSize:12 }}><Spin/>Building channels…</div>:null}</Section>
        <Section id="lp" title="Web / Landing Page" count={tact?.lp?.sections?.length} loading={!tact&&steps[1]==="run"}>{tact?.lp?<LPView lp={tact.lp}/>:steps[1]==="run"?<div style={{ height:40, display:"flex", alignItems:"center", gap:8, color:T.ghost, fontSize:12 }}><Spin/>Architecting LP…</div>:null}</Section>
        <Section id="ads" title="Ad Concepts" count={tact?.ads?.length} loading={!tact&&steps[1]==="run"}>{tact?.ads?<AdsView ads={tact.ads} angles={core?.angles}/>:steps[1]==="run"?<div style={{ height:40, display:"flex", alignItems:"center", gap:8, color:T.ghost, fontSize:12 }}><Spin/>Creating concepts…</div>:null}</Section>
        <Section id="jrn" title="User Journey" count={jrn?.stages?.length} loading={!jrn&&steps[2]==="run"}>{jrn?<JourneyView journey={jrn}/>:steps[2]==="run"?<div style={{ height:40, display:"flex", alignItems:"center", gap:8, color:T.ghost, fontSize:12 }}><Spin/>Mapping journey…</div>:null}</Section>
      </div>
    </div>
  );
}

/* ─── MODE 2: FINANCIALS ───────────────────────────────────── */
function FinancialsMode() {
  const [f,setF]=useState({aov:"",margin:"",ltv:"",budget:"",target:"",bookingRate:"",showRate:"",closeRate:"",responseTime:""});
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const ready=f.aov&&f.margin&&f.budget&&f.target;
  const HC={good:T.green,warning:T.amber,critical:T.red};

  async function run(){
    setLoading(true);setResult(null);
    try{
      const input=`AOV: $${f.aov}, Gross margin: ${f.margin}%, LTV: $${f.ltv||f.aov}, Monthly budget: $${f.budget}, Revenue target: $${f.target}/mo, Booking rate: ${f.bookingRate||"?"}%, Show rate: ${f.showRate||"?"}%, Close rate: ${f.closeRate||"?"}%, Lead response time: ${f.responseTime||"?"}min`;
      setResult(parseJSON(await ask(P.financials,input)));
    }finally{setLoading(false);}
  }

  return (
    <div style={{ maxWidth:900, padding:"0 24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, marginBottom:28 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:14, textTransform:"uppercase", letterSpacing:"0.05em" }}>Financial Model</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Input label="AOV" value={f.aov} onChange={v=>set("aov",v)} placeholder="5000" type="number" suffix="$"/>
            <Input label="Gross Margin" value={f.margin} onChange={v=>set("margin",v)} placeholder="60" type="number" suffix="%"/>
            <Input label="LTV (6-12 months)" value={f.ltv} onChange={v=>set("ltv",v)} placeholder="8000" type="number" suffix="$"/>
            <Input label="Monthly Ad Budget" value={f.budget} onChange={v=>set("budget",v)} placeholder="8000" type="number" suffix="$"/>
            <Input label="Monthly Revenue Target" value={f.target} onChange={v=>set("target",v)} placeholder="50000" type="number" suffix="$"/>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:14, textTransform:"uppercase", letterSpacing:"0.05em" }}>Sales Readiness</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Input label="Booking Rate" value={f.bookingRate} onChange={v=>set("bookingRate",v)} placeholder="40" type="number" suffix="%"/>
            <Input label="Show Rate" value={f.showRate} onChange={v=>set("showRate",v)} placeholder="70" type="number" suffix="%"/>
            <Input label="Close Rate" value={f.closeRate} onChange={v=>set("closeRate",v)} placeholder="25" type="number" suffix="%"/>
            <Input label="Lead Response Time" value={f.responseTime} onChange={v=>set("responseTime",v)} placeholder="10" type="number" suffix="min"/>
          </div>
          <div style={{ marginTop:20 }}><Btn onClick={run} disabled={!ready||loading}>{loading?"Analyzing…":"Run financial model →"}</Btn></div>
        </div>
      </div>

      {loading&&<div style={{ display:"flex",gap:8,alignItems:"center",color:T.sub,fontSize:13 }}><Spin/>Calculating…</div>}

      {result&&(
        <div style={{ animation:"fadeIn .2s ease" }}>
          <div style={{ padding:"14px 18px", borderRadius:8, marginBottom:24, background:result.viable?T.green+"0d":T.red+"0d", border:`1px solid ${result.viable?T.green:T.red}30` }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6 }}><Dot c={result.viable?T.green:T.red} size={8}/><span style={{ fontSize:13, fontWeight:700, color:result.viable?T.green:T.red }}>{result.viable?"Financially viable":"Needs review before scaling"}</span></div>
            <div style={{ fontSize:13, color:T.sub, lineHeight:1.6 }}>{result.summary}</div>
          </div>
          {result.alerts?.length>0&&<div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:24 }}>{result.alerts.map((a,i)=><div key={i} style={{ display:"flex", gap:10, padding:"9px 12px", borderRadius:7, background:a.level==="critical"?T.red+"0c":T.amber+"0c", border:`1px solid ${a.level==="critical"?T.red:T.amber}25` }}><span style={{ fontSize:12, fontWeight:700, color:a.level==="critical"?T.red:T.amber, minWidth:56 }}>{a.level.toUpperCase()}</span><span style={{ fontSize:12, color:T.sub }}>{a.message}</span></div>)}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {[["Max CAC",`$${result.maxCAC}`,T.ink],["Target CAC",`$${result.targetCAC}`,T.blue],["Revenue/Lead",`$${result.revenuePerLead}`,T.green],["Leads Needed",result.leadsNeeded,T.ink]].map(([l,v,c])=>(
              <div key={l} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:"12px 14px" }}>
                <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:"monospace" }}>{v}</div>
                <div style={{ fontSize:11, color:T.ghost, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <Section title="Scenarios" topBorder>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {result.scenarios?.map((s,i)=>(
                <div key={i} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>{s.name}</div>
                  {[["Leads/mo",s.leadsPerMonth],["CPL",`$${s.cpl}`],["Deals closed",s.closedDeals],["Revenue",`$${s.revenue}`],["ROAS",`${s.roas}x`]].map(([l,v])=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${T.line}` }}>
                      <span style={{ fontSize:12, color:T.sub }}>{l}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:"monospace" }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
          <Section title="Budget Breakdown">
            {result.budgetBreakdown?.map((b,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"140px 60px 1fr 80px 80px", gap:"0 16px", alignItems:"baseline", padding:"8px 0", borderBottom:`1px solid ${T.line}` }}>
                <span style={{ fontSize:13, fontWeight:600, color:T.ink }}>{b.channel}</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.blue, fontFamily:"monospace" }}>{b.pct}</span>
                <span style={{ fontSize:12, color:T.sub }}>{b.objective}</span>
                <div><Lbl>Est. Leads</Lbl><span style={{ fontSize:12 }}>{b.expectedLeads}</span></div>
                <div><Lbl>Est. CPL</Lbl><span style={{ fontSize:12 }}>${b.expectedCPL}</span></div>
              </div>
            ))}
          </Section>
          <Section title="Readiness Checklist">
            {result.readinessChecks?.map((r,i)=>(
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"7px 0", borderBottom:`1px solid ${T.line}` }}>
                <Dot c={HC[r.status]||T.ghost} size={7}/>
                <span style={{ fontSize:13, fontWeight:600, color:T.ink, minWidth:180 }}>{r.item}</span>
                <span style={{ fontSize:12, color:T.sub }}>{r.note}</span>
              </div>
            ))}
          </Section>
          <Section title="Recommendations">
            {result.recommendations?.map((r,i)=>(
              <div key={i} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:`1px solid ${T.line}` }}>
                <span style={{ fontSize:12, color:T.ghost, minWidth:20, fontWeight:700 }}>{i+1}.</span>
                <span style={{ fontSize:13, color:T.sub, lineHeight:1.5 }}>{r}</span>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

/* ─── MODE 3: CREATIVE REQUEST ─────────────────────────────── */

// Renders the filled Creative Request in the WMM template format
function CreativeRequestDoc({ cr, onCopy }) {
  const [copied,setCopied]=useState(false);

  function buildText() {
    const { campaignInfo:ci, conversionPoint:cp, context:ctx, formats:fmt,
            staticAngles:sa=[], videoAngles:va=[], carouselAngles:ca=[],
            landingPage:lp, fileNaming:fn } = cr;
    const lines = [];
    const h = (t) => { lines.push(""); lines.push(`## ${t}`); lines.push(""); };
    const f = (l,v) => { if(v) lines.push(`${l}: ${v}`); };

    lines.push("# CREATIVE REQUEST — PAID ADS CAMPAIGN");
    h("1) CAMPAIGN INFO");
    f("Client",ci?.client); f("Campaign Name",ci?.campaignName); f("Date",ci?.dateCreated);
    f("Platform",ci?.platform); f("Objective",ci?.objective); f("Funnel Stage",ci?.funnelStage);
    h("2) CONVERSION POINT");
    f("Type",cp?.type); f("URL",cp?.url); f("Primary CTA",cp?.primaryCTA);
    h("3) CONTEXT");
    f("Audience / ICP",ctx?.icp); f("Campaign Concept",ctx?.concept);
    h("4) FORMATS");
    if(fmt?.static?.length) f("Static",fmt.static.join(", "));
    if(fmt?.video?.length) f("Video",fmt.video.join(", "));
    if(fmt?.carousel?.length) f("Carousel",fmt.carousel.join(", "));
    if(fmt?.gdn?.length) f("GDN",fmt.gdn.join(", "));
    if(sa?.length) {
      h("5) STATIC ADS");
      sa.forEach(a => {
        lines.push(`### ${a.angleNum} [${a.theme}]`);
        lines.push(`COPY IN — Headline: ${a.copyIn?.headline}`);
        if(a.copyIn?.subheadline) lines.push(`Subheadline: ${a.copyIn.subheadline}`);
        if(a.copyIn?.ctaText) lines.push(`CTA on creative: ${a.copyIn.ctaText}`);
        lines.push(`COPY OUT — Primary text: ${a.copyOut?.primaryText}`);
        lines.push(`Headline: ${a.copyOut?.headline}`);
        if(a.copyOut?.description) lines.push(`Description: ${a.copyOut.description}`);
      });
    }
    if(va?.length) {
      h("6) VIDEO ADS");
      va.forEach(a => {
        lines.push(`### ${a.angleNum} [${a.theme}] — ${a.format} ${a.estimatedLength}`);
        lines.push(`Hook: ${a.hook}`);
        a.beats?.forEach(b => lines.push(`Beat ${b.beatNum} | On-screen: ${b.onScreen} | VO: ${b.vo}`));
        lines.push(`Final CTA frame: ${a.finalCTAFrame}`);
        lines.push(`COPY OUT — Primary: ${a.copyOut?.primaryText}`);
        lines.push(`Headline: ${a.copyOut?.headline}`);
        if(a.copyOut?.description) lines.push(`Description: ${a.copyOut.description}`);
      });
    }
    if(lp?.include) {
      h("10) LANDING PAGE");
      f("Conversion Action",lp.conversionAction); f("Primary CTA",lp.primaryCTA);
      lines.push(`HERO — H1: ${lp.hero?.h1}`);
      lines.push(`Sub: ${lp.hero?.sub}`);
      lines.push(`CTA button: ${lp.hero?.cta}`);
      if(lp.hero?.scrollText) lines.push(`Scroll text: ${lp.hero.scrollText}`);
      if(lp.benefits?.length) { lines.push("BENEFITS:"); lp.benefits.forEach(b=>lines.push(`• ${b}`)); }
      if(lp.proof?.type) lines.push(`PROOF — Type: ${lp.proof.type} | ${lp.proof.notes}`);
      lines.push(`FINAL CTA — Line: ${lp.finalCTA?.line} | Button: ${lp.finalCTA?.button}`);
      if(lp.finalCTA?.reassurance) lines.push(`Reassurance: ${lp.finalCTA.reassurance}`);
    }
    if(fn) {
      h("11) FILE NAMING");
      f("Client Code",fn.clientCode); f("Campaign Short",fn.campShort);
      fn.files?.forEach(file=>lines.push(`${file.type}: ${file.name}`));
    }
    return lines.join("\n");
  }

  function copy() {
    navigator.clipboard.writeText(buildText());
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  const { campaignInfo:ci, conversionPoint:cp, context:ctx, formats:fmt,
          staticAngles:sa=[], videoAngles:va=[], landingPage:lp, fileNaming:fn } = cr;

  const Row = ({ label, value, mono }) => value ? (
    <div style={{ display:"flex", gap:0, padding:"7px 0", borderBottom:`1px solid ${T.line}` }}>
      <div style={{ fontSize:12, color:T.ghost, minWidth:160, flexShrink:0 }}>{label}</div>
      <div style={{ fontSize:13, color:T.ink, fontFamily:mono?"monospace":"inherit", lineHeight:1.5 }}>{value}</div>
    </div>
  ) : null;

  const Block = ({ title, children }) => (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.ghost, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12, paddingBottom:6, borderBottom:`2px solid ${T.line}` }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ animation:"fadeIn .2s ease" }}>
      {/* doc header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, paddingBottom:20, borderBottom:`2px solid ${T.ink}` }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.ghost, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Creative Request</div>
          <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{ci?.campaignName || "Campaign"}</div>
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {ci?.platform&&<Pill t={ci.platform} c={T.blue}/>}
            {ci?.objective&&<Pill t={ci.objective} c={T.green}/>}
            {ci?.funnelStage&&<Pill t={ci.funnelStage} c={ci.funnelStage==="Cold"?T.blue:ci.funnelStage==="Warm"?T.amber:T.green}/>}
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={copy}>{copied?"Copied ✓":"Copy as text"}</Btn>
      </div>

      <Block title="1 — Campaign Info">
        <Row label="Client"         value={ci?.client}/>
        <Row label="Campaign Name"  value={ci?.campaignName}/>
        <Row label="Date"           value={ci?.dateCreated}/>
        <Row label="Platform"       value={ci?.platform}/>
        <Row label="Objective"      value={ci?.objective}/>
        <Row label="Funnel Stage"   value={ci?.funnelStage}/>
      </Block>

      <Block title="2 — Conversion Point">
        <Row label="Type"        value={cp?.type}/>
        <Row label="URL"         value={cp?.url}/>
        <Row label="Primary CTA" value={cp?.primaryCTA}/>
      </Block>

      <Block title="3 — Context">
        <Row label="Audience / ICP"   value={ctx?.icp}/>
        <Row label="Campaign Concept" value={ctx?.concept}/>
      </Block>

      <Block title="4 — Formats">
        {fmt?.static?.length>0&&<Row label="Static" value={fmt.static.join("  ·  ")}/>}
        {fmt?.video?.length>0&&<Row label="Video"  value={fmt.video.join("  ·  ")}/>}
        {fmt?.carousel?.length>0&&<Row label="Carousel" value={fmt.carousel.join("  ·  ")}/>}
        {fmt?.gdn?.length>0&&<Row label="GDN Banners" value={fmt.gdn.join("  ·  ")}/>}
      </Block>

      {sa?.length>0&&(
        <Block title="5 — Static Ads">
          {sa.map((a,i)=>(
            <div key={i} style={{ marginBottom:20, background:T.surf, borderRadius:8, padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{a.angleNum}</span>
                <Pill t={a.theme} c={T.blue}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <Lbl c={T.blue}>Copy In (on creative)</Lbl>
                  <Row label="Headline"    value={a.copyIn?.headline}/>
                  <Row label="Subheadline" value={a.copyIn?.subheadline}/>
                  <Row label="CTA text"    value={a.copyIn?.ctaText}/>
                </div>
                <div>
                  <Lbl c={T.green}>Copy Out (platform fields)</Lbl>
                  <Row label="Primary text (150 chars)" value={a.copyOut?.primaryText}/>
                  <Row label="Headline (40 chars)"      value={a.copyOut?.headline}/>
                  <Row label="Description (30 chars)"   value={a.copyOut?.description}/>
                </div>
              </div>
            </div>
          ))}
        </Block>
      )}

      {va?.length>0&&(
        <Block title="6 — Video Ads">
          {va.map((a,i)=>(
            <div key={i} style={{ marginBottom:24, background:T.surf, borderRadius:8, padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{a.angleNum}</span>
                <Pill t={a.theme} c={T.blue}/>
                <Pill t={a.format} c={FMT_C[a.format]||T.blue}/>
                <Pill t={a.estimatedLength} c={T.ghost}/>
              </div>
              {/* hook */}
              <div style={{ padding:"10px 12px", background:T.bg, border:`1px solid ${T.line}`, borderRadius:7, marginBottom:12 }}>
                <Lbl>Hook — First Frame</Lbl>
                <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontStyle:"italic", lineHeight:1.4, marginTop:3 }}>"{a.hook}"</div>
              </div>
              {/* beats */}
              <Lbl>Script Beats</Lbl>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8, marginTop:6, marginBottom:12 }}>
                {a.beats?.map((b,bi)=>(
                  <div key={bi} style={{ background:T.bg, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 11px" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:T.ghost, marginBottom:4 }}>BEAT {b.beatNum}</div>
                    <div style={{ fontSize:11, color:T.ink, marginBottom:4, fontWeight:600 }}>{b.onScreen}</div>
                    <div style={{ fontSize:11, color:T.sub, fontStyle:"italic" }}>{b.vo}</div>
                  </div>
                ))}
              </div>
              <Row label="Final CTA Frame" value={a.finalCTAFrame}/>
              <Hr/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <Lbl c={T.green}>Copy Out (platform fields)</Lbl>
                  <Row label="Primary text (150)" value={a.copyOut?.primaryText}/>
                  <Row label="Headline (40)"      value={a.copyOut?.headline}/>
                  <Row label="Description (30)"   value={a.copyOut?.description}/>
                </div>
              </div>
            </div>
          ))}
        </Block>
      )}

      {lp?.include&&(
        <Block title="10 — Landing Page">
          <Row label="Conversion Action" value={lp.conversionAction}/>
          <Row label="Primary CTA"       value={lp.primaryCTA}/>
          <Hr/>
          <div style={{ marginBottom:12 }}>
            <Lbl>Hero</Lbl>
            <Row label="H1 (main promise)"   value={lp.hero?.h1}/>
            <Row label="Subheadline"          value={lp.hero?.sub}/>
            <Row label="CTA button"           value={lp.hero?.cta}/>
            <Row label="Scroll text"          value={lp.hero?.scrollText}/>
          </div>
          {lp.benefits?.length>0&&(
            <div style={{ marginBottom:12 }}>
              <Lbl>Key Benefits</Lbl>
              {lp.benefits.map((b,i)=><div key={i} style={{ fontSize:13, color:T.sub, padding:"5px 0", borderBottom:`1px solid ${T.line}` }}>• {b}</div>)}
            </div>
          )}
          {lp.proof?.type&&(
            <div style={{ marginBottom:12 }}>
              <Lbl>Proof</Lbl>
              <Row label="Type"  value={lp.proof.type}/>
              <Row label="Notes" value={lp.proof.notes}/>
            </div>
          )}
          <Lbl>Final CTA</Lbl>
          <Row label="CTA line"    value={lp.finalCTA?.line}/>
          <Row label="Button text" value={lp.finalCTA?.button}/>
          <Row label="Reassurance" value={lp.finalCTA?.reassurance}/>
        </Block>
      )}

      {fn&&(
        <Block title="11 — File Naming">
          <Row label="Client Code"    value={fn.clientCode} mono/>
          <Row label="Campaign Short" value={fn.campShort}  mono/>
          <Hr/>
          {fn.files?.map((file,i)=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:`1px solid ${T.line}` }}>
              <Pill t={file.type} c={T.ghost}/>
              <code style={{ fontSize:12, color:T.ink, fontFamily:"monospace" }}>{file.name}</code>
            </div>
          ))}
        </Block>
      )}
    </div>
  );
}

function CreativeRequestMode({ strategyData }) {
  // source: "strategy" = pull from strategy data, "manual" = manual input
  const [source, setSource] = useState(strategyData ? "strategy" : "manual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // form state for manual / overrides
  const [form, setForm] = useState({
    client: strategyData?.core?.brand || "",
    campaignName: "",
    platform: "Meta",
    objective: "Leads",
    funnelStage: "Cold",
    conversionType: "Landing Page",
    conversionUrl: "",
    primaryCTA: "",
    icp: "",
    concept: "",
    includeStatic: true,
    includeVideo: true,
    includeCarousel: false,
    includeLandingPage: true,
    clientCode: "",
    campShort: "",
    angles: strategyData?.tact?.ads ? strategyData.tact.ads.map(a=>a.id).join(", ") : "",
    extraNotes: "",
  });
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  // selected angles from strategy
  const [selectedAngles, setSelectedAngles] = useState(
    strategyData?.core?.angles?.slice(0,3).map(a=>a.id) || []
  );
  const toggleAngle = (id) => setSelectedAngles(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  async function generate() {
    setLoading(true); setResult(null);
    try {
      let context = "";

      if (source === "strategy" && strategyData?.core) {
        const chosen = strategyData.core.angles.filter(a => selectedAngles.includes(a.id));
        const chosenAds = strategyData.tact?.ads?.filter(a => selectedAngles.includes(a.angleId)) || [];
        context = `
CAMPAIGN DETAILS:
Client: ${form.client}
Campaign name: ${form.campaignName || form.client + " — " + form.objective}
Platform: ${form.platform}
Objective: ${form.objective}
Funnel stage: ${form.funnelStage}
Conversion type: ${form.conversionType}
Conversion URL: ${form.conversionUrl || "TBD"}
Primary CTA: ${form.primaryCTA}
Client code: ${form.clientCode}
Campaign short code: ${form.campShort}

STRATEGY DATA (from WMM Strategy Engine):
Brand: ${strategyData.core.brand}
Value proposition: ${strategyData.core.valueProposition}
ICP: ${form.icp || "Extracted from brief"}

SELECTED ANGLES:
${JSON.stringify(chosen, null, 2)}

AD CONCEPTS FOR THESE ANGLES:
${JSON.stringify(chosenAds, null, 2)}

LP STRATEGY:
${strategyData.tact?.lp ? JSON.stringify(strategyData.tact.lp, null, 2) : "Not available"}

FORMATS REQUESTED:
Static: ${form.includeStatic}
Video: ${form.includeVideo}
Carousel: ${form.includeCarousel}
Landing page: ${form.includeLandingPage}

EXTRA NOTES: ${form.extraNotes || "none"}
`;
      } else {
        context = `
CAMPAIGN DETAILS:
Client: ${form.client}
Campaign name: ${form.campaignName}
Platform: ${form.platform}
Objective: ${form.objective}
Funnel stage: ${form.funnelStage}
Conversion type: ${form.conversionType}
Conversion URL: ${form.conversionUrl}
Primary CTA: ${form.primaryCTA}
ICP / Audience: ${form.icp}
Campaign concept: ${form.concept}
Client code: ${form.clientCode}
Campaign short code: ${form.campShort}

FORMATS: Static: ${form.includeStatic}, Video: ${form.includeVideo}, Carousel: ${form.includeCarousel}, LP: ${form.includeLandingPage}

ANGLES / CONTEXT: ${form.angles}
EXTRA NOTES: ${form.extraNotes}
`;
      }

      const raw = await ask(P.creativeRequest, context);
      setResult(parseJSON(raw));
    } finally { setLoading(false); }
  }

  const Check = ({ label, checked, onChange }) => (
    <label style={{ display:"flex", gap:8, alignItems:"center", cursor:"pointer", fontSize:13, color:T.ink }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ width:14, height:14, cursor:"pointer" }}/>
      {label}
    </label>
  );

  return (
    <div style={{ maxWidth:900, padding:"0 24px" }}>

      {/* source toggle */}
      {strategyData && (
        <div style={{ display:"flex", gap:0, marginBottom:24, border:`1px solid ${T.line}`, borderRadius:8, overflow:"hidden", width:"fit-content" }}>
          {[["strategy","Use strategy data"],["manual","Manual input"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSource(v)} style={{
              padding:"7px 16px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
              background:source===v?T.ink:"none", color:source===v?"#fff":T.sub, fontFamily:"inherit",
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* if using strategy: show angle picker */}
      {source==="strategy" && strategyData?.core?.angles && (
        <div style={{ marginBottom:24, padding:"14px 16px", background:T.surf, borderRadius:8, border:`1px solid ${T.line}` }}>
          <Lbl>Select angles to include in this request</Lbl>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
            {strategyData.core.angles.map(a=>(
              <label key={a.id} style={{ display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer", padding:"6px 0", borderBottom:`1px solid ${T.line}` }}>
                <input type="checkbox" checked={selectedAngles.includes(a.id)} onChange={()=>toggleAngle(a.id)} style={{ marginTop:2, cursor:"pointer" }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{String(a.id).padStart(2,"0")} {a.name}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{a.proposition}</div>
                  <div style={{ display:"flex", gap:4, marginTop:3 }}>
                    <Pill t={a.funnel} c={FC[a.funnel]||T.blue}/>
                    {a.formats?.map((f,i)=><Pill key={i} t={f} c={T.ghost}/>)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* form */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Campaign Info</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <Input label="Client" value={form.client} onChange={v=>setF("client",v)} placeholder="NeoBuild"/>
            <Input label="Campaign Name" value={form.campaignName} onChange={v=>setF("campaignName",v)} placeholder="NB — TOF Guarantee Angle"/>
            <Select label="Platform" value={form.platform} onChange={v=>setF("platform",v)} options={["Meta","Google","Meta + Google"]}/>
            <Select label="Objective" value={form.objective} onChange={v=>setF("objective",v)} options={["Leads","Sales","Traffic","Awareness","Retargeting"]}/>
            <Select label="Funnel Stage" value={form.funnelStage} onChange={v=>setF("funnelStage",v)} options={["Cold","Warm","Hot"]}/>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Conversion & Context</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <Select label="Conversion Type" value={form.conversionType} onChange={v=>setF("conversionType",v)} options={["Landing Page","Lead Form","Call","Booking","Checkout"]}/>
            <Input label="Conversion URL" value={form.conversionUrl} onChange={v=>setF("conversionUrl",v)} placeholder="https://..."/>
            <Input label="Primary CTA" value={form.primaryCTA} onChange={v=>setF("primaryCTA",v)} placeholder="Book your free 3D design"/>
            {source==="manual"&&<Textarea label="Audience / ICP" value={form.icp} onChange={v=>setF("icp",v)} placeholder="Homeowners 40-60yo, HHI $200K+…" rows={2}/>}
            {source==="manual"&&<Textarea label="Campaign Concept" value={form.concept} onChange={v=>setF("concept",v)} placeholder="Big idea in 1-3 lines" rows={2}/>}
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Deliverables & Naming</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <div>
              <Lbl>Formats to include</Lbl>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:4 }}>
                <Check label="Static Ads"    checked={form.includeStatic}      onChange={v=>setF("includeStatic",v)}/>
                <Check label="Video Ads"     checked={form.includeVideo}       onChange={v=>setF("includeVideo",v)}/>
                <Check label="Carousel"      checked={form.includeCarousel}    onChange={v=>setF("includeCarousel",v)}/>
                <Check label="Landing Page"  checked={form.includeLandingPage} onChange={v=>setF("includeLandingPage",v)}/>
              </div>
            </div>
            <Input label="Client Code" value={form.clientCode} onChange={v=>setF("clientCode",v)} placeholder="NBD"/>
            <Input label="Campaign Short" value={form.campShort} onChange={v=>setF("campShort",v)} placeholder="TOF-Guarantee"/>
            {source==="manual"&&<Textarea label="Angles / context" value={form.angles} onChange={v=>setF("angles",v)} placeholder="Angle 1: Free 3D design — UGC 30s TOF…" rows={3}/>}
            <Textarea label="Extra notes" value={form.extraNotes} onChange={v=>setF("extraNotes",v)} placeholder="Reference style, compliance notes, deadlines…" rows={2}/>
          </div>
          <div style={{ marginTop:12 }}>
            <Btn onClick={generate} disabled={!form.client||loading}>{loading?"Generating request…":"Generate Creative Request →"}</Btn>
          </div>
        </div>
      </div>

      {loading&&<div style={{ display:"flex",gap:8,alignItems:"center",color:T.sub,fontSize:13,marginTop:8 }}><Spin/>Building creative request…</div>}
      {result&&<CreativeRequestDoc cr={result}/>}
    </div>
  );
}

/* ─── MODE 4: EMAIL FLOWS ──────────────────────────────────── */

const FLOW_TYPES = [
  { id:"lead-nurture",    label:"Lead Nurture",       desc:"New lead → booking",          icon:"📥", trigger:"New lead enters CRM (form submission / ad lead form)" },
  { id:"pre-call",        label:"Pre-Call",            desc:"Booking confirmed → show",    icon:"📅", trigger:"Call / meeting booked in GHL" },
  { id:"no-show",         label:"No-Show Recovery",   desc:"No-show → rebook",            icon:"👻", trigger:"Lead marked No-Show in GHL pipeline" },
  { id:"sales-followup",  label:"Sales Follow-Up",    desc:"Call done, not closed → close",icon:"📞", trigger:"Call completed, lead not won (pipeline stage)" },
  { id:"reactivation",    label:"Lead Reactivation",  desc:"Cold leads +30d → re-engage", icon:"🔁", trigger:"Lead inactive for 30+ days, no activity" },
  { id:"onboarding",      label:"Client Onboarding",  desc:"Closed → reduce churn",       icon:"🎉", trigger:"Deal marked Won / client tag added in GHL" },
  { id:"custom",          label:"Custom Flow",         desc:"Define your own",             icon:"⚙️", trigger:"" },
];

// Visual flow diagram — horizontal steps with connectors
function FlowDiagram({ steps }) {
  const typeColor = { email:T.blue, sms:T.green, wait:T.ghost, condition:T.amber, action:T.violet };
  const typeLabel = { email:"Email", sms:"SMS", wait:"Wait", condition:"Branch", action:"GHL Action" };
  const typeIcon  = { email:"✉", sms:"💬", wait:"⏱", condition:"⑂", action:"⚡" };

  return (
    <div style={{ overflowX:"auto", paddingBottom:8, marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:0, minWidth: steps.length * 180 }}>
        {steps.map((s, i) => {
          const c = typeColor[s.type] || T.ghost;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} style={{ display:"flex", alignItems:"flex-start" }}>
              {/* step card */}
              <div style={{ width:160, flexShrink:0 }}>
                {/* type badge */}
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:c+"15", border:`1px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:c, fontWeight:700 }}>
                    {typeIcon[s.type]}
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:c, textTransform:"uppercase", letterSpacing:"0.06em" }}>{typeLabel[s.type]}</div>
                    <div style={{ fontSize:9, color:T.ghost }}>Step {s.stepNum}</div>
                  </div>
                </div>
                {/* card body */}
                <div style={{ background:T.surf, border:`1px solid ${c}20`, borderRadius:7, padding:"9px 10px" }}>
                  {s.waitDelay && s.type === "wait" && (
                    <div style={{ fontSize:12, fontWeight:600, color:T.ink }}>{s.waitDelay}</div>
                  )}
                  {s.type === "email" && s.email && (
                    <>
                      <div style={{ fontSize:11, fontWeight:600, color:T.ink, lineHeight:1.3, marginBottom:3 }}>{s.email.subjectLine}</div>
                      <div style={{ fontSize:10, color:T.sub, lineHeight:1.3 }}>{s.email.previewText}</div>
                      <Pill t={s.email.tone} c={c} />
                    </>
                  )}
                  {s.type === "sms" && s.sms && (
                    <div style={{ fontSize:11, color:T.ink, lineHeight:1.4 }}>{s.sms.message?.slice(0,80)}{s.sms.message?.length>80?"…":""}</div>
                  )}
                  {s.type === "condition" && (
                    <div style={{ fontSize:11, color:T.amber, lineHeight:1.4 }}>{s.conditionLogic}</div>
                  )}
                  {s.type === "action" && (
                    <div style={{ fontSize:11, color:T.violet, lineHeight:1.4 }}>{s.ghlAction}</div>
                  )}
                  {s.purpose && (
                    <div style={{ fontSize:10, color:T.ghost, marginTop:5, borderTop:`1px solid ${T.line}`, paddingTop:4, lineHeight:1.3 }}>{s.purpose}</div>
                  )}
                </div>
              </div>
              {/* connector */}
              {!isLast && (
                <div style={{ display:"flex", alignItems:"center", width:20, paddingTop:14, flexShrink:0 }}>
                  <div style={{ width:12, height:1, background:T.lined }} />
                  <span style={{ fontSize:7, color:T.ghost }}>▶</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Full email body display
function EmailCard({ step }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!step.email) return null;
  const e = step.email;

  function copy() {
    const text = `SUBJECT: ${e.subjectLine}\nPREVIEW: ${e.previewText}\n\n${e.body}\n\nCTA: ${e.ctaText}`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
      {/* header — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", gap:12, alignItems:"center", padding:"11px 14px", cursor:"pointer", background:open?T.surf:T.bg }}
      >
        <div style={{ width:22, height:22, borderRadius:"50%", background:T.blue+"12", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:T.blue, fontWeight:700, flexShrink:0 }}>
          {step.stepNum}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {e.subjectLine}
          </div>
          <div style={{ fontSize:11, color:T.ghost, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {e.previewText}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {step.waitDelay && <Pill t={step.waitDelay} c={T.ghost} />}
          <Pill t={e.tone} c={T.blue} />
          <span style={{ fontSize:11, color:T.ghost }}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {/* expanded body */}
      {open && (
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${T.line}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <Lbl>Purpose</Lbl>
              <div style={{ fontSize:12, color:T.sub }}>{step.purpose}</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={copy}>{copied?"Copied ✓":"Copy email"}</Btn>
          </div>
          {/* email preview */}
          <div style={{ background:T.surf, border:`1px solid ${T.line}`, borderRadius:8, padding:"16px 18px", fontFamily:"Georgia,serif" }}>
            <div style={{ fontSize:11, color:T.ghost, marginBottom:12, fontFamily:"inherit" }}>
              <span style={{ fontWeight:600, color:T.ink }}>Subject: </span>{e.subjectLine}<br/>
              <span style={{ fontWeight:600, color:T.ink }}>Preview: </span>{e.previewText}
            </div>
            <div style={{ height:1, background:T.line, marginBottom:14 }} />
            <div style={{ fontSize:14, color:T.ink, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{e.body}</div>
            {e.ctaText && (
              <div style={{ marginTop:20, textAlign:"center" }}>
                <div style={{ display:"inline-block", background:T.ink, color:"#fff", padding:"11px 28px", borderRadius:7, fontSize:13, fontWeight:600, fontFamily:"Inter,sans-serif" }}>
                  {e.ctaText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// SMS card
function SMSCard({ step }) {
  const [copied, setCopied] = useState(false);
  if (!step.sms) return null;
  function copy() {
    navigator.clipboard.writeText(step.sms.message);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ border:`1px solid ${T.green}25`, borderRadius:8, padding:"11px 14px", marginBottom:8, background:T.green+"04" }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ width:22, height:22, borderRadius:"50%", background:T.green+"12", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:T.green, fontWeight:700, flexShrink:0 }}>
          {step.stepNum}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
            <Pill t="SMS" c={T.green} />
            {step.waitDelay && <Pill t={step.waitDelay} c={T.ghost} />}
          </div>
          <div style={{ fontSize:13, color:T.ink, lineHeight:1.6, background:T.bg, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 12px", fontFamily:"monospace" }}>
            {step.sms.message}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
            <div style={{ fontSize:11, color:T.ghost }}>{step.purpose}</div>
            <Btn size="sm" variant="ghost" onClick={copy}>{copied?"Copied ✓":"Copy SMS"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// Non-email/sms step (wait, condition, action)
function StepCard({ step }) {
  const typeColor = { wait:T.ghost, condition:T.amber, action:T.violet };
  const c = typeColor[step.type] || T.ghost;
  return (
    <div style={{ border:`1px solid ${c}20`, borderRadius:8, padding:"10px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
      <div style={{ width:22, height:22, borderRadius:"50%", background:c+"12", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:c, fontWeight:700, flexShrink:0 }}>
        {step.stepNum}
      </div>
      <div>
        <div style={{ display:"flex", gap:6, marginBottom:4 }}>
          <Pill t={step.type.toUpperCase()} c={c} />
          {step.waitDelay && step.type==="wait" && <Pill t={step.waitDelay} c={T.ghost} />}
        </div>
        {step.conditionLogic && <div style={{ fontSize:12, color:T.amber }}>{step.conditionLogic}</div>}
        {step.ghlAction      && <div style={{ fontSize:12, color:T.violet }}>{step.ghlAction}</div>}
        {step.purpose        && <div style={{ fontSize:11, color:T.ghost, marginTop:3 }}>{step.purpose}</div>}
      </div>
    </div>
  );
}

function EmailFlowsMode({ strategyData }) {
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    client:"", brand:"", icp:"", offer:"", valueProposition:"",
    customTrigger:"", objective:"", tone:"warm and professional",
    includeEmail:true, includeSMS:true, emailCount:"5", smsCount:"3",
    extraContext:"",
  });
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-fill from strategy data if available
  useEffect(() => {
    if (strategyData?.core) {
      setF("brand", strategyData.core.brand || "");
      setF("valueProposition", strategyData.core.valueProposition || "");
      setF("icp", strategyData.core.angles?.[0]?.proposition ? `ICP from strategy: ${strategyData.core.valueProposition}` : "");
      setF("offer", strategyData.core.tagline || "");
    }
  }, [strategyData]);

  const flowType = FLOW_TYPES.find(f => f.id === selectedType);

  async function generate() {
    setLoading(true); setResult(null);
    try {
      const context = `
FLOW TYPE: ${flowType?.label || "Custom"}
TRIGGER: ${flowType?.id === "custom" ? form.customTrigger : flowType?.trigger}
OBJECTIVE: ${form.objective || flowType?.desc}

BRAND/CLIENT: ${form.brand || form.client}
OFFER: ${form.offer}
VALUE PROPOSITION: ${form.valueProposition}
ICP / AUDIENCE: ${form.icp}
TONE: ${form.tone}

FORMATS:
- Emails: ${form.includeEmail ? `Yes, ~${form.emailCount} emails` : "No"}
- SMS: ${form.includeSMS ? `Yes, ~${form.smsCount} SMS` : "No"}

${strategyData?.core ? `STRATEGY CONTEXT:
Angles: ${strategyData.core.angles?.slice(0,3).map(a => a.name).join(", ")}
Saturation gaps: ${strategyData.core.gaps?.slice(0,2).map(g => g.gap).join(", ")}
` : ""}
EXTRA CONTEXT / NOTES: ${form.extraContext || "none"}

Generate a complete, production-ready automation flow for GoHighLevel (GHL).
Each email must be fully written — subject, preview, full body copy, CTA.
Each SMS must be complete 160-char message.
Include wait delays, conditions, and GHL pipeline actions.
Use [FIRST NAME] and [BRAND] as personalization tokens.
`;
      const raw = await ask(P.emailFlow, context);
      setResult(parseJSON(raw));
    } finally { setLoading(false); }
  }

  function copyAllText() {
    if (!result) return;
    const lines = [
      `EMAIL FLOW: ${result.flowName}`,
      `Trigger: ${result.trigger}`,
      `Objective: ${result.objective}`,
      `Duration: ${result.totalDuration}`,
      ``,
      result.summary,
      ``,
      `─── STEPS ───`,
      ...(result.steps || []).flatMap(s => {
        const out = [``, `[STEP ${s.stepNum}] ${s.type.toUpperCase()} — ${s.waitDelay || ""}`];
        if (s.type === "email" && s.email) {
          out.push(`Subject: ${s.email.subjectLine}`);
          out.push(`Preview: ${s.email.previewText}`);
          out.push(``, s.email.body, ``, `CTA: ${s.email.ctaText}`);
        }
        if (s.type === "sms" && s.sms) out.push(`SMS: ${s.sms.message}`);
        if (s.conditionLogic) out.push(`Condition: ${s.conditionLogic}`);
        if (s.ghlAction) out.push(`GHL Action: ${s.ghlAction}`);
        if (s.purpose) out.push(`Purpose: ${s.purpose}`);
        return out;
      }),
      ``, `─── GHL SETUP ───`,
      ...(result.ghlSetupNotes || []).map((n,i) => `${i+1}. ${n}`),
      ``, `Tags needed: ${(result.tagsNeeded||[]).join(", ")}`,
      `Pipeline stages: ${(result.pipelineStages||[]).join(", ")}`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // Step 1: pick flow type
  if (!selectedType) return (
    <div style={{ maxWidth:900, padding:"0 24px" }}>
      <div style={{ fontSize:13, color:T.sub, lineHeight:1.6, marginBottom:20 }}>
        Select the automation trigger. Each flow maps to a specific moment in the GHL pipeline.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
        {FLOW_TYPES.map(ft => (
          <button key={ft.id} onClick={() => setSelectedType(ft.id)} style={{
            background:T.bg, border:`1px solid ${T.line}`, borderRadius:9,
            padding:"14px 16px", textAlign:"left", cursor:"pointer", fontFamily:"inherit",
            transition:"border-color .15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.lined}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.line}
          >
            <div style={{ fontSize:18, marginBottom:6 }}>{ft.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:3 }}>{ft.label}</div>
            <div style={{ fontSize:12, color:T.sub, marginBottom:8 }}>{ft.desc}</div>
            <div style={{ fontSize:11, color:T.ghost, lineHeight:1.4 }}>{ft.trigger}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: configure + generate
  if (!result && !loading) return (
    <div style={{ maxWidth:900, padding:"0 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <button onClick={() => setSelectedType(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:T.sub, fontFamily:"inherit", padding:0 }}>← Back</button>
        <div style={{ fontSize:18 }}>{flowType?.icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.ink }}>{flowType?.label}</div>
          <div style={{ fontSize:12, color:T.ghost }}>{flowType?.trigger}</div>
        </div>
        {strategyData && <Pill t="Strategy data loaded" c={T.green} />}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
        {/* col 1 — brand */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Brand Context</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <Input label="Client / Brand" value={form.brand} onChange={v=>setF("brand",v)} placeholder="NeoBuild"/>
            <Textarea label="Offer / Product" value={form.offer} onChange={v=>setF("offer",v)} placeholder="Premium outdoor remodeling — patios, decks, pergolas" rows={2}/>
            <Textarea label="Value Proposition" value={form.valueProposition} onChange={v=>setF("valueProposition",v)} placeholder="Free 3D design before you commit + 10-year guarantee" rows={2}/>
            <Textarea label="ICP / Target Audience" value={form.icp} onChange={v=>setF("icp",v)} placeholder="Homeowners 40-60, HHI $200K+, South Florida, considering renovation" rows={2}/>
          </div>
        </div>

        {/* col 2 — flow config */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Flow Config</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {selectedType === "custom" && (
              <Textarea label="Custom Trigger" value={form.customTrigger} onChange={v=>setF("customTrigger",v)} placeholder="Describe the trigger event in GHL…" rows={2}/>
            )}
            <Textarea label="Objective" value={form.objective} onChange={v=>setF("objective",v)} placeholder={flowType?.desc} rows={2}/>
            <Select label="Tone" value={form.tone} onChange={v=>setF("tone",v)} options={["warm and professional","urgent and direct","educational and helpful","conversational","formal"]}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Input label="No. of Emails" value={form.emailCount} onChange={v=>setF("emailCount",v)} type="number" placeholder="5"/>
              <Input label="No. of SMS" value={form.smsCount} onChange={v=>setF("smsCount",v)} type="number" placeholder="3"/>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:2 }}>
              {[["includeEmail","Include emails"],["includeSMS","Include SMS"]].map(([k,l]) => (
                <label key={k} style={{ display:"flex", gap:7, alignItems:"center", cursor:"pointer", fontSize:13, color:T.ink }}>
                  <input type="checkbox" checked={form[k]} onChange={e=>setF(k,e.target.checked)} style={{ width:14, height:14 }}/>
                  {l}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* col 3 — extra */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.05em" }}>Extra Notes</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <Textarea label="Additional context / constraints" value={form.extraContext} onChange={v=>setF("extraContext",v)} placeholder="Specific offers, deadlines, compliance notes, brand voice examples…" rows={6}/>
          </div>
          <div style={{ marginTop:12 }}>
            <Btn onClick={generate} disabled={!form.brand || loading}>Generate Flow →</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ maxWidth:640, padding:"0 24px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", color:T.sub, fontSize:13 }}>
        <Spin />Writing your {flowType?.label} flow…
      </div>
    </div>
  );

  // Step 3: results
  const emails     = result.steps?.filter(s => s.type === "email") || [];
  const smsList    = result.steps?.filter(s => s.type === "sms")   || [];
  const otherSteps = result.steps?.filter(s => !["email","sms"].includes(s.type)) || [];

  return (
    <div style={{ maxWidth:900, padding:"0 24px", animation:"fadeIn .2s ease" }}>
      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, paddingBottom:18, borderBottom:`2px solid ${T.ink}` }}>
        <div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:18 }}>{flowType?.icon}</span>
            <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{result.flowName}</div>
          </div>
          <div style={{ fontSize:13, color:T.sub, lineHeight:1.6, maxWidth:560, marginBottom:8 }}>{result.summary}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Pill t={`Trigger: ${result.trigger}`} c={T.ghost}/>
            <Pill t={result.totalDuration} c={T.blue}/>
            <Pill t={`${emails.length} emails`} c={T.blue}/>
            {smsList.length > 0 && <Pill t={`${smsList.length} SMS`} c={T.green}/>}
            <Pill t={`${result.steps?.length} total steps`} c={T.ghost}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn size="sm" variant="ghost" onClick={() => { setResult(null); }}>Edit</Btn>
          <Btn size="sm" variant="ghost" onClick={copyAllText}>{copied?"Copied ✓":"Copy all"}</Btn>
          <Btn size="sm" variant="ghost" onClick={() => setSelectedType(null)}>New flow</Btn>
        </div>
      </div>

      {/* visual diagram */}
      <Section title="Automation Diagram" topBorder={false}>
        <FlowDiagram steps={result.steps || []} />
      </Section>

      {/* emails */}
      {emails.length > 0 && (
        <Section title="Emails" count={emails.length}>
          <div style={{ fontSize:12, color:T.ghost, marginBottom:12 }}>Click any email to expand the full body copy.</div>
          {result.steps?.filter(s => s.type === "email").map((s,i) => (
            <EmailCard key={i} step={s} />
          ))}
        </Section>
      )}

      {/* SMS */}
      {smsList.length > 0 && (
        <Section title="SMS" count={smsList.length}>
          {result.steps?.filter(s => s.type === "sms").map((s,i) => (
            <SMSCard key={i} step={s} />
          ))}
        </Section>
      )}

      {/* wait / condition / action steps */}
      {otherSteps.length > 0 && (
        <Section title="Waits, Conditions & GHL Actions" count={otherSteps.length}>
          {otherSteps.map((s,i) => <StepCard key={i} step={s} />)}
        </Section>
      )}

      {/* GHL setup */}
      <Section title="GHL Setup Notes">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <Lbl>Setup Checklist</Lbl>
            {result.ghlSetupNotes?.map((n,i) => (
              <div key={i} style={{ fontSize:12, color:T.sub, padding:"5px 0", borderBottom:`1px solid ${T.line}`, lineHeight:1.5 }}>
                {i+1}. {n}
              </div>
            ))}
          </div>
          <div>
            <div style={{ marginBottom:14 }}>
              <Lbl>Tags to Create</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
                {result.tagsNeeded?.map((t,i) => <Pill key={i} t={t} c={T.violet}/>)}
              </div>
            </div>
            <div>
              <Lbl>Pipeline Stages</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
                {result.pipelineStages?.map((s,i) => <Pill key={i} t={s} c={T.amber}/>)}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ─── ROOT APP ─────────────────────────────────────────────── */
/* ─── MODE 5: ATTRACTION MATRIX (Byung-Chul Han) ──────────── */

const DIMENSIONS = [
  {
    id:    "tension",
    name:  "Curiosity Gap",
    icon:  "◎",
    tagline: "Does it make them need to keep reading?",
    desc:  "A great creative withholds just enough to create an open loop. When you show everything — price, product, process — upfront, there's no reason to click. The hook needs to open a question the reader can't ignore.",
    ads:   "Does the hook create a question without answering it? Does the ad tease the result without revealing the method?",
    web:   "Does the hero make a promise the page then slowly delivers on? Is there a reason to scroll?",
    email: "Does the subject line feel incomplete without opening the email?",
    low:   "Everything is visible at once. No open loop, no reason to click, no tension.",
    high:  "Opens a gap the reader has to close. They click because they have to know.",
    color: "#2563EB",
  },
  {
    id:    "gravity",
    name:  "Desire Pull",
    icon:  "◈",
    tagline: "Does it pull them toward a better version of their life?",
    desc:  "There's a difference between an ad that shocks or interrupts and one that genuinely attracts. Fake urgency, cheap curiosity, and loud visuals get a reaction. A desirable world — one the reader wants to belong to — creates real pull.",
    ads:   "Does the ad paint a world the reader wants to live in? Or does it just interrupt their scroll?",
    web:   "Does the page feel aspirational? Would the reader want to be the person on this page?",
    email: "Does the email make them feel like they're missing out on something real?",
    low:   "Startling but not attractive. Loud, urgent, clickbait. Gets attention but not desire.",
    high:  "Builds a world the reader wants to enter. The offer feels like an invitation, not a sales pitch.",
    color: "#7C3AED",
  },
  {
    id:    "lightness",
    name:  "Clarity",
    icon:  "◇",
    tagline: "Can they understand it in 3 seconds?",
    desc:  "People scrolling social media, reading emails, or landing on your page are already tired. Overloaded creatives — 5 bullets, 3 CTAs, 4 different value props — lose people before the message lands. One clear idea converts better than five good ones.",
    ads:   "What is the single idea this ad communicates? Can someone grasp it in 3 seconds?",
    web:   "Is there one obvious next step on this page? Does every section serve the same goal?",
    email: "Does this email ask for one action? Is the body copy easy to skim?",
    low:   "Too many ideas competing for attention. Readers feel overwhelmed and bounce.",
    high:  "One idea, one action, one promise. The message is impossible to misunderstand.",
    color: "#059669",
  },
  {
    id:    "ritual",
    name:  "Timing Fit",
    icon:  "◷",
    tagline: "Is the ask right for where they are in the decision?",
    desc:  "Every buyer goes through a mental process before they commit — from unaware to ready. When you push too hard, too fast — \"Buy now!\", \"Limited time!\" — on a cold audience, they resist. Matching the ask to the actual readiness of the reader dramatically increases conversion.",
    ads:   "Is this ad asking for a commitment that matches the audience's temperature? TOF should educate, not close.",
    web:   "Does the page sequence move from awareness → interest → desire → action, or does it jump straight to the close?",
    email: "Is the email in the sequence appropriate for where the lead is right now?",
    low:   "Asks for too much too soon. False urgency. Pushes cold audiences to buy before they're ready.",
    high:  "The ask feels natural for the moment. The reader thinks \"yes, this is the right next step.\"",
    color: "#D97706",
  },
  {
    id:    "otherness",
    name:  "Human Proof",
    icon:  "◉",
    tagline: "Does a real person show up — or just a brand?",
    desc:  "Generic testimonials, stock photos, and brand-speak all sound the same. Real proof is specific: a name, a number, a detail that only a real customer could give. The more generic the voice, the less believable. The more specific and human, the more it converts.",
    ads:   "Is there a real person with a distinct voice? Could this testimonial belong to any brand?",
    web:   "Do the testimonials have specificity — real names, photos, exact results, unique details?",
    email: "Does this email sound like it was written by a human to a human, or like it came from a marketing team?",
    low:   "Generic brand voice, stock imagery, templated testimonials. Could be anyone.",
    high:  "A specific, real, irreplaceable human voice. Details that only a real customer could give.",
    color: "#DC2626",
  },
];

const ATTRACT_PROMPT = `You are a senior performance marketing analyst and creative strategist. You evaluate ad copy, landing pages, and emails across 5 conversion dimensions that predict whether a creative will actually attract and convert — not just get attention.

The 5 dimensions:
1. Curiosity Gap — Does it create an open loop that pulls them in? Or does it expose everything at once?
2. Desire Pull — Does it build a world they want to belong to? Or does it just interrupt/shock?
3. Clarity — Is there one clear idea and one clear action? Or is it overloaded?
4. Timing Fit — Does the ask match where the audience is in their decision process? Or does it push too hard too soon?
5. Human Proof — Does a real, specific person show up? Or is it generic brand language?

Return ONLY valid JSON, no markdown:
{
  "subject": "short label of what was analyzed (e.g. 'TOF Meta Ad — Outdoor Remodeling')",
  "channel": "ad|web|email",
  "overallScore": 0,
  "verdict": "2 plain-English sentences that sum up the main conversion problem with this creative",
  "dimensions": [
    {
      "id": "tension|gravity|lightness|ritual|otherness",
      "score": 1,
      "diagnosis": "2-3 plain sentences explaining the specific problem in this creative for this dimension. No jargon.",
      "evidence": "exact quote or element from the creative that reveals this problem",
      "recommendation": "one specific, actionable change — what to rewrite or add"
    }
  ],
  "changes": [
    {
      "priority": 1,
      "element": "Hook|Headline|Body|CTA|Subject Line|Preview Text|Social Proof|Offer Framing|Visual Direction",
      "dimension": "tension|gravity|lightness|ritual|otherness",
      "impact": "HIGH|MEDIUM|LOW",
      "before": "exact original text from the creative",
      "after": "rewritten version that fixes the issue",
      "why": "one sentence — the specific conversion reason this change works better"
    }
  ],
  "rewrite": {
    "hook": "complete rewritten hook / opening that fixes the top 3 issues",
    "body": "rewritten body copy (2-4 sentences) that is clearer, more human, and better timed",
    "cta": "rewritten CTA that matches the audience temperature",
    "rationale": "2 plain sentences — what specific conversion problems this rewrite fixes"
  },
  "insightQuote": "one sentence that captures the core insight about why this creative underperforms — written as a principle a media buyer would remember",
  "archetype": "Overexposed|All Noise No Pull|Information Overload|Premature Close|Brand Voice",
  "archetypeDesc": "one sentence in plain English explaining why this creative fits this pattern"
}

Score 1-5 where:
1 = Actively hurts conversion on this dimension
2 = Weak — mostly misses
3 = Partial — some elements work
4 = Strong — mostly gets it right
5 = Excellent — this dimension is a real strength

Generate 4-6 prioritized changes, ordered by impact (HIGH first).
Be direct and specific. Use the language of a media buyer reviewing creative, not an academic.
The "before" must be the exact original wording.`;

// Radar chart using SVG
function RadarChart({ scores, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = scores.length;
  const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const point = (i, val) => {
    const ratio = val / 5;
    return {
      x: cx + r * ratio * Math.cos(angle(i)),
      y: cy + r * ratio * Math.sin(angle(i)),
    };
  };
  const gridLevels = [1,2,3,4,5];
  const colors = DIMENSIONS.map(d => d.color);
  const labels = DIMENSIONS.map(d => d.name);

  const scorePoints = scores.map((v, i) => point(i, v));
  const polyStr = scorePoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} style={{ display:"block" }}>
      {/* grid */}
      {gridLevels.map(level => {
        const pts = Array.from({length:n}, (_,i) => point(i, level));
        return (
          <polygon key={level}
            points={pts.map(p=>`${p.x},${p.y}`).join(" ")}
            fill="none" stroke={T.line} strokeWidth="1"
          />
        );
      })}
      {/* axes */}
      {Array.from({length:n}, (_,i) => {
        const outer = point(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke={T.line} strokeWidth="1"/>;
      })}
      {/* filled area */}
      <polygon points={polyStr} fill={T.ink+"10"} stroke={T.ink} strokeWidth="1.5" strokeLinejoin="round"/>
      {/* dots */}
      {scorePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors[i]} stroke="white" strokeWidth="1.5"/>
      ))}
      {/* labels */}
      {Array.from({length:n}, (_,i) => {
        const lp = point(i, 5.8);
        return (
          <text key={i} x={lp.x} y={lp.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="700" fill={colors[i]}
            fontFamily="Inter,sans-serif"
          >{labels[i]}</text>
        );
      })}
    </svg>
  );
}

// Score bar
function ScoreBar({ score, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:4, background:T.line, borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${(score/5)*100}%`, height:"100%", background:color, borderRadius:2, transition:"width .4s ease" }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color, minWidth:14, fontFamily:"monospace" }}>{score}</span>
    </div>
  );
}

// Archetype badge
const ARCHETYPE_C = {
  "Overexposed":          T.blue,
  "All Noise No Pull":    T.red,
  "Information Overload": T.amber,
  "Premature Close":      T.violet,
  "Brand Voice":          "#6B7280",
  // fallbacks for any old values
  "The Exhausted Performer": T.amber,
  "The Transparent Void":    T.blue,
  "The Noisy Void":          T.red,
  "The Rushed Ritual":       T.violet,
  "The Narcissistic Mirror": "#6B7280",
  "The Gravitational Field": T.green,
};

function AttractionMatrixMode() {
  const [channel, setChannel] = useState("ad");
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const PLACEHOLDERS = {
    ad:    `Paste the full ad copy here — hook, body, CTA.\n\nExample:\n"Still paying for a backyard you never use?\nWe build outdoor spaces that become the best room in your house.\nFree 3D design — no commitment.\nBook your consultation →"`,
    web:   `Paste the hero section or full landing page copy.\n\nInclude: headline, subheadline, benefits, CTA, any proof elements.`,
    email: `Paste the full email — subject line, preview text, body, CTA.\n\nFormat:\nSubject: ...\nPreview: ...\n\n[Body copy]`,
  };

  async function analyze() {
    setLoading(true); setResult(null);
    try {
      const userMsg = `Channel: ${channel.toUpperCase()}
${context ? `Context (brand/audience): ${context}\n` : ""}
Creative to analyze:
---
${input}
---
Apply all 5 Han dimensions. Be rigorous and specific.`;
      const raw = await ask(ATTRACT_PROMPT, userMsg);
      setResult(parseJSON(raw));
    } finally { setLoading(false); }
  }

  function copyReport() {
    if (!result) return;
    const lines = [
      `CREATIVE SCORECARD — ${result.subject}`,
      `Overall Score: ${result.overallScore}/5`,
      `Pattern: ${result.archetype} — ${result.archetypeDesc}`,
      ``,
      result.verdict,
      ``,
      `─── DIMENSIONS ───`,
      ...(result.dimensions||[]).flatMap(d => {
        const dim = DIMENSIONS.find(x=>x.id===d.id);
        return [``, `${dim?.name} — ${d.score}/5`, d.diagnosis, `Evidence: "${d.evidence}"`, `→ ${d.recommendation}`];
      }),
      ``,
      `─── SUGGESTED CHANGES ───`,
      ...(result.changes||[]).flatMap(ch => [
        ``, `[${ch.priority}] ${ch.element} · ${ch.dimension} · ${ch.impact} impact`,
        `BEFORE: ${ch.before}`,
        `AFTER:  ${ch.after}`,
        `Why: ${ch.why}`,
      ]),
      ``,
      `─── FULL REWRITE ───`,
      `Hook:  ${result.rewrite?.hook}`,
      `Body:  ${result.rewrite?.body}`,
      `CTA:   ${result.rewrite?.cta}`,
      ``,
      result.rewrite?.rationale,
      ``,
      `Key insight: "${result.insightQuote}"`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  const scores = result?.dimensions?.map(d=>d.score) || [];
  const overallColor = result ? (result.overallScore >= 4 ? T.green : result.overallScore >= 3 ? T.amber : T.red) : T.ghost;

  return (
    <div style={{ maxWidth:900, padding:"0 24px" }}>

      {/* framework intro */}
      <div style={{ marginBottom:24, padding:"14px 16px", background:T.surf, borderRadius:8, border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.ghost, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
          5 dimensions that predict whether a creative will attract and convert
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {DIMENSIONS.map(d => (
            <div key={d.id}>
              <div style={{ fontSize:11, fontWeight:700, color:d.color, marginBottom:2 }}>{d.name}</div>
              <div style={{ fontSize:10, color:T.ghost, lineHeight:1.4 }}>{d.tagline}</div>
            </div>
          ))}
        </div>
      </div>

      {/* input */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:20 }}>
        <div>
          <div style={{ display:"flex", gap:0, marginBottom:12, border:`1px solid ${T.line}`, borderRadius:7, overflow:"hidden", width:"fit-content" }}>
            {[["ad","Ad"],["web","Web/LP"],["email","Email"]].map(([v,l])=>(
              <button key={v} onClick={()=>setChannel(v)} style={{
                padding:"6px 14px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                background:channel===v?T.ink:"none", color:channel===v?"#fff":T.sub, fontFamily:"inherit",
              }}>{l}</button>
            ))}
          </div>
          <Textarea
            label="Creative to analyze"
            value={input}
            onChange={setInput}
            placeholder={PLACEHOLDERS[channel]}
            rows={10}
          />
        </div>
        <div>
          <Textarea
            label="Brand / audience context (optional)"
            value={context}
            onChange={setContext}
            placeholder="Brand: NeoBuild. Audience: homeowners 40-60, HHI $200K+, South Florida. Offer: premium outdoor remodeling."
            rows={4}
          />
          <div style={{ marginTop:10 }}>
            <Btn onClick={analyze} disabled={!input.trim()||loading}>
              {loading ? "Analyzing…" : "Analyze →"}
            </Btn>
          </div>

          {/* dimension legend */}
          <div style={{ marginTop:20 }}>
            {DIMENSIONS.map(d=>(
              <div key={d.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.line}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:d.color, marginBottom:3 }}>
                  {d.name}
                </div>
                <div style={{ fontSize:11, color:T.sub, lineHeight:1.4 }}>{d.tagline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display:"flex",gap:8,alignItems:"center",color:T.sub,fontSize:13 }}>
          <Spin />Analyzing your creative across 5 conversion dimensions…
        </div>
      )}

      {result && (
        <div style={{ animation:"fadeIn .2s ease" }}>
          <Hr/>

          {/* ── HEADER ROW ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                <div style={{
                  padding:"3px 12px", borderRadius:99,
                  background:(ARCHETYPE_C[result.archetype]||T.ghost)+"15",
                  border:`1px solid ${(ARCHETYPE_C[result.archetype]||T.ghost)}30`,
                  fontSize:11, fontWeight:700, color:ARCHETYPE_C[result.archetype]||T.ghost,
                }}>{result.archetype}</div>
                <div style={{ fontSize:12, color:T.sub }}>{result.archetypeDesc}</div>
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{ fontSize:44, fontWeight:900, color:overallColor, fontFamily:"monospace", lineHeight:1 }}>{result.overallScore}</span>
                <span style={{ fontSize:20, color:T.ghost, fontFamily:"monospace" }}>/5</span>
                <span style={{ fontSize:13, color:T.sub, marginLeft:4 }}>overall attraction score</span>
              </div>
            </div>
            <Btn size="sm" variant="ghost" onClick={copyReport}>{copied?"Copied ✓":"Copy report"}</Btn>
          </div>

          {/* verdict */}
          <div style={{ padding:"12px 16px", background:T.surf, borderRadius:8, marginBottom:24, borderLeft:`3px solid ${T.ink}` }}>
            <div style={{ fontSize:13, color:T.sub, lineHeight:1.7, fontStyle:"italic" }}>{result.verdict}</div>
          </div>

          {/* ── VISUAL DIAGRAM: radar + 5 dimension bars side by side ── */}
          <div style={{
            display:"grid", gridTemplateColumns:"240px 1fr",
            gap:32, marginBottom:32, padding:"20px 24px",
            background:T.surf, borderRadius:10, border:`1px solid ${T.line}`,
          }}>
            {/* radar */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <RadarChart scores={scores} size={220}/>
              <div style={{ fontSize:10, color:T.ghost, marginTop:6, textAlign:"center" }}>
                5 = exemplary  ·  1 = violates
              </div>
            </div>

            {/* dimension bars — expanded */}
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:16 }}>
              {result.dimensions?.map((d, i) => {
                const dim = DIMENSIONS.find(x => x.id === d.id);
                const c   = dim?.color || T.ghost;
                const pct = (d.score / 5) * 100;
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:c }}>{dim?.name}</span>
                        <span style={{ fontSize:10, color:T.ghost, fontStyle:"italic" }}>{dim?.tagline}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                        <span style={{ fontSize:18, fontWeight:800, color:c, fontFamily:"monospace" }}>{d.score}</span>
                        <span style={{ fontSize:12, color:T.ghost, fontFamily:"monospace" }}>/5</span>
                      </div>
                    </div>
                    {/* track */}
                    <div style={{ height:6, background:T.line, borderRadius:3, overflow:"hidden", marginBottom:5 }}>
                      <div style={{
                        width:`${pct}%`, height:"100%", background:c, borderRadius:3,
                        transition:"width .5s ease",
                      }}/>
                    </div>
                    {/* inline diagnosis preview */}
                    <div style={{ fontSize:11, color:T.ghost, lineHeight:1.4 }}>{d.diagnosis?.slice(0, 100)}{d.diagnosis?.length > 100 ? "…" : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PRIORITIZED CHANGES: before / after ── */}
          {result.changes?.length > 0 && (
            <Section title="Suggested Changes" count={`${result.changes.length} edits · ordered by impact`} topBorder>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.changes.map((ch, i) => {
                  const dim = DIMENSIONS.find(x => x.id === ch.dimension);
                  const impactC = { HIGH: T.red, MEDIUM: T.amber, LOW: T.green }[ch.impact] || T.ghost;
                  const dimC = dim?.color || T.ghost;
                  return (
                    <div key={i} style={{
                      border:`1px solid ${T.line}`, borderRadius:9,
                      overflow:"hidden",
                    }}>
                      {/* change header */}
                      <div style={{
                        display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
                        padding:"9px 14px", background:T.surf,
                        borderBottom:`1px solid ${T.line}`,
                      }}>
                        <div style={{
                          width:22, height:22, borderRadius:"50%",
                          background:T.ink, color:"#fff",
                          fontSize:10, fontWeight:800, flexShrink:0,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>{ch.priority}</div>
                        <Pill t={ch.element} c={T.ink}/>
                        <Pill t={ch.dimension} c={dimC}/>
                        <Pill t={`${ch.impact} impact`} c={impactC}/>
                        <div style={{ marginLeft:"auto", fontSize:11, color:T.ghost, fontStyle:"italic" }}>{ch.why}</div>
                      </div>

                      {/* before / after split */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                        {/* before */}
                        <div style={{ padding:"12px 16px", borderRight:`1px solid ${T.line}` }}>
                          <Lbl c={T.red}>Before</Lbl>
                          <div style={{
                            fontSize:13, color:T.ink, lineHeight:1.6, marginTop:6,
                            background:T.red+"06", padding:"8px 10px", borderRadius:6,
                            borderLeft:`2px solid ${T.red}40`,
                          }}>{ch.before}</div>
                        </div>
                        {/* after */}
                        <div style={{ padding:"12px 16px" }}>
                          <Lbl c={T.green}>After</Lbl>
                          <div style={{
                            fontSize:13, color:T.ink, lineHeight:1.6, marginTop:6,
                            background:T.green+"06", padding:"8px 10px", borderRadius:6,
                            borderLeft:`2px solid ${T.green}40`,
                            fontWeight:500,
                          }}>{ch.after}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── FULL REWRITE ── */}
          <Section title="Full Creative Rewrite">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["Hook / Opening", result.rewrite?.hook,   T.blue],
                ["Body Copy",      result.rewrite?.body,   T.ink],
                ["CTA",            result.rewrite?.cta,    T.green],
              ].filter(([,v])=>v).map(([label, val, c]) => (
                <div key={label} style={{
                  border:`1px solid ${T.line}`, borderRadius:8, overflow:"hidden",
                }}>
                  <div style={{ padding:"6px 14px", background:T.surf, borderBottom:`1px solid ${T.line}` }}>
                    <Lbl c={c}>{label}</Lbl>
                  </div>
                  <div style={{ padding:"12px 14px", fontSize:14, fontWeight: label==="Hook / Opening"?700:400, color:T.ink, lineHeight:1.6, fontStyle:"italic" }}>
                    "{val}"
                  </div>
                </div>
              ))}
            </div>
            {result.rewrite?.rationale && (
              <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, marginTop:12, paddingTop:12, borderTop:`1px solid ${T.line}` }}>
                {result.rewrite.rationale}
              </div>
            )}
          </Section>

          {/* ── DIAGNOSIS BY DIMENSION ── */}
          <Section title="Diagnosis by Dimension" topBorder>
            {result.dimensions?.map((d, i) => {
              const dim = DIMENSIONS.find(x => x.id === d.id);
              const c   = dim?.color || T.ghost;
              return (
                <div key={i} style={{ padding:"16px 0", borderBottom:i<result.dimensions.length-1?`1px solid ${T.line}`:"none" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:"0 24px" }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:c, marginBottom:4 }}>{dim?.name}</div>
                      <ScoreBar score={d.score} color={c}/>
                      <div style={{ fontSize:11, color:T.ghost, marginTop:8, lineHeight:1.5 }}>
                        {d.score <= 2 ? dim?.low : d.score >= 4 ? dim?.high : dim?.tagline}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:13, color:T.sub, lineHeight:1.7, marginBottom:8 }}>{d.diagnosis}</div>
                      {d.evidence && (
                        <div style={{ background:T.surf, borderRadius:6, padding:"8px 10px", marginBottom:8, borderLeft:`2px solid ${c}` }}>
                          <Lbl c={c}>Evidence in the creative</Lbl>
                          <div style={{ fontSize:12, color:T.ink, fontStyle:"italic", lineHeight:1.5, marginTop:3 }}>"{d.evidence}"</div>
                        </div>
                      )}
                      <div style={{ fontSize:12, color:c, fontWeight:600 }}>→ {d.recommendation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Section>

          {/* ── KEY INSIGHT ── */}
          {(result.insightQuote || result.hanQuote) && (
            <div style={{ marginTop:20, padding:"14px 18px", borderLeft:`3px solid ${T.ink}`, background:T.surf, borderRadius:"0 8px 8px 0" }}>
              <Lbl>Key insight</Lbl>
              <div style={{ fontSize:13, color:T.ink, lineHeight:1.7, marginTop:4 }}>{result.insightQuote || result.hanQuote}</div>
            </div>
          )}

          <div style={{ marginTop:24 }}>
            <Btn variant="ghost" size="sm" onClick={()=>{ setResult(null); }}>Analyze another creative</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ROOT APP ─────────────────────────────────────────────── */
const MODES = [
  { id:"strategy",  label:"Strategy",        desc:"Brief → full system"  },
  { id:"financials",label:"Financials",       desc:"Viability model"      },
  { id:"creative",  label:"Creative Request", desc:"WMM brief format"     },
  { id:"email",     label:"Email Flows",      desc:"GHL automation flows" },
  { id:"matrix",    label:"Attraction Matrix",desc:"Han × performance"    },
];

export default function App() {
  const [mode,         setMode]         = useState("strategy");
  const [strategyData, setStrategyData] = useState(null);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.ink, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        button:disabled{cursor:not-allowed}
        textarea,input,select{box-sizing:border-box}
        a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.line};border-radius:2px}
      `}</style>

      {/* TOPBAR */}
      <div style={{ height:44, padding:"0 24px", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", position:"sticky", top:0, zIndex:200, background:T.bg }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:"-0.01em", marginRight:28 }}>WMM</div>

        {MODES.map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{
            padding:"0 16px", height:"100%", background:"none", border:"none",
            borderBottom:mode===m.id?`2px solid ${T.ink}`:"2px solid transparent",
            fontSize:13, fontWeight:mode===m.id?600:400,
            color:mode===m.id?T.ink:T.sub, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", gap:7,
          }}>
            {m.label}
            {mode===m.id&&<span style={{ fontSize:11, color:T.ghost, fontWeight:400 }}>{m.desc}</span>}
            {(m.id==="creative"||m.id==="email")&&strategyData&&mode!==m.id&&(
              <Dot c={T.green} size={5}/>
            )}
          </button>
        ))}

      </div>

      {/* CONTENT */}
      <div style={{ paddingTop:28, paddingBottom:60 }}>
        {mode==="strategy"   && <StrategyMode   key="strategy"   onData={setStrategyData}/>}
        {mode==="financials" && <FinancialsMode key="financials"/>}
        {mode==="creative"   && <CreativeRequestMode key="creative" strategyData={strategyData}/>}
        {mode==="email"      && <EmailFlowsMode key="email" strategyData={strategyData}/>}
        {mode==="matrix"     && <AttractionMatrixMode key="matrix"/>}
      </div>
    </div>
  );
}
