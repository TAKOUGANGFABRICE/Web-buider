import { useState } from "react";

const T = {
  bg: "#0d0f1a", surface: "#131629", card: "#1a1e35", card2: "#1e2340",
  border: "#2a2f4e", border2: "#333860", accent: "#5b6af5", accent2: "#7c8bf7",
  green: "#22c55e", red: "#ef4444", orange: "#f97316",
  text: "#e8eaf6", text2: "#9ba3c9", text3: "#6470a0",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0d0f1a; color: #e8eaf6; }
  input, textarea, select {
    background: #131629; border: 1px solid #2a2f4e; border-radius: 6px;
    color: #e8eaf6; font-family: inherit; font-size: 11px;
    padding: 5px 9px; outline: none; width: 100%;
  }
  input[type=checkbox], input[type=radio] { width: auto; cursor: pointer; }
  input::placeholder, textarea::placeholder { color: #6470a0; }
  select option { background: #131629; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #131629; }
  ::-webkit-scrollbar-thumb { background: #2a2f4e; border-radius: 3px; }
`;

/* ── PRIMITIVES ─────────────────────────────────────────────── */
const Btn = ({ children, variant = "primary", size = "md", style: sx = {}, onClick }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 4, border: "none", fontFamily: "inherit", cursor: "pointer", borderRadius: 6, fontWeight: 600 };
  const sizes = { sm: { padding: "3px 9px", fontSize: 10 }, md: { padding: "5px 12px", fontSize: 11 } };
  const variants = {
    primary: { background: T.accent, color: "#fff" },
    outline: { background: "transparent", border: `1px solid ${T.border2}`, color: T.text2 },
    ghost:   { background: "transparent", color: T.text2 },
  };
  return <button onClick={onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...sx }}>{children}</button>;
};

const Badge = ({ children, color = "gray" }) => {
  const colors = {
    green:  { background: "rgba(34,197,94,.18)",  color: T.green },
    blue:   { background: "rgba(91,106,245,.18)", color: T.accent2 },
    red:    { background: "rgba(239,68,68,.18)",  color: T.red },
    gray:   { background: "rgba(155,163,201,.1)", color: T.text2 },
    orange: { background: "rgba(249,115,22,.18)", color: T.orange },
  };
  return <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, ...colors[color] }}>{children}</span>;
};

const Avatar = ({ initials, bg, size = 26 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
);

const Divider = ({ my = 10 }) => <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: `${my}px 0` }} />;

const ProgressBar = ({ pct, color = T.accent }) => (
  <div style={{ width: "100%", height: 5, background: T.border, borderRadius: 10, overflow: "hidden", marginTop: 4 }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 10 }} />
  </div>
);

const Sparkline = ({ data, color = T.accent, height = 30 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
    {data.map((v, i) => (
      <span key={i} style={{ display: "block", width: 4, height: `${v}%`, background: color, borderRadius: "2px 2px 0 0", opacity: 0.75 }} />
    ))}
  </div>
);

const Panel = ({ num, title, children, extra, span = 1 }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", gridColumn: `span ${span}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: T.card2, borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, color: T.text2 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: T.accent, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</span>
      {title}
      {extra && <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>{extra}</div>}
    </div>
    <div style={{ padding: 14 }}>{children}</div>
  </div>
);

const Row = ({ children, style: sx = {} }) => <div style={{ display: "flex", alignItems: "center", ...sx }}>{children}</div>;

/* ── NAV SIDEBAR ────────────────────────────────────────────── */
const AppSidebar = ({ active, setActive }) => {
  const items = [["🏠","Dashboard"],["📄","Templates"],["📊","Analytics"],["💳","Billing"],["⚙️","Settings"],["🔗","Integrations"],["🤖","AI Assistant"],["❓","Help Center"]];
  return (
    <div style={{ width: 94, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.accent2, padding: "4px 6px 8px", borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>SiteBuilder</div>
      {items.map(([icon, label]) => (
        <div key={label} onClick={() => setActive(label)} style={{ fontSize: 10, padding: "5px 6px", borderRadius: 5, color: active === label ? "#fff" : T.text2, background: active === label ? T.accent : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          {icon} {label}
        </div>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 10 }}>
        <div style={{ background: T.accent, borderRadius: 5, padding: "4px 6px", fontSize: 9, color: "#fff", textAlign: "center", marginBottom: 8 }}>Upgrade Plan</div>
        <Row style={{ gap: 5, fontSize: 9, color: T.text2 }}>
          <Avatar initials="JD" bg={T.accent} size={20} /> John Doe
        </Row>
      </div>
    </div>
  );
};

/* ── 1. AUTHENTICATION ──────────────────────────────────────── */
const AuthSection = () => {
  const Card = ({ title, sub, isLogin }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 10, color: T.text3, marginBottom: 8 }}>{sub}</div>
      {["🇬 Continue with Google", "🐙 Continue with GitHub"].map(t => (
        <button key={t} style={{ width: "100%", background: T.card2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 10, color: T.text, cursor: "pointer", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>{t}</button>
      ))}
      <Divider my={8} />
      {isLogin ? (
        <>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Email address</div>
          <input type="email" placeholder="john@example.com" style={{ marginBottom: 6 }} />
          <Row style={{ justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ fontSize: 10, color: T.text3 }}>Password</div>
            <div style={{ fontSize: 9, color: T.accent2, cursor: "pointer" }}>Forgot password?</div>
          </Row>
          <input type="password" placeholder="••••••••" style={{ marginBottom: 8 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.text2, marginBottom: 8, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <Btn style={{ width: "100%", justifyContent: "center", padding: 7 }}>Sign In</Btn>
          <div style={{ fontSize: 9, color: T.text3, textAlign: "center", marginTop: 6 }}>Don't have an account? <span style={{ color: T.accent2, cursor: "pointer" }}>Sign up</span></div>
        </>
      ) : (
        <>
          {[["Full name","John Doe","text"],["Email address","john@example.com","email"],["Password","••••••••","password"]].map(([lbl, ph, type]) => (
            <div key={lbl} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>{lbl}</div>
              <input type={type} placeholder={ph} />
            </div>
          ))}
          <Btn style={{ width: "100%", justifyContent: "center", padding: 7 }}>Create Account</Btn>
          <div style={{ fontSize: 9, color: T.text3, textAlign: "center", marginTop: 6 }}>Already have an account? <span style={{ color: T.accent2, cursor: "pointer" }}>Sign in</span></div>
        </>
      )}
    </div>
  );
  return (
    <Panel num={1} title="Authentication" span={2}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Welcome Back 👋" sub="Sign in to your account" isLogin />
        <Card title="Create Account 🚀" sub="Start building your website" />
      </div>
    </Panel>
  );
};

/* ── 2. DASHBOARD ───────────────────────────────────────────── */
const DashboardSection = () => {
  const [active, setActive] = useState("Dashboard");
  const stats = [["Websites","12","↑ 8%",true],["Published","8","↑ 6%",true],["Drafts","4","↓ 2%",false],["Total Visits","24.5K","↑ 19%",true]];
  const sites = [
    ["My Business","Published","1.2K","2 hours ago","green"],
    ["Portfolio","Published","896","1 day ago","green"],
    ["Ecommerce Store","Published","3.4K","2 days ago","blue"],
    ["Landing Page","Draft","245","3 days ago","orange"],
    ["Blog Website","Published","5.1K","5 days ago","green"],
  ];
  return (
    <Panel num={2} title="Dashboard (Websites Overview)" span={2}>
      <div style={{ display: "flex", margin: "-14px" }}>
        <AppSidebar active={active} setActive={setActive} />
        <div style={{ flex: 1, padding: 10 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Welcome back, John! 👋</div>
              <div style={{ fontSize: 10, color: T.text3 }}>Here's what's happening with your websites</div>
            </div>
            <Btn size="sm">+ Create New</Btn>
          </Row>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
            {stats.map(([label, val, chg, up]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8 }}>
                <div style={{ fontSize: 10, color: T.text3 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, color: up ? T.green : T.red }}>{chg}</div>
              </div>
            ))}
          </div>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Recent Websites</div>
            <Row style={{ gap: 5 }}>
              <Btn size="sm">✚ Create New Website</Btn>
              <Btn size="sm" variant="outline">⚡ Choose Template</Btn>
            </Row>
          </Row>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>{["Name","Status","Visits","Updated"].map(h => <th key={h} style={{ color: T.text3, fontWeight: 500, textAlign: "left", padding: "3px 4px" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {sites.map(([name, status, visits, updated, color]) => (
                <tr key={name}>
                  <td style={{ padding: "4px", borderBottom: `1px solid ${T.border}`, color: T.text2 }}>{name}</td>
                  <td style={{ padding: "4px", borderBottom: `1px solid ${T.border}` }}><Badge color={color}>{status}</Badge></td>
                  <td style={{ padding: "4px", borderBottom: `1px solid ${T.border}`, color: T.text2 }}>{visits}</td>
                  <td style={{ padding: "4px", borderBottom: `1px solid ${T.border}`, color: T.text2 }}>{updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
};

/* ── 3. TEMPLATES ───────────────────────────────────────────── */
const TemplatesSection = () => {
  const [cat, setCat] = useState("All Templates");
  const cats = ["All Templates","Business","Portfolio","E-commerce","Blog","Landing Page","Restaurant","Events","Photography","Education"];
  const cards = [
    ["🏢","Digital Agency","linear-gradient(135deg,#1a1a2e,#16213e)"],
    ["🚀","SaaS Startup","linear-gradient(135deg,#0f3460,#533483)"],
    ["🎨","Portfolio Modern","linear-gradient(135deg,#2d1b69,#11998e)"],
    ["🛍️","Online Store","linear-gradient(135deg,#d53369,#daae51)"],
    ["🍽️","Restaurant","linear-gradient(135deg,#c94b4b,#4b134f)"],
    ["📝","Blog Classic","linear-gradient(135deg,#2193b0,#6dd5ed)"],
  ];
  return (
    <Panel num={3} title="Templates" span={2} extra={<Btn size="sm">✚ Create New</Btn>}>
      <input type="search" placeholder="🔍 Search templates..." style={{ width: "100%", marginBottom: 8 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {cats.map(c => (
          <div key={c} onClick={() => setCat(c)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, cursor: "pointer", background: cat === c ? T.accent : T.surface, border: `1px solid ${cat === c ? T.accent : T.border}`, color: cat === c ? "#fff" : T.text2 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {cards.map(([icon, label, bg]) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: 72, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 10, padding: "5px 8px", color: T.text2, borderTop: `1px solid ${T.border}` }}>{label}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── 4. AI BUILDER ──────────────────────────────────────────── */
const AIBuilderSection = () => (
  <Panel num={4} title="AI Website Builder" span={2}>
    <Row style={{ gap: 8, marginBottom: 10 }}>
      <div style={{ fontSize: 24 }}>✨</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Let AI create your website</div>
        <div style={{ fontSize: 10, color: T.text3 }}>Describe your business and AI will build a complete website for you.</div>
      </div>
    </Row>
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Describe your website…</div>
        <textarea placeholder="Create a modern website for a fitness coach with services, testimonials, and a contact page." style={{ height: 60, resize: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Choose type</div>
            <select><option>Business Website</option><option>Portfolio</option><option>E-commerce</option></select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Additional options</div>
            <label style={{ display: "flex", gap: 5, fontSize: 10, color: T.text2, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> Include Blog
            </label>
          </div>
        </div>
        <Row style={{ gap: 12, marginTop: 6 }}>
          {["Add Contact Form","Online Booking"].map((l, i) => (
            <label key={l} style={{ display: "flex", gap: 5, fontSize: 10, color: T.text2, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={i === 1} /> {l}
            </label>
          ))}
        </Row>
        <Btn style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>✨ Generate Website</Btn>
        <div style={{ fontSize: 10, color: T.accent2, textAlign: "right", marginTop: 6, cursor: "pointer" }}>Advanced Options ›</div>
      </div>
      <div style={{ width: 120, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8 }}>
        <div style={{ fontSize: 10, color: T.text3, marginBottom: 6 }}>Preview</div>
        <div style={{ height: 80, background: "linear-gradient(135deg,#1a1e35,#252a4a)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 22 }}>🌐</div>
          <div style={{ fontSize: 9, color: T.text3, marginTop: 4 }}>AI Preview</div>
        </div>
        <Sparkline data={[30,50,40,70,60,90,80,100]} height={40} />
      </div>
    </div>
  </Panel>
);

/* ── 5. EDITOR ──────────────────────────────────────────────── */
const EditorSection = () => (
  <Panel num={5} title="Editor (Drag & Drop)" span={2} extra={
    <>
      {["🖥️","💻","📱"].map(i => <span key={i} style={{ fontSize: 13, cursor: "pointer" }}>{i}</span>)}
      <Btn size="sm" variant="outline">Preview</Btn>
      <Btn size="sm">Publish</Btn>
    </>
  }>
    <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", minHeight: 190 }}>
      {/* Element sidebar */}
      <div style={{ width: 72, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "8px 5px" }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: T.text2 }}>Elements</span>
          <span style={{ fontSize: 9, color: T.text3 }}>Sections</span>
        </Row>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {[["T","Text"],["H","Heading"],["🖼","Image"],["▶","Video"],["🔘","Button"],["📋","Form"]].map(([ic, lb]) => (
            <div key={lb} style={{ background: T.card2, borderRadius: 5, padding: "5px 3px", textAlign: "center", fontSize: 9, color: T.text2, cursor: "pointer" }}>
              <div style={{ fontSize: 14 }}>{ic}</div>{lb}
            </div>
          ))}
        </div>
      </div>
      {/* Canvas */}
      <div style={{ flex: 1, background: "#fff" }}>
        <div style={{ background: "#f8f9fc", borderBottom: "1px solid #e8e8e8", padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, color: "#5b6af5", fontSize: 12 }}>BrandX</div>
          <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#666" }}>
            {["Home","About","Services","Pricing","Contact"].map(p => <span key={p}>{p}</span>)}
          </div>
        </div>
        <div style={{ padding: "14px 14px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ border: "2px solid #5b6af5", borderRadius: 4, padding: 4, display: "inline-block", marginBottom: 6 }}>
              <div style={{ background: "#5b6af5", color: "#fff", fontSize: 8, padding: "1px 4px", borderRadius: 2, marginBottom: 3 }}>Text</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.25 }}>Build Your Dream<br />Website Easily</div>
            </div>
            <div style={{ fontSize: 9, color: "#666", lineHeight: 1.5 }}>Create stunning websites with our powerful drag-and-drop builder. No coding required.</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <div style={{ background: "#5b6af5", color: "#fff", padding: "4px 10px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>Get Started</div>
              <div style={{ border: "1px solid #ddd", padding: "4px 10px", borderRadius: 5, fontSize: 9, color: "#555" }}>▶ Watch Video</div>
            </div>
          </div>
          <div style={{ width: 80, height: 60, borderRadius: 6, background: "linear-gradient(135deg,#667eea,#764ba2)", flexShrink: 0 }} />
        </div>
      </div>
      {/* Style panel */}
      <div style={{ width: 100, background: T.surface, borderLeft: `1px solid ${T.border}`, padding: 8 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 9, padding: "3px 6px", color: T.accent2, borderBottom: `2px solid ${T.accent}` }}>Style</div>
          <div style={{ fontSize: 9, padding: "3px 6px", color: T.text3 }}>Content</div>
        </div>
        <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Font</div>
        <select style={{ fontSize: 9, marginBottom: 8 }}><option>Poppins</option></select>
        {[["Size","700"],["Height","700"],["Spacing","—"]].map(([l, v]) => (
          <Row key={l} style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.text3 }}>{l}</span>
            <span style={{ fontSize: 10 }}>{v}</span>
          </Row>
        ))}
        <div style={{ background: "#ff4116", borderRadius: 3, padding: "2px 5px", fontSize: 9, color: "#fff", marginTop: 6 }}>#ff4127</div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 8, marginBottom: 3 }}>Spacing</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <input style={{ fontSize: 9, padding: 3 }} defaultValue="16" />
          <input style={{ fontSize: 9, padding: 3 }} defaultValue="0" />
        </div>
      </div>
    </div>
  </Panel>
);

/* ── 6. PAGES MANAGEMENT ────────────────────────────────────── */
const PagesSection = () => {
  const pages = [["🏠","Home"],["ℹ️","About Us"],["🔧","Services"],["💰","Pricing"],["🗂️","Portfolio"],["📬","Contact Us"],["📰","Blog"],["📄","Blog Post"]];
  return (
    <Panel num={6} title="Pages Management">
      <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <input type="search" placeholder="🔍 Search pages..." style={{ width: 130 }} />
        <Btn size="sm">+ Add Page</Btn>
      </Row>
      {pages.map(([icon, name]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><span>{icon}</span>{name}</div>
          <div style={{ display: "flex", gap: 6, color: T.text3, fontSize: 12, cursor: "pointer" }}>⚙️ 📋 🗑️</div>
        </div>
      ))}
    </Panel>
  );
};

/* ── 7. RESPONSIVE DESIGN ───────────────────────────────────── */
const ResponsiveSection = () => {
  const Mockup = ({ scale = 1 }) => (
    <div style={{ background: "#f8f9fc", height: "100%", padding: 4 }}>
      <div style={{ fontWeight: 800, color: "#5b6af5", fontSize: 7 * scale, marginBottom: 3 }}>BrandX {scale < 0.8 ? "☰" : ""}</div>
      <div style={{ fontSize: 7 * scale, color: "#1a1a2e", fontWeight: 700, lineHeight: 1.2 }}>Build Your Dream<br />Website Easily</div>
      {scale > 0.7 && <div style={{ fontSize: 5, color: "#888", marginTop: 2 }}>Create stunning websites easily.</div>}
      <div style={{ background: "#5b6af5", color: "#fff", padding: "2px 5px", borderRadius: 2, fontSize: 5, marginTop: 4, display: "inline-block" }}>Get Started</div>
    </div>
  );
  const devices = [["🖥️","Desktop",1],["💻","Tablet",0.85],["📱","Mobile",0.65]];
  return (
    <Panel num={7} title="Responsive Design">
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {devices.map(([icon, label, scale]) => (
          <div key={label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 9, color: T.text3, marginBottom: 6 }}>{label}</div>
            <div style={{ width: "100%", height: 72, borderRadius: 4, overflow: "hidden" }}><Mockup scale={scale} /></div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── 8. DOMAIN & HOSTING ────────────────────────────────────── */
const DomainSection = () => (
  <Panel num={8} title="Domain & Hosting">
    <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600 }}>Domains</div>
      <Btn size="sm" variant="outline">Connect Domain</Btn>
    </Row>
    {[["mybusiness.com","Primary","green"],["mybusiness.com","","green"],["myportfolio.com","","orange"]].map(([domain, sub, color], i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ fontSize: 11 }}>{domain}</div>
          {sub && <div style={{ fontSize: 9, color: T.text3 }}>{sub}</div>}
        </div>
        <Badge color={color}>{color === "green" ? "SSL Active" : "SSL Pending"}</Badge>
      </div>
    ))}
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Hosting</div>
      {[["Plan","Pro Plan"],["Expires","June 28, 2026"]].map(([l, v]) => (
        <Row key={l} style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: T.text3 }}>{l}</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{v}</span>
        </Row>
      ))}
      <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>Storage — 4.5 GB / 10 GB</div>
      <ProgressBar pct={45} />
      <div style={{ fontSize: 10, color: T.text3, marginTop: 8 }}>Bandwidth — 12.3 GB / 100 GB</div>
      <ProgressBar pct={12} color={T.green} />
      <Btn style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>⬆️ Upgrade</Btn>
    </div>
  </Panel>
);

/* ── 9. MEDIA LIBRARY ───────────────────────────────────────── */
const MediaSection = () => {
  const [tab, setTab] = useState("All");
  const thumbs = [
    ["🏔️","slide.jpg","linear-gradient(135deg,#667eea,#764ba2)"],
    ["🌸","doc.pdf","linear-gradient(135deg,#f093fb,#f5576c)"],
    ["☁️","logo.png","linear-gradient(135deg,#4facfe,#00f2fe)"],
    ["🌿","photo.jpg","linear-gradient(135deg,#43e97b,#38f9d7)"],
    ["🌅","banner.jpg","linear-gradient(135deg,#fa709a,#fee140)"],
    ["💜","hero.jpg","linear-gradient(135deg,#a18cd1,#fbc2eb)"],
    ["🎨","team.jpg","linear-gradient(135deg,#fccb90,#d57eeb)"],
    ["🌊","bg.jpg","linear-gradient(135deg,#0ba360,#3cba92)"],
  ];
  return (
    <Panel num={9} title="Media Library" span={2} extra={<Btn size="sm">⬆ Upload Files</Btn>}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["All","Images","Videos","Documents"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, cursor: "pointer", background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.text3 }}>{t}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {thumbs.map(([icon, name, bg]) => (
          <div key={name}>
            <div style={{ aspectRatio: "1", borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 9, color: T.text3, marginTop: 3 }}>{name}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── 10. FORMS & CONTACT ────────────────────────────────────── */
const FormsSection = () => {
  const forms = [["Contact Form","3 Submissions","primary"],["Newsletter Form","12 Submissions","outline"],["Booking Form","5 Submissions","outline"],["Job Application","0 Submissions","outline"]];
  const fields = [["Full Name","Text"],["Email","Email"],["Message","Textarea"],["Subject","Dropdown"]];
  return (
    <Panel num={10} title="Forms & Contact">
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Forms</div>
      {forms.map(([name, sub, v]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 9, color: T.text3 }}>{sub}</div>
          </div>
          <Btn size="sm" variant={v}>View</Btn>
        </div>
      ))}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, marginTop: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Field Builder</div>
        {fields.map(([name, type]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.text2 }}>
            <span>{name}</span><Badge>{type}</Badge>
          </div>
        ))}
        <Btn variant="outline" size="sm" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>+ Add Field</Btn>
      </div>
    </Panel>
  );
};

/* ── 11. BLOG / CMS ─────────────────────────────────────────── */
const BlogSection = () => {
  const posts = [
    ["10 Tips to Improve Your Website","May 29, 2025","green","Published"],
    ["How to Choose the Right Template","May 28, 2025","orange","Draft"],
    ["Website SEO Best Practices","May 26, 2025","blue","Draft"],
    ["How Our Builder Works","May 18, 2025","green","Published"],
  ];
  return (
    <Panel num={11} title="Blog / CMS" span={2}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ width: 145, flexShrink: 0 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Blog Posts</div>
            <Btn size="sm">+ New Post</Btn>
          </Row>
          <div style={{ fontSize: 10, color: T.text2, marginBottom: 6 }}>All <Badge>191</Badge></div>
          {posts.map(([title, date, color, status]) => (
            <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${T.border}`, gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 9, color: T.text3 }}>{date}</div>
              </div>
              <Badge color={color}>{status}</Badge>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            {["B","I","U","≡","≣","≡","🔗","🖼️","📊"].map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: T.text2, cursor: "pointer", padding: "2px 4px", borderRadius: 3 }}>{t}</span>
            ))}
            <div style={{ marginLeft: "auto" }}><Btn size="sm">Publish</Btn></div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>10 Tips to Improve Your Website</div>
            <div style={{ fontSize: 10, color: T.text2, lineHeight: 1.5 }}>Having a great website is essential for any business. Here are our top tips for creating a website that converts visitors into customers and drives growth.</div>
            <div style={{ marginTop: 8, borderRadius: 5, height: 60, background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

/* ── 12. SEO SETTINGS ───────────────────────────────────────── */
const SEOSection = () => {
  const [tab, setTab] = useState("General");
  return (
    <Panel num={12} title="SEO Settings" span={2}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["General","Social","Advanced","Sitemap"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, cursor: "pointer", background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.text3 }}>{t}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Meta Title</div>
          <input defaultValue="Best Digital Agency in Kenya | BrandX" style={{ marginBottom: 2 }} />
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: T.text3 }}>My Blog</span>
            <span style={{ fontSize: 9, color: T.green }}>60/60</span>
          </Row>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Meta Description</div>
          <textarea defaultValue="We provide the best digital services to grow your business online." style={{ height: 50, resize: "none", marginBottom: 2 }} />
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: T.text3 }}>My Blog</span>
            <span style={{ fontSize: 9, color: T.green }}>70/160</span>
          </Row>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>Focus Keyword</div>
          <input defaultValue="digital agency" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 6 }}>Preview</div>
          <div style={{ background: "#fff", borderRadius: 6, padding: 10 }}>
            <div style={{ color: "#1a0dab", fontSize: 12, fontWeight: 600 }}>Best Digital Agency in Kenya | BrandX</div>
            <div style={{ color: "#006621", fontSize: 10, margin: "3px 0" }}>https://mybusiness.com/best-digital-agency</div>
            <div style={{ color: "#545454", fontSize: 10, lineHeight: 1.5 }}>
              We provide the best digital services to grow your{" "}
              <span style={{ color: T.accent, fontWeight: 700 }}>business</span> online. Contact us today for web design and SEO services.
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

/* ── 13. E-COMMERCE ─────────────────────────────────────────── */
const EcomSection = () => {
  const products = [
    ["🎧","Wireless Headphones","$59.99","green","In Stock","#e0e7ff"],
    ["⌚","Smart Watch","$129.99","orange","Processing","#fce7f3"],
    ["🎒","Backpack","$49.99","red","Low Stock","#dcfce7"],
    ["👟","Shoes","$89.99","green","In Stock","#fef9c3"],
  ];
  const orders = [["#1022","May 14, 2025","$175.98","orange","Unpaid"],["#1022","May 17, 2025","$59.98","blue","Processing"]];
  return (
    <Panel num={13} title="E-commerce" span={2}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Products</div>
            <Btn size="sm">+ Add Product</Btn>
          </Row>
          {products.map(([icon, name, price, color, status, bg]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 10, color: T.text2 }}>{price}</div>
              </div>
              <Badge color={color}>{status}</Badge>
            </div>
          ))}
        </div>
        <div>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Orders</div>
            <span style={{ fontSize: 9, color: T.accent2, cursor: "pointer" }}>View All</span>
          </Row>
          {orders.map(([id, date, amt, color, status]) => (
            <div key={id + date} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>
              <div style={{ flex: 1 }}>{id} <span style={{ color: T.text2 }}>{date}</span></div>
              <span style={{ fontWeight: 600 }}>{amt}</span>
              <Badge color={color}>{status}</Badge>
            </div>
          ))}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: T.text3 }}>Sales Overview</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>$4,250</div>
              <div style={{ fontSize: 10, color: T.green }}>↑ +16%</div>
            </div>
            <Sparkline data={[40,60,50,80,70,100,90,85]} height={50} />
          </div>
        </div>
      </div>
    </Panel>
  );
};

/* ── 14. ANALYTICS ──────────────────────────────────────────── */
const AnalyticsSection = () => {
  const stats = [["Visitors","24.5K","↑ +15%",true],["Page Views","68.4K","↑ +12%",true],["Sessions","32.1K","↓ -8%",false],["Bounce Rate","45.2%","↓ -4%",false]];
  const topPages = [["/","12.9K"],["/services","9.3K"],["/about","6.8K"],["/blog","5.4K"],["/contact","1.8K"]];
  const pts = [[0,55],[30,48],[60,40],[90,35],[120,25],[150,30],[180,20],[210,15],[240,10],[270,8],[300,5]];
  const line = pts.map(([x, y]) => `${x},${y}`).join(" L ");
  const area = line + " L 300,60 L 0,60 Z";
  return (
    <Panel num={14} title="Analytics" span={2} extra={<span style={{ fontSize: 10, color: T.text3 }}>Last 30 Days</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        {stats.map(([label, val, chg, up]) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 10, color: T.text3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 10, color: up ? T.green : T.red }}>{chg}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Visitors Overview</div>
          <svg viewBox="0 0 300 60" style={{ width: "100%", height: 60 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b6af5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#5b6af5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M ${line}`} fill="none" stroke="#5b6af5" strokeWidth="2" />
            <path d={`M ${area}`} fill="url(#aGrad)" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.text3, marginTop: 6 }}>
            {["May 14","May 21","May 28","Jun 4","Jun 11"].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Top Pages</div>
          {topPages.map(([page, views]) => (
            <div key={page} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10 }}>{page}</span>
              <span style={{ fontSize: 10, color: T.text2 }}>{views}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

/* ── 15. TEAM ───────────────────────────────────────────────── */
const TeamSection = () => {
  const members = [["JD","John Doe","Owner","#6366f1"],["JS","Jane Smith","Editor","#ec4899"],["MJ","Mike Johnson","Viewer","#f59e0b"],["AB","Anna Brown","Editor","#10b981"]];
  const perms = ["Edit Website","Manage Pages","Edit Content","Manage Blog","Manage Billing","Manage Team"];
  return (
    <Panel num={15} title="Team / Collaboration" span={2}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Team Members</div>
          {members.map(([initials, name, role, color]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <Avatar initials={initials} bg={color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 9, color: T.text3 }}>{role}</div>
              </div>
              <select style={{ width: 70, fontSize: 9 }}><option>{role === "Owner" ? "Editor" : role}</option></select>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Roles &amp; Permissions</div>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 4 }}>Role</div>
          <select style={{ marginBottom: 10, fontSize: 10 }}><option>Editor</option></select>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 6 }}>Permissions</div>
          {perms.map((p, i) => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.text2, marginBottom: 6, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={i < 3} /> {p}
            </label>
          ))}
        </div>
      </div>
    </Panel>
  );
};

/* ── 16. BACKUP & RESTORE ───────────────────────────────────── */
const BackupSection = () => {
  const backups = [["May 29, 2025 – 10:30 AM","2.4 MB","Manual"],["May 27, 2025 – 10:30 AM","2.3 MB","Auto"],["May 26, 2025 – 10:30 AM","2.3 MB","Auto"],["May 26, 2025 – 10:30 AM","2.1 MB","Auto"]];
  return (
    <Panel num={16} title="Backup & Restore" span={2}>
      <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600 }}>Backups</div>
        <Btn size="sm">🔒 Create Backup</Btn>
      </Row>
      {backups.map(([date, size, type], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{date}</div>
            <div style={{ fontSize: 9, color: T.text3 }}>{size}</div>
          </div>
          <Row style={{ gap: 8 }}>
            <Badge color={type === "Manual" ? "gray" : "blue"}>{type}</Badge>
            <Btn size="sm" variant="outline">Restore</Btn>
          </Row>
        </div>
      ))}
    </Panel>
  );
};

/* ── 17. CODE EXPORT ────────────────────────────────────────── */
const CodeExportSection = () => {
  const exports = [["📄","Export HTML"],["⚛️","Export React/Vite"],["💚","Export Next.js"]];
  return (
    <Panel num={17} title="Code Export / Developer" span={2}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Export Website</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {exports.map(([icon, label]) => (
          <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>{label}</div>
            <Btn size="sm" variant="outline" style={{ width: "100%", justifyContent: "center" }}>Export</Btn>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, margin: "12px 0 6px" }}>Custom Code</div>
      <div style={{ background: "#0d1117", border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontFamily: "'DM Mono', monospace", fontSize: 9, lineHeight: 1.7 }}>
        <div><span style={{ color: "#ff7b72" }}>&lt;head&gt;</span></div>
        <div>&nbsp;&nbsp;<span style={{ color: "#ff7b72" }}>&lt;script&gt;</span><span style={{ color: "#8b949e" }}>  // add code to header</span><span style={{ color: "#ff7b72" }}>&lt;/script&gt;</span></div>
        <div><span style={{ color: "#ff7b72" }}>&lt;/head&gt;</span></div>
        <div><span style={{ color: "#ff7b72" }}>&lt;body&gt;</span></div>
        <div>&nbsp;&nbsp;<span style={{ color: "#8b949e" }}>// add code before &lt;/body&gt;</span></div>
        <div><span style={{ color: "#ff7b72" }}>&lt;/body&gt;</span></div>
      </div>
    </Panel>
  );
};

/* ── 18. INTEGRATIONS ───────────────────────────────────────── */
const IntegrationsSection = () => {
  const integrations = [
    ["📊","Google Analytics","Analytics"],["📘","Facebook Pixel","Marketing"],
    ["💬","WhatsApp Chat","Chat"],["📧","Mailchimp","Email"],
    ["💳","Stripe","Payments"],["🔶","HubSpot","Marketing"],
  ];
  return (
    <Panel num={18} title="Integrations / Plugins" span={2}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Integrations</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {integrations.map(([icon, name, type]) => (
          <div key={name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 9, color: T.text3, marginBottom: 8 }}>{type}</div>
            <Btn size="sm" variant="outline" style={{ width: "100%", justifyContent: "center" }}>Connect</Btn>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── 19. BILLING ────────────────────────────────────────────── */
const BillingSection = () => {
  const invoices = [["May 29, 2025","$19.00"],["Apr 29, 2025","$19.00"],["Mar 29, 2025","$19.00"]];
  const features = ["Unlimited Websites","Custom Domains","10GB Storage","Priority Support","Remove Branding"];
  return (
    <Panel num={19} title="Billing & Subscription" span={2}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Billing</div>
          <div style={{ background: "linear-gradient(135deg,#5b6af5,#7c3aed)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, color: "#fff" }}>Current Plan</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>$19 <span style={{ fontSize: 11, opacity: 0.7 }}>/ month</span></div>
            <div style={{ fontSize: 11, color: "#fff", marginTop: 4, opacity: 0.9 }}>Pro Plan</div>
            <button style={{ marginTop: 10, background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Manage Plan</button>
          </div>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.text2, marginBottom: 5 }}>
              <span style={{ color: T.green }}>✓</span> {f}
            </div>
          ))}
        </div>
        <div>
          <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Invoices</div>
            <span style={{ fontSize: 10, color: T.accent2, cursor: "pointer" }}>View All</span>
          </Row>
          {invoices.map(([date, amt]) => (
            <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>
              <span>{date}</span>
              <span style={{ fontWeight: 600 }}>{amt}</span>
              <Badge color="green">Paid</Badge>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

/* ── 20. SETTINGS ───────────────────────────────────────────── */
const SettingsSection = () => {
  const [toggles, setToggles] = useState([true, true, false, true]);
  const labels = ["Email notifications","Form submissions","New visitors alerts","Weekly reports"];
  const generalSettings = [["Domain","mybusiness.com"],["Email","john@example.com"],["Site Language","English"],["Timezone","(GMT+03:00) Nairobi"],["Date Format","May 28, 2025"]];
  return (
    <Panel num={20} title="Settings" span={2}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>General Settings</div>
          {generalSettings.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, color: T.text3 }}>{l}</span>
              <span style={{ fontSize: 10 }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Site Name</div>
          <input defaultValue="My Website" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Notifications</div>
          {labels.map((label, i) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, color: T.text3 }}>{label}</span>
              <div onClick={() => setToggles(t => t.map((v, j) => j === i ? !v : v))}
                style={{ width: 28, height: 16, borderRadius: 8, background: toggles[i] ? T.accent : T.border2, position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: toggles[i] ? 14 : 2, transition: "left .2s" }} />
              </div>
            </div>
          ))}
          <Btn style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>💾 Save Changes</Btn>
        </div>
      </div>
    </Panel>
  );
};

/* ── APP ────────────────────────────────────────────────────── */
export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "36px 20px 28px", background: "linear-gradient(180deg,#0a0c18 0%,#0d0f1a 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 6 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#5b6af5,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🌐</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Website Builder</h1>
        </div>
        <p style={{ color: T.text2, fontSize: 14 }}>All Pages &amp; Features Overview</p>
      </div>

      {/* Main Grid — 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "0 20px 48px", maxWidth: 1440, margin: "0 auto" }}>
        <AuthSection />        {/* span 2 */}
        <DashboardSection />   {/* span 2 */}

        <TemplatesSection />   {/* span 2 */}
        <AIBuilderSection />   {/* span 2 */}

        <EditorSection />      {/* span 2 */}
        <PagesSection />       {/* span 1 */}
        <ResponsiveSection />  {/* span 1 */}

        <DomainSection />      {/* span 1 */}
        <MediaSection />       {/* span 2 */}
        <FormsSection />       {/* span 1 */}

        <BlogSection />        {/* span 2 */}
        <SEOSection />         {/* span 2 */}

        <EcomSection />        {/* span 2 */}
        <AnalyticsSection />   {/* span 2 */}

        <TeamSection />        {/* span 2 */}
        <BackupSection />      {/* span 2 */}

        <CodeExportSection />  {/* span 2 */}
        <IntegrationsSection />{/* span 2 */}

        <BillingSection />     {/* span 2 */}
        <SettingsSection />    {/* span 2 */}
      </div>
    </>
  );
}
