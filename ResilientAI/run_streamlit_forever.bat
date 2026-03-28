@echo off
REM Continuously run Streamlit for ResilientAI from Windows CMD
REM Adjust path if needed; this assumes the script is at the repo root
set REPO_ROOT=%~dp0
cd /d "%REPO_ROOT%ResilientAI"
:
echo [%date% %time%] Starting Streamlit...
streamlit run dashboard/app.py
echo Streamlit exited with code %ERRORLEVEL%. Restarting in 5 seconds...
timeout /t 5 >nul
goto :
