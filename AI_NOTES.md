# AI_NOTES

## What AI Was Used For

- Rapid scaffolding of frontend and backend project structure.
- Drafting initial React components and Express API handlers.
- Iterative refactoring of summary and key-point generation logic.
- UI copy suggestions and quick polishing of page structure.

## What Was Checked Manually

- Verified backend starts and routes respond (`/health`, `/status`, core POST APIs).
- Verified frontend builds successfully and routes render (`Home`, `Dashboard`, `Status`, `Sources`, `History`).
- Manually checked URL input validation and error handling behavior.
- Manually reviewed generated brief output quality and revised logic for noisy content.

## LLM + Provider Used In This App

- Runtime brief generation uses **OpenAI** via `chat.completions`.
- Provider: **OpenAI**
- Default model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`)
- API key env var: `OPENAI_API_KEY`

## Why This Choice

- Chosen for reliable JSON output support and good latency/cost tradeoff for MVP use.
- Model selection keeps generation affordable while producing structured responses.
