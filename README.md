# GPU Usage Tracker (Node + Express)

## Run
1. Install Node.js (https://nodejs.org)
2. Open a terminal in this folder
3. npm install
4. npm start
5. Open http://localhost:3000

## Files
- server.js        -> Express server + API
- data.json        -> created automatically, stores sessions
- public/index.html, style.css, script.js -> frontend

## API
- GET    /api/gpus
- GET    /api/sessions
- POST   /api/sessions   { "gpu": "NVIDIA T4", "seconds": 120 }
- DELETE /api/sessions
