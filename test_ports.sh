#!/bin/bash
echo "Testing ports..."
echo ""
echo "Port 3000 (Dashboard):"
curl -s http://localhost:3000 2>&1 | head -3
echo ""
echo ""
echo "Port 3001 (Landing Page):"
curl -s http://localhost:3001/index.html 2>&1 | head -3
