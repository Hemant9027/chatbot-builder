/** Split long content into retrieval-sized chunks on paragraph boundaries. */
export function splitIntoChunks(content: string, maxLen = 1200): string[] {
  const paragraphs = content
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (p.length > maxLen) {
      // Hard-split oversized paragraphs.
      for (let i = 0; i < p.length; i += maxLen) {
        chunks.push(p.slice(i, i + maxLen));
      }
      continue;
    }
    if ((current + "\n" + p).trim().length > maxLen && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 40);
}

const MAX_SCAN_CHARS = 6000;

/** Strip HTML to readable text without a heavyweight parser. */
export function extractReadableText(html: string): {
  title: string;
  text: string;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim().slice(0, 200) ?? "Untitled page";

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const headings = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(
    (m) => m[1].replace(/<[^>]+>/g, " ").trim(),
  );
  const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").trim())
    .filter((p) => p.length >= 40);
  const meta = body.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  const pieces = [
    ...(meta?.[1] ? [meta[1].trim()] : []),
    ...headings,
    ...paragraphs,
  ]
    .map((p) => p.replace(/\s+/g, " "))
    .filter(Boolean);
  return { title, text: pieces.join("\n").slice(0, MAX_SCAN_CHARS) };
}
