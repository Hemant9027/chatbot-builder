/**
 * Keyword-based retrieval over approved knowledge chunks.
 *
 * Tenant isolation contract: callers must filter by propertyId in the SQL
 * query AND rankChunks re-filters by propertyId before ranking (defense in
 * depth — retrieval can never leak another tenant's content even if the
 * caller passes a mixed array by mistake).
 *
 * pgvector semantic search can replace the scorer later; the interface
 * (chunks in, ranked chunks out) stays identical.
 */

const STOPWORDS = new Set(
  (
    "a an the and or but if then else for to of in on at with without our your you we i is are was were be been " +
    "do does did can could should would will what when where who whom how why which there here this that these those " +
    "it its as by from about into over after before between not no yes so such per any have has had give provided"
  ).split(/\s+/),
);

export interface RetrievableChunk {
  id: string;
  propertyId: string;
  content: string;
}

export type RankedChunk<T extends RetrievableChunk> = T & { score: number };

const FACT_DETAIL_GROUPS: Record<string, string[]> = {
  availability: ["available", "availability", "offer", "offers", "provide", "provided", "exist", "exists"],
  coverage: ["where", "within", "throughout", "inside", "across", "coverage", "estate", "rooms", "room", "villa", "villas"],
  duration: ["long", "duration", "take", "takes", "minute", "minutes"],
  measurement: ["long", "length", "size", "metre", "metres", "meter", "meters", "foot", "feet"],
  opening: ["when", "time", "hour", "hours", "open", "opens", "opening", "close", "closes", "closing"],
  pricing: ["free", "complimentary", "cost", "price", "prices", "rate", "rates", "fee", "fees", "charge", "charges"],
};

const DETAIL_TOKENS = new Set(Object.values(FACT_DETAIL_GROUPS).flat());

function factDetailGroups(text: string): Set<string> {
  const words = new Set(tokenize(text));
  const groups = new Set<string>();
  for (const [group, terms] of Object.entries(FACT_DETAIL_GROUPS)) {
    if (terms.some((term) => words.has(term))) groups.add(group);
  }
  if (/\bhow many hours?\b/i.test(text)) groups.add("duration");
  if (/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(text)) {
    groups.add("opening");
  }
  if (/\b\d+(?:\.\d+)?\s*(?:minutes?|hours?)\b/i.test(text)) {
    groups.add("duration");
  }
  if (/\b\d+(?:\.\d+)?\s*[- ]?(?:metres?|meters?|feet|foot)\b/i.test(text)) {
    groups.add("measurement");
  }
  return groups;
}

export function tokenize(text: string): string[] {
  let normalized = text
    .toLowerCase()
    .replace(/wi[\s-]?fi/g, " wifi ")
    .replace(/\b(complimentary|complimentry)\b/g, " free ")
    .replace(/[^a-z0-9À-ÿ\s-]/g, " ");

  // "Airport transfer" is often documented as an airport shuttle.
  if (/\bairport\b/.test(normalized) && /\btransfer\b/.test(normalized)) {
    normalized = normalized.replace(/\btransfer\b/g, " shuttle ");
  }

  return normalized
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function rankChunks<T extends RetrievableChunk>(
  chunks: T[],
  query: string,
  propertyId: string,
  limit = 6,
): RankedChunk<T>[] {
  // 1) Tenant filter FIRST — never rank other tenants' content.
  const scoped = chunks.filter((c) => c.propertyId === propertyId);

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const tokenSet = new Set(queryTokens);
  const queryLower = query.toLowerCase().trim();
  const poolDimensionQuestion =
    /\bpool\b/i.test(query) && /\b(long|length|size|metre|meter)\b/i.test(query);

  const scored = scoped.map((chunk) => {
    const contentTokens = tokenize(chunk.content);
    if (contentTokens.length === 0) return { ...chunk, score: 0 };
    let matchWeight = 0;
    const counts = new Map<string, number>();
    for (const t of contentTokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const t of tokenSet) {
      const c = counts.get(t) ?? 0;
      if (c > 0) matchWeight += 1 + Math.min(3, c - 1) * 0.25;
    }
    if (
      poolDimensionQuestion &&
      /\b\d+(?:\.\d+)?\s*[- ]?(?:metres?|meters?)\b/i.test(chunk.content)
    ) {
      matchWeight += 1;
    }
    const coverage = matchWeight / tokenSet.size;
    const density = matchWeight / Math.sqrt(contentTokens.length);
    // Bonus when key query phrases appear verbatim (e.g. "check-in").
    const phraseBonus =
      queryLower.length > 3 &&
      chunk.content.toLowerCase().includes(queryLower)
        ? 2
        : 0;
    const score = coverage * 2 + density + phraseBonus;
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Reduces retrieved documents to fact lines that overlap the question. Large
 * pasted amenity lists otherwise give a model unrelated facts to repeat.
 */
export function selectRelevantFacts(content: string, query: string): string {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return "";

  const faq = content.match(/^\s*Q:\s*(.*?)\s*\r?\n\s*A:\s*([\s\S]*)$/i);
  const answer = faq?.[2] ?? content;
  const faqQuestionTokens = new Set(tokenize(faq?.[1] ?? ""));
  const faqMatches = [...queryTokens].some((token) => faqQuestionTokens.has(token));

  const facts = answer
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+|;\s+/))
    .map((fact) => fact.replace(/^\s*[-*•]\s*/, "").trim())
    .filter((fact) => fact && !/^(amenities|facilities)\s*:?\s*$/i.test(fact));

  const detailGroups = factDetailGroups(query);
  const queryAnchors = [...queryTokens].filter((token) => !DETAIL_TOKENS.has(token));
  if (queryAnchors.length > 0) {
    const scored = facts
      .map((fact) => {
        const factTokens = new Set(tokenize(fact));
        const anchorMatches = queryAnchors.filter((token) => factTokens.has(token)).length;
        const factGroups = factDetailGroups(fact);
        const detailMatches = [...detailGroups].filter((group) => factGroups.has(group)).length;
        return {
          fact,
          score: anchorMatches * 10 + detailMatches * 2,
          anchorMatches,
        };
      })
      .filter((item) => item.anchorMatches > 0);
    const bestScore = Math.max(0, ...scored.map((item) => item.score));
    const relevant = scored
      .filter((item) => item.score === bestScore)
      .map((item) => item.fact);
    if (relevant.length > 0) return relevant.join("\n");
  }

  // For concise FAQs, the question can identify an answer phrased without the
  // same keywords, e.g. "Is parking free?" → "Yes, it is complimentary."
  return faqMatches ? facts.slice(0, 1).join("\n") : "";
}

/** Minimum score for us to consider retrieved knowledge "relevant". */
export const RELEVANCE_THRESHOLD = 0.6;

/** Rough token estimate (~4 chars/token) for usage accounting. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
