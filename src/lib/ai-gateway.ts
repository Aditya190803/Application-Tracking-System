const DEFAULT_BASE_URL = "https://ai-gateway.adityamer.dev/v1";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_OUTPUT_TOKENS = 16384;

export function getAiGatewayConfig() {
  return {
    apiKey: process.env.AI_GATEWAY_API_KEY?.trim() || "",
    baseUrl: (process.env.AI_GATEWAY_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.MODEL_NAME?.trim() || DEFAULT_MODEL,
  };
}

export async function generateGatewayContent(
  prompt: string,
  temperature: number,
  signal?: AbortSignal,
): Promise<string> {
  const { apiKey, baseUrl, model } = getAiGatewayConfig();
  if (!apiKey) {
    throw new Error("AI Gateway API key is not configured. Set AI_GATEWAY_API_KEY on the server.");
  }

  const configuredTimeout = Number(process.env.AI_TIMEOUT_MS || 30000);
  const timeoutMs =
    Number.isSafeInteger(configuredTimeout) &&
    configuredTimeout > 0 &&
    configuredTimeout <= 2147483647
      ? configuredTimeout
      : 30000;
  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    signal: signal ?? AbortSignal.timeout(timeoutMs),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: MAX_OUTPUT_TOKENS,
    }),
  });

  // Upstream error bodies may echo source documents or credentials.
  if (!response.ok) {
    throw new Error(
      "AI Gateway API error (" + response.status + "). Check the gateway key and model access.",
    );
  }

  const data = await response.json();
  // Reasoning content is provider scratch work, never part of the saved answer.
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
