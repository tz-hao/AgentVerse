import { describe, expect, it, vi } from "vitest";

describe("DeepSeek client", () => {
  it("does not throw during import when the API key is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.resetModules();

    await expect(import("../lib/agents/deepseekClient")).resolves.toHaveProperty(
      "getDeepSeekClient",
    );
  });

  it("exports the default DeepSeek model", async () => {
    vi.stubEnv("DEEPSEEK_MODEL", "");
    vi.resetModules();

    const deepseekClient = await import("../lib/agents/deepseekClient");

    expect(deepseekClient.DEEPSEEK_MODEL).toBe("deepseek-chat");
  });

  it("throws a clear error only when creating a client without an API key", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.resetModules();

    const { getDeepSeekClient } = await import("../lib/agents/deepseekClient");

    expect(() => getDeepSeekClient()).toThrow(
      "DEEPSEEK_API_KEY is required to create a DeepSeek client",
    );
  });
});
