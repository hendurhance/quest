const PRICES: Record<string, [number, number]> = {
  'gpt-5-nano': [0.05, 0.4],
  'gpt-5-mini': [0.25, 2.0],
  'gpt-5': [1.25, 10.0],
  'gpt-4.1-nano': [0.1, 0.4],
  'gpt-4.1-mini': [0.4, 1.6],
  'gpt-4.1': [2.0, 8.0],
  'gemini-2.5-flash-lite': [0.1, 0.4],
  'gemini-2.5-flash': [0.3, 2.5],
  'gemini-2.5-pro': [1.25, 10.0],
}

const SNAPSHOT_SUFFIX = /-\d{4}(-\d{2}-\d{2})?$/

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number | null {
  const price = PRICES[modelId] ?? PRICES[modelId.replace(SNAPSHOT_SUFFIX, '')]
  if (!price) return null
  return (inputTokens / 1_000_000) * price[0] + (outputTokens / 1_000_000) * price[1]
}
