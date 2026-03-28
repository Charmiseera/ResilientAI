#!/bin/bash
# Continuously run Streamlit for ResilientAI
while true; do
  echo "[`date '+%Y-%m-%d %H:%M:%S'`] Starting Streamlit..."
  streamlit run ResilientAI/dashboard/app.py
  echo "Streamlit exited. Restarting in 5 seconds..."
  sleep 5
done
