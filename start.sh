#!/bin/bash
# Start script for local development
# Starts gateway, landing page, and dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting LLM Intercept locally..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating venv..."
    python3 -m venv venv
    echo "Installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
fi

# Activate venv
source venv/bin/activate

# Set demo mode
export DEMO_MODE=true

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    killall -9 python3 2>/dev/null || true
    killall -9 node 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start gateway
echo "✅ Starting gateway on port 8000..."
cd "$SCRIPT_DIR"
python -m uvicorn gateway.server:app --host 0.0.0.0 --port 8000 > gateway.log 2>&1 &
GATEWAY_PID=$!
sleep 2

# Start landing page
echo "✅ Starting landing page on port 3001..."
cd "$SCRIPT_DIR"
python3 -m http.server 3001 > landing.log 2>&1 &
LANDING_PID=$!
sleep 1

# Check if dashboard node_modules exists
if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Installing dashboard dependencies..."
    cd dashboard
    npm install
    cd ..
fi

# Start dashboard
echo "✅ Starting dashboard on port 3000..."
cd dashboard
npm run dev > ../dashboard.log 2>&1 &
DASHBOARD_PID=$!
sleep 3

echo ""
echo "✨ All services started!"
echo ""
echo "📍 URLs:"
echo "   Landing Page: http://localhost:3001"
echo "   Dashboard:    http://localhost:3000"
echo "   Gateway API:  http://localhost:8000"
echo ""
echo "📝 Logs:"
echo "   Gateway:   tail -f gateway.log"
echo "   Landing:   tail -f landing.log"
echo "   Dashboard: tail -f dashboard.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
