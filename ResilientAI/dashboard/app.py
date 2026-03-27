"""
ResilientAI — Dashboard (Fixed)
- Tabs clearly visible at top
- Hormuz only loads AFTER clicking the demo button
- Default state shows a neutral "ready" screen
"""
from __future__ import annotations
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import plotly.graph_objects as go
from agents.risk_agent import detect_risks, get_event_by_id
from engines.impact_engine import predict_impact
from engines.optimizer import optimize
from engines.user_store import save_profile, load_all_profiles, log_decision, load_decision_history
from voice.whatsapp import broadcast_alert

st.set_page_config(
    page_title="ResilientAI — Supply Intelligence",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
h1, h2, h3, h4, .rec-profit { font-family: 'Outfit', sans-serif !important; }

/* Premium Dark App Background over default Streamlit */
.stApp {
    background: radial-gradient(circle at top left, #12141d, #090a0f);
    color: #EBEBF5;
}

/* Glassmorphic Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 12px;
    background: rgba(28, 28, 30, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    margin-bottom: 24px;
    overflow-x: auto;
}
.stTabs [data-baseweb="tab"] {
    background: rgba(44, 44, 46, 0.5);
    border-radius: 12px;
    color: #9999AA;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 20px;
    border: 1px solid transparent;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.stTabs [data-baseweb="tab"]:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #EBEBF5;
    transform: translateY(-2px);
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 8px 16px rgba(58, 123, 213, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-2px);
}

/* Premium Banners */
.risk-HIGH {
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.15), rgba(204, 0, 0, 0.25));
    border: 1px solid rgba(255, 68, 68, 0.4);
    color: #FF4A4A; padding: 20px 24px; border-radius: 16px;
    font-size: 18px; font-weight: 700; margin-bottom: 24px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(255, 68, 68, 0.15);
    animation: pulseBorder 2s infinite ease-in-out;
}
@keyframes pulseBorder {
    0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
}
.risk-MEDIUM {
    background: linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(204, 119, 0, 0.2));
    border: 1px solid rgba(255, 149, 0, 0.3);
    color: #FF9F0A; padding: 20px 24px; border-radius: 16px;
    font-size: 18px; font-weight: 700; margin-bottom: 24px;
}

/* Holographic Recommendation Card */
.rec-card {
    background: linear-gradient(145deg, rgba(30, 32, 40, 0.7), rgba(15, 16, 20, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
    padding: 24px; border-radius: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
    transition: transform 0.3s ease;
}
.rec-card:hover { transform: translateY(-4px); border-color: rgba(58, 123, 213, 0.4); }
.rec-action { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #00d2ff; margin-bottom: 10px; }
.rec-desc { font-size: 15px; color: #EBEBF5; margin-bottom: 12px; }
.rec-reason { font-size: 13px; color: #8E8E93; margin-bottom: 16px; line-height: 1.6; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; }
.rec-profit { font-size: 40px; font-weight: 800; background: linear-gradient(90deg, #FFD60A, #FF9F0A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Badges */
.badge-q { background: linear-gradient(90deg, #5E5CE6, #BF5AF2); color: #fff; font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 700; box-shadow: 0 4px 10px rgba(94, 92, 230, 0.4); }
.badge-c { background: #3A3A3C; color: #fff; font-size: 12px; padding: 4px 12px; border-radius: 20px; border: 1px solid #48484A;}

/* Welcome State Empty Box */
.welcome-box {
    background: rgba(28, 28, 30, 0.4);
    backdrop-filter: blur(10px);
    border: 2px dashed rgba(255,255,255,0.1); border-radius: 20px;
    padding: 80px 40px; text-align: center; margin: 40px 0;
    transition: all 0.3s;
}
.welcome-box:hover { border-color: rgba(58, 123, 213, 0.5); background: rgba(28, 28, 30, 0.6); }

/* Custom Buttons via Streamlit root */
div.stButton > button:first-child {
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
}
div.stButton > button:first-child:hover { transform: scale(1.02); }

/* Metric Cards override */
[data-testid="stMetricValue"] {
    font-family: 'Outfit', sans-serif !important;
    font-weight: 700 !important;
}
</style>
""", unsafe_allow_html=True)


# ── Session state init ────────────────────────────────────────────────────────
if "demo_loaded" not in st.session_state:
    st.session_state.demo_loaded = False
if "active_event_id" not in st.session_state:
    st.session_state.active_event_id = None


# ── Data helpers ──────────────────────────────────────────────────────────────
def get_impact(event_id: str, biz_type: str) -> dict:
    event = get_event_by_id(event_id)
    return predict_impact(event, biz_type).to_dict() if event else {}


def get_rec(event_id: str, biz_type: str) -> dict:
    event = get_event_by_id(event_id)
    if not event:
        return {}
    impact = predict_impact(event, biz_type)
    return optimize(impact.to_dict()).to_dict()


# ── Render helpers ────────────────────────────────────────────────────────────
def render_banner(event: dict):
    level = event.get("risk_level", "LOW")
    icon = {"HIGH": "🚨", "MEDIUM": "⚠️", "LOW": "ℹ️"}.get(level, "ℹ️")
    conf = int(event.get("confidence", 0) * 100)
    comms = " · ".join(event.get("commodities_affected", []))
    st.markdown(f"""
    <div class="risk-{level}">
        {icon} RISK {level} &nbsp;|&nbsp; {event.get('headline', '')}
        <br><span style="font-size:12px;opacity:0.85">
            Confidence: {conf}% &nbsp;·&nbsp; {comms} &nbsp;·&nbsp; {event.get('published_at','')[:10]}
        </span>
    </div>
    """, unsafe_allow_html=True)


def render_impact_chart(impact: dict):
    cc = impact.get("cost_changes", {})
    if not cc:
        return
    labels = list(cc.keys())
    values = [round(v * 100, 1) for v in cc.values()]
    colors = ["#FF453A" if v > 0 else "#30D158" for v in values]
    fig = go.Figure(go.Bar(
        x=labels, y=values, marker_color=colors,
        text=[f"{v:+.1f}%" for v in values], textposition="outside", width=0.5,
    ))
    fig.update_layout(
        title="📊 Cost Impact by Category",
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(28,28,30,0.9)",
        font=dict(family="Inter", color="#EBEBF5", size=13),
        yaxis=dict(ticksuffix="%", gridcolor="#3A3A3C"),
        xaxis=dict(gridcolor="rgba(0,0,0,0)"),
        height=310, margin=dict(t=45, b=5, l=5, r=5),
    )
    st.plotly_chart(fig, use_container_width=True)


def render_rec_card(rec: dict):
    badge_cls = "badge-q" if rec.get("generated_by") == "quantum" else "badge-c"
    badge_lbl = "⚛️ Quantum" if rec.get("generated_by") == "quantum" else "🔢 Classical"
    profit = rec.get("profit_impact_inr", 0)
    conf = int(rec.get("confidence", 0) * 100)
    st.markdown(f"""
    <div class="rec-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <span style="font-size:12px;color:#9999AA;font-weight:600;letter-spacing:.06em">💡 RECOMMENDED ACTION</span>
            <span class="{badge_cls}">{badge_lbl} · {conf}% conf</span>
        </div>
        <div class="rec-action">{rec.get('recommended_action','—')}</div>
        <div class="rec-desc">{rec.get('description','')}</div>
        <div class="rec-reason">📝 {rec.get('reason','')}</div>
        <hr style="border-color:#3A3A3C;margin:12px 0">
        <div style="font-size:12px;color:#8E8E93;margin-bottom:4px">Estimated 7-day profit impact</div>
        <div class="rec-profit">+₹{profit:,.0f}</div>
    </div>
    """, unsafe_allow_html=True)


def render_price_forecast_chart(forecasts: list[dict]):
    """Render 7-day price forecast as a multi-line chart."""
    if not forecasts:
        st.info("No price forecast data available for this event.")
        return

    fig = go.Figure()
    colors = ["#FF453A", "#FF9F0A", "#30D158", "#5E5CE6", "#BF5AF2"]

    for i, fc in enumerate(forecasts):
        color = colors[i % len(colors)]
        dates = fc["forecasted_dates"]
        prices = fc["forecasted_prices"]
        baseline = fc["baseline_price"]

        # Forecast line
        fig.add_trace(go.Scatter(
            x=dates, y=prices, mode="lines+markers",
            name=f"{fc['commodity']} (forecast)",
            line=dict(color=color, width=2.5),
            marker=dict(size=7),
        ))
        # Baseline reference line
        fig.add_trace(go.Scatter(
            x=dates, y=[baseline] * len(dates),
            mode="lines", name=f"{fc['commodity']} (baseline)",
            line=dict(color=color, width=1, dash="dot"),
            opacity=0.5, showlegend=False,
        ))

    fig.update_layout(
        title="📈 7-Day Commodity Price Forecast",
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(28,28,30,0.9)",
        font=dict(family="Inter", color="#EBEBF5", size=12),
        yaxis=dict(tickprefix="₹", gridcolor="#3A3A3C"),
        xaxis=dict(gridcolor="#3A3A3C"),
        legend=dict(bgcolor="rgba(28,28,30,0.8)", bordercolor="#48484A"),
        height=350, margin=dict(t=45, b=5, l=5, r=5),
        hovermode="x unified",
    )
    st.plotly_chart(fig, use_container_width=True)

    # Peak warning cards
    cols = st.columns(len(forecasts))
    for i, fc in enumerate(forecasts):
        shock_pct = fc["current_shock_pct"] * 100
        with cols[i]:
            st.markdown(f"""
            <div style="background:#2C2C2E;border:1px solid #48484A;border-radius:10px;padding:12px;text-align:center">
                <div style="font-size:13px;color:#8E8E93;margin-bottom:4px">{fc['commodity']}</div>
                <div style="font-size:20px;font-weight:700;color:#FF453A">₹{fc['peak_price']:,.1f}/{fc['unit']}</div>
                <div style="font-size:11px;color:#FF9F0A">Peak Day {fc['peak_day']} · +{shock_pct:.0f}% shock</div>
                <div style="font-size:11px;color:#8E8E93">₹{fc['baseline_price']:,.1f} baseline</div>
            </div>
            """, unsafe_allow_html=True)


# ══════════════════ TAB 5: ANALYTICS ═════════════════════════════════════════
def tab_analytics(biz_type: str):
    st.subheader("📊 Impact Analytics")
    st.caption("Sector-wide supply chain risk overview and aggregate business impact.")
    st.divider()

    # ── Sector Comparison ──
    st.markdown("#### 🏭 Sector Risk Exposure (Hormuz Scenario)")

    from agents.risk_agent import get_event_by_id
    from engines.impact_engine import predict_impact

    event = get_event_by_id("evt_001")
    if not event:
        st.warning("Load a disruption event first.")
        return

    sectors = ["kirana", "restaurant", "pharma"]
    sector_impacts = {s: predict_impact(event, s) for s in sectors}

    # Margin impact bar
    margins = [round(sector_impacts[s].margin_change * 100, 1) for s in sectors]
    fig_margins = go.Figure(go.Bar(
        x=[s.title() for s in sectors],
        y=margins,
        marker_color=["#FF453A", "#FF9F0A", "#30A2FF"],
        text=[f"{m:+.1f}%" for m in margins],
        textposition="outside",
        width=0.4,
    ))
    fig_margins.update_layout(
        title="Margin Impact by Business Type (%)",
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(28,28,30,0.9)",
        font=dict(family="Inter", color="#EBEBF5", size=13),
        yaxis=dict(ticksuffix="%", gridcolor="#3A3A3C"),
        height=280, margin=dict(t=40, b=5, l=5, r=5),
    )
    st.plotly_chart(fig_margins, use_container_width=True)

    # ── Key Metrics ──
    st.markdown("#### 📈 Aggregate Impact Estimates")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("🏪 Kirana Stores Affected", "63M+", "India estimate")
    c2.metric("💸 Avg Weekly Loss/Store", "₹2,400", "Without ResilientAI")
    c3.metric("✅ Savings with AI", "₹1,800/store", "74% recovered")
    c4.metric("🇮🇳 Market Opportunity", "₹150Cr+", "Monthly impact")

    st.divider()

    # ── Commodity Risk Radar ──
    st.markdown("#### 🎯 Commodity Risk Radar")
    commodities = ["LPG", "Diesel", "Wheat", "Edible Oil", "Transport"]
    risk_scores = [0.85, 0.70, 0.60, 0.55, 0.75]

    fig_radar = go.Figure(go.Scatterpolar(
        r=risk_scores + [risk_scores[0]],
        theta=commodities + [commodities[0]],
        fill="toself",
        fillcolor="rgba(255, 68, 68, 0.2)",
        line=dict(color="#FF4444", width=2),
        name="Risk Level",
    ))
    fig_radar.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 1], tickfont=dict(color="#8E8E93")),
            bgcolor="rgba(28,28,30,0.9)",
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter", color="#EBEBF5"),
        height=350,
        showlegend=False,
    )
    st.plotly_chart(fig_radar, use_container_width=True)

    # ── Active Events Table ──
    st.divider()
    st.markdown("#### 📋 Active Risk Events")
    from agents.risk_agent import detect_risks
    events = detect_risks("LOW")
    for e in events:
        icon = "🔴" if e["risk_level"] == "HIGH" else ("🟡" if e["risk_level"] == "MEDIUM" else "⚪")
        conf = int(e.get("confidence", 0) * 100)
        comms = ", ".join(e.get("commodities_affected", []))
        st.markdown(
            f"{icon} **{e['risk_level']}** ({conf}% confidence) — {e['headline'][:90]}  \n"
            f"&nbsp;&nbsp;&nbsp;&nbsp;Commodities: `{comms}` · Source: {e.get('source','—')}"
        )


# ══════════════════ SIDEBAR ═══════════════════════════════════════════════════
def sidebar():
    with st.sidebar:
        st.markdown("## 🚀 ResilientAI")
        st.caption("Autonomous Supply Intelligence for MSMEs")
        st.divider()
        biz_type = st.selectbox("🏪 Business Type", ["kirana", "restaurant", "pharma"])
        min_risk = st.selectbox("🔎 Min Risk Level", ["HIGH", "MEDIUM", "LOW"], index=1)
        lang = st.radio("🌐 Language", ["en", "hi"], horizontal=True,
                        format_func=lambda x: "English" if x == "en" else "हिंदी")

        from engines.city_impact import ALL_CITIES
        city = st.selectbox("📍 Your City", ALL_CITIES, index=ALL_CITIES.index("Nagpur"))
        st.session_state["selected_city"] = city

        st.divider()
        st.markdown("**📡 Data Source**")
        use_live = st.toggle("Use Live NewsAPI", value=False,
                             help="Requires NEWS_API_KEY in .env — falls back to seed data if not set")
        if use_live:
            import os; os.environ["USE_SEED_DATA"] = "false"
            st.caption("🔴 Live mode — fetching real news")
        else:
            import os; os.environ["USE_SEED_DATA"] = "true"
            st.caption("🟢 Demo mode — using seed data")
        st.divider()

        # Voice
        st.subheader("🎤 Voice Query")
        query = st.text_input("Ask anything", placeholder="Gas price badhega kya?")
        if st.button("🎙️ Ask", use_container_width=True) and query:
            RESP = {
                "en": {"gas": "LPG to rise 20% due to Hormuz. Stock 10 units & raise price ₹2.",
                       "price": "Raise price ₹2 → +₹1,200/week profit.",
                       "stock": "Buy 10 extra units now before prices rise.",
                       "risk": "HIGH risk — Hormuz disruption affecting LPG & transport.",
                       "default": "HIGH risk disruption detected. Check dashboard."},
                "hi": {"gas": "Gas 20% badhega. 10 unit extra rakho, ₹2 price badhaao.",
                       "price": "₹2 price badhaao → +₹1,200 haftewar profit.",
                       "stock": "Abhi 10 unit kharido, baad mein mehenga hoga.",
                       "risk": "HIGH risk — LPG aur transport mai badhaav aayega.",
                       "default": "HIGH risk disruption hai. Dashboard dekho."},
            }
            rm = RESP.get(lang, RESP["en"])
            q = query.lower()
            reply = next((v for k, v in rm.items() if k in q), rm["default"])
            st.success(reply)
            try:
                from gtts import gTTS
                import io
                buf = io.BytesIO()
                gTTS(text=reply, lang=lang).write_to_fp(buf)
                buf.seek(0)
                st.audio(buf.read(), format="audio/mp3")
            except Exception:
                pass
        st.divider()
        st.caption("🇮🇳 Built for 63M MSMEs · v1.0")
    return biz_type, min_risk, lang


# ══════════════════ TAB 1: INTELLIGENCE ═══════════════════════════════════════
def tab_intelligence(biz_type, min_risk, lang):
    # ── Welcome state (before demo loaded) ──
    if not st.session_state.demo_loaded:
        st.markdown("""
        <div class="welcome-box">
            <div style="font-size:48px;margin-bottom:16px">🌐</div>
            <div style="font-size:24px;font-weight:700;color:#EBEBF5;margin-bottom:8px">
                Global Supply Intelligence Ready
            </div>
            <div style="font-size:15px;color:#8E8E93;margin-bottom:24px">
                Click a scenario below to see ResilientAI in action
            </div>
        </div>
        """, unsafe_allow_html=True)

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            if st.button("🔥 Hormuz Disruption", use_container_width=True, type="primary",
                         help="Strait of Hormuz closure — HIGH risk, LPG +20%"):
                st.session_state.demo_loaded = True
                st.session_state.active_event_id = "evt_001"
                st.rerun()
        with c2:
            if st.button("🌾 Ukraine Grain Crisis", use_container_width=True,
                         help="Black Sea blockade — MEDIUM risk, wheat +15%"):
                st.session_state.demo_loaded = True
                st.session_state.active_event_id = "evt_002"
                st.rerun()
        with c3:
            if st.button("⚡ Taiwan Blockade", use_container_width=True,
                         help="Semiconductor export halt — HIGH risk, electronics +30%"):
                st.session_state.demo_loaded = True
                st.session_state.active_event_id = "evt_003"
                st.rerun()
        with c4:
            if st.button("🌐 All Alerts (Live)", use_container_width=True,
                         help="Load all active risk events"):
                st.session_state.demo_loaded = True
                st.session_state.active_event_id = "evt_001"
                st.rerun()
        return

    # ── Demo loaded — show intelligence ──
    event_id = st.session_state.active_event_id
    active = get_event_by_id(event_id)
    if not active:
        st.error("Event not found.")
        return

    # Reset button
    col_a, col_b = st.columns([5, 2])
    col_a.markdown("**🌐 Active Disruption Scenario**")
    if col_b.button("🔄 Reset / New Scenario", use_container_width=True):
        st.session_state.demo_loaded = False
        st.session_state.active_event_id = None
        st.rerun()

    render_banner(active)

    col_l, col_r = st.columns(2, gap="large")

    with col_l:
        with st.spinner("Calculating cost impact..."):
            impact = get_impact(event_id, biz_type)
        if impact:
            render_impact_chart(impact)
            st.caption(f"🔍 {impact.get('raw_summary','')}")

    with col_r:
        with st.spinner("⚛️ Running Quantum Optimizer..."):
            rec = get_rec(event_id, biz_type)
        if rec:
            render_rec_card(rec)
            alts = rec.get("alternatives", [])
            if alts:
                with st.expander("📋 View all options"):
                    for a in alts:
                        c1, c2, c3 = st.columns([4, 2, 2])
                        c1.write(a["action"])
                        c2.metric("Profit", f"₹{a['profit_impact_inr']:,.0f}")
                        c3.metric("Risk", f"{int(a['risk_score']*100)}%")

    # Metrics
    if impact and rec:
        st.divider()
        st.subheader("📈 Profit Impact Snapshot")
        baseline = 7_500
        projected = rec.get("profit_impact_inr", baseline)
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("📈 Projected Profit/week", f"₹{projected:,.0f}",
                  f"+₹{projected-baseline:,.0f} vs baseline")
        c2.metric("📉 Margin Impact", f"{impact.get('margin_change',0)*100:+.1f}%",
                  delta_color="inverse" if impact.get("margin_change", 0) < 0 else "normal")
        c3.metric("🛒 Demand Change", f"{impact.get('demand_change',0)*100:+.1f}%",
                  delta_color="inverse" if impact.get("demand_change", 0) < 0 else "normal")
        c4.metric("🔢 Options Evaluated", str(len(rec.get("alternatives", [])) + 1))

    # Action buttons
    st.divider()
    b1, b2, b3, _ = st.columns([2, 2, 2, 4])

    if b1.button("✅ Accept Recommendation", use_container_width=True, type="primary"):
        uid = st.session_state.get("user_id", "demo")
        log_decision(event_id, biz_type, rec.get("recommended_action",""),
                     rec.get("profit_impact_inr", 0), rec.get("generated_by","classical"), uid)
        st.balloons()
        st.success(f"✅ Logged: **{rec.get('recommended_action','')}**")

    if b2.button("📱 WhatsApp Alert", use_container_width=True):
        phone = st.session_state.get("phone", "")
        if phone:
            results = broadcast_alert(active, rec.get("recommended_action",""),
                                      rec.get("profit_impact_inr",0), [phone], lang)
            st.success(f"📱 Alert sent ({results[0].get('mode','simulation')} mode)")
        else:
            st.warning("⚠️ Set your phone in **🏪 My Profile** tab first")

    if b3.button("❌ Dismiss", use_container_width=True):
        st.session_state.demo_loaded = False
        st.session_state.active_event_id = None
        st.warning("Alert dismissed.")
        st.rerun()

    # ── City-adjusted impact ──
    if impact:
        st.divider()
        city = st.session_state.get("selected_city", "Nagpur")
        from engines.city_impact import adjust_impact_for_city
        city_data = adjust_impact_for_city(impact, city)
        st.markdown(f"#### 📍 Impact Adjusted for **{city}** (Tier {city_data.tier} · {city_data.state})")
        cc1, cc2, cc3, cc4 = st.columns(4)
        cc1.metric("City Price Level", f"{city_data.price_multiplier*100:.0f}%", "vs national avg")
        cc2.metric("Margin Impact", f"{city_data.adjusted_margin_change*100:+.1f}%",
                   delta_color="inverse" if city_data.adjusted_margin_change < 0 else "normal")
        cc3.metric("Demand Impact", f"{city_data.adjusted_demand_change*100:+.1f}%",
                   delta_color="inverse" if city_data.adjusted_demand_change < 0 else "normal")
        cc4.metric("Projected Profit", f"₹{city_data.adjusted_profit_inr:,.0f}", "7-day estimate")

    # ── Price Forecast + Download Report ──
    if impact and rec:
        st.divider()
        st.subheader("📈 7-Day Price Forecast")
        from engines.price_forecaster import forecast
        forecasts = forecast(
            commodities=impact.get("commodities", list(impact.get("cost_changes", {}).keys())),
            cost_changes=impact.get("cost_changes", {}),
        )
        forecasts_dicts = [f.to_dict() for f in forecasts]
        render_price_forecast_chart(forecasts_dicts)

        # Download Report
        st.divider()
        from engines.report_generator import generate_csv_report
        csv_data = generate_csv_report(active, impact, rec, forecasts_dicts, biz_type)
        st.download_button(
            label="📅 Download Full Report (CSV)",
            data=csv_data,
            file_name=f"ResilientAI_Report_{active['id']}_{biz_type}.csv",
            mime="text/csv",
            use_container_width=True,
        )


# ══════════════════ TAB 2: PROFIT SIMULATOR ═══════════════════════════════════
def tab_simulator():
    st.subheader("🧮 Profit Simulator")
    st.caption("Test different strategies before committing. See exact ₹ impact in real-time.")
    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**📊 Business Parameters**")
        weekly_rev = st.number_input("Weekly Revenue (₹)", 10_000, 5_00_000, 50_000, step=5_000)
        current_margin_pct = st.slider("Current Margin %", 5, 40, 15)
        commodity_shock_pct = st.slider("Expected Commodity Cost Shock %", 0, 50, 20)

    with col2:
        st.markdown("**⚙️ Strategy Parameters**")
        price_delta = st.number_input("Price increase per unit (₹)", 0.0, 50.0, 2.0, step=0.5)
        extra_units = st.number_input("Extra units to stock up", 0, 500, 10, step=5)
        avg_unit_price = st.number_input("Avg unit selling price (₹)", 10, 500, 50, step=5)

    # Calculations
    margin = current_margin_pct / 100
    shock = commodity_shock_pct / 100
    base_profit = weekly_rev * margin
    cost_hit = weekly_rev * shock * 0.5
    price_gain = (price_delta / avg_unit_price) * weekly_rev * 0.97
    stock_gain = extra_units * avg_unit_price * margin
    projected = base_profit - cost_hit + price_gain + stock_gain

    st.divider()
    st.subheader("📊 Results")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Base Profit", f"₹{base_profit:,.0f}")
    c2.metric("Shock Hit", f"-₹{cost_hit:,.0f}", delta_color="inverse")
    c3.metric("Projected Profit", f"₹{projected:,.0f}",
              f"{projected-base_profit:+,.0f}", delta_color="normal" if projected > base_profit else "inverse")
    c4.metric("New Margin", f"{projected/weekly_rev*100:.1f}%")

    scenarios = {
        "❌ Do Nothing": base_profit - cost_hit,
        "⬆️ Price Only": base_profit - cost_hit + price_gain,
        "📦 Stock Only": base_profit - cost_hit + stock_gain,
        "✅ Price + Stock": projected,
    }
    colors = ["#FF453A" if v < base_profit else "#30D158" for v in scenarios.values()]
    fig = go.Figure(go.Bar(
        x=list(scenarios.keys()), y=list(scenarios.values()),
        marker_color=colors,
        text=[f"₹{v:,.0f}" for v in scenarios.values()], textposition="outside",
    ))
    fig.update_layout(
        title="Strategy Comparison — Weekly Profit",
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(28,28,30,0.9)",
        font=dict(family="Inter", color="#EBEBF5", size=12),
        yaxis=dict(tickprefix="₹", gridcolor="#3A3A3C"),
        height=340, margin=dict(t=45, b=5),
    )
    st.plotly_chart(fig, use_container_width=True)

    if st.button("✅ Adopt Price + Stock Strategy", type="primary"):
        st.success(f"Strategy locked in: +₹{price_delta}/unit · {extra_units} units stocked · Expected: +₹{max(0, projected-base_profit):,.0f}/week")


# ══════════════════ TAB 3: MY PROFILE ═════════════════════════════════════════
def tab_profile():
    st.subheader("🏪 My Business Profile")
    st.caption("Set up once — get personalized alerts forever.")
    st.divider()

    with st.form("onboarding"):
        st.markdown("**Step 1 — About You**")
        c1, c2 = st.columns(2)
        name = c1.text_input("Your Name *", placeholder="Ramesh Sharma")
        phone = c2.text_input("WhatsApp Number *", placeholder="+919876543210")
        lang = st.radio("Preferred Language", ["en", "hi"], horizontal=True,
                        format_func=lambda x: "English 🇬🇧" if x == "en" else "हिंदी 🇮🇳")

        st.markdown("**Step 2 — Your Business**")
        c3, c4 = st.columns(2)
        biz_type = c3.selectbox("Business Type *", ["kirana", "restaurant", "pharma"])
        city = c4.text_input("City *", placeholder="Nagpur, Maharashtra")
        weekly_rev = st.number_input("Approx Weekly Revenue (₹)", 5_000, 10_00_000, 50_000, step=5_000)

        st.markdown("**Step 3 — Alert Preferences**")
        alert_lvl = st.select_slider("Alert me when risk is at least",
                                     options=["LOW", "MEDIUM", "HIGH"], value="MEDIUM")

        saved = st.form_submit_button("💾 Save Profile & Enable WhatsApp Alerts",
                                      use_container_width=True, type="primary")

    if saved:
        if not name or not city:
            st.error("Name and City are required.")
        else:
            profile = save_profile(name, biz_type, city, phone, lang, weekly_rev)
            st.session_state.phone = phone
            st.session_state.user_id = profile["id"]
            st.session_state.lang = lang
            st.balloons()
            st.success(f"✅ Profile saved! Welcome **{name}** · ID: `{profile['id']}`")
            st.info(f"You'll get WhatsApp alerts for **{alert_lvl}** and above risk events.")

    profiles = load_all_profiles()
    if profiles:
        st.divider()
        st.markdown(f"#### 👥 Registered Users ({len(profiles)})")
        for p in profiles:
            st.markdown(f"- **{p['name']}** · {p['business_type']} · {p['city']} · `{p.get('phone','—')}`")


# ══════════════════ TAB 4: DECISION HISTORY ══════════════════════════════════
def tab_history():
    st.subheader("📜 Decision History")
    st.caption("Every recommendation you've acted on — your full audit trail.")
    st.divider()

    uid = st.session_state.get("user_id", "demo")
    history = load_decision_history(uid)

    if not history:
        st.info("No decisions yet. Go to **🌐 Intelligence** tab → load demo → click **✅ Accept Recommendation**")
        return

    total_profit = sum(d.get("profit_impact_inr", 0) for d in history)
    q_count = sum(1 for d in history if d.get("engine") == "quantum")

    c1, c2, c3 = st.columns(3)
    c1.metric("📊 Decisions Made", str(len(history)))
    c2.metric("₹ Total Profit Impact", f"₹{total_profit:,.0f}")
    c3.metric("⚛️ Quantum Decisions", str(q_count))
    st.divider()

    for d in reversed(history):
        ts = d.get("timestamp", "")[:16].replace("T", " ")
        badge = "⚛️" if d.get("engine") == "quantum" else "🔢"
        st.markdown(
            f"**{ts}** &nbsp;→&nbsp; `{d['business_type']}` &nbsp;·&nbsp; "
            f"{badge} **{d['action_taken']}** &nbsp;·&nbsp; +₹{d.get('profit_impact_inr',0):,.0f}"
        )


# ══════════════════ MAIN ══════════════════════════════════════════════════════
def main():
    st.title("🚀 ResilientAI — Supply Intelligence")
    st.caption("Global disruptions → Local decisions for your business, instantly.")

    biz_type, min_risk, lang = sidebar()

    # ↓ TABS — clickable at top of content area ↓
    t1, t2, t3, t4, t5, t6, t7, t8 = st.tabs([
        "🌐  Intelligence",
        "🧮  Profit Simulator",
        "🏪  My Profile",
        "📜  Decision History",
        "📊  Analytics",
        "📍  City Comparison",
        "📦  Alternative Suppliers",
        "💬  AI Assistant",
    ])

    with t1:
        tab_intelligence(biz_type, min_risk, lang)
    with t2:
        tab_simulator()
    with t3:
        tab_profile()
    with t4:
        tab_history()
    with t5:
        tab_analytics(biz_type)
    with t6:
        tab_city_comparison()
    with t7:
        tab_suppliers()
    with t8:
        tab_ai_chat(lang)


# ══════════════════ TAB 6: CITY COMPARISON ════════════════════════════════════
def tab_city_comparison():
    st.subheader("📍 City Impact Comparison")
    st.caption("See how the same disruption hits differently across Indian cities.")
    st.divider()

    from engines.city_impact import compare_cities, ALL_CITIES, TIER_1_CITIES, TIER_2_CITIES, TIER_3_CITIES
    from agents.risk_agent import get_event_by_id
    from engines.impact_engine import predict_impact

    event = get_event_by_id("evt_001")
    if not event:
        st.warning("No event loaded.")
        return

    impact = predict_impact(event, "kirana").to_dict()

    # City selector
    st.markdown("**Compare up to 4 cities:**")
    col1, col2 = st.columns(2)
    with col1:
        selected = st.multiselect(
            "Select cities",
            options=ALL_CITIES,
            default=["Mumbai", "Nagpur", "Jaipur", "Rural Maharashtra"],
            max_selections=6,
        )
    with col2:
        weekly_rev = st.number_input("Weekly Revenue (₹)", 10_000, 5_00_000, 50_000, step=5_000)

    if not selected:
        st.info("Select at least one city above.")
        return

    city_results = compare_cities(impact, selected, weekly_rev)

    # Profit comparison bar chart
    fig_profit = go.Figure(go.Bar(
        x=[c.city for c in city_results],
        y=[c.adjusted_profit_inr for c in city_results],
        marker_color=["#30D158" if c.tier == 1 else "#FF9F0A" if c.tier == 2 else "#FF453A"
                      for c in city_results],
        text=[f"₹{c.adjusted_profit_inr:,.0f}" for c in city_results],
        textposition="outside",
    ))
    fig_profit.update_layout(
        title="Projected 7-Day Profit by City (Hormuz Scenario)",
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(28,28,30,0.9)",
        font=dict(family="Inter", color="#EBEBF5", size=12),
        yaxis=dict(tickprefix="₹", gridcolor="#3A3A3C"),
        height=320, margin=dict(t=45, b=5),
    )
    st.plotly_chart(fig_profit, use_container_width=True)

    # Tier legend
    st.caption("🟢 Tier 1 (Metro) &nbsp; 🟡 Tier 2 (City) &nbsp; 🔴 Tier 3 (Rural)")
    st.divider()

    # City detail cards
    st.markdown("#### 📊 City Breakdown")
    cols = st.columns(min(len(city_results), 3))
    for i, cr in enumerate(city_results):
        with cols[i % 3]:
            tier_color = "#30D158" if cr.tier == 1 else "#FF9F0A" if cr.tier == 2 else "#FF453A"
            st.markdown(f"""
            <div style="background:#1C1C1E;border:1px solid #3A3A3C;border-radius:12px;padding:14px;margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                    <span style="font-weight:700;color:#EBEBF5">{cr.city}</span>
                    <span style="color:{tier_color};font-size:12px;font-weight:600">TIER {cr.tier}</span>
                </div>
                <div style="font-size:12px;color:#8E8E93;margin-bottom:10px">{cr.state}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
                    <div><span style="color:#8E8E93">Price Level</span><br><b>{cr.price_multiplier*100:.0f}%</b></div>
                    <div><span style="color:#8E8E93">Margin Hit</span><br><b style="color:#FF453A">{cr.adjusted_margin_change*100:+.1f}%</b></div>
                    <div><span style="color:#8E8E93">Demand</span><br><b>{cr.adjusted_demand_change*100:+.1f}%</b></div>
                    <div><span style="color:#8E8E93">Profit</span><br><b style="color:#FFD60A">₹{cr.adjusted_profit_inr:,.0f}</b></div>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Key insight
    best = max(city_results, key=lambda c: c.adjusted_profit_inr)
    worst = min(city_results, key=lambda c: c.adjusted_profit_inr)
    st.info(f"💡 **Best outcome:** {best.city} (₹{best.adjusted_profit_inr:,.0f}) · "
            f"**Most affected:** {worst.city} (₹{worst.adjusted_profit_inr:,.0f}) — "
            f"**{((best.adjusted_profit_inr - worst.adjusted_profit_inr)/worst.adjusted_profit_inr*100):.0f}% gap** between metro and rural MSMEs")


# ══════════════════ TAB 7: SUPPLIERS ═════════════════════════════════════════
def tab_suppliers():
    st.subheader("📦 Alternative Suppliers")
    st.caption("Find verified backup suppliers for disrupted commodities.")
    st.divider()

    from agents.risk_agent import get_event_by_id
    from engines.supplier_engine import get_suppliers_for_commodities
    
    event = get_event_by_id(st.session_state.get("active_event_id", "evt_001") or "evt_001")
    if not event:
        st.warning("No disruption event loaded.")
        return
        
    comms = event.get("commodities_affected", [])
    st.markdown(f"**Disrupted Commodities:** `{'`, `'.join(comms)}`")
    
    suppliers_map = get_suppliers_for_commodities(comms)
    
    if not suppliers_map:
        st.info("No supplier records found for these commodities.")
        return
        
    for comm, suppliers in suppliers_map.items():
        st.markdown(f"### {comm.title().replace('_', ' ')}")
        if not suppliers:
            st.warning("No alternatives found.")
            continue
            
        cols = st.columns(min(len(suppliers), 3))
        for i, s in enumerate(suppliers):
            with cols[i % 3]:
                st.markdown(f"""
                <div style="background:#1C1C1E;border:1px solid #3A3A3C;border-radius:12px;padding:14px;margin-bottom:12px">
                    <div style="font-weight:700;color:#EBEBF5;margin-bottom:4px">{s.get('name')}</div>
                    <div style="font-size:12px;color:#8E8E93;margin-bottom:10px">{s.get('type').upper()}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
                        <div><span style="color:#8E8E93">Contact</span><br><b>{s.get('contact')}</b></div>
                        <div><span style="color:#8E8E93">Lead Time</span><br><b>{s.get('lead_time_days')} days</b></div>
                        <div><span style="color:#8E8E93">Availability</span><br><b style="color:#30D158">{s.get('availability', '').upper()}</b></div>
                    </div>
                    <div style="font-size:12px;color:#AEAEB2;margin-top:10px;padding-top:10px;border-top:1px solid #3A3A3C">
                        <i>{s.get('note')}</i>
                    </div>
                </div>
                """, unsafe_allow_html=True)
        st.divider()


# ══════════════════ TAB 8: AI CHAT ═══════════════════════════════════════════
def tab_ai_chat(lang: str):
    st.subheader("💬 Supply Chain AI Assistant")
    st.caption("Ask specific questions about the ongoing disruptions and local strategies.")
    st.divider()
    
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I am ResilientAI. How can I help you navigate the current supply chain disruptions?" if lang == "en" else "नमस्ते! मैं ResilientAI हूँ। मैं आपूर्ति श्रृंखला में चल रही समस्याओं से निपटने में आपकी कैसे मदद कर सकता हूँ?"}
        ]

    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # React to user input
    if prompt := st.chat_input("Ask ResilientAI..." if lang == "en" else "ResilientAI से पूछें..."):
        # Display user message in chat message container
        st.chat_message("user").markdown(prompt)
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        RESP = {
            "en": {
                "lpg": "The Hormuz disruption is severely impacting LPG. Expect a 20% price hike. Our recommendation is to stock up on at least 10 extra cylinders now.",
                "wheat": "Due to the Ukraine conflict, global wheat prices are up 15%. I suggest negotiating a bulk contract with NAFED or local mills immediately.",
                "delivery": "Delivery times for imported goods will be delayed by 5-7 days. Notify your customers in advance to manage expectations.",
                "default": "I'm analyzing the latest global events. Based on current data, focus on securing alternative suppliers and adjusting your pricing to protect margins."
            },
            "hi": {
                "lpg": "होर्मुज संकट का LPG पर भारी असर पड़ रहा है। 20% कीमत बढ़ने की उम्मीद है। हमारी सलाह है कि अभी कम से कम 10 एक्स्ट्रा सिलेंडर स्टॉक कर लें।",
                "wheat": "यूक्रेन विवाद के कारण गेहूं की कीमतें 15% बढ़ गई हैं। मैं NAFED या स्थानीय मिलों के साथ थोक अनुबंध करने का सुझाव देता हूँ।",
                "delivery": "आयातित माल की डिलीवरी में 5-7 दिन की देरी होगी। उम्मीदों का प्रबंधन करने के लिए अपने ग्राहकों को पहले ही सूचित करें।",
                "default": "मैं नवीनतम वैश्विक घटनाओं का विश्लेषण कर रहा हूँ। मौजूदा डेटा के आधार पर, वैकल्पिक आपूर्तिकर्ताओं को सुरक्षित करने और अपने मार्जिन को बचाने के लिए अपनी कीमतों को समायोजित करने पर ध्यान दें।"
            }
        }
        
        reply_dict = RESP.get(lang, RESP["en"])
        q = prompt.lower()
        response_text = next((v for k, v in reply_dict.items() if k in q), reply_dict["default"])
        
        # Display assistant response in chat message container
        with st.chat_message("assistant"):
            st.markdown(response_text)
        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": response_text})


if __name__ == "__main__":
    main()
