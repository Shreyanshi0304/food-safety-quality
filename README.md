# Food Safety & Quality Reporter — Frontend handoff

React + Vite frontend template for the hackathon prototype.

## Files
- `src/App.jsx` — interface and API interactions
- `src/styles.css` — responsive styling
- `src/main.jsx` — React entry point
- `index.html`, `package.json`, `vite.config.js` — Vite setup
- `.env.example` — API URL configuration

## Run
1. Install Node.js LTS.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to `.env` if the backend URL needs changing.
4. Run `npm run dev`.

## Expected backend routes
- `GET /api/cases`
- `POST /api/cases`
- `POST /api/cases/{case_number}/review`
- `POST /api/cases/{case_number}/workflow`
- `GET /api/dashboard`

If the existing backend schemas use different payload field names, adjust the API calls in `src/App.jsx` to match. Review, authority routing and lab workflow are demo-only; no actual authority or laboratory integration is included.
