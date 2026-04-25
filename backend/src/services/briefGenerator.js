import { splitSentences } from "./contentExtractor.js";

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "has", "are", "was", "were", "will", "can", "could",
  "about", "into", "their", "there", "which", "when", "where", "what", "your", "than", "then", "they", "them", "been",
  "also", "after", "before", "while", "over", "under", "more", "most", "some", "many", "other", "using", "used", "use",
  "only", "such", "each", "both", "between", "because", "across", "these", "those", "through", "very", "just"
]);

const NOISE_PATTERNS = [
  /\b(code block|example request|example response|api endpoint|http request|curl|sdk|json schema)\b/i,
  /\b(click here|learn more|sign in|log in|subscribe|cookie|privacy policy|terms of service)\b/i,
  /\b(table of contents|on this page|previous|next chapter|breadcrumbs?)\b/i,
  /^\s*(fig(ure)?\.?|step \d+|note:)\s*/i
];

function getWords(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function buildFrequencyMap(sources = []) {
  const map = new Map();
  for (const source of sources) {
    for (const word of getWords(source.content)) {
      map.set(word, (map.get(word) || 0) + 1);
    }
  }
  return map;
}

function sentenceScore(sentence, frequencyMap) {
  const words = getWords(sentence);
  if (!words.length) return 0;
  const base = words.reduce((score, word) => score + (frequencyMap.get(word) || 0), 0);
  const hasDigit = /\b\d+(\.\d+)?(%|k|m|b|million|billion)?\b/i.test(sentence);
  const hasSignalVerb = /\b(according|report|found|shows?|indicates?|states?|measured|increased|decreased|declined|grew)\b/i.test(sentence);
  const lengthPenalty = sentence.length < 55 ? -18 : sentence.length > 260 ? -14 : 0;
  return base + (hasDigit ? 10 : 0) + (hasSignalVerb ? 8 : 0) + lengthPenalty;
}

function normalizeSentence(sentence = "") {
  return sentence
    .replace(/\s+/g, " ")
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .trim();
}

function isInformativeSentence(sentence = "", strict = true) {
  const normalized = normalizeSentence(sentence);
  if (!normalized) return false;
  const minLen = strict ? 45 : 30;
  const maxLen = strict ? 300 : 340;
  if (normalized.length < minLen || normalized.length > maxLen) return false;
  if (!/[a-z]/i.test(normalized)) return false;
  if (strict && NOISE_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  const words = getWords(normalized);
  if (words.length < (strict ? 7 : 5)) return false;
  return true;
}

function toClaimText(sentence = "", maxLen = 150) {
  const normalized = normalizeSentence(sentence);
  // Keep main clause only so key points are point-wise, not long paragraphs.
  const firstClause = normalized.split(/[,;:]\s+/)[0].trim();
  if (firstClause.length <= maxLen) return firstClause;
  return `${firstClause.slice(0, maxLen).trim()}...`;
}

function dedupeKeyPoints(points = []) {
  const seen = new Set();
  const deduped = [];

  for (const point of points) {
    const signature = getWords(point.text).slice(0, 10).join("|");
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);
    deduped.push(point);
  }

  return deduped;
}

function rankSentences(sources = [], strict = true) {
  const frequencyMap = buildFrequencyMap(sources);
  const ranked = [];

  for (const source of sources) {
    const sentences = source.sentences?.length ? source.sentences : splitSentences(source.content);
    for (const sentence of sentences) {
      if (!isInformativeSentence(sentence, strict)) continue;
      ranked.push({
        text: sentence,
        source: source.url,
        title: source.title,
        snippet: sentence.length > 220 ? `${sentence.slice(0, 220)}...` : sentence,
        score: sentenceScore(sentence, frequencyMap)
      });
    }
  }

  return ranked.sort((a, b) => b.score - a.score);
}

function applySummaryStyle(sentences = [], summaryStyle = "informative") {
  if (!sentences.length) return "No summary could be generated from the extracted content.";

  if (summaryStyle === "executive") {
    return `Key takeaway: ${sentences[0]}. ${sentences[1] ? `Business impact: ${sentences[1].charAt(0).toLowerCase()}${sentences[1].slice(1)}.` : ""} ${
      sentences[2] ? `Watch item: ${sentences[2].charAt(0).toLowerCase()}${sentences[2].slice(1)}.` : ""
    }`.replace(/\s+/g, " ").trim();
  }

  if (summaryStyle === "technical") {
    return `The sources indicate that ${sentences[0].charAt(0).toLowerCase()}${sentences[0].slice(1)}. ${
      sentences[1] ? `Further evidence shows ${sentences[1].charAt(0).toLowerCase()}${sentences[1].slice(1)}.` : ""
    } ${sentences[2] ? `A remaining technical consideration is that ${sentences[2].charAt(0).toLowerCase()}${sentences[2].slice(1)}.` : ""}`
      .replace(/\s+/g, " ")
      .trim();
  }

  return sentences
    .map((sentence, idx) => {
      if (idx === 0) return sentence;
      if (idx === 1) return `Additionally, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
      return `Finally, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    })
    .join(" ");
}

function generateSummary(topSentences = [], summaryStyle = "informative") {
  if (!topSentences.length) return "No summary could be generated from the extracted content.";
  const selected = [];
  const usedSources = new Set();
  const maxSummarySentences = 5;

  // Prefer diverse sources first, so summary reflects broader full-content coverage.
  for (const item of topSentences) {
    if (selected.length >= maxSummarySentences) break;
    if (usedSources.has(item.source)) continue;
    selected.push(toClaimText(item.text, 170));
    usedSources.add(item.source);
  }

  // Fill remaining slots with additional high-scoring unique claims.
  if (selected.length < maxSummarySentences) {
    for (const item of topSentences) {
      if (selected.length >= maxSummarySentences) break;
      const candidate = toClaimText(item.text, 170);
      if (!selected.includes(candidate)) selected.push(candidate);
    }
  }

  if (!selected.length) return "No summary could be generated from the extracted content.";
  return applySummaryStyle(selected, summaryStyle);
}

function detectConflicts(allSentences = []) {
  const conflictPairs = [];
  const negationPattern = /\b(not|never|no|none|without|cannot|can't|isn't|aren't|won't|didn't|doesn't)\b/i;

  for (let i = 0; i < allSentences.length; i += 1) {
    for (let j = i + 1; j < allSentences.length; j += 1) {
      const first = allSentences[i];
      const second = allSentences[j];

      if (first.source === second.source) continue;
      const firstWords = new Set(getWords(first.text));
      const overlap = getWords(second.text).filter((word) => firstWords.has(word));
      if (overlap.length < 4) continue;

      const firstNegated = negationPattern.test(first.text);
      const secondNegated = negationPattern.test(second.text);
      const overlapTerms = [...new Set(overlap)].slice(0, 4);

      const oppositePolarity = firstNegated !== secondNegated;
      // Strict mode: only keep high-confidence polarity conflicts.
      if (oppositePolarity && overlapTerms.length >= 4) {
        conflictPairs.push({
          claimA: toClaimText(first.text, 180),
          claimB: toClaimText(second.text, 180),
          sourceA: first.source,
          sourceB: second.source,
          reason: `Potential contradiction on ${overlapTerms.join(", ")}: one source affirms while the other negates the claim.`
        });
      }
    }
  }

  return conflictPairs.slice(0, 6);
}

function buildVerifyChecklist(conflicts = [], keyPoints = []) {
  const checklist = [];

  for (const conflict of conflicts.slice(0, 4)) {
    checklist.push(
      `Verify whether "${conflict.claimA.slice(0, 80)}..." or "${conflict.claimB.slice(0, 80)}..." is better supported by primary evidence.`
    );
  }

  for (const keyPoint of keyPoints.slice(0, 2)) {
    if (/\b(may|might|could|suggests?|appears?)\b/i.test(keyPoint.text)) {
      checklist.push(`Confirm uncertainty in claim: "${keyPoint.text.slice(0, 100)}..."`);
    }
  }

  if (!checklist.length) {
    checklist.push("Validate key metrics and quoted figures against original primary sources.");
    checklist.push("Check publication dates to ensure claims are still current.");
  }

  return [...new Set(checklist)].slice(0, 6);
}

function buildTopicTags(sources = []) {
  const frequencies = new Map();
  for (const source of sources) {
    const sentences = source.sentences?.length ? source.sentences : splitSentences(source.content);
    for (const sentence of sentences) {
      if (!isInformativeSentence(sentence)) continue;
      for (const word of getWords(sentence)) {
        if (word.length < 4) continue;
        if (["http", "https", "www", "com", "client", "request", "response", "resource"].includes(word)) continue;
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    }
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function buildCompareTable(sources = []) {
  return sources.map((source) => {
    const sentences = source.sentences?.length ? source.sentences : splitSentences(source.content);
    const topClaim = sentences[0] || source.preview;
    return {
      source: source.url,
      title: source.title,
      topClaim: topClaim.length > 180 ? `${topClaim.slice(0, 180)}...` : topClaim
    };
  });
}

export function generateResearchBrief(sources = [], options = {}) {
  const summaryStyle = ["informative", "executive", "technical"].includes(options.summaryStyle)
    ? options.summaryStyle
    : "informative";
  let rankedSentences = rankSentences(sources, true);
  // If strict filtering is too aggressive, fallback to a relaxed pass for fuller summaries.
  if (rankedSentences.length < 6) {
    rankedSentences = rankSentences(sources, false);
  }
  if (!rankedSentences.length) {
    return {
      summary: "The provided sources were fetched, but they contained mostly boilerplate or low-information text. Try higher-quality article links.",
      keyPoints: [],
      conflicts: [],
      verifyChecklist: ["Check whether the input URLs contain full article text and not navigation or index pages."],
      sources,
      topicTags: [],
      compareSources: buildCompareTable(sources),
      summaryStyle,
      generatedAt: new Date().toISOString()
    };
  }
  const keyPoints = dedupeKeyPoints(rankedSentences.slice(0, 24).map((item) => ({
    text: toClaimText(item.text),
    source: item.source,
    snippet: item.snippet
  }))).slice(0, 8);

  const summary = generateSummary(rankedSentences, summaryStyle);
  const conflicts = detectConflicts(rankedSentences.slice(0, 20));
  const verifyChecklist = buildVerifyChecklist(conflicts, keyPoints);
  const topicTags = buildTopicTags(sources);
  const compareSources = buildCompareTable(sources);

  return {
    summary,
    keyPoints,
    conflicts,
    verifyChecklist,
    sources,
    topicTags,
    compareSources,
    summaryStyle,
    generatedAt: new Date().toISOString()
  };
}
