import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAndValidateUrls } from "./utils/urlValidation.js";
import { extractContentFromUrl } from "./services/contentExtractor.js";
import { generateBriefWithOpenAI } from "./services/aiBriefGenerator.js";
import { generateResearchBrief } from "./services/briefGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a minute and try again." }
  })
);

app.get("/", (req, res) => {
  res.json({
    name: "Research Brief Builder API",
    status: "running",
    endpoints: ["/health", "/fetch-content", "/generate-brief"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/status", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const llmProvider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  const llmApiKey = llmProvider === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;
  const llmModel = llmProvider === "gemini" ? (process.env.GEMINI_MODEL || "gemini-1.5-flash") : (process.env.OPENAI_MODEL || "gpt-4o-mini");

  const database = dbUrl
    ? { status: "configured", detail: "DATABASE_URL is present (connectivity check not implemented)." }
    : { status: "not_configured", detail: "DATABASE_URL is not set." };

  const llm = llmApiKey
    ? { status: "configured", provider: llmProvider, model: llmModel, detail: "LLM credentials detected." }
    : {
        status: "not_configured",
        provider: llmProvider,
        model: llmModel,
        detail: llmProvider === "gemini" ? "GEMINI_API_KEY is not set." : "OPENAI_API_KEY is not set."
      };

  res.json({
    backend: { status: "ok" },
    database,
    llm,
    checkedAt: new Date().toISOString()
  });
});

app.post("/fetch-content", async (req, res) => {
  const urls = normalizeAndValidateUrls(req.body?.urls || []);

  if (urls.length < 5 || urls.length > 10) {
    return res.status(400).json({ error: "Please provide between 5 and 10 valid URLs." });
  }

  const results = await Promise.allSettled(urls.map((url) => extractContentFromUrl(url)));

  const sources = [];
  const failed = [];

  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      sources.push(result.value);
    } else {
      failed.push({
        url: urls[idx],
        reason: result.reason?.message || "Unknown extraction error"
      });
    }
  });

  if (!sources.length) {
    return res.status(502).json({
      error: "Failed to extract readable content from all provided URLs.",
      failed
    });
  }

  return res.json({
    sources,
    failed
  });
});

app.post("/generate-brief", (req, res) => {
  const incomingSources = Array.isArray(req.body?.sources) ? req.body.sources : [];
  const summaryStyle = req.body?.summaryStyle;

  if (!incomingSources.length) {
    return res.status(400).json({ error: "No source content provided." });
  }

  const normalizedSources = incomingSources
    .filter((source) => source?.content && source?.url)
    .map((source) => ({
      url: source.url,
      title: source.title || source.url,
      content: String(source.content),
      preview: source.preview || String(source.content).slice(0, 300),
      sentences: Array.isArray(source.sentences) ? source.sentences : []
    }));

  if (!normalizedSources.length) {
    return res.status(400).json({ error: "Source data is empty after normalization." });
  }

  generateBriefWithOpenAI({ sources: normalizedSources, summaryStyle })
    .then((result) => {
      return res.json({
        ...result,
        sources: normalizedSources,
        generatedAt: new Date().toISOString(),
        summaryStyle,
        generationMode: (process.env.LLM_PROVIDER || "openai").toLowerCase()
      });
    })
    .catch((error) => {
      const isMissingProviderKey =
        String(error.message || "").includes("OPENAI_API_KEY") || String(error.message || "").includes("GEMINI_API_KEY");
      const isProviderQuotaError =
        String(error.message || "").includes("Gemini API error (429)") ||
        String(error.message || "").includes("RESOURCE_EXHAUSTED");

      if (isMissingProviderKey || isProviderQuotaError) {
        console.warn("LLM unavailable (missing key or quota exceeded). Falling back to local brief generator.");
        const fallbackBrief = generateResearchBrief(normalizedSources, { summaryStyle });
        return res.json({
          ...fallbackBrief,
          generationMode: "fallback",
          warning: isProviderQuotaError
            ? "LLM quota exceeded. Generated brief using local fallback mode."
            : "LLM API key not configured. Generated brief using local fallback mode."
        });
      }

      console.error("Brief generation error:", error);
      res.status(502).json({ error: error.message || "Failed to generate brief with AI." });
    });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Research Brief Builder API running on http://localhost:${PORT}`);
});
