#!/bin/bash
# Fixed startup script - ensures proper port separation

echo "🛑 Stopping any existing servers..."
pkill -f "gateway.server" 2>/dev/null
pkill -f "http.server" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

echo "🚀 Starting AI Prompt Firewall..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    exit 1
fi

# Activate venv
source venv/bin/activate
export DEMO_MODE=true

# Start gateway
echo "✅ Starting gateway on port 8000..."
python -m gateway.server > gateway.log 2>&1 &
GATEWAY_PID=$!
sleep 3

# Start landing page (MUST be from root directory)
echo "✅ Starting landing page on port 3001..."
cd "$SCRIPT_DIR"
python3 -m http.server 3001 > landing.log 2>&1 &
LANDING_PID=$!
sleep 2

# Verify landing page
if curl -s http://localhost:3001/index.html | grep -q "AI Prompt Firewall"; then
    echo "   ✓ Landing page verified"
else
    echo "   ⚠️  Landing page check failed"
fi

# Start dashboard
echo "✅ Starting dashboard on port 3000..."
cd "$SCRIPT_DIR/dashboard"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install > /dev/null 2>&1
fi
npm run dev > ../dashboard.log 2>&1 &
DASHBOARD_PID=$!
sleep 3

echo ""
echo "✅ Everything is running!"
echo ""
echo "📍 URLs:"
echo "   Landing Page: http://localhost:3001"
echo "   Dashboard:    http://localhost:3000"
echo "   Gateway API:  http://localhost:8000"
echo ""
echo "💡 If you see the dashboard on both ports, try:"
echo "   1. Hard refresh (Cmd+Shift+R)"
echo "   2. Clear browser cache"
echo "   3. Use incognito/private window"
echo ""
echo "🛑 To stop: ./stop.sh or Ctrl+C"
echo ""

# Save PIDs for stop script
echo "$GATEWAY_PID $LANDING_PID $DASHBOARD_PID" > .pids

# Wait
trap "echo ''; echo '🛑 Stopping...'; ./stop.sh; exit" INT
wait
