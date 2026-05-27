import { describe, it, expect, vi } from "vitest";
import { makeAiGatewayTranslator } from "@infra/translator.aiGateway";

describe("aiGatewayTranslator.draft", () => {
  it("parses model JSON into TranslationDraft", async () => {
    const generateText = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        lines: [{ shona: "Ndakuvara", english: "I am hurt",
                  glosses: [{ shonaToken: "Ndakuvara", englishGloss: "I am hurt" }] }]
      })
    });
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    const r = await t.draft("Ndakuvara");
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]?.english).toBe("I am hurt");
  });

  it("returns empty lines when input is empty", async () => {
    const generateText = vi.fn();
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    const r = await t.draft("");
    expect(r.lines).toEqual([]);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("throws on unparseable model output", async () => {
    const generateText = vi.fn().mockResolvedValue({ text: "not json" });
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    await expect(t.draft("Ndakuvara")).rejects.toThrow(/invalid translator output/i);
  });
});
