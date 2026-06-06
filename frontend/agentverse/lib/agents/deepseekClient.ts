import OpenAI from "openai";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;

export function getDeepSeekClient(): OpenAI {
  if (typeof window !== "undefined") {
    throw new Error("DeepSeek client can only be created on the server");
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is required to create a DeepSeek client");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL,
  });
}
