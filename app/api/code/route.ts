import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const {
      code,
      language = "javascript",
      action = "revise",
      model = "gpt-4",
    } = body;

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

    if (!code || typeof code !== "string") {
      console.error("Code is invalid");
      return new Response(JSON.stringify({ error: "Code is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the system message for code assistance
    const systemMessage = {
      role: "system",
      content: `You are a code assistant specialized in analyzing, revising, and explaining code. The user will provide code in ${language}, and you need to ${action} it.
      
      If the action is "revise":
      - Fix any bugs or issues
      - Improve code quality, readability, and efficiency
      - Use modern best practices and idioms
      - Return only the revised code without explanations
      
      If the action is "explain":
      - Provide a clear, concise explanation of what the code does
      - Break down complex parts
      - Mention any potential issues or improvements
      - Format your explanation in markdown
      
      Format your response based on the action requested.`,
    };

    // Create user message with the code
    const userMessage = {
      role: "user",
      content: `${
        action === "revise" ? "Revise" : "Explain"
      } this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    };

    // Messages array with system and user messages
    const messages = [systemMessage, userMessage];

    let responseContent = "";

    // Determine which API to call based on model
    if (model.startsWith("gpt-")) {
      // Call OpenAI API
      console.log(`Using OpenAI model ${model} for code ${action}`);

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
            temperature: 0.3, // Lower temperature for more deterministic code output
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
      responseContent = data.choices[0].message.content;
    } else if (model.startsWith("gemini-")) {
      // Call Google's Gemini API
      const geminiModelName = "gemini-2.0-flash";
      console.log(`Using Gemini model ${geminiModelName} for code ${action}`);

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
              temperature: 0.3,
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
      console.log(`Using Claude model ${model} for code ${action}`);

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
            temperature: 0.3,
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

    // Extract code from response for revise action
    let finalResponse = responseContent;
    if (action === "revise") {
      // Try to extract code blocks from the response
      const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
      const match = responseContent.match(codeBlockRegex);
      if (match && match[1]) {
        finalResponse = match[1].trim();
      }
    }

    // Return the response
    return new Response(
      JSON.stringify({
        result: finalResponse,
        action: action,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in code API:", error);
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
