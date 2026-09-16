import { chatFlow } from "@/ai/flows";

export async function POST(request) {
  try {
    const body = await request.json();
    const message = (body.message || "").trim();
    if (!message) {
      return Response.json({ detail: "Message is required" }, { status: 400 });
    }
    if (message.length > 8000) {
      return Response.json({ detail: "Message is too long" }, { status: 400 });
    }

    const result = await chatFlow({
      message,
      system: body.system,
      history: body.history || [],
    });

    return Response.json(result);
  } catch (err) {
    console.error("Genkit chat error:", err?.message || err);
    return Response.json(
      { detail: "AI request failed. Check GEMINI_API_KEY on the server." },
      { status: 500 }
    );
  }
}
