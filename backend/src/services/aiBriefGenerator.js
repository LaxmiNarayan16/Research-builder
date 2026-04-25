import OpenAI from "openai";

const RESPONSE_SCHEMA_EXAMPLE = {
  summary: "string",
  keyPoints: [
    {
      point: "string",
      sourceUrl: "string",
      snippet: "string"
    }
  ],
  conflictingClaims: [
    {
      claimA: "string",
      claimB: "string",
      sources: ["url1", "url2"]
    }
  ],
  verifyChecklist: ["string"]
};

function cleanJsonText(text = "") {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeResponseShape(parsed, sources = []) {
  const validUrls = new Set(sources.map((source) => source.url));
  const fallbackUrl = sources[0]?.url || "";

  const keyPoints = Array.isArray(parsed?.keyPoints)
    ? parsed.keyPoints
        .map((item) => ({
          point: String(item?.point || "").trim(),
          sourceUrl: validUrls.has(item?.sourceUrl) ? item.sourceUrl : fallbackUrl,
          snippet: String(item?.snippet || "").trim()
        }))
        .filter((item) => item.point && item.sourceUrl)
        .slice(0, 10)
    : [];

  const conflictingClaims = Array.isArray(parsed?.conflictingClaims)
    ? parsed.conflictingClaims
        .map((item) => ({
          claimA: String(item?.claimA || "").trim(),
          claimB: String(item?.claimB || "").trim(),
          sources: Array.isArray(item?.sources) ? item.sources.filter((url) => validUrls.has(url)).slice(0, 2) : []
        }))
        .filter((item) => item.claimA && item.claimB)
        .slice(0, 8)
    : [];

  const verifyChecklist = Array.isArray(parsed?.verifyChecklist)
    ? parsed.verifyChecklist.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];

  return {
    summary: String(parsed?.summary || "").trim(),
    keyPoints,
    conflictingClaims,
    verifyChecklist
  };
}

function buildPrompt(sources = [], summaryStyle = "informative") {
  const sourceBlocks = sources
    .map((source, idx) => {
      return `Source ${idx + 1}\nURL: ${source.url}\nTitle: ${source.title}\nContent:\n${source.cleanedText || source.content}\n`;
    })
    .join("\n---\n");

  return `
You are generating a research brief from multiple sources.
Summary style: ${summaryStyle}.

Rules:
- Use only facts present in the provided sources.
- Every key point must include a valid sourceUrl from provided URLs and a short snippet copied from the source.
- conflictingClaims should include only genuine disagreements between sources.
- Return strict JSON only (no markdown, no commentary).
- Match this schema exactly: ${JSON.stringify(RESPONSE_SCHEMA_EXAMPLE)}.

Sources:
${sourceBlocks}
`;
}

async function generateWithOpenAI({ sources, summaryStyle }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the backend.");
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildPrompt(sources, summaryStyle);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a precise research analyst that returns valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const rawText = completion.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(cleanJsonText(rawText));
  return normalizeResponseShape(parsed, sources);
}

async function generateWithGemini({ sources, summaryStyle }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the backend.");
  }

  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const modelCandidates = [
    configuredModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b"
  ];
  const prompt = buildPrompt(sources, summaryStyle);
  let lastError = null;

  for (const model of [...new Set(modelCandidates)]) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
      const parsed = JSON.parse(cleanJsonText(rawText));
      return normalizeResponseShape(parsed, sources);
    }

    const errorBody = await response.text();
    lastError = `Gemini API error (${response.status}) for model "${model}": ${errorBody}`;
    // Stop trying if the issue is not model-not-found.
    if (response.status !== 404) break;
  }

  throw new Error(lastError || "Gemini API request failed.");
}

export async function generateBriefWithOpenAI({ sources, summaryStyle = "informative" }) {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  if (provider === "gemini") {
    return generateWithGemini({ sources, summaryStyle });
  }
  return generateWithOpenAI({ sources, summaryStyle });
}
