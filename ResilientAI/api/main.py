"""
FastAPI application entry point.
Run with: uvicorn api.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import alerts, impact, recommend, simulate, voice

app = FastAPI(
    title="ResilientAI API",
    description="Autonomous Supply Intelligence for MSMEs — Global events → Local decisions.",
    version="1.0.0",
)

# Allow Streamlit dashboard (localhost:8501) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
app.include_router(impact.router, prefix="/api/v1", tags=["Impact"])
app.include_router(recommend.router, prefix="/api/v1", tags=["Recommend"])
app.include_router(simulate.router, prefix="/api/v1", tags=["Simulate"])
app.include_router(voice.router, prefix="/api/v1", tags=["Voice"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "product": "ResilientAI", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
