#!/bin/bash
# Stop script - Stops all services

echo "🛑 Stopping all services..."

pkill -f 'gateway.server' 2>/dev/null
pkill -f 'http.server 3001' 2>/dev/null
pkill -f 'vite' 2>/dev/null

sleep 1

echo "✅ All services stopped!"

