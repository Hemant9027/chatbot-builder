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
    "it its as by from about into over after before between not no yes so such per any have has had"
  ).split(/\s+/),
);

export interface RetrievableChunk {
  id: string;
  propertyId: string;
  content: string;
}

export type RankedChunk<T extends RetrievableChunk> = T & { score: number };

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ\s-]/g, " ")
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

/** Minimum score for us to consider retrieved knowledge "relevant". */
export const RELEVANCE_THRESHOLD = 0.6;

/** Rough token estimate (~4 chars/token) for usage accounting. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
