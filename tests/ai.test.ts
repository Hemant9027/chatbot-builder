import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiProvider,
  MockProvider,
  type AIChatMessage,
  type GenerateOptions,
} from "../src/lib/ai";

const messages = (question: string): AIChatMessage[] => [
  { role: "system", content: "Answer only from the supplied knowledge." },
  { role: "user", content: question },
];

const retrieved = (content: string): GenerateOptions => ({
  retrieved: [{ id: "faq", content, score: 1 }],
  tone: "friendly",
});

describe("concise grounded mock responses", () => {
  const provider = new MockProvider();

  it("answers a Wi-Fi question without returning unrelated FAQ details", async () => {
    const result = await provider.generate(
      messages("Does you give free wifi?"),
      retrieved(
        "Q: Is Wi-Fi available?\nA: Complimentary fiber Wi-Fi is available throughout the estate. The restaurant serves dinner from 6:00 PM to 10:30 PM.",
      ),
    );
    expect(result.text).toBe(
      "Yes, complimentary fiber Wi-Fi is available throughout the estate.",
    );
    expect(result.text).not.toMatch(/restaurant|dinner/i);
  });

  it("returns only the dinner-hours sentence", async () => {
    const result = await provider.generate(
      messages("What time is dinner?"),
      retrieved(
        "Q: What are the restaurant hours?\nA: Breakfast is served from 7:00 AM to 11:00 AM. Dinner is served from 6:00 PM to 10:30 PM.",
      ),
    );
    expect(result.text).toBe("Dinner is served from 6:00 PM to 10:30 PM.");
    expect(result.text).not.toMatch(/breakfast/i);
  });

  it("returns the airport reference and documented transfer duration", async () => {
    const result = await provider.generate(
      messages("How long does the airport transfer take?"),
      retrieved(
        "Q: Do you offer an airport shuttle?\nA: The shuttle runs between the resort and Coral Bay Airport every hour. The ride takes about 25 minutes.",
      ),
    );
    expect(result.text).toMatch(/Coral Bay Airport/i);
    expect(result.text).toMatch(/25 minutes/i);
  });

  it("returns a documented pool measurement, not pool hours", async () => {
    const result = await provider.generate(
      messages("How long is the pool?"),
      retrieved(
        "Q: What is the pool length?\nA: The infinity pool is 34 metres long. It is open daily from 7:00 AM to 10:00 PM.",
      ),
    );
    expect(result.text).toBe("The infinity pool is 34 metres long.");
  });

  it("does not infer that Wi-Fi is available in an unmentioned villa", async () => {
    const result = await provider.generate(
      messages("Does it work in the villas too?"),
      retrieved(
        "Q: Is Wi-Fi available?\nA: Complimentary Wi-Fi is available throughout the estate, including rooms, the pool deck, and beach.",
      ),
    );
    expect(result.text).toBe("");
  });

  it("returns no answer when the approved facts do not confirm the question", async () => {
    const result = await provider.generate(
      messages("Do you provide helicopter transfers?"),
      { retrieved: [], tone: "friendly" },
    );
    expect(result.text).toBe("");
  });
});

describe("Gemini provider integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the API key in a server-side header and uses the configured model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Yes, Wi-Fi is available." }] } }],
          usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 8 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeminiProvider("test-key-not-for-production", "gemini-test-model");

    const result = await provider.generate(messages("Is Wi-Fi available?"), retrieved(
      "Q: Is Wi-Fi available?\nA: Complimentary Wi-Fi is available throughout the estate.",
    ));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      generationConfig: { temperature: number; maxOutputTokens: number };
    };

    expect(url).toContain("/models/gemini-test-model:generateContent");
    expect(url).not.toContain("test-key-not-for-production");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe(
      "test-key-not-for-production",
    );
    expect(body.generationConfig).toEqual({
      temperature: 0.2,
      maxOutputTokens: 128,
    });
    expect(result).toMatchObject({
      text: "Yes, Wi-Fi is available.",
      model: "gemini-test-model",
      tokensIn: 30,
      tokensOut: 8,
    });
  });

  it("does not include provider response bodies in generated errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "sensitive provider diagnostic" } }),
        { status: 429 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeminiProvider("test-key-not-for-production", "gemini-test-model");

    await expect(
      provider.generate(messages("Is Wi-Fi available?"), retrieved("Wi-Fi is available.")),
    ).rejects.toThrow("Gemini request failed (429)");
    await expect(
      provider.generate(messages("Is Wi-Fi available?"), retrieved("Wi-Fi is available.")),
    ).rejects.not.toThrow("sensitive provider diagnostic");
  });
});
