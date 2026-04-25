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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Blocked (${response.status})`
    };
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
