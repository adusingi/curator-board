import * as cheerio from "cheerio";

const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are a resource categorisation assistant.
Given a URL, title, and description, pick the single best matching category slug from the list provided.
Respond ONLY with valid JSON: {"slug": "<slug>"}
If nothing fits well, use "other".`;

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/;
const SOCIAL_RE =
  /(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|fb\.watch)/i;

type CategoryPicker = (userMessage: string, slugs: string[]) => Promise<string>;

type AnthropicContentBlock = {
  type?: string;
  text?: string;
};

type AnthropicResponse = {
  content?: AnthropicContentBlock[];
};

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function configuredProvider(): string {
  return process.env.AI_PROVIDER?.trim().toLowerCase() ?? "auto";
}

function configuredModel(provider: string): string {
  const genericModel = process.env.AI_MODEL?.trim();
  if (genericModel) {
    return genericModel;
  }

  if (provider === "anthropic") {
    return process.env.CLAUDE_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  }

  if (provider === "openai") {
    return DEFAULT_OPENAI_MODEL;
  }

  return "";
}

function resolveProvider(): string {
  const provider = configuredProvider();
  if (provider === "none" || provider === "anthropic" || provider === "openai") {
    return provider;
  }

  if (provider && provider !== "auto") {
    console.warn(`Unknown AI_PROVIDER=${JSON.stringify(provider)}. Falling back to auto detection.`);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  return "none";
}

function extractSlug(raw: string, slugs: string[]): string {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return "other";
  }

  try {
    const data = JSON.parse(match[0]) as { slug?: string };
    return data.slug && slugs.includes(data.slug) ? data.slug : "other";
  } catch {
    return "other";
  }
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function truncateDescription(description?: string | null): string | null {
  if (!description) {
    return null;
  }
  return description.length > 1000 ? `${description.slice(0, 997)}...` : description;
}

async function supadataMetadata(url: string): Promise<{ title: string; description: string | null } | null> {
  const apiKey = process.env.SUPADATA_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  try {
    const params = new URLSearchParams({ url });
    const response = await fetch(`https://api.supadata.ai/v1/metadata?${params.toString()}`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { title?: string; description?: string };
    if (!data.title) {
      return null;
    }

    return {
      title: data.title,
      description: truncateDescription(data.description),
    };
  } catch {
    return null;
  }
}

async function youtubeOembed(url: string): Promise<{ title: string; description: string | null } | null> {
  try {
    const params = new URLSearchParams({ url, format: "json" });
    const response = await fetch(`https://www.youtube.com/oembed?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { title?: string; author_name?: string };
    if (!data.title) {
      return null;
    }

    return {
      title: data.title,
      description: data.author_name ? `YouTube video by ${data.author_name}` : null,
    };
  } catch {
    return null;
  }
}

export async function scrapeOg(url: string): Promise<{ title: string; description: string | null }> {
  if (SOCIAL_RE.test(url)) {
    const socialResult = YOUTUBE_RE.test(url)
      ? (await supadataMetadata(url)) || (await youtubeOembed(url))
      : await supadataMetadata(url);

    if (socialResult) {
      return socialResult;
    }
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const og = (property: string): string | null =>
      $(`meta[property="og:${property}"], meta[name="${property}"]`).attr("content")?.trim() || null;

    const title = og("title") || $("title").text().trim() || domain(url);
    const description =
      og("description") || $('meta[name="description"]').attr("content")?.trim() || null;

    return { title, description };
  } catch {
    return { title: domain(url), description: null };
  }
}

async function pickCategoryWithAnthropic(userMessage: string, slugs: string[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return "other";
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: configuredModel("anthropic"),
        max_tokens: 64,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw new Error(`Anthropic returned ${response.status}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const raw = data.content?.find((block) => block.type === "text")?.text?.trim() ?? "";
    return extractSlug(raw, slugs);
  } catch {
    return "other";
  }
}

async function pickCategoryWithOpenAi(userMessage: string, slugs: string[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return "other";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: configuredModel("openai"),
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw new Error(`OpenAI returned ${response.status}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    return extractSlug(raw, slugs);
  } catch {
    return "other";
  }
}

const PROVIDER_PICKERS: Record<string, CategoryPicker> = {
  anthropic: pickCategoryWithAnthropic,
  openai: pickCategoryWithOpenAi,
};

export async function pickCategory(
  url: string,
  title: string,
  description: string | null,
  categories: Array<{ slug: string }>,
): Promise<string> {
  const slugs = categories.map((category) => category.slug);
  const userMessage = [
    `URL: ${url}`,
    `Title: ${title}`,
    `Description: ${description || "N/A"}`,
    "",
    `Available category slugs: ${JSON.stringify(slugs)}`,
  ].join("\n");

  const provider = resolveProvider();
  if (provider === "none") {
    console.info("No AI provider configured. Falling back to 'other'.");
    return "other";
  }

  const picker = PROVIDER_PICKERS[provider];
  if (!picker) {
    console.warn(`No category picker is registered for provider=${JSON.stringify(provider)}.`);
    return "other";
  }

  return picker(userMessage, slugs);
}
