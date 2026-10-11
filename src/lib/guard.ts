/**
 * Prompt-injection and abuse heuristics for guest messages.
 * This is a first line of defense; the system prompt and the RAG design
 * (documents treated as untrusted data, never instructions) are the second.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /system\s*prompt/i,
  /reveal|show|print|repeat|leak.{0,20}(your|the)\s+(instructions?|prompt|system|rules)/i,
  /\bact\s+as\b.{0,40}\b(dan|jailbreak|admin|developer|root)\b/i,
  /<\s*\/?\s*(system|assistant|prompt|instruction)/i,
  /\bapi[\s_-]?key\b|\bsecret\b.{0,20}\bkey\b|\bpassword\b.{0,20}\b(env|config|database)\b/i,
  /other\s+(hotel|propert|tenant|customer)/i,
  /\bexfiltrat/i,
];

const INJECTION_REFUSAL =
  "I'm here to help with questions about this property and your stay. I can't help with that request, but if you have a question about your visit — like check-in times, amenities, or policies — I'm happy to assist.";

export function detectPromptInjection(text: string): boolean {
  const normalized = text.slice(0, 2000);
  return INJECTION_PATTERNS.some((p) => p.test(normalized));
}

export function injectionRefusalMessage(): string {
  return INJECTION_REFUSAL;
}
