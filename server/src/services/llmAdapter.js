/**
 * LLM Adapter
 *
 * Interface for future LLM provider integration.
 * Currently returns null for all methods — functions as a no-op adapter.
 *
 * ── AI_HOOK: Provider Integration ──
 *
 * To integrate a provider:
 * 1. Create a file like llmOpenAI.js, llmGemini.js, llmClaude.js, etc.
 * 2. Each exports the same interface: generateInsights(), generateForecast(), generateRecommendations()
 * 3. Wire the active provider here via environment variable or settings
 *
 * Future providers:
 * - OpenAI (GPT-4, GPT-4o)
 * - Google Gemini (Gemini 1.5 Pro, Gemini 2.0)
 * - Anthropic Claude (Claude 3 Opus, Claude 3.5 Sonnet)
 * - Ollama (local LLMs like Llama 3, Mistral)
 * - Custom local LLM endpoint
 *
 * TODO(ai-provider-selection): Read LLM provider preference from user settings
 *   settings.ai_llm_provider could be "openai" | "gemini" | "claude" | "ollama" | "local"
 *
 * TODO(ai-api-key-management): Store API keys securely (env vars / vault)
 *   Never log or expose keys in responses.
 *
 * TODO(ai-cost-tracking): Track token usage per user per month to prevent runaway costs.
 *
 * TODO(ai-response-caching): Cache LLM responses keyed by context hash + user_id
 *   to avoid redundant API calls when financial data hasn't changed.
 *
 * TODO(ai-rate-limiting): Implement per-user rate limits for LLM API calls.
 *
 * TODO(ai-streaming): Support streaming responses for real-time chat interface.
 *
 * TODO(ai-fallback-chain): If primary provider is down, fall back to secondary.
 */

/**
 * Generate financial insights using an LLM.
 * Falls back to null (rule-based insights will be used instead).
 *
 * @param {Object} context - Normalized financial context
 * @param {string} prompt - Structured prompt from promptBuilder
 * @returns {Promise<Object|null>} LLM-generated insights or null
 */
export async function generateInsights(context, prompt) {
  // TODO(ai-llm-integration): Call configured LLM provider with prompt
  // const provider = getActiveProvider();
  // return provider.generateInsights(context, prompt);
  return null;
}

/**
 * Generate a financial forecast using an LLM.
 *
 * @param {Object} context - Normalized financial context
 * @param {string} prompt - Forecast prompt from promptBuilder
 * @returns {Promise<Object|null>} LLM-generated forecast or null
 */
export async function generateForecast(context, prompt) {
  // TODO(ai-llm-integration): Call configured LLM provider with forecast prompt
  return null;
}

/**
 * Generate personalized recommendations using an LLM.
 *
 * @param {Object} context - Normalized financial context
 * @param {string} prompt - Recommendation prompt from promptBuilder
 * @param {string} category - Specific category for recommendations
 * @returns {Promise<Object|null>} LLM-generated recommendations or null
 */
export async function generateRecommendations(context, prompt, category) {
  // TODO(ai-llm-integration): Call configured LLM provider with recommendation prompt
  return null;
}

/**
 * Placeholder for provider selection logic.
 *
 * ── AI_HOOK: Implement provider routing based on settings / env ──
 */
export function getActiveProvider() {
  // const provider = process.env.LLM_PROVIDER || "none";
  // switch (provider) {
  //   case "openai": return require("./llmOpenAI.js");
  //   case "gemini": return require("./llmGemini.js");
  //   case "claude": return require("./llmClaude.js");
  //   case "ollama": return require("./llmOllama.js");
  //   default: return null;
  // }
  return null;
}
