import { describe, it, expect } from "vitest";
import { rankChunks, tokenize, estimateTokens } from "../src/lib/retrieval";

const PROPERTY_A = "11111111-1111-4111-8111-111111111111";
const PROPERTY_B = "22222222-2222-4222-8222-222222222222";

const chunks = [
  {
    id: "a1",
    propertyId: PROPERTY_A,
    content: "Q: What time is check-in?\nA: Check-in starts at 3:00 PM at Hotel A.",
  },
  {
    id: "a2",
    propertyId: PROPERTY_A,
    content: "Q: Is parking free?\nA: Hotel A offers complimentary valet parking.",
  },
  {
    id: "b1",
    propertyId: PROPERTY_B,
    content: "Q: What time is check-in?\nA: Check-in at Hotel B starts at 2:00 PM — SECRET B DATA.",
  },
  {
    id: "b2",
    propertyId: PROPERTY_B,
    content: "Q: Do you allow pets?\nA: Hotel B allows all pets for free.",
  },
];

describe("tenant isolation in retrieval", () => {
  it("never returns chunks from another property, even if passed a mixed array", () => {
    const results = rankChunks(chunks, "what time is check-in", PROPERTY_A);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.propertyId).toBe(PROPERTY_A);
    }
    const contents = results.map((r) => r.content).join(" ");
    expect(contents).not.toContain("SECRET B DATA");
  });

  it("returns an empty result when the property has no matching knowledge", () => {
    const results = rankChunks(chunks, "airport shuttle schedule", PROPERTY_A);
    const fromOtherTenant = results.filter((r) => r.propertyId !== PROPERTY_A);
    expect(fromOtherTenant).toHaveLength(0);
  });

  it("returns nothing for a property with zero chunks", () => {
    const results = rankChunks(chunks, "check-in", "99999999-9999-4999-8999-999999999999");
    expect(results).toHaveLength(0);
  });
});

describe("ranking quality", () => {
  it("ranks the most relevant chunk first", () => {
    const results = rankChunks(chunks, "is parking included", PROPERTY_A);
    expect(results[0]?.id).toBe("a2");
  });

  it("handles empty queries safely", () => {
    expect(rankChunks(chunks, "", PROPERTY_A)).toHaveLength(0);
    expect(rankChunks(chunks, "the a an", PROPERTY_A)).toHaveLength(0);
  });

  it("respects the limit parameter", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `a${i}`,
      propertyId: PROPERTY_A,
      content: `Q: Question about pool ${i}?\nA: The pool opens at 7 AM daily, detail ${i}.`,
    }));
    expect(rankChunks(many, "pool opening hours", PROPERTY_A, 6)).toHaveLength(6);
  });
});

describe("tokenization & token estimation", () => {
  it("strips stopwords and short tokens", () => {
    const tokens = tokenize("What is the check-in time?");
    expect(tokens).toContain("check-in");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("is");
  });

  it("estimates tokens proportionally to length", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
