#!/bin/bash
# Quick script to run everything locally

echo "🚀 Starting AI Prompt Firewall locally..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Set demo mode
export DEMO_MODE=true

echo "✅ Starting gateway server..."
echo "   Gateway will run on: http://localhost:8000"
echo ""
echo "📝 In another terminal, run:"
echo "   python3 -m http.server 3000"
echo ""
echo "🌐 Then open: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the gateway"
echo ""

# Start gateway
python -m gateway.server
