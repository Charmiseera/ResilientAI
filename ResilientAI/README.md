# ResilientAI 🚀

> Autonomous Supply Intelligence for MSMEs — Global events → Local decisions, instantly.

## Stack
- **Backend:** FastAPI + Python 3.11
- **AI Agent:** LangChain (ReAct)
- **Optimizer:** Qiskit QAOA + NumPy fallback
- **Dashboard:** Streamlit
- **NLP:** spaCy
- **Voice:** SpeechRecognition + gTTS

## Quick Start

```powershell
# 1. Clone and enter project
cd d:\MSC\ResilientAI

# 2. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download spaCy model
python -m spacy download en_core_web_sm

# 5. Set up environment
Copy-Item .env.example .env
# Edit .env — set USE_SEED_DATA=true for demo mode (no API key needed)

# 6. Run API (Terminal 1)
uvicorn api.main:app --reload --port 8000

# 7. Run Dashboard (Terminal 2)
streamlit run dashboard/app.py
```

## Demo Flow
1. Open http://localhost:8501
2. Click **"🎬 Load Demo: Hormuz Scenario"**
3. Watch: Risk Alert → Impact → Recommendation appear in real time
4. Click **"Accept Recommendation"** to log decision

## Project Structure
```
ResilientAI/
├── agents/          # Risk Detection Agent (LangChain)
├── engines/         # Impact Prediction + Quantum Optimizer
├── api/             # FastAPI backend (5 endpoints)
├── dashboard/       # Streamlit UI
├── voice/           # STT + TTS (bonus)
├── data/            # Seed data, commodity baselines
└── tests/           # Unit + integration tests
```
