import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { query, model = "gpt-4" } = body;

    // Get API key from environment variable based on selected model provider
    let apiKey = "";
    if (model.startsWith("gpt-")) {
      apiKey = process.env.OPENAI_API_KEY || "";
    } else if (model.startsWith("gemini-")) {
      apiKey = process.env.GOOGLE_API_KEY || "";
    } else if (model.startsWith("claude-")) {
      apiKey = process.env.ANTHROPIC_API_KEY || "";
    }

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

    if (!query || typeof query !== "string" || !query.trim()) {
      console.error("Query is invalid");
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the system message for research
    const systemMessage = {
      role: "system",
      content: `You are a research assistant. The user will provide a topic, and you need to:
      1. Create a comprehensive summary of the topic
      2. Generate 3-5 relevant sources with titles, summaries, and hypothetical URLs
      3. Format your response as JSON with the following structure:
      {
        "summary": "comprehensive summary text",
        "sources": [
          {
            "title": "Source title",
            "summary": "Brief description of the source",
            "source": "Publication name",
            "url": "https://example.com/source",
            "date": "YYYY-MM-DD"
          }
        ]
      }`,
    };

    // Create user message with the query
    const userMessage = {
      role: "user",
      content: `Research this topic: ${query}`,
    };

    // Messages array with system and user messages
    const messages = [systemMessage, userMessage];

    let responseContent = "";

    // Determine which API to call based on model
    if (model.startsWith("gpt-")) {
      // Call OpenAI API
      // Basic request body without response_format to ensure compatibility with all models
      const requestBody = {
        model: model,
        messages: messages,
        temperature: 0.7,
      };

      console.log("Using OpenAI model:", model);

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
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
      responseContent = data.choices[0].message.content;
    } else if (model.startsWith("gemini-")) {
      // Call Google's Gemini API
      const geminiModelName = "gemini-2.0-flash";
      console.log("Using Gemini model:", geminiModelName);

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: systemMessage.content + "\n\n" + userMessage.content,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
            },
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
      responseContent = data.candidates[0]?.content?.parts[0]?.text || "";
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
            system: systemMessage.content,
            messages: [
              {
                role: "user",
                content: userMessage.content,
              },
            ],
            max_tokens: 1500,
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
      responseContent = data.content[0]?.text || "";
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

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error("Error parsing response as JSON:", error);
      console.log("Response content:", responseContent);

      // Try to extract JSON from the response using regex
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return new Response(
            JSON.stringify({
              error: "Failed to parse response as JSON",
              details: responseContent,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            error: "Failed to parse response as JSON",
            details: responseContent,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return the parsed response
    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in research API:", error);
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
