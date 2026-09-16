import { z } from "genkit";
import { ai } from "./genkit";

const DEFAULT_SYSTEM = 'You are a friendly interview coach. Ask clear questions, give short feedback, and use simple English. Support beginner, intermediate, and advanced levels.';

export const chatFlow = ai.defineFlow(
  {
    name: "chatFlow",
    inputSchema: z.object({
      message: z.string().min(1).max(8000),
      system: z.string().optional(),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "model"]),
            content: z.string(),
          })
        )
        .optional(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
  },
  async (input) => {
    const system = input.system || DEFAULT_SYSTEM;
    const history = input.history || [];

    let prompt = input.message;
    if (history.length > 0) {
      const lines = history
        .slice(-12)
        .map((h) => (h.role === "user" ? "User: " : "Assistant: ") + h.content)
        .join("\n");
      prompt = "Recent chat:\n" + lines + "\n\nUser: " + input.message;
    }

    const { text } = await ai.generate({
      system,
      prompt,
    });

    return {
      reply: (text || "").trim() || "I could not form a reply. Please try again.",
    };
  }
);
