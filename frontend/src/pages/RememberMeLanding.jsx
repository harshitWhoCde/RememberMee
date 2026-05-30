import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/rememberme-logo.svg';

const NAV_LINKS = ["Features", "How It Works", "Privacy", "Archive"];

const STATS = [
  { value: "512-dim", label: "ArcFace Embeddings" },
  { value: "100%", label: "Local Processing" },
  { value: "0ms", label: "Cloud Latency" },
  { value: "Phi3", label: "On-Device LLM" },
];

const FEATURES = [
  {
    icon: "👁️",
    tag: "Face Recognition",
    title: "Instant Visitor Identification",
    desc: "The moment someone walks in, RememberMe detects and identifies them using ArcFace deep-embedding technology — no awkward pauses, no confusion. The patient sees their visitor's name, relationship, and last memory appear instantly.",
    color: "#0e7490",
    bg: "rgba(14,116,144,0.08)",
  },
  {
    icon: "🎙️",
    tag: "Live Transcription",
    title: "Real-Time Conversation Capture",
    desc: "Faster-Whisper streams and transcribes every word of the conversation as it happens. Nothing is missed. The live transcript scrolls quietly in the background, ready to be preserved.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: "🧠",
    tag: "AI Memory",
    title: "Meaningful Memory Summaries",
    desc: "At session end, the local Phi3 language model distills the entire conversation into a warm, human-readable summary — filed away in the archive for the next visit. Each summary is a bridge back to a cherished moment.",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Place the Companion",
    desc: "Set up any laptop or PC with a webcam in the living room. Run the four local services in minutes.",
    color: "#0e7490",
  },
  {
    num: "02",
    title: "Visitor Arrives",
    desc: "The system detects and identifies the visitor automatically — their name, relationship, and last memory appear on screen.",
    color: "#7c3aed",
  },
  {
    num: "03",
    title: "Conversation Flows",
    desc: "Faster-Whisper quietly transcribes the visit in real-time over a WebSocket connection, capturing context as it unfolds.",
    color: "#059669",
  },
  {
    num: "04",
    title: "Memory Saved",
    desc: "Phi3 summarizes the conversation into a memory snippet. The archive grows richer with every visit.",
    color: "#d97706",
  },
];

const PRIVACY_POINTS = [
  { icon: "🔒", title: "No Cloud, Ever", desc: "Face data never leaves your device. Every model runs locally on your own hardware." },
  { icon: "🏠", title: "Fully Offline", desc: "Zero internet required after setup. Power outage? The data stays safe on your machine." },
  { icon: "🗄️", title: "Your Data, Your MongoDB", desc: "All memories and embeddings are stored in a local MongoDB instance that only you control." },
  { icon: "⚡", title: "Open Source Stack", desc: "Built entirely on open-source tools — InsightFace, Faster-Whisper, Ollama, MongoDB. No black boxes." },
];

const PAGES = [
  {
    tag: "Living Room",
    title: "Real-Time Recognition Dashboard",
    desc: "The heart of RememberMe. A live webcam feed where faces are detected, matched, and introduced — complete with relationship context and last-visit summary.",
    features: ["ArcFace matching at 0.45 threshold", "Live STT transcript scrolling", "Visitor context overlay"],
    color: "#0e7490",
  },
  {
    tag: "Visitor Archive",
    title: "A Digital Memory Book",
    desc: "Browse every known visitor as a warm, persistent card — their face, relationship, last conversation context, and AI-generated memory snippet side by side.",
    features: ["Full memory history per person", "AI-generated summaries", "Relationship tagging"],
    color: "#7c3aed",
  },
  {
    tag: "Voice Q&A",
    title: "Ask Anything, Anytime",
    desc: 'Ask the companion questions like "Who is Rahul?" or "When did Maya last visit?" and receive an AI-spoken answer immediately — no typing required.',
    features: ["Natural voice input", "Instant AI answers", "Built for ease of use"],
    color: "#059669",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function PulsingDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%", background: "#10b981",
        boxShadow: "0 0 0 0 rgba(16,185,129,0.4)",
        animation: "pulse-dot 1.8s infinite",
        display: "inline-block",
      }} />
      <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600, letterSpacing: "0.04em" }}>LIVE</span>
    </span>
  );
}

function DashboardMockup() {
  const [active, setActive] = useState(0);
  const names = ["Rahul (Son)", "Maya (Daughter)", "Dr. Mehta"];
  const memories = [
    "Last talked about the chess tournament 2 days ago. Brought sweets.",
    "Visited last Thursday. Discussed family photos from 1995.",
    "Routine check-up. Blood pressure stable. Prescribed vitamins.",
  ];
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % 3), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: 20, padding: 0, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ background: "rgba(255,255,255,0.04)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginLeft: 8 }}>RememberMe — Living Room</span>
        <div style={{ marginLeft: "auto" }}><PulsingDot /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: 20, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ background: "#0e7490", borderRadius: 12, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.03) 2px, rgba(0,255,200,0.03) 4px)" }} />
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👤</div>
              <div style={{ border: "2px solid #10b981", borderRadius: 8, padding: "4px 12px", display: "inline-block", color: "#10b981", fontSize: 13, fontWeight: 600 }}>
                {names[active]}
              </div>
            </div>
            <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(16,185,129,0.4)", borderRadius: 12, animation: "scan 2s linear infinite" }} />
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(16,185,129,0.08)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
            <p style={{ color: "#10b981", fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: "0.08em" }}>IDENTIFIED</p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: "2px 0 0" }}>{names[active]}</p>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px" }}>LAST MEMORY</p>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{memories[active]}</p>
          <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 8px" }}>LIVE TRANSCRIPT</p>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              <span style={{ color: "#7c3aed", fontWeight: 600 }}>Visitor: </span>"How are you feeling today, Dad?"<br />
              <span style={{ color: "#0e7490", fontWeight: 600 }}>Patient: </span>"Much better. You look just like your mother."
              <span style={{ display: "inline-block", width: 2, height: 12, background: "#fff", marginLeft: 4, animation: "blink 1s step-end infinite", verticalAlign: "middle" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RememberMeLanding() {
  const [navOpen, setNavOpen] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{box-shadow:0 0 0 8px rgba(16,185,129,0)} }
        @keyframes scan { 0%{opacity:0.6} 50%{opacity:0.2} 100%{opacity:0.6} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .nav-link { color: #475569; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: #0e7490; }
        .btn-primary { background: #0e7490; color: #fff; border: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'DM Sans', sans-serif; }
        .btn-primary:hover { background: #0c6680; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(14,116,144,0.35); }
        .btn-secondary { background: transparent; color: #0e7490; border: 1.5px solid #0e7490; padding: 13px 28px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'DM Sans', sans-serif; }
        .btn-secondary:hover { background: rgba(14,116,144,0.06); transform: translateY(-2px); }
        .feature-card { background: #fff; border-radius: 20px; padding: 36px 32px; border: 1px solid #e2e8f0; transition: all 0.35s; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.1); border-color: transparent; }
        .page-tab { padding: 10px 22px; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-family: 'DM Sans', sans-serif; }
        .privacy-card { background: #fff; border-radius: 16px; padding: 28px 24px; border: 1px solid #e2e8f0; transition: all 0.3s; }
        .privacy-card:hover { border-color: #0e7490; box-shadow: 0 8px 30px rgba(14,116,144,0.1); }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .privacy-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .privacy-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .page-tabs { flex-wrap: wrap; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(248,250,252,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="RememberMe Logo" className="object-contain bg-white rounded-lg p-0.5" style={{ width: 36, height: 36 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>RememberMe</span>
          </div>
          <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
            {["features", "how-it-works", "privacy", "archive", "cta"].map((id, i) => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link" style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif" }}>
                {NAV_LINKS[i]}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => scrollTo("cta")} style={{ padding: "10px 24px", fontSize: 14 }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" style={{ background: "linear-gradient(160deg, #f0f9ff 0%, #f8fafc 50%, #fdf4ff 100%)", padding: "20px 40px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,116,144,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hero-grid">
          <div style={{ animation: "fadeSlideUp 0.9s ease forwards" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(14,116,144,0.08)", border: "1px solid rgba(14,116,144,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
              <PulsingDot />
              <span style={{ fontSize: 13, color: "#0e7490", fontWeight: 600 }}>Fully Local · No Cloud Required</span>
            </div>
            <h1 style={{
              fontSize: "clamp(38px, 5vw, 60px)", fontFamily: "'Playfair Display', serif",
              fontWeight: 800, lineHeight: 1.12, color: "#0f172a", marginBottom: 24, letterSpacing: "-0.02em"
            }}>
              Preserving Connections<br />
              <span style={{ color: "#0e7490" }}>When Memory Fades</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: "#475569", marginBottom: 36, maxWidth: 500 }}>
              RememberMe uses private, on-device AI to recognize visitors, transcribe live conversations, and instantly remind dementia patients of past interactions — all without a single byte leaving your home.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => scrollTo("cta")}>Launch Local Dashboard</button>
              <button className="btn-secondary" onClick={() => scrollTo("how-it-works")}>See How It Works</button>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 40, flexWrap: "wrap" }}>
              {[["🎭", "Face Recognition"], ["🎙️", "Live STT"], ["🧠", "AI Summaries"], ["🔒", "100% Private"]].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ animation: "fadeSlideUp 1.1s ease forwards" }}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ background: "#0f172a", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }} className="stats-grid">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{value}</p>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "96px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#0e7490", textTransform: "uppercase" }}>Core Pillars</span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#0f172a", marginTop: 12, marginBottom: 16 }}>
                Technology That Feels Human
              </h2>
              <p style={{ fontSize: 17, color: "#475569", maxWidth: 560, margin: "0 auto" }}>
                Three AI systems working in harmony to bridge the gap between memory loss and meaningful connection.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }} className="features-grid">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.tag} delay={i * 0.15}>
                <div className="feature-card">
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 24 }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: f.color, textTransform: "uppercase" }}>{f.tag}</span>
                  <h3 style={{ fontSize: 21, fontWeight: 700, color: "#0f172a", margin: "8px 0 14px", lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: "#475569" }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HERO IMAGE BANNER */}
      <section style={{ padding: "0 24px 96px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <div style={{
              borderRadius: 28, overflow: "hidden", position: "relative",
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0e7490 100%)",
              padding: "64px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center"
            }} className="hero-grid">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#7dd3fc", textTransform: "uppercase" }}>Patient-Centric Design</span>
                <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700, margin: "12px 0 20px", lineHeight: 1.25 }}>
                  Built for the Living Room, Not a Lab
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, marginBottom: 28 }}>
                  RememberMe was designed to be invisible — a quiet companion that only speaks when it can help. No complex controls, no overwhelming interfaces. Just warmth, familiarity, and a gentle nudge when names slip away.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn-primary" onClick={() => scrollTo("cta")} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
                    See Live Demo
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { emoji: "👴", title: "Patient View", sub: "Gentle, large-text interface", color: "rgba(14,116,144,0.4)" },
                  { emoji: "👨‍👩‍👧", title: "Family Setup", sub: "Register faces in minutes", color: "rgba(124,58,237,0.4)" },
                  { emoji: "📚", title: "Memory Archive", sub: "Every visit, preserved", color: "rgba(5,150,105,0.4)" },
                  { emoji: "🩺", title: "Care Team", sub: "Share notes & context", color: "rgba(217,119,6,0.4)" },
                ].map(({ emoji, title, sub, color }) => (
                  <div key={title} style={{ background: color, borderRadius: 16, padding: "20px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: 28 }}>{emoji}</span>
                    <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: "8px 0 4px" }}>{title}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#7c3aed", textTransform: "uppercase" }}>How It Works</span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#0f172a", marginTop: 12, marginBottom: 16 }}>
                Setup in Minutes, Comfort for Years
              </h2>
              <p style={{ fontSize: 17, color: "#475569", maxWidth: 520, margin: "0 auto" }}>
                Four simple steps from installation to a working companion — no technical expertise needed.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }} className="steps-grid">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.12}>
                <div style={{ position: "relative" }}>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: "absolute", top: 28, left: "calc(50% + 28px)", width: "calc(100% - 56px)", height: 2,
                      background: `linear-gradient(90deg, ${step.color}60, transparent)`,
                    }} className="connector-line" />
                  )}
                  <div style={{ textAlign: "center", padding: "32px 20px 28px" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
                      background: step.color, display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 20, fontWeight: 800, boxShadow: `0 8px 24px ${step.color}40`
                    }}>
                      {step.num}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 10, lineHeight: 1.3 }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY SECTION */}
      <section id="privacy" style={{ padding: "96px 24px", background: "#f0f9ff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="hero-grid">
          <FadeIn>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#0e7490", textTransform: "uppercase" }}>Privacy First</span>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#0f172a", margin: "12px 0 20px", lineHeight: 1.25 }}>
              100% Private.<br />100% Local.<br />No Cloud Required.
            </h2>
            <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.75, marginBottom: 32 }}>
              Your loved one's face data, voice recordings, and personal memories never leave your house. Every AI model — InsightFace, Faster-Whisper, Phi3 — runs entirely on your own hardware. No subscriptions, no surveillance, no compromise.
            </p>
            <div style={{ background: "#fff", border: "1px solid #bae6fd", borderRadius: 16, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, marginTop: 2 }}>🛡️</span>
              <div>
                <p style={{ fontWeight: 700, color: "#0c4a6e", fontSize: 15, margin: "0 0 4px" }}>HIPAA-Aware Architecture</p>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>Designed with the sensitivity of healthcare data in mind. No third-party data processors, no analytics, no cloud sync.</p>
              </div>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="privacy-grid">
            {PRIVACY_POINTS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.1}>
                <div className="privacy-card">
                  <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>{p.icon}</span>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{p.title}</h4>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE DEEP DIVE / ARCHIVE */}
      <section id="archive" style={{ padding: "96px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#d97706", textTransform: "uppercase" }}>Inside RememberMe</span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#0f172a", marginTop: 12 }}>
                Three Screens, Infinite Comfort
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }} className="page-tabs">
              {PAGES.map((p, i) => (
                <button
                  key={p.tag}
                  className="page-tab"
                  onClick={() => setActivePage(i)}
                  style={{
                    background: activePage === i ? p.color : "transparent",
                    color: activePage === i ? "#fff" : "#64748b",
                    border: `1.5px solid ${activePage === i ? p.color : "#e2e8f0"}`,
                  }}
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="hero-grid">
              <div style={{ padding: "48px 44px", borderRight: "1px solid #f1f5f9" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: PAGES[activePage].color
                }}>{PAGES[activePage].tag}</span>
                <h3 style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 700, color: "#0f172a", margin: "12px 0 18px", lineHeight: 1.3 }}>
                  {PAGES[activePage].title}
                </h3>
                <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.75, marginBottom: 28 }}>
                  {PAGES[activePage].desc}
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                  {PAGES[activePage].features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: PAGES[activePage].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ background: "#f8fafc", padding: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  background: "#0f172a", borderRadius: 16, width: "100%", aspectRatio: "4/3",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.06)", flexDirection: "column", gap: 16, padding: 24
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: PAGES[activePage].color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                    {["🏠", "📚", "🎤"][activePage]}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>{PAGES[activePage].tag} Interface Preview</p>
                  <div style={{ width: "80%", height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ width: "60%", height: "100%", borderRadius: 4, background: PAGES[activePage].color }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[40, 60, 50].map((w, i) => (
                      <div key={i} style={{ width: w, height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* AI MODELS TABLE */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#7c3aed", textTransform: "uppercase" }}>AI Stack</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: "'Playfair Display', serif", color: "#0f172a", margin: "10px 0", fontWeight: 700 }}>
                Best-in-Class Models, Running Locally
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { model: "InsightFace buffalo_l", role: "Face Recognition", detail: "ArcFace 512-dim embeddings, SCRFD detection", color: "#0e7490", icon: "👁️" },
                { model: "Faster-Whisper medium.en", role: "Speech-to-Text", detail: "int8 quantized, 3s windows, VAD filter, 300ms overlap", color: "#7c3aed", icon: "🎙️" },
                { model: "Ollama Phi3", role: "Conversation Summarization", detail: "Local LLM, conversation distillation, fallback summary", color: "#059669", icon: "🧠" },
                { model: "face-api.js (TensorFlow.js)", role: "Browser Face Detection", detail: "In-browser real-time detection triggers server matching", color: "#d97706", icon: "🌐" },
              ].map(({ model, role, detail, color, icon }) => (
                <div key={model} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "0 0 4px" }}>{model}</p>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{detail}</p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    color, background: color + "15", padding: "6px 14px", borderRadius: 50, whiteSpace: "nowrap"
                  }}>{role}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TESTIMONIAL / QUOTE */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <span style={{ fontSize: 48, display: "block", marginBottom: 24 }}>❝</span>
            <blockquote style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontFamily: "'Playfair Display', serif", color: "#e2e8f0", lineHeight: 1.6, fontStyle: "italic", marginBottom: 28 }}>
              The moment my father looked at the screen and said her name — I realized RememberMe hadn't just recognized a face. It had given him back a memory.
            </blockquote>
            <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>— Family caregiver, early user</p>
          </FadeIn>
        </div>
      </section>

      {/* CTA SECTION */}
      <section id="cta" style={{ padding: "96px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <div style={{
              background: "linear-gradient(135deg, #f0f9ff, #fdf4ff)",
              border: "1px solid #e2e8f0",
              borderRadius: 28, padding: "64px 48px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.06)"
            }}>
              <img src={logo} alt="RememberMe Logo" className="object-contain" style={{ width: 48, height: 48, display: "block", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
                Bring Comfort Back<br />to Every Conversation
              </h2>
              <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
                RememberMe is free, open-source, and runs entirely on your hardware. Set it up in under 15 minutes and start preserving the moments that matter.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }} onClick={() => navigate('/register')}>
                  Create Account — Free
                </button>
                <button className="btn-secondary" style={{ fontSize: 16, padding: "15px 32px" }} onClick={() => window.open('https://github.com/harshitWhoCde/RememberMee', '_blank')}>
                  View on GitHub
                </button>
              </div>
              <div style={{ marginTop: 28, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                {["✓ No subscription fees", "✓ No cloud upload", "✓ Open source"].map(t => (
                  <span key={t} style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="hero-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <img src={logo} alt="RememberMe Logo" className="object-contain bg-white rounded-lg p-0.5" style={{ width: 32, height: 32 }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>RememberMe</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#64748b", maxWidth: 280 }}>
                An AI-powered memory companion for dementia patients. Preserving connections, one visit at a time.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "How It Works", "Privacy", "Architecture"] },
              { title: "Technical", links: ["API Reference", "Database Schema", "AI Models", "GitHub"] },
              { title: "Support", links: ["Documentation", "Setup Guide", "FAQ", "Contact"] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>{col.title}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#64748b"}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#475569" }}>© 2026 RememberMe. Open source. Built with ❤️ for caregivers everywhere.</p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy Policy", "Terms", "GitHub"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}