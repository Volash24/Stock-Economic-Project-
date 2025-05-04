#!/bin/bash

# Start Flask backend (from root)
echo "Starting Flask backend (app.py)..."
python3 app.py &

FLASK_PID=$!
sleep 3  # Let Flask spin up

# Start Next.js frontend
echo "Starting Next.js frontend..."
cd frontend
npm run dev

# Kill Flask server when frontend exits
kill $FLASK_PID
