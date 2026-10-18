#!/usr/bin/env bash
# ==============================================================================
# Aadish Jain — PM Portfolio Local Runner
# Automatically starts local server & opens in default browser
# ==============================================================================

PORT=8000

# Check if port is already in use; if so, find next free port
while lsof -i :$PORT >/dev/null 2>&1; do
    echo "⚠️  Port $PORT is already in use. Checking port $((PORT + 1))..."
    PORT=$((PORT + 1))
done

echo "--------------------------------------------------------"
echo "🚀 Launching Aadish Jain's PM Portfolio locally!"
echo "📍 URL: http://localhost:$PORT"
echo "💡 Press Ctrl+C in this terminal to stop the server"
echo "--------------------------------------------------------"

# Open the site in your default browser after a brief delay
(sleep 0.8 && open "http://localhost:$PORT") &

# Run Python's built-in static server
python3 -m http.server $PORT
