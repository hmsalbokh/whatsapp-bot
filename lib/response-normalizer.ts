export function normalizeResponse(text: string): string {
  let result = text.trim();

  // Remove markdown code blocks
  result = result.replace(/```[\s\S]*?```/g, "").trim();

  // Remove inline code backticks
  result = result.replace(/`([^`]+)`/g, "$1");

  // Collapse multiple newlines into max 2
  result = result.replace(/\n{3,}/g, "\n\n");

  // Remove leading/trailing quotes that the AI sometimes wraps around responses
  result = result.replace(/^[""']|[""']$/g, "").trim();

  // Ensure response ends with sentence-ending punctuation in Arabic
  if (
    result.length > 0 &&
    !"؟!.۔".includes(result[result.length - 1]) &&
    !result.endsWith(")")
  ) {
    result += ".";
  }

  return result;
}
