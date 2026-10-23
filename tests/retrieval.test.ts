import { describe, it, expect } from "vitest";
import {
  rankChunks,
  selectRelevantFacts,
  tokenize,
  estimateTokens,
} from "../src/lib/retrieval";

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

  it("matches Wi-Fi wording variants without returning unrelated FAQs", () => {
    const knowledge = [
      {
        id: "wifi",
        propertyId: PROPERTY_A,
        content: "Q: Is Wi-Fi available?\nA: Complimentary fiber Wi-Fi is available throughout the estate.",
      },
      {
        id: "restaurant",
        propertyId: PROPERTY_A,
        content: "Q: What time is dinner?\nA: Dinner is served from 6:00 PM to 10:30 PM.",
      },
    ];
    const results = rankChunks(knowledge, "Does you give free wifi?", PROPERTY_A);
    expect(results[0]?.id).toBe("wifi");
    expect(results.map((result) => result.id)).not.toContain("restaurant");
  });

  it("retrieves the dinner fact for a dinner-hours question", () => {
    const knowledge = [
      {
        id: "restaurant",
        propertyId: PROPERTY_A,
        content: "Q: What time is dinner?\nA: Dinner is served from 6:00 PM to 10:30 PM.",
      },
      {
        id: "pool",
        propertyId: PROPERTY_A,
        content: "Q: What are the pool hours?\nA: The pool is open from 7:00 AM to 10:00 PM.",
      },
    ];
    expect(rankChunks(knowledge, "What time is dinner?", PROPERTY_A)[0]?.id).toBe(
      "restaurant",
    );
  });

  it("uses documented measurements for pool-length questions", () => {
    const knowledge = [
      {
        id: "pool",
        propertyId: PROPERTY_A,
        content: "Q: How long is the pool?\nA: The infinity pool is 34 metres long.",
      },
      {
        id: "pool-hours",
        propertyId: PROPERTY_A,
        content: "Q: When is the pool open?\nA: The pool opens daily at 7:00 AM.",
      },
    ];
    expect(rankChunks(knowledge, "How long is the pool?", PROPERTY_A)[0]?.id).toBe(
      "pool",
    );
  });

  it("matches airport transfer wording to an airport shuttle FAQ", () => {
    const knowledge = [{
      id: "airport",
      propertyId: PROPERTY_A,
      content: "Q: Do you offer an airport shuttle?\nA: The shuttle runs between the resort and Coral Bay Airport and takes 25 minutes.",
    }];
    expect(
      rankChunks(knowledge, "How long does the airport transfer take?", PROPERTY_A)[0]?.id,
    ).toBe("airport");
  });

  it("uses the previous guest question to retrieve facts for a clear follow-up", () => {
    const knowledge = [{
      id: "wifi",
      propertyId: PROPERTY_A,
      content: "Q: Is Wi-Fi available?\nA: Complimentary Wi-Fi is available throughout the estate.",
    }];
    const result = rankChunks(
      knowledge,
      "Is Wi-Fi available? Is it complimentary?",
      PROPERTY_A,
    );
    expect(result[0]?.id).toBe("wifi");
  });

  it("does not match an unconfirmed transfer type to a different transfer FAQ", () => {
    const knowledge = [{
      id: "airport",
      propertyId: PROPERTY_A,
      content: "Q: Do you offer an airport shuttle?\nA: The airport shuttle takes 25 minutes.",
    }];
    expect(rankChunks(knowledge, "Do you provide helicopter transfers?", PROPERTY_A))
      .toHaveLength(0);
  });
});

describe("retrieved fact selection", () => {
  const amenityList = `AMENITIES
- Infinity Pool: 34-metre pool above the gorge
- Jungle Spa: open-air treatment pavilions
- Yoga Pavilion: sunrise practice above the river
- Airport Transfer: chauffeured SUV, about 75 minutes from DPS airport
- Private Concierge: a resident host for every villa
- Free Wi-Fi: fibre throughout the estate
- In-Villa Dining: served on your terrace, all day`;

  it("sends only the Wi-Fi fact for a Wi-Fi question", () => {
    const facts = selectRelevantFacts(amenityList, "is there any wifi?");
    expect(facts).toBe("Free Wi-Fi: fibre throughout the estate");
    expect(facts).not.toMatch(/pool|spa|yoga|airport|concierge|dining/i);
  });

  it("keeps a matching FAQ answer even when the answer uses different wording", () => {
    expect(
      selectRelevantFacts(
        "Q: Is parking free?\nA: Yes, it is complimentary.",
        "Is parking free?",
      ),
    ).toBe("Yes, it is complimentary.");
  });

  it("returns no facts when a retrieved chunk contains no matching detail", () => {
    expect(
      selectRelevantFacts(amenityList, "Do you offer helicopter transfers?"),
    ).toBe("");
  });

  it("selects only the requested pool measurement, not pool access details", () => {
    const knowledge = `${amenityList}
- Pool Hours: open daily from 7:00 AM to 10:00 PM`;
    const facts = selectRelevantFacts(knowledge, "How long is the pool?");
    expect(facts).toBe("Infinity Pool: 34-metre pool above the gorge");
    expect(facts).not.toMatch(/7:00 AM|10:00 PM/);
  });

  it("selects only dinner hours from a multi-meal schedule", () => {
    const knowledge = "Restaurant: breakfast 7:00–11:00 AM; dinner 6:00–10:30 PM";
    expect(selectRelevantFacts(knowledge, "What time is dinner?"))
      .toBe("dinner 6:00–10:30 PM");
  });

  it("selects transfer duration and airport reference without other amenities", () => {
    const facts = selectRelevantFacts(amenityList, "How long is the airport transfer?");
    expect(facts).toContain("Airport Transfer");
    expect(facts).toContain("75 minutes");
    expect(facts).not.toMatch(/pool|spa|yoga|concierge|wi-fi|dining/i);
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
