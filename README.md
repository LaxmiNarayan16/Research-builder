# Research Brief Generator

Full-stack app that accepts 5-10 URLs, scrapes and cleans content, then generates an AI-structured research brief.

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- AI: OpenAI or Gemini (configurable via env)
- Scraping/Cleaning: Readability + Cheerio
- Storage: localStorage (last 5 briefs)

## Setup

1. Install deps:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
2. Create `backend/.env`:
   - `OPENAI_API_KEY=your_key`
   - `OPENAI_MODEL=gpt-4o-mini` (optional)
   - `LLM_PROVIDER=openai` (or `gemini`)
   - `GEMINI_API_KEY=your_gemini_key` (required only when using Gemini)
   - `GEMINI_MODEL=gemini-1.5-flash` (optional when using Gemini)
   - `DATABASE_URL=...` (optional, status page display only)
3. Create `frontend/.env`:
   - `VITE_API_BASE_URL=http://localhost:4000`
4. Run backend: `cd backend && npm run dev`
5. Run frontend: `cd frontend && npm run dev`

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

## Done

- URL input (5-10) with validation and error states.
- Fetch and clean source content from each URL.
- LLM-powered structured brief generation with strict JSON shape (OpenAI or Gemini).
- Brief UI sections: summary, key points with source+snippet, conflicting claims, verify checklist.
- Sources breakdown page with extracted title/content preview and usage hints.
- History page storing last 5 briefs.
- Status page showing backend/database/llm config health.
- Basic rate limiting on backend API.
- Bonus: search within brief + copy brief JSON + PDF download.

## Not Done

- Real database persistence and DB ping.
- Headless browser fallback scraper (Puppeteer).
- Automated tests.

## API

- `GET /`
- `GET /health`
- `GET /status`
- `POST /fetch-content` -> `{ sources: [{ url, title, cleanedText, preview, ... }], failed: [] }`
- `POST /generate-brief` -> `{ summary, keyPoints, conflictingClaims, verifyChecklist, ... }`

## Deploy (GitHub + Live)

1. Push code to GitHub (do not commit any real `.env` files).
2. Deploy backend on Render/Railway:
   - Root directory: `backend`
   - Start command: `npm start`
   - Env vars: `LLM_PROVIDER`, provider keys, `DATABASE_URL` (optional)
3. Deploy frontend on Vercel/Netlify:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Env var: `VITE_API_BASE_URL=https://<your-backend-domain>`
4. After deploy, open frontend live URL and test `/status` and brief generation.

## Security Note

- Rotate any API keys that were exposed during local testing.
