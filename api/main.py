"""
FastAPI application entry point.
Run locally with: uvicorn api.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import alerts, impact, recommend, simulate, voice, decisions, cities, forecast, whatsapp, report

app = FastAPI(
    title="ResilientAI API",
    description="Autonomous Supply Intelligence for MSMEs — Global events → Local decisions.",
    version="1.0.0",
)

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
app.include_router(decisions.router, prefix="/api/v1", tags=["Decisions & Tracking"])
app.include_router(cities.router,    prefix="/api/v1", tags=["Cities"])
app.include_router(forecast.router,  prefix="/api/v1", tags=["Forecast"])
app.include_router(whatsapp.router,  prefix="/api/v1", tags=["WhatsApp"])
app.include_router(report.router,    prefix="/api/v1", tags=["Report"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "product": "ResilientAI", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
