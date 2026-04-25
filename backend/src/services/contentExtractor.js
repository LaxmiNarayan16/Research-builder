import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { load } from "cheerio";

function cleanWhitespace(text = "") {
  return text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function trimForPreview(text = "", maxLen = 350) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}...`;
}

function trimForAi(text = "", maxLen = 4500) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim();
}

export function splitSentences(text = "") {
  return cleanWhitespace(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 35);
}

export async function extractContentFromUrl(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ResearchBriefBuilderBot/1.0 (+content extraction)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  let content = cleanWhitespace(article?.textContent || "");

  // Fallback parser when readability cannot extract enough text.
  if (!content || content.length < 250) {
    const $ = load(html);
    $("script, style, nav, footer, header, aside, noscript, iframe").remove();
    content = cleanWhitespace($("main, article, body").text());
  }

  if (!content || content.length < 120) {
    throw new Error("Not enough readable content extracted");
  }

  const sentences = splitSentences(content);
  const preview = trimForPreview(content);
  const cleanedText = trimForAi(content);

  return {
    url,
    title: cleanWhitespace(article?.title || dom.window.document.title || url),
    content: cleanedText,
    cleanedText,
    preview,
    sentences
  };
}
