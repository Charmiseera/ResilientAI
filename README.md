# ResilientAI 🚀

> **Autonomous Supply Intelligence for MSMEs — Global events → Local decisions, instantly.**

ResilientAI is a Decision Intelligence platform that converts global supply chain disruptions into real-time, actionable recommendations for small and micro businesses (MSMEs). If the Strait of Hormuz closes today, a kirana owner in Pune shouldn't have to wait 3 weeks to see prices spike — ResilientAI predicts the cost impact immediately and surfaces the single best action to take.

> *"If Bloomberg Terminal is for Wall Street, ResilientAI is for Main Street."*

---

## 📋 Table of Contents

1. [The Problem](#-the-problem)
2. [Core Features](#-core-features)
3. [Technology Stack](#-technology-stack)
4. [Repository Structure](#-repository-structure)
5. [API Endpoints](#-api-endpoints)
6. [Quick Start Guide](#-quick-start-guide)
7. [Environment Variables](#-environment-variables)
8. [Running Tests](#-running-tests)
9. [Typical Demo Flow](#-typical-demo-flow)
10. [Deployment](#-deployment)
11. [Roadmap](#-roadmap)
12. [License](#-license)

---

## 🧩 The Problem

63 million MSMEs in India operate with zero access to real-time supply intelligence. When global disruptions occur — geopolitical conflicts, energy crises, commodity shocks — the impact cascades rapidly from global trade routes to local shelves, but small business owners find out weeks too late.

| What MSMEs Have Today | What ResilientAI Provides |
|----------------------|--------------------------|
| WhatsApp rumours | Verified, AI-qualified risk alerts |
| Reactive pricing | Predictive, data-driven recommendations |
| Gut-instinct decisions | Quantum-optimized trade-off analysis |
| No foresight tools | Global → local impact mapping in seconds |

**Example chain:** Strait of Hormuz closure → LPG price +20% → Transport cost +12% → Product margin -8% → Recommended action delivered in < 5 minutes.

---

## ✨ Core Features

### 🌍 1. Risk Detection Agent
- Autonomously scans global news feeds and geopolitical datasets via **NewsAPI**.
- Performs NLP keyword extraction and named entity recognition using **spaCy**.
- Classifies events as `LOW`, `MEDIUM`, or `HIGH` risk with a confidence score.
- Tags affected commodity classes (LPG, fuel, FMCG, pharma, agri).
- Powered by a **LangChain ReAct** agent with optional OpenAI / Gemini backends.

### 📉 2. Impact Prediction Engine
- Maps global risk events directly to quantified local business cost impacts (in ₹ and %).
- Models cascading factor effects through causal chains (e.g., LPG drop → transport rise → margin compression).
- Computes city-level impact comparisons across logistics hubs.
- Outputs predictions with a confidence interval for transparency.

### 🧠 3. Quantum-Inspired Optimization Engine
- Evaluates competing multi-variable trade-off strategies using **Qiskit QAOA**.
- Considers price delta, inventory delta, supplier switching costs, and demand elasticity.
- Objective: maximise expected 7-day profit per decision.
- Automatic **NumPy classical fallback** if Qiskit runtime exceeds 10 seconds.
- Returns a ranked list of actions with human-readable rationale.

### 🗺️ 4. 3D City Comparison Intelligence
- Fully interactive **MapLibre GL** 3D globe visualization in the Next.js dashboard.
- Compare city-specific resilience metrics, vulnerability scores, and logistics hub exposure in real time.

### 🎙️ 5. Voice-Activated Intelligence
- Ask supply chain questions in plain language or Hindi (e.g., *"Gas price badhega kya?"*).
- **SpeechRecognition** for STT + **gTTS** for audio response synthesis.
- Integrated with language detection and impact engine queries.

### 📲 6. WhatsApp Alert Integration
- Proactive push alerts via **Meta WhatsApp Business API**.
- Sends risk alerts and recommended actions directly to MSME owners' phones.
- Webhook-based two-way messaging support.

### 📊 7. Profit Simulation Sandbox
- Simulate "what-if" scenarios: price increase, inventory stock-up, supplier switch.
- Visualises projected revenue, profit, and margin for each strategy.

### 📈 8. Forecast & Report Generation
- Price forecaster for key commodity categories.
- Exportable report generation per disruption event.

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui |
| **Geospatial** | MapLibre GL 5 (3D globe) |
| **Charts** | Recharts |
| **Backend API** | FastAPI · Python 3.11 · Uvicorn |
| **AI Agent** | LangChain (ReAct) · OpenAI · Google Gemini · Nebius AI |
| **NLP** | spaCy (`en_core_web_sm`) · langdetect |
| **Optimization** | Qiskit 1.0 (QAOA) · Qiskit Aer · NumPy (classical fallback) |
| **Voice** | SpeechRecognition · gTTS · PyAudio |
| **Database** | Supabase (PostgreSQL) |
| **Messaging** | Meta WhatsApp Business API |
| **Data Sources** | NewsAPI · Custom commodity CSV baselines |
| **Deployment** | Railway |

---

## 📁 Repository Structure

```
ResilientAI/
├── .env.example            # Environment variable template
├── .env.railway            # Railway-specific deployment config
├── Procfile                # Process definition for Railway deployment
├── railway.json            # Railway project configuration
├── requirements.txt        # Python dependencies
├── pytest.ini              # Pytest configuration
│
├── agents/                 # AI Risk Detection & News Intelligence
│   ├── news_fetcher.py     # NewsAPI integration & headline polling
│   ├── nlp_classifier.py   # spaCy NLP keyword extraction & classification
│   └── risk_agent.py       # LangChain ReAct agent for risk scoring
│
├── api/                    # FastAPI Backend
│   ├── main.py             # App entry point & middleware configuration
│   ├── models.py           # Pydantic request/response data models
│   └── routes/             # API route handlers
│       ├── alerts.py       # GET  /api/v1/alerts
│       ├── impact.py       # POST /api/v1/impact
│       ├── recommend.py    # POST /api/v1/recommend
│       ├── simulate.py     # POST /api/v1/simulate
│       ├── voice.py        # POST /api/v1/voice
│       ├── decisions.py    # GET/POST /api/v1/decisions
│       ├── cities.py       # GET  /api/v1/cities
│       ├── forecast.py     # GET  /api/v1/forecast
│       ├── whatsapp.py     # POST /api/v1/whatsapp (webhook)
│       └── report.py       # GET  /api/v1/report
│
├── engines/                # Core Intelligence Engines
│   ├── impact_engine.py    # Global risk → local cost impact calculator
│   ├── optimizer.py        # Qiskit QAOA optimizer + NumPy fallback
│   ├── risk_scorer.py      # Risk level scoring logic
│   ├── city_impact.py      # City-level comparative impact engine
│   ├── price_forecaster.py # Commodity price forecasting
│   ├── supplier_engine.py  # Alternative supplier recommendations
│   ├── report_generator.py # PDF/JSON report generation
│   ├── user_store.py       # User business profile management
│   └── database.py         # Supabase database client
│
├── data/                   # Seed Data & Baselines
│   ├── commodity_baselines.csv  # Baseline prices for key commodities
│   ├── impact_rules.json        # Causal chain rules for impact calculation
│   ├── seed_events.json         # Pre-seeded disruption events for demo mode
│   └── suppliers.json           # Supplier directory dataset
│
├── frontend/               # Next.js Web Dashboard
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Reusable React components
│   ├── lib/                # Shared utilities and API client
│   ├── middleware.ts        # Next.js middleware (auth, routing)
│   └── public/             # Static assets
│
├── tests/                  # Pytest Test Suite
│   ├── test_impact_engine.py    # Impact engine unit tests
│   ├── test_optimizer.py        # Qiskit optimizer unit tests
│   ├── test_risk_agent.py       # Risk detection agent tests
│   └── test_meta_whatsapp.py    # WhatsApp webhook integration tests
│
└── voice/                  # Voice Processing Module
    └── whatsapp.py         # STT / TTS pipeline & voice query handler
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api/v1`  
Interactive docs: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts` | Returns current active risk alerts |
| `POST` | `/impact` | Calculate business impact from a risk event |
| `POST` | `/recommend` | Get quantum-optimized decision recommendation |
| `POST` | `/simulate` | Run profit simulation for a proposed action |
| `POST` | `/voice` | Submit a voice/text query and get audio + text response |
| `GET/POST` | `/decisions` | Log and retrieve accepted decisions |
| `GET` | `/cities` | City-level resilience and impact comparison data |
| `GET` | `/forecast` | Commodity price forecast for selected categories |
| `POST` | `/whatsapp` | Meta WhatsApp webhook for push alerts |
| `GET` | `/report` | Generate disruption impact report |

<details>
<summary>Example: POST /impact</summary>

**Request:**
```json
{ "event_id": "evt_001", "business_type": "kirana" }
```

**Response:**
```json
{
  "LPG_price_change": 0.20,
  "transport_cost_change": 0.12,
  "product_margin_change": -0.08,
  "demand_change": -0.05,
  "confidence_interval": 0.03
}
```
</details>

<details>
<summary>Example: POST /recommend</summary>

**Request:**
```json
{ "impact_id": "imp_001" }
```

**Response:**
```json
{
  "action": "Stock 10 extra units + raise price by ₹2",
  "reason": "Minimizes expected loss, maximizes 7-day profit",
  "profit_impact_inr": 1200,
  "generated_by": "quantum",
  "alternatives": [
    { "action": "Price increase only", "profit_impact": "+₹600" },
    { "action": "Switch supplier", "profit_impact": "+₹400", "risk": "HIGH" }
  ]
}
```
</details>

<details>
<summary>Example: POST /voice</summary>

**Request:**
```json
{ "query": "Gas price badhega kya?", "lang": "hi" }
```

**Response:**
```json
{
  "text": "Haan, LPG price 20% badhega. 10 unit extra stock karo.",
  "audio_base64": "<base64_mp3>"
}
```
</details>

---

## 🚀 Quick Start Guide

### Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/en)
- API keys (see [Environment Variables](#-environment-variables))

---

### 1. Clone the Repository

```bash
git clone https://github.com/Charmiseera/ResilientAI.git
cd ResilientAI
```

### 2. Set Up the Python Backend

```bash
# Create and activate virtual environment
python -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Download the spaCy NLP model
python -m spacy download en_core_web_sm
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your API keys (see section below)
```

> **Demo Mode:** Set `USE_SEED_DATA=true` and `DEMO_MODE=true` in `.env` to run fully on pre-seeded data without any external API keys.

### 4. Start the Backend API

```bash
uvicorn api.main:app --reload --port 8000
```

- API base: `http://localhost:8000`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`

### 5. Start the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: `http://localhost:3000`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and populate the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_SEED_DATA` | No | `true` = use mock seeded data (safe for demo) |
| `DEMO_MODE` | No | `true` = run in full demo mode |
| `DEMO_SCENARIO` | No | Default scenario (e.g. `hormuz_disruption`) |
| `GEMINI_API_KEY` | For AI | [Google AI Studio](https://aistudio.google.com/) |
| `NEBIUS_API_KEY` | For AI | [Nebius AI](https://nebius.ai/) |
| `NEWS_API_KEY` | For live news | [newsapi.org](https://newsapi.org/) (free tier) |
| `SUPABASE_URL` | For DB | Your Supabase project URL |
| `SUPABASE_KEY` | For DB | Supabase anon or service role key |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Same as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon key |
| `IBM_QUANTUM_TOKEN` | For Qiskit | [quantum.ibm.com](https://quantum.ibm.com/) (free) |
| `QUANTUM_TIMEOUT_SECONDS` | No | Fallback timeout (default: `10`) |
| `WHATSAPP_TOKEN` | For WhatsApp | Meta Business API token |
| `WHATSAPP_PHONE_NUMBER_ID` | For WhatsApp | Meta phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | For WhatsApp | Meta business account ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Frontend map | Google Maps API key |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL (default: `http://localhost:8000/api/v1`) |

---

## 🧪 Running Tests

```bash
# Run the full test suite
pytest

# Run a specific test file
pytest tests/test_impact_engine.py -v
pytest tests/test_optimizer.py -v
pytest tests/test_risk_agent.py -v
pytest tests/test_meta_whatsapp.py -v
```

---

## 🎯 Typical Demo Flow

1. Open `http://localhost:3000` in your browser.
2. In the **Intelligence Panel**, select a simulated global event (e.g., *Hormuz Disruption*).
3. The **Risk Detection Agent** scores the event: `Risk: HIGH | Confidence: 92%`.
4. The **Impact Engine** calculates: LPG +20% · Transport +12% · Margin -8%.
5. The **Quantum Optimizer** recommends: *"Stock 10 extra units + raise price by ₹2 → Est. +₹1,200/week"*.
6. Switch to the **City Comparisons** tab for the interactive 3D MapLibre globe showing affected regions.
7. Use the **Voice** panel to ask: *"Gas price badhega kya?"* and hear an audio response.
8. Use the **Simulation** panel to model alternative pricing or inventory strategies.

---

## ☁️ Deployment

This project is configured for one-click deployment on **[Railway](https://railway.app/)**.

The repository includes:
- `Procfile` — defines the web process (`uvicorn api.main:app --host 0.0.0.0 --port $PORT`)
- `railway.json` — Railway project configuration
- `.env.railway` — Railway-specific environment variable template

The Next.js frontend can be deployed independently to **Vercel** (a `vercel.json` is included in the `frontend/` directory).

---

## 🗺️ Roadmap

```
MVP (Now)          v1.5 (Month 3)       v2.0 (Month 6)       v3.0 (Year 2)
────────────────   ─────────────────    ─────────────────    ─────────────────
Kirana stores      + Pharma stores      + Agri / logistics   Global expansion
Next.js dashboard  + WhatsApp alerts    + Native mobile app  Multi-country data
Qiskit simulator   + Real-time pricing  + Real quantum HW    Enterprise SaaS
3 core decisions   + Supplier directory + Predictive trends  Platform API
```

**Sector Expansion Path:**
- **Now:** Kirana / general retail
- **Month 3:** Pharmaceutical distributors
- **Month 6:** Restaurants, food & beverage
- **Year 2:** Agri-logistics, manufacturing MSMEs

---

## 🛡️ License

Built for real-world impact. See [ResilientAI_PRD.md](./ResilientAI_PRD.md) for the full Product Requirements Document.
