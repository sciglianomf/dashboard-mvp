#!/bin/bash

echo "🚀 Iniciando Dashboard Innovación & Creatividad..."
echo ""

# Start backend in background
echo "▶ Backend en http://localhost:3001"
cd "$(dirname "$0")/backend" && npm start &
BACKEND_PID=$!

sleep 1

# Start frontend
echo "▶ Frontend en http://localhost:5173"
cd "$(dirname "$0")/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Dashboard listo en http://localhost:5173"
echo "   Presioná Ctrl+C para detener todo."
echo ""

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Dashboard detenido.'" EXIT
wait
