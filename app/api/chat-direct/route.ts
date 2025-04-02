import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { messages, model } = body;

    // Get API key from environment variable based on selected model provider
    let apiKey = "";
    if (model.startsWith("gpt-")) {
      apiKey = process.env.OPENAI_API_KEY || "";
    } else if (model.startsWith("gemini-")) {
      apiKey = process.env.GOOGLE_API_KEY || "";
    } else if (model.startsWith("claude-")) {
      apiKey = process.env.ANTHROPIC_API_KEY || "";
    }

    // Debug log (remove in production)
    console.log("Direct API route received request:", {
      hasEnvApiKey: !!apiKey,
      model,
      messageCount: messages?.length,
    });

    // Validate API key
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      console.error("API key is missing from environment variables");
      return new Response(
        JSON.stringify({ error: "API key is not configured on the server" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Messages are invalid");
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine which API to call based on model
    if (model.startsWith("gpt-")) {
      // Call OpenAI API
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
          }),
        }
      );

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error("OpenAI API error:", errorData);
        return new Response(
          JSON.stringify({
            error: errorData.error?.message || "Error from OpenAI API",
            details: errorData,
          }),
          {
            status: openaiResponse.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await openaiResponse.json();

      // Return the response
      return new Response(
        JSON.stringify({
          content: data.choices[0].message.content,
          role: data.choices[0].message.role,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (model.startsWith("gemini-")) {
      // Call Google's Gemini API
      // This is a simplified example - you would need to adapt to Google's API format
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: messages.map((msg) => ({
              role: msg.role === "assistant" ? "model" : msg.role,
              parts: [{ text: msg.content }],
            })),
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error("Gemini API error:", errorData);
        return new Response(
          JSON.stringify({
            error: errorData.error?.message || "Error from Gemini API",
            details: errorData,
          }),
          {
            status: geminiResponse.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await geminiResponse.json();

      // Return the response (format may need adjusting based on Gemini's response structure)
      return new Response(
        JSON.stringify({
          content: data.candidates[0]?.content?.parts[0]?.text || "",
          role: "assistant",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (model.startsWith("claude-")) {
      // Call Anthropic's Claude API
      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 1024,
          }),
        }
      );

      if (!claudeResponse.ok) {
        const errorData = await claudeResponse.json();
        console.error("Claude API error:", errorData);
        return new Response(
          JSON.stringify({
            error: errorData.error?.message || "Error from Claude API",
            details: errorData,
          }),
          {
            status: claudeResponse.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await claudeResponse.json();

      // Return the response (format may need adjusting based on Claude's response structure)
      return new Response(
        JSON.stringify({
          content: data.content[0]?.text || "",
          role: "assistant",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "Unsupported model",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in direct chat API:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during your request.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
